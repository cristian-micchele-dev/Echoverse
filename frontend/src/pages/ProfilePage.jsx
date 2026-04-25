import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { characters } from '../data/characters'
import { ACHIEVEMENTS } from '../data/achievements'
import { getAffinityLevel, getAffinityLabel, getAffinityEmoji } from '../utils/affinity'
import { getMissionProgress, resetProgress } from '../utils/missionProgress'
import { useAchievements } from '../hooks/useAchievements'
import { useStreak } from '../hooks/useStreak'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import { ROUTES, chatHistoryKey } from '../utils/constants'
import { timeAgo } from '../utils/session'
import { API_URL } from '../config/api.js'
import { Helmet } from 'react-helmet-async'
import './ProfilePage.css'

const RANK_TIERS = [
  { min: 500, label: 'Leyenda',    color: '#f59e0b' },
  { min: 200, label: 'Maestro',    color: '#a78bfa' },
  { min: 75,  label: 'Veterano',   color: '#60a5fa' },
  { min: 20,  label: 'Explorador', color: '#34d399' },
  { min: 0,   label: 'Curioso',    color: '#9ca3af' },
]
function getRank(totalMessages) {
  return RANK_TIERS.find(t => totalMessages >= t.min) ?? RANK_TIERS[RANK_TIERS.length - 1]
}

const MODE_META = {
  interrogation:  { label: 'Interrogatorio',      emoji: '🕵️' },
  swipe:          { label: 'Swipe',               emoji: '🃏' },
  dilema:         { label: 'Dilemas',             emoji: '⚖️' },
  story:          { label: 'Historia',            emoji: '📖' },
  parecido:       { label: '¿A quién te parecés?',emoji: '🪞' },
  guess:          { label: 'Adivina el Personaje',emoji: '🔍' },
  confesionario:  { label: 'Confesionario',       emoji: '🪑' },
  'este-o-ese':   { label: 'Este o Ese',          emoji: '⚡' },
}

function getActivityGrid(daysBack = 28) {
  const now = Date.now()
  const dayCounts = {}
  characters.forEach(char => {
    try {
      const raw = localStorage.getItem(`chat-${char.id}`)
      if (!raw) return
      JSON.parse(raw).forEach(msg => {
        if (!msg.ts) return
        const daysAgo = Math.floor((now - msg.ts) / 86400000)
        if (daysAgo < daysBack) {
          const key = daysAgo
          dayCounts[key] = (dayCounts[key] || 0) + 1
        }
      })
    } catch { /* ignore */ }
  })
  return Array.from({ length: daysBack }, (_, i) => ({
    daysAgo: daysBack - 1 - i,
    count: dayCounts[daysBack - 1 - i] || 0,
  }))
}

function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!target) return
    let frame
    const start = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) { frame = requestAnimationFrame(tick) }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return count
}

