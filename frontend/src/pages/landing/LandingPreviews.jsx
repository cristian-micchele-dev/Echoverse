import { characterMap } from '../../data/characters'
import { ROUTES } from '../../utils/constants'
import { CONVERSATION_PREVIEWS } from './constants.js'
import ArrowIcon from './ArrowIcon.jsx'

export default function LandingPreviews({ navigate }) {
  return (
    <section className="lp-previews">
      <div className="lp-container">
        <div className="lp-section-header lp-reveal">
          <span className="lp-eyebrow lp-eyebrow--inline">
            EN ACCIÓN
            <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
          </span>
          <h2 className="lp-section-title">
            Así hablan<br /><em>de verdad.</em>
          </h2>
          <p className="lp-previews__sub">Respuestas reales generadas por IA. Sin guión. Sin filtros.</p>
        </div>

        <div className="lp-previews-grid">
          {CONVERSATION_PREVIEWS.map((preview, i) => {
            const char = characterMap[preview.characterId]
            if (!char) return null
            return (
              <article
                key={preview.characterId}
                className="lp-preview-card lp-reveal"
                style={{
                  '--char-color': char.themeColor,
                  '--char-dim': char.themeColorDim,
                  '--reveal-delay': `${i * 0.12}s`,
                }}
              >
                <div className="lp-preview-card__header">
                  <div className="lp-preview-card__avatar">
                    <img src={char.image} alt={char.name} loading="lazy" decoding="async" />
                  </div>
                  <div>
                    <span className="lp-preview-card__name">{char.name}</span>
                    <span className="lp-preview-card__universe">{char.universe}</span>
                  </div>
                </div>
                <div className="lp-preview-card__chat">
                  <div className="lp-preview-bubble lp-preview-bubble--user">
                    {preview.user}
                  </div>
                  <div className="lp-preview-bubble lp-preview-bubble--char">
                    {preview.reply}
                  </div>
                </div>
                <button
                  className="lp-preview-card__cta"
                  onClick={() => navigate(ROUTES.CHAT_CHARACTER(preview.characterId))}
                >
                  Chatear con {char.name} <ArrowIcon size={13} />
                </button>
                <span className="lp-preview-free">Sin cuenta necesaria</span>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
