import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  function switchTab(newTab) {
    setTab(newTab)
    setError('')
    setInfo('')
    setUsername('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(email, password, username)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">EchoVerse</h1>
        <p className="auth-subtitle">Chatea con personajes icónicos</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Iniciar sesión
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
          >
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {tab === 'register' && (
            <input
              className="auth-input"
              type="text"
              placeholder="Nombre o usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={2}
              maxLength={30}
              autoComplete="username"
            />
          )}
          <input
            className="auth-input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
          />
          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {submitLabel}
          </button>
        </form>

        <button className="auth-skip" onClick={() => navigate('/')}>
          Continuar sin cuenta
        </button>
      </div>
    </div>
  )
}
