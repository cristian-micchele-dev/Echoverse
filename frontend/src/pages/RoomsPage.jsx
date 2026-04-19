import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api.js'
import './RoomsPage.css'

const charById = Object.fromEntries(characters.map(c => [c.id, c]))

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}

// ─── Modal: Crear sala ────────────────────────────────────────────────────────

function CreateRoomModal({ onClose, onCreate }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.universe.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate() {
    if (!selected || creating) return
    setCreating('loading')
    try {
      await onCreate(selected.id, name.trim())
    } catch {
      setCreating('')
    }
  }

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={e => e.stopPropagation()}>
        <div className="rm-modal__header">
          <h2 className="rm-modal__title">Nueva sala</h2>
          <button className="rm-modal__close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="rm-modal__search-wrap">
          <input
            ref={inputRef}
            className="input-base rm-modal__search"
            placeholder="Buscar personaje..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="rm-modal__grid">
          {filtered.map(char => (
            <button
              key={char.id}
              className={`rm-modal__char ${selected?.id === char.id ? 'rm-modal__char--active' : ''}`}
              onClick={() => setSelected(char)}
              style={selected?.id === char.id ? { '--char-accent': char.themeColor } : {}}
            >
              <img src={char.image} alt={char.name} className="rm-modal__char-img" />
              <span className="rm-modal__char-name">{char.name}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="rm-modal__footer">
            <input
              className="input-base rm-modal__name-input"
              placeholder={`Nombre de la sala (opcional)`}
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button
              className="btn-primary rm-modal__create-btn"
              onClick={handleCreate}
              disabled={creating === 'loading'}
            >
              {creating === 'loading' ? 'Creando...' : `Crear sala con ${selected.name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({ room, isAdmin, session, onDelete }) {
  const navigate = useNavigate()
  const char = charById[room.character_id]
  if (!char) return null

  async function handleDelete(e) {
    e.stopPropagation()
    if (!confirm(`¿Borrar la sala de ${char.name}?`)) return
    const res = await fetch(`${API_URL}/rooms/${room.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    if (res.ok) onDelete(room.id)
  }

  return (
    <article
      className="rm-card"
      style={{ '--room-color': char.themeColor, '--room-gradient': char.gradient }}
      onClick={() => navigate(ROUTES.SALA(room.id))}
    >
      <div className="rm-card__bg" />

      {isAdmin && (
        <button
          className="rm-card__delete-btn"
          onClick={handleDelete}
          title="Borrar sala"
          aria-label="Borrar sala"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className="rm-card__img-wrap">
        <img src={char.image} alt={char.name} className="rm-card__img" />
        <div className="rm-card__img-fade" />
      </div>

      <div className="rm-card__body">
        <div className="rm-card__top">
          <span className="rm-card__char-name">{char.name}</span>
          {room.is_ai_responding && (
            <span className="rm-card__typing-badge">
              <span className="rm-card__typing-dot" />
              respondiendo
            </span>
          )}
        </div>

        {room.name
          ? <p className="rm-card__room-name">"{room.name}"</p>
          : <p className="rm-card__room-name rm-card__room-name--empty">Sin nombre</p>
        }

        <div className="rm-card__footer">
          <span className="rm-card__time">{timeAgo(room.created_at)}</span>
          <span className="rm-card__enter">
            Entrar
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    if (!session) { navigate(ROUTES.AUTH); return }
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
