import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
        navigate('/')
      } else {
        await register(email, password)
        setInfo('Revisá tu email para confirmar la cuenta.')
      }
    } catch (err) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">EchoVerse</h1>
        <p className="auth-subtitle">Chatea con personajes icónicos</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); setInfo('') }}
          >
            Iniciar sesión
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); setInfo('') }}
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
            {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button className="auth-skip" onClick={() => navigate('/')}>
          Continuar sin cuenta
        </button>
      </div>
    </div>
  )
}
