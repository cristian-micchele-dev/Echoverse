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

export default router
