import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { characters } from '../data/characters'
import { pickByDay, shuffleByDay } from '../utils/daily'
import { loadSession, clearSession, timeAgo, hoursUntilMidnight } from '../utils/session'
import { FEATURED_LIST } from '../data/featured'
import './DashboardPage.css'

const MODES = [
  { label: 'Chat',           eyebrow: 'Con personaje',        route: '/chat',          color: '#70a8e0', tag: 'Sin límite',      characterId: 'sherlock'      },
  { label: 'Misión',         eyebrow: 'Historia interactiva', route: '/mission',       color: '#e05060', tag: '~10 min',         characterId: 'el-profesor'   },
  { label: 'Interrogatorio', eyebrow: 'Detección de mentiras',route: '/interrogation', color: '#7ec87e', tag: '~8 min',          characterId: 'walter-white'  },
  { label: 'Dilemas',        eyebrow: 'Filosófico',           route: '/dilema',        color: '#a08cdc', tag: '~5 min',          characterId: 'gandalf'       },
  { label: 'Adivinar',       eyebrow: 'Trivia con puntaje',   route: '/guess',         color: '#7aab6e', tag: '~3 min',          characterId: 'gollum'        },
  { label: 'Swipe',          eyebrow: 'Respuesta rápida',     route: '/swipe',         color: '#e87040', tag: '~2 min',          characterId: 'tony-stark'    },
  { label: 'Última Cena',    eyebrow: 'Debate grupal',        route: '/ultima-cena',   color: '#c9954a', tag: '~15 min',         characterId: 'darth-vader'   },
  { label: 'Duo',            eyebrow: '2 personajes',         route: '/duo',           color: '#9B7BFF', tag: 'Sin límite',      characterId: 'jack-sparrow'  },
  { label: 'Parecido',       eyebrow: 'Quiz visual',          route: '/parecido',      color: '#f06292', tag: '~5 min',          characterId: 'john-wick'     },
  { label: 'Salas',          eyebrow: 'Multijugador',         route: '/salas',         color: '#4dd0e1', tag: 'En vivo',         characterId: 'frodo'         },
  { label: 'Comunidad',      eyebrow: 'Personajes de fans',   route: '/comunidad',     color: '#81c784', tag: 'Creados por fans',characterId: 'tyrion'        },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(hoursUntilMidnight())
  const [session, setSession] = useState(() => loadSession())

  const featured = pickByDay(FEATURED_LIST)
  const featuredChar = characters.find(c => c.id === featured?.characterId)
  const popularChars = shuffleByDay(characters).slice(0, 8)
  const sessionChar = session ? characters.find(c => c.id === session.characterId) : null

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Viajero'
  const initial = username[0].toUpperCase()

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
    <div className={`dash ${visible ? 'dash--visible' : ''}`}>
      <div className="dash-inner">

        {/* ── GREETING ── */}
        <header className="dash-greeting">
          <div className="dash-avatar">{initial}</div>
          <div className="dash-greeting__text">
            <p className="dash-greeting__eyebrow">Bienvenido de nuevo</p>
            <h1 className="dash-greeting__name">{username}</h1>
          </div>
        </header>

        {/* ── QUICK LAUNCH ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Modos</h2>
          <div className="dash-modes-grid">
            {MODES.map(mode => {
              const char = characters.find(c => c.id === mode.characterId)
              return (
                <button
                  key={mode.route}
                  className="dash-mode-card"
                  style={{ '--mode-color': mode.color }}
                  onClick={() => navigate(mode.route)}
                >
                  {char && (
                    <div className="dash-mode-card__visual">
                      <img src={char.image} alt="" className="dash-mode-card__img" />
                      <div className="dash-mode-card__fade" />
                    </div>
                  )}
                  <div className="dash-mode-card__glow" />
                  <div className="dash-mode-card__body">
                    <span className="dash-mode-card__eyebrow">{mode.eyebrow}</span>
                    <span className="dash-mode-card__label">{mode.label}</span>
                    <span className="dash-mode-card__tag">{mode.tag}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── CONTINUAR ── */}
        {session && sessionChar && (
          <section className="dash-section">
            <h2 className="dash-section-title">Retomar</h2>
            <div
              className="dash-resume"
              style={{ '--char-color': sessionChar.themeColor }}
              onClick={() => navigate(session.route || `/chat/${sessionChar.id}`)}
            >
              <div className="dash-resume__img-wrap">
                <img src={sessionChar.image} alt={sessionChar.name} className="dash-resume__img" />
              </div>
              <div className="dash-resume__info">
                <span className="dash-resume__char">{sessionChar.name}</span>
                <span className="dash-resume__meta">{session.modeLabel} · {timeAgo(session.timestamp)}</span>
                {session.lastMessage && (
                  <span className="dash-resume__quote">
                    &ldquo;{session.lastMessage.length > 80
                      ? session.lastMessage.slice(0, 80) + '…'
                      : session.lastMessage}&rdquo;
                  </span>
                )}
              </div>
              <button
                className="dash-resume__cta"
                onClick={e => { e.stopPropagation(); navigate(session.route || `/chat/${sessionChar.id}`) }}
              >
                Retomar
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="dash-resume__dismiss" onClick={handleClearSession} title="Quitar">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* ── DESTACADO DEL DÍA ── */}
        {featured && featuredChar && (
          <section className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Destacado del día</h2>
              <span className="dash-countdown">Cambia en {countdown}</span>
            </div>
            <div
              className="dash-featured"
              style={{ '--char-color': featuredChar.themeColor, '--char-gradient': featuredChar.gradient }}
              onClick={() => navigate(featured.route)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(featured.route)}
            >
              <div className="dash-featured__body">
                <span className="dash-featured__badge">{featured.badge}</span>
                <h3 className="dash-featured__hook">
                  {featured.hook}
                  <span className="dash-featured__hook-accent"> {featured.hookAccent}</span>
                </h3>
                <button
                  className="dash-featured__cta"
                  onClick={e => { e.stopPropagation(); navigate(featured.route) }}
                >
                  {featured.cta}
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="dash-featured__img-wrap">
                <img src={featuredChar.image} alt={featuredChar.name} className="dash-featured__img" />
                <div className="dash-featured__img-fade" />
              </div>
            </div>
          </section>
        )}

        {/* ── PERSONAJES POPULARES ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Con quién vas hoy</h2>
          <div className="dash-popular-scroll">
            {popularChars.map(char => (
              <button
                key={char.id}
                className="dash-popular-card"
                style={{ '--char-color': char.themeColor }}
                onClick={() => navigate(`/chat/${char.id}`)}
              >
                <div className="dash-popular-card__img-wrap">
                  <img src={char.image} alt={char.name} className="dash-popular-card__img" />
                  <div className="dash-popular-card__overlay">
                    <span className="dash-popular-card__overlay-text">Chatear</span>
                  </div>
                </div>
                <span className="dash-popular-card__name">{char.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
