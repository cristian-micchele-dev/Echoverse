export default function MissionChoices({
  streaming, choices, fetchError, currentText, isEnded, onChoice, onRetry,
}) {
  if (streaming || isEnded) return null

  if (choices.length > 0) {
    return (
      <div className="mission-choices">
        <div className="mission-choices__label">⚡ Tomá una decisión</div>
        <div className="mission-choices__list">
          {choices.map((choice, index) => (
            <button
              key={choice.key}
              className={`mission-choice-btn ${choice.type ? `mission-choice-btn--${choice.type}` : ''}`}
              style={{ '--i': index }}
              onClick={() => onChoice(choice)}
            >
              <span className="mission-choice-btn__key">{choice.key}</span>
              <span className="mission-choice-btn__body">
                {choice.type && <span className="mission-choice-btn__type">{choice.type}</span>}
                <span className="mission-choice-btn__text">{choice.text}</span>
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (fetchError || currentText) {
    return (
      <div className="mission-choices">
        <p className="mission-choices__label mission-choices__label--warn">
          {fetchError ? 'Error de conexión — puede ser un límite de la API' : 'No se generaron acciones'}
        </p>
        <button className="mission-choice-btn" onClick={onRetry}>
          <span className="mission-choice-btn__key">↺</span>
          <span className="mission-choice-btn__text">Reintentar</span>
        </button>
      </div>
    )
  }

  return null
}
