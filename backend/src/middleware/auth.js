import { supabase } from '../config/supabase.js'

const ADMIN_EMAIL = 'cristian.aiki1@gmail.com'

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Token inválido' })

  req.user = user
  next()
}

export function requireAdmin(req, res, next) {
  if (req.user?.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Sin permisos de administrador' })
  }
  next()
}

export { ADMIN_EMAIL }
