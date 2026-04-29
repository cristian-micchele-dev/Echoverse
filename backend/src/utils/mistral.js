const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY
const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1'

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    'Content-Type': 'application/json',
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
  const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Mistral HTTP ${response.status}: ${text}`)
  }

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
  const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: maxTokens,
    }),
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Mistral HTTP ${response.status}: ${text}`)
  }

  const reader = response.body.getReader()
  for await (const chunk of readSSEChunks(reader)) {
    const content = chunk.choices?.[0]?.delta?.content || ''
    if (content) yield content
  }
}

export async function callMistral({ messages, maxTokens = 512, model = 'mistral-small-latest', temperature }) {
  const body = {
    model,
    messages,
    stream: false,
    max_tokens: maxTokens,
  }
  if (temperature !== undefined) body.temperature = temperature

  const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Mistral HTTP ${response.status}: ${text}`)
  }

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
    sendSseError(res, errorMessage)
  }
}
