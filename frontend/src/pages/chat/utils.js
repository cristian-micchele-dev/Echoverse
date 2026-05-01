export function playNotificationSound(tone) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    switch (tone) {
      case 'dark':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(160, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35)
        break
      case 'mystical':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(528, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2)
        osc.frequency.exponentialRampToValueAtTime(528, ctx.currentTime + 0.4)
        break
      case 'glitch':
        osc.type = 'square'
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.05)
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.15)
        break
      case 'viking':
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.25)
        break
      default:
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.15)
    }

    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.45)
    osc.onended = () => ctx.close()
  } catch { /* audio context not available */ }
}

export function detectReaction(content) {
  const t = content.toLowerCase()
  if (/gracias|te quiero|amor|hermoso|brillante|perfecto/.test(t)) return '❤️'
  if (/jajaj|gracioso|divertid|risas|humor/.test(t)) return '😄'
  if (/peligro|cuidado|guerra|batalla|pelea|muerte|destruir/.test(t)) return '⚔️'
  if (/magia|hechizo|fuerza|poder|misterio|destino/.test(t)) return '✨'
  if (/imposible|increíble|asombroso|impresionante/.test(t)) return '🤯'
  if (/triste|sol[ao]|llorar|dolor|sufrimiento/.test(t)) return '💫'
  if (/rum|cerveza|festejo|beber|brindis/.test(t)) return '🍺'
  return null
}

export function formatDateSeparator(ts) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

export function updateHistoryMeta(characterId, messageCount) {
  try {
    const meta = JSON.parse(localStorage.getItem('chat-history-meta') || '{}')
    meta[characterId] = { messageCount, lastChat: Date.now() }
    localStorage.setItem('chat-history-meta', JSON.stringify(meta))
  } catch { /* localStorage unavailable */ }
}
