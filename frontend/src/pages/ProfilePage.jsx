import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { characters } from '../data/characters'
import { getAffinityLevel, getAffinityLabel, getAffinityEmoji } from '../utils/affinity'
import { API_URL } from '../config/api.js'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, session, logout } = useAuth()
  const navigate = useNavigate()

  const [affinities, setAffinities] = useState([])
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { navigate('/auth'); return }

    const headers = { Authorization: `Bearer ${session.access_token}` }

    Promise.all([
      fetch(`${API_URL}/db/affinity`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/db/mission-progress`, { headers }).then(r => r.json()),
    ]).then(([aff, mis]) => {
      setAffinities(Array.isArray(aff) ? aff : [])
      setMission(mis)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [session, navigate])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  if (!user) return null

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

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* Header */}
        <div className="profile-header">
          <button className="profile-back" onClick={() => navigate('/')}>← Volver</button>
          <div className="profile-user">
            <div className="profile-avatar">{user.email?.[0]?.toUpperCase()}</div>
            <div>
              <p className="profile-email">{user.email}</p>
              <p className="profile-since">Miembro de EchoVerse</p>
            </div>
          </div>
          <button className="profile-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>

        {loading ? (
          <div className="profile-loading">Cargando perfil…</div>
        ) : (
          <>
            {/* Misión */}
            <section className="profile-section">
              <h2 className="profile-section-title">Campaña</h2>
              {mission && mission.highestUnlocked > 1 ? (
                <div className="profile-mission-card">
                  <span className="profile-mission-level">Nivel {mission.highestUnlocked - 1} completado</span>
                  <span className="profile-mission-sub">
                    Siguiente: Nivel {mission.highestUnlocked} · {Object.keys(mission.completedLevels).length} niveles superados
                  </span>
                  <div className="profile-mission-bar">
                    <div
                      className="profile-mission-bar__fill"
                      style={{ width: `${Math.min(((mission.highestUnlocked - 1) / 30) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="profile-mission-pct">
                    {mission.highestUnlocked - 1}/30 niveles
                  </span>
                </div>
              ) : (
                <p className="profile-empty">Todavía no completaste ningún nivel de campaña.</p>
              )}
            </section>

            {/* Afinidades */}
            <section className="profile-section">
              <h2 className="profile-section-title">Afinidades</h2>
              {activeAffinities.length > 0 ? (
                <div className="profile-affinity-grid">
                  {activeAffinities.map(a => (
                    <button
                      key={a.character_id}
                      className="profile-affinity-card"
                      style={{ '--char-color': a.char.themeColor }}
                      onClick={() => navigate(`/chat/${a.character_id}`)}
                    >
                      <img src={a.char.image} alt={a.char.name} className="profile-affinity-card__img" />
                      <div className="profile-affinity-card__info">
                        <span className="profile-affinity-card__name">{a.char.name}</span>
                        <span className="profile-affinity-card__badge">
                          {getAffinityEmoji(a.level)} {getAffinityLabel(a.level)}
                        </span>
                        <span className="profile-affinity-card__count">{a.message_count} mensajes</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="profile-empty">Todavía no tenés afinidad con ningún personaje. ¡Empezá a chatear!</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
