import { useState, useEffect } from 'react'

export default function DilemmaPhase({ dilema, roundIndex, totalRounds, narrativeState, affinityLevel, onChoose, onExit }) {
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

      <button className="dilema-back-btn dilema-back-btn--exit" onClick={onExit}>✕</button>

      <div className="dilema-tension-bar">
        <div
          className={`dilema-tension-bar__fill dilema-tension-bar__fill--${tensionClass}`}
          style={{ width: `${Math.min(tensionLevel, 100)}%` }}
        />
      </div>

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

      <div className="dilema-dilemma__content">
        <p className="dilema-dilemma__setup">{dilema.setup}</p>
        <h2 className="dilema-dilemma__question">{dilema.question}</h2>
      </div>

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

        {affinityUnlocked && (
          <button
            className="dilema-choice-btn dilema-choice-btn--affinity"
            onClick={() => onChoose(ac.choice, dilema)}
          >
            <span className="dilema-choice-btn__key dilema-choice-btn__key--affinity">🔓</span>
            <span className="dilema-choice-btn__label">{ac.choice.label}</span>
          </button>
        )}

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
