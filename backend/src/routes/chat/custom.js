import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { initSseResponse, sendSseError, streamMistral } from '../../utils/mistral.js'
import { MAX_HISTORY } from '../../config/constants.js'

const router = Router()

// POST /chat/custom — chat con personaje personalizado del usuario
router.post('/chat/custom', requireAuth, async (req, res) => {
  const { systemPrompt, messages: rawMessages } = req.body

  if (!systemPrompt) return res.status(400).json({ error: 'systemPrompt requerido' })

  const messages = (rawMessages ?? []).slice(-MAX_HISTORY)

  initSseResponse(res)

  try {
    await streamMistral(res, systemPrompt, messages, 512)
  } catch (error) {
    console.error('Error Mistral /chat/custom:', error.message)
    sendSseError(res, 'Error al contactar la IA')
  }
})

export default router
