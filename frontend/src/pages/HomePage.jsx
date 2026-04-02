import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { pickByDay, shuffleByDay } from '../utils/daily'
import { loadSession, clearSession, timeAgo, hoursUntilMidnight } from '../utils/session'
import { DAILY_HOOKS } from '../data/hooks'
import { FEATURED_LIST } from '../data/featured'
import { missions } from '../data/missions'
import './HomePage.css'

const BG_IMAGES = [...characters, ...characters]

const MODES_LANDING = [
  {
    eyebrow: 'Conversación con IA',
    title: 'Chat con Personaje',
    desc: 'Hablás directamente con él. Sin guión, sin respuestas programadas. Responde en tiempo real con su propia voz, desde su universo.',
    tags: ['IA en vivo', '1 o 2 personajes', 'Sin límite'],
    duration: 'Sin límite',
    difficulty: 'Fácil',
    idealFor: 'Preguntar por su historia, lanzar dilemas, debatir o simplemente charlar.',
    cta: 'Elegir personaje',
    route: '/chat',
    characterId: 'sherlock',
    color: '#70a8e0',
    badge: '💬 Popular',
  },
  {
    eyebrow: 'Historia interactiva',
    title: 'Modo Misión',
    desc: 'El personaje te da una misión real. Cada decisión que tomás cambia el rumbo de la historia. Una equivocación puede costarte todo.',
    tags: ['Decisiones', 'Historia ramificada', '5–10 min'],
    duration: '~10 min',
    difficulty: 'Difícil',
    idealFor: 'Los que quieren narrativa, decisiones con peso real y una historia que cambia según sus elecciones.',
    cta: 'Ver misiones',
    route: '/mission',
    characterId: 'el-profesor',
    color: '#e05060',
    badge: '★ Destacado',
    missions: true,
  },
  {
    eyebrow: 'Detección de mentiras',
    title: 'Interrogatorio',
    desc: 'El personaje puede estar mintiendo. Hacé las preguntas correctas, detectá las contradicciones y decidí si le creés.',
    tags: ['Deducción', 'IA reactiva', 'Tensión'],
    duration: '~8 min',
    difficulty: 'Medio',
    idealFor: 'Los que quieren tensión, deducción y el desafío de descubrir si el personaje les está mintiendo.',
    cta: 'Iniciar interrogatorio',
    route: '/interrogation',
    characterId: 'walter-white',
    color: '#7ec87e',
    badge: '🔦 Tenso',
  },
  {
    eyebrow: 'Filosofía interactiva',
    title: 'Dilemas',
    desc: 'El personaje te pone en una situación sin salida limpia. No hay respuesta correcta. Solo la elección que podés defender ante él.',
    tags: ['Sin respuesta correcta', 'Argumento libre', 'Reflexión'],
    duration: '~5 min',
    difficulty: 'Reflexivo',
    idealFor: 'Pensar en voz alta, defender una postura o explorar los grises morales de un universo ficticio.',
    cta: 'Enfrentar el dilema',
    route: '/dilema',
    characterId: 'gandalf',
    color: '#a08cdc',
    badge: '◈ Filosófico',
  },
  {
    eyebrow: 'Trivia con puntaje',
    title: 'Adivina el Personaje',
    desc: 'Te dan pistas de a una. Cuanto antes lo adivinás, más puntos conseguís. Cada pista que pedís baja tu score.',
    tags: ['Pistas progresivas', 'Puntaje', 'Récord personal'],
    duration: '~3 min',
    difficulty: 'Medio',
    idealFor: 'Poner a prueba cuánto conocés los personajes y competir contra tu propio récord.',
    cta: 'Adivinar ahora',
    route: '/guess',
    characterId: 'gollum',
    color: '#7aab6e',
    badge: '🧩 Trivia',
  },
  {
    eyebrow: 'Respuesta rápida',
    title: 'Swipe',
    desc: 'El personaje hace una afirmación. Verdad o mentira — tenés segundos para decidir. ¿Cuánto los conocés realmente?',
    tags: ['Verdad / Mentira', 'Rápido'],
    duration: '~2 min',
    difficulty: 'Rápido',
    idealFor: 'Una partida corta para probar tus reflejos y tu conocimiento del universo del personaje.',
    cta: 'Empezar',
    route: '/swipe',
    characterId: 'tony-stark',
    color: '#e87040',
    badge: '⚡ Rápido',
  },
]

