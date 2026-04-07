import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { FEATURED_LIST } from '../data/featured'
import { missions } from '../data/missions'
import { loadSession, timeAgo } from '../utils/session'
import { useAuth } from '../context/AuthContext'
import './LandingPage.css'

/* ─── DATA ──────────────────────────────────────────────────────────────── */

const HERO_CHAR_IDS = ['john-wick', 'darth-vader', 'sherlock', 'walter-white', 'el-profesor', 'gandalf']

const CAST = [
  { id: 'john-wick',     quote: 'No confía en nadie. Ni en vos.',              tag: 'Silencio letal' },
  { id: 'sherlock',      quote: 'Ya te está leyendo. Desde que entraste.',      tag: 'Mente privilegiada' },
  { id: 'walter-white',  quote: 'Siempre sabe más de lo que dice.',             tag: 'Doble fondo' },
  { id: 'darth-vader',   quote: 'El miedo es tu primer paso hacia él.',         tag: 'Poder absoluto' },
  { id: 'el-profesor',   quote: 'Cada movida ya estaba calculada.',             tag: 'Estrategia fría' },
  { id: 'gandalf',       quote: 'Llega exactamente cuando debe llegar.',        tag: 'Sabiduría antigua' },
  { id: 'tony-stark',    quote: 'Genio, millonario, sin filtros. En ese orden.',tag: 'Sin filtros' },
  { id: 'jack-sparrow',  quote: 'Tiene un plan. Probablemente falla.',          tag: 'Caos controlado' },
]

const PROTAGONIST_MODES = [
  {
    id: 'mission',
    label: 'Modo Misión',
    eyebrow: 'HISTORIA INTERACTIVA',
    desc: 'Una misión real. Cada decisión tiene peso. Una equivocación puede costarte todo.',
    cta: 'Ver misiones',
    route: '/mission',
    accent: '#D4576B',
    tag: '4 MISIONES ACTIVAS',
    characterId: 'el-profesor',
  },
  {
    id: 'interrogation',
    label: 'Interrogatorio',
    eyebrow: 'DETECCIÓN DE MENTIRAS',
    desc: 'El personaje puede estar mintiendo. Detectá las contradicciones. Decidí si le creés.',
    cta: 'Iniciar interrogatorio',
    route: '/interrogation',
    accent: '#6D4AFF',
    tag: 'IA REACTIVA',
    characterId: 'walter-white',
  },
  {
    id: 'dilema',
    label: 'Dilemas',
    eyebrow: 'FILOSOFÍA INTERACTIVA',
    desc: 'Sin salida limpia. Solo la elección que podés defender ante él.',
    cta: 'Enfrentar el dilema',
    route: '/dilema',
    accent: '#C9954A',
    tag: 'SIN RESPUESTA CORRECTA',
    characterId: 'gandalf',
  },
]

const SECONDARY_MODES = [
  {
    num: '01',
    label: 'Chat con Personaje',
    eyebrow: 'Conversación IA',
    desc: 'Sin guión. Sin respuestas preparadas. Solo ellos, tal cual son, respondiendo en tiempo real.',
    route: '/chat',
    characterId: 'sherlock',
    color: '#70a8e0',
    duration: 'Sin límite',
    difficulty: 'Fácil',
    badge: '💬 Popular',
  },
  {
    num: '02',
    label: 'Adivina el Personaje',
    eyebrow: 'Trivia con puntaje',
    desc: 'Pistas de a una. Cuanto antes lo adivinás, más puntos conseguís. Cada pista baja tu score.',
    route: '/guess',
    characterId: 'gollum',
    color: '#7aab6e',
    duration: '~3 min',
    difficulty: 'Medio',
    badge: '🧩 Trivia',
  },
  {
    num: '03',
    label: 'Swipe',
    eyebrow: 'Respuesta rápida',
    desc: 'Verdad o mentira. Tenés segundos para decidir. ¿Cuánto los conocés realmente?',
    route: '/swipe',
    characterId: 'tony-stark',
    color: '#e87040',
    duration: '~2 min',
    difficulty: 'Rápido',
    badge: '⚡ Rápido',
  },
]

