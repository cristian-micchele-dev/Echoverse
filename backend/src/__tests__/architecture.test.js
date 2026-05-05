/**
 * Tests de integración para las mejoras de arquitectura:
 * - Service layer (aiService)
 * - Validación Zod en endpoints
 * - Refactor de routers base, story, mission, custom
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import express from 'express'
import { createServer } from 'node:http'
import http from 'node:http'

process.env.MISTRAL_API_KEY = 'test-key-mock'
process.env.SUPABASE_URL = 'https://mock.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key'

function httpRequest(server, options, body) {
  return new Promise((resolve, reject) => {
    const addr = server.address()
    const reqOptions = {
      hostname: '127.0.0.1',
      port: addr.port,
      ...options
    }
    const clientReq = http.request(reqOptions, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString()
      }))
    })
    clientReq.on('error', reject)
    if (body) {
      const bodyStr = JSON.stringify(body)
      clientReq.setHeader('Content-Type', 'application/json')
      clientReq.setHeader('Content-Length', Buffer.byteLength(bodyStr))
      clientReq.write(bodyStr)
    }
    clientReq.end()
  })
}

// ---------------------------------------------------------------------------
// Suite 1: Service layer — getCharacter
// ---------------------------------------------------------------------------

describe('aiService — getCharacter', () => {
  test('devuelve el personaje si existe', async () => {
    const { getCharacter } = await import('../services/aiService.js')
    const char = getCharacter('john-wick')
    expect(char).toBeDefined()
    expect(char.id).toBe('john-wick')
    expect(char.name).toBe('John Wick')
  })

  test('lanza error con statusCode 404 si no existe', async () => {
    const { getCharacter } = await import('../services/aiService.js')
    expect(() => getCharacter('no-existe')).toThrow(/Personaje no encontrado/)
    try {
      getCharacter('no-existe')
    } catch (err) {
      expect(err.statusCode).toBe(404)
      expect(err.code).toBe('CHARACTER_NOT_FOUND')
    }
  })
})

// ---------------------------------------------------------------------------
// Suite 2: Service layer — sanitizeMessages
// ---------------------------------------------------------------------------

describe('aiService — sanitizeMessages', () => {
  test('limita a maxHistory mensajes', async () => {
    const { sanitizeMessages } = await import('../services/aiService.js')
    const messages = Array.from({ length: 60 }, (_, i) => ({
      role: 'user',
      content: `msg ${i}`
    }))
    const result = sanitizeMessages(messages, 50)
    expect(result.length).toBe(50)
    expect(result[0].content).toBe('msg 10')
  })

  test('trunca contenido a 1000 caracteres', async () => {
    const { sanitizeMessages } = await import('../services/aiService.js')
    const messages = [{ role: 'user', content: 'x'.repeat(2000) }]
    const result = sanitizeMessages(messages)
    expect(result[0].content.length).toBe(1000)
  })

  test('normaliza roles a user/assistant', async () => {
    const { sanitizeMessages } = await import('../services/aiService.js')
    const messages = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'system', content: 'sys' },
    ]
    const result = sanitizeMessages(messages)
    expect(result[0].role).toBe('user')
    expect(result[1].role).toBe('assistant')
    expect(result[2].role).toBe('user') // system -> user
  })
})

// ---------------------------------------------------------------------------
// Suite 3: Validación Zod — POST /api/chat
// ---------------------------------------------------------------------------

describe('POST /api/chat — validación Zod', () => {
  let server

  beforeAll(async () => {
    const app = express()
    app.use(express.json())
    const { default: chatRouter } = await import('../routes/chat.js')
    app.use('/api', chatRouter)
    server = createServer(app)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  })

  afterAll(async () => {
    await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve())
    )
  })

  test('devuelve 400 si characterId está vacío', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: '', messages: [] }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.issues.some(i => i.path === 'characterId')).toBe(true)
  })

  test('devuelve 400 si messages no es array', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: 'john-wick', messages: 'not-an-array' }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  test('devuelve 400 si affinityLevel > 8', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: 'john-wick', messages: [], affinityLevel: 99 }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.issues.some(i => i.path === 'affinityLevel')).toBe(true)
  })

  test('devuelve 404 si characterId no existe (después de validación Zod)', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: 'no-existe-123', messages: [] }
    )
    expect(result.statusCode).toBe(404)
    const body = JSON.parse(result.body)
    expect(body.error).toMatch(/Personaje no encontrado/)
  })

  test('happy path: characterId válido + messages válidos inicia SSE', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: 'john-wick', messages: [{ role: 'user', content: 'Hola' }] }
    )
    // Puede ser 200 (si Mistral responde) o un error de conexión (si no hay API key real)
    // Lo importante es que NO sea 400 ni 404 de validación
    expect(result.statusCode).not.toBe(400)
    expect(result.statusCode).not.toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Suite 4: Validación Zod — POST /api/story
// ---------------------------------------------------------------------------

describe('POST /api/story — validación Zod', () => {
  let server

  beforeAll(async () => {
    const app = express()
    app.use(express.json())
    const { default: chatRouter } = await import('../routes/chat.js')
    app.use('/api', chatRouter)
    server = createServer(app)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  })

  afterAll(async () => {
    await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve())
    )
  })

  test('devuelve 400 si falta scenarioPrompt', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/story', method: 'POST' },
      { characterId: 'john-wick' }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.issues.some(i => i.path === 'scenarioPrompt')).toBe(true)
  })

  test('devuelve 400 si scenarioPrompt > 500 caracteres', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/story', method: 'POST' },
      { characterId: 'john-wick', scenarioPrompt: 'x'.repeat(501) }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.issues.some(i => i.path === 'scenarioPrompt')).toBe(true)
  })

  test('devuelve 400 si history no es array', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/story', method: 'POST' },
      { characterId: 'john-wick', scenarioPrompt: 'test', history: 'bad' }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  test('happy path: payload válido', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/story', method: 'POST' },
      { characterId: 'john-wick', scenarioPrompt: 'Una historia épica', history: [] }
    )
    expect(result.statusCode).not.toBe(400)
    expect(result.statusCode).not.toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Suite 5: Validación Zod — POST /api/mission
// ---------------------------------------------------------------------------

describe('POST /api/mission — validación Zod', () => {
  let server

  beforeAll(async () => {
    const app = express()
    app.use(express.json())
    const { default: chatRouter } = await import('../routes/chat.js')
    app.use('/api', chatRouter)
    server = createServer(app)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  })

  afterAll(async () => {
    await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve())
    )
  })

  test('devuelve 400 si difficulty no es válido', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/mission', method: 'POST' },
      { characterId: 'john-wick', difficulty: 'impossible' }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.issues.some(i => i.path === 'difficulty')).toBe(true)
  })

  test('devuelve 400 si missionType no es válido', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/mission', method: 'POST' },
      { characterId: 'john-wick', missionType: 'exploration' }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.issues.some(i => i.path === 'missionType')).toBe(true)
  })

  test('devuelve 400 si stats tiene valores no numéricos', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/mission', method: 'POST' },
      { characterId: 'john-wick', stats: { vida: 'full' } }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  test('happy path: payload válido con defaults', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/mission', method: 'POST' },
      { characterId: 'john-wick' }
    )
    expect(result.statusCode).not.toBe(400)
    expect(result.statusCode).not.toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Suite 6: Validación Zod — POST /api/chat/custom
// ---------------------------------------------------------------------------

describe('POST /api/chat/custom — validación Zod', () => {
  let server

  beforeAll(async () => {
    const app = express()
    app.use(express.json())
    const { default: chatRouter } = await import('../routes/chat.js')
    app.use('/api', chatRouter)
    server = createServer(app)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  })

  afterAll(async () => {
    await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve())
    )
  })

  test('devuelve 401 si no hay token de auth (requireAuth bloquea antes de Zod)', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat/custom', method: 'POST' },
      { systemPrompt: 'Eres un asistente.', messages: [] }
    )
    expect(result.statusCode).toBe(401)
  })

  test('devuelve 401 aunque el payload sea inválido (auth primero)', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat/custom', method: 'POST' },
      { systemPrompt: '', messages: [] }
    )
    expect(result.statusCode).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// Suite 7: Validación Zod — POST /api/mission/image-prompt
// ---------------------------------------------------------------------------

describe('POST /api/mission/image-prompt — validación Zod', () => {
  let server

  beforeAll(async () => {
    const app = express()
    app.use(express.json())
    const { default: chatRouter } = await import('../routes/chat.js')
    app.use('/api', chatRouter)
    server = createServer(app)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  })

  afterAll(async () => {
    await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve())
    )
  })

  test('devuelve 400 si characterId está vacío', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/mission/image-prompt', method: 'POST' },
      { characterId: '' }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  test('devuelve 400 si difficulty no es válido', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/mission/image-prompt', method: 'POST' },
      { characterId: 'john-wick', difficulty: 'extreme' }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.issues.some(i => i.path === 'difficulty')).toBe(true)
  })
})
