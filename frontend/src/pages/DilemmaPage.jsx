import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { readSSEStream } from '../utils/sse'
import {
  DILEMA_SCENARIOS,
  RECOMMENDED_CHAR_IDS,
  calculateProfile,
  applyStateEffects,
  pickDilemas
} from '../data/dilemas'
import { getAffinityData, getAffinityLevel } from '../utils/affinity'
import './DilemmaPage.css'
import { API_URL } from '../config/api.js'

const INITIAL_STATE = {
  trust: 50,
  tension: 0,
  bondScore: 0,
  guiltLoad: 0,
  pragmatism: 50,
  empathy: 50
}

export default function DilemmaPage() {
  const navigate = useNavigate()

  // ─── Phase machine ────────────────────────────────────────────────────────
  // select → scenario → intro → dilemma → reaction → profile
  const [phase, setPhase] = useState('select')
  const [visible, setVisible] = useState(false)

  // ─── Session data ─────────────────────────────────────────────────────────
  const [character, setCharacter] = useState(null)
  const [affinityLevel, setAffinityLevel] = useState(0)
  const [scenario, setScenario] = useState(null)
  const [sessionDilemas, setSessionDilemas] = useState([]) // dilemas elegidos al azar para esta sesión
  const [roundIndex, setRoundIndex] = useState(0)
  const [narrativeState, setNarrativeState] = useState(INITIAL_STATE)
  const [choiceHistory, setChoiceHistory] = useState([])

  // ─── Current round ────────────────────────────────────────────────────────
  const [pendingChoice, setPendingChoice] = useState(null) // { key, label, dilema }
  const [reaction, setReaction] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [consequenceVisible, setConsequenceVisible] = useState(false)

  // ─── Profile ──────────────────────────────────────────────────────────────
  const [moralProfile, setMoralProfile] = useState(null)
  const [profileVisible, setProfileVisible] = useState(false)

  const reactionRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // ─── Transition helper ────────────────────────────────────────────────────
  function transitionTo(nextPhase, delay = 0) {
    setTimeout(() => setPhase(nextPhase), delay)
  }

  // ─── Character select ─────────────────────────────────────────────────────
  function handleCharSelect(char) {
    setCharacter(char)
    const { messageCount } = getAffinityData(char.id)
    setAffinityLevel(getAffinityLevel(messageCount))
    transitionTo('scenario', 80)
  }

  // ─── Scenario select ──────────────────────────────────────────────────────
  function handleScenarioSelect(sc) {
    const variants = sc.introVariants ?? [sc.introLines]
    const introLines = variants[Math.floor(Math.random() * variants.length)]
    setScenario({ ...sc, introLines })
    setSessionDilemas(pickDilemas(sc.dilemmaPool, 4))
    transitionTo('intro', 80)
  }

  // ─── Intro → first dilema ─────────────────────────────────────────────────
  function handleIntroNext() {
    setRoundIndex(0)
    transitionTo('dilemma', 80)
  }

  // ─── Choice selection ─────────────────────────────────────────────────────
  function handleChoiceSelect(choice, dilema) {
    setPendingChoice({ ...choice, dilemaId: dilema.id, dilemmaQuestion: dilema.question })
    setReaction('')
    setConsequenceVisible(false)
    transitionTo('reaction', 60)
    fetchReaction(choice, dilema)
  }

  const fetchReaction = useCallback(async (choice, dilema) => {
    setIsStreaming(true)

    const historyPayload = choiceHistory.map(c => ({
      dilemmaQuestion: c.dilemmaQuestion,
      choiceLabel: c.label
    }))

    try {
      const res = await fetch(`${API_URL}/dilema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          dilemmaQuestion: dilema.question,
          choiceLabel: choice.label,
          choiceKey: choice.key,
          choiceHistory: historyPayload,
          affinityLevel
        })
      })

      await readSSEStream(res, chunk => {
        setReaction(prev => prev + chunk)
        reactionRef.current?.scrollTo({ top: reactionRef.current.scrollHeight, behavior: 'smooth' })
      })
    } catch {
      setReaction('El silencio también es una respuesta.')
    } finally {
      setIsStreaming(false)
      setTimeout(() => setConsequenceVisible(true), 400)
    }
  }, [character, choiceHistory, affinityLevel])

  // ─── Advance from reaction ────────────────────────────────────────────────
  function handleReactionNext() {
    const dilema = sessionDilemas[roundIndex]
    const choice = pendingChoice

    // Update state
    const newState = applyStateEffects(narrativeState, choice.stateEffects)
    setNarrativeState(newState)

    // Update history
    const newHistory = [
      ...choiceHistory,
      {
        dilemaId: dilema.id,
        dilemmaQuestion: dilema.question,
        key: choice.key,
        label: choice.label
      }
    ]
    setChoiceHistory(newHistory)

    const isLast = roundIndex >= sessionDilemas.length - 1

    if (isLast) {
      const profile = calculateProfile(newState)
      setMoralProfile(profile)
      transitionTo('profile', 80)
      setTimeout(() => setProfileVisible(true), 400)
    } else {
      setRoundIndex(prev => prev + 1)
      transitionTo('dilemma', 80)
    }
  }

  // ─── Restart ──────────────────────────────────────────────────────────────
  function handleRestart() {
    setPhase('select')
    setCharacter(null)
    setAffinityLevel(0)
    setScenario(null)
    setSessionDilemas([])
    setRoundIndex(0)
    setNarrativeState(INITIAL_STATE)
    setChoiceHistory([])
    setPendingChoice(null)
    setReaction('')
    setMoralProfile(null)
    setProfileVisible(false)
    setConsequenceVisible(false)
  }

  // ─── Derived ──────────────────────────────────────────────────────────────
  const currentDilema = sessionDilemas[roundIndex] ?? null
  const totalRounds = sessionDilemas.length
  const tensionPercent = Math.min(narrativeState.tension, 100)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`dilema-page ${visible ? 'dilema-page--visible' : ''}`}
      style={{
        '--tension': tensionPercent / 100,
        '--char-color': character?.themeColor ?? '#c9a84c',
        '--char-gradient': character?.gradient ?? 'none'
      }}
    >
      {/* Background */}
      <div className="dilema-ambient" />
      {character && (
        <div className="dilema-bg-char" aria-hidden="true">
          <img src={character.image} alt="" />
        </div>
      )}

      {phase === 'select'   && <SelectPhase onSelect={handleCharSelect} onBack={() => navigate('/')} />}
      {phase === 'scenario' && character && (
        <ScenarioPhase character={character} onSelect={handleScenarioSelect} onBack={() => setPhase('select')} />
      )}
      {phase === 'intro' && scenario && character && (
        <IntroPhase scenario={scenario} character={character} onNext={handleIntroNext} onBack={() => setPhase('scenario')} />
      )}
      {phase === 'dilemma' && currentDilema && (
        <DilemmaPhase
          dilema={currentDilema}
          roundIndex={roundIndex}
          totalRounds={totalRounds}
          character={character}
          narrativeState={narrativeState}
          affinityLevel={affinityLevel}
          onChoose={handleChoiceSelect}
          onExit={handleRestart}
        />
      )}
      {phase === 'reaction' && pendingChoice && (
        <ReactionPhase
          choice={pendingChoice}
          character={character}
          reaction={reaction}
          isStreaming={isStreaming}
          consequenceVisible={consequenceVisible}
          reactionRef={reactionRef}
          roundIndex={roundIndex}
          totalRounds={totalRounds}
          onNext={handleReactionNext}
          onExit={handleRestart}
        />
      )}
      {phase === 'profile' && moralProfile && (
        <ProfilePhase
          profile={moralProfile}
          character={character}
          choices={choiceHistory}
          narrativeState={narrativeState}
          visible={profileVisible}
          onRestart={handleRestart}
          onHome={() => navigate('/')}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECT PHASE
// ─────────────────────────────────────────────────────────────────────────────

function SelectPhase({ onSelect, onBack }) {
  const [filter, setFilter] = useState('recommended')

  const displayed = filter === 'recommended'
    ? characters.filter(c => RECOMMENDED_CHAR_IDS.has(c.id))
    : characters

  return (
    <div className="dilema-phase dilema-select">
      <div className="dilema-select__header">
        <button className="dilema-back-btn" onClick={onBack}>← Volver</button>
        <div className="dilema-select__title-block">
          <span className="dilema-eyebrow">Modo</span>
          <h1 className="dilema-title-hero">DILEMAS</h1>
          <p className="dilema-subtitle-hero">No todas las decisiones tienen una respuesta correcta.<br />Algunas solo tienen un precio.</p>
        </div>

        <div className="dilema-filter-tabs">
          <button
            className={`dilema-filter-tab ${filter === 'recommended' ? 'dilema-filter-tab--active' : ''}`}
            onClick={() => setFilter('recommended')}
          >
            Recomendados
          </button>
          <button
            className={`dilema-filter-tab ${filter === 'all' ? 'dilema-filter-tab--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
        </div>
      </div>

      <div className="dilema-char-grid">
        {displayed.map(char => (
          <button
            key={char.id}
            className="dilema-char-card"
            style={{ '--card-color': char.themeColor }}
            onClick={() => onSelect(char)}
          >
            <div className="dilema-char-card__img-wrap">
              <img
                src={char.image}
                alt={char.name}
                className="dilema-char-card__img"
                onError={e => { e.currentTarget.style.opacity = '0' }}
              />
              <div className="dilema-char-card__glow" />
            </div>
            <div className="dilema-char-card__info">
              <span className="dilema-char-card__name">{char.name}</span>
              <span className="dilema-char-card__universe">{char.universe}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO PHASE
// ─────────────────────────────────────────────────────────────────────────────

function ScenarioPhase({ character, onSelect, onBack }) {
  return (
    <div className="dilema-phase dilema-scenario">
      <button className="dilema-back-btn" onClick={onBack}>← Volver</button>

      <div className="dilema-scenario__header">
        <img
          src={character.image}
          alt={character.name}
          className="dilema-scenario__char-img"
          onError={e => { e.currentTarget.style.opacity = '0' }}
        />
        <div>
          <span className="dilema-eyebrow">Elegiste a</span>
          <h2 className="dilema-scenario__char-name">{character.name}</h2>
          <p className="dilema-scenario__prompt">Ahora elegí el escenario.</p>
        </div>
      </div>

      <div className="dilema-scenario-grid">
        {DILEMA_SCENARIOS.map(sc => (
          <button
            key={sc.id}
            className="dilema-scenario-card"
            onClick={() => onSelect(sc)}
          >
            <span className="dilema-scenario-card__title">{sc.title}</span>
            <span className="dilema-scenario-card__subtitle">{sc.subtitle}</span>
            <span className="dilema-scenario-card__count">{sc.dilemmaPool.length} dilemas</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INTRO PHASE
// ─────────────────────────────────────────────────────────────────────────────

function IntroPhase({ scenario, character, onNext, onBack }) {
  const [lineIndex, setLineIndex] = useState(0)
  const [canContinue, setCanContinue] = useState(false)

  useEffect(() => {
    if (lineIndex < scenario.introLines.length - 1) {
      const t = setTimeout(() => setLineIndex(l => l + 1), 1800)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setCanContinue(true), 1400)
      return () => clearTimeout(t)
    }
  }, [lineIndex, scenario.introLines.length])

  return (
    <div className="dilema-phase dilema-intro">
      <button className="dilema-back-btn dilema-back-btn--ghost" onClick={onBack}>← Volver</button>

      <div className="dilema-intro__body">
        <img
          src={character.image}
          alt={character.name}
          className="dilema-intro__char-img"
          onError={e => { e.currentTarget.style.opacity = '0' }}
        />
        <div className="dilema-intro__text-block">
          <span className="dilema-eyebrow">{scenario.title}</span>
          <div className="dilema-intro__lines">
            {scenario.introLines.map((line, i) => (
              <p
                key={i}
                className={`dilema-intro__line ${i <= lineIndex ? 'dilema-intro__line--visible' : ''}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className={`dilema-intro__cta ${canContinue ? 'dilema-intro__cta--visible' : ''}`}>
        <button className="dilema-btn-primary" onClick={onNext}>
          Comenzar
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DILEMMA PHASE
// ─────────────────────────────────────────────────────────────────────────────

function DilemmaPhase({ dilema, roundIndex, totalRounds, narrativeState, affinityLevel, onChoose, onExit }) {
  const [phaseVisible, setPhaseVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setPhaseVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const tensionLevel = narrativeState.tension
  const tensionClass = tensionLevel > 60 ? 'high' : tensionLevel > 30 ? 'mid' : 'low'

  const ac = dilema.affinityChoice ?? null
  const affinityUnlocked = ac && affinityLevel >= ac.minLevel
  const affinityLocked = ac && !affinityUnlocked

  return (
    <div className={`dilema-phase dilema-dilemma ${phaseVisible ? 'dilema-dilemma--visible' : ''}`}>

      {/* Exit button */}
      <button className="dilema-back-btn dilema-back-btn--exit" onClick={onExit}>✕</button>

      {/* Tension bar */}
      <div className="dilema-tension-bar">
        <div
          className={`dilema-tension-bar__fill dilema-tension-bar__fill--${tensionClass}`}
          style={{ width: `${Math.min(tensionLevel, 100)}%` }}
        />
      </div>

      {/* Round indicator */}
      <div className="dilema-round-indicator">
        <div className="dilema-round-dots">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <span
              key={i}
              className={`dilema-round-dot ${i < roundIndex ? 'done' : i === roundIndex ? 'current' : ''}`}
            />
          ))}
        </div>
        <span className="dilema-round-label">{dilema.roundLabel}</span>
      </div>

      {/* Content */}
      <div className="dilema-dilemma__content">
        <p className="dilema-dilemma__setup">{dilema.setup}</p>
        <h2 className="dilema-dilemma__question">{dilema.question}</h2>
      </div>

      {/* Choices */}
      <div className="dilema-choices">
        {dilema.choices.map(choice => (
          <button
            key={choice.key}
            className="dilema-choice-btn"
            onClick={() => onChoose(choice, dilema)}
          >
            <span className="dilema-choice-btn__key">{choice.key}</span>
            <span className="dilema-choice-btn__label">{choice.label}</span>
          </button>
        ))}

        {/* Affinity unlocked choice */}
        {affinityUnlocked && (
          <button
            className="dilema-choice-btn dilema-choice-btn--affinity"
            onClick={() => onChoose(ac.choice, dilema)}
          >
            <span className="dilema-choice-btn__key dilema-choice-btn__key--affinity">🔓</span>
            <span className="dilema-choice-btn__label">{ac.choice.label}</span>
          </button>
        )}

        {/* Affinity locked hint */}
        {affinityLocked && (
          <div className="dilema-choice-locked">
            <span className="dilema-choice-locked__icon">🔒</span>
            <span className="dilema-choice-locked__text">Opción secreta — disponible para Confidentes</span>
          </div>
        )}
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REACTION PHASE
// ─────────────────────────────────────────────────────────────────────────────

function ReactionPhase({
  choice, character,
  reaction, isStreaming, consequenceVisible,
  reactionRef, roundIndex, totalRounds, onNext, onExit
}) {
  const isLast = roundIndex >= totalRounds - 1

  return (
    <div className="dilema-phase dilema-reaction">

      {/* Exit button */}
      <button className="dilema-back-btn dilema-back-btn--exit" onClick={onExit}>✕</button>

      {/* Header */}
      <div className="dilema-reaction__header">
        <div className="dilema-reaction__char-wrap">
          <img
            src={character.image}
            alt={character.name}
            className="dilema-reaction__char-img"
            onError={e => { e.currentTarget.style.opacity = '0' }}
          />
          <div className="dilema-reaction__char-glow" />
        </div>
        <div className="dilema-reaction__meta">
          <span className="dilema-eyebrow">{character.name} reacciona</span>
          <span className="dilema-reaction__choice-echo">"{choice.label}"</span>
        </div>
      </div>

      {/* Reaction text */}
      <div className="dilema-reaction__text-wrap" ref={reactionRef}>
        {reaction && (
          <p className="dilema-reaction__text">
            {reaction}
            {isStreaming && <span className="dilema-cursor" />}
          </p>
        )}
        {!reaction && isStreaming && (
          <div className="dilema-reaction__thinking">
            <span /><span /><span />
          </div>
        )}
      </div>

      {/* Consequence */}
      {consequenceVisible && (
        <div className="dilema-consequence">
          <span className="dilema-consequence__bar" />
          <p className="dilema-consequence__text">{choice.consequence}</p>
        </div>
      )}

      {/* Next button */}
      {consequenceVisible && !isStreaming && (
        <button className="dilema-btn-primary dilema-btn-primary--reaction" onClick={onNext}>
          {isLast ? 'Ver mi perfil' : 'Continuar'}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PHASE
// ─────────────────────────────────────────────────────────────────────────────

function ProfilePhase({ profile, character, choices, narrativeState, visible, onRestart, onHome }) {
  const bondLabel = narrativeState.bondScore >= 15
    ? 'Vínculo fuerte'
    : narrativeState.bondScore >= 1
    ? 'Vínculo distante'
    : narrativeState.bondScore === 0
    ? 'Vínculo neutro'
    : 'Vínculo roto'

  const guiltLabel = narrativeState.guiltLoad >= 60
    ? 'Culpa profunda'
    : narrativeState.guiltLoad >= 30
    ? 'Culpa latente'
    : 'Culpa leve'

  return (
    <div className={`dilema-phase dilema-profile ${visible ? 'dilema-profile--visible' : ''}`}>

      <div className="dilema-profile__top">
        <img
          src={character.image}
          alt={character.name}
          className="dilema-profile__char-img"
          onError={e => { e.currentTarget.style.opacity = '0' }}
        />
        <div className="dilema-profile__header">
          <span className="dilema-eyebrow">Tu perfil moral</span>
          <h2 className="dilema-profile__label">{profile.label}</h2>
        </div>
      </div>

      <p className="dilema-profile__description">{profile.description}</p>

      {/* State indicators */}
      <div className="dilema-profile__stats">
        <div className="dilema-profile__stat">
          <span className="dilema-profile__stat-label">Vínculo con {character.name}</span>
          <span className={`dilema-profile__stat-value ${narrativeState.bondScore < 0 ? 'neg' : ''}`}>{bondLabel}</span>

        </div>
        <div className="dilema-profile__stat">
          <span className="dilema-profile__stat-label">Peso acumulado</span>
          <span className="dilema-profile__stat-value">{guiltLabel}</span>
        </div>
      </div>

      {/* Choice summary */}
      <div className="dilema-profile__choices">
        <span className="dilema-eyebrow" style={{ marginBottom: '0.75rem', display: 'block' }}>Tus decisiones</span>
        {choices.map((c, i) => (
          <div key={i} className="dilema-profile__choice-row">
            <span className="dilema-profile__choice-key">{String.fromCharCode(65 + i)}</span>
            <span className="dilema-profile__choice-text">{c.label}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="dilema-profile__ctas">
        <button className="dilema-btn-primary" onClick={onRestart}>
          ¿Y si hubieras elegido diferente?
        </button>
        <button className="dilema-btn-ghost" onClick={onHome}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
