import { DILEMA_SCENARIOS } from '../../data/dilemas'

export default function ScenarioPhase({ character, onSelect, onBack }) {
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
