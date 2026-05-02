// ─── localStorage keys ────────────────────────────────────────────────────────
export const chatHistoryKey = (characterId) => `chat-${characterId}`
export const CHAT_HISTORY_META_KEY = 'chat-history-meta'
export const ONBOARDING_KEY = 'onboarding-completed'
export const STREAK_KEY = 'streak-data'
export const LEVEL_KEY = 'user-level'
export const ACHIEVEMENTS_KEY = 'unlocked-achievements'
export const LAST_SESSION_KEY = 'last-session'

// ─── Límites de persistencia ─────────────────────────────────────────────────
export const MAX_STORED_MESSAGES = 50

// ─── Rutas de la app ─────────────────────────────────────────────────────────
export const ROUTES = {
  HOME:           '/',
  AUTH:           '/auth',
  PERFIL:         '/perfil',
  RESET_PASSWORD: '/reset-password',
  CHAT:                '/chat',
  CHAT_CHARACTER:      (id) => `/chat/${id}`,
  CHAT_CHARACTER_ROUTE: '/chat/:characterId',
  DUO:            '/duo',
  GUESS:          '/guess',
  MISSION:        '/mission',
  SWIPE:          '/swipe',
  DILEMA:         '/dilema',
  INTERROGATION:  '/interrogation',
  MODOS:          '/modos',
  ULTIMA_CENA:    '/ultima-cena',
  PARECIDO:       '/parecido',
  SALAS:      '/salas',
  SALA:       (id) => `/salas/${id}`,
  SALA_ROUTE: '/salas/:roomId',
  ADMIN:          '/admin',
  CREAR_PERSONAJE:       '/crear-personaje',
  EDITAR_PERSONAJE:      (id) => `/editar-personaje/${id}`,
  EDITAR_PERSONAJE_ROUTE: '/editar-personaje/:id',
  COMUNIDAD:        '/comunidad',
  DASHBOARD:        '/dashboard',
  PRIVACY:          '/privacy',
  TERMS:            '/terms',
}
