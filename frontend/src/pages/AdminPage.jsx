import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api.js'
import './AdminPage.css'

const ADMIN_EMAIL = 'cristian.aiki1@gmail.com'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}

function isThisWeek(dateStr) {
  if (!dateStr) return false
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000
}

const DeleteIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, session } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [chars, setChars] = useState([])
  const [charsLoading, setCharsLoading] = useState(true)
  const [charsError, setCharsError] = useState(null)
  const [deletingChar, setDeletingChar] = useState(null)
  const [charSearch, setCharSearch] = useState('')

  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (!isAdmin) return
    fetchUsers()
    fetchChars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (!res.ok) throw new Error('Error al cargar usuarios')
      const data = await res.json()
      setUsers(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchChars() {
    try {
      const res = await fetch(`${API_URL}/admin/custom-characters`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setChars(data)
    } catch (e) {
      setCharsError(e.message)
    } finally {
      setCharsLoading(false)
    }
  }

  async function handleDeleteChar(char) {
    if (!confirm(`¿Borrar el personaje "${char.name}"? Esta acción no se puede deshacer.`)) return
    setDeletingChar(char.id)
    try {
      const res = await fetch(`${API_URL}/admin/custom-characters/${char.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (res.ok) setChars(prev => prev.filter(c => c.id !== char.id))
    } finally {
      setDeletingChar(null)
    }
  }

  async function handleDeleteUser(u) {
    if (!confirm(`¿Borrar la cuenta de ${u.email}? Esta acción no se puede deshacer.`)) return
    setDeleting(u.id)
    try {
      const res = await fetch(`${API_URL}/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (res.ok) setUsers(prev => prev.filter(x => x.id !== u.id))
    } finally {
      setDeleting(null)
    }
  }

  // Mapa userId → email para cruzar en la tabla de personajes
  const userEmailMap = useMemo(() => {
    const map = {}
    users.forEach(u => { map[u.id] = u.email })
    return map
  }, [users])

  // Stats
  const newUsersThisWeek = useMemo(() => users.filter(u => isThisWeek(u.created_at)).length, [users])
  const newCharsThisWeek = useMemo(() => chars.filter(c => isThisWeek(c.created_at)).length, [chars])

  // Filtros
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase()
    return q ? users.filter(u => u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)) : users
  }, [users, userSearch])

  const filteredChars = useMemo(() => {
    const q = charSearch.toLowerCase()
    return q ? chars.filter(c => c.name?.toLowerCase().includes(q)) : chars
  }, [chars, charSearch])

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <p>Acceso denegado.</p>
        <button className="btn-ghost" onClick={() => navigate(ROUTES.HOME)}>Volver</button>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <button className="admin-header__back btn-ghost" onClick={() => navigate(ROUTES.HOME)}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Inicio
        </button>
        <div className="admin-header__info">
          <h1 className="admin-header__title">Panel de administración</h1>
          <div className="admin-stats">
            <span className="admin-stat"><strong>{users.length}</strong> usuarios</span>
            <span className="admin-stat admin-stat--accent">+{newUsersThisWeek} esta semana</span>
            <span className="admin-stat"><strong>{chars.length}</strong> personajes</span>
            <span className="admin-stat admin-stat--accent">+{newCharsThisWeek} esta semana</span>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {/* ── Columna izquierda: Usuarios ── */}
        <section className="admin-col">
          <div className="admin-col__header">
            <h2 className="admin-col__title">Usuarios ({filteredUsers.length})</h2>
            <input
              className="admin-search"
              type="search"
              placeholder="Buscar por email…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
          </div>
          {loading && <p className="admin-loading">Cargando...</p>}
          {error && <p className="admin-error">{error}</p>}
          {!loading && !error && (
            <div className="admin-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Registrado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={u.email === ADMIN_EMAIL ? 'admin-table__row--self' : ''}>
                      <td className="admin-table__email">{u.email}</td>
                      <td className="admin-table__username">{u.username || <span className="admin-table__empty">—</span>}</td>
                      <td className="admin-table__date">{timeAgo(u.created_at)}</td>
                      <td className="admin-table__actions">
                        {u.email !== ADMIN_EMAIL && (
                          <button
                            className="admin-delete-btn"
                            onClick={() => handleDeleteUser(u)}
                            disabled={deleting === u.id}
                            title="Borrar usuario"
                          >
                            {deleting === u.id ? '...' : <DeleteIcon />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={4} className="admin-table__empty" style={{ textAlign: 'center', padding: '1.5rem' }}>Sin resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Columna derecha: Personajes ── */}
        <section className="admin-col">
          <div className="admin-col__header">
            <h2 className="admin-col__title">Personajes ({filteredChars.length})</h2>
            <input
              className="admin-search"
              type="search"
              placeholder="Buscar por nombre…"
              value={charSearch}
              onChange={e => setCharSearch(e.target.value)}
            />
          </div>
          {charsLoading && <p className="admin-loading">Cargando...</p>}
          {charsError && <p className="admin-error">{charsError}</p>}
          {!charsLoading && !charsError && (
            <div className="admin-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Personaje</th>
                    <th>Creador</th>
                    <th>Creado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChars.map(c => (
                    <tr key={c.id}>
                      <td className="admin-table__email">
                        {c.avatar_url
                          ? <img src={c.avatar_url} alt={c.name} className="admin-char-avatar" />
                          : <span style={{ marginRight: '0.4rem' }}>{c.emoji}</span>
                        }
                        {c.name}
                      </td>
                      <td className="admin-table__username">
                        {userEmailMap[c.user_id] ?? <span className="admin-table__empty">{c.user_id.slice(0, 8)}…</span>}
                      </td>
                      <td className="admin-table__date">{timeAgo(c.created_at)}</td>
                      <td className="admin-table__actions">
                        <button
                          className="admin-delete-btn"
                          onClick={() => handleDeleteChar(c)}
                          disabled={deletingChar === c.id}
                          title="Borrar personaje"
                        >
                          {deletingChar === c.id ? '...' : <DeleteIcon />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredChars.length === 0 && (
                    <tr><td colSpan={4} className="admin-table__empty" style={{ textAlign: 'center', padding: '1.5rem' }}>Sin resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
