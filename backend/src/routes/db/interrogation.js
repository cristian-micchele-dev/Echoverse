import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

// POST /api/db/interrogation-result  { characterId, scenario, isLying, correct, totalQuestions, pressureCount, rank }
router.post('/interrogation-result', requireAuth, async (req, res) => {
  const { characterId, scenario, isLying, correct, totalQuestions, pressureCount, rank } = req.body
  if (!characterId || !scenario || typeof correct !== 'boolean') {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { error } = await supabase
    .from('interrogation_results')
    .insert({
      user_id:         req.user.id,
      character_id:    characterId,
      scenario,
      is_lying:        !!isLying,
      correct:         !!correct,
      total_questions: totalQuestions ?? 0,
      pressure_count:  pressureCount ?? 0,
      rank:            rank ?? '',
    })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// GET /api/db/interrogation-results  → últimos 10 resultados del usuario
router.get('/interrogation-results', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('interrogation_results')
    .select('id, character_id, correct, rank, total_questions, played_at')
    .eq('user_id', req.user.id)
    .order('played_at', { ascending: false })
    .limit(10)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data ?? [])
})

export default router
