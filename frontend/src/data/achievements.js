export const ACHIEVEMENTS = [
  // ── Mensajes ──────────────────────────────────────────────────────────────
  {
    id: 'first_message',
    name: 'Primer contacto',
    desc: 'Enviaste tu primer mensaje',
    emoji: '💬',
    condition: { type: 'messages_sent', threshold: 1 },
  },
  {
    id: 'chatty',
    name: 'Parlanchín',
    desc: '50 mensajes enviados en total',
    emoji: '🗣️',
    condition: { type: 'messages_sent', threshold: 50 },
  },
  {
    id: 'verbose',
    name: 'Incansable',
    desc: '200 mensajes enviados en total',
    emoji: '📢',
    condition: { type: 'messages_sent', threshold: 200 },
  },

  // ── Misiones ──────────────────────────────────────────────────────────────
  {
    id: 'mission_starter',
    name: 'Novato',
    desc: 'Completaste tu primera misión',
    emoji: '⚔️',
    condition: { type: 'missions_completed', threshold: 1 },
  },
  {
    id: 'mission_veteran',
    name: 'Veterano',
    desc: '10 misiones completadas',
    emoji: '🎖️',
    condition: { type: 'missions_completed', threshold: 10 },
  },
  {
    id: 'mission_elite',
    name: 'Élite',
    desc: '20 misiones completadas',
    emoji: '🏆',
    condition: { type: 'missions_completed', threshold: 20 },
  },

  // ── Personajes chateados ───────────────────────────────────────────────────
  {
    id: 'polyglot',
    name: 'Coleccionista',
    desc: 'Chateaste con 5 personajes distintos',
    emoji: '🎭',
    condition: { type: 'characters_chatted', threshold: 5 },
  },
  {
    id: 'universe_explorer',
    name: 'Explorador',
    desc: 'Chateaste con 15 personajes distintos',
    emoji: '🌌',
    condition: { type: 'characters_chatted', threshold: 15 },
  },

  // ── Dilemas ───────────────────────────────────────────────────────────────
  {
    id: 'philosopher',
    name: 'Filósofo',
    desc: '5 dilemas respondidos',
    emoji: '🎯',
    condition: { type: 'dilemas_answered', threshold: 5 },
  },
  {
    id: 'deep_thinker',
    name: 'Pensador profundo',
    desc: '15 dilemas respondidos',
    emoji: '🧠',
    condition: { type: 'dilemas_answered', threshold: 15 },
  },

  // ── Adivina ───────────────────────────────────────────────────────────────
  {
    id: 'guess_good',
    name: 'Buen ojo',
    desc: 'Alcanzaste 400 puntos en Adivina',
    emoji: '👁️',
    condition: { type: 'guess_score', threshold: 400 },
  },
  {
    id: 'guess_master',
    name: 'Detective legendario',
    desc: 'Alcanzaste 700 puntos en Adivina',
    emoji: '🔎',
    condition: { type: 'guess_score', threshold: 700 },
  },

  // ── Desafío diario ────────────────────────────────────────────────────────
  {
    id: 'daily_hero',
    name: 'Desafío aceptado',
    desc: 'Completaste tu primer desafío del día',
    emoji: '📅',
    condition: { type: 'daily_completed', threshold: 1 },
  },
  {
    id: 'daily_dedicated',
    name: 'Dedicado',
    desc: 'Completaste 5 desafíos diarios',
    emoji: '🔥',
    condition: { type: 'daily_completed', threshold: 5 },
  },
]
