import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { readSSEStream } from '../utils/sse'
import { addModeXP } from '../utils/affinity'
import { recordCompletion } from '../utils/recordCompletion'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import './SpeedPage.css'

const DURATION = 60

export default function SpeedPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)

  const [phase, setPhase] = useState('chars') // chars | playing | result
  const [selectedChar, setSelectedChar] = useState(null)
  const [messages, setMessages] = useState([]) // { role: 'user'|'assistant', content: string }[]
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [timerActive, setTimerActive] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const bottomRef = useRef(null)

  // Timer
  useEffect(() => {
    if (!timerActive) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setPhase('result')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive])

  // Scroll al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  // Foco en input cuando comienza
  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus()
  }, [phase])

  // Record al llegar a result
  useEffect(() => {
    if (phase === 'result' && selectedChar && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'speed')
      addModeXP(selectedChar.id, 'speed')
    }
  }, [phase, selectedChar, session])

  const startSession = (char) => {
    setSelectedChar(char)
    setMessages([])
    setInput('')
    setTimeLeft(DURATION)
    setQuestionCount(0)
    setStreaming(false)
    recordedRef.current = false
    setPhase('playing')
    setTimerActive(true)
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming || phase !== 'playing') return
    setInput('')

    const userMsg = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setQuestionCount(q => q + 1)

    // Pausa el timer mientras la IA genera
    setTimerActive(false)
    setStreaming(true)

    let fullResponse = ''
    const assistantMsg = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch(`${API_URL}/speed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: selectedChar.id, messages: updatedMessages })
      })
      if (!res.ok) throw new Error(`${res.status}`)
      await readSSEStream(res, chunk => {
        fullResponse += chunk
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: fullResponse }
          return copy
        })
      })
    } catch {
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: '...' }
        return copy
      })
    } finally {
      setStreaming(false)
      // Retoma el timer — pero si ya se agotó, que no retome
      setTimeLeft(t => {
        if (t > 0) setTimerActive(true)
        return t
      })
      inputRef.current?.focus()
    }
  }, [input, streaming, phase, messages, selectedChar])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleRestart = () => {
    clearInterval(timerRef.current)
    setPhase('chars')
    setSelectedChar(null)
    setMessages([])
    setTimerActive(false)
    recordedRef.current = false
  }

  // ── Selector de personaje ──────────────────────────────────────────────────
  if (phase === 'chars') return (
    <div className="speed-page">
      <div className="speed-top-bar">
        <button className="speed-back-btn" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
      </div>
      <div className="speed-intro">
        <span className="speed-intro__eyebrow">⚡ Speed Round</span>
        <h1 className="speed-intro__title">60 segundos.<br />Todo lo que puedas.</h1>
        <p className="speed-intro__sub">Preguntá todo lo que quieras. El personaje responde en máximo 2 oraciones. El reloj corre.</p>
      </div>
      <div className="speed-chars-grid">
        {characters.map((char, i) => (
          <button
            key={char.id}
            className="speed-char-card"
            style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient, '--card-delay': `${i * 0.03}s` }}
            onClick={() => startSession(char)}
          >
            <div className="speed-char-card__bg" style={{ background: char.gradient }}>
              {char.image && <img src={char.image} alt={char.name} className="speed-char-card__img" />}
            </div>
            <div className="speed-char-card__overlay" />
            <div className="speed-char-card__info">
              <span className="speed-char-card__universe">{char.universe}</span>
              <span className="speed-char-card__name">{char.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Sesión activa ─────────────────────────────────────────────────────────
  if (phase === 'playing') {
    const pct = (timeLeft / DURATION) * 100
    const urgent = timeLeft <= 10

    return (
      <div className="speed-page speed-page--playing" style={{ '--char-color': selectedChar.themeColor }}>
        {/* Header */}
        <div className="speed-play-header">
          <button className="speed-abort-btn" onClick={() => { clearInterval(timerRef.current); setPhase('result') }}>
            Terminar
          </button>
          <div className="speed-char-info">
            {selectedChar.image
              ? <img src={selectedChar.image} alt={selectedChar.name} className="speed-char-avatar" />
              : <span className="speed-char-emoji">{selectedChar.emoji}</span>}
            <span className="speed-char-name">{selectedChar.name}</span>
          </div>
          <div className={`speed-counter-badge ${urgent ? 'speed-counter-badge--urgent' : ''}`}>
            {timeLeft}s
          </div>
        </div>

        {/* Barra de tiempo */}
        <div className="speed-timer-bar">
          <div
            className={`speed-timer-fill ${urgent ? 'speed-timer-fill--urgent' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Fondo del personaje */}
        {selectedChar.image && (
          <div className="speed-bg-char">
            <img src={selectedChar.image} alt="" />
          </div>
        )}

        {/* Mensajes */}
        <div className="speed-messages">
          {messages.length === 0 && (
            <p className="speed-messages__hint">¡Preguntá algo! El reloj ya corre.</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`speed-msg speed-msg--${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="speed-msg__avatar">
                  {selectedChar.image
                    ? <img src={selectedChar.image} alt={selectedChar.name} />
                    : <span>{selectedChar.emoji}</span>}
                </div>
              )}
              <div className="speed-msg__bubble">
                {msg.content}
                {i === messages.length - 1 && streaming && msg.role === 'assistant' && (
                  <span className="speed-cursor">▋</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="speed-input-bar">
          <div className="speed-q-count">{questionCount} preguntas</div>
          <div className="speed-input-wrap">
            <input
              ref={inputRef}
              className="speed-input"
              placeholder={streaming ? 'esperando respuesta...' : 'tu pregunta...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              maxLength={200}
            />
            <button
              className="speed-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Resultado ─────────────────────────────────────────────────────────────
  const exchanges = []
  for (let i = 0; i < messages.length - 1; i += 2) {
    if (messages[i]?.role === 'user' && messages[i + 1]?.role === 'assistant') {
      exchanges.push({ q: messages[i].content, a: messages[i + 1].content })
    }
  }

  return (
    <div className="speed-page speed-page--result" style={{ '--char-color': selectedChar.themeColor }}>
      <div className="speed-result">
        <div className="speed-result__char">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="speed-result__avatar" />
            : <span className="speed-result__emoji">{selectedChar.emoji}</span>}
        </div>
        <div className="speed-result__score">
          <span className="speed-result__num">{exchanges.length}</span>
          <span className="speed-result__label">preguntas en 60s</span>
        </div>

        {exchanges.length === 0 && (
          <p className="speed-result__empty">No llegaste a hacer ninguna pregunta.<br />¡La próxima va mejor!</p>
        )}

        {exchanges.length > 0 && (
          <div className="speed-result__exchanges">
            <p className="speed-result__exchanges-label">Las respuestas</p>
            {exchanges.map((ex, i) => (
              <div key={i} className="speed-exchange">
                <p className="speed-exchange__q">— {ex.q}</p>
                <p className="speed-exchange__a">{ex.a}</p>
              </div>
            ))}
          </div>
        )}

        <div className="speed-result__actions">
          <button className="speed-result-btn speed-result-btn--primary" onClick={() => startSession(selectedChar)}>
            Jugar de nuevo
          </button>
          <button className="speed-result-btn" onClick={handleRestart}>Otro personaje</button>
          <button className="speed-result-btn" onClick={() => navigate('/')}>Inicio</button>
        </div>
      </div>
    </div>
  )
}
