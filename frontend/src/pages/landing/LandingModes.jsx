import { characters } from '../../data/characters'
import { missions } from '../../data/missions'
import { SECONDARY_MODES, PROTAGONIST_MODES } from './constants.js'
import ArrowIcon from './ArrowIcon.jsx'

export default function LandingModes({ navigate }) {
  return (
    <section className="lp-modes">
      <div className="lp-container">
        <div className="lp-section-header lp-reveal">
          <span className="lp-eyebrow lp-eyebrow--inline">
            MODOS DE JUEGO
            <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
          </span>
          <h2 className="lp-section-title">
            Elegí cómo<br /><em>entrás.</em>
          </h2>
        </div>

        <div className="lp-mode-cards lp-reveal" style={{ '--reveal-delay': '0.05s' }}>
          {SECONDARY_MODES.map(mode => {
            const char = characters.find(c => c.id === mode.characterId)
            return (
              <button
                key={mode.num}
                className="lp-mode-card"
                style={{ '--mc': mode.color }}
                onClick={() => navigate(mode.route)}
              >
                {char && (
                  <div className="lp-mode-card__img-wrap">
                    <img src={char.image} alt={char.name} className="lp-mode-card__img" loading="lazy" decoding="async" />
                    <div className="lp-mode-card__img-fade" />
                  </div>
                )}
                <div className="lp-mode-card__body">
                  <span className="lp-mode-card__badge">{mode.badge}</span>
                  <span className="lp-mode-card__eyebrow">{mode.eyebrow}</span>
                  <h3 className="lp-mode-card__title">{mode.label}</h3>
                  <p className="lp-mode-card__desc">{mode.desc}</p>
                  <div className="lp-mode-card__stats">
                    <span>{mode.duration}</span>
                    <span className="lp-mode-card__dot" />
                    <span>{mode.difficulty}</span>
                  </div>
                </div>
                <div className="lp-mode-card__cta">
                  Jugar ahora <ArrowIcon size={13} />
                </div>
              </button>
            )
          })}
        </div>

        <div className="lp-mode-blocks">
          {PROTAGONIST_MODES.map((mode, i) => {
            const char = characters.find(c => c.id === mode.characterId)
            return (
              <article
                key={mode.id}
                className={`lp-mode-block${i % 2 === 1 ? ' lp-mode-block--flip' : ''} lp-reveal`}
                style={{ '--accent': mode.accent, '--reveal-delay': `${i * 0.1}s` }}
                onClick={() => navigate(mode.route)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(mode.route)}
              >
                <div className="lp-mode-block__content">
                  <div className="lp-mode-block__meta">
                    <span className="lp-mode-block__eyebrow">{mode.eyebrow}</span>
                    <span className="lp-mode-block__tag">{mode.tag}</span>
                  </div>
                  <h3 className="lp-mode-block__title">{mode.label}</h3>
                  <p className="lp-mode-block__desc">{mode.desc}</p>
                  {mode.id === 'mission' && (
                    <ul className="lp-mode-block__missions">
                      {missions.map(m => (
                        <li key={m.id} className="lp-mode-block__mission-item">
                          <span className="lp-mode-block__mission-emoji">{m.emoji}</span>
                          <span className="lp-mode-block__mission-title">{m.title}</span>
                          <span className="lp-mode-block__mission-desc">{m.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    className="lp-mode-block__cta"
                    onClick={e => { e.stopPropagation(); navigate(mode.route) }}
                  >
                    {mode.cta} <ArrowIcon size={13} />
                  </button>
                </div>
                {(char || mode.image) && (
                  <div className="lp-mode-block__visual" style={mode.imgPosition ? { '--img-pos': mode.imgPosition } : undefined}>
                    <img src={mode.image ?? char.image} alt={mode.label} loading="lazy" decoding="async" />
                    <div className="lp-mode-block__visual-fade" />
                  </div>
                )}
                <span className="lp-mode-block__index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
