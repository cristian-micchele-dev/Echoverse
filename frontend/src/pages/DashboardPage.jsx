import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStreak } from '../hooks/useStreak'
import { useAchievements } from '../hooks/useAchievements'
import { supabase } from '../lib/supabase'
import { characters, characterMap } from '../data/characters'
import { pickByDay, shuffleByDay } from '../utils/game/daily'
import { loadSession, clearSession, hoursUntilMidnight } from '../utils/session'
import { getMissionProgress } from '../utils/game/missionProgress'
import { FEATURED_LIST } from '../data/featured'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api'
import { useCountUp } from './dashboard/utils.js'
import DashNav from './dashboard/DashNav.jsx'
import DashBg from './dashboard/DashBg.jsx'
import DashHero from './dashboard/DashHero.jsx'
import DashResume from './dashboard/DashResume.jsx'
import DashDailyQuote from './dashboard/DashDailyQuote.jsx'
import DashFeatured from './dashboard/DashFeatured.jsx'
import DashCampaign from './dashboard/DashCampaign.jsx'
import DashModes from './dashboard/DashModes.jsx'
import DashCast from './dashboard/DashCast.jsx'
import DashLogros from './dashboard/DashLogros.jsx'
import DashCommunity from './dashboard/DashCommunity.jsx'
import './DashboardPage.css'

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

  const featured     = pickByDay(FEATURED_LIST)
  const featuredChar = featured ? characterMap[featured.characterId] : null
  const popularChars = useMemo(() => {
    const shuffled = shuffleByDay(characters)
    const unknown = shuffled.filter(c => !chattedCharIds.has(c.id))
    const known   = shuffled.filter(c =>  chattedCharIds.has(c.id))
    return [...unknown, ...known].slice(0, 8)
  }, [chattedCharIds])
  const sessionChar = activeSession ? (characterMap[activeSession.characterId] ?? null) : null

  const heroContext = useMemo(() => {
    if (fetchingStats) return null
    if (streak.current > 0) return `🔥 ${streak.current} ${streak.current === 1 ? 'día' : 'días'} de racha`
    if (activeSession && sessionChar) return `↩ Retomando con ${sessionChar.name}`
    if (affinityStats.chars > 0) return `${affinityStats.chars} personajes en tu universo`
    return null
  }, [fetchingStats, streak, activeSession, sessionChar, affinityStats.chars])

  const streakDisplay   = useCountUp(streak.current,        visible)
  const charsDisplay    = useCountUp(affinityStats.chars,   visible)
  const messagesDisplay = useCountUp(affinityStats.messages, visible)

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Viajero'
  const initial  = username[0].toUpperCase()

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
    const timers = []

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }

    function animateScrollLeft(el, from, to, duration, onDone) {
      const start = performance.now()
      function step(now) {
        const progress = Math.min((now - start) / duration, 1)
        el.scrollLeft = from + (to - from) * easeInOut(progress)
        if (progress < 1) requestAnimationFrame(step)
        else onDone?.()
      }
      requestAnimationFrame(step)
    }

    const nudge = (ref, delay, duration) => {
      const t = setTimeout(() => {
        const el = ref.current
        if (!el || el.scrollWidth <= el.clientWidth) return
        const target = el.scrollWidth - el.clientWidth
        el.style.scrollSnapType = 'none'
        animateScrollLeft(el, 0, target, duration, () => {
          const t2 = setTimeout(() => {
            animateScrollLeft(el, el.scrollLeft, 0, 600, () => {
              el.style.scrollSnapType = ''
            })
          }, 400)
          timers.push(t2)
        })
      }, delay)
      timers.push(t)
    }

    nudge(modesRef, 900, 25000)
    nudge(popularRef, 1300, 14000)
    return () => timers.forEach(clearTimeout)
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
      <DashNav
        initial={initial}
        username={username}
        loggingOut={loggingOut}
        onNavigateDash={() => navigate(ROUTES.DASHBOARD)}
        onNavigatePerfil={() => navigate(ROUTES.PERFIL)}
        onLogout={handleLogout}
      />

      <DashBg visible={visible} />

      <div className={`dash ${visible ? 'dash--visible' : ''}`}>

        <DashHero
          initial={initial}
          username={username}
          heroContext={heroContext}
          fetchingStats={fetchingStats}
          streakDisplay={streakDisplay}
          charsDisplay={charsDisplay}
          messagesDisplay={messagesDisplay}
        />

        <div className="dash-inner">

          <DashResume
            activeSession={activeSession}
            sessionChar={sessionChar}
            onNavigate={navigate}
            onClear={handleClearSession}
          />

          <DashDailyQuote dailyQuote={dailyQuote} navigate={navigate} />

          <DashFeatured
            featured={featured}
            featuredChar={featuredChar}
            countdown={countdown}
            navigate={navigate}
          />

          {!fetchingMission && (
            <DashCampaign mission={mission} navigate={navigate} />
          )}

          <DashModes
            modeCompletions={modeCompletions}
            modesRef={modesRef}
            navigate={navigate}
          />

          <DashCast
            popularChars={popularChars}
            chattedCharIds={chattedCharIds}
            popularRef={popularRef}
            navigate={navigate}
          />

          <DashLogros unlockedIds={unlockedIds} navigate={navigate} />

          <DashCommunity communityChars={communityChars} navigate={navigate} />

        </div>

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
