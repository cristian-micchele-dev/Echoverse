import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { useStreaming } from '../hooks/useStreaming'
import { ROUTES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import { parseQuestion } from '../utils/aiResponseParser'
import { addModeXP } from '../utils/affinity'
import { useLevelUpToast } from '../hooks/useLevelUpToast'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import './ConfesionarioPage.css'
import { API_URL } from '../config/api.js'
const MAX_QUESTIONS = 5


export default function ConfesionarioPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)
  const [phase, setPhase] = useState('chars')
  const [selectedChar, setSelectedChar] = useState(null)
  const [exchanges, setExchanges] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [verdict, setVerdict] = useState('')
  const { isLoading: streaming, streamChat } = useStreaming()
  const [fetchError, setFetchError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const bottomRef = useRef(null)
  const { levelUpToast, dismissLevelUp, notifyLevelUp } = useLevelUpToast()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentQuestion, exchanges, verdict])

  useEffect(() => {
    if (phase === 'verdict' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'confesionario')
      if (selectedChar) {
        const result = addModeXP(selectedChar.id, 'confesionario')
        notifyLevelUp(result, selectedChar.name)
      }
    }
  }, [phase, session, selectedChar, notifyLevelUp])

  const startConfesionario = async (char) => {
    setSelectedChar(char)
    setPhase('playing')
    setFetchError(null)

    const trigger = [{ role: 'user', content: 'Comenzá la sesión. Presentate con una frase en tu estilo y hacé tu primera pregunta con las 4 opciones.' }]
    try {
      let full = ''
      await streamChat(
        `${API_URL}/chat`,
        { characterId: char.id, messages: trigger, confesionarioMode: true },
        chunk => { full += chunk; setCurrentQuestion(full) }
      )
    } catch (err) {
      setFetchError(err.status === 429 || err.message?.includes('Rate limit')
        ? 'Límite de la API alcanzado. Esperá unos minutos y reintentá.'
        : 'Error al conectar con la IA. Reintentá.')
    }
  }

  const handleAnswer = async (answerText) => {
    if (streaming) return
    setSelectedOption(answerText)

    const { narrative } = parseQuestion(currentQuestion)
    const questionNumber = exchanges.length + 1
    const isLast = questionNumber >= MAX_QUESTIONS

    const newExchanges = [...exchanges, { question: narrative, answer: answerText }]
    setExchanges(newExchanges)
    setCurrentQuestion('')
    setSelectedOption(null)
    setFetchError(null)

    try {
      let full = ''
      if (isLast) {
        setPhase('verdict')
        await streamChat(
          `${API_URL}/confesionario/verdict`,
          { characterId: selectedChar.id, exchanges: newExchanges },
          chunk => { full += chunk; setVerdict(full) }
        )
      } else {
        const messages = [
          { role: 'user', content: 'Comenzá la sesión. Presentate brevemente y hacé tu primera pregunta con las 4 opciones.' },
          ...newExchanges.flatMap(e => [
            { role: 'assistant', content: e.question },
            { role: 'user', content: e.answer }
          ])
        ]
        await streamChat(
          `${API_URL}/chat`,
          { characterId: selectedChar.id, messages, confesionarioMode: true },
          chunk => { full += chunk; setCurrentQuestion(full) }
        )
      }
    } catch (err) {
      setFetchError(err.status === 429 || err.message?.includes('Rate limit')
        ? 'Límite de la API alcanzado. Esperá unos minutos y reintentá.'
        : 'Error al conectar con la IA. Reintentá.')
    }
  }

  const handleRestart = () => {
    setPhase('chars')
    setSelectedChar(null)
    setExchanges([])
    setCurrentQuestion('')
    setVerdict('')
    setFetchError(null)
    setCopied(false)
    setSelectedOption(null)
  }

  const handleShare = async () => {
    const text = `✦ Veredicto de ${selectedChar.name} sobre mí ✦\n\n${verdict}\n\n— EchoVerse`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const handleRetry = () => {
    setFetchError(null)
    if (exchanges.length === 0) startConfesionario(selectedChar)
  }

  /* ── Selección de personaje ──────────────────────── */
  if (phase === 'chars') {
    return (
      <div className="conf-page">
        <div className="conf-top-bar">
          <button className="conf-back-btn" onClick={() => navigate(ROUTES.HOME)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
        </div>
        <div className="conf-intro">
          <span className="conf-intro__eyebrow">✦ Modo Confesionario ✦</span>
          <h1 className="conf-intro__title">Sé Analizado</h1>
          <p className="conf-intro__sub">Elegí un personaje. Te va a hacer {MAX_QUESTIONS} preguntas con opciones y al final dará su veredicto sobre quién sos realmente.</p>
        </div>
        <div className="conf-chars-grid">
          {characters.map((char, i) => (
            <button
              key={char.id}
              className="conf-char-card"
              style={{
                '--char-color': char.themeColor,
                '--char-gradient': char.gradient,
                '--card-delay': `${i * 0.03}s`
              }}
              onClick={() => startConfesionario(char)}
            >
              <div className="conf-char-card__bg" style={{ background: char.gradient }}>
                {char.image && <img src={char.image} alt={char.name} className="conf-char-card__img" />}
              </div>
              <div className="conf-char-card__overlay" />
              <div className="conf-char-card__info">
                <span className="conf-char-card__universe">{char.universe}</span>
                <span className="conf-char-card__name">{char.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const questionNumber = Math.min(exchanges.length + 1, MAX_QUESTIONS)
  const isVerdict = phase === 'verdict'
  const parsed = parseQuestion(currentQuestion)
  const hasOptions = !streaming && parsed.options.length >= 2
  if (!streaming && currentQuestion) console.log('[CONF] parsed:', parsed)

  /* ── Jugando / Veredicto ─────────────────────────── */
  return (
    <div
      className={`conf-page conf-page--playing ${isVerdict ? 'conf-page--verdict' : ''}`}
      style={{ '--char-color': selectedChar.themeColor, '--char-dim': selectedChar.themeColorDim }}
    >
      {/* Header */}
      <div className="conf-header">
        <button className="conf-back-btn" onClick={handleRestart}>✕ Salir</button>
        <div className="conf-header__identity">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="conf-header__avatar" />
            : <span className="conf-header__emoji">{selectedChar.emoji}</span>
          }
          <span className="conf-header__name">{selectedChar.name}</span>
        </div>
        {!isVerdict && (
          <div className="conf-progress">
            {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
              <span
                key={i}
                className={`conf-progress__dot ${
                  i < exchanges.length ? 'conf-progress__dot--done' :
                  i === exchanges.length ? 'conf-progress__dot--active' : ''
                }`}
              />
            ))}
            <span className="conf-progress__label">{questionNumber} / {MAX_QUESTIONS}</span>
          </div>
        )}
        {isVerdict && <span className="conf-verdict-badge-sm">Veredicto</span>}
      </div>

      {/* Contenido */}
      <div className="conf-content">

        {/* Intercambios anteriores */}
        {exchanges.map((ex, i) => (
          <div key={i} className="conf-exchange">
            <div className="conf-exchange__q">
              <div className="conf-exchange__avatar">
                {selectedChar.image
                  ? <img src={selectedChar.image} alt={selectedChar.name} />
                  : <span>{selectedChar.emoji}</span>
                }
              </div>
              <p className="conf-exchange__question">{ex.question}</p>
            </div>
            <div className="conf-exchange__a">
              <p className="conf-exchange__answer">{ex.answer}</p>
            </div>
          </div>
        ))}

        {/* Error */}
        {fetchError && (
          <div className="conf-error">
            <span className="conf-error__icon">⚠</span>
            <p className="conf-error__msg">{fetchError}</p>
            <button className="conf-error__retry" onClick={handleRetry}>Reintentar</button>
          </div>
        )}

        {/* Pregunta actual */}
        {!isVerdict && !fetchError && (
          <div className="conf-current">
            <div className="conf-current__avatar-wrap">
              {selectedChar.image
                ? <img src={selectedChar.image} alt={selectedChar.name} className="conf-current__avatar" />
                : <span className="conf-current__emoji">{selectedChar.emoji}</span>
              }
              {streaming && <span className="conf-current__pulse" />}
            </div>
            <div className="conf-current__bubble">
              {currentQuestion
                ? <p className="conf-current__text">
                    {streaming ? currentQuestion : parsed.narrative}
                    {streaming && <span className="conf-cursor">▋</span>}
                  </p>
                : <div className="conf-typing"><span /><span /><span /></div>
              }
            </div>
          </div>
        )}

        {/* Opciones */}
        {hasOptions && !isVerdict && (
          <div className="conf-options">
            {parsed.options.map(opt => (
              <button
                key={opt.key}
                className={`conf-option-btn ${selectedOption === opt.text ? 'conf-option-btn--selected' : ''}`}
                onClick={() => handleAnswer(opt.text)}
                disabled={!!selectedOption}
              >
                <span className="conf-option-btn__key">{opt.key}</span>
                <span className="conf-option-btn__text">{opt.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Veredicto */}
        {isVerdict && (
          <div className="conf-verdict">
            <div className="conf-verdict__header">
              {selectedChar.image
                ? <img src={selectedChar.image} alt={selectedChar.name} className="conf-verdict__avatar" />
                : <span className="conf-verdict__emoji">{selectedChar.emoji}</span>
              }
              <div>
                <p className="conf-verdict__label">✦ Veredicto Final ✦</p>
                <p className="conf-verdict__char">{selectedChar.name}</p>
              </div>
            </div>
            <p className="conf-verdict__text">
              {verdict}{streaming && <span className="conf-cursor">▋</span>}
            </p>
            {!streaming && verdict && (
              <div className="conf-verdict__actions">
                <button className="conf-verdict__btn conf-verdict__btn--copy" onClick={handleShare}>
                  {copied ? '✓ Copiado' : '📋 Copiar veredicto'}
                </button>
                <button className="conf-verdict__btn conf-verdict__btn--new" onClick={handleRestart}>
                  👤 Otro personaje
                </button>
                <button className="conf-verdict__btn" onClick={() => navigate(ROUTES.HOME)}>
                  🏠 Inicio
                </button>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
      {levelUpToast && (
        <AchievementToast achievement={levelUpToast} onDismiss={dismissLevelUp} />
      )}
    </div>
  )
}
