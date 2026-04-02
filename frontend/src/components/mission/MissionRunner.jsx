import { useState, useCallback } from 'react'
import CriticalSituation from '../critical/CriticalSituation'
import MissionSummary from './MissionSummary'
import { getSituationById } from '../../data/situations'
import './MissionRunner.css'

function getFinalStatus(results, failThreshold) {
  const failCount = results.filter(r => r.outcome.result === 'fail').length
  return failCount >= failThreshold ? 'fail' : 'win'
}

// Props:
//   mission  — objeto de missions.js
//   character — objeto de characters.js
//   onReplay  — callback cuando el usuario quiere volver a elegir misión
//   onHome    — callback para ir al inicio
export default function MissionRunner({ mission, character, onReplay, onHome }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [results,   setResults]   = useState([])
  const [phase,     setPhase]     = useState('playing') // playing | transitioning | summary

  const totalSteps          = mission.steps.length
  const currentSituationId  = mission.steps[stepIndex]
  const currentSituation    = getSituationById(currentSituationId)

  const handleSituationComplete = useCallback((outcome, choiceId) => {
    const newResults = [...results, { situationId: currentSituationId, choiceId, outcome }]
    setResults(newResults)

    const failCount   = newResults.filter(r => r.outcome.result === 'fail').length
    const isLastStep  = stepIndex >= totalSteps - 1
    const isEarlyFail = failCount >= mission.failThreshold

    if (isEarlyFail || isLastStep) {
      // Breve pausa para que se vea el resultado antes del summary
      setTimeout(() => setPhase('summary'), 900)
    } else {
      // Transición entre escenas
      setPhase('transitioning')
      setTimeout(() => {
        setStepIndex(s => s + 1)
        setPhase('playing')
      }, 750)
    }
  }, [results, stepIndex, currentSituationId, totalSteps, mission.failThreshold])

  if (phase === 'summary') {
    const finalStatus = getFinalStatus(results, mission.failThreshold)
    return (
      <MissionSummary
        mission={mission}
        character={character}
        results={results}
        finalStatus={finalStatus}
        onReplay={onReplay}
        onHome={onHome}
      />
    )
  }

  if (!currentSituation) return null

  return (
    <div
      className="mission-runner"
      style={{ '--char-color': character.themeColor, '--char-gradient': character.gradient }}
    >
      {/* Header: identity + progreso */}
      <div className="mission-runner__header">
        <div className="mission-runner__identity">
          <div className="mission-runner__avatar-wrap">
            {character.image
              ? <img src={character.image} alt={character.name} className="mission-runner__avatar" />
              : <span className="mission-runner__avatar-emoji">{character.emoji}</span>
            }
          </div>
          <div className="mission-runner__identity-info">
            <span className="mission-runner__char-name">{character.name}</span>
            <span className="mission-runner__mission-label">{mission.emoji} {mission.title}</span>
          </div>
        </div>

        <div className="mission-runner__progress">
          {mission.steps.map((_, i) => (
            <span
              key={i}
              className={`mission-runner__dot ${
                i < stepIndex       ? 'mission-runner__dot--done'   :
                i === stepIndex     ? 'mission-runner__dot--active' : ''
              }`}
            />
          ))}
          <span className="mission-runner__step-label">
            {stepIndex + 1}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Situación actual */}
      <div className={`mission-runner__scene ${phase === 'transitioning' ? 'mission-runner__scene--out' : ''}`}>
        {phase !== 'transitioning' && (
          <CriticalSituation
            key={`${mission.id}-step-${stepIndex}`}
            situation={currentSituation}
            characterId={character.id}
            onComplete={handleSituationComplete}
          />
        )}
        {phase === 'transitioning' && (
          <div className="mission-runner__transition">
            <span className="mission-runner__transition-dot" />
            <span className="mission-runner__transition-dot" />
            <span className="mission-runner__transition-dot" />
          </div>
        )}
      </div>
    </div>
  )
}
