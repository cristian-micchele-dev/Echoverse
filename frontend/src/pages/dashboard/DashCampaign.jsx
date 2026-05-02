export default function DashCampaign({ mission, navigate }) {
  if (mission.highestUnlocked <= 1) {
    return (
      <section className="dash-section">
        <span className="dash-eyebrow">Campaña <span className="dash-eyebrow__rule" /></span>
        <div className="dash-campaign dash-campaign--empty" onClick={() => navigate('/mission')} role="button" tabIndex={0}>
          <span className="dash-campaign__empty-icon">⚔️</span>
          <div className="dash-campaign__empty-body">
            <span className="dash-campaign__empty-title">30 niveles te esperan</span>
            <span className="dash-campaign__empty-sub">Empezá la campaña y desbloqueá personajes exclusivos →</span>
          </div>
        </div>
      </section>
    )
  }

  const level = mission.highestUnlocked - 1
  const pct = Math.min((level / 30) * 100, 100)

  return (
    <section className="dash-section">
      <span className="dash-eyebrow">Campaña <span className="dash-eyebrow__rule" /></span>
      <div className="dash-campaign" onClick={() => navigate('/mission')} role="button" tabIndex={0}>
        <div className="dash-campaign__top">
          <div className="dash-campaign__level">
            <span className="dash-campaign__level-num">Nivel {level}</span>
            <span className="dash-campaign__level-sub">{level} de 30 completados</span>
          </div>
          <button className="dash-campaign__cta" onClick={e => { e.stopPropagation(); navigate('/mission') }}>
            Continuar
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="dash-campaign__bar">
          <div className="dash-campaign__bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="dash-campaign__pct">{Math.round(pct)}% completado</span>
      </div>
    </section>
  )
}
