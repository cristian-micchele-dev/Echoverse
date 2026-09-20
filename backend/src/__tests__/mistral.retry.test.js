/**
 * Tests para backend/src/utils/mistral.js — retry con backoff en 429
 *
 * Cubre:
 *  - callMistral reintenta en 429 y devuelve el contenido del intento exitoso
 *  - Respeta el header Retry-After (segundos) sobre el backoff por defecto
 *  - Agota los reintentos y lanza MistralRateLimitError (statusCode 429)
 *  - NO reintenta en errores que no son 429 (ej. 500)
 *  - streamMistral también reintenta y luego streamea normalmente
 *  - withSseStream envía el mensaje específico de rate limit por SSE
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  callMistral,
  streamMistral,
  withSseStream,
  MistralRateLimitError,
  RATE_LIMIT_MESSAGE,
} from '../utils/mistral.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

function rateLimited(headers = {}) {
  return jsonResponse(429, {
    object: 'error',
    message: 'Rate limit exceeded',
    type: 'rate_limited',
    code: '1300',
  }, headers)
}

function chatCompletion(content) {
  return jsonResponse(200, { choices: [{ message: { content } }] })
}

function sseStream(tokens) {
  const encoder = new TextEncoder()
  const lines = tokens
    .map(t => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`)
    .concat('data: [DONE]\n\n')
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const line of lines) controller.enqueue(encoder.encode(line))
        controller.close()
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  )
}

function makeMockRes() {
  const written = []
  let ended = false
  return {
    get writableEnded() { return ended },
    setHeader() {},
    flushHeaders() {},
    write(chunk) { if (!ended) written.push(chunk); return !ended },
    end() { ended = true },
    _written: written,
  }
}

// Avanza los timers hasta que la promesa resuelva o rechace.
// Captura el resultado para que un rechazo no quede "unhandled" mientras
// avanzan los timers (Jest lo reportaría como fallo del test).
async function runWithTimers(promise) {
  let outcome = null
  promise.then(
    value => { outcome = { ok: true, value } },
    error => { outcome = { ok: false, error } },
  )
  while (outcome === null) {
    await jest.advanceTimersByTimeAsync(500)
  }
  if (!outcome.ok) throw outcome.error
  return outcome.value
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch
let fetchMock

beforeEach(() => {
  jest.useFakeTimers()
  fetchMock = jest.fn()
  globalThis.fetch = fetchMock
})

afterEach(() => {
  jest.useRealTimers()
  globalThis.fetch = originalFetch
})

// ---------------------------------------------------------------------------
// callMistral
// ---------------------------------------------------------------------------

describe('callMistral — retry en 429', () => {
  test('reintenta tras un 429 y devuelve el contenido del intento exitoso', async () => {
    fetchMock
      .mockResolvedValueOnce(rateLimited())
      .mockResolvedValueOnce(chatCompletion('  hola  '))

    const result = await runWithTimers(
      callMistral({ messages: [{ role: 'user', content: 'hi' }] })
    )

    expect(result).toBe('hola')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('respeta el header Retry-After antes de reintentar', async () => {
    fetchMock
      .mockResolvedValueOnce(rateLimited({ 'Retry-After': '3' }))
      .mockResolvedValueOnce(chatCompletion('ok'))

    const promise = callMistral({ messages: [] })

    // Dejar que el primer fetch resuelva y se programe el sleep
    await jest.advanceTimersByTimeAsync(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // A los 2.9s todavía no reintentó
    await jest.advanceTimersByTimeAsync(2900)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // A los 3s sí
    await jest.advanceTimersByTimeAsync(100)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await expect(promise).resolves.toBe('ok')
  })

  test('agota los reintentos y lanza MistralRateLimitError', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(rateLimited()))

    await expect(runWithTimers(callMistral({ messages: [] })))
      .rejects.toBeInstanceOf(MistralRateLimitError)
    // 1 intento inicial + 3 reintentos
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  test('MistralRateLimitError expone statusCode 429, code y mensaje en español', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(rateLimited()))

    let caught
    try {
      await runWithTimers(callMistral({ messages: [] }))
    } catch (err) {
      caught = err
    }

    expect(caught.statusCode).toBe(429)
    expect(caught.code).toBe('RATE_LIMITED')
    expect(caught.message).toBe(RATE_LIMIT_MESSAGE)
  })

  test('NO reintenta en errores que no son 429', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { message: 'boom' }))

    await expect(callMistral({ messages: [] })).rejects.toThrow('Mistral HTTP 500')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// streamMistral
// ---------------------------------------------------------------------------

describe('streamMistral — retry en 429', () => {
  test('reintenta tras un 429 y luego streamea los chunks y [DONE]', async () => {
    fetchMock
      .mockResolvedValueOnce(rateLimited())
      .mockResolvedValueOnce(sseStream(['Hola', ' mundo']))

    const res = makeMockRes()
    await runWithTimers(streamMistral(res, 'system', [{ role: 'user', content: 'hi' }]))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(res._written).toEqual([
      `data: ${JSON.stringify({ content: 'Hola' })}\n\n`,
      `data: ${JSON.stringify({ content: ' mundo' })}\n\n`,
      'data: [DONE]\n\n',
    ])
    expect(res.writableEnded).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// withSseStream
// ---------------------------------------------------------------------------

describe('withSseStream — mensaje específico de rate limit', () => {
  test('envía RATE_LIMIT_MESSAGE cuando el handler lanza MistralRateLimitError', async () => {
    const res = makeMockRes()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await withSseStream(res, async () => { throw new MistralRateLimitError() }, {
      errorMessage: 'Error al contactar la IA',
    })

    expect(res._written).toEqual([
      `data: ${JSON.stringify({ error: RATE_LIMIT_MESSAGE })}\n\n`,
    ])
    expect(res.writableEnded).toBe(true)
    consoleSpy.mockRestore()
  })

  test('mantiene errorMessage genérico para otros errores', async () => {
    const res = makeMockRes()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await withSseStream(res, async () => { throw new Error('Mistral HTTP 500: boom') }, {
      errorMessage: 'Error al contactar la IA',
    })

    expect(res._written).toEqual([
      `data: ${JSON.stringify({ error: 'Error al contactar la IA' })}\n\n`,
    ])
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// sendAIError (aiService) — respuestas JSON para rutas no-streaming
// ---------------------------------------------------------------------------

describe('sendAIError — rutas JSON', () => {
  test('responde 429 con RATE_LIMIT_MESSAGE ante MistralRateLimitError', async () => {
    const { sendAIError } = await import('../services/aiService.js')
    const res = makeJsonRes()

    sendAIError(res, new MistralRateLimitError(), 'Error al generar pistas')

    expect(res._status).toBe(429)
    expect(res._body).toEqual({ error: RATE_LIMIT_MESSAGE, code: 'RATE_LIMITED' })
  })

  test('responde 500 con el mensaje de fallback para otros errores', async () => {
    const { sendAIError } = await import('../services/aiService.js')
    const res = makeJsonRes()

    sendAIError(res, new Error('Mistral HTTP 500: boom'), 'Error al generar pistas')

    expect(res._status).toBe(500)
    expect(res._body).toEqual({ error: 'Error al generar pistas' })
  })
})

function makeJsonRes() {
  const res = { _status: null, _body: null }
  res.status = (code) => { res._status = code; return res }
  res.json = (body) => { res._body = body; return res }
  return res
}
