import { Router } from 'express'
import { supabase } from '../../config/supabase.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

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

export default router
