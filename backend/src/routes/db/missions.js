import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'
import { missionProgressSchema } from '../../schemas/db.js'

const router = Router()

// GET /api/db/mission-progress
router.get('/mission-progress', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('mission_progress')
    .select('highest_unlocked, completed_levels')
    .eq('user_id', req.user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message })
  }
  res.json({
    highestUnlocked: data?.highest_unlocked ?? 1,
    completedLevels: data?.completed_levels ?? {}
  })
})

// POST /api/db/mission-progress  { highestUnlocked, completedLevels }
router.post('/mission-progress', requireAuth, async (req, res) => {
  const parsed = missionProgressSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { highestUnlocked, completedLevels } = parsed.data
  const { error } = await supabase
    .from('mission_progress')
    .upsert(
      { user_id: req.user.id, highest_unlocked: highestUnlocked, completed_levels: completedLevels },
      { onConflict: 'user_id' }
    )

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
