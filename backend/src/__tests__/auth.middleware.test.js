/**
 * Tests para backend/src/middleware/auth.js
 *
 * requireAuth extrae el Bearer token del header Authorization,
 * lo valida con supabase.auth.getUser y:
 *   - Si no hay token → 401
 *   - Si el token es inválido → 401
 *   - Si el token es válido → adjunta req.user y llama next()
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// ─── Mock de ../config/supabase.js ───────────────────────────────────────────
// Necesitamos mockear el módulo ANTES de importar requireAuth porque el módulo
// se resuelve al tiempo de import en ES Modules. Usamos jest.unstable_mockModule
// que es la API correcta para ES Modules en Jest.

const mockGetUser = jest.fn()

jest.unstable_mockModule('../config/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
  },
}))

// El import dinámico debe ir DESPUÉS de jest.unstable_mockModule
const { requireAuth } = await import('../middleware/auth.js')

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Crea un objeto req mínimo de Express */
function makeReq(authHeader = undefined) {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  }
}

/** Crea un objeto res que captura status + json */
function makeRes() {
  const res = {
    _status: null,
    _body: null,
  }
  res.status = (code) => {
    res._status = code
    res.json = (body) => {
      res._body = body
      return res
    }
    return res
  }
  res.json = (body) => {
    res._body = body
    return res
  }
  return res
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('requireAuth middleware', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
  })

  it('responde 401 cuando no hay header Authorization', async () => {
    const req = makeReq()
    const res = makeRes()
    const next = jest.fn()

    await requireAuth(req, res, next)

    expect(res._status).toBe(401)
    expect(res._body).toEqual({ error: 'Token requerido' })
    expect(next).not.toHaveBeenCalled()
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('responde 401 cuando el token es inválido (supabase devuelve error)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid JWT' },
    })

    const req = makeReq('Bearer token_invalido')
    const res = makeRes()
    const next = jest.fn()

    await requireAuth(req, res, next)

    expect(res._status).toBe(401)
    expect(res._body).toEqual({ error: 'Token inválido' })
    expect(next).not.toHaveBeenCalled()
    expect(mockGetUser).toHaveBeenCalledWith('token_invalido')
  })

  it('responde 401 cuando supabase no devuelve error pero user es null', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const req = makeReq('Bearer token_sin_usuario')
    const res = makeRes()
    const next = jest.fn()

    await requireAuth(req, res, next)

    expect(res._status).toBe(401)
    expect(res._body).toEqual({ error: 'Token inválido' })
    expect(next).not.toHaveBeenCalled()
  })

  it('llama next() y adjunta req.user cuando el token es válido', async () => {
    const fakeUser = { id: 'user-123', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({
      data: { user: fakeUser },
      error: null,
    })

    const req = makeReq('Bearer token_valido')
    const res = makeRes()
    const next = jest.fn()

    await requireAuth(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(req.user).toBe(fakeUser)
    expect(res._status).toBeNull()
  })

  it('extrae correctamente el token del header Bearer', async () => {
    const fakeUser = { id: 'abc', email: 'x@y.com' }
    mockGetUser.mockResolvedValue({
      data: { user: fakeUser },
      error: null,
    })

    const req = makeReq('Bearer mi.jwt.token')
    const res = makeRes()
    const next = jest.fn()

    await requireAuth(req, res, next)

    // Verifica que se le pasa SOLO el token, sin el prefijo "Bearer "
    expect(mockGetUser).toHaveBeenCalledWith('mi.jwt.token')
  })
})
