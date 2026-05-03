import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'
import { chatHistorySchema } from '../../schemas/db.js'

const router = Router()

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

export default router
