import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'
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

const PRESET_EVENTS = [
  'Se apaga la luz de repente',
  'Un extraño entra sin avisar',
  'Suena una alarma estridente',
  'Empieza una tormenta feroz',
  'Alguien grita en la distancia',
  'Un objeto cae y se rompe',
]

// ─── Message bubble ───────────────────────────────────────────────────────────

function RoomBubble({ msg, currentUserId, charColor, charName }) {
  const isMe = msg.user_id === currentUserId
  const isAI = msg.role === 'assistant'

  if (msg.type === 'event') {
    return (
      <div className="rchat-event-bubble">
        <span className="rchat-event-icon">⚡</span>
        <span className="rchat-event-text">{msg.content}</span>
        <span className="rchat-event-by">— {msg.username}</span>
      </div>
    )
  }

  if (msg.type === 'poll') {
    let pollData = null
    try { pollData = JSON.parse(msg.content) } catch { /* skip */ }
    if (pollData) {
      return (
        <div className="rchat-poll-snapshot">
          <span className="rchat-poll-snapshot__icon">📊</span>
          <span className="rchat-poll-snapshot__q">{pollData.question}</span>
          <div className="rchat-poll-snapshot__opts">
            {pollData.options.map(opt => (
              <span key={opt} className="rchat-poll-snapshot__opt">{opt}</span>
            ))}
          </div>
          <span className="rchat-poll-snapshot__by">Encuesta de {msg.username}</span>
        </div>
      )
    }
  }

  return (
    <div className={`rchat-bubble-row ${isMe ? 'rchat-bubble-row--me' : isAI ? 'rchat-bubble-row--ai' : 'rchat-bubble-row--other'}`}>
      {!isMe && (
        <span
          className="rchat-bubble-sender"
          style={{ color: isAI ? charColor : usernameColor(msg.username || 'Usuario') }}
        >
          {isAI ? (charName || msg.username || 'Personaje') : (msg.username || 'Usuario')}
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

// ─── Event Picker overlay ─────────────────────────────────────────────────────

function EventPicker({ onSelect, onClose }) {
  const [custom, setCustom] = useState('')

  function handlePreset(text) {
    onSelect(text)
    onClose()
  }

  function handleCustom(e) {
    e.preventDefault()
    if (!custom.trim()) return
    onSelect(custom.trim())
    onClose()
  }

  return (
    <div className="rchat-overlay" onClick={onClose}>
      <div className="rchat-event-picker" onClick={e => e.stopPropagation()}>
        <div className="rchat-event-picker__header">
          <span>⚡ Disparar evento dramático</span>
          <button className="rchat-event-picker__close" onClick={onClose}>✕</button>
        </div>
        <div className="rchat-event-picker__presets">
          {PRESET_EVENTS.map(ev => (
            <button key={ev} className="rchat-event-preset-btn" onClick={() => handlePreset(ev)}>
              {ev}
            </button>
          ))}
        </div>
        <form className="rchat-event-picker__custom" onSubmit={handleCustom}>
          <input
            className="rchat-input"
            placeholder="O escribí tu propio evento..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            maxLength={120}
            autoFocus
          />
          <button
            type="submit"
            className="rchat-send-btn"
            disabled={!custom.trim()}
            aria-label="Disparar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Poll Creator modal ───────────────────────────────────────────────────────

function PollCreator({ onCreate, onClose }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  function setOption(i, val) {
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o))
  }

  function addOption() {
    if (options.length < 4) setOptions(prev => [...prev, ''])
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validOpts = options.map(o => o.trim()).filter(Boolean)
    if (!question.trim() || validOpts.length < 2) return
    onCreate(question.trim(), validOpts)
    onClose()
  }

  return (
    <div className="rchat-overlay" onClick={onClose}>
      <div className="rchat-poll-creator" onClick={e => e.stopPropagation()}>
        <div className="rchat-poll-creator__header">
          <span>📊 Crear votación</span>
          <button className="rchat-event-picker__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="rchat-poll-creator__form">
          <input
            className="rchat-input"
            placeholder="Pregunta de la votación..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            maxLength={120}
            autoFocus
          />
          <div className="rchat-poll-creator__opts">
            {options.map((opt, i) => (
              <input
                key={i}
                className="rchat-input"
                placeholder={`Opción ${i + 1}...`}
                value={opt}
                onChange={e => setOption(i, e.target.value)}
                maxLength={60}
              />
            ))}
            {options.length < 4 && (
              <button type="button" className="rchat-poll-add-opt" onClick={addOption}>
                + Agregar opción
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary rchat-poll-creator__submit"
            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
          >
            Iniciar votación
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Active Poll card ─────────────────────────────────────────────────────────

function ActivePoll({ poll, myVote, onVote, onSendResult, isRoomCreator }) {
  const totalVotes = Object.keys(poll.votes).length

  function getCount(opt) {
    return Object.values(poll.votes).filter(v => v === opt).length
  }

  function getPct(opt) {
    if (!totalVotes) return 0
    return Math.round((getCount(opt) / totalVotes) * 100)
  }

  function getWinner() {
    if (!totalVotes) return null
    return poll.options.reduce((a, b) => getCount(a) >= getCount(b) ? a : b)
  }

  return (
    <div className="rchat-poll-active">
      <div className="rchat-poll-active__header">
        <span className="rchat-poll-active__icon">📊</span>
        <span className="rchat-poll-active__q">{poll.question}</span>
        <span className="rchat-poll-active__count">{totalVotes} voto{totalVotes !== 1 ? 's' : ''}</span>
      </div>
      <div className="rchat-poll-active__opts">
        {poll.options.map(opt => {
          const pct = getPct(opt)
          const voted = myVote === opt
          return (
            <button
              key={opt}
              className={`rchat-poll-option ${voted ? 'rchat-poll-option--voted' : ''} ${myVote && !voted ? 'rchat-poll-option--dim' : ''}`}
              onClick={() => onVote(opt)}
              disabled={!!myVote}
            >
              <span className="rchat-poll-option__label">{opt}</span>
              <div className="rchat-poll-option__bar-wrap">
                <div className="rchat-poll-option__bar" style={{ '--pct': `${pct}%` }} />
              </div>
              <span className="rchat-poll-option__pct">{pct}%</span>
            </button>
          )
        })}
      </div>
      {isRoomCreator && (
        <button className="rchat-poll-send-result" onClick={() => onSendResult(getWinner(), totalVotes)}>
          Enviar resultado al personaje
        </button>
      )}
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
  const [copied, setCopied] = useState(false)
  const [connStatus, setConnStatus] = useState('connected') // 'connected' | 'reconnecting'
  const [retryCount, setRetryCount] = useState(0)

  // Mecánicas grupales
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

    // Poll iniciado por otro usuario
    channel.on('broadcast', { event: 'poll_start' }, ({ payload }) => {
      setActivePoll({ ...payload, votes: {} })
      setMyVote(null)
      scrollToBottom()
    })

    // Voto emitido
    channel.on('broadcast', { event: 'vote_cast' }, ({ payload }) => {
      setActivePoll(prev => prev ? {
        ...prev,
        votes: { ...prev.votes, [payload.userId]: payload.option }
      } : prev)
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
  }, [loading, error, roomId, user, scrollToBottom, retryCount])

  // ── Scroll al cargar mensajes iniciales ───────────────────────────────────

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

  // ── Enviar mensaje ─────────────────────────────────────────────────────────

  function needsLogin() {
    setSendError('Tenés que iniciar sesión para participar en la sala.')
  }

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
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

  // ── Enviar evento ─────────────────────────────────────────────────────────

  async function handleSendEvent(eventText) {
    if (!session) { needsLogin(); return }
    setSendError('')
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
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

  // ── Crear poll ────────────────────────────────────────────────────────────

  async function handleCreatePoll(question, options) {
    if (!session) { needsLogin(); return }

    // Persistir poll como mensaje especial
    const content = JSON.stringify({ question, options })
    await fetch(`${API_URL}/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      // No dispara IA — solo persiste el registro
      body: JSON.stringify({ content, type: 'poll', participants: getParticipants() })
    })

    // Iniciar poll via broadcast
    const pollId = crypto.randomUUID()
    channelRef.current?.send({
      type: 'broadcast',
      event: 'poll_start',
      payload: { pollId, question, options }
    })

    // Activar localmente también
    setActivePoll({ pollId, question, options, votes: {} })
    setMyVote(null)
  }

  // ── Votar ─────────────────────────────────────────────────────────────────

  function handleVote(option) {
    if (myVote || !user) return
    setMyVote(option)
    setActivePoll(prev => prev ? {
      ...prev,
      votes: { ...prev.votes, [user.id]: option }
    } : prev)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'vote_cast',
      payload: { userId: user.id, option }
    })
  }

  // ── Enviar resultado al personaje ─────────────────────────────────────────

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
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
      style={{
        '--char-color': charColor,
        '--char-dim': character.themeColorDim,
        '--char-gradient': character.gradient
      }}
    >
      {/* Overlays */}
      {showEventPicker && (
        <EventPicker
          onSelect={handleSendEvent}
          onClose={() => setShowEventPicker(false)}
        />
      )}
      {showPollCreator && (
        <PollCreator
          onCreate={handleCreatePoll}
          onClose={() => setShowPollCreator(false)}
        />
      )}

      {/* Header */}
      <header className="rchat-header">
        <button className="rchat-header__back" onClick={() => navigate(ROUTES.SALAS)}>
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

        <button
          className={`rchat-share-btn${copied ? ' rchat-share-btn--copied' : ''}`}
          onClick={handleShare}
          title="Copiar link de la sala"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <span>{copied ? 'Copiado' : 'Compartir'}</span>
        </button>

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

      {/* Active Poll */}
      {activePoll && (
        <ActivePoll
          poll={activePoll}
          myVote={myVote}
          onVote={handleVote}
          onSendResult={handleSendPollResult}
          isRoomCreator={isRoomCreator}
        />
      )}

      {/* Reconnect banner */}
      {connStatus === 'reconnecting' && (
        <div className="rchat-reconnect-banner">
          <span className="rchat-reconnect-banner__dot" />
          Reconectando...
        </div>
      )}

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
            charName={character.name}
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
              Solo podés leer. Para participar,{' '}
              <button className="rchat-guest-bar__link" onClick={() => navigate(ROUTES.AUTH)}>
                registrate o iniciá sesión
              </button>
              .
            </p>
          </div>
        ) : (
          <form className="rchat-input-form" onSubmit={handleSend}>
            {sendError && (
              <p className="rchat-send-error">
                {sendError}{' '}
                {(sendError.includes('sesión') || sendError.includes('registr')) && (
                  <button className="rchat-send-error__link" onClick={() => navigate(ROUTES.AUTH)}>
                    Ir al login
                  </button>
                )}
              </p>
            )}
            <div className="rchat-input-row">
              <button
                type="button"
                className="rchat-action-btn"
                onClick={() => setShowEventPicker(true)}
                title="Disparar evento dramático"
                disabled={sending || isAiResponding}
              >
                ⚡
              </button>
              <button
                type="button"
                className="rchat-action-btn"
                onClick={() => setShowPollCreator(true)}
                title="Crear votación grupal"
                disabled={sending || isAiResponding}
              >
                📊
              </button>
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
