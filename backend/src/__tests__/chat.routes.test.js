/**
 * Tests para backend/src/routes/chat.js
 *
 * Cubre:
 *  - streamGroq: guard writableEnded en el loop y antes del res.end()
 *  - Bloque catch de /api/chat: no escribe si writableEnded es true
 *  - Happy path de POST /api/chat: headers SSE correctos y chunks
 *  - GET /api/characters: devuelve lista sin exponer systemPrompt
 *  - POST /api/ultima-cena/scene: validaciones de input (regresiones)
 *
 * Migrado de node:test → Jest
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import express from 'express'
import { createServer } from 'node:http'

// ---------------------------------------------------------------------------
// Helpers de mock
// ---------------------------------------------------------------------------

function makeMockRes(options = {}) {
  const written = []
  const headers = {}
  let ended = options.alreadyEnded ?? false

  return {
    get writableEnded() { return ended },
    setHeader(k, v) { headers[k] = v },
    flushHeaders() {},
    write(chunk) {
      if (ended) return false
      written.push(chunk)
      return true
    },
    end() {
      ended = true
    },
    _written: written,
    _headers: headers,
    _end() { ended = true }
  }
}

function makeStreamChunks(texts) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0
      return {
        async next() {
          if (i >= texts.length) return { done: true }
          const value = {
            choices: [{ delta: { content: texts[i++] } }]
          }
          return { done: false, value }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Replica exacta de streamGroq (para testear lógica de guard sin tocar prod)
// ---------------------------------------------------------------------------

async function streamGroq(mistralClient, res, systemPrompt, messages, maxTokens = 512) {
  const stream = await mistralClient.chat.completions.create({
    model: 'mistral-small-latest',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
    max_tokens: maxTokens
  })
  for await (const chunk of stream) {
    if (res.writableEnded) break
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`)
  }
  if (!res.writableEnded) {
    res.write('data: [DONE]\n\n')
    res.end()
  }
}

// ---------------------------------------------------------------------------
// Helper HTTP
// ---------------------------------------------------------------------------

process.env.MISTRAL_API_KEY = 'test-key-mock'
process.env.SUPABASE_URL = 'https://mock.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key'

import http from 'node:http'

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
// Suite 1: streamGroq — guards de writableEnded
// ---------------------------------------------------------------------------

describe('streamGroq — guard writableEnded', () => {
  test('happy path: escribe todos los chunks y termina con [DONE]', async () => {
    const res = makeMockRes()
    const client = {
      chat: {
        completions: {
          create: async () => makeStreamChunks(['Hola', ' mundo', '!'])
        }
      }
    }

    await streamGroq(client, res, 'sys', [{ role: 'user', content: 'hi' }])

    expect(res._written).toContain('data: {"content":"Hola"}\n\n')
    expect(res._written).toContain('data: {"content":" mundo"}\n\n')
    expect(res._written).toContain('data: {"content":"!"}\n\n')
    expect(res._written).toContain('data: [DONE]\n\n')
    expect(res.writableEnded).toBe(true)
  })

  test('no escribe ningún chunk si el response ya estaba cerrado al iniciar el loop', async () => {
    const res = makeMockRes({ alreadyEnded: false })
    let chunksConsumed = 0

    const client = {
      chat: {
        completions: {
          create: async () => ({
            [Symbol.asyncIterator]() {
              return {
                async next() {
                  res._end()
                  chunksConsumed++
                  return { done: false, value: { choices: [{ delta: { content: 'texto' } }] } }
                }
              }
            }
          })
        }
      }
    }

    await streamGroq(client, res, 'sys', [{ role: 'user', content: 'hi' }])

    expect(chunksConsumed).toBe(1)
    expect(res._written.length).toBe(0)
  })

  test('no escribe [DONE] ni llama res.end() si writableEnded es true al salir del loop', async () => {
    const res = makeMockRes()
    let callCount = 0

    const client = {
      chat: {
        completions: {
          create: async () => ({
            [Symbol.asyncIterator]() {
              return {
                async next() {
                  callCount++
                  if (callCount === 1) {
                    return { done: false, value: { choices: [{ delta: { content: 'primer chunk' } }] } }
                  }
                  res._end()
                  return { done: true }
                }
              }
            }
          })
        }
      }
    }

    await streamGroq(client, res, 'sys', [{ role: 'user', content: 'hi' }])

    expect(res._written.some(c => c.includes('primer chunk'))).toBe(true)
    expect(res._written).not.toContain('data: [DONE]\n\n')
  })

  test('propaga errores del cliente de IA sin tragarlos silenciosamente', async () => {
    const res = makeMockRes()
    const client = {
      chat: {
        completions: {
          create: async () => { throw new Error('API timeout') }
        }
      }
    }

    await expect(
      streamGroq(client, res, 'sys', [{ role: 'user', content: 'hi' }])
    ).rejects.toThrow(/API timeout/)
  })
})

// ---------------------------------------------------------------------------
// Suite 2: bloque catch de /api/chat — guard writableEnded
// ---------------------------------------------------------------------------

describe('catch handler de rutas SSE — guard writableEnded', () => {
  function simulateCatchBlock(res, error) {
    console.error('Error Mistral /chat:', error.message)
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Error al contactar la IA' })}\n\n`)
      res.end()
    }
  }

  test('escribe error SSE y cierra el response cuando writableEnded es false', () => {
    const res = makeMockRes()
    simulateCatchBlock(res, new Error('conexión fallida'))

    expect(res._written.length).toBe(1)
    const parsed = JSON.parse(res._written[0].replace('data: ', '').replace('\n\n', ''))
    expect(parsed.error).toBe('Error al contactar la IA')
    expect(res.writableEnded).toBe(true)
  })

  test('no lanza ni escribe nada cuando writableEnded ya es true al momento del catch', () => {
    const res = makeMockRes({ alreadyEnded: true })

    expect(() => {
      simulateCatchBlock(res, new Error('error tardío'))
    }).not.toThrow()

    expect(res._written.length).toBe(0)
  })

  test('idempotencia: llamar dos veces al catch handler no dobla escrituras', () => {
    const res = makeMockRes()
    simulateCatchBlock(res, new Error('primer error'))
    simulateCatchBlock(res, new Error('segundo error'))

    expect(res._written.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Suite 3: rutas Express — integración liviana con app real
// ---------------------------------------------------------------------------

describe('GET /api/characters', () => {
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

  test('devuelve status 200 con Content-Type application/json', async () => {
    const result = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    expect(result.statusCode).toBe(200)
    expect(result.headers['content-type']).toContain('application/json')
  })

  test('devuelve un array con al menos un personaje', async () => {
    const result = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const list = JSON.parse(result.body)
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
  })

  test('cada personaje tiene id pero NO expone systemPrompt', async () => {
    const result = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const list = JSON.parse(result.body)
    for (const char of list) {
      expect('id' in char).toBe(true)
      expect('systemPrompt' in char).toBe(false)
    }
  })

  test('todos los ids son strings no vacíos', async () => {
    const result = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const list = JSON.parse(result.body)
    for (const char of list) {
      expect(typeof char.id).toBe('string')
      expect(char.id.length).toBeGreaterThan(0)
    }
  })
})

describe('POST /api/chat — personaje inexistente', () => {
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

  test('devuelve 404 si el characterId no existe', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: 'personaje-que-no-existe', messages: [] }
    )
    expect(result.statusCode).toBe(404)
    const body = JSON.parse(result.body)
    expect('error' in body).toBe(true)
  })

  test('el mensaje de error de 404 indica que no se encontró el personaje', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: 'inexistente-xyz', messages: [] }
    )
    const body = JSON.parse(result.body)
    expect(body.error).toMatch(/personaje/i)
  })
})

describe('POST /api/chat — happy path SSE con cliente mockeado', () => {
  let server

  beforeAll(async () => {
    const app = express()
    app.use(express.json())

    const router = express.Router()
    const { characters } = await import('../data/characters.js')

    const mockMistral = {
      chat: {
        completions: {
          create: async ({ stream }) => {
            if (stream) {
              return makeStreamChunks(['*Se detiene.*', ' Interesante pregunta.'])
            }
            return { choices: [{ message: { content: '["pista 1","pista 2","pista 3","pista 4"]' } }] }
          }
        }
      }
    }

    router.post('/chat', async (req, res) => {
      const { characterId, messages: rawMessages } = req.body
      const messages = rawMessages?.slice(-10) ?? []
      const character = characters[characterId]
      if (!character) {
        return res.status(404).json({ error: 'Personaje no encontrado' })
      }

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders()

      try {
        const systemPrompt = character.systemPrompt
        const streamResult = await mockMistral.chat.completions.create({
          model: 'mistral-small-latest',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          stream: true,
          max_tokens: 512
        })
        for await (const chunk of streamResult) {
          if (res.writableEnded) break
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`)
        }
        if (!res.writableEnded) {
          res.write('data: [DONE]\n\n')
          res.end()
        }
      } catch (error) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: 'Error al contactar la IA' })}\n\n`)
          res.end()
        }
      }
    })

    router.get('/characters', (req, res) => {
      const list = Object.values(characters).map(({ id, systemPrompt: _, ...rest }) => ({ id, ...rest }))
      res.json(list)
    })

    app.use('/api', router)
    server = createServer(app)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  })

  afterAll(async () => {
    await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve())
    )
  })

  test('responde con Content-Type text/event-stream', async () => {
    const charsResult = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const chars = JSON.parse(charsResult.body)
    const firstId = chars[0].id

    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: firstId, messages: [{ role: 'user', content: 'Hola' }] }
    )

    expect(result.headers['content-type']).toContain('text/event-stream')
  })

  test('el body de SSE contiene chunks con formato data: {...} y termina con [DONE]', async () => {
    const charsResult = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const chars = JSON.parse(charsResult.body)
    const firstId = chars[0].id

    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: firstId, messages: [{ role: 'user', content: 'Hola' }] }
    )

    const lines = result.body.split('\n').filter(l => l.startsWith('data: '))
    expect(lines.length).toBeGreaterThanOrEqual(2)

    const contentLines = lines.filter(l => !l.includes('[DONE]'))
    for (const line of contentLines) {
      const json = JSON.parse(line.replace('data: ', ''))
      expect('content' in json).toBe(true)
    }

    const lastLine = lines[lines.length - 1].trim()
    expect(lastLine).toBe('data: [DONE]')
  })

  test('los chunks tienen el texto mockeado esperado', async () => {
    const charsResult = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const chars = JSON.parse(charsResult.body)
    const firstId = chars[0].id

    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: firstId, messages: [{ role: 'user', content: 'test' }] }
    )

    expect(result.body).toContain('*Se detiene.*')
    expect(result.body).toContain('Interesante pregunta.')
  })

  test('devuelve 404 para characterId inválido', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: 'no-existe', messages: [] }
    )
    expect(result.statusCode).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Suite 4: POST /api/ultima-cena/scene — validaciones de input (regresiones)
// ---------------------------------------------------------------------------

describe('POST /api/ultima-cena/scene — validaciones de input', () => {
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

  test('regresion: devuelve 400 si el trigger es string vacío', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        chars: [
          { id: 'frodo', name: 'Frodo Bolsón' },
          { id: 'vader', name: 'Darth Vader' },
          { id: 'sherlock', name: 'Sherlock Holmes' }
        ],
        trigger: '',
        tema: '',
        sceneFlow: 'Libre.',
        dialogueRules: ''
      }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect('error' in body).toBe(true)
  })

  test('regresion: devuelve 400 si el trigger es solo espacios en blanco', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        chars: [
          { id: 'frodo', name: 'Frodo Bolsón' },
          { id: 'vader', name: 'Darth Vader' },
          { id: 'sherlock', name: 'Sherlock Holmes' }
        ],
        trigger: '   ',
        tema: '',
        sceneFlow: 'Libre.',
        dialogueRules: ''
      }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect('error' in body).toBe(true)
  })

  test('regresion: devuelve 400 si el trigger está ausente del body', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        chars: [
          { id: 'frodo', name: 'Frodo Bolsón' },
          { id: 'vader', name: 'Darth Vader' },
          { id: 'sherlock', name: 'Sherlock Holmes' }
        ],
        tema: '',
        sceneFlow: 'Libre.',
        dialogueRules: ''
      }
    )
    expect(result.statusCode).toBe(400)
  })

  test('regresion: devuelve 400 si se envían menos de 3 personajes (2)', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        chars: [
          { id: 'frodo', name: 'Frodo Bolsón' },
          { id: 'vader', name: 'Darth Vader' }
        ],
        trigger: 'Un silencio incómodo.',
        tema: '',
        sceneFlow: 'Libre.',
        dialogueRules: ''
      }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect('error' in body).toBe(true)
    expect(body.error).toMatch(/3|4|personajes/i)
  })

  test('regresion: devuelve 400 si se envía 1 personaje', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        chars: [{ id: 'frodo', name: 'Frodo Bolsón' }],
        trigger: 'Algo pasa.',
        tema: '',
        sceneFlow: 'Libre.',
        dialogueRules: ''
      }
    )
    expect(result.statusCode).toBe(400)
  })

  test('regresion: devuelve 400 si chars está vacío', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        chars: [],
        trigger: 'Algo pasa.',
        tema: '',
        sceneFlow: 'Libre.',
        dialogueRules: ''
      }
    )
    expect(result.statusCode).toBe(400)
  })

  test('regresion: devuelve 400 si chars está ausente', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        trigger: 'Algo pasa.',
        tema: '',
        sceneFlow: 'Libre.',
        dialogueRules: ''
      }
    )
    expect(result.statusCode).toBe(400)
  })

  test('regresion: devuelve 400 si se envían más de 4 personajes (5)', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        chars: [
          { id: 'frodo', name: 'Frodo Bolsón' },
          { id: 'vader', name: 'Darth Vader' },
          { id: 'sherlock', name: 'Sherlock Holmes' },
          { id: 'tony', name: 'Tony Stark' },
          { id: 'gandalf', name: 'Gandalf' }
        ],
        trigger: 'Un silencio incómodo.',
        tema: '',
        sceneFlow: 'Libre.',
        dialogueRules: ''
      }
    )
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect('error' in body).toBe(true)
    expect(body.error).toMatch(/3|4|personajes/i)
  })

  test('acepta exactamente 3 personajes con trigger válido (inicia SSE)', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        chars: [
          { id: 'frodo', name: 'Frodo Bolsón' },
          { id: 'vader', name: 'Darth Vader' },
          { id: 'sherlock', name: 'Sherlock Holmes' }
        ],
        trigger: 'Un silencio incómodo cae sobre la mesa.',
        tema: 'Es la última noche antes de algo que cambiará todo.',
        sceneFlow: '1. Reacciones. 2. Conflicto. 3. Resolución.',
        dialogueRules: 'Frases cortas.'
      }
    )
    expect(result.statusCode).not.toBe(400)
    expect(result.statusCode).not.toBe(404)
  })

  test('acepta exactamente 4 personajes con trigger válido (inicia SSE)', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/ultima-cena/scene', method: 'POST' },
      {
        chars: [
          { id: 'frodo', name: 'Frodo Bolsón' },
          { id: 'vader', name: 'Darth Vader' },
          { id: 'sherlock', name: 'Sherlock Holmes' },
          { id: 'tony', name: 'Tony Stark' }
        ],
        trigger: 'La copa de vino se rompe.',
        tema: '',
        sceneFlow: 'Libre.',
        dialogueRules: ''
      }
    )
    expect(result.statusCode).not.toBe(400)
    expect(result.statusCode).not.toBe(404)
  })
})
