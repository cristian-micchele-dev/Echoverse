import { ROUTES } from '../../utils/constants'

export default function MissionEndActions({
  campaignMode, missionResult, selectedLevel,
  copied,
  onNextLevel, onRestart, onNewMission, onRetryLevel, onShare, navigate,
}) {
  if (campaignMode && missionResult === 'win' && selectedLevel?.level === 30) {
    return (
      <div className="mission-end-actions">
        <div className="mission-campaign-complete">
          <p className="mission-campaign-complete__title">¡Campaña completada!</p>
          <p className="mission-campaign-complete__sub">Superaste los 30 niveles. Sos una leyenda.</p>
          <button className="mission-end-btn mission-end-btn--chars" onClick={onRestart}>
            Volver a campaña
          </button>
        </div>
      </div>
    )
  }

  if (campaignMode && missionResult === 'win') {
    return (
      <div className="mission-end-actions">
        <button className="mission-end-btn mission-end-btn--next" onClick={onNextLevel}>
          Siguiente nivel
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="mission-end-actions__row">
          <button className="mission-end-btn mission-end-btn--chars" onClick={onRestart}>Campaña</button>
          <button className="mission-end-btn mission-end-btn--home" onClick={() => navigate(ROUTES.HOME)}>Inicio</button>
        </div>
      </div>
    )
  }

  if (campaignMode && missionResult === 'lose') {
    return (
      <div className="mission-end-actions">
        <button className="mission-end-btn mission-end-btn--new" onClick={onRetryLevel}>
          Reintentar nivel
        </button>
        <div className="mission-end-actions__row">
          <button className="mission-end-btn mission-end-btn--chars" onClick={onRestart}>Campaña</button>
          <button className="mission-end-btn mission-end-btn--home" onClick={() => navigate(ROUTES.HOME)}>Inicio</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mission-end-actions">
      <button className="mission-end-btn mission-end-btn--new" onClick={onNewMission}>
        Nueva misión
      </button>
      <div className="mission-end-actions__row">
        <button className="mission-end-btn mission-end-btn--share" onClick={onShare}>
          {copied ? 'Copiado' : 'Compartir'}
        </button>
        <button className="mission-end-btn mission-end-btn--chars" onClick={onRestart}>Otro personaje</button>
        <button className="mission-end-btn mission-end-btn--home" onClick={() => navigate(ROUTES.HOME)}>Inicio</button>
      </div>
    </div>
  )
}
