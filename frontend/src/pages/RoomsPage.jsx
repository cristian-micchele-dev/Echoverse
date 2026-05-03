import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api.js'
import CreateRoomModal from './rooms/CreateRoomModal.jsx'
import RoomCard from './rooms/RoomCard.jsx'
import './RoomsPage.css'

export default function RoomsPage() {
  const navigate = useNavigate()
  const { user, session } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const isAdmin = user?.email === 'cristian.aiki1@gmail.com'

  async function fetchRooms() {
    try {
      const res = await fetch(`${API_URL}/rooms`)
      if (!res.ok) throw new Error('Error al cargar salas')
      const data = await res.json()
      setRooms(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 15000)
    return () => clearInterval(interval)
  }, [])

  async function handleCreate(characterId, name) {
    if (!session) { navigate(ROUTES.AUTH, { state: { message: 'Iniciá sesión para crear una sala.' } }); return }
    const res = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ characterId, name })
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error)
    }
    const room = await res.json()
    navigate(ROUTES.SALA(room.id))
  }

  return (
    <div className="rm-page">
      <header className="rm-page__header">
        <div className="rm-page__header-top">
          <button className="rm-page__back btn-ghost" onClick={() => navigate(ROUTES.MODOS)}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Modos
          </button>
          <button
            className="btn-primary rm-page__create-btn"
            onClick={() => user ? setShowModal(true) : navigate(ROUTES.AUTH)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Nueva sala
          </button>
        </div>

        <div className="rm-page__hero">
          <h1 className="rm-page__title">Salas en vivo</h1>
          <p className="rm-page__subtitle">
            Entrás a una sala junto a otros usuarios y chatean con un personaje al mismo tiempo.
            Cada uno puede escribirle, disparar <strong>eventos dramáticos</strong> que interrumpen la conversación,
            o crear <strong>votaciones grupales</strong> para que el personaje reaccione al resultado colectivo.
          </p>
          <div className="rm-page__pills">
            <span className="rm-page__pill">⚡ Eventos grupales</span>
            <span className="rm-page__pill">📊 Votaciones en vivo</span>
            <span className="rm-page__pill">👥 Varios usuarios</span>
            <span className="rm-page__pill">🔴 Tiempo real</span>
          </div>
        </div>
      </header>

      <main className="rm-page__main">
        {loading && (
          <div className="rm-skeleton-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rm-skeleton-card skeleton" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rm-empty">
            <p className="rm-empty__text">Error al cargar las salas. Intentá de nuevo.</p>
            <button className="btn-ghost" onClick={fetchRooms}>Reintentar</button>
          </div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <div className="rm-empty">
            <div className="rm-empty__icon" aria-hidden="true">👥</div>
            <h2 className="rm-empty__title">No hay salas activas</h2>
            <p className="rm-empty__text">Sé el primero en crear una sala y chatear con un personaje.</p>
            <button
              className="btn-primary"
              onClick={() => user ? setShowModal(true) : navigate(ROUTES.AUTH)}
            >
              Crear la primera sala
            </button>
          </div>
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className="rm-grid">
            {rooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                isAdmin={isAdmin}
                session={session}
                onDelete={id => setRooms(prev => prev.filter(r => r.id !== id))}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <CreateRoomModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
