import { characters } from '../../data/characters'
import { chatHistoryKey } from '../../utils/constants'

export function formatChatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return d.toLocaleDateString('es-AR', { weekday: 'long' })
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

export function getRecentChats() {
  return characters
    .map(char => {
      try {
        const raw = localStorage.getItem(chatHistoryKey(char.id))
        if (!raw) return null
        const msgs = JSON.parse(raw)
        if (!msgs?.length) return null
        const last = msgs[msgs.length - 1]
        return { char, last, ts: last.ts ?? 0 }
      } catch { return null }
    })
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts)
}
