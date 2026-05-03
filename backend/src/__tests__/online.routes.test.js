/**
 * Tests para backend/src/routes/online.js
 *
 * Cubre:
 *  - POST /api/online/ping: validación de sid, conteo, dedup
 *  - GET /api/online: devuelve conteo actual
 *
 * El módulo no tiene dependencias externas — no se necesitan mocks.
 * El Map `sessions` es state de módulo: persiste entre tests del mismo archivo.
 * Cada test usa SIDs únicos para evitar interferencias.
 */

import { describe, it, expect } from '@jest/globals'
import express from 'express'
import request from 'supertest'

const { default: onlineRouter } = await import('../routes/online.js')

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api', onlineRouter)
  return app
}

// ─── Validación de sid ────────────────────────────────────────────────────────

describe('POST /api/online/ping — validación de sid', () => {
  it('responde 400 cuando falta sid', async () => {
    const res = await request(buildApp()).post('/api/online/ping').send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('responde 400 cuando sid es string vacío', async () => {
    const res = await request(buildApp()).post('/api/online/ping').send({ sid: '' })
    expect(res.status).toBe(400)
  })

  it('responde 400 cuando sid supera 64 caracteres', async () => {
    const longSid = 'a'.repeat(65)
    const res = await request(buildApp()).post('/api/online/ping').send({ sid: longSid })
    expect(res.status).toBe(400)
  })

  it('responde 400 cuando sid no es string', async () => {
    const res = await request(buildApp()).post('/api/online/ping').send({ sid: 99999 })
    expect(res.status).toBe(400)
  })

  it('acepta sid de exactamente 64 caracteres', async () => {
    const exactSid = 'online-valid-64chars-' + 'x'.repeat(43)
    const res = await request(buildApp()).post('/api/online/ping').send({ sid: exactSid })
    expect(res.status).toBe(200)
  })
})

// ─── Conteo y dedup ───────────────────────────────────────────────────────────

describe('POST /api/online/ping — conteo y dedup', () => {
  it('acepta un sid válido y devuelve { online: N } con N >= 1', async () => {
    const res = await request(buildApp())
      .post('/api/online/ping')
      .send({ sid: 'online-test-valid-unique-001' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('online')
    expect(typeof res.body.online).toBe('number')
    expect(res.body.online).toBeGreaterThanOrEqual(1)
  })

  it('pingar el mismo sid dos veces no incrementa el contador', async () => {
    const app = buildApp()
    const sid = 'online-test-dedup-unique-002'

    const res1 = await request(app).post('/api/online/ping').send({ sid })
    const res2 = await request(app).post('/api/online/ping').send({ sid })

    expect(res2.body.online).toBe(res1.body.online)
  })

  it('un sid nuevo incrementa el contador en exactamente 1', async () => {
    const app = buildApp()
    const sidA = 'online-test-inc-a-unique-003'
    const sidB = 'online-test-inc-b-unique-004'

    const res1 = await request(app).post('/api/online/ping').send({ sid: sidA })
    const countAfterA = res1.body.online

    const res2 = await request(app).post('/api/online/ping').send({ sid: sidB })
    expect(res2.body.online).toBe(countAfterA + 1)
  })
})

// ─── GET /api/online ──────────────────────────────────────────────────────────

describe('GET /api/online', () => {
  it('devuelve status 200 con campo online numérico', async () => {
    const res = await request(buildApp()).get('/api/online')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('online')
    expect(typeof res.body.online).toBe('number')
  })

  it('el conteo de GET coincide con el de un ping previo', async () => {
    const app = buildApp()
    const pingRes = await request(app)
      .post('/api/online/ping')
      .send({ sid: 'online-test-get-sync-unique-005' })

    const getRes = await request(app).get('/api/online')
    expect(getRes.body.online).toBe(pingRes.body.online)
  })
})
