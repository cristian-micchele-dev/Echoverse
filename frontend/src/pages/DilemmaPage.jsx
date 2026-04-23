import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { characters } from '../data/characters'
import { useStreaming } from '../hooks/useStreaming'
import { ROUTES } from '../utils/constants'
import {
  DILEMA_SCENARIOS,
  RECOMMENDED_CHAR_IDS,
  calculateProfile,
  applyStateEffects,
  pickDilemas
} from '../data/dilemas'
import { getAffinityData, getAffinityLevel } from '../utils/affinity'
import { recordCompletion } from '../utils/recordCompletion'
import './DilemmaPage.css'
import { API_URL } from '../config/api.js'
import { useAuth } from '../context/AuthContext'

const PROFILE_RECS = {
  pragmatico:       ['walter-white', 'hannibal', 'tony-stark'],
  'idealista-roto': ['gandalf', 'katniss', 'frodo'],
  ajusticiador:     ['john-wick', 'la-novia', 'the-punisher'],
  guardian:         ['aragorn', 'ip-man', 'lara-croft'],
  testigo:          ['sherlock', 'el-profesor', 'jon-snow'],
  rebelde:          ['tyler-durden', 'jax-teller', 'ragnar-lothbrok'],
  sacrificado:      ['eleven', 'geralt', 'tommy-shelby'],
  superviviente:    ['jack-sparrow', 'geralt', 'ethan-hunt'],
}

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
  const { session } = useAuth()

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
  const [globalVotes, setGlobalVotes] = useState(null)
  const [reaction, setReaction] = useState('')
  const [consequenceVisible, setConsequenceVisible] = useState(false)

  const { isLoading: isStreaming, streamChat } = useStreaming()

  // ─── Profile ──────────────────────────────────────────────────────────────
  const [moralProfile, setMoralProfile] = useState(null)
  const [profileVisible, setProfileVisible] = useState(false)

  const reactionRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const recordedRef = useRef(false)
  useEffect(() => {
    if (phase === 'profile' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'dilema')
    }
  }, [phase, session])

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
  async function handleScenarioSelect(sc) {
    const variants = sc.introVariants ?? [sc.introLines]
    const introLines = variants[Math.floor(Math.random() * variants.length)]
    setScenario({ ...sc, introLines })

    let seen = []
    if (session) {
      try {
        const r = await fetch(`${API_URL}/db/dilema-seen`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        seen = await r.json()
      } catch { seen = [] }
    } else {
      try { seen = JSON.parse(localStorage.getItem('dilema-seen') || '[]') } catch { seen = [] }
    }

    setSessionDilemas(pickDilemas(sc.dilemmaPool, 4, seen))
    transitionTo('intro', 80)
  }

  // ─── Intro → first dilema ─────────────────────────────────────────────────
  function handleIntroNext() {
    setRoundIndex(0)
    transitionTo('dilemma', 80)
  }

  // ─── Choice selection ─────────────────────────────────────────────────────
  function handleChoiceSelect(choice, dilema) {
    setPendingChoice({ ...choice, dilemaId: dilema.id, dilemmaQuestion: dilema.question, allChoices: dilema.choices })
    setReaction('')
    setGlobalVotes(null)
    setConsequenceVisible(false)
    transitionTo('reaction', 60)
    fetchReaction(choice, dilema)
    fetch(`${API_URL}/db/dilema-votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dilemaId: dilema.id, choiceKey: choice.key })
    })
      .then(r => r.json())
      .then(votes => { if (votes && !votes.error) setGlobalVotes(votes) })
      .catch(() => {})
  }

  const fetchReaction = useCallback(async (choice, dilema) => {
    const historyPayload = choiceHistory.map(c => ({
      dilemmaQuestion: c.dilemmaQuestion,
      choiceLabel: c.label
    }))

    try {
      await streamChat(
        `${API_URL}/dilema`,
        {
          characterId: character.id,
          dilemmaQuestion: dilema.question,
          choiceLabel: choice.label,
          choiceKey: choice.key,
          choiceHistory: historyPayload,
          affinityLevel
        },
        chunk => {
          setReaction(prev => prev + chunk)
          reactionRef.current?.scrollTo({ top: reactionRef.current.scrollHeight, behavior: 'smooth' })
        }
      )
    } catch {
      setReaction('El silencio también es una respuesta.')
    } finally {
      setTimeout(() => setConsequenceVisible(true), 400)
    }
  }, [character, choiceHistory, affinityLevel, streamChat])

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
      // Persistir ids vistos para evitar repetición en próximas sesiones
      const played = sessionDilemas.map(d => d.id)
      if (session) {
        fetch(`${API_URL}/db/dilema-seen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ dilemaIds: played })
        }).catch(() => {})
      } else {
        try {
          const seen = JSON.parse(localStorage.getItem('dilema-seen') || '[]')
          localStorage.setItem('dilema-seen', JSON.stringify([...new Set([...seen, ...played])]))
        } catch { /* ignore */ }
      }
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
    setGlobalVotes(null)
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
      <Helmet>
        <title>Dilemas Morales — EchoVerse</title>
        <meta name="description" content="Sin salida limpia. Decidí en dilemas filosóficos junto a los personajes más icónicos del cine y la TV." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/dilema" />
      </Helmet>
      {/* Background */}
      <div className="dilema-ambient" />
      {character && (
        <div className="dilema-bg-char" aria-hidden="true">
          <img src={character.image} alt="" />
        </div>
      )}

      {phase === 'select'   && <SelectPhase onSelect={handleCharSelect} onBack={() => navigate(ROUTES.HOME)} />}
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
          narrativeState={narrativeState}
          reaction={reaction}
          isStreaming={isStreaming}
          consequenceVisible={consequenceVisible}
          globalVotes={globalVotes}
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
          onHome={() => navigate(ROUTES.HOME)}
          allCharacters={characters}
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

        <div className="dilema-filter-tabs" role="group" aria-label="Filtrar personajes">
          <button
            className={`dilema-filter-tab ${filter === 'recommended' ? 'dilema-filter-tab--active' : ''}`}
            onClick={() => setFilter('recommended')}
            aria-pressed={filter === 'recommended'}
          >
            Recomendados
          </button>
          <button
            className={`dilema-filter-tab ${filter === 'all' ? 'dilema-filter-tab--active' : ''}`}
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
          >
            Todos
          </button>
        </div>
      </div>

      <div className="dilema-char-grid" role="list">
        {displayed.map(char => (
          <button
            key={char.id}
            className="dilema-char-card"
            style={{ '--card-color': char.themeColor }}
            onClick={() => onSelect(char)}
            aria-label={`Jugar dilemas con ${char.name} (${char.universe})`}
            role="listitem"
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
      <div className="dilema-round-indicator" aria-label={`Dilema ${roundIndex + 1} de ${totalRounds}`}>
        <div className="dilema-round-dots" aria-hidden="true">
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
      <div className="dilema-choices" role="group" aria-label="Elegí tu decisión">
        {dilema.choices.map(choice => {
          const fx = choice.stateEffects || {}
          const hints = []
          if (fx.tension && Math.abs(fx.tension) >= 5)
            hints.push({ icon: '⚡', val: fx.tension, cls: fx.tension > 0 ? 'tension-up' : 'tension-down' })
          if (fx.bondScore && Math.abs(fx.bondScore) >= 3)
            hints.push({ icon: '🔗', val: fx.bondScore, cls: fx.bondScore > 0 ? 'bond-up' : 'bond-down' })
          return (
            <button
              key={choice.key}
              className="dilema-choice-btn"
              onClick={() => onChoose(choice, dilema)}
              aria-label={`Opción ${choice.key}: ${choice.label}`}
            >
              <span className="dilema-choice-btn__key">{choice.key}</span>
              <span className="dilema-choice-btn__label">{choice.label}</span>
              {hints.length > 0 && (
                <div className="dilema-choice-hints">
                  {hints.map((h, i) => (
                    <span key={i} className={`dilema-hint dilema-hint--${h.cls}`}>
                      {h.icon} {h.val > 0 ? '+' : ''}{h.val}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}

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
  choice, character, narrativeState,
  reaction, isStreaming, consequenceVisible, globalVotes,
  reactionRef, roundIndex, totalRounds, onNext, onExit
}) {
  const isLast = roundIndex >= totalRounds - 1

  const charState =
    narrativeState.bondScore <= -15 ? 'broken' :
    narrativeState.bondScore < 0    ? 'distant' :
    narrativeState.tension >= 60    ? 'tense' : ''

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
            className={`dilema-reaction__char-img${charState ? ` dilema-char--${charState}` : ''}`}
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
      <div className="dilema-reaction__text-wrap" ref={reactionRef} aria-live="polite" aria-atomic="false">
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

      {/* Global votes */}
      {consequenceVisible && globalVotes && choice.allChoices && (
        <VoteBreakdown votes={globalVotes} choices={choice.allChoices} userChoiceKey={choice.key} />
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
// VOTE BREAKDOWN
// ─────────────────────────────────────────────────────────────────────────────

function VoteBreakdown({ votes, choices, userChoiceKey }) {
  const total = Object.values(votes).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  return (
    <div className="dilema-votes">
      <span className="dilema-votes__title">Así votó la comunidad</span>
      {choices.map(c => {
        const count = votes[c.key] ?? 0
        const pct = Math.round((count / total) * 100)
        const isUser = c.key === userChoiceKey
        return (
          <div key={c.key} className={`dilema-votes__row ${isUser ? 'dilema-votes__row--user' : ''}`}>
            <span className="dilema-votes__key">{c.key}</span>
            <div className="dilema-votes__bar-wrap">
              <div className="dilema-votes__bar" style={{ width: `${pct}%` }} />
              <span className="dilema-votes__label">{c.label}</span>
            </div>
            <span className="dilema-votes__pct">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PHASE
// ─────────────────────────────────────────────────────────────────────────────

function ProfilePhase({ profile, character, choices, narrativeState, visible, onRestart, onHome, allCharacters }) {
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

      {/* Personajes recomendados */}
      {(() => {
        const recIds = PROFILE_RECS[profile.id] || []
        const recs = recIds.map(id => (allCharacters || []).find(c => c.id === id)).filter(Boolean)
        if (!recs.length) return null
        return (
          <div className="dilema-recs">
            <span className="dilema-eyebrow">Con este perfil, estos personajes te van a desafiar</span>
            <div className="dilema-recs__grid">
              {recs.map(char => (
                <div key={char.id} className="dilema-rec-card" style={{ '--char-color': char.themeColor }}>
                  {char.image && <img src={char.image} alt={char.name} className="dilema-rec-card__img" />}
                  <span className="dilema-rec-card__name">{char.name}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

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
