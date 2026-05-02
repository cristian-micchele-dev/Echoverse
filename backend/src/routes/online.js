import { Router } from 'express'

const router = Router()

// Map de sessionId -> timestamp del último ping
// Best-effort: se resetea en cada reinicio del servidor.
const sessions = new Map()
const TTL = 45_000        // 45s sin ping = offline
const MAX_SESSIONS = 5_000 // cap para evitar consumo ilimitado de memoria

function activeCount() {
  const cutoff = Date.now() - TTL
  let count = 0
  for (const ts of sessions.values()) {
    if (ts >= cutoff) count++
  }
  return count
}

// Limpieza periódica — .unref() permite que el proceso cierre limpiamente
setInterval(() => {
  const cutoff = Date.now() - TTL
  for (const [id, ts] of sessions) {
    if (ts < cutoff) sessions.delete(id)
  }
}, 15_000).unref()

// POST /api/online/ping — el cliente avisa que está vivo
router.post('/online/ping', (req, res) => {
  const { sid } = req.body
  if (!sid || typeof sid !== 'string' || sid.length > 64) {
    return res.status(400).json({ error: 'sid inválido' })
  }
  // Permitir actualizar SIDs existentes; rechazar nuevos si el Map está lleno
  if (!sessions.has(sid) && sessions.size >= MAX_SESSIONS) {
    return res.json({ online: activeCount() })
  }
  sessions.set(sid, Date.now())
  res.json({ online: activeCount() })
})

// GET /api/online — devuelve el conteo actual
router.get('/online', (_req, res) => {
  res.json({ online: activeCount() })
})

export default router
