import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ROUTES } from '../../utils/constants'
import ParecidoBg from './ParecidoBg.jsx'

export default function ParecidoIntro({ bgVisible, onStart }) {
  const navigate = useNavigate()

  return (
    <div className="par-page par-page--intro">
      <Helmet>
        <title>¿A quién te parecés? — EchoVerse</title>
        <meta name="description" content="Respondé preguntas y descubrí qué personaje ficticio refleja tu personalidad. ¿Sos más Sherlock Holmes o Jack Sparrow?" />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/parecido" />
      </Helmet>
      <ParecidoBg visible={bgVisible} />
      <button className="par-back-btn" onClick={() => navigate(ROUTES.MODOS)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Modos
      </button>

      <div className="par-intro">
        <p className="par-intro__eyebrow">Test de Personalidad</p>
        <h1 className="par-intro__title">¿A qué personaje<br/>te parecés?</h1>
        <p className="par-intro__sub">
          Respondé 15 preguntas sobre cómo tomás decisiones, qué valorás
          y cómo reaccionás. El sistema analiza tu perfil y lo compara
          contra los 52 personajes del universo.
        </p>

        <ul className="par-intro__pills">
          <li className="par-intro__pill">15 preguntas</li>
          <li className="par-intro__pill">52 personajes</li>
          <li className="par-intro__pill">Resultado inmediato</li>
        </ul>

        <button className="par-start-btn" onClick={onStart}>
          Descubrir mi personaje
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
