export default function CommunitySection({ communityChars, navigate }) {
  if (!communityChars.length) return null
  return (
    <section className="lp-community">
      <div className="lp-container">
        <div className="lp-section-header">
          <span className="lp-eyebrow lp-eyebrow--inline">
            COMUNIDAD
            <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
          </span>
          <h2 className="lp-section-title">
            Creados por<br /><em>jugadores.</em>
          </h2>
          <p className="lp-community__sub">Personajes diseñados por otros usuarios. Explorá, chateá, descubrí.</p>
        </div>
      </div>

      <div className="lp-community-rail">
        {communityChars.map(char => (
          <button
            key={char.id}
            className="lp-community-card"
            style={{ '--ci-color': char.color || '#7252E8' }}
            onClick={() => navigate(`/chat/custom-${char.id}`)}
          >
            <div className="lp-community-card__avatar">
              {char.avatar_url
                ? <img src={char.avatar_url} alt={char.name} loading="lazy" />
                : <span className="lp-community-card__emoji">{char.emoji || '🤖'}</span>
              }
              <div className="lp-community-card__glow" />
            </div>
            <div className="lp-community-card__body">
              <span className="lp-community-card__badge">🌐 Comunidad</span>
              <span className="lp-community-card__name">{char.name}</span>
              {char.description && (
                <span className="lp-community-card__desc">
                  {char.description.length > 60 ? char.description.slice(0, 60) + '…' : char.description}
                </span>
              )}
            </div>
            <div className="lp-community-card__enter">
              Chatear →
            </div>
          </button>
        ))}
      </div>

      <div className="lp-container">
        <div className="lp-community__footer">
          <button className="lp-community__ver-todos" onClick={() => navigate('/comunidad')}>
            Ver todos los personajes personalizados →
          </button>
        </div>
      </div>
    </section>
  )
}
