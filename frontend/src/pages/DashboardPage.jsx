import { useEffect, useMemo, useRef, useState } from 'react'
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
  { label: 'Chat',           eyebrow: 'Con personaje',        route: '/chat',          color: '#4A9B7B', tag: 'Sin límite',       image: '/images/ragnarchat1a1.webp',               completionKey: null            },
  { label: 'Misión',         eyebrow: 'Historia interactiva', route: '/mission',       color: '#D4576B', tag: '~10 min',          image: '/images/modomision.jfif',                  completionKey: 'story'         },
  { label: 'Interrogatorio', eyebrow: 'Detección de mentiras',route: '/interrogation', color: '#6D4AFF', tag: '~8 min',           image: '/images/interrogatoriojpg.jpg',            completionKey: 'interrogation' },
  { label: 'Dilemas',        eyebrow: 'Filosófico',           route: '/dilema',        color: '#C9954A', tag: '~5 min',           characterId: 'gandalf',                            completionKey: 'dilema'        },
  { label: 'Adivinar',       eyebrow: 'Trivia con puntaje',   route: '/guess',         color: '#9B4A7B', tag: '~3 min',           image: '/images/adivinaelpersonaje.webp',          completionKey: 'guess'         },
  { label: 'Swipe',          eyebrow: 'Respuesta rápida',     route: '/swipe',         color: '#4A7B9B', tag: '~2 min',           image: '/images/wolverineSwipe.jpg',               completionKey: 'swipe'         },
  { label: 'Última Cena',    eyebrow: 'Debate grupal',        route: '/ultima-cena',   color: '#8B4A2A', tag: '~15 min',          image: '/images/ultimacena2.jfif',                 completionKey: null            },
  { label: 'Duo',            eyebrow: '2 personajes',         route: '/duo',           color: '#7B9B4A', tag: 'Sin límite',       image: '/images/ipmanstevenseagal.webp',           completionKey: null            },
  { label: 'Parecido',       eyebrow: 'Quiz visual',          route: '/parecido',      color: '#9475F0', tag: '~5 min',           image: '/images/aquientepareces.jfif',             completionKey: 'parecido'      },
  { label: 'Salas',          eyebrow: 'Multijugador',         route: '/salas',         color: '#C9954A', tag: 'En vivo',          image: '/images/jaxtellersupermanchatenvivo.webp', completionKey: null            },
  { label: 'Comunidad',      eyebrow: 'Personajes de fans',   route: '/comunidad',     color: '#81c784', tag: 'Creados por fans', image: '/images/ninja.png',                        completionKey: null            },
]


