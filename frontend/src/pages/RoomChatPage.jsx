import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api.js'
import './RoomChatPage.css'

const charById = Object.fromEntries(characters.map(c => [c.id, c]))

// Hash determinístico para colorear usernames
function usernameColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#7B9B4A','#4A9B7B','#9B4A7B','#4A7B9B','#9B7B4A','#C9954A','#6D4AFF','#4AFFB0']
  return colors[Math.abs(hash) % colors.length]
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function RoomBubble({ msg, currentUserId, charColor }) {
  const isMe = msg.user_id === currentUserId
  const isAI = msg.role === 'assistant'

  return (
    <div className={`rchat-bubble-row ${isMe ? 'rchat-bubble-row--me' : isAI ? 'rchat-bubble-row--ai' : 'rchat-bubble-row--other'}`}>
      {!isMe && (
        <span
          className="rchat-bubble-sender"
          style={{ color: isAI ? charColor : usernameColor(msg.username || 'Usuario') }}
        >
          {msg.username || 'Usuario'}
        </span>
      )}
      <div
        className={`rchat-bubble ${isMe ? 'rchat-bubble--me' : isAI ? 'rchat-bubble--ai' : 'rchat-bubble--other'}`}
        style={isMe ? { '--bubble-color': charColor } : {}}
      >
        {msg.content}
      </div>
    </div>
  )
}

// ─── Streaming bubble (AI en progreso) ───────────────────────────────────────