function HookWords({ text }) {
  return text.split(' ').map((word, i) => (
    <span key={i} className="home-hook__word" style={{ '--wi': i }}>
      {word}{' '}
    </span>
  ))
}

export default function HomePage() {
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(hoursUntilMidnight())
  const navigate = useNavigate()

  const hook = pickByDay(DAILY_HOOKS)
  const featured = pickByDay(FEATURED_LIST)
  const featuredChar = characters.find(c => c.id === featured?.characterId)
  const popularChars = shuffleByDay(characters).slice(0, 8)
  const [session, setSession] = useState(() => loadSession())
  const sessionChar = session ? characters.find(c => c.id === session.characterId) : null

  function handleClearSession(e) {
    e.stopPropagation()
    clearSession()
    setSession(null)
  }

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCountdown(hoursUntilMidnight()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* ── Fondo animado ── */}
      <div className={`home-bg ${visible ? 'home-bg--visible' : ''}`} aria-hidden="true">
        <div className="home-bg-track home-bg-track--1">
          {BG_IMAGES.map((c, i) => (
            <img key={i} src={c.image} alt="" className="home-bg-img" draggable={false} />
          ))}
        </div>
        <div className="home-bg-track home-bg-track--2">
          {BG_IMAGES.map((c, i) => (
            <img key={i} src={c.image} alt="" className="home-bg-img" draggable={false} />
          ))}
        </div>
        <div className="home-bg-overlay" />
      </div>

      <div className={`home ${visible ? 'home--visible' : ''}`}>

        {/* ── HERO ── */}
        <header className="home-header">
          <div className="home-particles">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="home-particle" style={{ '--i': i }} />
            ))}
          </div>
          <div className="home-title-wrap">
            <span className="home-title-eyebrow">
              <span className="home-title-eyebrow__line" />
              Universos Ficticios
              <span className="home-title-eyebrow__line" />
            </span>
            <div className="home-title-wrap-glow">
              <h1 className="home-title">EchoVerse</h1>
            </div>
            <div className="home-title-divider"><span className="home-title-divider__gem" /></div>
            <p className="home-subtitle">Conversá, jugá y tomá decisiones con los personajes más icónicos de la ficción</p>

            {/* HOOK DINÁMICO */}
            {hook && (
              <div className="home-hook">
                <p
                  className="home-hook__text"
                  onClick={hook.route ? () => navigate(hook.route) : undefined}
                  style={hook.route ? { cursor: 'pointer' } : {}}
                >
                  <HookWords text={hook.text} />
                  {hook.route && (
                    <svg className="home-hook__arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </p>
                {hook.sub && <p className="home-hook__sub">{hook.sub}</p>}
              </div>
            )}
          </div>
        </header>

        {/* ── CONTINUAR ── */}
        {session && sessionChar && (
          <section className="home-resume">
            <div
              className="home-resume__card"
              style={{ '--char-color': sessionChar.themeColor }}
              onClick={() => navigate(session.route || `/chat/${sessionChar.id}`)}
            >
              <div className="home-resume__img-wrap">
                <img src={sessionChar.image} alt={sessionChar.name} className="home-resume__img" />
              </div>
              <div className="home-resume__info">
                <span className="home-resume__eyebrow">Seguís donde lo dejaste</span>
                <span className="home-resume__char">{sessionChar.name}</span>
                <span className="home-resume__meta">{session.modeLabel} · {timeAgo(session.timestamp)}</span>
                {session.lastMessage && (
                  <span className="home-resume__quote">
                    "{session.lastMessage.length > 72 ? session.lastMessage.slice(0, 72) + '…' : session.lastMessage}"
                  </span>
                )}
              </div>
              <button className="home-resume__cta" onClick={e => { e.stopPropagation(); navigate(session.route || `/chat/${sessionChar.id}`) }}>
                Retomar
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="home-resume__dismiss" onClick={handleClearSession} title="Quitar">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* ── DESTACADO DEL DÍA ── */}
        {featured && featuredChar && (
          <section className="home-featured-section">
            <div className="home-featured-meta">
              <span className="home-featured-eyebrow">Destacado del día</span>
              <span className="home-featured-countdown">Cambia en {countdown}</span>
            </div>
            <div
              className="home-featured-card"
              style={{ '--char-color': featuredChar.themeColor, '--char-gradient': featuredChar.gradient }}
              onClick={() => navigate(featured.route)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(featured.route)}
            >
              <div className="home-featured-card__body">
                <span className="home-featured-card__badge">{featured.badge}</span>
                <h2 className="home-featured-card__hook">
                  {featured.hook}
                  <span className="home-featured-card__hook-accent"> {featured.hookAccent}</span>
                </h2>
                <button
                  className="home-featured-card__cta"
                  onClick={e => { e.stopPropagation(); navigate(featured.route) }}
                >
                  {featured.cta}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="home-featured-card__img-wrap">
                <img src={featuredChar.image} alt={featuredChar.name} className="home-featured-card__img" />
                <div className="home-featured-card__img-fade" />
              </div>
            </div>
          </section>
        )}

        {/* ── MODOS LANDING ── */}
        <section className="home-modes-landing">
          <div className="home-modes-landing__header">
            <span className="home-modes-landing__eyebrow">Modos de juego</span>
            <h2 className="home-modes-landing__title">Elegí cómo entrás al universo.</h2>
          </div>

          {MODES_LANDING.map((mode, i) => {
            const char = characters.find(c => c.id === mode.characterId)
            const isFlip = i % 2 === 1
            return (
              <div
                key={mode.route}
                className={`home-mode-row${isFlip ? ' home-mode-row--flip' : ''}`}
                style={{ '--mode-color': mode.color }}
              >
                <div className="home-mode-row__content">
                  {mode.badge && <span className="home-mode-row__badge">{mode.badge}</span>}
                  <span className="home-mode-row__eyebrow">{mode.eyebrow}</span>
                  <h3 className="home-mode-row__title">{mode.title}</h3>
                  <p className="home-mode-row__desc">{mode.desc}</p>
                  <div className="home-mode-row__tags">
                    {mode.tags.map(t => <span key={t} className="home-mode-row__tag">{t}</span>)}
                  </div>
                  <div className="home-mode-row__divider" />
                  <div className="home-mode-row__stats">
                    <span className="home-mode-row__stat">⏱ {mode.duration}</span>
                    <span className="home-mode-row__stat-dot" />
                    <span className="home-mode-row__stat">🎯 {mode.difficulty}</span>
                  </div>
                  {mode.idealFor && (
                    <p className="home-mode-row__ideal">
                      <span className="home-mode-row__ideal-label">Ideal para: </span>
                      {mode.idealFor}
                    </p>
                  )}
                  {mode.missions && (
                    <ul className="home-mode-row__missions">
                      {missions.map(m => (
                        <li key={m.id} className="home-mode-row__mission-item">
                          <span>{m.emoji}</span>
                          <span>{m.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button className="home-mode-row__cta" onClick={() => navigate(mode.route)}>
                    {mode.cta}
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {char && (
                  <div className="home-mode-row__visual">
                    <div className="home-mode-row__img-wrap">
                      <img src={char.image} alt={char.name} className="home-mode-row__img" />
                      <div className="home-mode-row__img-glow" />
                    </div>
                    <span className="home-mode-row__char-name">{char.name}</span>
                  </div>
                )}
              </div>
            )
          })}
        </section>

        {/* ── PERSONAJES POPULARES ── */}
        <section className="home-popular-section">
          <div className="home-popular-header">
            <span className="home-popular-eyebrow">Populares hoy</span>
            <h2 className="home-popular-title">¿Con quién vas?</h2>
          </div>
          <div className="home-popular-scroll">
            {popularChars.map((char) => (
              <button
                key={char.id}
                className="home-popular-card"
                style={{ '--char-color': char.themeColor }}
                onClick={() => navigate(`/chat/${char.id}`)}
              >
                <div className="home-popular-card__img-wrap">
                  <img src={char.image} alt={char.name} className="home-popular-card__img" />
                  <div className="home-popular-card__overlay">
                    <span className="home-popular-card__overlay-text">Chatear</span>
                  </div>
                </div>
                <span className="home-popular-card__name">{char.name.split(' ')[0]}</span>
                <span className="home-popular-card__dot" />
              </button>
            ))}
          </div>
        </section>

        <footer className="home-footer">
          <span>Powered by Groq · Llama 3.3</span>
        </footer>
      </div>
    </>
  )
}
