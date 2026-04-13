// @vitest-environment jsdom
/**
 * Tests para frontend/src/context/AuthContext.jsx
 *
 * Verifica que AuthProvider expone las funciones correctas y que cada una
 * delega en la API de Supabase con los argumentos esperados.
 * El módulo supabase se mockea completamente — no se hacen llamadas reales.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'

// ─── Mock de supabase ─────────────────────────────────────────────────────────
// vi.hoisted() asegura que las variables estén disponibles cuando vi.mock()
// corre su factory (que se hoist al principio del archivo).

const {
  mockSetSession,
  mockSignOut,
  mockOnAuthStateChange,
} = vi.hoisted(() => ({
  mockSetSession: vi.fn(),
  mockSignOut: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      setSession: mockSetSession,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}))

// ─── Mock de fetch ────────────────────────────────────────────────────────────

function mockFetchOk(data) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(data),
  }))
}

function mockFetchError(errorMsg) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve({ error: errorMsg }),
  }))
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Renderiza AuthProvider y captura el valor de contexto expuesto.
 * onAuthStateChange recibe un callback que podemos invocar manualmente
 * para simular cambios de sesión de Supabase.
 *
 * @returns {{ getCtx: () => object, triggerAuthChange: (session) => void }}
 */
function renderProvider() {
  let capturedCtx = null
  let authChangeCallback = null

  // onAuthStateChange guarda el callback y devuelve la estructura que Supabase usa
  mockOnAuthStateChange.mockImplementation((cb) => {
    authChangeCallback = cb
    return { data: { subscription: { unsubscribe: vi.fn() } } }
  })

  function Consumer() {
    // eslint-disable-next-line react-hooks/globals
    capturedCtx = useAuth()
    return null
  }

  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  )

  return {
    getCtx: () => capturedCtx,
    triggerAuthChange: (session) => {
      act(() => authChangeCallback('SIGNED_IN', session))
    },
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthContext — estado inicial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('comienza con user=null, session=null y loading=true antes del primer evento', () => {
    // No disparamos el callback de onAuthStateChange para simular el estado
    // previo a que Supabase responda.
    let capturedCtx = null

    mockOnAuthStateChange.mockImplementation(() => {
      // Callback not invoked — loading stays true
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    function Consumer() {
      // eslint-disable-next-line react-hooks/globals
      capturedCtx = useAuth()
      return null
    }

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    expect(capturedCtx.user).toBeNull()
    expect(capturedCtx.session).toBeNull()
    expect(capturedCtx.loading).toBe(true)
  })

  it('loading pasa a false tras recibir el primer evento de auth (sin sesión)', async () => {
    const { getCtx, triggerAuthChange } = renderProvider()

    // Simula que Supabase responde sin sesión activa (usuario no autenticado)
    triggerAuthChange(null)

    await waitFor(() => {
      expect(getCtx().loading).toBe(false)
    })
    expect(getCtx().user).toBeNull()
    expect(getCtx().session).toBeNull()
  })

  it('expone user y session cuando hay sesión activa', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com' }
    const fakeSession = { user: fakeUser, access_token: 'tok123' }

    const { getCtx, triggerAuthChange } = renderProvider()

    triggerAuthChange(fakeSession)

    await waitFor(() => {
      expect(getCtx().loading).toBe(false)
    })
    expect(getCtx().user).toEqual(fakeUser)
    expect(getCtx().session).toEqual(fakeSession)
  })
})

describe('AuthContext — login()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('llama al endpoint /auth/login con email y password', async () => {
    const fakeSession = { access_token: 'tok', user: { id: 'u1' } }
    mockFetchOk({ session: fakeSession })
    mockSetSession.mockResolvedValue({ error: null })

    const { getCtx } = renderProvider()

    await act(async () => {
      await getCtx().login('user@example.com', 'password123')
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toContain('/auth/login')
    expect(JSON.parse(opts.body)).toEqual({ email: 'user@example.com', password: 'password123' })
    expect(mockSetSession).toHaveBeenCalledWith(fakeSession)
  })

  it('lanza el error del backend cuando el login falla', async () => {
    mockFetchError('Invalid login credentials')

    const { getCtx } = renderProvider()

    await expect(
      act(async () => {
        await getCtx().login('bad@example.com', 'wrongpass1')
      })
    ).rejects.toThrow('Invalid login credentials')
  })
})

describe('AuthContext — register()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('llama al endpoint /auth/register con email, password y username', async () => {
    const fakeSession = { access_token: 'tok', user: { id: 'u2' } }
    mockFetchOk({ session: fakeSession })
    mockSetSession.mockResolvedValue({ error: null })

    const { getCtx } = renderProvider()

    await act(async () => {
      await getCtx().register('new@example.com', 'pass456789', 'TestUser')
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toContain('/auth/register')
    expect(JSON.parse(opts.body)).toEqual({ email: 'new@example.com', password: 'pass456789', username: 'TestUser' })
    expect(mockSetSession).toHaveBeenCalledWith(fakeSession)
  })

  it('lanza el error del backend cuando el registro falla', async () => {
    mockFetchError('Email already in use')

    const { getCtx } = renderProvider()

    await expect(
      act(async () => {
        await getCtx().register('taken@example.com', 'password99', 'Name')
      })
    ).rejects.toThrow('Email already in use')
  })
})

describe('AuthContext — logout()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('llama signOut de supabase', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const { getCtx } = renderProvider()

    await act(async () => {
      await getCtx().logout()
    })

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('lanza el error de Supabase cuando el logout falla', async () => {
    const supabaseError = new Error('Network error')
    mockSignOut.mockResolvedValue({ error: supabaseError })

    const { getCtx } = renderProvider()

    await expect(
      act(async () => {
        await getCtx().logout()
      })
    ).rejects.toThrow('Network error')
  })
})
