import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { API_URL } from '../config/api.js'

const AuthContext = createContext(null)

const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function authFetch(endpoint, body) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  })
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    throw new Error('Error de servidor. Intentá de nuevo más tarde')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const data = await authFetch('/auth/login', { email, password })
    const { error } = await supabase.auth.setSession(data.session)
    if (error) throw error
  }

  async function register(email, password, username) {
    const data = await authFetch('/auth/register', { email, password, username })
    if (data.session) {
      const { error } = await supabase.auth.setSession(data.session)
      if (error) throw error
    }
  }

  async function forgotPassword(email) {
    await authFetch('/auth/forgot-password', { email })
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
