import { characters } from '../../data/characters'
import { ROUTES } from '../../utils/constants'
import { CAST } from './constants.js'
import ArrowIcon from './ArrowIcon.jsx'

export default function LandingCast({ navigate }) {
  return (
    <section className="lp-cast">
      <div className="lp-container">
        <div className="lp-section-header lp-reveal">
          <span className="lp-eyebrow lp-eyebrow--inline">
            ELENCO
            <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
          </span>
          <h2 className="lp-section-title">
            Ya están<br /><em>adentro.</em>
          </h2>
        </div>
      </div>

      <div className="lp-cast-rail lp-reveal" style={{ '--reveal-delay': '0.1s' }}>
        {CAST.map(fc => {
          const char = characters.find(c => c.id === fc.id)
          if (!char) return null
          return (
            <button
              key={fc.id}
              className="lp-cast-card"
              style={{ '--char-color': char.themeColor }}
              onClick={() => navigate(ROUTES.CHAT_CHARACTER(fc.id))}
            >
              <div className="lp-cast-card__portrait">
                <img src={char.image} alt={char.name} loading="lazy" decoding="async" />
                <div className="lp-cast-card__portrait-fade" />
              </div>
              <div className="lp-cast-card__body">
                <span className="lp-cast-card__tag">{fc.tag}</span>
                <span className="lp-cast-card__name">{char.name}</span>
                <span className="lp-cast-card__quote">"{fc.quote}"</span>
              </div>
              <div className="lp-cast-card__enter">
                Chatear <ArrowIcon size={11} />
              </div>
            </button>
          )
        })}

        <button className="lp-cast-card lp-cast-card--more" onClick={() => navigate(ROUTES.CHAT)}>
          <span className="lp-cast-card--more__num">+{characters.length - CAST.length}</span>
          <span className="lp-cast-card--more__label">Ver todos<br />los personajes</span>
        </button>
      </div>
    </section>
  )
}
