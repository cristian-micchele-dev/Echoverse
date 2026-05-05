import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import chatRouter          from './routes/chat.js'
import interrogationRouter from './routes/interrogation.js'
import dbRouter            from './routes/db.js'
import authRouter          from './routes/auth.js'
import roomsRouter         from './routes/rooms.js'
import adminRouter         from './routes/admin.js'
import onlineRouter        from './routes/online.js'
import dailyQuoteRouter    from './routes/dailyQuote.js'
import { supabase }        from './config/supabase.js'

const app = express()
app.set('trust proxy', 1)
const PORT = process.env.PORT || 3001

const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173'
app.use(cors({ origin: ALLOWED_ORIGIN }))
app.use(express.json())

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Demasiadas solicitudes. Intentá de nuevo en un minuto.' }
})
app.use('/api', limiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Demasiados intentos. Esperá 15 minutos antes de intentar de nuevo.' },
  skipSuccessfulRequests: true, // solo cuenta los fallidos
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Demasiadas solicitudes a la IA. Esperá un momento.' }
})
app.use('/api/chat', aiLimiter)
app.use('/api/dilema', aiLimiter)
app.use('/api/interrogation/ask', aiLimiter)
app.use('/api/interrogation/start', aiLimiter)

const quoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Demasiadas solicitudes.' }
})
app.use('/api/daily-quote', quoteLimiter)

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Demasiados votos. Esperá un momento.' }
})
app.use('/api/db/battle-votes', voteLimiter)
app.use('/api/db/dilema-votes', voteLimiter)

const imageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Demasiadas solicitudes de imagen. Esperá un momento.' }
})
app.use('/api/mission/image-proxy', imageLimiter)

app.use('/api', chatRouter)
app.use('/api', interrogationRouter)
app.use('/api/db', dbRouter)
app.use('/api/auth', authRouter)
app.use('/api', roomsRouter)
app.use('/api/admin', adminRouter)
app.use('/api', onlineRouter)
app.use('/api', dailyQuoteRouter)

// ─── Error handler global ───────────────────────────────────────────────────
// Captura errores lanzados por asyncHandler y los convierte en respuestas JSON.

app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500
  const message = err.message || 'Error interno del servidor'
  const code = err.code || 'INTERNAL_ERROR'

  if (status === 500) {
    console.error('[error]', err)
  }

  res.status(status).json({ error: message, code })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)

  // Liberar salas que quedaron bloqueadas por un crash o deploy anterior
  supabase
    .from('rooms')
    .update({ is_ai_responding: false })
    .eq('is_ai_responding', true)
    .then(({ error }) => {
      if (error) console.error('[startup] No se pudieron liberar salas bloqueadas:', error.message)
    })
})
