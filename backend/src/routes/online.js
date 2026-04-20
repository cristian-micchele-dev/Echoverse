import { Router } from 'express'

const router = Router()

// Map de sessionId -> timestamp del último ping
const sessions = new Map()
const TTL = 45_000 // 45s sin ping = offline

// Limpieza periódica
setInterval(() => {
  const cutoff = Date.now() - TTL
  for (const [id, ts] of sessions) {
    if (ts < cutoff) sessions.delete(id)
  }
}, 15_000)

// POST /api/online/ping — el cliente avisa que está vivo
router.post('/online/ping', (req, res) => {
  const { sid } = req.body
  if (!sid || typeof sid !== 'string' || sid.length > 64) {
    return res.status(400).json({ error: 'sid inválido' })
  }
  sessions.set(sid, Date.now())
  res.json({ online: sessions.size })
})

// GET /api/online — devuelve el conteo actual
router.get('/online', (_req, res) => {
  const cutoff = Date.now() - TTL
  let count = 0
  for (const ts of sessions.values()) {
    if (ts >= cutoff) count++
  }
  res.json({ online: count })
})

export default router
