import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { missions } from '../data/missions'
import { getSituationById } from '../data/situations'
import CriticalSituation from '../components/critical/CriticalSituation'
import CharacterSelector from '../components/CharacterSelector/CharacterSelector'
import './CriticalPage.css'

const RESULT_META = {
  win:     { label: 'Éxito',   icon: '✓', color: '#4ade80' },
  partial: { label: 'Parcial', icon: '◑', color: '#fb923c' },
  fail:    { label: 'Fallo',   icon: '✕', color: '#f87171' },
  chaos:   { label: 'Caos',    icon: '⚡', color: '#c084fc' }
}

export default function CriticalPage() {
  const navigate = useNavigate()

  const [phase,         setPhase]         = useState('chars')  // chars | stories | playing | transitioning | summary
  const [character,     setCharacter]     = useState(null)
  const [mission,       setMission]       = useState(null)
  const [stepIndex,     setStepIndex]     = useState(0)
  const [results,       setResults]       = useState([])
  const [lastNarrative, setLastNarrative] = useState(null)

  const handleCharSelect = (char) => {
    setCharacter(char)
    setPhase('stories')
  }

  const handleMissionSelect = (m) => {
    const pool      = m.pool || m.steps
    const count     = m.stepCount || m.steps.length
    const shuffled  = [...pool].sort(() => Math.random() - 0.5).slice(0, count)
    setMission({ ...m, steps: shuffled })
    setStepIndex(0)
    setResults([])
    setLastNarrative(null)
    setPhase('playing')
  }

  const handleSituationComplete = useCallback((outcome, choiceId) => {
    const newResults = [...results, { outcome, choiceId }]
    setResults(newResults)
    setLastNarrative(outcome.narrative)

    const isLastStep = newResults.length >= mission.steps.length

    if (isLastStep) {
      setTimeout(() => setPhase('summary'), 900)
    } else {
      setPhase('transitioning')
      setTimeout(() => {
        setStepIndex(i => i + 1)
        setPhase('playing')
      }, 700)
    }
  }, [results, mission])

  const handleReplay = () => {
    setPhase('stories')
    setResults([])
    setStepIndex(0)
    setLastNarrative(null)
  }

  // ── Selección de personaje ────────────────────────
  if (phase === 'chars') {
    return (
      <div className="critical-page">
        <div className="critical-page__top-bar">
          <button className="critical-page__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
        </div>
        <div className="critical-page__intro">
          <span className="critical-page__eyebrow">⚡ Situación Crítica</span>
          <h1 className="critical-page__title">Elegí tu agente</h1>
          <p className="critical-page__sub">
            Cada personaje reacciona distinto. 5 segundos por decisión. Sin vuelta atrás.
          </p>
        </div>
        <CharacterSelector characters={characters} onSelect={handleCharSelect} />
      </div>
    )
  }

  // ── Selección de historia ─────────────────────────
  if (phase === 'stories') {
    return (
      <div
        className="critical-page critical-page--stories"
        style={{ '--char-color': character.themeColor }}
      >
        <div className="critical-page__top-bar">
          <button className="critical-page__back" onClick={() => setPhase('chars')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
          <div className="critical-page__char-badge">
            {character.image
              ? <img src={character.image} alt={character.name} className="critical-page__char-avatar" />
              : <span>{character.emoji}</span>
            }
            <span className="critical-page__char-name">{character.name}</span>
          </div>
        </div>

        <div className="critical-page__intro">
          <span className="critical-page__eyebrow">Elegí la historia</span>
          <h2 className="critical-page__title">¿Cuál es la misión?</h2>
          <p className="critical-page__sub">
            Cada historia tiene sus propias escenas. Cada decisión tarda 5 segundos.
          </p>
        </div>

        <div className="critical-stories">
          {missions.map((m, i) => (
            <button
              key={m.id}
              className="critical-story-card"
              style={{ '--card-delay': `${i * 0.06}s` }}
              onClick={() => handleMissionSelect(m)}
            >
              <span className="critical-story-card__emoji">{m.emoji}</span>
              <div className="critical-story-card__body">
                <span className="critical-story-card__title">{m.title}</span>
                <span className="critical-story-card__desc">{m.description}</span>
                <span className="critical-story-card__scenes">
                  {m.steps.length} escenas · 5 seg c/u
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="critical-story-card__arrow">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Jugando / Transición ──────────────────────────
  if (phase === 'playing' || phase === 'transitioning') {
    const currentId  = mission.steps[stepIndex]
    const current    = getSituationById(currentId)
    const totalSteps = mission.steps.length

    return (
      <div
        className="critical-page critical-page--playing"
        style={{ '--char-color': character.themeColor }}
      >
        {/* Top bar */}
        <div className="critical-page__top-bar">
          <button className="critical-page__back" onClick={handleReplay}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Abandonar
          </button>
          <div className="critical-page__char-badge">
            {character.image
              ? <img src={character.image} alt={character.name} className="critical-page__char-avatar" />
              : <span>{character.emoji}</span>
            }
            <span className="critical-page__char-name">{character.name}</span>
          </div>
        </div>

        {/* Título de la misión + progreso */}
        <div className="critical-play-header">
          <span className="critical-play-header__mission">
            {mission.emoji} {mission.title}
          </span>
          <div className="critical-page__progress">
            {mission.steps.map((_, i) => (
              <span
                key={i}
                className={`critical-page__dot ${
                  i < stepIndex   ? 'critical-page__dot--done'   :
                  i === stepIndex ? 'critical-page__dot--active' : ''
                }`}
              />
            ))}
            <span className="critical-page__step-label">
              {stepIndex + 1} / {totalSteps}
            </span>
          </div>
        </div>

        {/* Nombre del capítulo */}
        {phase === 'playing' && current && (
          <div className="critical-chapter">
            <span className="critical-chapter__num">Escena {stepIndex + 1}</span>
            <span className="critical-chapter__title">{current.title}</span>
          </div>
        )}

        {/* Situación o transición */}
        <div className={`critical-page__game ${phase === 'transitioning' ? 'critical-page__game--out' : ''}`}>
          {phase === 'playing' && current && (
            <CriticalSituation
              key={`${mission.id}-step-${stepIndex}`}
              situation={current}
              characterId={character.id}
              onComplete={handleSituationComplete}
              context={stepIndex === 0 ? mission.intro : lastNarrative}
            />
          )}
          {phase === 'transitioning' && (
            <div className="critical-page__transition">
              <span className="critical-page__transition-dot" />
              <span className="critical-page__transition-dot" />
              <span className="critical-page__transition-dot" />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Resumen narrativo ─────────────────────────────
  const failCount   = results.filter(r => r.outcome.result === 'fail').length
  const finalStatus = failCount > results.length / 2 ? 'fail' : 'win'
  const ending      = mission.endings[finalStatus]

  const OVERALL_COLOR = { win: '#4ade80', fail: '#f87171' }

  return (
    <div
      className="critical-page critical-page--summary"
      style={{ '--char-color': character.themeColor, '--overall-color': OVERALL_COLOR[finalStatus] }}
    >
      {/* Cabecera */}
      <div className="critical-summary__header">
        <div className="critical-summary__char">
          {character.image
            ? <img src={character.image} alt={character.name} className="critical-summary__avatar" />
            : <span className="critical-summary__avatar-emoji">{character.emoji}</span>
          }
        </div>
        <div className="critical-summary__mission-label">
          {mission.emoji} {mission.title}
        </div>
        <p className="critical-summary__ending-title">{ending.title}</p>
        <p className="critical-summary__ending-narrative">{ending.narrative}</p>

        {/* Score pills */}
        <div className="critical-summary__score">
          {results.map((r, i) => {
            const meta = RESULT_META[r.outcome.result]
            return (
              <span
                key={i}
                className="critical-summary__score-pip"
                style={{ color: meta.color, borderColor: meta.color }}
                title={meta.label}
              >
                {meta.icon}
              </span>
            )
          })}
        </div>
      </div>

      {/* Repaso de escenas */}
      <div className="critical-summary__decisions">
        <p className="critical-summary__decisions-label">Lo que pasó</p>
        {results.map((r, i) => {
          const sitId = mission.steps[i]
          const sit   = getSituationById(sitId)
          const meta  = RESULT_META[r.outcome.result]
          return (
            <div key={i} className="critical-summary__item" style={{ '--item-color': meta.color }}>
              <div className="critical-summary__item-chapter">
                <span className="critical-summary__item-num">{i + 1}</span>
                <span className="critical-summary__item-chaptername">
                  {sit?.title || `Escena ${i + 1}`}
                </span>
              </div>
              <div className="critical-summary__item-body">
                <span className="critical-summary__item-result" style={{ color: meta.color }}>
                  {meta.icon} {meta.label}
                </span>
                <span className="critical-summary__item-narrative">
                  {r.outcome.narrative}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Acciones */}
      <div className="critical-summary__actions">
        <button
          className="critical-summary__btn critical-summary__btn--again"
          onClick={handleReplay}
        >
          ⚡ Otra historia
        </button>
        <button
          className="critical-summary__btn critical-summary__btn--char"
          onClick={() => setPhase('chars')}
        >
          👤 Otro personaje
        </button>
        <button
          className="critical-summary__btn critical-summary__btn--home"
          onClick={() => navigate('/')}
        >
          🏠 Inicio
        </button>
      </div>
    </div>
  )
}
