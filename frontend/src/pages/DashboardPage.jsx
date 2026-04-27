import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStreak } from '../hooks/useStreak'
import { useAchievements } from '../hooks/useAchievements'
import { ACHIEVEMENTS } from '../data/achievements'
import { supabase } from '../lib/supabase'
import { characters } from '../data/characters'
import { pickByDay, shuffleByDay } from '../utils/daily'
import { loadSession, clearSession, timeAgo, hoursUntilMidnight } from '../utils/session'
import { getMissionProgress } from '../utils/missionProgress'
import { FEATURED_LIST } from '../data/featured'
import { ROUTES } from '../utils/constants'
import DailyChallenge from '../components/DailyChallenge/DailyChallenge'
import { API_URL } from '../config/api'
import './DashboardPage.css'

const BG_IMAGES = [...characters, ...characters]

const ACH_CHAR = {
  first_message:       'sherlock',
  chatty:              'sherlock',
  verbose:             'sherlock',
  daily_hero:          'sherlock',
  daily_dedicated:     'sherlock',
  mission_starter:     'el-profesor',
  mission_veteran:     'el-profesor',
  mission_elite:       'el-profesor',
  story_first:         'el-profesor',
  story_5:             'el-profesor',
  interrogation_first: 'walter-white',
  interrogation_5:     'walter-white',
  philosopher:         'gandalf',
  deep_thinker:        'gandalf',
  streak_3:            'gandalf',
  streak_7:            'gandalf',
  streak_30:           'gandalf',
  guess_good:          'gollum',
  guess_master:        'gollum',
  guess_first:         'gollum',
  guess_5:             'gollum',
  swipe_first:         'tony-stark',
  swipe_10:            'tony-stark',
  este_o_ese_first:    'tony-stark',
  confesionario_first: 'darth-vader',
  polyglot:            'jack-sparrow',
  universe_explorer:   'jack-sparrow',
  parecido_first:      'john-wick',
  all_modes:           'frodo',
  custom_char_created: 'tyrion',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function useCountUp(target, active = true, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    if (target === 0) { setValue(0); return }
    let start = null
    let raf
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
}

const MODES = [
  { label: 'Chat',           eyebrow: 'Con personaje',        route: '/chat',          color: '#4A9B7B', tag: 'Sin límite',       image: '/images/ragnarchat1a1.webp'              },
  { label: 'Misión',         eyebrow: 'Historia interactiva', route: '/mission',       color: '#D4576B', tag: '~10 min',          image: '/images/modomision.jfif'                 },
  { label: 'Interrogatorio', eyebrow: 'Detección de mentiras',route: '/interrogation', color: '#6D4AFF', tag: '~8 min',           image: '/images/interrogatoriojpg.jpg'           },
  { label: 'Dilemas',        eyebrow: 'Filosófico',           route: '/dilema',        color: '#C9954A', tag: '~5 min',           characterId: 'gandalf'                           },
  { label: 'Adivinar',       eyebrow: 'Trivia con puntaje',   route: '/guess',         color: '#9B4A7B', tag: '~3 min',           image: '/images/adivinaelpersonaje.webp'         },
  { label: 'Swipe',          eyebrow: 'Respuesta rápida',     route: '/swipe',         color: '#4A7B9B', tag: '~2 min',           image: '/images/wolverineSwipe.jpg'              },
  { label: 'Última Cena',    eyebrow: 'Debate grupal',        route: '/ultima-cena',   color: '#8B4A2A', tag: '~15 min',          image: '/images/ultimacena2.jfif'                },
  { label: 'Duo',            eyebrow: '2 personajes',         route: '/duo',           color: '#7B9B4A', tag: 'Sin límite',       image: '/images/ipmanstevenseagal.webp'          },
  { label: 'Parecido',       eyebrow: 'Quiz visual',          route: '/parecido',      color: '#9475F0', tag: '~5 min',           image: '/images/aquientepareces.jfif'            },
  { label: 'Salas',          eyebrow: 'Multijugador',         route: '/salas',         color: '#C9954A', tag: 'En vivo',          image: '/images/jaxtellersupermanchatenvivo.webp'},
  { label: 'Comunidad',      eyebrow: 'Personajes de fans',   route: '/comunidad',     color: '#81c784', tag: 'Creados por fans', image: '/images/ninja.png'                       },
]


export default function DashboardPage() {
  const { user, logout, session } = useAuth()
  const { streak } = useStreak()
  const { unlockedIds } = useAchievements()
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(hoursUntilMidnight())
  const [activeSession, setActiveSession] = useState(() => loadSession())
  const [communityChars, setCommunityChars] = useState([])
  const [affinityStats, setAffinityStats] = useState({ chars: 0, messages: 0 })
  const [mission, setMission] = useState(() => getMissionProgress())

  const featured = pickByDay(FEATURED_LIST)
  const featuredChar = characters.find(c => c.id === featured?.characterId)
  const popularChars = shuffleByDay(characters).slice(0, 8)
  const sessionChar = activeSession ? characters.find(c => c.id === activeSession.characterId) : null

  const streakDisplay   = useCountUp(streak.current,       visible)
  const charsDisplay    = useCountUp(affinityStats.chars,   visible)
  const messagesDisplay = useCountUp(affinityStats.messages, visible)

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Viajero'
  const initial = username[0].toUpperCase()

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate(ROUTES.HOME, { replace: true })
    } catch {
      setLoggingOut(false)
    }
  }

  function handleClearSession(e) {
    e.stopPropagation()
    clearSession()
    setActiveSession(null)
  }

  useEffect(() => {
    supabase
      .from('custom_characters')
      .select('id, name, emoji, color, avatar_url, description')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => { if (data) setCommunityChars(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!session?.access_token) return
    fetch(`${API_URL}/db/mission-progress`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(r => r.json())
      .then(data => { if (data?.highestUnlocked) setMission(data) })
      .catch(() => {})
  }, [session])

  useEffect(() => {
    if (!session?.access_token) return
    fetch(`${API_URL}/db/affinity`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const chars = data.filter(a => a.message_count > 0).length
        const messages = data.reduce((sum, a) => sum + (a.message_count || 0), 0)
        setAffinityStats({ chars, messages })
      })
      .catch(() => {})
  }, [session])

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCountdown(hoursUntilMidnight()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!visible) return
    const sections = Array.from(document.querySelectorAll('.dash-section'))
    const pending = sections.filter(s => !s.classList.contains('dash-section--visible'))
    const vh = window.innerHeight
    let staggerIdx = 0
    pending.forEach(s => {
      const rect = s.getBoundingClientRect()
      if (rect.top < vh) {
        s.style.transitionDelay = `${staggerIdx * 0.09}s`
        staggerIdx++
      }
    })
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('dash-section--visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08 })
    pending.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [visible, communityChars.length])

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="dash-nav">
        <button className="dash-nav__brand" onClick={() => navigate(ROUTES.DASHBOARD)}>
          <span className="dash-nav__brand-echo">Echo</span>
          <span className="dash-nav__brand-verse">Verse</span>
        </button>
        <div className="dash-nav__actions">
          <button
            className="dash-nav__profile"
            onClick={() => navigate(ROUTES.PERFIL)}
            title="Ver perfil"
          >
            <span className="dash-nav__profile-avatar">{initial}</span>
            <span className="dash-nav__profile-name">{username}</span>
          </button>
          <button
            className="dash-nav__logout"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Cerrar sesión"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </nav>

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
                <p className="dash-hero__eyebrow">{getGreeting()}</p>
                <h1 className="dash-hero__name">{username}</h1>
              </div>
            </div>
            <div className="dash-stats">
              <div className="dash-stat">
                <span className="dash-stat__icon">🔥</span>
                <span className="dash-stat__value">{streakDisplay}</span>
                <span className="dash-stat__label">días de racha</span>
              </div>
              <div className="dash-stat-sep" />
              <div className="dash-stat">
                <span className="dash-stat__icon">👤</span>
                <span className="dash-stat__value">{charsDisplay}</span>
                <span className="dash-stat__label">personajes</span>
              </div>
              <div className="dash-stat-sep" />
              <div className="dash-stat">
                <span className="dash-stat__icon">💬</span>
                <span className="dash-stat__value">{messagesDisplay}</span>
                <span className="dash-stat__label">mensajes</span>
              </div>
            </div>
          </div>
          <div className="dash-hero__fade" />
        </section>

        {/* ── CONTENT ── */}
        <div className="dash-inner">

          {/* ── CONTINUAR ── */}
          {activeSession && sessionChar && (
            <section className="dash-section">
              <div className="dash-section-header">
                <span className="dash-eyebrow">Sesión activa <span className="dash-eyebrow__rule" /></span>
                <h2 className="dash-section-title">Seguís<br /><em>donde lo dejaste.</em></h2>
              </div>
              <div
                className="dash-resume"
                style={{ '--char-color': sessionChar.themeColor }}
                onClick={() => navigate(activeSession.route || `/chat/${sessionChar.id}`)}
              >
                <div className="dash-resume__img-wrap">
                  <img src={sessionChar.image} alt={sessionChar.name} className="dash-resume__img" />
                </div>
                <div className="dash-resume__info">
                  <span className="dash-resume__char">{sessionChar.name}</span>
                  <span className="dash-resume__meta">{activeSession.modeLabel} · {timeAgo(activeSession.timestamp)}</span>
                  {activeSession.lastMessage && (
                    <span className="dash-resume__quote">
                      &ldquo;{activeSession.lastMessage.length > 80
                        ? activeSession.lastMessage.slice(0, 80) + '…'
                        : activeSession.lastMessage}&rdquo;
                    </span>
                  )}
                </div>
                <button
                  className="dash-resume__cta"
                  onClick={e => { e.stopPropagation(); navigate(activeSession.route || `/chat/${sessionChar.id}`) }}
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
                <span className="dash-eyebrow">Destacado del día <span className="dash-eyebrow__rule" /></span>
                <div className="dash-section-header__row">
                  <h2 className="dash-section-title">El universo<br /><em>te llama.</em></h2>
                  <span className="dash-countdown">Cambia en {countdown}</span>
                </div>
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

          {/* ── DESAFÍO DIARIO ── */}
          <section className="dash-section">
            <div className="dash-section-header">
              <span className="dash-eyebrow">Hoy <span className="dash-eyebrow__rule" /></span>
              <h2 className="dash-section-title">Desafío<br /><em>del día.</em></h2>
            </div>
            <DailyChallenge />
          </section>

          {/* ── CAMPAÑA ── */}
          {mission.highestUnlocked > 1 && (() => {
            const level = mission.highestUnlocked - 1
            const completed = Object.keys(mission.completedLevels || {}).length
            const pct = Math.min((completed / 30) * 100, 100)
            return (
              <section className="dash-section">
                <div className="dash-section-header">
                  <span className="dash-eyebrow">Campaña <span className="dash-eyebrow__rule" /></span>
                  <h2 className="dash-section-title">Tu progreso<br /><em>hasta ahora.</em></h2>
                </div>
                <div className="dash-campaign" onClick={() => navigate('/mission')} role="button" tabIndex={0}>
                  <div className="dash-campaign__top">
                    <div className="dash-campaign__level">
                      <span className="dash-campaign__level-num">Nivel {level}</span>
                      <span className="dash-campaign__level-sub">{completed} de 30 completados</span>
                    </div>
                    <button className="dash-campaign__cta" onClick={e => { e.stopPropagation(); navigate('/mission') }}>
                      Continuar
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dash-campaign__bar">
                    <div className="dash-campaign__bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="dash-campaign__pct">{Math.round(pct)}% completado</span>
                </div>
              </section>
            )
          })()}

          {/* ── MODOS ── */}
          <section className="dash-section">
            <div className="dash-section-header">
              <span className="dash-eyebrow">Modos de juego <span className="dash-eyebrow__rule" /></span>
              <h2 className="dash-section-title">Elegí cómo<br /><em>entrás.</em></h2>
            </div>
            <div className="dash-modes-grid">
              {MODES.map(mode => {
                const char = characters.find(c => c.id === mode.characterId)
                const img = mode.image ?? char?.image
                return (
                  <button
                    key={mode.route}
                    className="dash-mode-card"
                    style={{ '--mode-color': mode.color }}
                    onClick={() => navigate(mode.route)}
                  >
                    <div className="dash-mode-card__thumb">
                      {img && <img src={img} alt="" />}
                    </div>
                    <div className="dash-mode-card__info">
                      <span className="dash-mode-card__label">{mode.label}</span>
                      <span className="dash-mode-card__eyebrow">{mode.eyebrow}</span>
                      <span className="dash-mode-card__tag">{mode.tag}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── PERSONAJES POPULARES ── */}
          <section className="dash-section">
            <div className="dash-section-header">
              <span className="dash-eyebrow">Elenco <span className="dash-eyebrow__rule" /></span>
              <h2 className="dash-section-title">Con quién<br /><em>vas hoy.</em></h2>
            </div>
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

        {/* ── COMUNIDAD ── */}
          {communityChars.length > 0 && (
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
          )}

        </div>
      </div>

      {/* ── SIDEBAR LOGROS ── */}
      <button
        className={`dash-ach-tab ${sidebarOpen ? 'dash-ach-tab--open' : ''}`}
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Ver logros"
      >
        <span className="dash-ach-tab__icon">🏆</span>
        <span className="dash-ach-tab__label">Logros</span>
        <span className="dash-ach-tab__count">{unlockedIds.size}/{ACHIEVEMENTS.length}</span>
      </button>

      <aside className={`dash-ach-panel ${sidebarOpen ? 'dash-ach-panel--open' : ''}`}>
        <div className="dash-ach-panel__header">
          <span className="dash-ach-panel__title">Logros</span>
          <span className="dash-ach-panel__sub">{unlockedIds.size} de {ACHIEVEMENTS.length} desbloqueados</span>
        </div>
        <div className="dash-ach-panel__list">
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedIds.has(a.id)
            const char = characters.find(c => c.id === ACH_CHAR[a.id])
            return (
              <div
                key={a.id}
                className={`dash-ach-item ${unlocked ? 'dash-ach-item--unlocked' : 'dash-ach-item--locked'}`}
                data-rarity={a.rarity}
              >
                <span className="dash-ach-item__emoji">{unlocked ? a.emoji : '🔒'}</span>
                <div className="dash-ach-item__body">
                  <span className="dash-ach-item__name">{a.name}</span>
                  <span className="dash-ach-item__desc">{a.desc}</span>
                </div>
                <span className="dash-ach-item__rarity" />
              </div>
            )
          })}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="dash-ach-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
    </>
  )
}
