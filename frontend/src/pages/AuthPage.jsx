import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [mode, setMode] = useState('auth') // 'auth' | 'forgot' | 'forgot-sent'
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, forgotPassword } = useAuth()
  const navigate = useNavigate()

  function switchTab(newTab) {
    setTab(newTab)
    setError('')
    setUsername('')
  }

  function enterForgot() {
    setMode('forgot')
    setError('')
  }

  function backToLogin() {
    setMode('auth')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') await login(email, password)
      else await register(email, password, username)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setMode('forgot-sent')
    } catch (err) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const SUBMIT_LABEL = { login: 'Entrar', register: 'Crear cuenta' }
  const submitLabel = loading ? 'Cargando…' : SUBMIT_LABEL[tab]

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-brand">
          <h1 className="auth-title">EchoVerse</h1>
          <p className="auth-subtitle">Chatea con personajes icónicos</p>
        </div>

        {/* ── Forgot sent ── */}
        {mode === 'forgot-sent' ? (
          <div className="auth-sent">
            <div className="auth-sent__icon">✉️</div>
            <p className="auth-sent__title">Revisá tu email</p>
            <p className="auth-sent__sub">
              Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.
            </p>
            <button className="auth-btn" onClick={backToLogin}>Volver al inicio de sesión</button>
          </div>
        ) : mode === 'forgot' ? (
          /* ── Forgot form ── */
          <>
            <p className="auth-forgot-hint">Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.</p>
            <form className="auth-form" onSubmit={handleForgot} noValidate>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar instrucciones'}
              </button>
            </form>
            <button className="auth-skip" onClick={backToLogin}>← Volver</button>
          </>
        ) : (
          /* ── Auth form ── */
          <>
            <div className="auth-tabs">
              <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
                Iniciar sesión
              </button>
              <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
                Registrarse
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              {tab === 'register' && (
                <div className="auth-field">
                  <label className="auth-label">Nombre de usuario</label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="¿Cómo te llamamos?"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    minLength={2}
                    maxLength={30}
                    autoComplete="username"
                  />
                </div>
              )}

              <div className="auth-field">
                <div className="auth-field__row">
                  <label className="auth-label">Contraseña</label>
                  {tab === 'login' && (
                    <button type="button" className="auth-forgot-link" onClick={enterForgot}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Mínimo 8 caracteres, letras y números"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-btn" type="submit" disabled={loading}>
                {submitLabel}
              </button>
            </form>

            <div className="auth-divider"><span>o</span></div>
            <button className="auth-skip" onClick={() => navigate('/')}>
              Continuar sin cuenta
            </button>
          </>
        )}

      </div>
    </div>
  )
}
