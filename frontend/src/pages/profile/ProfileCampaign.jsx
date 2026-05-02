import { ROUTES } from '../../utils/constants'

export default function ProfileCampaign({ highestLevel, progressPct, navigate }) {
  return (
    <section className="pp-section">
      <div className="pp-section__header">
        <span className="pp-section__eyebrow">PROGRESO</span>
        <h2 className="pp-section__title">Campaña</h2>
      </div>

      {highestLevel > 1 ? (
        <div className="pp-mission">
          <div className="pp-mission__top">
            <div>
              <span className="pp-mission__lvl">Nivel {highestLevel - 1}</span>
              <span className="pp-mission__sub">{highestLevel - 1} de 30 niveles completados</span>
            </div>
            <button className="pp-mission__cta" onClick={() => navigate(ROUTES.MISSION)}>
              Continuar →
            </button>
          </div>
          <div className="pp-bar">
            <div className="pp-bar__fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="pp-mission__footer">
            <span className="pp-mission__pct">{Math.round(progressPct)}% completado</span>
            <span className="pp-mission__next">Siguiente: Nivel {highestLevel}</span>
          </div>
        </div>
      ) : (
        <div className="pp-empty-cta" onClick={() => navigate(ROUTES.MISSION)}>
          <span className="pp-empty-cta__icon">⚔️</span>
          <div>
            <p className="pp-empty-cta__title">Todavía no empezaste la campaña</p>
            <p className="pp-empty-cta__sub">30 niveles te esperan. Empezá ahora →</p>
          </div>
        </div>
      )}
    </section>
  )
}
