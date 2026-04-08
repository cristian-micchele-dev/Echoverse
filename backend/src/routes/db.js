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

export default router
