import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { loginSchema, registerSchema, resetPasswordSchema } from '../schemas/auth.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function translateError(error) {
  const msg = (error?.message || error?.error_description || error?.msg || '').toLowerCase()
  const code = error?.code || error?.error || ''

  const isInvalidCredentials = code === 'invalid_credentials'
    || msg.includes('invalid login')
    || msg.includes('invalid credentials')

  const isAlreadyRegistered = msg.includes('already registered')
    || msg.includes('user already exists')
    || msg.includes('already exists')

  if (isInvalidCredentials)  return 'Email o contraseña incorrectos'
  if (isAlreadyRegistered)   return 'Este email ya está registrado'
  if (msg.includes('email not confirmed')) return 'Confirmá tu email antes de iniciar sesión'
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Demasiados intentos. Esperá unos segundos e intentá de nuevo'
  }
  return 'Ocurrió un error. Intentá de nuevo más tarde'
}

// Usa la anon key para sign-in (endpoint público). La service key queda
// reservada para operaciones admin como createUser.
async function supabaseSignIn(email, password) {
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!anonKey) {
    console.error('[supabaseSignIn] SUPABASE_ANON_KEY no configurada')
    return { session: null, error: { message: 'server misconfiguration' } }
  }
  const url = `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  if (!response.ok) return { session: null, error: data }
  return { session: data, error: null }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message })
  }

  const { email, password } = parsed.data

  try {
    const { session, error } = await supabaseSignIn(email, password)
    if (error) return res.status(401).json({ error: translateError(error) })
    res.json({ session })
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
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { username: username.trim() }
    })

    if (createError) return res.status(400).json({ error: translateError(createError) })

    // Send verification email via Supabase REST API (anon key)
    const anonKey = process.env.SUPABASE_ANON_KEY
    await fetch(`${process.env.SUPABASE_URL}/auth/v1/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({ type: 'signup', email })
    }).catch(err => console.error('[auth/register] resend email failed:', err))

    res.json({ pending: true })
  } catch (err) {
    console.error('[auth/register]', err)
    res.status(500).json({ error: 'Error al crear la cuenta. Intentá de nuevo más tarde' })
  }
})

// DELETE /api/auth/account
router.delete('/account', requireAuth, async (req, res) => {
  const userId = req.user.id
  try {
    const tables = [
      'chat_history', 'character_affinity', 'mission_progress',
      'dilema_seen', 'daily_challenge_completions', 'mode_completions',
      'interrogation_results', 'achievements',
    ]
    await Promise.all(
      tables.map(t => supabase.from(t).delete().eq('user_id', userId).then(() => {}))
    )
    await supabase.from('custom_characters').delete().eq('created_by', userId).then(() => {})

    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      console.error('[auth/delete-account]', error)
      return res.status(500).json({ error: 'No se pudo eliminar la cuenta. Intentá de nuevo.' })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('[auth/delete-account]', err)
    res.status(500).json({ error: 'Error al eliminar la cuenta.' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const parsed = loginSchema.pick({ email: true }).safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message })
  }

  const { email } = parsed.data
  const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`

  try {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    // Siempre OK para no revelar si el email existe o no
    res.json({ ok: true })
  } catch (err) {
    console.error('[auth/forgot-password]', err)
    res.status(500).json({ error: 'No se pudo enviar el email. Intentá de nuevo.' })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', requireAuth, async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message })
  }

  const { password } = parsed.data

  try {
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password })
    if (error) return res.status(400).json({ error: 'No se pudo actualizar la contraseña. Intentá de nuevo.' })
    res.json({ ok: true })
  } catch (err) {
    console.error('[auth/reset-password]', err)
    res.status(500).json({ error: 'Error al actualizar la contraseña.' })
  }
})

export default router
