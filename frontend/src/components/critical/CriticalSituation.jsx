import { useState, useCallback, useRef, useEffect } from 'react'
import TimerBar from './TimerBar'
import OptionButton from './OptionButton'
import { resolveOutcome } from '../../data/situations'
import './CriticalSituation.css'

const RESULT_META = {
  win:     { label: '✓ Éxito',   cls: 'win' },
  partial: { label: '◑ Parcial', cls: 'partial' },
  fail:    { label: '✕ Fallo',   cls: 'fail' },
  chaos:   { label: '⚡ Caos',   cls: 'chaos' }
}

export default function CriticalSituation({ situation, characterId, onComplete, context }) {
  const [phase,   setPhase]   = useState('choosing') // choosing | resolving
  const [outcome, setOutcome] = useState(null)
  const timerRef      = useRef(null)
  const onCompleteRef = useRef(onComplete)
  const resolvedRef   = useRef(false)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const resolve = useCallback((choiceId) => {
    if (resolvedRef.current) return          // guard: ignora llamadas duplicadas
    resolvedRef.current = true
    const out = resolveOutcome(situation, characterId, choiceId)
    setOutcome(out)
    setPhase('resolving')
    timerRef.current = setTimeout(() => onCompleteRef.current?.(out, choiceId), 2600)
  }, [situation, characterId])

  const meta = outcome ? RESULT_META[outcome.result] : null

  return (
    <div className={`critical-sit${phase === 'resolving' && meta ? ` critical-sit--${meta.cls}` : ''}`}>

      {phase === 'choosing' && (
        <TimerBar duration={situation.timeLimit} onExpire={() => resolve('timeout')} />
      )}

      {context && (
        <p className="critical-sit__context">{context}</p>
      )}

      <div className="critical-sit__scene">
        <p className="critical-sit__text">{situation.text}</p>
      </div>

      {phase === 'choosing' && (
        <div className="critical-sit__options">
          {situation.options.map(opt => (
            <OptionButton
              key={opt.id}
              option={opt}
              onClick={() => resolve(opt.id)}
            />
          ))}
        </div>
      )}

      {phase === 'resolving' && meta && (
        <div className={`critical-sit__result critical-result--${meta.cls}`}>
          <span className="critical-result__badge">{meta.label}</span>
          <p className="critical-result__narrative">{outcome.narrative}</p>
        </div>
      )}
    </div>
  )
}
