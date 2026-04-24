import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { getRandomQuestions, MATCH_DESCRIPTIONS, computeUserProfile, rankCharacters } from '../data/parecidoQuiz'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import { ROUTES } from '../utils/constants'
import './ParecidoPage.css'
import { Helmet } from 'react-helmet-async'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

const DIM_CONFIG = [
  { key: 'moral',   label: 'Moralidad', lo: 'Héroe puro',   hi: 'Oscuro / Villano' },
  { key: 'metodo',  label: 'Método',    lo: 'Cerebral',     hi: 'Caos / Fuerza' },
  { key: 'social',  label: 'Social',    lo: 'Solitario',    hi: 'Líder / Poder' },
  { key: 'emocion', label: 'Emoción',   lo: 'Frío',         hi: 'Impulsivo' },
  { key: 'mundo',   label: 'Mundo',     lo: 'Fantasía',     hi: 'Tecnología' },
]

// Personajes con imagen para el fondo animado (duplicados para loop sin cortes)
const BG_CHARS = [...characters, ...characters].filter(c => c.image)

export default function ParecidoPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)
  const [bgVisible, setBgVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setBgVisible(true)) }, [])

  const [phase, setPhase]               = useState('intro')    // 'intro' | 'playing' | 'result'
  const [activeQuestions, setActiveQuestions] = useState([])   // 15 preguntas del pool
  const [currentIndex, setCurrentIndex]  = useState(0)
  const [answers, setAnswers]            = useState([])
  const [selected, setSelected]          = useState(null)
  const [animating, setAnimating]        = useState(false)
  const [topMatches, setTopMatches]      = useState([])
  const [userProfile, setUserProfile]    = useState(null)
  const [copied, setCopied]              = useState(false)

  useEffect(() => {
    if (phase === 'result' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'parecido')
    }
  }, [phase, session])

  const handleStart = () => {
    const questions = getRandomQuestions(15)
    setActiveQuestions(questions)
    setCurrentIndex(0)
    setAnswers([])
    setSelected(null)
    setAnimating(false)
    setTopMatches([])
    setPhase('playing')
  }

  const handleAnswer = (optIdx) => {
    if (animating) return
    setSelected(optIdx)
    setAnimating(true)

    const vector = activeQuestions[currentIndex].options[optIdx].vector
    const newAnswers = [...answers, vector]

    setTimeout(() => {
      if (currentIndex + 1 >= activeQuestions.length) {
        // Última pregunta — calcular resultado
        const profile = computeUserProfile(newAnswers)
        const top3 = rankCharacters(profile)
        const enriched = top3.map(({ id, matchPct }) => ({
          id,
          matchPct,
          char: characters.find(c => c.id === id),
        }))
        setUserProfile(profile)
        setTopMatches(enriched)
        setPhase('result')
      } else {
        setCurrentIndex(i => i + 1)
        setSelected(null)
        setAnimating(false)
      }
    }, 380)
  }

  const handleRestart = () => {
    setPhase('intro')
    setCurrentIndex(0)
    setAnswers([])
    setSelected(null)
    setAnimating(false)
    setTopMatches([])
    setUserProfile(null)
    setCopied(false)
  }

  const handleShare = () => {
    const top = topMatches[0]
    if (!top?.char) return
    const text = `Soy ${top.matchPct}% compatible con ${top.char.name} en EchoVerse ¿Y vos?`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Fondo animado (compartido por todas las fases) ──────────────────────────
  const AnimatedBg = (
    <div className={`par-bg ${bgVisible ? 'par-bg--visible' : ''}`} aria-hidden="true">
      <div className="par-bg-track par-bg-track--1">
        {BG_CHARS.map((c, i) => <img key={i} src={c.image} alt="" className="par-bg-img" draggable={false} />)}
      </div>
      <div className="par-bg-track par-bg-track--2">
        {BG_CHARS.map((c, i) => <img key={i} src={c.image} alt="" className="par-bg-img" draggable={false} />)}
      </div>
      <div className="par-bg-track par-bg-track--3">
        {BG_CHARS.map((c, i) => <img key={i} src={c.image} alt="" className="par-bg-img" draggable={false} />)}
      </div>
      <div className="par-bg-overlay" />
    </div>
  )

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="par-page par-page--intro">
        <Helmet>
          <title>¿A quién te parecés? — EchoVerse</title>
          <meta name="description" content="Respondé preguntas y descubrí qué personaje ficticio refleja tu personalidad. ¿Sos más Sherlock Holmes o Jack Sparrow?" />
          <link rel="canonical" href="https://echoverse-jet.vercel.app/parecido" />
        </Helmet>
        {AnimatedBg}
        <button className="par-back-btn" onClick={() => navigate(ROUTES.MODOS)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Modos
        </button>

        <div className="par-intro">
          <p className="par-intro__eyebrow">Test de Personalidad</p>
          <h1 className="par-intro__title">¿A qué personaje<br/>te parecés?</h1>
          <p className="par-intro__sub">
            Respondé 15 preguntas sobre cómo tomás decisiones, qué valorás
            y cómo reaccionás. El sistema analiza tu perfil y lo compara
            contra los 52 personajes del universo.
          </p>

          <ul className="par-intro__pills">
            <li className="par-intro__pill">15 preguntas</li>
            <li className="par-intro__pill">52 personajes</li>
            <li className="par-intro__pill">Resultado inmediato</li>
          </ul>

          <button className="par-start-btn" onClick={handleStart}>
            Descubrir mi personaje
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  if (phase === 'playing') {
    const q        = activeQuestions[currentIndex]
    const progress = (currentIndex / activeQuestions.length) * 100

    return (
      <div className="par-page par-page--playing">
        {AnimatedBg}
        {/* Barra de progreso */}
        <div className="par-progress-bar">
          <div className="par-progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="par-play-header">
          <button className="par-back-btn par-back-btn--sm" onClick={handleRestart}>
            ✕
          </button>
          <span className="par-question-num">{currentIndex + 1} / {activeQuestions.length}</span>
        </div>

        <div className="par-play-body">
          <p className="par-question-text">{q.text}</p>

          <div className="par-options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`par-option ${selected === i ? 'par-option--chosen' : ''} ${selected !== null && selected !== i ? 'par-option--out' : ''}`}
                onClick={() => handleAnswer(i)}
                disabled={animating}
              >
                <span className="par-option__letter">{OPTION_LETTERS[i]}</span>
                <span className="par-option__text">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  const [first, second, third] = topMatches

  return (
    <div className="par-page par-page--result">
      {AnimatedBg}
      <div className="par-result">
        <p className="par-result__eyebrow">Tu perfil revela…</p>

        {/* Match principal */}
        {first && first.char && (
          <div className="par-match-main" style={{ '--char-color': first.char.themeColor }}>
            <div className="par-match-main__avatar-wrap">
              {first.char.image
                ? <img src={first.char.image} alt={first.char.name} className="par-match-main__avatar" />
                : <span className="par-match-main__emoji">{first.char.emoji}</span>
              }
              <span className="par-match-main__pct">{first.matchPct}%</span>
            </div>
            <h2 className="par-match-main__name">{first.char.name}</h2>
            <p className="par-match-main__universe">{first.char.universe}</p>
            <p className="par-match-main__desc">
              {MATCH_DESCRIPTIONS[first.id] || ''}
            </p>
            <button
              className="par-chat-btn"
              onClick={() => navigate(ROUTES.CHAT_CHARACTER(first.id))}
              style={{ background: first.char.themeColor }}
            >
              Chatear con {first.char.name}
            </button>
          </div>
        )}

        {/* Dimensiones del perfil */}
        {userProfile && (
          <div className="par-dims">
            <p className="par-dims__title">Tu perfil en 5 dimensiones</p>
            {DIM_CONFIG.map(({ key, label, lo, hi }) => {
              const pct = Math.round(((userProfile[key] ?? 2.5) - 1) / 3 * 100)
              return (
                <div key={key} className="par-dim">
                  <div className="par-dim__header">
                    <span className="par-dim__label">{label}</span>
                    <span className="par-dim__ends">
                      <span>{lo}</span>
                      <span>{hi}</span>
                    </span>
                  </div>
                  <div className="par-dim__track">
                    <div
                      className="par-dim__fill"
                      style={{ width: `${pct}%`, '--char-color': first?.char?.themeColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* También te parecés a… */}
        {(second || third) && (
          <div className="par-also">
            <p className="par-also__label">También te parecés a…</p>
            <div className="par-also__row">
              {[second, third].filter(Boolean).map(match => match?.char && (
                <button
                  key={match.id}
                  className="par-also-card"
                  style={{ '--char-color': match.char.themeColor }}
                  onClick={() => navigate(ROUTES.CHAT_CHARACTER(match.id))}
                >
                  <div className="par-also-card__avatar-wrap">
                    {match.char.image
                      ? <img src={match.char.image} alt={match.char.name} className="par-also-card__avatar" />
                      : <span className="par-also-card__emoji">{match.char.emoji}</span>
                    }
                  </div>
                  <span className="par-also-card__pct">{match.matchPct}%</span>
                  <span className="par-also-card__name">{match.char.name}</span>
                  <span className="par-also-card__universe">{match.char.universe}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="par-result__actions">
          <button
            className="par-action-btn par-action-btn--share"
            onClick={handleShare}
            style={{ '--char-color': first?.char?.themeColor }}
          >
            {copied ? '✓ ¡Copiado!' : '🔗 Compartir resultado'}
          </button>
          <button className="par-action-btn par-action-btn--secondary" onClick={handleRestart}>
            Volver a intentar
          </button>
          <button className="par-action-btn par-action-btn--ghost" onClick={() => navigate(ROUTES.HOME)}>
            Inicio
          </button>
        </div>
      </div>
    </div>
  )
}
