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

app.use('/api', chatRouter)
app.use('/api', interrogationRouter)
app.use('/api/db', dbRouter)
app.use('/api/auth', authRouter)
app.use('/api', roomsRouter)
app.use('/api/admin', adminRouter)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
