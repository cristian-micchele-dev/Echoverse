const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY
const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1'

// mistral-large tiene 250k tokens/min en el tier gratuito vs 20k de small.
// Se lee en cada llamada para poder cambiarlo desde el entorno sin tocar código.
const DEFAULT_MODEL = 'mistral-large-2512'
function getModel() {
  return process.env.MISTRAL_MODEL || DEFAULT_MODEL
}

// Backoff para 429: el tier gratuito de Mistral permite 1 req/seg, así que un
// solo usuario en modos que encadenan llamadas (misión, interrogatorio) lo supera.
const RETRY_DELAYS_MS = [1000, 2000, 4000]
const MAX_RETRY_AFTER_MS = 10_000

export const RATE_LIMIT_MESSAGE = 'La IA está saturada en este momento. Esperá unos segundos e intentá de nuevo.'

export class MistralRateLimitError extends Error {
  constructor() {
    super(RATE_LIMIT_MESSAGE)
    this.name = 'MistralRateLimitError'
    this.statusCode = 429
    this.code = 'RATE_LIMITED'
  }
}

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Retry-After puede venir en segundos o como fecha HTTP. Devuelve null si no es usable.
function parseRetryAfterMs(response) {
  const raw = response.headers?.get?.('retry-after')
  if (!raw) return null
  const seconds = Number(raw)
  if (Number.isFinite(seconds)) return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS)
  const date = Date.parse(raw)
  if (Number.isNaN(date)) return null
  return Math.min(Math.max(date - Date.now(), 0), MAX_RETRY_AFTER_MS)
}

async function fetchChatCompletion(body, { signal } = {}) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
      signal,
    })

    if (response.status === 429) {
      if (attempt >= RETRY_DELAYS_MS.length) throw new MistralRateLimitError()
      const delay = parseRetryAfterMs(response) ?? RETRY_DELAYS_MS[attempt]
      console.warn(`[mistral] 429 rate limited, reintento ${attempt + 1}/${RETRY_DELAYS_MS.length} en ${delay}ms`)
      await sleep(delay)
      continue
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Mistral HTTP ${response.status}: ${text}`)
    }

    return response
  }
}

export function initSseResponse(res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
}

export function sendSseError(res, message) {
  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
}

async function* readSSEChunks(reader) {
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') continue
      try {
        yield JSON.parse(data)
      } catch {
        // ignorar líneas malformadas
      }
    }
  }
  // procesar resto del buffer
  if (buffer.trim().startsWith('data: ')) {
    const data = buffer.trim().slice(6)
    if (data !== '[DONE]') {
      try { yield JSON.parse(data) } catch { /* noop */ }
    }
  }
}

export async function streamMistral(res, systemPrompt, messages, maxTokens = 512) {
  const response = await fetchChatCompletion({
    model: getModel(),
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
    max_tokens: maxTokens,
  })

  const reader = response.body.getReader()
  for await (const chunk of readSSEChunks(reader)) {
    if (res.writableEnded) break
    const content = chunk.choices?.[0]?.delta?.content || ''
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`)
  }

  if (!res.writableEnded) {
    res.write('data: [DONE]\n\n')
    res.end()
  }
}

export async function* streamMistralGenerator(systemPrompt, messages, maxTokens = 512, signal) {
  const response = await fetchChatCompletion({
    model: getModel(),
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
    max_tokens: maxTokens,
  }, { signal })

  const reader = response.body.getReader()
  for await (const chunk of readSSEChunks(reader)) {
    const content = chunk.choices?.[0]?.delta?.content || ''
    if (content) yield content
  }
}

export async function callMistral({ messages, maxTokens = 512, model, temperature }) {
  const body = {
    model: model || getModel(),
    messages,
    stream: false,
    max_tokens: maxTokens,
  }
  if (temperature !== undefined) body.temperature = temperature

  const response = await fetchChatCompletion(body)
  const json = await response.json()
  return json.choices?.[0]?.message?.content?.trim() ?? ''
}

/**
 * Wrapper para endpoints SSE. Inicializa la respuesta, ejecuta el handler,
 * y envía un error SSE en caso de excepción.
 */
export async function withSseStream(res, handler, options = {}) {
  const { logPrefix = 'SSE', errorMessage = 'Error al contactar la IA' } = options
  initSseResponse(res)
  try {
    await handler()
  } catch (error) {
    console.error(`${logPrefix}:`, error.message)
    const message = error instanceof MistralRateLimitError ? RATE_LIMIT_MESSAGE : errorMessage
    sendSseError(res, message)
  }
}
