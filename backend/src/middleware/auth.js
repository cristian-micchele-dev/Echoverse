import { supabase } from '../config/supabase.js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  try {
    const result = await supabase.auth.getUser(token)
    const user = result?.data?.user
    const error = result?.error
    if (error || !user) {
      console.error('[requireAuth] getUser error:', error?.code, error?.message)
      return res.status(401).json({ error: 'Token inválido' })
    }
    req.user = user
    next()
  } catch (err) {
    console.error('[requireAuth] unexpected throw:', err.message)
    return res.status(500).json({ error: 'Error de autenticación' })
  }
}

export function requireAdmin(req, res, next) {
  if (!ADMIN_EMAIL || req.user?.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Sin permisos de administrador' })
  }
  next()
}

export { ADMIN_EMAIL }
