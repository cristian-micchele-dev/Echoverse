import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// Todos los endpoints requieren auth + admin
router.use(requireAuth, requireAdmin)

// ─── GET /api/admin/users ──────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (error) return res.status(500).json({ error: error.message })

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    username: u.user_metadata?.username || null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at
  }))

  res.json(users)
})

// ─── DELETE /api/admin/users/:userId ──────────────────────────────────────────

router.delete('/users/:userId', async (req, res) => {
  const { error } = await supabase.auth.admin.deleteUser(req.params.userId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ─── GET /api/admin/custom-characters ────────────────────────────────────────

router.get('/custom-characters', async (req, res) => {
  const { data, error } = await supabase
    .from('custom_characters')
    .select('id, name, emoji, color, avatar_url, created_at, user_id')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data ?? [])
})

// ─── DELETE /api/admin/custom-characters/:id ──────────────────────────────────

router.delete('/custom-characters/:id', async (req, res) => {
  const { error } = await supabase
    .from('custom_characters')
    .delete()
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
