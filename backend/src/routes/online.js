import { Router } from 'express'

const router = Router()

// Map de sessionId -> timestamp del último ping
// Best-effort: se resetea en cada reinicio del servidor.
const sessions = new Map()
const TTL = 45_000        // 45s sin ping = offline
const MAX_SESSIONS = 5_000 // cap para evitar consumo ilimitado de memoria

// Cached count — updated on cleanup. Avoids O(n) iteration on every ping.
let cachedCount = 0

// Limpieza periódica — .unref() permite que el proceso cierre limpiamente
setInterval(() => {
  const cutoff = Date.now() - TTL
  for (const [id, ts] of sessions) {
    if (ts < cutoff) sessions.delete(id)
  }
  cachedCount = sessions.size // all remaining entries are within TTL
}, 15_000).unref()

// POST /api/online/ping — el cliente avisa que está vivo
router.post('/online/ping', (req, res) => {
  const { sid } = req.body
  if (!sid || typeof sid !== 'string' || sid.length > 64) {
    return res.status(400).json({ error: 'sid inválido' })
  }
  const isNew = !sessions.has(sid)
  // Permitir actualizar SIDs existentes; rechazar nuevos si el Map está lleno
  if (isNew && sessions.size >= MAX_SESSIONS) {
    return res.json({ online: cachedCount })
  }
  sessions.set(sid, Date.now())
  if (isNew) cachedCount++ // optimistic increment for new sessions
  res.json({ online: cachedCount })
})

// GET /api/online — devuelve el conteo actual
router.get('/online', (_req, res) => {
  res.json({ online: cachedCount })
})

export default router
