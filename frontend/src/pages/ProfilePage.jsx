import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { characters } from '../data/characters'
import { ACHIEVEMENTS } from '../data/achievements'
import { getAffinityLevel, getAffinityLabel, getAffinityEmoji } from '../utils/affinity'
import { getMissionProgress, resetProgress } from '../utils/missionProgress'
import { useAchievements } from '../hooks/useAchievements'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import { API_URL } from '../config/api.js'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, session, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()

  const [affinities, setAffinities] = useState([])
  const [mission, setMission] = useState(null)
  const [dilemasCount, setDilemasCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dailyCount, setDailyCount] = useState(0)
  const { unlockedIds, checkAndUnlock, newlyUnlocked, dismissToast } = useAchievements()

  useEffect(() => {
    if (authLoading) return
    if (!session) { navigate('/auth'); return }
    const headers = { Authorization: `Bearer ${session.access_token}` }
    Promise.all([
      fetch(`${API_URL}/db/affinity`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/db/mission-progress`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/db/dilema-seen`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/db/daily-challenge`, { headers }).then(r => r.json()).catch(() => ({ completed: false })),
    ]).then(([aff, mis, seen, dailyStatus]) => {
      const seenCount = Array.isArray(seen) ? seen.length : 0
      setDilemasCount(seenCount)
      // Contar desafíos completados (aproximado: si completó hoy, al menos 1)
      const dCount = dailyStatus?.completed ? 1 : 0
      setDailyCount(dCount)
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
      // Fallback a localStorage si el fetch falla (backend caído, red, etc.)
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
    checkAndUnlock({ totalMessages, completedLevels, charactersCount, dilemasCount, guessScore, dailyCompleted: dailyCount })
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // si falla el signOut remoto, igual limpiamos la sesion local
    }
    navigate('/')
  }

  if (authLoading || !user) return null

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

  const displayName = user.user_metadata?.username || user.email
  const initial = displayName?.[0]?.toUpperCase()

  return (
    <div className="pp">
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
          <button className="pp-back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Volver
          </button>

          <div className="pp-hero__profile">
            <div className="pp-avatar">{initial}</div>
            <div className="pp-hero__meta">
              <h1 className="pp-username">{displayName}</h1>
              <span className="pp-tag">EchoVerse · Explorador</span>
            </div>
          </div>

          {/* Stats strip */}
          <div className="pp-stats">
            <div className="pp-stat">
              <span className="pp-stat__num">{activeAffinities.length}</span>
              <span className="pp-stat__label">Personajes</span>
            </div>
            <div className="pp-stats__rule" />
            <div className="pp-stat">
              <span className="pp-stat__num">{totalMessages}</span>
              <span className="pp-stat__label">Mensajes</span>
            </div>
            <div className="pp-stats__rule" />
            <div className="pp-stat">
              <span className="pp-stat__num">{completedLevels}</span>
              <span className="pp-stat__label">Niveles</span>
            </div>
          </div>

          <button className="pp-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <div className="pp-body">

        {loading ? (
          <div className="pp-loading">
            <div className="pp-spinner" />
            <span>Cargando perfil…</span>
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
                    <button className="pp-mission__cta" onClick={() => navigate('/mission')}>
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
                <div className="pp-empty-cta" onClick={() => navigate('/mission')}>
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
                  {activeAffinities.map(a => (
                    <button
                      key={a.character_id}
                      className="pp-char-card"
                      style={{ '--cc': a.char.themeColor, '--cg': a.char.gradient }}
                      onClick={() => navigate(`/chat/${a.character_id}`)}
                    >
                      <div className="pp-char-card__img-wrap">
                        <img src={a.char.image} alt={a.char.name} className="pp-char-card__img" />
                        <div className="pp-char-card__fade" />
                      </div>
                      <div className="pp-char-card__body">
                        <span className="pp-char-card__level">{getAffinityEmoji(a.level)} {getAffinityLabel(a.level)}</span>
                        <span className="pp-char-card__name">{a.char.name}</span>
                        <span className="pp-char-card__msgs">{a.message_count} mensajes</span>
                      </div>
                      <div className="pp-char-card__enter">Chatear →</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="pp-empty-cta" onClick={() => navigate('/chat')}>
                  <span className="pp-empty-cta__icon">💬</span>
                  <div>
                    <p className="pp-empty-cta__title">Todavía no tenés afinidad con ningún personaje</p>
                    <p className="pp-empty-cta__sub">Chateá 5 mensajes con alguno para empezar →</p>
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

              <div className="pp-achievements">
                {ACHIEVEMENTS.map(a => {
                  const unlocked = unlockedIds.has(a.id)
                  return (
                    <div
                      key={a.id}
                      className={`pp-badge ${unlocked ? 'pp-badge--unlocked' : 'pp-badge--locked'}`}
                      title={a.desc}
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
