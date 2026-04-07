import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { characters } from '../data/characters'
import { getAffinityLevel, getAffinityLabel, getAffinityEmoji } from '../utils/affinity'
import { getMissionProgress } from '../utils/missionProgress'
import { API_URL } from '../config/api.js'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, session, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()

  const [affinities, setAffinities] = useState([])
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!session) { navigate('/auth'); return }
    const headers = { Authorization: `Bearer ${session.access_token}` }
    Promise.all([
      fetch(`${API_URL}/db/affinity`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/db/mission-progress`, { headers }).then(r => r.json()),
    ]).then(([aff, mis]) => {
      setAffinities(Array.isArray(aff) ? aff : [])
      // Si DB está vacía pero localStorage tiene progreso, sincronizar y usar el local
      if (!mis || mis.highestUnlocked <= 1) {
        const local = getMissionProgress()
        if (local.highestUnlocked > 1) {
          fetch(`${API_URL}/db/mission-progress`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ highestUnlocked: local.highestUnlocked, completedLevels: local.completedLevels })
          }).catch(() => {})
          setMission(local)
          return
        }
      }
      setMission(mis)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [session, navigate, authLoading])

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
          </>
        )}
      </div>
    </div>
  )
}
