import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'El email es requerido')
    .email('El formato del email no es válido')
    .refine(v => !/\s/.test(v), { message: 'El email no puede contener espacios' }),
  password: z.string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .refine(v => !/\s/.test(v), { message: 'La contraseña no puede contener espacios' })
})

export const registerSchema = z.object({
  email: z.string()
    .min(1, 'El email es requerido')
    .email('El formato del email no es válido')
    .refine(v => !/\s/.test(v), { message: 'El email no puede contener espacios' }),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(72, 'La contraseña es demasiado larga')
    .refine(v => !/\s/.test(v), { message: 'La contraseña no puede contener espacios' }),
  username: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(30, 'El nombre no puede tener más de 30 caracteres')
    .regex(
      /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ _-]+$/,
      'El nombre solo puede contener letras, números, espacios, guiones y guiones bajos'
    )
    .refine(v => v.trim().length > 0, { message: 'El nombre no puede estar vacío' })
})