export default function DashboardPage() {
  const { user, logout, session } = useAuth()
  const { streak } = useStreak()
  const { unlockedIds } = useAchievements()
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(hoursUntilMidnight())
  const [activeSession, setActiveSession] = useState(() => loadSession())
  const [communityChars, setCommunityChars] = useState([])
  const [affinityStats, setAffinityStats] = useState({ chars: 0, messages: 0 })
  const [chattedCharIds, setChattedCharIds] = useState(new Set())
  const [mission, setMission] = useState(() => getMissionProgress())
  const [fetchingStats, setFetchingStats] = useState(true)
  const [fetchingMission, setFetchingMission] = useState(true)
  const [modeCompletions, setModeCompletions] = useState({})
  const [dailyQuote, setDailyQuote] = useState(null)

  const modesRef   = useRef(null)
  const popularRef = useRef(null)

  const featured = pickByDay(FEATURED_LIST)
  const featuredChar = characters.find(c => c.id === featured?.characterId)
  const popularChars = useMemo(() => {
    const shuffled = shuffleByDay(characters)
    const unknown = shuffled.filter(c => !chattedCharIds.has(c.id))
    const known   = shuffled.filter(c =>  chattedCharIds.has(c.id))
    return [...unknown, ...known].slice(0, 8)
  }, [chattedCharIds])
  const sessionChar   = activeSession ? characters.find(c => c.id === activeSession.characterId) : null

  const heroContext = useMemo(() => {
    if (fetchingStats) return null
    if (streak.current > 0) return `🔥 ${streak.current} ${streak.current === 1 ? 'día' : 'días'} de racha`
    if (activeSession && sessionChar) return `↩ Retomando con ${sessionChar.name}`
    if (affinityStats.chars > 0) return `${affinityStats.chars} personajes en tu universo`
    return null
  }, [fetchingStats, streak.current, activeSession, sessionChar, affinityStats.chars])

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
      .finally(() => setFetchingMission(false))
  }, [session])

  useEffect(() => {
    if (!session?.access_token) return
    fetch(`${API_URL}/db/affinity`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const active = data.filter(a => a.message_count > 0)
        setChattedCharIds(new Set(active.map(a => a.character_id)))
        setAffinityStats({ chars: active.length, messages: data.reduce((sum, a) => sum + (a.message_count || 0), 0) })
      })
      .catch(() => {})
      .finally(() => setFetchingStats(false))
  }, [session])

  useEffect(() => {
    if (!session?.access_token) return
    fetch(`${API_URL}/db/mode-completions`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(r => r.json())
      .then(data => { if (typeof data === 'object' && data !== null) setModeCompletions(data) })
      .catch(() => {})
  }, [session])

  useEffect(() => {
    fetch(`${API_URL}/daily-quote`)
      .then(r => r.json())
      .then(data => { if (data?.quote) setDailyQuote(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Nudge: scroll hint una sola vez al cargar, solo en mobile
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 768) return
    const nudge = (ref) => {
      const el = ref.current
      if (!el || el.scrollWidth <= el.clientWidth) return
      const t1 = setTimeout(() => el.scrollTo({ left: 48, behavior: 'smooth' }), 900)
      const t2 = setTimeout(() => el.scrollTo({ left: 0,  behavior: 'smooth' }), 1500)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    const c1 = nudge(modesRef)
    const c2 = nudge(popularRef)
    return () => { c1?.(); c2?.() }
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
  }, [visible, communityChars.length, mission.highestUnlocked])

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
                {heroContext && (
                  <span className="dash-hero__context">{heroContext}</span>
                )}
              </div>
            </div>
            <div className="dash-stats">
              <div className="dash-stat">
                <svg className="dash-stat__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C9 7 5 9 5 14a7 7 0 0 0 14 0c0-5-4-7-7-12zm0 17a5 5 0 0 1-5-5c0-3.5 2.5-5.5 5-9 2.5 3.5 5 5.5 5 9a5 5 0 0 1-5 5zm-2-2.5a3 3 0 0 0 4-2.5c0-1.5-1-2.5-2-4-1 1.5-2 2.5-2 4a3 3 0 0 0 0 2.5z"/>
                </svg>
                {fetchingStats
                  ? <span className="dash-skeleton dash-skeleton--val" />
                  : <span className="dash-stat__value">{streakDisplay}</span>}
                <span className="dash-stat__label">días de racha</span>
              </div>
              <div className="dash-stat-sep" />
              <div className="dash-stat">
                <svg className="dash-stat__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
                {fetchingStats
                  ? <span className="dash-skeleton dash-skeleton--val" />
                  : <span className="dash-stat__value">{charsDisplay}</span>}
                <span className="dash-stat__label">personajes</span>
              </div>
              <div className="dash-stat-sep" />
              <div className="dash-stat">
                <svg className="dash-stat__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 11H7v-2h10v2zm0-3H7V8h10v2z"/>
                </svg>
                {fetchingStats
                  ? <span className="dash-skeleton dash-skeleton--val" />
                  : <span className="dash-stat__value">{messagesDisplay}</span>}
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
              <span className="dash-eyebrow">Sesión activa <span className="dash-eyebrow__rule" /></span>
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

          {/* ── FRASE DEL DÍA ── */}
          {dailyQuote && (() => {
            const char = characters.find(c => c.id === dailyQuote.characterId)
            if (!char) return null
            return (
              <section className="dash-section">
                <span className="dash-eyebrow">Frase del día <span className="dash-eyebrow__rule" /></span>
                <div
                  className="dash-quote"
                  style={{ '--char-color': char.themeColor }}
                  onClick={() => navigate(`/chat/${char.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dash-quote__img-wrap">
                    <img src={char.image} alt={char.name} className="dash-quote__img" />
                  </div>
                  <div className="dash-quote__body">
                    <p className="dash-quote__text">"{dailyQuote.quote}"</p>
                    <span className="dash-quote__char">— {char.name}</span>
                  </div>
                </div>
              </section>
            )
          })()}

          {/* ── HOY: Destacado + Desafío ── */}
          <section className="dash-section">
            <div className="dash-section-header">
              <span className="dash-eyebrow">Hoy <span className="dash-eyebrow__rule" /></span>
              <div className="dash-section-header__row">
                <h2 className="dash-section-title">El universo<br /><em>y el desafío.</em></h2>
                <span className="dash-countdown">Cambia en {countdown}</span>
              </div>
            </div>
            <div className="dash-hoy-grid">
              {featured && featuredChar && (
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
              )}
              <DailyChallenge />
            </div>
          </section>

          {/* ── CAMPAÑA ── */}
          {!fetchingMission && mission.highestUnlocked <= 1 && (
            <section className="dash-section">
              <span className="dash-eyebrow">Campaña <span className="dash-eyebrow__rule" /></span>
              <div className="dash-campaign dash-campaign--empty" onClick={() => navigate('/mission')} role="button" tabIndex={0}>
                <span className="dash-campaign__empty-icon">⚔️</span>
                <div className="dash-campaign__empty-body">
                  <span className="dash-campaign__empty-title">30 niveles te esperan</span>
                  <span className="dash-campaign__empty-sub">Empezá la campaña y desbloqueá personajes exclusivos →</span>
                </div>
              </div>
            </section>
          )}
          {!fetchingMission && mission.highestUnlocked > 1 && (() => {
            const level = mission.highestUnlocked - 1
            const pct = Math.min((level / 30) * 100, 100)
            return (
              <section className="dash-section">
                <span className="dash-eyebrow">Campaña <span className="dash-eyebrow__rule" /></span>
                <div className="dash-campaign" onClick={() => navigate('/mission')} role="button" tabIndex={0}>
                  <div className="dash-campaign__top">
                    <div className="dash-campaign__level">
                      <span className="dash-campaign__level-num">Nivel {level}</span>
                      <span className="dash-campaign__level-sub">{level} de 30 completados</span>
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
          {(() => {
            const exploredCount = MODES.filter(m => m.completionKey && modeCompletions[m.completionKey] > 0).length
            const trackableTotal = MODES.filter(m => m.completionKey).length
            const modeTitle = exploredCount === 0
              ? { line1: 'Todo por', line2: 'descubrir.' }
              : exploredCount < 4
              ? { line1: 'Seguís', line2: 'explorando.' }
              : exploredCount < trackableTotal
              ? { line1: 'Elegí cómo', line2: 'entrás.' }
              : { line1: 'Tu zona', line2: 'de confort.' }
            const sortedModes = [...MODES].sort((a, b) => {
              const aOrder = a.completionKey === null ? 1 : (modeCompletions[a.completionKey] || 0) === 0 ? 0 : 2
              const bOrder = b.completionKey === null ? 1 : (modeCompletions[b.completionKey] || 0) === 0 ? 0 : 2
              return aOrder - bOrder
            })
            return (
              <section className="dash-section">
                <div className="dash-section-header">
                  <span className="dash-eyebrow">Modos de juego <span className="dash-eyebrow__rule" /></span>
                  <div className="dash-section-header__row">
                    <h2 className="dash-section-title">{modeTitle.line1}<br /><em>{modeTitle.line2}</em></h2>
                    {exploredCount > 0 && (
                      <span className="dash-modes-explored">{exploredCount}/{trackableTotal} explorados</span>
                    )}
                  </div>
                </div>
                <div className="dash-modes-grid" ref={modesRef}>
                  {sortedModes.map(mode => {
                    const char = characters.find(c => c.id === mode.characterId)
                    const img = mode.image ?? char?.image
                    const timesPlayed = mode.completionKey ? (modeCompletions[mode.completionKey] || 0) : 0
                    const isNew = mode.completionKey !== null && timesPlayed === 0
                    return (
                      <button
                        key={mode.route}
                        className={`dash-mode-card${isNew ? ' dash-mode-card--new' : ''}`}
                        style={{ '--mode-color': mode.color }}
                        onClick={() => navigate(mode.route)}
                      >
                        <div className="dash-mode-card__thumb">
                          {img && <img src={img} alt="" />}
                          <span className="dash-mode-card__genre">{mode.eyebrow}</span>
                          {isNew && <span className="dash-mode-card__new-badge">NUEVO</span>}
                          {timesPlayed > 0 && (
                            <span className="dash-mode-card__played">✓ {timesPlayed}x</span>
                          )}
                        </div>
                        <div className="dash-mode-card__info">
                          <span className="dash-mode-card__label">{mode.label}</span>
                          <span className="dash-mode-card__tag">{mode.tag}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })()}

          {/* ── PERSONAJES POPULARES ── */}
          <section className="dash-section">
            <div className="dash-section-header">
              <span className="dash-eyebrow">Elenco <span className="dash-eyebrow__rule" /></span>
              <h2 className="dash-section-title">
                {chattedCharIds.size === 0 ? <>Empezá a<br /><em>conocerlos.</em></> : <>Con quién<br /><em>vas hoy.</em></>}
              </h2>
            </div>
            <div className="dash-popular-scroll" ref={popularRef}>
              {popularChars.map(char => {
                const known = chattedCharIds.has(char.id)
                return (
                  <button
                    key={char.id}
                    className={`dash-popular-card${known ? ' dash-popular-card--known' : ''}`}
                    style={{ '--char-color': char.themeColor }}
                    onClick={() => navigate(`/chat/${char.id}`)}
                  >
                    <div className="dash-popular-card__img-wrap">
                      <img src={char.image} alt={char.name} className="dash-popular-card__img" />
                      <div className="dash-popular-card__fade" />
                      {known && <span className="dash-popular-card__known">✓</span>}
                      <div className="dash-popular-card__footer">
                        <span className="dash-popular-card__name">{char.name.split(' ')[0]}</span>
                        <span className="dash-popular-card__action">{known ? 'Volver' : 'Chatear'}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── LOGROS ── */}
          <section className="dash-section">
            <div className="dash-section-header">
              <span className="dash-eyebrow">Logros <span className="dash-eyebrow__rule" /></span>
              <h2 className="dash-section-title">Tus<br /><em>conquistas.</em></h2>
            </div>
            {(() => {
              const lastAch = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id)).at(-1)
              const achChar = lastAch ? characters.find(c => c.id === ACH_CHAR[lastAch.id]) : null
              return (
                <div className="dash-logros" onClick={() => navigate(ROUTES.PERFIL)} role="button" tabIndex={0}>
                  <div className="dash-logros__counter">
                    <span className="dash-logros__num">{unlockedIds.size}</span>
                    <span className="dash-logros__denom">/{ACHIEVEMENTS.length}</span>
                  </div>
                  {lastAch ? (
                    <div className="dash-logros__last" style={{ '--char-color': achChar?.themeColor || 'var(--violet-400)' }}>
                      {achChar && <img src={achChar.image} alt={achChar.name} className="dash-logros__last-img" />}
                      <div className="dash-logros__last-body">
                        <span className="dash-logros__last-emoji">{lastAch.emoji}</span>
                        <span className="dash-logros__last-name">{lastAch.name}</span>
                        <span className="dash-logros__last-desc">{lastAch.desc}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="dash-logros__empty">Completá modos para desbloquear logros</span>
                  )}
                  <span className="dash-logros__cta">Ver todos →</span>
                </div>
              )
            })()}
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

        {/* ── FOOTER LEGAL ── */}
        <footer className="dash-legal-footer">
          <a href="/terms" className="dash-legal-footer__link">Términos</a>
          <span className="dash-legal-footer__sep">·</span>
          <a href="/privacy" className="dash-legal-footer__link">Privacidad</a>
          <span className="dash-legal-footer__sep">·</span>
          <span className="dash-legal-footer__copy">© 2026 EchoVerse</span>
        </footer>

      </div>

    </>
  )
}
