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
  mockSignInWithPassword,
  mockSignUp,
  mockSignOut,
  mockOnAuthStateChange,
} = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignOut: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}))

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
    let onAuthChangeCb = null

    mockOnAuthStateChange.mockImplementation((cb) => {
      onAuthChangeCb = cb
      // NO llamamos cb aquí — loading debe seguir en true
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    function Consumer() {
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
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('llama signInWithPassword con email y password', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    const { getCtx } = renderProvider()

    await act(async () => {
      await getCtx().login('user@example.com', 'password123')
    })

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(mockSignInWithPassword).toHaveBeenCalledTimes(1)
  })

  it('lanza el error de Supabase cuando el login falla', async () => {
    const supabaseError = new Error('Invalid login credentials')
    mockSignInWithPassword.mockResolvedValue({ error: supabaseError })

    const { getCtx } = renderProvider()

    await expect(
      act(async () => {
        await getCtx().login('bad@example.com', 'wrong')
      })
    ).rejects.toThrow('Invalid login credentials')
  })
})

describe('AuthContext — register()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('llama signUp con email, password y username en user_metadata', async () => {
    mockSignUp.mockResolvedValue({ error: null })

    const { getCtx } = renderProvider()

    await act(async () => {
      await getCtx().register('new@example.com', 'pass456', 'TestUser')
    })

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'pass456',
      options: { data: { username: 'TestUser' } },
    })
    expect(mockSignUp).toHaveBeenCalledTimes(1)
  })

  it('lanza el error de Supabase cuando el registro falla', async () => {
    const supabaseError = new Error('Email already in use')
    mockSignUp.mockResolvedValue({ error: supabaseError })

    const { getCtx } = renderProvider()

    await expect(
      act(async () => {
        await getCtx().register('taken@example.com', 'pass', 'Name')
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
