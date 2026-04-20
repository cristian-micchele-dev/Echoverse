import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'
import './NotFoundPage.css'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="nf">
      <div className="nf-grain" aria-hidden="true" />
      <div className="nf-ambient" aria-hidden="true" />

      <div className="nf-content">
        <span className="nf-code">404</span>
        <div className="nf-rule" aria-hidden="true" />
        <h1 className="nf-title">Este universo no existe.</h1>
        <p className="nf-sub">
          La ruta que buscás no forma parte de ningún universo conocido.<br />
          Puede que hayas seguido un portal roto.
        </p>
        <div className="nf-actions">
          <button className="nf-btn nf-btn--primary" onClick={() => navigate(ROUTES.HOME)}>
            Volver al inicio
          </button>
          <button className="nf-btn nf-btn--ghost" onClick={() => navigate(ROUTES.MODOS)}>
            Ver modos
          </button>
        </div>
      </div>
    </div>
  )
}
