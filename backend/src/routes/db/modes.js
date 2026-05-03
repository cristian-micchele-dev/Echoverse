import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

// GET /api/db/mode-completions  → { swipe: 3, story: 1, ... }
router.get('/mode-completions', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('mode_completions')
    .select('mode, count')
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  const result = {}
  for (const row of data ?? []) result[row.mode] = row.count
  res.json(result)
})

// POST /api/db/mode-completions  { mode }  → incrementa count en 1
router.post('/mode-completions', requireAuth, async (req, res) => {
  const { mode } = req.body
  if (!mode || typeof mode !== 'string') return res.status(400).json({ error: 'mode required' })

  // INSERT first. If the row doesn't exist yet, this is atomic and correct.
  const { error: insertErr } = await supabase
    .from('mode_completions')
    .insert({ user_id: req.user.id, mode, count: 1, last_completed_at: new Date().toISOString() })

  if (!insertErr) return res.json({ ok: true })
  if (insertErr.code !== '23505') return res.status(500).json({ error: insertErr.message })

  // Row already exists — read then increment. This has a theoretical race
  // window, but it's per-user and practically never concurrent.
  // A fully atomic fix requires a DB-side function (CREATE FUNCTION increment_mode_completion).
  const { data: existing } = await supabase
    .from('mode_completions')
    .select('count')
    .eq('user_id', req.user.id)
    .eq('mode', mode)
    .single()

  const { error: updateErr } = await supabase
    .from('mode_completions')
    .update({ count: (existing?.count ?? 0) + 1, last_completed_at: new Date().toISOString() })
    .eq('user_id', req.user.id)
    .eq('mode', mode)

  if (updateErr) return res.status(500).json({ error: updateErr.message })
  res.json({ ok: true })
})

export default router
