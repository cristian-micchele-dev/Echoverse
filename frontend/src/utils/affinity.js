export function getAffinityData(characterId) {
  try {
    const meta = JSON.parse(localStorage.getItem('chat-history-meta') || '{}')
    return meta[characterId] || { messageCount: 0 }
  } catch { return { messageCount: 0 } }
}

export function getAffinityLevel(messageCount) {
  if (messageCount >= 60) return 4
  if (messageCount >= 30) return 3
  if (messageCount >= 15) return 2
  if (messageCount >= 5)  return 1
  return 0
}

const LEVEL_LABELS = ['', 'Conocido', 'Aliado', 'Confidente', 'Leyenda']
const LEVEL_EMOJIS = ['', '🤝', '⚔️', '🔒', '👑']

export function getAffinityLabel(level) { return LEVEL_LABELS[level] }
export function getAffinityEmoji(level) { return LEVEL_EMOJIS[level] }
