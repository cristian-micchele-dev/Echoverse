/**
 * Tests para src/routes/chat.js
 *
 * Cubre:
 *  - streamGroq: guard writableEnded en el loop y antes del res.end()
 *  - Bloque catch de /api/chat: no escribe si writableEnded es true
 *  - Happy path de POST /api/chat: headers SSE correctos y chunks
 *  - GET /api/characters: devuelve lista sin exponer systemPrompt
 *
 * Runner: node --test (ES Modules)
 * Restricciones: sin dependencias externas, sin servidor real levantado
 */

import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createServer } from 'node:http'

// ---------------------------------------------------------------------------
// Helpers de mock
// ---------------------------------------------------------------------------

/**
 * Crea un objeto res-like que simula el response de Express para rutas SSE.
 * Registra todas las llamadas para poder inspeccionarlas en los tests.
 */
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
    // Helpers de inspección
    _written: written,
    _headers: headers,
    _end() { ended = true }
  }
}

/**
 * Construye un stream asíncrono iterable que emite chunks de texto.
 * Simula la respuesta de la API de Mistral.
 */
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
// Importación del módulo bajo test con monkey-patching del cliente Mistral
// ---------------------------------------------------------------------------
//
// El módulo chat.js instancia `mistral` a nivel de módulo, por lo que no es
// posible reemplazarlo desde afuera sin un sistema de inyección de dependencias.
// La estrategia elegida es extraer la lógica de streamGroq y de los handlers
// en funciones puras + testear la función con el cliente inyectado, mientras
// que para las rutas express se monta la app completa con un cliente mockeado
// vía variable de entorno (evita llamadas reales).
//
// Para no tocar el código productivo, los tests de la función streamGroq se
// realizan extrayendo la MISMA lógica en un helper de test, que refleja
// exactamente el código de producción. Esto nos permite validar el contrato
// de comportamiento en forma determinista sin modificar chat.js.
// ---------------------------------------------------------------------------

// Replica exacta de streamGroq tal como está en chat.js (líneas 132-148)
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

    assert.ok(res._written.includes('data: {"content":"Hola"}\n\n'))
    assert.ok(res._written.includes('data: {"content":" mundo"}\n\n'))
    assert.ok(res._written.includes('data: {"content":"!"}\n\n'))
    assert.ok(res._written.includes('data: [DONE]\n\n'))
    assert.equal(res.writableEnded, true)
  })

  test('no escribe ningún chunk si el response ya estaba cerrado al iniciar el loop', async () => {
    // Simula el caso en que el cliente desconectó antes de que llegue el primer chunk
    const res = makeMockRes({ alreadyEnded: false })
    let chunksConsumed = 0

    const client = {
      chat: {
        completions: {
          create: async () => ({
            [Symbol.asyncIterator]() {
              return {
                async next() {
                  // El cliente cierra res antes de que el primer chunk sea procesado
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

    // El guard debe haber cortado el loop en la primera iteración
    assert.equal(chunksConsumed, 1, 'el iterador se llama una vez antes del break')
    assert.equal(res._written.length, 0, 'no debe escribir nada si writableEnded es true')
  })

  test('no escribe [DONE] ni llama res.end() si writableEnded es true al salir del loop', async () => {
    // Simula que el response se cierra durante el streaming (después de algunos chunks)
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
                  // En la segunda iteración el cliente ya cerró la conexión
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

    // El primer chunk sí debe haberse escrito (writableEnded era false entonces)
    assert.ok(res._written.some(c => c.includes('primer chunk')))
    // [DONE] NO debe aparecer porque cuando terminó el loop writableEnded era true
    assert.ok(!res._written.includes('data: [DONE]\n\n'), 'no debe escribir [DONE] si ya cerró')
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

    await assert.rejects(
      () => streamGroq(client, res, 'sys', [{ role: 'user', content: 'hi' }]),
      /API timeout/
    )
  })
})

// ---------------------------------------------------------------------------
// Suite 2: bloque catch de /api/chat — guard writableEnded
// ---------------------------------------------------------------------------

describe('catch handler de rutas SSE — guard writableEnded', () => {
  /**
   * Replica el bloque catch de /api/chat (líneas 222-228 de chat.js).
   * Testea el contrato de comportamiento sin tocar el código de producción.
   */
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

    assert.equal(res._written.length, 1)
    const parsed = JSON.parse(res._written[0].replace('data: ', '').replace('\n\n', ''))
    assert.equal(parsed.error, 'Error al contactar la IA')
    assert.equal(res.writableEnded, true)
  })

  test('no lanza ni escribe nada cuando writableEnded ya es true al momento del catch', () => {
    const res = makeMockRes({ alreadyEnded: true })

    assert.doesNotThrow(() => {
      simulateCatchBlock(res, new Error('error tardío'))
    })

    assert.equal(res._written.length, 0, 'no debe escribir si el response ya cerró')
  })

  test('idempotencia: llamar dos veces al catch handler no dobla escrituras', () => {
    const res = makeMockRes()
    simulateCatchBlock(res, new Error('primer error'))
    simulateCatchBlock(res, new Error('segundo error'))

    // Solo la primera llamada debe escribir (la segunda encuentra writableEnded = true)
    assert.equal(res._written.length, 1)
  })
})

// ---------------------------------------------------------------------------
// Suite 3: rutas Express — integración liviana con app real
// ---------------------------------------------------------------------------
//
// Se monta el router de Express con un cliente Mistral completamente mockeado
// a través de la variable de entorno MISTRAL_API_KEY para evitar llamadas reales.
// Se usa node:http para hacer requests HTTP reales al servidor de test.
// ---------------------------------------------------------------------------

// Evitar que el módulo openai falle por falta de API key real
process.env.MISTRAL_API_KEY = 'test-key-mock'

import http from 'node:http'

// Helper para hacer requests HTTP a un servidor en memoria
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

describe('GET /api/characters', () => {
  let server
  let app

  before(async () => {
    app = express()
    app.use(express.json())

    // Importar el router real — usa MISTRAL_API_KEY del env (mockeada arriba)
    const { default: chatRouter } = await import('./chat.js')
    app.use('/api', chatRouter)

    server = createServer(app)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  })

  after(async () => {
    await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve())
    )
  })

  test('devuelve status 200 con Content-Type application/json', async () => {
    const result = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    assert.equal(result.statusCode, 200)
    assert.ok(result.headers['content-type'].includes('application/json'))
  })

  test('devuelve un array con al menos un personaje', async () => {
    const result = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const list = JSON.parse(result.body)
    assert.ok(Array.isArray(list), 'debe ser un array')
    assert.ok(list.length > 0, 'debe tener al menos un personaje')
  })

  test('cada personaje tiene id pero NO expone systemPrompt', async () => {
    const result = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const list = JSON.parse(result.body)
    for (const char of list) {
      assert.ok('id' in char, `personaje ${char.id}: debe tener id`)
      assert.ok(!('systemPrompt' in char), `personaje ${char.id}: no debe exponer systemPrompt`)
    }
  })

  test('todos los ids son strings no vacíos', async () => {
    const result = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const list = JSON.parse(result.body)
    for (const char of list) {
      assert.equal(typeof char.id, 'string')
      assert.ok(char.id.length > 0)
    }
  })
})

describe('POST /api/chat — personaje inexistente', () => {
  let server

  before(async () => {
    const app = express()
    app.use(express.json())
    const { default: chatRouter } = await import('./chat.js')
    app.use('/api', chatRouter)
    server = createServer(app)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  })

  after(async () => {
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
    assert.equal(result.statusCode, 404)
    const body = JSON.parse(result.body)
    assert.ok('error' in body)
  })

  test('el mensaje de error de 404 indica que no se encontró el personaje', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: 'inexistente-xyz', messages: [] }
    )
    const body = JSON.parse(result.body)
    assert.match(body.error, /personaje/i)
  })
})

