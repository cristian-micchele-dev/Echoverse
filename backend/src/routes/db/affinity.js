import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'
import { affinitySchema } from '../../schemas/db.js'

const router = Router()

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

export default router
