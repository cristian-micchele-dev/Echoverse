import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import {
  chatHistorySchema,
  affinitySchema,
  dilemaSeenSchema,
  missionProgressSchema
} from '../schemas/db.js'

const router = Router()

// ─── Vote dedup (in-memory, ventana de 24h) ───────────────────────────────────
// Evita que la misma IP vote más de una vez por dilema/matchup en 24 horas.
// No persiste entre reinicios del servidor — es "best effort", no seguridad dura.
const voteDedup = new Map() // "type:ip:entityId" → timestamp

setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  for (const [key, ts] of voteDedup) {
    if (ts < cutoff) voteDedup.delete(key)
  }
}, 60 * 60 * 1000)

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

  const ip = req.ip || 'unknown'
  const voteKey = `battle:${ip}:${matchupKey}`
  if (voteDedup.has(voteKey)) {
    const { data: existing } = await supabase.from('battle_votes').select('votes').eq('matchup_key', matchupKey).single()
    return res.json(existing?.votes ?? {})
  }
  voteDedup.set(voteKey, Date.now())

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

  const ip = req.ip || 'unknown'
  const voteKey = `dilema:${ip}:${dilemaId}`
  if (voteDedup.has(voteKey)) {
    const { data: existing } = await supabase.from('dilema_votes').select('votes').eq('dilema_id', dilemaId).single()
    return res.json(existing?.votes ?? {})
  }
  voteDedup.set(voteKey, Date.now())

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
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', req.user.id)
      .eq('character_id', req.params.characterId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[GET chat-history] supabase error:', error.code, error.message)
      return res.status(500).json({ error: error.message })
    }
    res.json(data?.messages ?? [])
  } catch (err) {
    console.error('[GET chat-history] unexpected throw:', err.message)
    res.status(500).json({ error: 'Error inesperado' })
  }
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

  const { error: upsertErr } = await supabase
    .from('chat_history')
    .upsert(
      { user_id: req.user.id, character_id: characterId, messages, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,character_id' }
    )

  if (upsertErr) {
    console.error('[POST chat-history] upsert error:', upsertErr.code, upsertErr.message)
    return res.status(500).json({ error: upsertErr.message })
  }

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

// GET /api/db/streak  → { current: N, longest: M }
router.get('/streak', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('daily_challenge_completions')
    .select('challenge_date')
    .eq('user_id', req.user.id)
    .order('challenge_date', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const dates = (data ?? []).map(r => r.challenge_date) // ['2026-04-15', '2026-04-14', ...]

  if (dates.length === 0) return res.json({ current: 0, longest: 0 })

  const todayStr = new Date().toISOString().slice(0, 10)

  // Calcular racha actual: días consecutivos desde hoy (o ayer si hoy no está)
  function dayDiff(a, b) {
    return Math.round((new Date(a) - new Date(b)) / 86_400_000)
  }

  let current = 0
  const diffFromToday = dayDiff(todayStr, dates[0])
  if (diffFromToday <= 1) {
    current = 1
    for (let i = 1; i < dates.length; i++) {
      if (dayDiff(dates[i - 1], dates[i]) === 1) {
        current++
      } else {
        break
      }
    }
  }

  // Calcular racha más larga histórica
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

// ─── Interrogation Results (requiere auth) ───────────────────────────────────

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

// ─── Mode Completions (requiere auth) ────────────────────────────────────────

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
  if (!mode) return res.status(400).json({ error: 'mode required' })

  const { data: existing } = await supabase
    .from('mode_completions')
    .select('count')
    .eq('user_id', req.user.id)
    .eq('mode', mode)
    .single()

  const newCount = (existing?.count ?? 0) + 1

  const { error } = await supabase
    .from('mode_completions')
    .upsert(
      { user_id: req.user.id, mode, count: newCount, last_completed_at: new Date().toISOString() },
      { onConflict: 'user_id,mode' }
    )

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true, count: newCount })
})


// ─── Custom Characters (requiere auth) ───────────────────────────────────────

// GET /api/db/custom-characters
router.get('/custom-characters', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('custom_characters')
    .select('id, name, emoji, color, avatar_url, welcome_message, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data ?? [])
})

// POST /api/db/custom-characters  { name, description, personality, rules, welcome_message, emoji, color, avatar_url, system_prompt }
router.post('/custom-characters', requireAuth, async (req, res) => {
  const { name, description, personality, rules, welcome_message, emoji, color, avatar_url, system_prompt } = req.body
  if (!name || !description || !personality || !system_prompt) {
    return res.status(400).json({ error: 'name, description, personality y system_prompt son requeridos' })
  }
  if (typeof name !== 'string' || name.length > 50) return res.status(400).json({ error: 'name inválido (máx. 50)' })
  if (typeof description !== 'string' || description.length > 300) return res.status(400).json({ error: 'description inválida (máx. 300)' })
  if (typeof personality !== 'string' || personality.length > 500) return res.status(400).json({ error: 'personality inválida (máx. 500)' })
  if (typeof system_prompt !== 'string' || system_prompt.length > 2000) return res.status(400).json({ error: 'system_prompt inválido (máx. 2000)' })
  if (rules && (typeof rules !== 'string' || rules.length > 500)) return res.status(400).json({ error: 'rules inválidas (máx. 500)' })
  if (avatar_url && (typeof avatar_url !== 'string' || !/^https?:\/\//i.test(avatar_url))) {
    return res.status(400).json({ error: 'avatar_url debe ser una URL válida (http/https)' })
  }

  const { data, error } = await supabase
    .from('custom_characters')
    .insert({
      user_id: req.user.id,
      name: name.trim(),
      description: description.trim(),
      personality: personality.trim(),
      rules: rules?.trim() || null,
      welcome_message: welcome_message?.trim() || null,
      emoji: emoji || '🤖',
      color: color || '#7252E8',
      avatar_url: avatar_url || null,
      system_prompt: system_prompt.trim(),
    })
    .select('id')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ id: data.id })
})

// DELETE /api/db/custom-characters/:id
router.delete('/custom-characters/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('custom_characters')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

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
  if (typeof score !== 'number') return res.status(400).json({ error: 'score requerido' })

  const username = req.user.user_metadata?.username || req.user.email?.split('@')[0] || 'Usuario'

  // fetch current best to decide if we upsert
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