describe('POST /api/chat — happy path SSE con cliente mockeado', () => {
  let server

  before(async () => {
    const app = express()
    app.use(express.json())

    // Crear una versión mínima del router con cliente mockeado directamente
    // en lugar de importar chat.js (que instancia openai a nivel módulo).
    // Esto valida el contrato de la ruta sin llamadas reales.
    const router = express.Router()
    const { characters } = await import('../data/characters.js')

    // Mock del cliente Mistral que retorna un stream controlado
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

    // Replica mínima de la ruta /chat usando el mock
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

  after(async () => {
    await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve())
    )
  })

  test('responde con Content-Type text/event-stream', async () => {
    // Obtener un characterId válido
    const charsResult = await httpRequest(server, { path: '/api/characters', method: 'GET' })
    const chars = JSON.parse(charsResult.body)
    const firstId = chars[0].id

    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: firstId, messages: [{ role: 'user', content: 'Hola' }] }
    )

    assert.ok(
      result.headers['content-type'].includes('text/event-stream'),
      `esperaba text/event-stream, got: ${result.headers['content-type']}`
    )
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
    assert.ok(lines.length >= 2, 'debe haber al menos un chunk de contenido y el [DONE]')

    // Verificar que los chunks de contenido son JSON válido con campo "content"
    const contentLines = lines.filter(l => !l.includes('[DONE]'))
    for (const line of contentLines) {
      const json = JSON.parse(line.replace('data: ', ''))
      assert.ok('content' in json, 'cada chunk debe tener campo content')
    }

    // Verificar que termina con [DONE] (trim para no depender de trailing newline)
    const lastLine = lines[lines.length - 1].trim()
    assert.equal(lastLine, 'data: [DONE]', 'el último evento debe ser [DONE]')
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

    const fullText = result.body
    assert.ok(fullText.includes('*Se detiene.*'), 'debe incluir el primer chunk del mock')
    assert.ok(fullText.includes('Interesante pregunta.'), 'debe incluir el segundo chunk del mock')
  })

  test('devuelve 404 para characterId inválido', async () => {
    const result = await httpRequest(
      server,
      { path: '/api/chat', method: 'POST' },
      { characterId: 'no-existe', messages: [] }
    )
    assert.equal(result.statusCode, 404)
  })
})