function StreamingBubble({ content, charName, charColor }) {
  return (
    <div className="rchat-bubble-row rchat-bubble-row--ai">
      <span className="rchat-bubble-sender" style={{ color: charColor }}>{charName}</span>
      <div className="rchat-bubble rchat-bubble--ai rchat-bubble--streaming">
        {content}
        <span className="rchat-cursor" aria-hidden="true" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoomChatPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, session } = useAuth()

  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isAiResponding, setIsAiResponding] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const channelRef = useRef(null)

  const character = room ? charById[room.character_id] : null
  const charColor = character?.themeColor || 'var(--violet-500)'

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
  }, [])

  // ── Cargar sala + mensajes iniciales ───────────────────────────────────────

  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await fetch(`${API_URL}/rooms/${roomId}`)
        if (!res.ok) throw new Error('Sala no encontrada')
        const { room: r, messages: msgs } = await res.json()
        setRoom(r)
        setMessages(msgs)
        setIsAiResponding(r.is_ai_responding)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadRoom()
  }, [roomId])

  // ── Supabase Realtime ──────────────────────────────────────────────────────

  useEffect(() => {
    if (loading || error) return

    const channelName = `room-broadcast:${roomId}`
    const channel = supabase.channel(channelName)

    // Chunks de IA en tiempo real (broadcast)
    channel.on('broadcast', { event: 'ai_chunk' }, ({ payload }) => {
      setStreamingContent(prev => prev + (payload.content || ''))
      setIsAiResponding(true)
      scrollToBottom()
    })

    // IA terminó (broadcast)
    channel.on('broadcast', { event: 'ai_done' }, () => {
      setStreamingContent('')
      setIsAiResponding(false)
    })

    // Nuevos mensajes persistidos (postgres_changes)
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
      ({ new: msg }) => {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        if (msg.role === 'assistant') {
          setStreamingContent('')
          setIsAiResponding(false)
        }
        scrollToBottom()
      }
    )

    // Presencia — usuarios online
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = Object.values(state).flat()
      setOnlineUsers(users)
    })

    channel.subscribe()
    channelRef.current = channel

    // Trackear presencia del usuario actual
    if (user) {
      channel.track({
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario',
        userId: user.id
      })
    }

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [loading, error, roomId, user, scrollToBottom])

  // ── Scroll al cargar mensajes iniciales ───────────────────────────────────

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom()
  }, [loading, messages.length, scrollToBottom])

  // ── Enviar mensaje ─────────────────────────────────────────────────────────

  async function handleSend(e) {
    e?.preventDefault()
    const content = input.trim()
    if (!content || sending || !session) return

    setSending(true)
    setSendError('')
    setInput('')

    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ content })
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error || 'Error al enviar')
        setInput(content)
      } else {
        setIsAiResponding(true)
      }
    } catch {
      setSendError('Error de conexión')
      setInput(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rchat-loading">
        <div className="rchat-loading__spinner" />
        <p>Cargando sala...</p>
      </div>
    )
  }

  if (error || !room || !character) {
    return (
      <div className="rchat-error">
        <p>{error || 'Sala no encontrada'}</p>
        <button className="btn-ghost" onClick={() => navigate('/salas')}>Volver a salas</button>
      </div>
    )
  }

  const myUsername = user?.user_metadata?.username || user?.email?.split('@')[0]

  return (
    <div
      className="rchat-page"
      style={{
        '--char-color': charColor,
        '--char-dim': character.themeColorDim,
        '--char-gradient': character.gradient
      }}
    >
      {/* Header */}
      <header className="rchat-header">
        <button className="rchat-header__back" onClick={() => navigate('/salas')}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Salas
        </button>

        <div className="rchat-header__char">
          <img src={character.image} alt={character.name} className="rchat-header__char-img" />
          <div className="rchat-header__char-info">
            <span className="rchat-header__char-name">{character.name}</span>
            {room.name && <span className="rchat-header__room-name">"{room.name}"</span>}
          </div>
        </div>

        {onlineUsers.length > 0 && (
          <div className="rchat-header__presence">
            {onlineUsers.slice(0, 4).map((u, i) => (
              <span
                key={i}
                className="rchat-presence-dot"
                title={u.username}
                style={{ '--dot-color': usernameColor(u.username || 'x') }}
              />
            ))}
            {onlineUsers.length > 4 && (
              <span className="rchat-presence-more">+{onlineUsers.length - 4}</span>
            )}
            <span className="rchat-presence-count">{onlineUsers.length} online</span>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="rchat-messages">
        {messages.length === 0 && !isAiResponding && (
          <div className="rchat-empty">
            <img src={character.image} alt={character.name} className="rchat-empty__img" />
            <p className="rchat-empty__name">{character.name}</p>
            <p className="rchat-empty__hint">
              {user ? 'Sé el primero en escribir algo.' : 'Iniciá sesión para participar.'}
            </p>
          </div>
        )}

        {messages.map(msg => (
          <RoomBubble
            key={msg.id}
            msg={msg}
            currentUserId={user?.id}
            charColor={charColor}
          />
        ))}

        {streamingContent && (
          <StreamingBubble
            content={streamingContent}
            charName={character.name}
            charColor={charColor}
          />
        )}

        {isAiResponding && !streamingContent && (
          <div className="rchat-bubble-row rchat-bubble-row--ai">
            <span className="rchat-bubble-sender" style={{ color: charColor }}>{character.name}</span>
            <div className="rchat-bubble rchat-bubble--ai rchat-typing-bubble">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="rchat-input-bar">
        {!user ? (
          <div className="rchat-guest-bar">
            <p className="rchat-guest-bar__text">
              <button className="rchat-guest-bar__link" onClick={() => navigate('/auth')}>
                Iniciá sesión
              </button>
              {' '}para participar en la sala
            </p>
          </div>
        ) : (
          <form className="rchat-input-form" onSubmit={handleSend}>
            {sendError && <p className="rchat-send-error">{sendError}</p>}
            <div className="rchat-input-row">
              <input
                ref={inputRef}
                className="rchat-input"
                placeholder={`Escribile a ${character.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending}
                maxLength={500}
                autoComplete="off"
              />
              <button
                type="submit"
                className="rchat-send-btn"
                disabled={!input.trim() || sending}
                aria-label="Enviar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {myUsername && (
              <p className="rchat-typing-as">
                Chateando como <strong>{myUsername}</strong>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
