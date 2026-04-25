import { z } from 'zod'

const emailField = z.string()
  .min(1, 'El email es requerido')
  .email('El formato del email no es válido')          // debe ir ANTES de refine()
  .refine(v => !/\s/.test(v), { message: 'El email no puede contener espacios' })

const passwordLoginField = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .refine(v => !/\s/.test(v), { message: 'La contraseña no puede contener espacios' })

const passwordRegisterField = z.string()
  .min(1, 'La contraseña es requerida')
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña es demasiado larga')
  .refine(v => !/\s/.test(v), { message: 'La contraseña no puede contener espacios' })
  .refine(v => /[a-zA-Z]/.test(v), { message: 'La contraseña debe contener al menos una letra' })
  .refine(v => /[0-9]/.test(v), { message: 'La contraseña debe contener al menos un número' })

const usernameField = z.string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(30, 'El nombre no puede tener más de 30 caracteres')
  .regex(
    /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ _-]+$/,
    'El nombre solo puede contener letras, números, espacios, guiones y guiones bajos'
  )
  .refine(v => v.trim().length >= 2, { message: 'El nombre no puede estar vacío ni tener solo espacios' })

export const loginSchema = z.object({
  email: emailField,
  password: passwordLoginField
})

export const registerSchema = z.object({
  email: emailField,
  password: passwordRegisterField,
  username: usernameField
})

export const resetPasswordSchema = z.object({
  password: passwordRegisterField
})
