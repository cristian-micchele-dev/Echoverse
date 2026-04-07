// @vitest-environment jsdom
/**
 * Tests para frontend/src/pages/AuthPage.jsx
 *
 * Cubre comportamiento visible del componente:
 *  - Renderizado inicial (tab login activo)
 *  - Visibilidad condicional del campo "Nombre o usuario"
 *  - Limpieza de estado al cambiar de tab
 *  - Visualización de error cuando login falla
 *
 * Mocks: useAuth (AuthContext) y react-router-dom (useNavigate)
 * El CSS de AuthPage se ignora via moduleNameMapper en vite.config.js (ver setupTests).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// AuthPage importa './AuthPage.css' — Vitest con jsdom no procesa CSS.
// El import de CSS es ignorado automáticamente por Vitest cuando el módulo
// no tiene transformador configurado para .css (devuelve módulo vacío).

import AuthPage from '../pages/AuthPage'

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthPage — renderizado inicial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra el título EchoVerse', () => {
    render(<AuthPage />)
    expect(screen.getByText('EchoVerse')).toBeInTheDocument()
  })

  it('tiene el tab "Iniciar sesión" activo por defecto', () => {
    render(<AuthPage />)
    const loginTab = screen.getByRole('button', { name: 'Iniciar sesión' })
    expect(loginTab).toHaveClass('active')
  })

  it('el tab "Registrarse" NO está activo por defecto', () => {
    render(<AuthPage />)
    const registerTab = screen.getByRole('button', { name: 'Registrarse' })
    expect(registerTab).not.toHaveClass('active')
  })

  it('el campo "Email" está presente en tab login', () => {
    render(<AuthPage />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
  })

  it('el campo "Contraseña" está presente en tab login', () => {
    render(<AuthPage />)
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
  })

  it('el campo "Nombre o usuario" NO aparece en tab login', () => {
    render(<AuthPage />)
    expect(screen.queryByPlaceholderText('Nombre o usuario')).not.toBeInTheDocument()
  })

  it('muestra el botón de submit con texto "Entrar" en tab login', () => {
    render(<AuthPage />)
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })
})

describe('AuthPage — tab registro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('el campo "Nombre o usuario" aparece al cambiar a tab registro', () => {
    render(<AuthPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    expect(screen.getByPlaceholderText('Nombre o usuario')).toBeInTheDocument()
  })

  it('el tab "Registrarse" queda activo después del click', () => {
    render(<AuthPage />)
    const registerTab = screen.getByRole('button', { name: 'Registrarse' })
    fireEvent.click(registerTab)
    expect(registerTab).toHaveClass('active')
  })

  it('el botón de submit cambia a "Crear cuenta" en tab registro', () => {
    render(<AuthPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument()
  })
})

describe('AuthPage — cambio de tab limpia estado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('el campo "Nombre o usuario" desaparece al volver a tab login', () => {
    render(<AuthPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    expect(screen.getByPlaceholderText('Nombre o usuario')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.queryByPlaceholderText('Nombre o usuario')).not.toBeInTheDocument()
  })

  it('cambiar de tab limpia el mensaje de error visible', async () => {
    // Simular un error previo en login
    mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'))

    render(<AuthPage />)

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'bad@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })

    // Al cambiar de tab el error se limpia (switchTab llama setError(''))
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    expect(screen.queryByText('Credenciales inválidas')).not.toBeInTheDocument()
  })
})

describe('AuthPage — manejo de errores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra el mensaje de error cuando login falla', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid login credentials'))

    render(<AuthPage />)

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'badpass' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
  })

  it('muestra "Error inesperado" cuando el error no tiene mensaje', async () => {
    mockLogin.mockRejectedValueOnce({}) // objeto vacío, sin .message

    render(<AuthPage />)

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'badpass' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText('Error inesperado')).toBeInTheDocument()
    })
  })

  it('navega a "/" cuando el login es exitoso', async () => {
    mockLogin.mockResolvedValueOnce(undefined)

    render(<AuthPage />)

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'good@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'goodpass' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })
})

describe('AuthPage — "Continuar sin cuenta"', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navega a "/" al hacer click en "Continuar sin cuenta"', () => {
    render(<AuthPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar sin cuenta' }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
