import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'
import { dilemaSeenSchema } from '../../schemas/db.js'

const router = Router()

// GET /api/db/dilema-seen
router.get('/dilema-seen', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('dilema_seen')
    .select('dilema_ids')
    .eq('user_id', req.user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message })
  }
  res.json(data?.dilema_ids ?? [])
})

// POST /api/db/dilema-seen  { dilemaIds[] }  — acumula, no reemplaza
router.post('/dilema-seen', requireAuth, async (req, res) => {
  const parsed = dilemaSeenSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data: existing } = await supabase
    .from('dilema_seen')
    .select('dilema_ids')
    .eq('user_id', req.user.id)
    .single()

  const merged = [...new Set([...(existing?.dilema_ids ?? []), ...parsed.data.dilemaIds])]

  const { error } = await supabase
    .from('dilema_seen')
    .upsert(
      { user_id: req.user.id, dilema_ids: merged },
      { onConflict: 'user_id' }
    )

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
