import { useState, useEffect } from 'react'

export default function IntroPhase({ scenario, character, onNext, onBack }) {
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
