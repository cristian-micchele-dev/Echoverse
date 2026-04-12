import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { UI_THEMES } from '../data/uiThemes'
import MessageBubble from '../components/MessageBubble/MessageBubble'
import { readSSEStream } from '../utils/sse'
import { saveSession } from '../utils/session'
import './ChatPage.css'
import { API_URL } from '../config/api.js'
import { getAffinityData, getAffinityLevel, getAffinityLabel, getAffinityEmoji } from '../utils/affinity'
import { useAuth } from '../context/AuthContext'
import { useAchievements } from '../hooks/useAchievements'
import AchievementToast from '../components/AchievementToast/AchievementToast'
const MAX_STORED_MESSAGES = 50

function playNotificationSound(tone) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    switch (tone) {
      case 'dark':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(160, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35)
        break
      case 'mystical':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(528, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2)
        osc.frequency.exponentialRampToValueAtTime(528, ctx.currentTime + 0.4)
        break
      case 'glitch':
        osc.type = 'square'
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.05)
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.15)
        break
      case 'viking':
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.25)
        break
      default:
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.15)
    }

    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.45)
  } catch {}
}

export function detectReaction(content) {
  const t = content.toLowerCase()
  if (/gracias|te quiero|amor|hermoso|brillante|perfecto/.test(t)) return '❤️'
  if (/jajaj|gracioso|divertid|risas|humor/.test(t)) return '😄'
  if (/peligro|cuidado|guerra|batalla|pelea|muerte|destruir/.test(t)) return '⚔️'
  if (/magia|hechizo|fuerza|poder|misterio|destino/.test(t)) return '✨'
  if (/imposible|increíble|asombroso|impresionante/.test(t)) return '🤯'
  if (/triste|sol[ao]|llorar|dolor|sufrimiento/.test(t)) return '💫'
  if (/rum|cerveza|festejo|beber|brindis/.test(t)) return '🍺'
  return null
}

function updateHistoryMeta(characterId, messageCount) {
  try {
    const meta = JSON.parse(localStorage.getItem('chat-history-meta') || '{}')
    meta[characterId] = { messageCount, lastChat: Date.now() }
    localStorage.setItem('chat-history-meta', JSON.stringify(meta))
  } catch {}
}


function BgParticles({ effect }) {
  if (!effect || effect === 'none') return null
  const counts = { stars: 22, rain: 16, particles: 14, embers: 12, lightning: 5, sparks: 14, smoke: 10, snow: 18 }
  const count = counts[effect] || 0
  return (
    <div className={`chat-bg-effect chat-bg-effect--${effect}`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="bg-particle" style={{ '--i': i }} />
      ))}
    </div>
  )
}

