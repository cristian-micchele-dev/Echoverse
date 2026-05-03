import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

// GET /api/db/achievements
router.get('/achievements', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data ?? [])
})

// POST /api/db/achievements  { achievementId }
router.post('/achievements', requireAuth, async (req, res) => {
  const { achievementId } = req.body
  if (!achievementId) return res.status(400).json({ error: 'achievementId required' })

  const { error } = await supabase
    .from('achievements')
    .insert({ user_id: req.user.id, achievement_id: achievementId })

  // UNIQUE constraint violation = ya existía → isNew: false
  const isNew = !error || error.code !== '23505'
  if (error && error.code !== '23505') return res.status(500).json({ error: error.message })
  res.json({ isNew })
})

export default router
