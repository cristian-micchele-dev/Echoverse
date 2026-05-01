import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { characters } from '../data/characters'
import { UI_THEMES } from '../data/uiThemes'
import MessageBubble from '../components/MessageBubble/MessageBubble'
import { saveSession } from '../utils/session'
import { chatHistoryKey, MAX_STORED_MESSAGES, ROUTES } from '../utils/constants'
import './ChatPage.css'
import { API_URL } from '../config/api.js'
import { getAffinityData, getAffinityLevel, getUserRankName, isRankSufficient } from '../utils/affinity'
import { useAuth } from '../context/AuthContext'
import { useAchievements } from '../hooks/useAchievements'
import { useStreaming } from '../hooks/useStreaming'
import { CHARACTER_STREAM_DELAYS } from '../data/characterConfig'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import ShareModal from '../components/ShareModal/ShareModal'
import VerdictBubble from '../components/VerdictBubble/VerdictBubble'
import { supabase } from '../lib/supabase'
import { playNotificationSound, detectReaction, formatDateSeparator, updateHistoryMeta } from './chat/utils.js'
import BgParticles from './chat/BgParticles.jsx'
import ChatHeader from './chat/ChatHeader.jsx'
import ChatEmpty from './chat/ChatEmpty.jsx'
import ChatInputArea from './chat/ChatInputArea.jsx'

