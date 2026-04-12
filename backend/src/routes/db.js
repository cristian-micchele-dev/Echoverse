import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import {
  chatHistorySchema,
  affinitySchema,
  dilemaSeenSchema,
  missionProgressSchema,
  guessScoreSchema
} from '../schemas/db.js'

const router = Router()

// ─── Battle Votes (público, sin auth) ────────────────────────────────────────

// GET /api/db/battle-votes/:matchupKey
router.get('/battle-votes/:matchupKey', async (req, res) => {
  const { data, error } = await supabase
    .from('battle_votes')
    .select('votes')
    .eq('matchup_key', req.params.matchupKey)
    .single()

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message })
  }
  res.json(data?.votes ?? {})
})

// POST /api/db/battle-votes/:matchupKey  { characterId }
router.post('/battle-votes/:matchupKey', async (req, res) => {
  const { matchupKey } = req.params
  const { characterId } = req.body
  if (!characterId) return res.status(400).json({ error: 'characterId required' })

  const { data: existing } = await supabase
    .from('battle_votes')
    .select('votes')
    .eq('matchup_key', matchupKey)
    .single()

  const votes = existing?.votes ?? {}
  votes[characterId] = (votes[characterId] ?? 0) + 1

  const { error } = await supabase
    .from('battle_votes')
    .upsert({ matchup_key: matchupKey, votes })

  if (error) return res.status(500).json({ error: error.message })
  res.json(votes)
})

// ─── Dilema Votes (público, sin auth) ────────────────────────────────────────

// GET /api/db/dilema-votes/:dilemaId
router.get('/dilema-votes/:dilemaId', async (req, res) => {
  const { data, error } = await supabase
    .from('dilema_votes')
    .select('votes')
    .eq('dilema_id', req.params.dilemaId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message })
  }
  res.json(data?.votes ?? {})
})

// POST /api/db/dilema-votes  { dilemaId, choiceKey }
router.post('/dilema-votes', async (req, res) => {
  const { dilemaId, choiceKey } = req.body
  if (!dilemaId || !choiceKey) return res.status(400).json({ error: 'dilemaId and choiceKey required' })

  const { data: existing } = await supabase
    .from('dilema_votes')
    .select('votes')
    .eq('dilema_id', dilemaId)
    .single()

  const votes = existing?.votes ?? {}
  votes[choiceKey] = (votes[choiceKey] ?? 0) + 1

  const { error } = await supabase
    .from('dilema_votes')
    .upsert({ dilema_id: dilemaId, votes })

  if (error) return res.status(500).json({ error: error.message })
  res.json(votes)
})

// ─── Chat History (requiere auth) ────────────────────────────────────────────

// GET /api/db/chat-history/:characterId
router.get('/chat-history/:characterId', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('messages')
    .eq('user_id', req.user.id)
    .eq('character_id', req.params.characterId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message })
  }
  res.json(data?.messages ?? [])
})

// DELETE /api/db/chat-history/:characterId
router.delete('/chat-history/:characterId', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', req.user.id)
    .eq('character_id', req.params.characterId)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// POST /api/db/chat-history  { characterId, messages[] }
router.post('/chat-history', requireAuth, async (req, res) => {
  const parsed = chatHistorySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { characterId, messages } = parsed.data
  const { error } = await supabase
    .from('chat_history')
    .upsert(
      { user_id: req.user.id, character_id: characterId, messages, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,character_id' }
    )

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ─── Character Affinity (requiere auth) ──────────────────────────────────────

// GET /api/db/affinity  — todas las afinidades del usuario
router.get('/affinity', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('character_affinity')
    .select('character_id, message_count, last_chat_at')
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data ?? [])
})

// GET /api/db/affinity/:characterId
router.get('/affinity/:characterId', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('character_affinity')
    .select('message_count, last_chat_at')
    .eq('user_id', req.user.id)
    .eq('character_id', req.params.characterId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message })
  }
  res.json({ messageCount: data?.message_count ?? 0, lastChatAt: data?.last_chat_at ?? null })
})

// POST /api/db/affinity  { characterId, messageCount }
router.post('/affinity', requireAuth, async (req, res) => {
  const parsed = affinitySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { characterId, messageCount } = parsed.data
  const { error } = await supabase
    .from('character_affinity')
    .upsert(
      { user_id: req.user.id, character_id: characterId, message_count: messageCount, last_chat_at: new Date().toISOString() },
      { onConflict: 'user_id,character_id' }
    )

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ─── Dilema Seen (requiere auth) ──────────────────────────────────────────────

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

// ─── Mission Progress (requiere auth) ────────────────────────────────────────

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

// ─── Achievements (requiere auth) ────────────────────────────────────────────

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

// ─── Daily Challenge (requiere auth) ─────────────────────────────────────────

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

// ─── Leaderboard (público) ────────────────────────────────────────────────────

// GET /api/db/leaderboard/missions
router.get('/leaderboard/missions', async (_req, res) => {
  const { data, error } = await supabase
    .from('mission_progress')
    .select('user_id, highest_unlocked')
    .order('highest_unlocked', { ascending: false })
    .limit(10)

  if (error) return res.status(500).json({ error: error.message })
  if (!data || data.length === 0) return res.json([])

  const rows = await Promise.all(data
    .filter(r => r.highest_unlocked > 1)
    .map(async (row) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id)
      const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Jugador'
      return { userId: row.user_id, username, level: row.highest_unlocked - 1 }
    })
  )
  res.json(rows)
})

// GET /api/db/leaderboard/guess
router.get('/leaderboard/guess', async (_req, res) => {
  const { data, error } = await supabase
    .from('guess_scores')
    .select('user_id, best_score')
    .order('best_score', { ascending: false })
    .limit(10)

  if (error) return res.status(500).json({ error: error.message })
  if (!data || data.length === 0) return res.json([])

  const rows = await Promise.all(data.map(async (row) => {
    const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id)
    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Jugador'
    return { userId: row.user_id, username, score: row.best_score }
  }))
  res.json(rows)
})

// POST /api/db/guess-score  { score }
router.post('/guess-score', requireAuth, async (req, res) => {
  const parsed = guessScoreSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { score } = parsed.data
  const { data: existing } = await supabase
    .from('guess_scores')
    .select('best_score')
    .eq('user_id', req.user.id)
    .single()

  if (existing && existing.best_score >= score) {
    return res.json({ ok: true, updated: false })
  }

  const { error } = await supabase
    .from('guess_scores')
    .upsert(
      { user_id: req.user.id, best_score: score, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true, updated: true })
})

export default router
