import { ROUTES, chatHistoryKey } from '../../utils/constants'
import { getAffinityLabel, getAffinityEmoji } from '../../utils/game/affinity'
import { timeAgo } from '../../utils/session'

export default function ProfileAffinities({ activeAffinities, navigate }) {
  return (
    <section className="pp-section">
      <div className="pp-section__header">
        <span className="pp-section__eyebrow">VÍNCULOS</span>
        <h2 className="pp-section__title">Afinidades</h2>
      </div>

      {activeAffinities.length > 0 ? (
        <div className="pp-chars">
          {activeAffinities.map(a => {
            const lastTs = (() => {
              try {
                const raw = localStorage.getItem(chatHistoryKey(a.character_id))
                if (!raw) return null
                const msgs = JSON.parse(raw)
                return msgs?.[msgs.length - 1]?.ts ?? null
              } catch { return null }
            })()
            return (
              <button
                key={a.character_id}
                className="pp-char-card"
                style={{ '--cc': a.char.themeColor, '--cg': a.char.gradient }}
                onClick={() => navigate(ROUTES.CHAT_CHARACTER(a.character_id))}
              >
                <div className="pp-char-card__img-wrap">
                  <img src={a.char.image} alt={a.char.name} className="pp-char-card__img" loading="lazy" decoding="async" />
                  <div className="pp-char-card__fade" />
                </div>
                <div className="pp-char-card__body">
                  <span className="pp-char-card__level">{getAffinityEmoji(a.level)} {getAffinityLabel(a.level)}</span>
                  <span className="pp-char-card__name">{a.char.name}</span>
                  <span className="pp-char-card__msgs">{a.message_count} mensajes</span>
                  {lastTs && <span className="pp-char-card__last">{timeAgo(lastTs)}</span>}
                </div>
                <div className="pp-char-card__enter">Chatear →</div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="pp-empty-cta" onClick={() => navigate(ROUTES.CHAT)}>
          <span className="pp-empty-cta__icon">💬</span>
          <div>
            <p className="pp-empty-cta__title">Todavía no tenés afinidad con ningún personaje</p>
            <p className="pp-empty-cta__sub">Chateá 5 mensajes con alguno para empezar →</p>
          </div>
        </div>
      )}
    </section>
  )
}