export default function ChatPage() {
  const { characterId } = useParams()
  const navigate = useNavigate()
  const isCustom = characterId?.startsWith('custom-')
  const rawCustomId = isCustom ? characterId.replace('custom-', '') : null
  const [customCharData, setCustomCharData] = useState(null)
  const character = useMemo(() => {
    if (isCustom) {
      if (!customCharData) return null
      return {
        id: characterId,
        name: customCharData.name,
        image: customCharData.avatar_url || null,
        emoji: customCharData.emoji || '🤖',
        themeColor: '#7252E8',
        themeColorDim: '#7252E830',
        avatarBorderColor: customCharData.color || '#7252E8',
        gradient: 'linear-gradient(160deg, #050508 0%, #0d0d1a 100%)',
        universe: 'Personaje personalizado',
        welcomeMessage: customCharData.welcome_message || null,
        notificationTone: 'default',
        bgEffect: null,
        uiTheme: null,
        typingStyle: 'default',
        suggestedQuestions: [],
        description: '',
        systemPrompt: customCharData.system_prompt,
      }
    }
    return characters.find(c => c.id === characterId) ?? null
  }, [isCustom, customCharData, characterId])
  const { session } = useAuth()
  const { checkAndUnlock, newlyUnlocked, dismissToast } = useAchievements()
  const { isTyping, isLoading, streamChat } = useStreaming()

  const storageKey = chatHistoryKey(characterId)
  const userReactionsKey = `reactions-${characterId}`
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [headerImgError, setHeaderImgError] = useState(false)
  const [emptyImgError, setEmptyImgError] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [cloudSaved, setCloudSaved] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [isVerdictLoading, setIsVerdictLoading] = useState(false)
  const lastFailedInputRef = useRef('')
  const errorTimerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [flashEffect, setFlashEffect] = useState('')
  const [reactions, setReactions] = useState({})
  const [userReactions, setUserReactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(userReactionsKey) || '{}') } catch { return {} }
  })
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)
  const prevIsLoadingRef = useRef(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Cargar personaje custom desde Supabase
  useEffect(() => {
    if (!isCustom || !rawCustomId) return
    supabase
      .from('custom_characters')
      .select('*')
      .eq('id', rawCustomId)
      .single()
      .then(({ data }) => {
        if (data) setCustomCharData(data)
        else navigate(ROUTES.CHAT)
      })
  }, [isCustom, rawCustomId, navigate])

  // Cargar historial desde BD si el usuario está autenticado (solo chars oficiales)
  useEffect(() => {
    if (!session || !characterId || isCustom) return
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
  }, [session, characterId, isCustom])

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
    if (!character && !isCustom) navigate(ROUTES.HOME)
  }, [character, isCustom, navigate])

  useEffect(() => {
    if (!character || isCustom) return
    if (character.unlockRank && (!session || !isRankSufficient(getUserRankName(), character.unlockRank))) {
      navigate(ROUTES.CHAT)
    }
  }, [character, isCustom, session, navigate])

  useEffect(() => {
    if (messages.length === 0) return
    try {
      const toSave = messages.filter(m => !m.isVerdict).slice(-MAX_STORED_MESSAGES)
      localStorage.setItem(storageKey, JSON.stringify(toSave))
    } catch { /* localStorage unavailable */ }
  }, [messages, storageKey, isCustom])

  // Persistir reacciones del usuario en localStorage
  useEffect(() => {
    try { localStorage.setItem(userReactionsKey, JSON.stringify(userReactions)) } catch { /* localStorage unavailable */ }
  }, [userReactions, userReactionsKey])

  const handleUserReact = useCallback((msgIndex, emoji) => {
    setUserReactions(prev => {
      if (prev[msgIndex] === emoji) {
        const next = { ...prev }
        delete next[msgIndex]
        return next
      }
      return { ...prev, [msgIndex]: emoji }
    })
  }, [])

  // Sound + reactions + history on response complete
  useEffect(() => {
    if (prevIsLoadingRef.current && !isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant' && lastMsg.content && !lastMsg.isVerdict) {
        const CHAR_EFFECTS = {
          'hannibal':     'flash--disturbing',
          'joker':        'flash--chaos',
          'darth-vader':  'flash--dark-side',
          'walter-white': 'flash--chemical',
          'sherlock':     'flash--deduction',
        }
        const effect = CHAR_EFFECTS[characterId]
        if (effect) {
          setFlashEffect(effect)
          setTimeout(() => setFlashEffect(''), 1200)
        }
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
        if (session && !isCustom) {
          const toSave = messages.slice(-MAX_STORED_MESSAGES)
          fetch(`${API_URL}/db/chat-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ characterId, messages: toSave })
          }).then(() => {
            setCloudSaved(true)
            setTimeout(() => setCloudSaved(false), 2500)
          }).catch(() => {})
          fetch(`${API_URL}/db/affinity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ characterId, messageCount: messages.length })
          }).catch(() => {})
          checkAndUnlock({ totalMessages: messages.length })
        }
      }
    }
    prevIsLoadingRef.current = isLoading
  }, [isLoading, messages, character, characterId, session, checkAndUnlock, isCustom])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120
    if (!isAtBottom) return
    // Durante streaming usamos scroll instantáneo para evitar jank
    if (isLoading) {
      container.scrollTop = container.scrollHeight
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isLoading])

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

    const userMessage = { role: 'user', content: trimmed, ts: Date.now() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')

    try {
      const chatEndpoint = isCustom ? `${API_URL}/chat/custom` : `${API_URL}/chat`
      const chatPayload = isCustom
        ? { systemPrompt: character.systemPrompt, messages: updatedMessages }
        : { characterId, messages: updatedMessages, affinityLevel: getAffinityLevel(getAffinityData(characterId).messageCount) }
      const chatHeaders = isCustom && session
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}
      await streamChat(
        chatEndpoint,
        chatPayload,
        (content, isFirst) => {
          if (isFirst) {
            setMessages(prev => [...prev, { role: 'assistant', content, ts: Date.now() }])
          } else {
            setMessages(prev => {
              const copy = [...prev]
              copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + content }
              return copy
            })
          }
        },
        { headers: chatHeaders, delay: CHARACTER_STREAM_DELAYS[characterId] ?? 0 }
      )
    } catch (err) {
      let msg = 'Error al conectar con el servidor.'
      if (err?.name === 'AbortError') {
        msg = 'La respuesta tardó demasiado. Intentá de nuevo.'
      } else if (err?.status === 429 || String(err?.message).includes('429')) {
        msg = 'Demasiados mensajes seguidos. Esperá un momento.'
      } else if (!navigator.onLine) {
        msg = 'Sin conexión a internet.'
      }
      lastFailedInputRef.current = trimmed
      clearTimeout(errorTimerRef.current)
      setChatError(msg)
      errorTimerRef.current = setTimeout(() => setChatError(null), 5000)
    } finally {
      inputRef.current?.focus()
    }
  }, [input, isLoading, messages, characterId, streamChat, isCustom, character, session])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    if (!window.confirm('¿Borrar toda la conversación? Esta acción no se puede deshacer.')) return
    setMessages([])
    setReactions({})
    setUserReactions({})
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(userReactionsKey)
    } catch { /* localStorage unavailable */ }
    if (session && !isCustom) {
      fetch(`${API_URL}/db/chat-history/${characterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).catch(() => {})
    }
  }

  const handleVerdict = async () => {
    const realMessages = messages.filter(m => !m.isVerdict)
    if (realMessages.length < 10 || isVerdictLoading || isLoading) return
    setIsVerdictLoading(true)
    try {
      await streamChat(
        `${API_URL}/chat/verdict`,
        { characterId, messages: realMessages },
        (content, isFirst) => {
          if (isFirst) {
            setMessages(prev => [...prev, { role: 'assistant', content, ts: Date.now(), isVerdict: true }])
          } else {
            setMessages(prev => {
              const copy = [...prev]
              copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + content }
              return copy
            })
          }
        }
      )
    } catch {
      // silencioso
    } finally {
      setIsVerdictLoading(false)
    }
  }

  if (!character) return null  // cargando custom char o no existe

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
        '--char-avatar-border': character.avatarBorderColor || character.themeColor,
        ...themeVars,
      }}
    >
      {flashEffect && <div className={`chat-flash ${flashEffect}`} aria-hidden="true" />}
      <Helmet>
        <title>{character.name} — EchoVerse</title>
        <meta name="description" content={`Chateá con ${character.name} de ${character.universe}. ${character.description}`} />
        <link rel="canonical" href={`https://echoverse-jet.vercel.app/chat/${characterId}`} />
        <meta property="og:title" content={`${character.name} — EchoVerse`} />
        <meta property="og:description" content={`Chateá con ${character.name} de ${character.universe} usando IA.`} />
        {character.image && <meta property="og:image" content={`https://echoverse-jet.vercel.app${character.image}`} />}
      </Helmet>
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

      <ChatHeader
        character={character}
        characterId={characterId}
        isCustom={isCustom}
        isTyping={isTyping}
        cloudSaved={cloudSaved}
        messages={messages}
        headerImgError={headerImgError}
        onHeaderImgError={() => setHeaderImgError(true)}
        onBack={() => navigate(ROUTES.HOME)}
        onChangeChar={() => navigate(ROUTES.CHAT)}
        onShare={() => setShowShare(true)}
        onClear={clearChat}
      />

      <div
        className="messages-container"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 && !isTyping && (
          <ChatEmpty
            character={character}
            emptyImgError={emptyImgError}
            onEmptyImgError={() => setEmptyImgError(true)}
            onSelectQuestion={q => { setInput(q); inputRef.current?.focus() }}
          />
        )}

        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1]
          const showDateSep = msg.ts && (
            !prevMsg?.ts ||
            new Date(msg.ts).toDateString() !== new Date(prevMsg.ts).toDateString()
          )
          return (
            <div key={i}>
              {showDateSep && (
                <div className="date-separator">
                  <span>{formatDateSeparator(msg.ts)}</span>
                </div>
              )}
              {msg.isVerdict
                ? <VerdictBubble
                    character={character}
                    message={msg}
                    isStreaming={(isVerdictLoading || isLoading) && i === messages.length - 1}
                  />
                : <MessageBubble
                    message={msg}
                    character={character}
                    isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant'}
                    isGrouped={i > 0 && !showDateSep && messages[i - 1].role === msg.role}
                    reaction={reactions[i]}
                    userReaction={userReactions[i]}
                    onReact={(emoji) => handleUserReact(i, emoji)}
                  />
              }
            </div>
          )
        })}

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
              <span className="typing-label">Escribiendo...</span>
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

      {chatError && (
        <div className="chat-error-banner">
          <span className="chat-error-banner__msg">{chatError}</span>
          <div className="chat-error-banner__actions">
            <button
              className="chat-error-banner__retry"
              onClick={() => { setChatError(null); sendMessage(lastFailedInputRef.current) }}
            >
              Reintentar
            </button>
            <button className="chat-error-banner__close" onClick={() => setChatError(null)}>✕</button>
          </div>
        </div>
      )}

      {!isCustom && (
        messages.some(m => m.isVerdict) && !isVerdictLoading
          ? (
            <div className="next-modes">
              <p className="next-modes__title">¿Qué hacés ahora?</p>
              <div className="next-modes__cards">
                <button className="next-modes__card" onClick={() => navigate(ROUTES.DASHBOARD)}>
                  <span className="next-modes__card-name">Dashboard</span>
                  <span className="next-modes__card-desc">Explorá más modos</span>
                </button>
                <button className="next-modes__card" onClick={() => navigate(ROUTES.MODOS)}>
                  <span className="next-modes__card-name">Modos</span>
                  <span className="next-modes__card-desc">Elegí tu próximo desafío</span>
                </button>
              </div>
            </div>
          )
          : messages.filter(m => !m.isVerdict).length >= 10 && (
            <div className="verdict-prompt">
              <button
                className="verdict-prompt__btn"
                onClick={handleVerdict}
                disabled={isVerdictLoading || isLoading}
              >
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <ellipse cx="10" cy="10" rx="9" ry="5.5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="2.5" fill="currentColor"/>
                </svg>
                {isVerdictLoading ? 'Analizando…' : '¿Qué pensás de mí?'}
              </button>
            </div>
          )
      )}

      <ChatInputArea
        inputRef={inputRef}
        input={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onSend={() => sendMessage()}
        isLoading={isLoading}
        characterName={character.name}
      />

      {showShare && (
        <ShareModal
          character={character}
          messages={messages}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