export default function ChatPage() {
  const { characterId } = useParams()
  const navigate = useNavigate()
  const character = characters.find(c => c.id === characterId)
  const { session } = useAuth()
  const { checkAndUnlock, newlyUnlocked, dismissToast } = useAchievements()

  const storageKey = `chat-${characterId}`

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [headerImgError, setHeaderImgError] = useState(false)
  const [emptyImgError, setEmptyImgError] = useState(false)
  const [visible, setVisible] = useState(false)
  const [reactions, setReactions] = useState({})
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)
  const prevIsLoadingRef = useRef(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Cargar historial desde BD si el usuario está autenticado
  useEffect(() => {
    if (!session || !characterId) return
    fetch(`${API_URL}/db/chat-history/${characterId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(r => r.json())
      .then(dbMessages => {
        if (Array.isArray(dbMessages) && dbMessages.length > 0) {
          setMessages(dbMessages)
        }
      })
      .catch(() => {})
  }, [session, characterId])

  // Aplicar tema al :root y restaurar al salir
  useEffect(() => {
    if (!character) return
    const theme = UI_THEMES[character.uiTheme] || {}
    const root = document.documentElement
    Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v))
    return () => {
      Object.keys(theme).forEach(k => root.style.removeProperty(k))
    }
  }, [character])

  useEffect(() => {
    if (!character) navigate('/')
  }, [character, navigate])

  useEffect(() => {
    if (messages.length === 0) return
    try {
      const toSave = messages.slice(-MAX_STORED_MESSAGES)
      localStorage.setItem(storageKey, JSON.stringify(toSave))
    } catch {}
  }, [messages, storageKey])

  // Sound + reactions + history on response complete
  useEffect(() => {
    if (prevIsLoadingRef.current && !isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant' && lastMsg.content) {
        const reaction = detectReaction(lastMsg.content)
        if (reaction) {
          setReactions(prev => ({ ...prev, [messages.length - 1]: reaction }))
        }
        playNotificationSound(character?.notificationTone || 'default')
        updateHistoryMeta(characterId, messages.length)
        saveSession({
          characterId,
          characterName: character?.name || '',
          modeLabel: 'Chat 1 a 1',
          route: `/chat/${characterId}`,
          lastMessage: lastMsg.content?.slice(0, 120) || '',
        })
        if (session) {
          const toSave = messages.slice(-MAX_STORED_MESSAGES)
          fetch(`${API_URL}/db/chat-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ characterId, messages: toSave })
          }).catch(() => {})
          fetch(`${API_URL}/db/affinity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ characterId, messageCount: messages.length })
          }).then(() => {
            checkAndUnlock({ totalMessages: messages.length })
          }).catch(() => {})
        }
      }
    }
    prevIsLoadingRef.current = isLoading
  }, [isLoading, messages, character, characterId, session, checkAndUnlock])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120
    if (isAtBottom || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [input])

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    setShowScrollBtn(distanceFromBottom > 120)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = useCallback(async (text = input) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, messages: updatedMessages, affinityLevel: getAffinityLevel(getAffinityData(characterId).messageCount) })
      })

      let firstChunk = true
      await readSSEStream(response, content => {
        if (firstChunk) {
          setIsTyping(false)
          setMessages(prev => [...prev, { role: 'assistant', content }])
          firstChunk = false
        } else {
          setMessages(prev => {
            const copy = [...prev]
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + content }
            return copy
          })
        }
      })
    } catch {
      setIsTyping(false)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el servidor.' }])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }, [input, isLoading, messages, characterId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setReactions({})
    try { localStorage.removeItem(storageKey) } catch {}
    if (session) {
      fetch(`${API_URL}/db/chat-history/${characterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).catch(() => {})
    }
  }

  if (!character) return null

  const typingClass = character.typingStyle && character.typingStyle !== 'default'
    ? `typing--${character.typingStyle}`
    : ''

  const themeVars = UI_THEMES[character.uiTheme] || {}

  return (
    <div
      className={`chat-page ${visible ? 'chat-page--visible' : ''}`}
      style={{
        '--char-color': character.themeColor,
        '--char-dim': character.themeColorDim,
        '--char-gradient': character.gradient,
        ...themeVars,
      }}
    >
      {newlyUnlocked.length > 0 && (
        <AchievementToast
          achievement={newlyUnlocked[0]}
          onDismiss={() => dismissToast(newlyUnlocked[0].id)}
        />
      )}
      {character.image && (
        <div className="chat-wallpaper" style={{ backgroundImage: `url(${character.image})` }} />
      )}
      <div className="chat-page__ambient" />
      <BgParticles effect={character.bgEffect} />

      <header className="chat-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>

        <div className="chat-header__character">
          <div className={`chat-header__avatar ${isTyping ? 'chat-header__avatar--typing' : ''}`}>
            {character.image && !headerImgError
              ? <img src={character.image} alt={character.name} onError={() => setHeaderImgError(true)} />
              : <span>{character.emoji}</span>
            }
          </div>
          <div>
            <h2 className="chat-header__name">{character.name}</h2>
            <span className="chat-header__universe">{character.universe}</span>
            {(() => {
              const level = getAffinityLevel(getAffinityData(characterId).messageCount)
              return level >= 1 ? (
                <span className="chat-header__affinity">
                  {getAffinityEmoji(level)} {getAffinityLabel(level)}
                </span>
              ) : null
            })()}
          </div>
        </div>

        <div className="chat-header__actions">
          <div className="chat-header__status">
            <span className="status-dot" />
            <span>{isTyping ? 'Escribiendo...' : 'En línea'}</span>
          </div>
          {messages.length > 0 && (
            <button className="clear-btn" onClick={clearChat} title="Nueva conversación">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M1.5 7.5a6 6 0 1 0 6-6 6 6 0 0 0-4.24 1.76M1.5 1.5v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </header>

      <div
        className="messages-container"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 && !isTyping && (
          <div className="empty-chat">
            <div className="empty-chat__avatar">
              {character.image && !emptyImgError
                ? <img src={character.image} alt={character.name} onError={() => setEmptyImgError(true)} />
                : <span>{character.emoji}</span>
              }
            </div>
            <p className="empty-chat__name">{character.name}</p>
            {character.welcomeMessage && (
              <div className="empty-chat__welcome">
                <p>{character.welcomeMessage}</p>
              </div>
            )}
            {character.suggestedQuestions?.length > 0 && (
              <div className="suggested-questions">
                {character.suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="suggested-q"
                    onClick={() => { setInput(q); inputRef.current?.focus() }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            character={character}
            isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant'}
            isGrouped={i > 0 && messages[i - 1].role === msg.role}
            reaction={reactions[i]}
          />
        ))}

        {isTyping && (
          <div className="bubble-row bubble-row--char">
            <div className="bubble-avatar bubble-avatar--pulse">
              {character.image
                ? <img src={character.image} alt={character.name} />
                : <span>{character.emoji}</span>
              }
            </div>
            <div className={`bubble bubble--char bubble--typing ${typingClass}`}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && (
        <button className="scroll-down-btn" onClick={scrollToBottom} title="Ir al final">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className="input-area">
        <textarea
          ref={inputRef}
          className="message-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Escribile a ${character.name}...`}
          rows={1}
          disabled={isLoading}
        />
        <button
          className="send-btn"
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          aria-label="Enviar mensaje"
        >
          {isLoading
            ? <span className="send-btn__loading" />
            : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9h14M9.5 3L16 9l-6.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )
          }
        </button>
      </div>
    </div>
  )
}
