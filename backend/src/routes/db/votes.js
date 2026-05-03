import { Router } from 'express'
import { supabase } from '../../config/supabase.js'

const router = Router()

// Vote dedup (in-memory, ventana de 24h)
// Best-effort — no persiste entre reinicios del servidor.
const voteDedup = new Map() // "type:ip:entityId" → timestamp

setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  for (const [key, ts] of voteDedup) {
    if (ts < cutoff) voteDedup.delete(key)
  }
}, 60 * 60 * 1000).unref()

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

export default router
