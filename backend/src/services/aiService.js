import { characters } from '../data/characters.js'
import { streamMistral, withSseStream, MistralRateLimitError } from '../utils/mistral.js'

/**
 * Busca un personaje por ID. Lanza un error estructurado si no existe.
 */
export function getCharacter(characterId) {
  const character = characters[characterId]
  if (!character) {
    const err = new Error('Personaje no encontrado')
    err.statusCode = 404
    err.code = 'CHARACTER_NOT_FOUND'
    throw err
  }
  return character
}

/**
 * Wrapper genérico para streaming de Mistral con manejo de errores SSE.
 */
export async function streamAIResponse(res, systemPrompt, messages, maxTokens, options = {}) {
  const { logPrefix = 'Error Mistral', errorMessage = 'Error al contactar la IA' } = options
  await withSseStream(res, () => streamMistral(res, systemPrompt, messages, maxTokens), {
    logPrefix,
    errorMessage,
  })
}

/**
 * Sanitiza el historial de mensajes para evitar inyección y limitar tamaño.
 */
export function sanitizeMessages(rawMessages, maxHistory = 50) {
  if (!Array.isArray(rawMessages)) return []
  return rawMessages
    .slice(-maxHistory)
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content.slice(0, 1000) : '',
    }))
}

/**
 * Helper para respuestas JSON de error consistentes.
 */
export function sendError(res, status, message, code = null) {
  const payload = { error: message }
  if (code) payload.code = code
  res.status(status).json(payload)
}

/**
 * Responde un error de IA en rutas JSON (no-streaming). Distingue rate limit
 * (429 con mensaje específico) del resto (500 con el fallback de la ruta).
 */
export function sendAIError(res, error, fallbackMessage) {
  if (error instanceof MistralRateLimitError) {
    return sendError(res, 429, error.message, error.code)
  }
  return sendError(res, 500, fallbackMessage)
}

/**
 * Middleware para capturar errores async de los routers de chat.
 * Uso: router.post('/ruta', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