const PILLARS = [
  { num: '01', title: 'IA que no rompe el personaje', desc: 'Responden con su voz, su lógica y sus contradicciones. Nunca salen del rol.' },
  { num: '02', title: 'Decisiones con consecuencias', desc: 'No hay respuestas correctas automáticas. Lo que elegís cambia el rumbo de la historia.' },
  { num: '03', title: 'Universos que reconocés',      desc: 'Personajes que ya conocés, en situaciones que nunca esperabas.' },
  { num: '04', title: 'Rejugable por diseño',         desc: 'Cada sesión es única. La IA nunca repite la misma historia dos veces.' },
]

/* ─── COMPONENT ─────────────────────────────────────────────────────────── */

const ROTATE_INTERVAL = 6000 // ms entre slides

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [visible, setVisible]         = useState(false)
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const [featuredFade, setFeaturedFade] = useState(true)
  const [scrolled, setScrolled]       = useState(false)
  const heroRef                       = useRef(null)

  const featured     = FEATURED_LIST[featuredIdx]
  const featuredChar = featured ? characters.find(c => c.id === featured.characterId) : null
  const heroChars    = HERO_CHAR_IDS.map(id => characters.find(c => c.id === id)).filter(Boolean)
  const session      = loadSession()
  const sessionChar  = session ? characters.find(c => c.id === session.characterId) : null

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setFeaturedFade(false)
      setTimeout(() => {
        setFeaturedIdx(i => (i + 1) % FEATURED_LIST.length)
        setFeaturedFade(true)
      }, 750)
    }, ROTATE_INTERVAL)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`lp ${visible ? 'lp--visible' : ''}`}>

      {/* Film grain overlay */}
      <div className="lp-grain" aria-hidden="true" />

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="lp-hero" ref={heroRef}>

        {/* Character depth collage */}
        <div className="lp-hero-collage" aria-hidden="true">
          {heroChars.map((c, i) => (
            <div key={c.id} className={`lp-hero-collage__char lp-hero-collage__char--${i}`}>
              <img src={c.image} alt="" draggable={false} />
            </div>
          ))}
          <div className="lp-hero-collage__vignette" />
        </div>

        {/* Scan line animation */}
        <div className="lp-hero-scan" aria-hidden="true" />

        {/* Content */}
        <div className="lp-hero-body">

          <span className="lp-hero-eyebrow">Universos Ficticios</span>

          <h1 className="lp-hero-title">
            <span className="lp-hero-title__solid">ECHO</span>
            <span className="lp-hero-title__ghost">VERSE</span>
          </h1>

          <div className="lp-hero-tagline">
            <p className="lp-hero-tagline__a">Cada palabra tiene peso.</p>
            <p className="lp-hero-tagline__b">Cada decisión, un precio.</p>
          </div>

          <div className="lp-hero-actions">
            <button className="lp-btn lp-btn--primary" onClick={() => navigate('/modos')}>
              Entrar al universo
              <ArrowIcon />
            </button>
            <button className="lp-btn lp-btn--ghost" onClick={() => navigate('/mission')}>
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
              <span className="lp-hero-stat__num">6</span>
              <span className="lp-hero-stat__label">Modos de juego</span>
            </div>
            <div className="lp-hero-stats__rule" />
            <div className="lp-hero-stat">
              <span className="lp-hero-stat__num">∞</span>
              <span className="lp-hero-stat__label">Historias posibles</span>
            </div>
          </div>
        </div>

        {/* Continue session pill */}
        {session && sessionChar && (
          <button
            className="lp-hero-resume"
            onClick={() => navigate(session.route || `/chat/${sessionChar.id}`)}
          >
            <img src={sessionChar.image} alt={sessionChar.name} className="lp-hero-resume__avatar" />
            <span className="lp-hero-resume__text">
              Seguís con <strong>{sessionChar.name}</strong> · {timeAgo(session.timestamp)}
            </span>
            <ArrowIcon size={12} />
          </button>
        )}

        {/* Auth pill */}
        <div className="lp-auth-pill">
          {user ? (
            <button className="lp-auth-pill__btn lp-auth-pill__btn--logged" onClick={() => navigate('/perfil')}>
              <span className="lp-auth-pill__avatar">{user.email?.[0]?.toUpperCase()}</span>
              <span>Mi perfil</span>
            </button>
          ) : (
            <>
              <span className="lp-auth-pill__nudge">Tu progreso solo se guarda en este dispositivo.</span>
              <button className="lp-auth-pill__btn" onClick={() => navigate('/auth')}>Registrate</button>
            </>
          )}
        </div>

        {/* Scroll hint */}
        <div className="lp-hero-scroll-hint" aria-hidden="true">
          <span>SCROLL</span>
          <div className="lp-hero-scroll-hint__bar" />
        </div>
      </section>

      {/* ─── FEATURED TODAY ───────────────────────────────────────────── */}
      {featured && featuredChar && (
        <section className="lp-featured">
          <div className="lp-container">
            <div className="lp-section-label">
              <span className="lp-section-label__title">DESTACADO</span>
              <div className="lp-featured-dots">
                {FEATURED_LIST.map((_, i) => (
                  <button
                    key={i}
                    className={`lp-featured-dot${i === featuredIdx ? ' lp-featured-dot--active' : ''}`}
                    onClick={() => { setFeaturedFade(false); setTimeout(() => { setFeaturedIdx(i); setFeaturedFade(true) }, 750) }}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div
              className={`lp-featured-card${featuredFade ? ' lp-featured-card--visible' : ''}`}
              style={{ '--char-color': featuredChar.themeColor, '--char-gradient': featuredChar.gradient }}
              onClick={() => navigate(featured.route)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(featured.route)}
            >
              <div className="lp-featured-card__ambient" />
              <div className="lp-featured-card__body">
                <span className="lp-featured-badge">{featured.badge}</span>
                <h2 className="lp-featured-card__title">
                  {featured.hook}
                  <em className="lp-featured-card__accent"> {featured.hookAccent}</em>
                </h2>
                <p className="lp-featured-card__charname">{featuredChar.name}</p>
                <button
                  className="lp-featured-card__cta"
                  onClick={e => { e.stopPropagation(); navigate(featured.route) }}
                >
                  {featured.cta} <ArrowIcon size={13} />
                </button>
              </div>
              <div className="lp-featured-card__visual">
                <img src={featuredChar.image} alt={featuredChar.name} />
                <div className="lp-featured-card__visual-fade" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── MODES ────────────────────────────────────────────────────── */}
      <section className="lp-modes">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-eyebrow lp-eyebrow--inline">
              MODOS DE JUEGO
              <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
            </span>
            <h2 className="lp-section-title">
              Elegí cómo<br /><em>entrás.</em>
            </h2>
          </div>

          {/* Protagonist blocks */}
          <div className="lp-mode-blocks">
            {PROTAGONIST_MODES.map((mode, i) => {
              const char = characters.find(c => c.id === mode.characterId)
              return (
                <article
                  key={mode.id}
                  className={`lp-mode-block${i % 2 === 1 ? ' lp-mode-block--flip' : ''}`}
                  style={{ '--accent': mode.accent }}
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
                  {char && (
                    <div className="lp-mode-block__visual">
                      <img src={char.image} alt={char.name} />
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

          {/* Divider */}
          <div className="lp-modes-also">
            <span>TAMBIÉN DISPONIBLE</span>
          </div>

          {/* Secondary cards */}
          <div className="lp-mode-cards">
            {SECONDARY_MODES.map(m => {
              const char = characters.find(c => c.id === m.characterId)
              return (
                <button
                  key={m.label}
                  className="lp-mode-card"
                  style={{ '--mc': m.color }}
                  onClick={() => navigate(m.route)}
                >
                  {char && (
                    <div className="lp-mode-card__img-wrap">
                      <img src={char.image} alt={char.name} className="lp-mode-card__img" />
                      <div className="lp-mode-card__img-fade" />
                    </div>
                  )}
                  <div className="lp-mode-card__body">
                    {m.badge && <span className="lp-mode-card__badge">{m.badge}</span>}
                    <span className="lp-mode-card__eyebrow">{m.eyebrow}</span>
                    <span className="lp-mode-card__title">{m.label}</span>
                    <p className="lp-mode-card__desc">{m.desc}</p>
                    <div className="lp-mode-card__stats">
                      <span>⏱ {m.duration}</span>
                      <span className="lp-mode-card__dot" />
                      <span>🎯 {m.difficulty}</span>
                    </div>
                  </div>
                  <div className="lp-mode-card__cta">
                    Ir al modo <ArrowSmallIcon />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CAST ─────────────────────────────────────────────────────── */}
      <section className="lp-cast">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-eyebrow lp-eyebrow--inline">
              ELENCO
              <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
            </span>
            <h2 className="lp-section-title">
              Ya están<br /><em>adentro.</em>
            </h2>
          </div>
        </div>

        <div className="lp-cast-rail">
          {CAST.map(fc => {
            const char = characters.find(c => c.id === fc.id)
            if (!char) return null
            return (
              <button
                key={fc.id}
                className="lp-cast-card"
                style={{ '--char-color': char.themeColor }}
                onClick={() => navigate(`/chat/${fc.id}`)}
              >
                <div className="lp-cast-card__portrait">
                  <img src={char.image} alt={char.name} />
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

          <button className="lp-cast-card lp-cast-card--more" onClick={() => navigate('/chat')}>
            <span className="lp-cast-card--more__num">+{characters.length - CAST.length}</span>
            <span className="lp-cast-card--more__label">Ver todos<br />los personajes</span>
          </button>
        </div>
      </section>

      {/* ─── WHY ──────────────────────────────────────────────────────── */}
      <section className="lp-why">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-eyebrow lp-eyebrow--inline">
              POR QUÉ ECHOVERSE
              <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
            </span>
            <h2 className="lp-section-title">
              No es roleplay.<br /><em>Es otra cosa.</em>
            </h2>
          </div>

          <div className="lp-pillars">
            {PILLARS.map(p => (
              <div key={p.num} className="lp-pillar">
                <span className="lp-pillar__num">{p.num}</span>
                <h3 className="lp-pillar__title">{p.title}</h3>
                <p className="lp-pillar__desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="lp-end">
        <div className="lp-end__ambient" aria-hidden="true" />
        <div className="lp-container lp-end__inner">
          <span className="lp-eyebrow">¿ESTÁS LISTO?</span>
          <h2 className="lp-end__title">
            No viniste a mirar.<br />
            <em>Viniste a decidir.</em>
          </h2>
          <p className="lp-end__sub">El universo te espera. Los personajes, también.</p>
          <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={() => navigate('/modos')}>
            Entrar ahora <ArrowIcon size={17} />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <span className="lp-footer__logo">ECHOVERSE</span>
          <span className="lp-footer__powered">Powered by Groq · Llama 3.3</span>
          <span className="lp-footer__year">© 2025</span>
        </div>
      </footer>

      {/* ─── SCROLL TO TOP ────────────────────────────────────────────── */}
      <button
        className={`lp-scroll-top${scrolled ? ' lp-scroll-top--visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 12V4M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

    </div>
  )
}

/* ─── MICRO-COMPONENTS ───────────────────────────────────────────────────── */

function ArrowIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ArrowSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
