import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { useStreaming } from '../hooks/useStreaming'
import { ROUTES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import './EsteOEsePage.css'
import { API_URL } from '../config/api.js'

export default function EsteOEsePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)
  const [phase, setPhase] = useState('chars') // chars | loading | playing | result
  const [selectedChar, setSelectedChar] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [result, setResult] = useState({ percent: null, analysis: '' })
  const [error, setError] = useState(null)
  const { isLoading: streaming, streamChat } = useStreaming()

  useEffect(() => {
    if (phase === 'result' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'este-o-ese')
    }
  }, [phase, session])

  const handleCharSelect = async (char) => {
    setSelectedChar(char)
    setPhase('loading')
    setError(null)
    try {
      const res = await fetch(`${API_URL}/esteoese/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: char.id })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setQuestions(data.questions)
      setCurrentIndex(0)
      setAnswers([])
      setPhase('playing')
    } catch {
      setError('Error al cargar las preguntas. Reintentá.')
      setPhase('chars')
    }
  }

  const handleChoice = (side) => {
    if (animating) return
    setSelected(side)
    setAnimating(true)

    const q = questions[currentIndex]
    const newAnswers = [...answers, {
      question: `${q.a} vs ${q.b}`,
      chosen: side === 'a' ? q.a : q.b
    }]

    setTimeout(() => {
      setSelected(null)
      setAnimating(false)
      if (currentIndex + 1 >= questions.length) {
        setAnswers(newAnswers)
        setPhase('result')
        fetchResult(newAnswers)
      } else {
        setAnswers(newAnswers)
        setCurrentIndex(i => i + 1)
      }
    }, 420)
  }

  const fetchResult = async (answersArray) => {
    setResult({ percent: null, analysis: '' })
    let fullText = ''
    try {
      await streamChat(
        `${API_URL}/esteoese/result`,
        { characterId: selectedChar.id, answers: answersArray },
        content => {
          fullText += content
          const percentMatch = fullText.match(/RESULTADO:\s*(\d+)%/i)
          const analysis = fullText.replace(/RESULTADO:\s*\d+%\s*/i, '').trim()
          setResult({ percent: percentMatch ? parseInt(percentMatch[1]) : null, analysis })
        }
      )
    } catch {
      setError('Error al generar el resultado.')
    }
  }

  const handleRestart = () => {
    setPhase('chars')
    setSelectedChar(null)
    setQuestions([])
    setCurrentIndex(0)
    setAnswers([])
    setSelected(null)
    setAnimating(false)
    setResult({ percent: null, analysis: '' })
    setError(null)
  }

  /* ── Selección de personaje ── */
  if (phase === 'chars') {
    return (
      <div className="eoe-page">
        <div className="eoe-top-bar">
          <button className="eoe-back-btn" onClick={() => navigate(ROUTES.HOME)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
        </div>
        <div className="eoe-intro">
          <span className="eoe-intro__eyebrow">⚡ Este o Ese</span>
          <h1 className="eoe-intro__title">¿Con quién te medís?</h1>
          <p className="eoe-intro__sub">Elegí un personaje. Él elige las preguntas. Vos elegís sin pensar mucho.</p>
          {error && <p className="eoe-error">{error}</p>}
        </div>
        <div className="eoe-chars-grid">
          {characters.map((char, i) => (
            <button
              key={char.id}
              className="eoe-char-card"
              style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient, '--card-delay': `${i * 0.03}s` }}
              onClick={() => handleCharSelect(char)}
            >
              <div className="eoe-char-card__bg" style={{ background: char.gradient }}>
                {char.image && <img src={char.image} alt={char.name} className="eoe-char-card__img" />}
              </div>
              <div className="eoe-char-card__overlay" />
              <div className="eoe-char-card__info">
                <span className="eoe-char-card__universe">{char.universe}</span>
                <span className="eoe-char-card__name">{char.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ── Cargando ── */
  if (phase === 'loading') {
    return (
      <div className="eoe-page eoe-page--dark" style={{ '--char-color': selectedChar.themeColor }}>
        <div className="eoe-loading">
          <div className="eoe-loading__avatar-wrap">
            {selectedChar.image
              ? <img src={selectedChar.image} alt={selectedChar.name} className="eoe-loading__avatar" />
              : <span className="eoe-loading__emoji">{selectedChar.emoji}</span>
            }
            <span className="eoe-loading__pulse" />
          </div>
          <p className="eoe-loading__name">{selectedChar.name}</p>
          <p className="eoe-loading__text">preparando las preguntas...</p>
          <div className="eoe-loading__dots"><span /><span /><span /></div>
        </div>
      </div>
    )
  }

  /* ── Jugando ── */
  if (phase === 'playing') {
    const q = questions[currentIndex]
    return (
      <div className="eoe-page eoe-page--playing" style={{ '--char-color': selectedChar.themeColor }}>
        <div className="eoe-play-header">
          <button className="eoe-back-btn eoe-back-btn--sm" onClick={handleRestart}>✕</button>
          <div className="eoe-play-progress">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`eoe-dot ${i < currentIndex ? 'eoe-dot--done' : i === currentIndex ? 'eoe-dot--active' : ''}`}
              />
            ))}
          </div>
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="eoe-play-avatar" />
            : <span className="eoe-play-emoji">{selectedChar.emoji}</span>
          }
        </div>

        <div className="eoe-counter">{currentIndex + 1} <span>/ {questions.length}</span></div>

        <div className={`eoe-cards ${animating ? 'eoe-cards--out' : 'eoe-cards--in'}`}>
          <button
            className={`eoe-card ${selected === 'a' ? 'eoe-card--chosen' : ''} ${selected === 'b' ? 'eoe-card--lost' : ''}`}
            onClick={() => handleChoice('a')}
            disabled={animating}
          >
            <span className="eoe-card__text">{q?.a}</span>
          </button>

          <div className="eoe-vs">VS</div>

          <button
            className={`eoe-card ${selected === 'b' ? 'eoe-card--chosen' : ''} ${selected === 'a' ? 'eoe-card--lost' : ''}`}
            onClick={() => handleChoice('b')}
            disabled={animating}
          >
            <span className="eoe-card__text">{q?.b}</span>
          </button>
        </div>

        <p className="eoe-hint">Elegí sin pensarlo demasiado</p>
      </div>
    )
  }

  /* ── Resultado ── */
  return (
    <div className="eoe-page eoe-page--result" style={{ '--char-color': selectedChar.themeColor }}>
      <div className="eoe-result">
        <div className="eoe-result__char">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="eoe-result__avatar" />
            : <span className="eoe-result__emoji">{selectedChar.emoji}</span>
          }
        </div>

        <p className="eoe-result__question">¿Qué tan {selectedChar.name} sos?</p>

        {result.percent !== null
          ? <div className="eoe-result__percent">{result.percent}%</div>
          : streaming && <div className="eoe-loading__dots eoe-loading__dots--sm"><span /><span /><span /></div>
        }

        {result.analysis && (
          <p className="eoe-result__analysis">
            {result.analysis}
            {streaming && <span className="eoe-cursor">▋</span>}
          </p>
        )}

        {!streaming && result.analysis && (
          <div className="eoe-result__actions">
            <button className="eoe-result-btn eoe-result-btn--primary" onClick={() => handleCharSelect(selectedChar)}>
              🔄 Jugar de nuevo
            </button>
            <button className="eoe-result-btn" onClick={handleRestart}>
              👤 Otro personaje
            </button>
            <button className="eoe-result-btn" onClick={() => navigate(ROUTES.HOME)}>
              🏠 Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
