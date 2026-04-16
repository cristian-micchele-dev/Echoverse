import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { readSSEStream } from '../utils/sse'
import { addModeXP } from '../utils/affinity'
import { recordCompletion } from '../utils/recordCompletion'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import './EntrenamientoPage.css'

const MAX_TURNS = 5

export default function EntrenamientoPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)

  const [phase, setPhase] = useState('chars') // chars | intro | playing | final
  const [selectedChar, setSelectedChar] = useState(null)
  const [messages, setMessages] = useState([]) // { role, content }[]
  const [turn, setTurn] = useState(1)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [pendingUserReply, setPendingUserReply] = useState(false)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  useEffect(() => {
    if (pendingUserReply) inputRef.current?.focus()
  }, [pendingUserReply])

  useEffect(() => {
    if ((phase === 'final') && selectedChar && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'entrenamiento')
      addModeXP(selectedChar.id, 'entrenamiento')
    }
  }, [phase, selectedChar, session])

  const startSession = async (char) => {
    setSelectedChar(char)
    setMessages([])
    setTurn(1)
    setInput('')
    setStreaming(false)
    setPendingUserReply(false)
    recordedRef.current = false
    setPhase('playing')
    // Turno 1: el personaje abre la sesión
    await fetchCharacterTurn(char, [], 1, false)
  }

  const fetchCharacterTurn = async (char, currentMessages, currentTurn, isFinal) => {
    setStreaming(true)
    let fullResponse = ''
    const assistantMsg = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch(`${API_URL}/entrenamiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: char.id,
          messages: currentMessages,
          turn: currentTurn,
          isFinal
        })
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
        copy[copy.length - 1] = { role: 'assistant', content: 'Algo salió mal. Intentá de nuevo.' }
        return copy
      })
    } finally {
      setStreaming(false)
      if (isFinal) {
        setPhase('final')
      } else {
        setPendingUserReply(true)
      }
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    setPendingUserReply(false)

    const userMsg = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    const nextTurn = turn + 1
    setTurn(nextTurn)
    const isFinal = nextTurn >= MAX_TURNS

    await fetchCharacterTurn(selectedChar, updatedMessages, nextTurn, isFinal)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleRestart = () => {
    setPhase('chars')
    setSelectedChar(null)
    setMessages([])
    setTurn(1)
    setPendingUserReply(false)
    recordedRef.current = false
  }

  // ── Selector de personaje ──────────────────────────────────────────────────
  if (phase === 'chars') return (
    <div className="entr-page">
      <div className="entr-top-bar">
        <button className="entr-back-btn" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
      </div>
      <div className="entr-intro">
        <span className="entr-intro__eyebrow">🥋 Entrenamiento</span>
        <h1 className="entr-intro__title">Que te entrene<br />el mejor.</h1>
        <p className="entr-intro__sub">Cada personaje te enseña su habilidad más característica. 5 ejercicios progresivos. Al final, te juzga.</p>
      </div>
      <div className="entr-chars-grid">
        {characters.map((char, i) => (
          <button
            key={char.id}
            className="entr-char-card"
            style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient, '--card-delay': `${i * 0.03}s` }}
            onClick={() => startSession(char)}
          >
            <div className="entr-char-card__bg" style={{ background: char.gradient }}>
              {char.image && <img src={char.image} alt={char.name} className="entr-char-card__img" />}
            </div>
            <div className="entr-char-card__overlay" />
            <div className="entr-char-card__info">
              <span className="entr-char-card__universe">{char.universe}</span>
              <span className="entr-char-card__name">{char.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Sesión de entrenamiento ─────────────────────────────────────────────────
  const progressPct = Math.min(100, ((turn - 1) / MAX_TURNS) * 100)

  return (
    <div className="entr-page entr-page--session" style={{ '--char-color': selectedChar.themeColor }}>
      {/* Header */}
      <div className="entr-play-header">
        <button className="entr-abort-btn" onClick={handleRestart}>✕</button>
        <div className="entr-char-info">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="entr-char-avatar" />
            : <span>{selectedChar.emoji}</span>}
          <span className="entr-char-name">{selectedChar.name}</span>
        </div>
        <div className="entr-turn-label">
          {phase === 'final' ? 'Veredicto' : `Fase ${Math.min(turn, MAX_TURNS)} / ${MAX_TURNS}`}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="entr-progress-bar">
        <div className="entr-progress-fill" style={{ width: `${phase === 'final' ? 100 : progressPct}%` }} />
      </div>

      {/* Fondo */}
      {selectedChar.image && (
        <div className="entr-bg-char">
          <img src={selectedChar.image} alt="" />
        </div>
      )}

      {/* Mensajes */}
      <div className="entr-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`entr-msg entr-msg--${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="entr-msg__avatar">
                {selectedChar.image
                  ? <img src={selectedChar.image} alt={selectedChar.name} />
                  : <span>{selectedChar.emoji}</span>}
              </div>
            )}
            <div className="entr-msg__bubble">
              {msg.content}
              {i === messages.length - 1 && streaming && msg.role === 'assistant' && (
                <span className="entr-cursor">▋</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input / Acciones */}
      {phase !== 'final' && (
        <div className="entr-input-bar">
          {pendingUserReply && !streaming ? (
            <div className="entr-input-wrap">
              <textarea
                ref={inputRef}
                className="entr-input"
                placeholder="Tu respuesta..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                maxLength={500}
              />
              <button
                className="entr-send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ) : streaming ? (
            <div className="entr-typing-hint">
              <div className="entr-dots"><span /><span /><span /></div>
            </div>
          ) : null}
        </div>
      )}

      {/* Final: acciones */}
      {phase === 'final' && !streaming && (
        <div className="entr-final-actions">
          <button className="entr-final-btn entr-final-btn--primary" onClick={() => startSession(selectedChar)}>
            Repetir con {selectedChar.name}
          </button>
          <button className="entr-final-btn" onClick={handleRestart}>Otro entrenador</button>
          <button className="entr-final-btn" onClick={() => navigate('/')}>Inicio</button>
        </div>
      )}
    </div>
  )
}
