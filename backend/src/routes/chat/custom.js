import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { streamAIResponse, sanitizeMessages } from '../../services/aiService.js'
import { validateBody, asyncHandler } from '../../middleware/validate.js'
import { CustomChatBodySchema } from '../../schemas/chatSchemas.js'

const router = Router()

// POST /chat/custom — chat con personaje personalizado del usuario
router.post('/chat/custom', requireAuth, validateBody(CustomChatBodySchema), asyncHandler(async (req, res) => {
  const { systemPrompt, messages: rawMessages } = req.body

  const messages = sanitizeMessages(rawMessages)

  await streamAIResponse(res, systemPrompt, messages, 512, {
    logPrefix: 'Error Mistral /chat/custom',
    errorMessage: 'Error al contactar la IA',
  })
}))

export default router
