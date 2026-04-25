import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { useStreaming } from '../hooks/useStreaming'
import { ROUTES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import { addModeXP } from '../utils/affinity'
import { useLevelUpToast } from '../hooks/useLevelUpToast'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import { Helmet } from 'react-helmet-async'
import './SwipePage.css'
import { API_URL } from '../config/api.js'
const THRESHOLD = 80

export default function SwipePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)
  const [phase, setPhase] = useState('chars')
  const [selectedChar, setSelectedChar] = useState(null)
  const [cards, setCards] = useState([])
  const { levelUpToast, dismissLevelUp, notifyLevelUp } = useLevelUpToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([]) // { correct: bool }[]
  const [leaving, setLeaving] = useState(null) // 'left' | 'right'
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [feedbackData, setFeedbackData] = useState(null) // { correct, text, difficulty, showExplanation }
  const [result, setResult] = useState({ score: null, analysis: '' })
  const [error, setError] = useState(null)
  const { isLoading: streaming, streamChat } = useStreaming()
  const startX = useRef(null)
  const advanceRef = useRef(null)   // función para avanzar a la siguiente carta
  const autoTimerRef = useRef(null) // id del setTimeout automático
  const timerRef = useRef(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (phase === 'result' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'swipe')
      if (selectedChar) {
        const result = addModeXP(selectedChar.id, 'swipe')
        notifyLevelUp(result, selectedChar.name)
      }
    }
  }, [phase, session, selectedChar, notifyLevelUp])

  // Start/reset countdown on each new card
  useEffect(() => {
    if (phase !== 'playing') return
    setTimeLeft(15)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [currentIndex, phase])

  // Pause during feedback or leave animation
  useEffect(() => {
    if (feedbackData || leaving) clearInterval(timerRef.current)
  }, [feedbackData, leaving])

  // Auto-wrong on timeout
  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing' && !feedbackData && !leaving) {
      handleAnswer(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  const handleCharSelect = async (char) => {
    setSelectedChar(char)
    setPhase('loading')
    setError(null)
    try {
      const res = await fetch(`${API_URL}/swipe/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: char.id })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCards(data.cards)
      setCurrentIndex(0)
      setAnswers([])
      setPhase('playing')
    } catch {
      setError('Error al cargar las preguntas. Reintentá.')
      setPhase('chars')
    }
  }

  const handleAnswer = (userSaysTrue) => {
    if (leaving || feedbackData) return
    clearInterval(timerRef.current)
    const card = cards[currentIndex]
    const correct = userSaysTrue === card.answer
    const newStreak = correct ? streak + 1 : 0
    setStreak(newStreak)
    const multiplier = newStreak >= 5 ? 2.0 : newStreak >= 3 ? 1.5 : 1.0
    const newAnswers = [...answers, { correct, difficulty: card.difficulty || 'easy', multiplier }]
    const isLast = currentIndex + 1 >= cards.length
    const dir = userSaysTrue ? 'right' : 'left'
    setLeaving(dir)

    setTimeout(() => {
      setLeaving(null)
      setDragX(0)
      const feedback = { correct, text: card.feedback || '', difficulty: card.difficulty || '', showExplanation: false }
      setFeedbackData(feedback)

      const advance = () => {
        clearTimeout(autoTimerRef.current)
        advanceRef.current = null
        setFeedbackData(null)
        if (isLast) {
          const diffPts = { hard: 200, medium: 150, easy: 100 }
          const score = newAnswers.reduce((acc, a) => acc + (a.correct ? Math.round((diffPts[a.difficulty] ?? 100) * a.multiplier) : 0), 0)
          setAnswers(newAnswers)
          setPhase('result')
          fetchResult(score, newAnswers.length)
        } else {
          setAnswers(newAnswers)
          setCurrentIndex(i => i + 1)
        }
      }
      advanceRef.current = advance
      autoTimerRef.current = setTimeout(advance, 1800)
    }, 350)
  }

  /* ── Swipe / drag ── */
  const onPointerDown = (e) => {
    if (leaving || feedbackData) return
    startX.current = e.clientX ?? e.touches?.[0]?.clientX
    setIsDragging(true)
  }
  const onPointerMove = (e) => {
    if (!isDragging || startX.current === null) return
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - startX.current
    setDragX(x)
  }
  const onPointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > THRESHOLD) handleAnswer(true)
    else if (dragX < -THRESHOLD) handleAnswer(false)
    else setDragX(0)
    startX.current = null
  }

  const fetchResult = async (score, total) => {
    setResult({ score, analysis: '' })
    let fullText = ''
    try {
      await streamChat(
        `${API_URL}/swipe/result`,
        { characterId: selectedChar.id, score, total },
        content => {
          fullText += content
          setResult(r => ({ ...r, analysis: fullText }))
        }
      )
    } catch {
      setError('Error al generar el resultado.')
    }
  }

  const handleRestart = () => {
    clearInterval(timerRef.current)
    setPhase('chars'); setSelectedChar(null); setCards([]); setCurrentIndex(0)
    setAnswers([]); setLeaving(null); setDragX(0); setIsDragging(false)
    setFeedbackData(null); setResult({ score: null, analysis: '' }); setError(null)
    setTimeLeft(15); setStreak(0)
  }

  /* ── Chars ── */
  if (phase === 'chars') return (
    <div className="swipe-page">
      <Helmet>
        <title>Verdad o Mentira — EchoVerse</title>
        <meta name="description" content="¿Verdad o mentira? Respondé en segundos sobre los personajes más icónicos del cine y la TV." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/swipe" />
      </Helmet>
      <div className="swipe-top-bar">
        <button className="swipe-back-btn" onClick={() => navigate(ROUTES.HOME)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
      </div>
      <div className="swipe-intro">
        <span className="swipe-intro__eyebrow">👆 Swipe</span>
        <h1 className="swipe-intro__title">¿Verdad o Mentira?</h1>
        <p className="swipe-intro__sub">El personaje te lanza afirmaciones de su universo. Deslizá para responder.</p>
        {error && <p className="swipe-error">{error}</p>}
      </div>
      <div className="swipe-chars-grid">
        {characters.map((char, i) => (
          <button key={char.id} className="swipe-char-card"
            style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient, '--card-delay': `${i * 0.03}s` }}
            onClick={() => handleCharSelect(char)}>
            <div className="swipe-char-card__bg" style={{ background: char.gradient }}>
              {char.image && <img src={char.image} alt={char.name} className="swipe-char-card__img" loading="lazy" decoding="async" />}
            </div>
            <div className="swipe-char-card__overlay" />
            <div className="swipe-char-card__info">
              <span className="swipe-char-card__universe">{char.universe}</span>
              <span className="swipe-char-card__name">{char.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  /* ── Loading ── */
  if (phase === 'loading') return (
    <div className="swipe-page swipe-page--dark" style={{ '--char-color': selectedChar.themeColor }}>
      <div className="swipe-loading">
        <div className="swipe-loading__avatar-wrap">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="swipe-loading__avatar" loading="lazy" decoding="async" />
            : <span className="swipe-loading__emoji">{selectedChar.emoji}</span>}
          <span className="swipe-loading__pulse" />
        </div>
        <p className="swipe-loading__name">{selectedChar.name}</p>
        <p className="swipe-loading__text">preparando las afirmaciones...</p>
        <div className="swipe-loading__dots"><span /><span /><span /></div>
      </div>
    </div>
  )

  /* ── Playing ── */
  if (phase === 'playing') {
    const card = cards[currentIndex]
    const nextCard = cards[currentIndex + 1]
    const rotation = dragX * 0.06
    const leftOpacity = Math.min(1, Math.max(0, -dragX / THRESHOLD))
    const rightOpacity = Math.min(1, Math.max(0, dragX / THRESHOLD))

    return (
      <div className="swipe-page swipe-page--playing" style={{ '--char-color': selectedChar.themeColor }}>
        <div className="swipe-play-header">
          <button className="swipe-back-btn swipe-back-btn--sm" onClick={handleRestart}>✕</button>
          <div className="swipe-play-progress">
            {cards.map((_, i) => (
              <span key={i} className={`swipe-dot ${i < currentIndex ? 'swipe-dot--done' : i === currentIndex ? 'swipe-dot--active' : ''}`} />
            ))}
          </div>
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="swipe-play-avatar" loading="lazy" decoding="async" />
            : <span className="swipe-play-emoji">{selectedChar.emoji}</span>}
        </div>

        {/* Timer bar */}
        <div className="swipe-timer-track">
          <div
            className={`swipe-timer-fill ${timeLeft <= 5 ? 'swipe-timer-fill--urgent' : ''}`}
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>

        {/* Tinte de fondo dinámico */}
        <div className="swipe-bg-tint swipe-bg-tint--false" style={{ opacity: leftOpacity * 0.18 }} />
        <div className="swipe-bg-tint swipe-bg-tint--true"  style={{ opacity: rightOpacity * 0.18 }} />

        {selectedChar.image && (
          <div className="swipe-bg-char">
            <img src={selectedChar.image} alt="" loading="lazy" decoding="async" />
          </div>
        )}

        <div className="swipe-arena">
          {/* Indicadores */}
          <div className="swipe-indicator swipe-indicator--left" style={{ opacity: leftOpacity }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M21 7L7 21M7 7l14 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            FALSO
          </div>
          <div className="swipe-indicator swipe-indicator--right" style={{ opacity: rightOpacity }}>
            VERDAD
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M5 14l7 7L23 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Carta de fondo (siguiente) */}
          {nextCard && (
            <div className="swipe-card swipe-card--behind">
              <p className="swipe-card__text">{nextCard.statement}</p>
            </div>
          )}

          {/* Feedback overlay */}
          {feedbackData && (
            <div className={`swipe-feedback ${feedbackData.correct ? 'swipe-feedback--correct' : 'swipe-feedback--wrong'}`}>
              <span className="swipe-feedback__icon">{feedbackData.correct ? '✓' : '✗'}</span>
              <p className="swipe-feedback__label">{feedbackData.correct ? 'Correcto' : 'No era así'}</p>
              {feedbackData.text && !feedbackData.showExplanation && (
                <button
                  className="swipe-feedback__toggle"
                  onClick={() => {
                    clearTimeout(autoTimerRef.current)
                    setFeedbackData(d => ({ ...d, showExplanation: true }))
                  }}
                >
                  Ver explicación
                </button>
              )}
              {feedbackData.text && feedbackData.showExplanation && (
                <>
                  <p className="swipe-feedback__text">{feedbackData.text}</p>
                  <button
                    className="swipe-feedback__next"
                    onClick={() => advanceRef.current?.()}
                  >
                    Continuar →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Carta actual */}
          <div
            className={`swipe-card swipe-card--top ${isDragging ? 'swipe-card--dragging' : ''} ${leaving === 'right' ? 'swipe-card--leaving-right' : ''} ${leaving === 'left' ? 'swipe-card--leaving-left' : ''} ${card?.quote ? 'swipe-card--quote' : ''}`}
            style={{ transform: `translateX(${dragX}px) rotate(${rotation}deg)` }}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          >
            <div className="swipe-card__stamp swipe-card__stamp--true"  style={{ opacity: rightOpacity }}>✓ VERDAD</div>
            <div className="swipe-card__stamp swipe-card__stamp--false" style={{ opacity: leftOpacity }}>✗ FALSO</div>
            <div className="swipe-card__deco">{card?.quote ? '\u201C' : '?'}</div>
            <p className="swipe-card__text">{card?.statement}</p>
            {card?.quote && (
              <span className="swipe-card__quote-label">
                {selectedChar.image
                  ? <img src={selectedChar.image} alt="" className="swipe-card__quote-avatar" loading="lazy" decoding="async" />
                  : <span>{selectedChar.emoji}</span>}
                {selectedChar.name}
              </span>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="swipe-btns">
          <button className="swipe-btn swipe-btn--false" onClick={() => handleAnswer(false)}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M20 6L6 20M6 6l14 14" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="swipe-counter-wrap">
            <div className="swipe-counter">{currentIndex + 1}<span>/{cards.length}</span></div>
            {streak >= 2
              ? <p className="swipe-streak">🔥 {streak}× racha{streak >= 5 ? ' ×2' : streak >= 3 ? ' ×1.5' : ''}</p>
              : <p className="swipe-counter__hint">deslizá o usá los botones</p>
            }
          </div>
          <button className="swipe-btn swipe-btn--true" onClick={() => handleAnswer(true)}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M4 13l7 7L22 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }

  /* ── Resultado ── */
  const score = result.score ?? 0
  const total = cards.length
  const correctCount = answers.filter(a => a.correct).length
  const pct = Math.round((correctCount / total) * 100)

  const bestKey = `swipe-best-${selectedChar?.id}`
  const prevBest = parseInt(localStorage.getItem(bestKey) || '0', 10)
  const isNewBest = score > prevBest
  if (isNewBest && total > 0) localStorage.setItem(bestKey, String(score))

  const scoreBadge = pct >= 80 ? { label: '⭐ Maestro', cls: 'swipe-badge--master' }
    : pct >= 50 ? { label: '👍 Buen intento', cls: 'swipe-badge--ok' }
    : { label: '📚 A repasar', cls: 'swipe-badge--low' }

  return (
    <div className="swipe-page swipe-page--result" style={{ '--char-color': selectedChar.themeColor }}>
      <div className="swipe-result">
        <div className="swipe-result__char">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="swipe-result__avatar" loading="lazy" decoding="async" />
            : <span className="swipe-result__emoji">{selectedChar.emoji}</span>}
        </div>
        <div className="swipe-result__score">
          <span className="swipe-result__num">{score}</span>
          <span className="swipe-result__denom">pts</span>
        </div>
        <p className="swipe-result__correct">{correctCount} / {total} correctas</p>
        <div className="swipe-result__bar-wrap">
          <div className="swipe-result__bar" style={{ '--pct': `${pct}%` }} />
        </div>
        <p className="swipe-result__pct">{pct}% correcto</p>

        <div className="swipe-result__badges">
          <span className={`swipe-badge ${scoreBadge.cls}`}>{scoreBadge.label}</span>
          {isNewBest && total > 0 && <span className="swipe-badge swipe-badge--best">🏆 Nuevo récord</span>}
          {!isNewBest && prevBest > 0 && (
            <span className="swipe-badge swipe-badge--prev">Mejor: {prevBest} pts</span>
          )}
        </div>

        {result.analysis && (
          <p className="swipe-result__analysis">
            {result.analysis}
            {streaming && <span className="swipe-cursor">▋</span>}
          </p>
        )}
        {!result.analysis && streaming && (
          <div className="swipe-loading__dots"><span /><span /><span /></div>
        )}

        {/* Respuestas */}
        {!streaming && (
          <div className="swipe-answers">
            <p className="swipe-answers__label">Respuestas</p>
            {cards.map((card, i) => {
              const userCorrect = answers[i]?.correct
              return (
                <div key={i} className={`swipe-answer ${userCorrect ? 'swipe-answer--correct' : 'swipe-answer--wrong'}`}>
                  <span className="swipe-answer__icon">{userCorrect ? '✓' : '✗'}</span>
                  <div className="swipe-answer__content">
                    <p className="swipe-answer__statement">{card.statement}</p>
                    <div className="swipe-answer__meta">
                      <span className="swipe-answer__truth">{card.answer ? 'Verdad' : 'Falso'}</span>
                      {card.difficulty && <span className="swipe-answer__diff">{card.difficulty}</span>}
                    </div>
                    {card.feedback && <p className="swipe-answer__feedback">{card.feedback}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!streaming && result.analysis && (
          <div className="swipe-result__actions">
            <button className="swipe-result-btn swipe-result-btn--primary" onClick={() => handleCharSelect(selectedChar)}>
              Jugar de nuevo
            </button>
            <button className="swipe-result-btn" onClick={handleRestart}>Otro personaje</button>
            <button className="swipe-result-btn" onClick={() => navigate(ROUTES.HOME)}>Inicio</button>
          </div>
        )}
      </div>
      {levelUpToast && (
        <AchievementToast achievement={levelUpToast} onDismiss={dismissLevelUp} />
      )}
    </div>
  )
}
