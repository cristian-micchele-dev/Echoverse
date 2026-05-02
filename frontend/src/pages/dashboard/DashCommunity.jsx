import { ROUTES } from '../../utils/constants'

export default function DashCommunity({ communityChars, navigate }) {
  if (!communityChars.length) return null

  return (
    <section className="dash-section">
      <div className="dash-section-header">
        <span className="dash-eyebrow">Comunidad <span className="dash-eyebrow__rule" /></span>
        <h2 className="dash-section-title">Creados por<br /><em>jugadores.</em></h2>
      </div>
      <div className="dash-community-rail">
        {communityChars.map(char => (
          <button
            key={char.id}
            className="dash-community-card"
            style={{ '--ci-color': char.color || '#7252E8' }}
            onClick={() => navigate(`/chat/custom-${char.id}`)}
          >
            <div className="dash-community-card__avatar">
              {char.avatar_url
                ? <img src={char.avatar_url} alt={char.name} loading="lazy" />
                : <span className="dash-community-card__emoji">{char.emoji || '🤖'}</span>
              }
              <div className="dash-community-card__glow" />
            </div>
            <div className="dash-community-card__body">
              <span className="dash-community-card__badge">🌐 Comunidad</span>
              <span className="dash-community-card__name">{char.name}</span>
              {char.description && (
                <span className="dash-community-card__desc">
                  {char.description.length > 55 ? char.description.slice(0, 55) + '…' : char.description}
                </span>
              )}
            </div>
            <div className="dash-community-card__cta">Chatear →</div>
          </button>
        ))}
      </div>
      <button
        className="dash-community-ver-todos"
        onClick={() => navigate(ROUTES.COMUNIDAD)}
      >
        Ver todos los personajes de la comunidad →
      </button>
    </section>
  )
}
