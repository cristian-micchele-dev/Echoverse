import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { loginSchema, registerSchema } from '../schemas/auth.js'

const router = Router()

function translateError(error) {
  const msg = (error?.message || '').toLowerCase()
  const code = error?.code || ''

  if (code === 'invalid_credentials' || msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return 'Email o contraseña incorrectos'
  }
  if (msg.includes('already registered') || msg.includes('user already exists') || msg.includes('already exists')) {
    return 'Este email ya está registrado'
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirmá tu email antes de iniciar sesión'
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Demasiados intentos. Esperá unos segundos e intentá de nuevo'
  }
  return 'Ocurrió un error. Intentá de nuevo más tarde'
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message })
  }

  const { email, password } = parsed.data

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return res.status(401).json({ error: translateError(error) })
    res.json({ session: data.session })
  } catch (err) {
    console.error('[auth/login]', err)
    res.status(500).json({ error: 'Error al iniciar sesión. Intentá de nuevo más tarde' })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message })
  }

  const { email, password, username } = parsed.data

  try {
    // admin.createUser es la API correcta para crear usuarios desde el servidor
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: username.trim() }
    })

    if (createError) return res.status(400).json({ error: translateError(createError) })

    // Hacer sign-in para obtener la sesión y devolverla al frontend
    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) return res.status(500).json({ error: 'Cuenta creada, pero no se pudo iniciar sesión automáticamente. Iniciá sesión manualmente.' })

    res.json({ session: signIn.session })
  } catch (err) {
    console.error('[auth/register]', err)
    res.status(500).json({ error: 'Error al crear la cuenta. Intentá de nuevo más tarde' })
  }
})

export default router
