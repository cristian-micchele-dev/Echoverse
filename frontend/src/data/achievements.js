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

  // ── Modos de juego ────────────────────────────────────────────────────────
  {
    id: 'interrogation_first',
    name: 'Primer sospechoso',
    desc: 'Completaste tu primer interrogatorio',
    emoji: '🔦',
    condition: { type: 'mode_completions', mode: 'interrogation', threshold: 1 },
  },
  {
    id: 'interrogation_5',
    name: 'Polígrafo humano',
    desc: '5 interrogatorios completados',
    emoji: '🕵️',
    condition: { type: 'mode_completions', mode: 'interrogation', threshold: 5 },
  },
  {
    id: 'swipe_first',
    name: 'Primera pasada',
    desc: 'Completaste tu primer Swipe',
    emoji: '👆',
    condition: { type: 'mode_completions', mode: 'swipe', threshold: 1 },
  },
  {
    id: 'swipe_10',
    name: 'Experto en trivia',
    desc: '10 partidas de Swipe completadas',
    emoji: '⚡',
    condition: { type: 'mode_completions', mode: 'swipe', threshold: 10 },
  },
  {
    id: 'story_first',
    name: 'Primer capítulo',
    desc: 'Completaste tu primera historia interactiva',
    emoji: '📖',
    condition: { type: 'mode_completions', mode: 'story', threshold: 1 },
  },
  {
    id: 'story_5',
    name: 'Narrador',
    desc: '5 historias completadas',
    emoji: '✍️',
    condition: { type: 'mode_completions', mode: 'story', threshold: 5 },
  },
  {
    id: 'confesionario_first',
    name: 'Primera confesión',
    desc: 'Completaste tu primer confesionario',
    emoji: '🎭',
    condition: { type: 'mode_completions', mode: 'confesionario', threshold: 1 },
  },
  {
    id: 'este_o_ese_first',
    name: 'Decisiones claras',
    desc: 'Completaste Este o Ese',
    emoji: '⚖️',
    condition: { type: 'mode_completions', mode: 'este-o-ese', threshold: 1 },
  },
  {
    id: 'parecido_first',
    name: 'Espejo roto',
    desc: 'Descubriste a qué personaje te parecés',
    emoji: '🪞',
    condition: { type: 'mode_completions', mode: 'parecido', threshold: 1 },
  },
  {
    id: 'guess_first',
    name: 'Primera pista',
    desc: 'Completaste tu primera partida de Adivina',
    emoji: '🔍',
    condition: { type: 'mode_completions', mode: 'guess', threshold: 1 },
  },
  {
    id: 'guess_5',
    name: 'Sabueso',
    desc: '5 partidas de Adivina completadas',
    emoji: '🏅',
    condition: { type: 'mode_completions', mode: 'guess', threshold: 5 },
  },
  {
    id: 'all_modes',
    name: 'Explorador total',
    desc: 'Completaste al menos una vez cada modo de juego',
    emoji: '🌟',
    condition: { type: 'all_modes', threshold: 1 },
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
