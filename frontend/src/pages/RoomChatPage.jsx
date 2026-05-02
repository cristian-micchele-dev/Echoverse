import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api.js'
import './RoomChatPage.css'
import RoomBubble from './roomchat/RoomBubble.jsx'
import StreamingBubble from './roomchat/StreamingBubble.jsx'
import EventPicker from './roomchat/EventPicker.jsx'
import PollCreator from './roomchat/PollCreator.jsx'
import ActivePoll from './roomchat/ActivePoll.jsx'
import RoomChatHeader from './roomchat/RoomChatHeader.jsx'
import RoomChatInputBar from './roomchat/RoomChatInputBar.jsx'

const charById = Object.fromEntries(characters.map(c => [c.id, c]))

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
  const [copied, setCopied] = useState(false)
  const [connStatus, setConnStatus] = useState('connected')
  const [retryCount, setRetryCount] = useState(0)

  const [showEventPicker, setShowEventPicker] = useState(false)
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [activePoll, setActivePoll] = useState(null)
  const [myVote, setMyVote] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const channelRef = useRef(null)

  const character = room ? charById[room.character_id] : null
  const charColor = character?.themeColor || 'var(--violet-500)'
  const isRoomCreator = room?.created_by === user?.id

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

    const channel = supabase.channel(`room-broadcast:${roomId}`)

    channel.on('broadcast', { event: 'ai_chunk' }, ({ payload }) => {
      setStreamingContent(prev => prev + (payload.content || ''))
      setIsAiResponding(true)
      scrollToBottom()
    })

    channel.on('broadcast', { event: 'ai_done' }, () => {
      setStreamingContent('')
      setIsAiResponding(false)
    })

    channel.on('broadcast', { event: 'poll_start' }, ({ payload }) => {
      setActivePoll({ ...payload, votes: {} })
      setMyVote(null)
      scrollToBottom()
    })

    channel.on('broadcast', { event: 'vote_cast' }, ({ payload }) => {
      setActivePoll(prev => prev ? {
        ...prev,
        votes: { ...prev.votes, [payload.userId]: payload.option }
      } : prev)
    })

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

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      setOnlineUsers(Object.values(state).flat())
    })

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        setConnStatus('connected')
      } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
        setConnStatus('reconnecting')
        setTimeout(() => {
          supabase.removeChannel(channel)
          setRetryCount(n => n + 1)
        }, 4000)
      }
    })
    channelRef.current = channel

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
  }, [loading, error, roomId, user, scrollToBottom, retryCount])

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom()
  }, [loading, messages.length, scrollToBottom])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getParticipants() {
    return onlineUsers.map(u => u.username).filter(Boolean)
  }

  function needsLogin() {
    setSendError('Tenés que iniciar sesión para participar en la sala.')
  }

  // ── Enviar mensaje ─────────────────────────────────────────────────────────

  async function handleSend(e) {
    e?.preventDefault()
    const content = input.trim()
    if (!content || sending) return
    if (!session) { needsLogin(); return }

    setSending(true)
    setSendError('')
    setInput('')

    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ content, type: 'message', participants: getParticipants() })
      })
      const data = await res.json()
      if (!res.ok) {
        const isAuthError = res.status === 401 || res.status === 403
        setSendError(isAuthError ? 'Tu sesión expiró. Iniciá sesión de nuevo.' : (data.error || 'Error al enviar'))
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

  // ── Enviar evento ──────────────────────────────────────────────────────────

  async function handleSendEvent(eventText) {
    if (!session) { needsLogin(); return }
    setSendError('')
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ content: eventText, type: 'event', participants: getParticipants() })
      })
      const data = await res.json()
      if (!res.ok) {
        const isAuthError = res.status === 401 || res.status === 403
        setSendError(isAuthError ? 'Tu sesión expiró. Iniciá sesión de nuevo.' : (data.error || 'Error al enviar evento'))
      } else {
        setIsAiResponding(true)
      }
    } catch {
      setSendError('Error de conexión')
    }
  }

  // ── Crear poll ─────────────────────────────────────────────────────────────

  async function handleCreatePoll(question, options) {
    if (!session) { needsLogin(); return }
    const content = JSON.stringify({ question, options })
    await fetch(`${API_URL}/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ content, type: 'poll', participants: getParticipants() })
    })
    const pollId = crypto.randomUUID()
    channelRef.current?.send({ type: 'broadcast', event: 'poll_start', payload: { pollId, question, options } })
    setActivePoll({ pollId, question, options, votes: {} })
    setMyVote(null)
  }

  // ── Votar ──────────────────────────────────────────────────────────────────

  function handleVote(option) {
    if (myVote || !user) return
    setMyVote(option)
    setActivePoll(prev => prev ? { ...prev, votes: { ...prev.votes, [user.id]: option } } : prev)
    channelRef.current?.send({ type: 'broadcast', event: 'vote_cast', payload: { userId: user.id, option } })
  }

  // ── Enviar resultado al personaje ──────────────────────────────────────────

  async function handleSendPollResult(winner, total) {
    if (!session || !activePoll) return
    const { question } = activePoll
    const summary = winner
      ? `📊 Resultado de la votación: "${question}" — "${winner}" ganó con ${total} voto${total !== 1 ? 's' : ''} en total.`
      : `📊 La votación "${question}" terminó sin votos.`
    setActivePoll(null)
    setMyVote(null)
    setSendError('')
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ content: summary, type: 'message', participants: getParticipants() })
      })
      const data = await res.json()
      if (!res.ok) setSendError(data.error || 'Error')
      else setIsAiResponding(true)
    } catch {
      setSendError('Error de conexión')
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
        <button className="btn-ghost" onClick={() => navigate(ROUTES.SALAS)}>Volver a salas</button>
      </div>
    )
  }

  const myUsername = user?.user_metadata?.username || user?.email?.split('@')[0]

  return (
    <div
      className="rchat-page"
      style={{ '--char-color': charColor, '--char-dim': character.themeColorDim, '--char-gradient': character.gradient }}
    >
      {showEventPicker && (
        <EventPicker onSelect={handleSendEvent} onClose={() => setShowEventPicker(false)} />
      )}
      {showPollCreator && (
        <PollCreator onCreate={handleCreatePoll} onClose={() => setShowPollCreator(false)} />
      )}

      <RoomChatHeader
        character={character}
        room={room}
        onlineUsers={onlineUsers}
        copied={copied}
        onBack={() => navigate(ROUTES.SALAS)}
        onShare={handleShare}
      />

      {activePoll && (
        <ActivePoll
          poll={activePoll}
          myVote={myVote}
          onVote={handleVote}
          onSendResult={handleSendPollResult}
          isRoomCreator={isRoomCreator}
        />
      )}

      {connStatus === 'reconnecting' && (
        <div className="rchat-reconnect-banner">
          <span className="rchat-reconnect-banner__dot" />
          Reconectando...
        </div>
      )}

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
            charName={character.name}
          />
        ))}

        {streamingContent && (
          <StreamingBubble content={streamingContent} charName={character.name} charColor={charColor} />
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

      <RoomChatInputBar
        inputRef={inputRef}
        user={user}
        input={input}
        onChange={e => setInput(e.target.value)}
        onSend={handleSend}
        sending={sending}
        isAiResponding={isAiResponding}
        sendError={sendError}
        characterName={character.name}
        myUsername={myUsername}
        onShowEventPicker={() => setShowEventPicker(true)}
        onShowPollCreator={() => setShowPollCreator(true)}
        navigate={navigate}
      />
    </div>
  )
}
