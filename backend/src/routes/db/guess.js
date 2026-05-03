import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

const MAX_GUESS_SCORE = 800 // 8 rondas × 100 pts máx

// GET /api/db/guess-ranking — public top 20
router.get('/guess-ranking', async (req, res) => {
  const { data, error } = await supabase
    .from('guess_scores')
    .select('username, best_score, games_played')
    .order('best_score', { ascending: false })
    .limit(20)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/db/guess-score — upsert best score for current user
router.post('/guess-score', requireAuth, async (req, res) => {
  const { score } = req.body
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > MAX_GUESS_SCORE) {
    return res.status(400).json({ error: 'score inválido' })
  }

  const username = req.user.user_metadata?.username || req.user.email?.split('@')[0] || 'Usuario'

  const { data: existing } = await supabase
    .from('guess_scores')
    .select('best_score, games_played')
    .eq('user_id', req.user.id)
    .single()

  const newBest = existing ? Math.max(existing.best_score, score) : score
  const gamesPlayed = existing ? existing.games_played + 1 : 1

  const { error } = await supabase
    .from('guess_scores')
    .upsert(
      { user_id: req.user.id, username, best_score: newBest, games_played: gamesPlayed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true, best_score: newBest })
})

export default router
