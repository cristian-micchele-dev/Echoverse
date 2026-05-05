import { ZodError } from 'zod'

/**
 * Middleware factory para validar req.body con un schema Zod.
 * En caso de error, responde 400 con detalles de validación.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        }))
        return res.status(400).json({
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          issues,
        })
      }
      next(error)
    }
  }
}

/**
 * Middleware para capturar errores async y pasarlos al error handler de Express.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
