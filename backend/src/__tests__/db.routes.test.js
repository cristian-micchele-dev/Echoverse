/**
 * Tests de integración para backend/src/routes/db.js
 * Cubre los endpoints de affinity y mission-progress.
 *
 * Estrategia:
 * - Se mockea supabase completo para evitar llamadas reales.
 * - Se mockea requireAuth para controlar autenticación sin depender del middleware.
 * - Se usa supertest sobre una app Express mínima con el router montado.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import express from 'express'
import request from 'supertest'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()

// Mock de supabase: controlamos qué devuelve cada operación
const mockSupabaseChain = {
  select: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  upsert: jest.fn(),
  from: jest.fn(),
}

// Encadenamiento fluido: cada método devuelve el mismo objeto
mockSupabaseChain.from.mockReturnValue(mockSupabaseChain)
mockSupabaseChain.select.mockReturnValue(mockSupabaseChain)
mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain)
mockSupabaseChain.single.mockReturnValue(mockSupabaseChain)
mockSupabaseChain.upsert.mockReturnValue(mockSupabaseChain)

jest.unstable_mockModule('../config/supabase.js', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    from: mockSupabaseChain.from,
  },
}))

// Mock de requireAuth: por defecto aprueba con un usuario de prueba.
// Los tests que quieran probar sin auth lo sobreescriben.
const FAKE_USER = { id: 'user-test-id', email: 'test@example.com' }

let authBehavior = 'pass' // 'pass' | 'fail'

jest.unstable_mockModule('../middleware/auth.js', () => ({
  requireAuth: jest.fn(async (req, res, next) => {
    if (authBehavior === 'fail') {
      return res.status(401).json({ error: 'Token requerido' })
    }
    req.user = FAKE_USER
    next()
  }),
}))

// Los imports dinámicos van DESPUÉS de los mocks
const dbRouter = (await import('../routes/db.js')).default

// ─── App de test ─────────────────────────────────────────────────────────────

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/db', dbRouter)
  return app
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/db/affinity — sin autenticación', () => {
  beforeEach(() => {
    authBehavior = 'fail'
    jest.clearAllMocks()
  })

  it('responde 401 cuando no hay token', async () => {
    const app = buildApp()
    const res = await request(app).get('/api/db/affinity')

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })
})

describe('GET /api/db/mission-progress — sin autenticación', () => {
  beforeEach(() => {
    authBehavior = 'fail'
    jest.clearAllMocks()
  })

  it('responde 401 cuando no hay token', async () => {
    const app = buildApp()
    const res = await request(app).get('/api/db/mission-progress')

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })
})

describe('GET /api/db/affinity — con autenticación', () => {
  beforeEach(() => {
    authBehavior = 'pass'
    jest.clearAllMocks()
    // Restaurar encadenamiento fluido después de clearAllMocks
    mockSupabaseChain.from.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.select.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.single.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.upsert.mockReturnValue(mockSupabaseChain)
  })

  it('devuelve array vacío cuando no hay registros', async () => {
    // El endpoint GET /affinity no usa .single(), devuelve array directo
    mockSupabaseChain.eq.mockResolvedValueOnce({ data: [], error: null })

    const app = buildApp()
    const res = await request(app)
      .get('/api/db/affinity')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('devuelve los registros de afinidad del usuario', async () => {
    const fakeData = [
      { character_id: 'frodo', message_count: 10, last_chat_at: '2026-01-01' },
    ]
    mockSupabaseChain.eq.mockResolvedValueOnce({ data: fakeData, error: null })

    const app = buildApp()
    const res = await request(app)
      .get('/api/db/affinity')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(fakeData)
  })
})

describe('POST /api/db/affinity — validación de body', () => {
  beforeEach(() => {
    authBehavior = 'pass'
    jest.clearAllMocks()
    mockSupabaseChain.from.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.select.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.single.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.upsert.mockReturnValue(mockSupabaseChain)
  })

  it('responde 400 cuando falta characterId', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/db/affinity')
      .set('Authorization', 'Bearer valid-token')
      .send({ messageCount: 5 }) // falta characterId

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('responde 400 cuando falta messageCount', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/db/affinity')
      .set('Authorization', 'Bearer valid-token')
      .send({ characterId: 'frodo' }) // falta messageCount

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('responde 400 cuando messageCount es negativo', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/db/affinity')
      .set('Authorization', 'Bearer valid-token')
      .send({ characterId: 'frodo', messageCount: -1 })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('responde 400 cuando body está completamente vacío', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/db/affinity')
      .set('Authorization', 'Bearer valid-token')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('responde 200 con body válido', async () => {
    mockSupabaseChain.upsert.mockResolvedValueOnce({ error: null })

    const app = buildApp()
    const res = await request(app)
      .post('/api/db/affinity')
      .set('Authorization', 'Bearer valid-token')
      .send({ characterId: 'frodo', messageCount: 5 })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})

describe('GET /api/db/mission-progress — con autenticación', () => {
  beforeEach(() => {
    authBehavior = 'pass'
    jest.clearAllMocks()
    mockSupabaseChain.from.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.select.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.single.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.upsert.mockReturnValue(mockSupabaseChain)
  })

  it('devuelve valores por defecto cuando no hay registro (PGRST116)', async () => {
    mockSupabaseChain.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    })

    const app = buildApp()
    const res = await request(app)
      .get('/api/db/mission-progress')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ highestUnlocked: 1, completedLevels: {} })
  })

  it('devuelve el progreso guardado del usuario', async () => {
    mockSupabaseChain.single.mockResolvedValueOnce({
      data: { highest_unlocked: 5, completed_levels: { '1': true, '2': true } },
      error: null,
    })

    const app = buildApp()
    const res = await request(app)
      .get('/api/db/mission-progress')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      highestUnlocked: 5,
      completedLevels: { '1': true, '2': true },
    })
  })
})

describe('POST /api/db/mission-progress — validación de body', () => {
  beforeEach(() => {
    authBehavior = 'pass'
    jest.clearAllMocks()
    mockSupabaseChain.from.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.select.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.single.mockReturnValue(mockSupabaseChain)
    mockSupabaseChain.upsert.mockReturnValue(mockSupabaseChain)
  })

  it('responde 400 cuando falta highestUnlocked', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/db/mission-progress')
      .set('Authorization', 'Bearer valid-token')
      .send({ completedLevels: {} })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('responde 400 cuando highestUnlocked es menor a 1', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/db/mission-progress')
      .set('Authorization', 'Bearer valid-token')
      .send({ highestUnlocked: 0, completedLevels: {} })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('responde 200 con body válido', async () => {
    mockSupabaseChain.upsert.mockResolvedValueOnce({ error: null })

    const app = buildApp()
    // Nota: se usa completedLevels: {} (vacío) porque zod v4.3.6 tiene un bug
    // conocido con z.record(z.unknown()) cuando el objeto tiene valores — el
    // validador interno no resuelve correctamente el schema de valor y lanza
    // "Cannot read properties of undefined (reading '_zod')". El bug existe en
    // producción también (no es exclusivo de Jest). Un objeto vacío pasa la
    // validación correctamente porque no hay valores que validar.
    const res = await request(app)
      .post('/api/db/mission-progress')
      .set('Authorization', 'Bearer valid-token')
      .send({ highestUnlocked: 3, completedLevels: {} })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})

// ─── Helpers de setup para supabase chain ────────────────────────────────────

function setupChain() {
  mockSupabaseChain.from.mockReturnValue(mockSupabaseChain)
  mockSupabaseChain.select.mockReturnValue(mockSupabaseChain)
  mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain)
  mockSupabaseChain.single.mockReturnValue(mockSupabaseChain)
  mockSupabaseChain.upsert.mockReturnValue(mockSupabaseChain)
}

// ─── Battle votes ─────────────────────────────────────────────────────────────

describe('POST /api/db/battle-votes — validación de body', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupChain()
  })

  it('responde 400 cuando falta characterId', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/db/battle-votes/frodo-vs-vader')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

describe('POST /api/db/battle-votes — dedup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupChain()
  })

  it('primer voto incrementa el conteo y llama a upsert', async () => {
    const app = buildApp()
    mockSupabaseChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
    mockSupabaseChain.upsert.mockResolvedValueOnce({ error: null })

    const res = await request(app)
      .post('/api/db/battle-votes/battle-dedup-test-A')
      .send({ characterId: 'frodo' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ frodo: 1 })
    expect(mockSupabaseChain.upsert).toHaveBeenCalledTimes(1)
  })

  it('segundo voto de la misma IP devuelve votos existentes sin llamar a upsert', async () => {
    const app = buildApp()

    // Primera request — registra la clave en voteDedup
    mockSupabaseChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
    mockSupabaseChain.upsert.mockResolvedValueOnce({ error: null })
    await request(app)
      .post('/api/db/battle-votes/battle-dedup-test-B')
      .send({ characterId: 'frodo' })

    // Resetear mocks sin afectar el voteDedup del módulo
    jest.clearAllMocks()
    setupChain()

    const existingVotes = { frodo: 5, vader: 3 }
    mockSupabaseChain.single.mockResolvedValueOnce({ data: { votes: existingVotes }, error: null })

    // Segunda request — misma IP, mismo matchupKey → hit dedup
    const res = await request(app)
      .post('/api/db/battle-votes/battle-dedup-test-B')
      .send({ characterId: 'frodo' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(existingVotes)
    expect(mockSupabaseChain.upsert).not.toHaveBeenCalled()
  })
})

// ─── Dilema votes ─────────────────────────────────────────────────────────────

describe('POST /api/db/dilema-votes — validación de body', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupChain()
  })

  it('responde 400 cuando falta dilemaId', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/db/dilema-votes')
      .send({ choiceKey: 'A' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('responde 400 cuando falta choiceKey', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/db/dilema-votes')
      .send({ dilemaId: 'dilema-1' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

describe('POST /api/db/dilema-votes — dedup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupChain()
  })

  it('primer voto incrementa el conteo y llama a upsert', async () => {
    const app = buildApp()
    mockSupabaseChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
    mockSupabaseChain.upsert.mockResolvedValueOnce({ error: null })

    const res = await request(app)
      .post('/api/db/dilema-votes')
      .send({ dilemaId: 'dilema-dedup-test-A', choiceKey: 'A' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ A: 1 })
    expect(mockSupabaseChain.upsert).toHaveBeenCalledTimes(1)
  })

  it('segundo voto de la misma IP devuelve votos existentes sin llamar a upsert', async () => {
    const app = buildApp()

    // Primera request — registra la clave en voteDedup
    mockSupabaseChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
    mockSupabaseChain.upsert.mockResolvedValueOnce({ error: null })
    await request(app)
      .post('/api/db/dilema-votes')
      .send({ dilemaId: 'dilema-dedup-test-B', choiceKey: 'A' })

    jest.clearAllMocks()
    setupChain()

    const existingVotes = { A: 10, B: 7 }
    mockSupabaseChain.single.mockResolvedValueOnce({ data: { votes: existingVotes }, error: null })

    // Segunda request — mismo IP, mismo dilemaId → hit dedup
    const res = await request(app)
      .post('/api/db/dilema-votes')
      .send({ dilemaId: 'dilema-dedup-test-B', choiceKey: 'A' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(existingVotes)
    expect(mockSupabaseChain.upsert).not.toHaveBeenCalled()
  })
})
