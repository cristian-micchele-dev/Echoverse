import { ROUTES } from '../../utils/constants'
import ArrowIcon from './ArrowIcon.jsx'

export default function WelcomePanel({ user, navigate }) {
  const username = user.user_metadata?.username || user.email?.split('@')[0] || 'explorador'
  return (
    <div className="lp-welcome lp-reveal">
      <div className="lp-welcome__header">
        <span className="lp-eyebrow lp-eyebrow--inline">
          BIENVENIDO DE VUELTA
          <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
        </span>
        <h2 className="lp-section-title">
          Hola, <em>{username}.</em>
        </h2>
      </div>
      <div className="lp-welcome__actions">
        <button className="lp-btn lp-btn--primary" onClick={() => navigate(ROUTES.PERFIL)}>
          Mi perfil <ArrowIcon size={14} />
        </button>
        <button className="lp-btn lp-btn--ghost" onClick={() => navigate(ROUTES.CREAR_PERSONAJE)}>
          Crear personaje
        </button>
      </div>
    </div>
  )
}
