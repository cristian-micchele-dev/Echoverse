import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ROUTES } from '../utils/constants'
import './AuthPage.css'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase dispara PASSWORD_RECOVERY cuando el usuario llega desde el email
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      return setError('Las contraseñas no coinciden')
    }
    if (password.length < 8) {
      return setError('La contraseña debe tener al menos 8 caracteres')
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return setError('La contraseña debe tener al menos una letra y un número')
    }
    if (/\s/.test(password)) {
      return setError('La contraseña no puede contener espacios')
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      await supabase.auth.signOut()
      navigate(ROUTES.AUTH, { replace: true, state: { info: 'Contraseña actualizada. Iniciá sesión.' } })
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1 className="auth-title">EchoVerse</h1>
          <p className="auth-subtitle">Restablecer contraseña</p>
        </div>

        {!ready ? (
          <p className="auth-forgot-hint">Verificando enlace…</p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label">Nueva contraseña</label>
              <input
                className="auth-input"
                type="password"
                placeholder="Mínimo 8 caracteres, letras y números"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirmar contraseña</label>
              <input
                className="auth-input"
                type="password"
                placeholder="Repetí la contraseña"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
