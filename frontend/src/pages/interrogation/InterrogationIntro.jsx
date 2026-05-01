import { SCENARIOS } from '../../data/interrogationData'
import { ROUTES } from '../../utils/constants'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function InterrogationIntro({
  intChars,
  selectedChar,
  setSelectedChar,
  selectedScenario,
  setSelectedScenario,
  isLoading,
  startSession,
}) {
  const navigate = useNavigate()

  return (
    <div className="ip ip--intro">
      <Helmet>
        <title>Interrogatorio — EchoVerse</title>
        <meta name="description" content="El personaje puede estar mintiendo. Detectá las contradicciones y decidí si le creés. IA reactiva en tiempo real." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/interrogation" />
      </Helmet>
      <div className="ip-bg" aria-hidden="true">
        <div className="ip-bg__spotlight ip-bg__spotlight--1" />
        <div className="ip-bg__spotlight ip-bg__spotlight--2" />
        <div className="ip-bg__grid" />
        <div className="ip-bg__vignette" />
      </div>

      <button className="ip-back ip-back--intro" onClick={() => navigate(ROUTES.HOME)}>← Volver</button>

      <div className="ip-intro">
        <div className="ip-intro__badge">MODO</div>
        <h1 className="ip-intro__title">Interrogatorio</h1>
        <p className="ip-intro__desc">
          Uno de estos personajes oculta algo. Hacé las preguntas correctas,
          detectá las contradicciones y decidí: ¿está mintiendo o dice la verdad?
        </p>
        <div className="ip-intro__features">
          <div className="ip-intro__feature ip-intro__feature--chars">
            <span className="ip-intro__feature-icon">🎭</span>
            <div className="ip-intro__feature-text">
              <span className="ip-intro__feature-title">Elenco variable</span>
              <span className="ip-intro__feature-sub">5 de 12 personajes, distintos cada vez</span>
            </div>
          </div>
          <div className="ip-intro__feature ip-intro__feature--questions">
            <span className="ip-intro__feature-icon">❓</span>
            <div className="ip-intro__feature-text">
              <span className="ip-intro__feature-title">Hasta 8 preguntas</span>
              <span className="ip-intro__feature-sub">Decidí cuándo ya tenés suficiente</span>
            </div>
          </div>
          <div className="ip-intro__feature ip-intro__feature--clues">
            <span className="ip-intro__feature-icon">🔍</span>
            <div className="ip-intro__feature-text">
              <span className="ip-intro__feature-title">Detectá las señales</span>
              <span className="ip-intro__feature-sub">Tono emocional, evasión, contradicciones</span>
            </div>
          </div>
        </div>

        <div className="ip-char-grid">
          {intChars.map((char, i) => (
            <button
              key={char.id}
              className={`ip-char-card ${selectedChar?.id === char.id ? 'ip-char-card--selected' : ''}`}
              style={{ '--cc': char.themeColor }}
              onClick={() => { setSelectedChar(char); setSelectedScenario(null) }}
            >
              <div className="ip-char-card__img">
                <img src={char.image} alt={char.name} loading="lazy" decoding="async" />
              </div>
              <div className="ip-char-card__overlay" />
              <span className="ip-char-card__num">#{String(i + 1).padStart(2, '0')}</span>
              <div className="ip-char-card__info">
                <span className="ip-char-card__name">{char.name}</span>
                <span className="ip-char-card__universe">{char.universe}</span>
              </div>
              {selectedChar?.id === char.id && (
                <div className="ip-char-card__check">✓</div>
              )}
            </button>
          ))}
        </div>

        {selectedChar && (
          <div className="ip-scenario-section">
            <p className="ip-scenario-label">Elegí el escenario:</p>
            <div className="ip-scenario-grid">
              {(SCENARIOS[selectedChar.id] ?? []).map(s => (
                <button
                  key={s.id}
                  className={`ip-scenario-card ${selectedScenario?.id === s.id ? 'ip-scenario-card--selected' : ''}`}
                  onClick={() => setSelectedScenario(s)}
                >
                  <p className="ip-scenario-card__text">{s.text}</p>
                  {selectedScenario?.id === s.id && (
                    <span className="ip-scenario-card__check">✓ Seleccionado</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedChar && selectedScenario && (
          <button
            className="ip-start-btn"
            onClick={startSession}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando...' : 'Comenzar interrogatorio'}
          </button>
        )}
      </div>
    </div>
  )
}
