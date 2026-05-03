// ─── Tabla de niveles ────────────────────────────────────────────────────────

const LEVELS = [
  { minXP: 0,    label: '',                emoji: '' },
  { minXP: 30,   label: 'Conocido',        emoji: '🤝' },
  { minXP: 80,   label: 'Contacto',        emoji: '📡' },
  { minXP: 160,  label: 'Aliado',          emoji: '⚔️' },
  { minXP: 300,  label: 'Confidente',      emoji: '🔒' },
  { minXP: 500,  label: 'Cómplice',        emoji: '🎭' },
  { minXP: 800,  label: 'Hermano de armas',emoji: '🛡️' },
  { minXP: 1200, label: 'Leyenda',         emoji: '👑' },
]

// XP por actividad
export const XP_VALUES = {
  message:       2,
  speed:        15,
  mission:      30,
  entrenamiento:25,
  swipe:        10,
  dilema:       10,
  interrogation:10,
  confesionario:10,
  story:        10,
  duo:          10,
  guess:        10,
  fight:        10,
  battle:       10,
  parecido:     10,
  'este-o-ese': 10,
  'ultima-cena':10,
}

// Bonus por primera vez en un modo (por personaje)
export const FIRST_TIME_BONUS = 10

// ─── Storage ─────────────────────────────────────────────────────────────────

function getMeta() {
  try { return JSON.parse(localStorage.getItem('chat-history-meta') || '{}') }
  catch { return {} }
}

function saveMeta(meta) {
  try { localStorage.setItem('chat-history-meta', JSON.stringify(meta)) }
  catch (e) { /* storage unavailable */ void e }
}

export function getAffinityData(characterId) {
  const meta = getMeta()
  const data = meta[characterId] || {}
  // Compatibilidad: si existe messageCount pero no xp, convertir
  if (data.messageCount !== undefined && data.xp === undefined) {
    data.xp = data.messageCount * 2
  }
  return { xp: 0, modesPlayed: {}, ...data }
}

// ─── XP ──────────────────────────────────────────────────────────────────────

export function addXP(characterId, amount) {
  const meta = getMeta()
  const data = meta[characterId] || { xp: 0, modesPlayed: {} }
  if (data.messageCount !== undefined && data.xp === undefined) {
    data.xp = data.messageCount * 2
  }
  data.xp = (data.xp || 0) + amount
  meta[characterId] = data
  saveMeta(meta)
  return data.xp
}

export function addModeXP(characterId, modeId) {
  const meta = getMeta()
  const data = meta[characterId] || { xp: 0, modesPlayed: {} }
  if (data.messageCount !== undefined && data.xp === undefined) {
    data.xp = data.messageCount * 2
  }
  const modesPlayed = data.modesPlayed || {}
  const base = XP_VALUES[modeId] ?? 10
  const bonus = modesPlayed[modeId] ? 0 : FIRST_TIME_BONUS
  const prevXP = data.xp || 0
  const prevLevel = getAffinityLevel(prevXP)
  data.xp = prevXP + base + bonus
  modesPlayed[modeId] = (modesPlayed[modeId] || 0) + 1
  data.modesPlayed = modesPlayed
  meta[characterId] = data
  saveMeta(meta)
  const newLevel = getAffinityLevel(data.xp)
  const levelUp = newLevel > prevLevel
  return {
    xp: data.xp,
    gained: base + bonus,
    levelUp,
    newLevel,
    newLabel: LEVELS[newLevel]?.label ?? '',
    newEmoji: LEVELS[newLevel]?.emoji ?? '',
  }
}

// Compatibilidad con el campo messageCount (chat)
export function incrementMessageCount(characterId) {
  const meta = getMeta()
  const data = meta[characterId] || { xp: 0, messageCount: 0, modesPlayed: {} }
  data.messageCount = (data.messageCount || 0) + 1
  data.xp = (data.xp || 0) + XP_VALUES.message
  meta[characterId] = data
  saveMeta(meta)
}

// ─── Nivel ───────────────────────────────────────────────────────────────────

export function getAffinityLevel(xp) {
  let level = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXP) level = i
  }
  return level
}

export function getLevelInfo(level) {
  return LEVELS[level] ?? LEVELS[LEVELS.length - 1]
}

export function getXPProgress(xp) {
  const currentLevel = getAffinityLevel(xp)
  const currentMin = LEVELS[currentLevel].minXP
  const nextLevel = LEVELS[currentLevel + 1]
  if (!nextLevel) return { pct: 100, current: xp - currentMin, needed: 0, level: currentLevel }
  const needed = nextLevel.minXP - currentMin
  const current = xp - currentMin
  return { pct: Math.round((current / needed) * 100), current, needed, level: currentLevel }
}

export function getAffinityLabel(level) { return LEVELS[level]?.label ?? '' }
export function getAffinityEmoji(level) { return LEVELS[level]?.emoji ?? '' }

// ─── Rank global ─────────────────────────────────────────────────────────────

const RANK_TIERS = [
  { minXP: 500, rank: 'leyenda'    },
  { minXP: 200, rank: 'maestro'    },
  { minXP: 75,  rank: 'veterano'   },
  { minXP: 20,  rank: 'explorador' },
  { minXP: 0,   rank: 'curioso'    },
]

export const RANK_ORDER = ['curioso', 'explorador', 'veterano', 'maestro', 'leyenda']

export const RANK_LABELS = {
  curioso:    'Curioso',
  explorador: 'Explorador',
  veterano:   'Veterano',
  maestro:    'Maestro',
  leyenda:    'Leyenda',
}

export function getTotalXP() {
  const meta = getMeta()
  return Object.values(meta).reduce(
    (sum, d) => sum + (d.xp ?? (d.messageCount ?? 0) * 2),
    0
  )
}

export function getUserRankName() {
  const total = getTotalXP()
  return RANK_TIERS.find(t => total >= t.minXP)?.rank ?? 'curioso'
}

export function isRankSufficient(userRank, requiredRank) {
  return RANK_ORDER.indexOf(userRank) >= RANK_ORDER.indexOf(requiredRank)
}
