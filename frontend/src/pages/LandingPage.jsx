import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { characters } from '../data/characters'
import { FEATURED_LIST } from '../data/featured'
import { missions } from '../data/missions'
import { loadSession, timeAgo } from '../utils/session'
import { pickByDay } from '../utils/daily'
import { useStreak } from '../hooks/useStreak'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import DailyChallenge from '../components/DailyChallenge/DailyChallenge'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api.js'
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

const CONVERSATION_PREVIEWS = [
  {
    characterId: 'walter-white',
    user: '¿Te arrepentís de algo?',
    reply: 'El arrepentimiento es para la gente débil. Pero... a veces, a las 3 de la mañana, me pregunto quién sería si hubiera aceptado el dinero de Grey Matter hace veinte años. Nada de esto hubiera pasado. Eso no es arrepentimiento. Es curiosidad.',
  },
  {
    characterId: 'sherlock',
    user: '¿Cómo sabés en qué estoy pensando?',
    reply: 'No lo sé. Lo deduzco. Tu mirada fue hacia la izquierda antes de hablar — recuerdo episódico, no lógico. Tus manos están cruzadas pero los pulgares apuntan hacia arriba. Defensivo pero seguro. Pensás que tengo razón, y eso te incomoda.',
  },
  {
    characterId: 'john-wick',
    user: '¿Por qué seguís en esto?',
    reply: 'Porque me sacaron lo único que me quedaba. Después de eso no hay razón para parar. Solo el siguiente paso.',
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
  const [onlineCount, setOnlineCount] = useState(null)
  const [communityChars, setCommunityChars] = useState([])
  const sidRef = useRef(null)
  const heroRef                       = useRef(null)
  const lpRef                         = useRef(null)
  const carouselPaused                = useRef(false)

  const featured     = FEATURED_LIST[featuredIdx]
  const featuredChar = featured ? characters.find(c => c.id === featured.characterId) : null
  const heroChars    = HERO_CHAR_IDS.map(id => characters.find(c => c.id === id)).filter(Boolean)
  const session      = loadSession()
  const sessionChar  = session ? characters.find(c => c.id === session.characterId) : null
  const { streak }   = useStreak()


  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('custom_characters')
      .select('id, name, emoji, color, avatar_url, description')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setCommunityChars(data) })
  }, [user])

  useEffect(() => {
    const root = lpRef.current
    if (!root) return
    const targets = root.querySelectorAll('.lp-reveal')
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-reveal--visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -24px 0px' }
    )
    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (carouselPaused.current) return
      setFeaturedFade(false)
      setTimeout(() => {
        setFeaturedIdx(i => (i + 1) % FEATURED_LIST.length)
        setFeaturedFade(true)
      }, 750)
    }, ROTATE_INTERVAL)
    return () => clearInterval(id)
  }, [])

  // Online counter — ping every 20s
  useEffect(() => {
    if (!sidRef.current) {
      let stored = localStorage.getItem('echo_sid')
      if (!stored) {
        stored = Math.random().toString(36).slice(2, 18)
        localStorage.setItem('echo_sid', stored)
      }
      sidRef.current = stored
    }
    const ping = () => {
      fetch(`${API_URL}/online/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid: sidRef.current }),
      })
        .then(r => r.json())
        .then(d => setOnlineCount(d.online))
        .catch(() => {})
    }
    ping()
    const id = setInterval(ping, 20_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`lp ${visible ? 'lp--visible' : ''}`} ref={lpRef}>
      <Helmet>
        <title>EchoVerse — Chateá con personajes ficticios usando IA</title>
        <meta name="description" content="Conversá con Darth Vader, Sherlock Holmes, Walter White y más de 60 personajes icónicos del cine y la TV. Decisiones reales, respuestas únicas." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/" />
        <meta property="og:url" content="https://echoverse-jet.vercel.app/" />
      </Helmet>

      {/* Film grain overlay */}
      <div className="lp-grain" aria-hidden="true" />

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="lp-hero" ref={heroRef}>

        {/* Character depth collage */}
        <div className="lp-hero-collage" aria-hidden="true">
          {heroChars.map((c, i) => (
            <div key={c.id} className={`lp-hero-collage__char lp-hero-collage__char--${i}`}>
              <img src={c.image} alt="" draggable={false} fetchpriority={i === 0 ? "high" : "auto"} />
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
            <button
              className="lp-btn lp-btn--primary"
              onClick={() => navigate(ROUTES.MODOS)}
            >
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

        {/* Continue session pill */}
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

        {/* Auth pill */}
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

        {/* Scroll hint */}
        <div className="lp-hero-scroll-hint" aria-hidden="true">
          <span>SCROLL</span>
          <div className="lp-hero-scroll-hint__bar" />
        </div>
      </section>

      {/* ─── DAILY CHALLENGE ──────────────────────────────────────────── */}
      {user && (
        <section className="lp-daily">
          <div className="lp-container">
            {streak.current > 0 && (
              <div className="lp-streak-badge">
                <span className="lp-streak-badge__fire">🔥</span>
                <span className="lp-streak-badge__text">
                  Racha de <strong>{streak.current} {streak.current === 1 ? 'día' : 'días'}</strong> · No la rompas
                </span>
              </div>
            )}
            <DailyChallenge />
          </div>
        </section>
      )}

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
              onMouseEnter={() => { carouselPaused.current = true }}
              onMouseLeave={() => { carouselPaused.current = false }}
            >
              <div className="lp-featured-card__ambient" />
              <div className="lp-featured-card__body">
                <span className="lp-featured-badge">{featured.badge}</span>
                <h2 className="lp-featured-card__title">
                  {featured.hook}
                  <em className="lp-featured-card__accent"> {featured.hookAccent}</em>
                </h2>
                <p className="lp-featured-card__charname">{featuredChar.name}</p>
                {featuredChar.quotes?.length > 0 && (
                  <blockquote className="lp-featured-quote">
                    "{pickByDay(featuredChar.quotes)}"
                  </blockquote>
                )}
                <button
                  className="lp-featured-card__cta"
                  onClick={e => { e.stopPropagation(); navigate(featured.route) }}
                >
                  {featured.cta} <ArrowIcon size={13} />
                </button>
              </div>
              <div className="lp-featured-card__visual">
                <img src={featuredChar.image} alt={featuredChar.name} loading="lazy" decoding="async" />
                <div className="lp-featured-card__visual-fade" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── CONVERSATION PREVIEWS ────────────────────────────────────── */}
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
              const char = characters.find(c => c.id === preview.characterId)
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

      {/* ─── CAST ─────────────────────────────────────────────────────── */}
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

      {/* ─── COMMUNITY ─────────────────────────────────────────────── */}
      {user && communityChars.length > 0 && (
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
        </section>
      )}

      {/* ─── MODES ────────────────────────────────────────────────────── */}
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

          {/* Protagonist blocks */}
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

          {/* Divider */}
          <div className="lp-modes-also">
            <span>TAMBIÉN DISPONIBLE</span>
          </div>

          {/* Secondary cards */}
          <div className="lp-mode-cards">
            {SECONDARY_MODES.map((m, i) => {
              const char = characters.find(c => c.id === m.characterId)
              return (
                <button
                  key={m.label}
                  className="lp-mode-card lp-reveal"
                  style={{ '--mc': m.color, '--reveal-delay': `${i * 0.1}s` }}
                  onClick={() => navigate(m.route)}
                >
                  {char && (
                    <div className="lp-mode-card__img-wrap">
                      <img src={char.image} alt={char.name} className="lp-mode-card__img" loading="lazy" decoding="async" />
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
          <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={() => navigate(ROUTES.MODOS)}>
            Entrar ahora <ArrowIcon size={17} />
          </button>
        </div>
      </section>

      {/* ─── ABOUT ────────────────────────────────────────────────────── */}
      <section className="lp-about">
        <div className="lp-container lp-about__inner">
          <div className="lp-about__avatar">
            <img src="/images/yo.jfif" alt="Cristian Micchele" loading="lazy" decoding="async" />
          </div>
          <div className="lp-about__body">
            <span className="lp-eyebrow">SOBRE EL CREADOR</span>
            <h2 className="lp-about__name">Cristian Micchele</h2>
            <p className="lp-about__bio">
              Full-stack developer apasionado por crear experiencias web que se sienten distintas.
              EchoVerse nació de combinar inteligencia artificial con personajes que ya amás.
            </p>
            <div className="lp-about__links">
              <a href="https://github.com/cristian-micchele-dev" target="_blank" rel="noopener noreferrer" className="lp-about__link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/cristianmicchele/" target="_blank" rel="noopener noreferrer" className="lp-about__link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <span className="lp-footer__logo">ECHOVERSE</span>
          <span className="lp-footer__powered">Powered by Mistral AI</span>
          <span className="lp-footer__year">© 2026</span>
        </div>
      </footer>

      {/* ─── ONLINE COUNTER ───────────────────────────────────────────── */}
      {onlineCount !== null && (
        <div className="lp-online">
          <span className="lp-online__dot" />
          {onlineCount} {onlineCount === 1 ? 'persona online' : 'personas online'}
        </div>
      )}

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
