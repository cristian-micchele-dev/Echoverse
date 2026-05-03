import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

// GET /api/db/daily-challenge
router.get('/daily-challenge', requireAuth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('daily_challenge_completions')
    .select('challenge_date')
    .eq('user_id', req.user.id)
    .eq('challenge_date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message })
  }
  res.json({ completed: !!data })
})

// GET /api/db/streak  → { current: N, longest: M }
router.get('/streak', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('daily_challenge_completions')
    .select('challenge_date')
    .eq('user_id', req.user.id)
    .order('challenge_date', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const dates = (data ?? []).map(r => r.challenge_date)
  if (dates.length === 0) return res.json({ current: 0, longest: 0 })

  const todayStr = new Date().toISOString().slice(0, 10)

  function dayDiff(a, b) {
    return Math.round((new Date(a) - new Date(b)) / 86_400_000)
  }

  let current = 0
  const diffFromToday = dayDiff(todayStr, dates[0])
  if (diffFromToday <= 1) {
    current = 1
    for (let i = 1; i < dates.length; i++) {
      if (dayDiff(dates[i - 1], dates[i]) === 1) current++
      else break
    }
  }

  let longest = current
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    if (dayDiff(dates[i - 1], dates[i]) === 1) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }

  res.json({ current, longest })
})

// POST /api/db/daily-challenge  { characterId, mode }
router.post('/daily-challenge', requireAuth, async (req, res) => {
  const { characterId, mode } = req.body
  if (!characterId || !mode) return res.status(400).json({ error: 'characterId and mode required' })
  const today = new Date().toISOString().slice(0, 10)

  const { error } = await supabase
    .from('daily_challenge_completions')
    .upsert(
      { user_id: req.user.id, challenge_date: today, character_id: characterId, mode },
      { onConflict: 'user_id,challenge_date' }
    )

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
