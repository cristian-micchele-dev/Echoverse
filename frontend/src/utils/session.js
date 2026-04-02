const KEY = 'echoverse-last-session'
const MAX_AGE = 7 * 24 * 60 * 60 * 1000

export function clearSession() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export function saveSession(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, timestamp: Date.now() }))
  } catch { /* silently ignore storage errors */ }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (Date.now() - session.timestamp > MAX_AGE) return null
    return session
  } catch { return null }
}

export function timeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 2) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  if (hours === 1) return 'hace 1 hora'
  if (hours < 24) return `hace ${hours} horas`
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

export function hoursUntilMidnight() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}
