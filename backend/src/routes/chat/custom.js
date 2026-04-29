import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { streamMistral, withSseStream } from '../../utils/mistral.js'
import { MAX_HISTORY } from '../../config/constants.js'

const router = Router()

// POST /chat/custom — chat con personaje personalizado del usuario
router.post('/chat/custom', requireAuth, async (req, res) => {
  const { systemPrompt, messages: rawMessages } = req.body

  if (!systemPrompt || typeof systemPrompt !== 'string') return res.status(400).json({ error: 'systemPrompt requerido' })
  if (systemPrompt.length > 2000) return res.status(400).json({ error: 'systemPrompt demasiado largo (máx. 2000 caracteres)' })
  if (!Array.isArray(rawMessages)) return res.status(400).json({ error: 'messages debe ser un array' })

  const messages = rawMessages.slice(-MAX_HISTORY).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m.content === 'string' ? m.content.slice(0, 1000) : '',
  }))

  await withSseStream(res, () => streamMistral(res, systemPrompt, messages, 512), {
    logPrefix: 'Error Mistral /chat/custom',
    errorMessage: 'Error al contactar la IA',
  })
})

export default router
