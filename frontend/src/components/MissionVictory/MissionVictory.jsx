/**
 * Overlay de victoria al completar una misión.
 * Componente de display puro — toda la lógica vive en MissionPage.
 */
export default function MissionVictory({ missionTitle, campaignMode, selectedLevel, vida, riesgo, vidaName, history, onDismiss, onNextLevel, onRestart }) {
  return (
    <div className="mission-victory" onClick={onDismiss} role="dialog" aria-modal="true" aria-label="Misión completada">
      <div className="mission-victory__card" onClick={e => e.stopPropagation()}>
        <div className="mission-victory__icon" aria-hidden="true">✔</div>
        <p className="mission-victory__eyebrow">
          {campaignMode && selectedLevel ? `Nivel ${selectedLevel.level} superado` : 'Misión completada'}
        </p>
        <h2 className="mission-victory__title">{missionTitle || 'Operación exitosa'}</h2>
        {campaignMode && selectedLevel && (
          <p className="mission-victory__unlock">
            🔓 Nivel {selectedLevel.level + 1} desbloqueado
          </p>
        )}
        <div className="mission-victory__stats">
          <div className="mission-victory__stat">
            <span className="mission-victory__stat-val">{vida}<span className="mission-victory__stat-max">/5</span></span>
            <span className="mission-victory__stat-lbl">{vidaName}</span>
          </div>
          <div className="mission-victory__stat">
            <span className="mission-victory__stat-val">{history.length}<span className="mission-victory__stat-max">/5</span></span>
            <span className="mission-victory__stat-lbl">Decisiones</span>
          </div>
          <div className="mission-victory__stat">
            <span className="mission-victory__stat-val">{riesgo}<span className="mission-victory__stat-max">/5</span></span>
            <span className="mission-victory__stat-lbl">Riesgo</span>
          </div>
        </div>
        <div className="mission-victory__actions">
          {campaignMode && selectedLevel?.level !== 30 && (
            <button className="mission-victory__btn mission-victory__btn--next" onClick={onNextLevel}>
              Siguiente nivel →
            </button>
          )}
          <button className="mission-victory__btn mission-victory__btn--secondary" onClick={onDismiss}>
            Ver análisis
          </button>
          <button className="mission-victory__btn mission-victory__btn--ghost" onClick={onRestart}>
            {campaignMode ? 'Ver campaña' : 'Nuevo personaje'}
          </button>
        </div>
      </div>
    </div>
  )
}
