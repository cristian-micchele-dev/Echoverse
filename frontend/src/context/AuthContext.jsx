import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { API_URL } from '../config/api.js'

const AuthContext = createContext(null)

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

  async function parseAuthResponse(res) {
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      throw new Error('Error de servidor. Intentá de nuevo más tarde')
    }
    return res.json()
  }

  async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await parseAuthResponse(res)
    if (!res.ok) throw new Error(data.error)
    const { error } = await supabase.auth.setSession(data.session)
    if (error) throw error
  }

  async function register(email, password, username) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    })
    const data = await parseAuthResponse(res)
    if (!res.ok) throw new Error(data.error)
    if (data.session) {
      const { error } = await supabase.auth.setSession(data.session)
      if (error) throw error
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
