import { Helmet } from 'react-helmet-async'
import { characters } from '../../data/characters'
import { ROUTES } from '../../utils/constants'
import { ROUNDS } from './constants.js'
import GuessBg from './GuessBg.jsx'

export default function GuessIntro({ onStart, navigate }) {
  return (
    <div className="gp gp--intro">
      <Helmet>
        <title>Adivina el Personaje — EchoVerse</title>
        <meta name="description" content="Pistas de a una, puntaje que baja. ¿Cuánto conocés a los personajes más icónicos del cine y la TV?" />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/guess" />
      </Helmet>

      <GuessBg />

      <div className="gp-intro-strip" aria-hidden="true">
        {[...characters, ...characters].map((c, i) => (
          <div key={`s-${i}`} className="gp-intro-strip__card">
            <img src={c.image} alt="" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>

      <button className="gp-back-btn" onClick={() => navigate(ROUTES.HOME)}>← Volver</button>

      <div className="gp-intro-content">
        <span className="gp-eyebrow">Modo</span>
        <h1 className="gp-intro-title">¿Lo reconocés?</h1>
        <p className="gp-intro-sub">
          Pistas psicológicas y contextuales. Cuanto antes lo adivines, más puntos ganás.
        </p>

        <div className="gp-intro-pills">
          <span className="gp-pill">{ROUNDS} rondas</span>
          <span className="gp-pill">100 pts máx.</span>
          <span className="gp-pill">◈ Deducción pura</span>
        </div>

        <div className="gp-teaser">
          <span className="gp-teaser__label">Pista 1 · Psicológica</span>
          <p className="gp-teaser__text">
            Lleva el peso del mundo en sus hombros desde niño, pero nunca lo buscó —
            simplemente no sabe cómo evitarlo.
          </p>
        </div>

        <button className="gp-start-btn" onClick={onStart}>Empezar a adivinar</button>
      </div>
    </div>
  )
}
