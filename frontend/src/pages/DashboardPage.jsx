import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStreak } from '../hooks/useStreak'
import { characters } from '../data/characters'
import { pickByDay, shuffleByDay } from '../utils/daily'
import { loadSession, clearSession, timeAgo, hoursUntilMidnight } from '../utils/session'
import { FEATURED_LIST } from '../data/featured'
import { ACHIEVEMENTS_KEY } from '../utils/constants'
import './DashboardPage.css'

const BG_IMAGES = [...characters, ...characters]

const MODES = [
  { label: 'Chat',           eyebrow: 'Con personaje',        route: '/chat',          color: '#70a8e0', tag: 'Sin límite',       characterId: 'sherlock'     },
  { label: 'Misión',         eyebrow: 'Historia interactiva', route: '/mission',       color: '#e05060', tag: '~10 min',          characterId: 'el-profesor'  },
  { label: 'Interrogatorio', eyebrow: 'Detección de mentiras',route: '/interrogation', color: '#7ec87e', tag: '~8 min',           characterId: 'walter-white' },
  { label: 'Dilemas',        eyebrow: 'Filosófico',           route: '/dilema',        color: '#a08cdc', tag: '~5 min',           characterId: 'gandalf'      },
  { label: 'Adivinar',       eyebrow: 'Trivia con puntaje',   route: '/guess',         color: '#7aab6e', tag: '~3 min',           characterId: 'gollum'       },
  { label: 'Swipe',          eyebrow: 'Respuesta rápida',     route: '/swipe',         color: '#e87040', tag: '~2 min',           characterId: 'tony-stark'   },
  { label: 'Última Cena',    eyebrow: 'Debate grupal',        route: '/ultima-cena',   color: '#c9954a', tag: '~15 min',          characterId: 'darth-vader'  },
  { label: 'Duo',            eyebrow: '2 personajes',         route: '/duo',           color: '#9B7BFF', tag: 'Sin límite',       characterId: 'jack-sparrow' },
  { label: 'Parecido',       eyebrow: 'Quiz visual',          route: '/parecido',      color: '#f06292', tag: '~5 min',           characterId: 'john-wick'    },
  { label: 'Salas',          eyebrow: 'Multijugador',         route: '/salas',         color: '#4dd0e1', tag: 'En vivo',          characterId: 'frodo'        },
  { label: 'Comunidad',      eyebrow: 'Personajes de fans',   route: '/comunidad',     color: '#81c784', tag: 'Creados por fans', characterId: 'tyrion'       },
]

function getLocalStats() {
  const achievements = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]')
  const chatCount = Object.keys(localStorage).filter(
    k => k.startsWith('chat-') && !k.startsWith('chat-custom-') && k !== 'chat-history-meta'
  ).length
  return {
    achievements: Array.isArray(achievements) ? achievements.length : 0,
    chats: chatCount,
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { streak } = useStreak()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(hoursUntilMidnight())
  const [session, setSession] = useState(() => loadSession())
  const [localStats] = useState(() => getLocalStats())

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
    <>
      {/* ── Fondo animado ── */}
      <div className={`dash-bg ${visible ? 'dash-bg--visible' : ''}`} aria-hidden="true">
        <div className="dash-bg-track dash-bg-track--1">
          {BG_IMAGES.map((c, i) => (
            <img key={i} src={c.image} alt="" className="dash-bg-img" draggable={false} />
          ))}
        </div>
        <div className="dash-bg-track dash-bg-track--2">
          {BG_IMAGES.map((c, i) => (
            <img key={i} src={c.image} alt="" className="dash-bg-img" draggable={false} />
          ))}
        </div>
        <div className="dash-bg-overlay" />
      </div>

      <div className={`dash ${visible ? 'dash--visible' : ''}`}>

        {/* ── HERO ── */}
        <section className="dash-hero">
          <div className="dash-hero__inner">
            <div className="dash-hero__id">
              <div className="dash-avatar">{initial}</div>
              <div>
                <p className="dash-hero__eyebrow">Bienvenido de nuevo</p>
                <h1 className="dash-hero__name">{username}</h1>
              </div>
            </div>
            <div className="dash-stats">
              <div className="dash-stat">
                <span className="dash-stat__icon">🔥</span>
                <span className="dash-stat__value">{streak.current}</span>
                <span className="dash-stat__label">días de racha</span>
              </div>
              <div className="dash-stat-sep" />
              <div className="dash-stat">
                <span className="dash-stat__icon">🏆</span>
                <span className="dash-stat__value">{localStats.achievements}</span>
                <span className="dash-stat__label">logros</span>
              </div>
              <div className="dash-stat-sep" />
              <div className="dash-stat">
                <span className="dash-stat__icon">💬</span>
                <span className="dash-stat__value">{localStats.chats}</span>
                <span className="dash-stat__label">personajes chateados</span>
              </div>
            </div>
          </div>
          <div className="dash-hero__fade" />
        </section>

        {/* ── CONTENT ── */}
        <div className="dash-inner">

          {/* ── MODOS ── */}
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
    </>
  )
}
