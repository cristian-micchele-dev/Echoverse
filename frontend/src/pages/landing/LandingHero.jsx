import { characters } from '../../data/characters'
import { ROUTES } from '../../utils/constants'
import { timeAgo } from '../../utils/session'
import ArrowIcon from './ArrowIcon.jsx'

export default function LandingHero({ heroChars, session, sessionChar, user, navigate }) {
  return (
    <section className="lp-hero">

      <div className="lp-hero-collage" aria-hidden="true">
        {heroChars.map((c, i) => (
          <div key={c.id} className={`lp-hero-collage__char lp-hero-collage__char--${i}`}>
            <img src={c.image} alt="" draggable={false} fetchpriority={i === 0 ? "high" : "auto"} />
          </div>
        ))}
        <div className="lp-hero-collage__vignette" />
      </div>

      <div className="lp-hero-scan" aria-hidden="true" />

      <div className="lp-hero-body">
        <span className="lp-hero-eyebrow">Universos Ficticios</span>

        <h1 className="lp-hero-title">
          <span className="lp-hero-title__solid">ECHO</span>
          <span className="lp-hero-title__ghost">VERSE</span>
        </h1>

        <div className="lp-hero-tagline">
          <p className="lp-hero-tagline__a">Chateá con Darth Vader, Sherlock, Walter White y más.</p>
          <p className="lp-hero-tagline__b">IA que nunca rompe el personaje. En español.</p>
        </div>

        <div className="lp-hero-meta">
          <span>Personajes icónicos</span>
          <span className="lp-hero-meta__sep" aria-hidden="true" />
          <span>IA en personaje</span>
          <span className="lp-hero-meta__sep" aria-hidden="true" />
          <span>En español</span>
        </div>

        <div className="lp-hero-actions">
          <button className="lp-btn lp-btn--primary" onClick={() => navigate(ROUTES.MODOS)}>
            Entrar al universo
            <ArrowIcon />
          </button>
          <button className="lp-btn lp-btn--ghost" onClick={() => navigate(ROUTES.MISSION)}>
            Ver misiones
          </button>
        </div>

        <div className="lp-hero-stats">
          <div className="lp-hero-stat">
            <span className="lp-hero-stat__num">{characters.length}</span>
            <span className="lp-hero-stat__label">Personajes</span>
          </div>
          <div className="lp-hero-stats__rule" />
          <div className="lp-hero-stat">
            <span className="lp-hero-stat__num">10+</span>
            <span className="lp-hero-stat__label">Modos de juego</span>
          </div>
          <div className="lp-hero-stats__rule" />
          <div className="lp-hero-stat">
            <span className="lp-hero-stat__num">∞</span>
            <span className="lp-hero-stat__label">Historias posibles</span>
          </div>
        </div>
      </div>

      {session && sessionChar && (
        <button
          className="lp-hero-resume lp-hero-resume--active"
          onClick={() => navigate(session.route || ROUTES.CHAT_CHARACTER(sessionChar.id))}
        >
          <img src={sessionChar.image} alt={sessionChar.name} className="lp-hero-resume__avatar" loading="lazy" decoding="async" />
          <span className="lp-hero-resume__body">
            <span className="lp-hero-resume__label">
              Seguís con <strong>{sessionChar.name}</strong> · {timeAgo(session.timestamp)}
            </span>
            {session.lastMessage && (
              <span className="lp-hero-resume__last">
                "{session.lastMessage.slice(0, 60)}{session.lastMessage.length > 60 ? '…' : ''}"
              </span>
            )}
          </span>
          <ArrowIcon size={12} />
        </button>
      )}

      <div className="lp-auth-pill">
        {user ? (
          <button className="lp-auth-pill__btn lp-auth-pill__btn--logged" onClick={() => navigate(ROUTES.PERFIL)}>
            <span className="lp-auth-pill__avatar">
              {(user.user_metadata?.username || user.email)?.[0]?.toUpperCase()}
            </span>
            <span>{user.user_metadata?.username || 'Mi perfil'}</span>
          </button>
        ) : (
          <>
            <span className="lp-auth-pill__nudge">Tu progreso solo se guarda en este dispositivo.</span>
            <button className="lp-auth-pill__btn" onClick={() => navigate(ROUTES.AUTH)}>Registrate</button>
          </>
        )}
      </div>

      <div className="lp-hero-scroll-hint" aria-hidden="true">
        <span>SCROLL</span>
        <div className="lp-hero-scroll-hint__bar" />
      </div>
    </section>
  )
}
