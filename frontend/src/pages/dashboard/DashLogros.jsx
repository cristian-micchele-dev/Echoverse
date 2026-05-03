import { ACHIEVEMENTS } from '../../data/achievements'
import { characterMap } from '../../data/characters'
import { ROUTES } from '../../utils/constants'
import { ACH_CHAR } from './constants.js'

export default function DashLogros({ unlockedIds, navigate }) {
  const lastAch = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id)).at(-1)
  const achChar = lastAch ? characterMap[ACH_CHAR[lastAch.id]] : null

  return (
    <section className="dash-section">
      <div className="dash-section-header">
        <span className="dash-eyebrow">Logros <span className="dash-eyebrow__rule" /></span>
        <h2 className="dash-section-title">Tus<br /><em>conquistas.</em></h2>
      </div>
      <div className="dash-logros" onClick={() => navigate(ROUTES.PERFIL)} role="button" tabIndex={0}>
        <div className="dash-logros__counter">
          <span className="dash-logros__num">{unlockedIds.size}</span>
          <span className="dash-logros__denom">/{ACHIEVEMENTS.length}</span>
        </div>
        {lastAch ? (
          <div className="dash-logros__last" style={{ '--char-color': achChar?.themeColor || 'var(--violet-400)' }}>
            {achChar && <img src={achChar.image} alt={achChar.name} className="dash-logros__last-img" />}
            <div className="dash-logros__last-body">
              <span className="dash-logros__last-emoji">{lastAch.emoji}</span>
              <span className="dash-logros__last-name">{lastAch.name}</span>
              <span className="dash-logros__last-desc">{lastAch.desc}</span>
            </div>
          </div>
        ) : (
          <span className="dash-logros__empty">Completá modos para desbloquear logros</span>
        )}
        <span className="dash-logros__cta">Ver todos →</span>
      </div>
    </section>
  )
}
