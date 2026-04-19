// Historial de mensajes enviado al modelo (últimos N mensajes ≈ 5 turnos)
export const MAX_HISTORY = 10

// Límites de tokens por rol en modo Dúo
export const DUO_TOKEN_MAP = { A: 150, B: 150, A2: 60 }

// Límites de tokens por rol en modo Última Cena
export const ULTIMA_CENA_TOKEN_MAP = { respond: 100, remate: 55 }

// Máximo de tokens para la escena completa de Última Cena
export const SCENE_MAX_TOKENS = 380

// Historial reciente que se incluye completo en modo Historia
export const STORY_MAX_RECENT = 4

// Historial reciente que se incluye completo en modo Misión
export const MISSION_MAX_RECENT = 4
