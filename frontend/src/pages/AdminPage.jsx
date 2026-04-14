import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, session } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (!isAdmin) return
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
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

  async function handleDeleteUser(u) {
    if (!confirm(`¿Borrar la cuenta de ${u.email}? Esta acción no se puede deshacer.`)) return
    setDeleting(u.id)
    try {
      const res = await fetch(`${API_URL}/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) setUsers(prev => prev.filter(x => x.id !== u.id))
    } finally {
      setDeleting(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <p>Acceso denegado.</p>
        <button className="btn-ghost" onClick={() => navigate('/')}>Volver</button>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <button className="admin-header__back btn-ghost" onClick={() => navigate('/')}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Inicio
        </button>
        <div>
          <h1 className="admin-header__title">Panel de administración</h1>
          <p className="admin-header__sub">{users.length} usuarios registrados</p>
        </div>
      </header>

      <main className="admin-main">
        {loading && <p className="admin-loading">Cargando...</p>}
        {error && <p className="admin-error">{error}</p>}

        {!loading && !error && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Registrado</th>
                <th>Último acceso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={u.email === ADMIN_EMAIL ? 'admin-table__row--self' : ''}>
                  <td className="admin-table__email">{u.email}</td>
                  <td className="admin-table__username">{u.username || <span className="admin-table__empty">—</span>}</td>
                  <td className="admin-table__date">{timeAgo(u.created_at)}</td>
                  <td className="admin-table__date">{timeAgo(u.last_sign_in_at)}</td>
                  <td className="admin-table__actions">
                    {u.email !== ADMIN_EMAIL && (
                      <button
                        className="admin-delete-btn"
                        onClick={() => handleDeleteUser(u)}
                        disabled={deleting === u.id}
                        title="Borrar usuario"
                      >
                        {deleting === u.id ? '...' : (
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}