export default function ProfilePage() {
  const { user, session, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()

  const [affinities, setAffinities] = useState([])
  const [mission, setMission] = useState(null)
  const [dilemasCount, setDilemasCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [dailyCount, setDailyCount] = useState(0)
  const [modeCompletions, setModeCompletions] = useState({})
  const [customCharsCount, setCustomCharsCount] = useState(0)
  const [interrogationResults, setInterrogationResults] = useState([])
  const { unlockedIds, checkAndUnlock, newlyUnlocked, dismissToast } = useAchievements()
  const { streak } = useStreak()

  const nextAchievement = useMemo(() => {
    return ACHIEVEMENTS.find(a => !unlockedIds.has(a.id)) ?? null
  }, [unlockedIds])

  useEffect(() => {
    if (authLoading) return
    if (!session) { navigate(ROUTES.AUTH, { state: { message: 'Iniciá sesión para ver tu perfil y progreso.' } }); return }
    const headers = { Authorization: `Bearer ${session.access_token}` }
    Promise.all([
      fetch(`${API_URL}/db/affinity`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/db/mission-progress`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/db/dilema-seen`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/db/daily-challenge`, { headers }).then(r => r.json()).catch(() => ({ completed: false })),
      fetch(`${API_URL}/db/mode-completions`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_URL}/db/custom-characters`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/db/interrogation-results`, { headers }).then(r => r.json()).catch(() => []),
    ]).then(([aff, mis, seen, dailyStatus, modeComp, customChars, intrResults]) => {
      setCustomCharsCount(Array.isArray(customChars) ? customChars.length : 0)
      setInterrogationResults(Array.isArray(intrResults) ? intrResults : [])
      const seenCount = Array.isArray(seen) ? seen.length : 0
      setDilemasCount(seenCount)
      // Contar desafíos completados (aproximado: si completó hoy, al menos 1)
      const dCount = dailyStatus?.completed ? 1 : 0
      setDailyCount(dCount)
      setModeCompletions(typeof modeComp === 'object' && modeComp !== null ? modeComp : {})
      // Afinidades: si DB está vacía pero localStorage tiene datos, sincronizar
      if (!Array.isArray(aff) || aff.length === 0) {
        try {
          const meta = JSON.parse(localStorage.getItem('chat-history-meta') || '{}')
          const entries = Object.entries(meta)
          if (entries.length > 0) {
            entries.forEach(([characterId, data]) => {
              fetch(`${API_URL}/db/affinity`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId, messageCount: data.messageCount })
              }).catch(() => {})
            })
            localStorage.removeItem('chat-history-meta')
            setAffinities(entries.map(([character_id, data]) => ({
              character_id,
              message_count: data.messageCount
            })))
          } else {
            setAffinities([])
          }
        } catch { setAffinities([]) }
      } else {
        setAffinities(aff)
      }

      // Misiones: si DB está vacía o devolvió error, usar localStorage
      if (!mis || !mis.highestUnlocked || mis.highestUnlocked <= 1) {
        const local = getMissionProgress()
        if (local.highestUnlocked > 1) {
          fetch(`${API_URL}/db/mission-progress`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ highestUnlocked: local.highestUnlocked, completedLevels: local.completedLevels })
          }).catch(() => {})
          resetProgress()
          setMission(local)
          return
        }
      }
      setMission(mis)
    }).catch(() => {
      setFetchError(true)
      setMission(getMissionProgress())
      setAffinities([])
    }).finally(() => setLoading(false))
  }, [session, navigate, authLoading])

  // Verificar logros cuando los datos están listos
  useEffect(() => {
    if (loading) return
    const totalMessages = affinities.reduce((sum, a) => sum + (a.message_count || 0), 0)
    const completedLevels = mission ? Object.keys(mission.completedLevels || {}).length : 0
    const charactersCount = affinities.length
    const guessScore = (() => { try { return parseInt(localStorage.getItem('guess-best-score') || '0') } catch { return 0 } })()
    checkAndUnlock({ totalMessages, completedLevels, charactersCount, dilemasCount, guessScore, dailyCompleted: dailyCount, modeCompletions, streakCurrent: streak.current, customCharCreated: customCharsCount })
  }, [loading, modeCompletions, affinities, mission, dilemasCount, dailyCount, checkAndUnlock, streak, customCharsCount])

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // si falla el signOut remoto, igual limpiamos la sesion local
    }
    navigate(ROUTES.HOME)
  }

  const activeAffinities = affinities
    .map(a => {
      const char = characters.find(c => c.id === a.character_id)
      if (!char) return null
      const level = getAffinityLevel(a.message_count)
      return { ...a, char, level }
    })
    .filter(Boolean)
    .filter(a => a.level > 0)
    .sort((a, b) => b.message_count - a.message_count)

  const totalMessages = affinities.reduce((sum, a) => sum + (a.message_count || 0), 0)
  const completedLevels = mission ? Object.keys(mission.completedLevels || {}).length : 0
  const highestLevel = mission?.highestUnlocked ?? 1
  const progressPct = Math.min(((highestLevel - 1) / 30) * 100, 100)

  const displayName = user?.user_metadata?.username || user?.email
  const initial = displayName?.[0]?.toUpperCase()

  const animChars   = useCountUp(loading ? 0 : affinities.filter(a => a.message_count > 0).length)
  const animMsgs    = useCountUp(loading ? 0 : totalMessages)
  const animLevels  = useCountUp(loading ? 0 : completedLevels)
  const animStreak  = useCountUp(loading ? 0 : streak.current)

  const rank = getRank(totalMessages)

  const favMode = useMemo(() => {
    const entries = Object.entries(modeCompletions).filter(([, v]) => v > 0)
    if (!entries.length) return null
    const [key, count] = entries.sort((a, b) => b[1] - a[1])[0]
    return { key, count, ...MODE_META[key] }
  }, [modeCompletions])

  const activityGrid = useMemo(() => getActivityGrid(28), [])

  if (authLoading || !user) return null

  // ── CTA contextual "Próximo paso" ──
  const SUGGESTED_MODES = [
    { key: 'interrogation', label: 'Interrogatorio', desc: '¿Podés detectar la mentira?', route: '/interrogation', duration: '~8 min' },
    { key: 'swipe',         label: 'Swipe',          desc: 'Verdad o mentira en segundos.',   route: '/swipe',         duration: '~2 min' },
    { key: 'dilema',        label: 'Dilemas',         desc: 'Sin respuesta correcta.',          route: '/dilema',        duration: '~5 min' },
    { key: 'story',         label: 'Historia',        desc: 'Una narrativa que cambia con vos.',route: '/story',         duration: '~10 min' },
    { key: 'parecido',      label: '¿A quién te parecés?', desc: 'Descubrí tu personaje.',    route: '/parecido',      duration: '~4 min' },
    { key: 'guess',         label: 'Adivina el Personaje', desc: 'Pistas de a una. Cada una baja tu puntaje.', route: '/guess', duration: '~3 min' },
  ]

  const nextStep = (() => {
    if (!loading) {
      if (streak.current > 0 && dailyCount === 0) {
        return { type: 'daily', label: 'Desafío del día', desc: `No rompas tu racha de ${streak.current} ${streak.current === 1 ? 'día' : 'días'}`, route: '/', duration: null }
      }
      const untriedMode = SUGGESTED_MODES.find(m => !modeCompletions[m.key])
      if (untriedMode) return { type: 'mode', ...untriedMode }
      if (activeAffinities.length === 0) return { type: 'chat' }
    }
    return null
  })()

  return (
    <div className="pp">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Toasts de logros recién desbloqueados */}
      {newlyUnlocked.length > 0 && (
        <AchievementToast
          achievement={newlyUnlocked[0]}
          onDismiss={() => dismissToast(newlyUnlocked[0].id)}
        />
      )}
      <div className="pp-grain" aria-hidden="true" />

      {/* ── HERO ── */}
      <div className="pp-hero">
        <div className="pp-hero__inner">
          <button className="pp-back" onClick={() => navigate(ROUTES.HOME)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Volver
          </button>

          <div className="pp-hero__profile">
            <div className="pp-avatar">{initial}</div>
            <div className="pp-hero__meta">
              <h1 className="pp-username">{displayName}</h1>
              <span className="pp-tag" style={{ color: rank.color }}>EchoVerse · {rank.label}</span>
            </div>
          </div>

          {/* Stats strip */}
          <div className="pp-stats">
            <div className="pp-stat">
              <svg className="pp-stat__icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
              <span className="pp-stat__num">{animChars}</span>
              <span className="pp-stat__label">Personajes</span>
            </div>
            <div className="pp-stats__rule" />
            <div className="pp-stat">
              <svg className="pp-stat__icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-5 4V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
              </svg>
              <span className="pp-stat__num">{animMsgs}</span>
              <span className="pp-stat__label">Mensajes</span>
            </div>
            <div className="pp-stats__rule" />
            <div className="pp-stat">
              <svg className="pp-stat__icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
              </svg>
              <span className="pp-stat__num">{animLevels}</span>
              <span className="pp-stat__label">Niveles</span>
            </div>
            <div className="pp-stats__rule" />
            <div className="pp-stat pp-stat--streak">
              <svg className="pp-stat__icon pp-stat__icon--streak" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-3-2-5-2-5s0 3-3 4c2-4 0-9 0-9z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
              </svg>
              <span className="pp-stat__num">{animStreak}</span>
              <span className="pp-stat__label">Racha</span>
            </div>
          </div>

          {user?.email === 'cristian.aiki1@gmail.com' && (
            <button className="pp-admin-link" onClick={() => navigate(ROUTES.ADMIN)}>Panel admin</button>
          )}
          <button className="pp-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      {/* ── ACTIVIDAD + MODO FAVORITO ── */}
      {!loading && (
        <div className="pp-insights">
          <div className="pp-activity">
            <span className="pp-activity__label">Actividad — últimos 28 días</span>
            <div className="pp-activity__grid">
              {activityGrid.map((day, i) => {
                const intensity = day.count === 0 ? 0 : day.count < 5 ? 1 : day.count < 15 ? 2 : 3
                return (
                  <div
                    key={i}
                    className={`pp-activity__day pp-activity__day--${intensity}`}
                    title={day.count > 0 ? `${day.count} mensajes` : 'Sin actividad'}
                  />
                )
              })}
            </div>
          </div>
          {favMode && (
            <div className="pp-fav-mode">
              <span className="pp-fav-mode__label">Modo favorito</span>
              <span className="pp-fav-mode__emoji">{favMode.emoji}</span>
              <span className="pp-fav-mode__name">{favMode.label}</span>
              <span className="pp-fav-mode__count">{favMode.count}x jugado</span>
            </div>
          )}
        </div>
      )}

      {/* ── PRÓXIMO PASO ── */}
      {!loading && nextStep && (
        <div className="pp-next-step-wrap">
          <div
            className="pp-next-step"
            onClick={() => navigate(nextStep.type === 'chat' ? ROUTES.CHAT : nextStep.route)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate(nextStep.type === 'chat' ? ROUTES.CHAT : nextStep.route)}
          >
            <div className="pp-next-step__left">
              <span className="pp-next-step__eyebrow">
                {nextStep.type === 'daily' ? '🔥 Racha en riesgo' : 'Próximo paso'}
              </span>
              <span className="pp-next-step__title">
                {nextStep.type === 'chat' ? 'Empezá a chatear con un personaje' : nextStep.label}
              </span>
              <span className="pp-next-step__desc">
                {nextStep.type === 'chat' ? 'Todavía no tenés afinidad con nadie. Empezá ahora.' : nextStep.desc}
                {nextStep.duration && <span className="pp-next-step__dur"> · {nextStep.duration}</span>}
              </span>
            </div>
            <span className="pp-next-step__arrow">→</span>
          </div>
        </div>
      )}

      <div className="pp-body">

        {loading ? (
          <div className="pp-skeleton-layout">
            <div className="pp-section">
              <div className="skeleton pp-skeleton-title" />
              <div className="skeleton pp-skeleton-block" />
            </div>
            <div className="pp-section">
              <div className="skeleton pp-skeleton-title" />
              <div className="pp-skeleton-cards">
                {[1,2,3].map(i => <div key={i} className="skeleton pp-skeleton-card" />)}
              </div>
            </div>
            <div className="pp-section">
              <div className="skeleton pp-skeleton-title" />
              <div className="pp-skeleton-cards">
                {[1,2,3,4].map(i => <div key={i} className="skeleton pp-skeleton-ach" />)}
              </div>
            </div>
            {fetchError && (
              <div className="pp-error-banner">
                <span>⚠️ No se pudieron cargar algunos datos.</span>
                <button className="pp-retry-btn" onClick={() => { setFetchError(false); setLoading(true); window.location.reload() }}>
                  Reintentar
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── CAMPAÑA ── */}
            <section className="pp-section">
              <div className="pp-section__header">
                <span className="pp-section__eyebrow">PROGRESO</span>
                <h2 className="pp-section__title">Campaña</h2>
              </div>

              {highestLevel > 1 ? (
                <div className="pp-mission">
                  <div className="pp-mission__top">
                    <div>
                      <span className="pp-mission__lvl">Nivel {highestLevel - 1}</span>
                      <span className="pp-mission__sub">{completedLevels} de 30 niveles completados</span>
                    </div>
                    <button className="pp-mission__cta" onClick={() => navigate(ROUTES.MISSION)}>
                      Continuar →
                    </button>
                  </div>
                  <div className="pp-bar">
                    <div className="pp-bar__fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="pp-mission__footer">
                    <span className="pp-mission__pct">{Math.round(progressPct)}% completado</span>
                    <span className="pp-mission__next">Siguiente: Nivel {highestLevel}</span>
                  </div>
                </div>
              ) : (
                <div className="pp-empty-cta" onClick={() => navigate(ROUTES.MISSION)}>
                  <span className="pp-empty-cta__icon">⚔️</span>
                  <div>
                    <p className="pp-empty-cta__title">Todavía no empezaste la campaña</p>
                    <p className="pp-empty-cta__sub">30 niveles te esperan. Empezá ahora →</p>
                  </div>
                </div>
              )}
            </section>

            {/* ── AFINIDADES ── */}
            <section className="pp-section">
              <div className="pp-section__header">
                <span className="pp-section__eyebrow">VÍNCULOS</span>
                <h2 className="pp-section__title">Afinidades</h2>
              </div>

              {activeAffinities.length > 0 ? (
                <div className="pp-chars">
                  {activeAffinities.map(a => {
                    const lastTs = (() => {
                      try {
                        const raw = localStorage.getItem(chatHistoryKey(a.character_id))
                        if (!raw) return null
                        const msgs = JSON.parse(raw)
                        return msgs?.[msgs.length - 1]?.ts ?? null
                      } catch { return null }
                    })()
                    return (
                    <button
                      key={a.character_id}
                      className="pp-char-card"
                      style={{ '--cc': a.char.themeColor, '--cg': a.char.gradient }}
                      onClick={() => navigate(ROUTES.CHAT_CHARACTER(a.character_id))}
                    >
                      <div className="pp-char-card__img-wrap">
                        <img src={a.char.image} alt={a.char.name} className="pp-char-card__img" loading="lazy" decoding="async" />
                        <div className="pp-char-card__fade" />
                      </div>
                      <div className="pp-char-card__body">
                        <span className="pp-char-card__level">{getAffinityEmoji(a.level)} {getAffinityLabel(a.level)}</span>
                        <span className="pp-char-card__name">{a.char.name}</span>
                        <span className="pp-char-card__msgs">{a.message_count} mensajes</span>
                        {lastTs && <span className="pp-char-card__last">{timeAgo(lastTs)}</span>}
                      </div>
                      <div className="pp-char-card__enter">Chatear →</div>
                    </button>
                    )
                  })}
                </div>
              ) : (
                <div className="pp-empty-cta" onClick={() => navigate(ROUTES.CHAT)}>
                  <span className="pp-empty-cta__icon">💬</span>
                  <div>
                    <p className="pp-empty-cta__title">Todavía no tenés afinidad con ningún personaje</p>
                    <p className="pp-empty-cta__sub">Chateá 5 mensajes con alguno para empezar →</p>
                  </div>
                </div>
              )}
            </section>
            {/* ── INTERROGATORIOS ── */}
            <section className="pp-section">
              <div className="pp-section__header">
                <span className="pp-section__eyebrow">HISTORIAL</span>
                <h2 className="pp-section__title">Interrogatorios</h2>
              </div>
              {interrogationResults.length > 0 ? (
                <div className="pp-intr-list">
                  {interrogationResults.slice(0, 5).map(r => {
                    const char = characters.find(c => c.id === r.character_id)
                    return (
                      <div key={r.id} className={`pp-intr-row ${r.correct ? 'pp-intr-row--correct' : 'pp-intr-row--wrong'}`}>
                        <span className="pp-intr-row__verdict">{r.correct ? '✓' : '✗'}</span>
                        {char && <img className="pp-intr-row__avatar" src={char.image} alt={char.name} loading="lazy" decoding="async" />}
                        <div className="pp-intr-row__body">
                          <span className="pp-intr-row__char">{char?.name ?? r.character_id}</span>
                          <span className="pp-intr-row__rank">{r.rank}</span>
                        </div>
                        <span className="pp-intr-row__meta">{r.total_questions}P · {timeAgo(new Date(r.played_at).getTime())}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="pp-empty-cta" onClick={() => navigate(ROUTES.INTERROGATION)}>
                  <span className="pp-empty-cta__icon">🕵️</span>
                  <div>
                    <p className="pp-empty-cta__title">Todavía no hiciste ningún interrogatorio</p>
                    <p className="pp-empty-cta__sub">Detectá mentiras. Descubrí la verdad →</p>
                  </div>
                </div>
              )}
            </section>

            {/* ── LOGROS ── */}
            <section className="pp-section">
              <div className="pp-section__header">
                <span className="pp-section__eyebrow">PROGRESIÓN</span>
                <h2 className="pp-section__title">Logros</h2>
              </div>

              {nextAchievement && (
                <div className="pp-next-achievement">
                  <span className="pp-next-achievement__icon">{nextAchievement.emoji}</span>
                  <div className="pp-next-achievement__info">
                    <span className="pp-next-achievement__label">Próximo logro</span>
                    <span className="pp-next-achievement__name">{nextAchievement.name}</span>
                    <p className="pp-next-achievement__desc">{nextAchievement.desc}</p>
                  </div>
                </div>
              )}

              <div className="pp-achievements">
                {ACHIEVEMENTS.map(a => {
                  const unlocked = unlockedIds.has(a.id)
                  return (
                    <div
                      key={a.id}
                      className={`pp-badge ${unlocked ? 'pp-badge--unlocked' : 'pp-badge--locked'}`}
                      data-tooltip={!unlocked ? a.desc : undefined}
                    >
                      <span className="pp-badge__emoji">{unlocked ? a.emoji : '🔒'}</span>
                      <span className="pp-badge__name">{a.name}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
