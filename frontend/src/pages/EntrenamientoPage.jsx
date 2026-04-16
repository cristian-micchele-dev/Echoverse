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

const PHASE_NAMES = [
  'Evaluación',
  'Calentamiento',
  'El Desafío',
  'Al Límite',
  'Veredicto',
]

export default function EntrenamientoPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)

  const [phase, setPhase] = useState('chars') // chars | intro | playing | final
  const [selectedChar, setSelectedChar] = useState(null)
  const [messages, setMessages] = useState([]) // mensajes previos al veredicto
  const [finalVerdict, setFinalVerdict] = useState('') // texto del veredicto (fase 5)
  const [turn, setTurn] = useState(1)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [pendingUserReply, setPendingUserReply] = useState(false)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming, finalVerdict])

  useEffect(() => {
    if (pendingUserReply && phase === 'playing') inputRef.current?.focus()
  }, [pendingUserReply, phase])

  useEffect(() => {
    if (phase === 'final' && selectedChar && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'entrenamiento')
      addModeXP(selectedChar.id, 'entrenamiento')
    }
  }, [phase, selectedChar, session])

  const selectChar = (char) => {
    setSelectedChar(char)
    setMessages([])
    setFinalVerdict('')
    setTurn(1)
    setInput('')
    setStreaming(false)
    setPendingUserReply(false)
    recordedRef.current = false
    setPhase('intro')
  }

  const beginSession = async () => {
    setPhase('playing')
    await fetchCharacterTurn(selectedChar, [], 1, false)
  }

  const fetchCharacterTurn = async (char, currentMessages, currentTurn, isFinal) => {
    setStreaming(true)
    let fullResponse = ''

    if (isFinal) {
      // Veredicto: no agregamos burbuja — lo guardamos en finalVerdict
      setFinalVerdict('')
      try {
        const res = await fetch(`${API_URL}/entrenamiento`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId: char.id, messages: currentMessages, turn: currentTurn, isFinal: true })
        })
        if (!res.ok) throw new Error(`${res.status}`)
        await readSSEStream(res, chunk => {
          fullResponse += chunk
          // Eliminar el marcador [FIN] del texto visible
          setFinalVerdict(fullResponse.replace(/\[FIN\]/g, '').trim())
        })
      } catch {
        setFinalVerdict('El entrenamiento ha terminado.')
      } finally {
        setStreaming(false)
        setPhase('final')
      }
    } else {
      // Fases 1-4: burbuja de assistant
      const assistantMsg = { role: 'assistant', content: '' }
      setMessages(prev => [...prev, assistantMsg])
      try {
        const res = await fetch(`${API_URL}/entrenamiento`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId: char.id, messages: currentMessages, turn: currentTurn, isFinal: false })
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
    setFinalVerdict('')
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
      <div className="entr-intro-header">
        <span className="entr-intro-header__eyebrow">🥋 Entrenamiento</span>
        <h1 className="entr-intro-header__title">Que te entrene<br />el mejor.</h1>
        <p className="entr-intro-header__sub">Cada personaje te enseña lo que mejor sabe. 5 fases. Al final, te juzga.</p>
      </div>
      <div className="entr-chars-grid">
        {characters.map((char, i) => (
          <button
            key={char.id}
            className="entr-char-card"
            style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient, '--card-delay': `${i * 0.03}s` }}
            onClick={() => selectChar(char)}
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

  // ── Pantalla de intro del entrenador ──────────────────────────────────────
  if (phase === 'intro') return (
    <div className="entr-page entr-page--intro" style={{ '--char-color': selectedChar.themeColor }}>
      {selectedChar.image && (
        <div className="entr-intro-bg">
          <img src={selectedChar.image} alt="" />
        </div>
      )}
      <div className="entr-intro-content">
        <button className="entr-back-btn entr-back-btn--overlay" onClick={handleRestart}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>

        <div className="entr-intro-card">
          <div className="entr-intro-avatar-wrap">
            {selectedChar.image
              ? <img src={selectedChar.image} alt={selectedChar.name} className="entr-intro-avatar" />
              : <span className="entr-intro-emoji">{selectedChar.emoji}</span>}
            <div className="entr-intro-avatar-ring" />
          </div>

          <div className="entr-intro-meta">
            <span className="entr-intro-meta__label">Tu entrenador</span>
            <h2 className="entr-intro-meta__name">{selectedChar.name}</h2>
            <p className="entr-intro-meta__specialty">
              {selectedChar.universe}
            </p>
          </div>

          <div className="entr-intro-divider" />

          <div className="entr-intro-phases">
            {PHASE_NAMES.map((name, i) => (
              <div key={i} className="entr-intro-phase">
                <span className="entr-intro-phase__num">{i + 1}</span>
                <span className="entr-intro-phase__name">{name}</span>
              </div>
            ))}
          </div>

          <button className="entr-begin-btn" onClick={beginSession}>
            Comenzar entrenamiento
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  // ── Sesión activa + veredicto ─────────────────────────────────────────────
  const currentPhaseIndex = Math.min(turn - 1, MAX_TURNS - 1)
  const currentPhaseName = phase === 'final' ? 'Veredicto' : PHASE_NAMES[currentPhaseIndex]

  return (
    <div className="entr-page entr-page--session" style={{ '--char-color': selectedChar.themeColor }}>
      {/* Header */}
      <div className="entr-play-header">
        <button className="entr-abort-btn" onClick={handleRestart} title="Salir">✕</button>
        <div className="entr-header-center">
          <div className="entr-char-info">
            {selectedChar.image
              ? <img src={selectedChar.image} alt={selectedChar.name} className="entr-char-avatar" />
              : <span>{selectedChar.emoji}</span>}
            <span className="entr-char-name">{selectedChar.name}</span>
          </div>
          <span className="entr-phase-name">{currentPhaseName}</span>
        </div>
        <div className="entr-turn-counter">
          {phase === 'final' ? '5/5' : `${turn}/${MAX_TURNS}`}
        </div>
      </div>

      {/* Step dots */}
      <div className="entr-step-dots">
        {PHASE_NAMES.map((name, i) => {
          const stepTurn = i + 1
          const isDone = phase === 'final' || stepTurn < turn
          const isActive = phase !== 'final' && stepTurn === turn
          return (
            <div key={i} className={`entr-step-dot ${isDone ? 'entr-step-dot--done' : ''} ${isActive ? 'entr-step-dot--active' : ''}`}>
              <div className="entr-step-dot__circle">
                {isDone
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <span>{stepTurn}</span>
                }
              </div>
              <span className="entr-step-dot__label">{name}</span>
            </div>
          )
        })}
      </div>

      {/* Fondo */}
      {selectedChar.image && (
        <div className="entr-bg-char">
          <img src={selectedChar.image} alt="" />
        </div>
      )}

      {/* Mensajes (fases 1-4) */}
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
              {i === messages.length - 1 && streaming && !finalVerdict && msg.role === 'assistant' && (
                <span className="entr-cursor">▋</span>
              )}
            </div>
          </div>
        ))}

        {/* Veredicto final especial */}
        {(phase === 'final' || (streaming && turn >= MAX_TURNS)) && (
          <div className="entr-verdict">
            <div className="entr-verdict__header">
              {selectedChar.image
                ? <img src={selectedChar.image} alt={selectedChar.name} className="entr-verdict__avatar" />
                : <span className="entr-verdict__emoji">{selectedChar.emoji}</span>}
              <div className="entr-verdict__meta">
                <span className="entr-verdict__label">Veredicto final</span>
                <span className="entr-verdict__name">{selectedChar.name}</span>
              </div>
            </div>
            <div className="entr-verdict__divider" />
            <p className="entr-verdict__text">
              {finalVerdict || ''}
              {streaming && <span className="entr-cursor">▋</span>}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input — solo en fases 1-4 */}
      {phase === 'playing' && (
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

      {/* Acciones finales */}
      {phase === 'final' && !streaming && (
        <div className="entr-final-actions">
          <button className="entr-final-btn entr-final-btn--primary" onClick={() => { setPhase('intro') }}>
            Repetir con {selectedChar.name}
          </button>
          <button className="entr-final-btn" onClick={handleRestart}>Otro entrenador</button>
          <button className="entr-final-btn" onClick={() => navigate('/')}>Inicio</button>
        </div>
      )}
    </div>
  )
}
