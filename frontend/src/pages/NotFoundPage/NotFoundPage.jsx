import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../../data/characters'
import { ROUTES } from '../../utils/constants'
import './NotFoundPage.css'

const CAMEOS = [
  { id: 'sherlock',      quote: 'Elemental. La página no existe. Vos sí, aunque apenas.' },
  { id: 'john-wick',     quote: 'No hay nada aquí. Seguí moviéndote.' },
  { id: 'walter-white',  quote: 'Esta ruta no existe. Y yo sé de cosas que no existen.' },
  { id: 'darth-vader',   quote: 'El lado oscuro no tiene esta URL. Ni el lado claro.' },
  { id: 'el-profesor',   quote: 'Esto no estaba en el plan. Volvé al inicio.' },
  { id: 'gandalf',       quote: 'No pasarás... porque no hay nada que pasar.' },
]

export default function NotFoundPage() {
  const navigate = useNavigate()
  const [cameo] = useState(() => CAMEOS[Math.floor(Math.random() * CAMEOS.length)])
  const char = characters.find(c => c.id === cameo.id)

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

        {char && (
          <div className="nf-cameo">
            <div className="nf-cameo__avatar" style={{ '--cc': char.themeColor }}>
              <img src={char.image} alt={char.name} loading="lazy" decoding="async" />
            </div>
            <div className="nf-cameo__bubble">
              <span className="nf-cameo__name">{char.name}</span>
              <p className="nf-cameo__quote">"{cameo.quote}"</p>
            </div>
          </div>
        )}

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
