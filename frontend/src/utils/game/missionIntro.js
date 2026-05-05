/**
 * missionIntro — sistema de resolución de intros cinematográficas.
 *
 * Cadena de fallback:
 *   1. cinematicIntros[character.id]  — datos únicos por personaje
 *   2. character.cinematic.missionIntro — datos legacy en characters.js
 *   3. ARCHETYPE_INTROS[archetype]    — plantilla por tipo de personaje
 *   4. DEFAULT_MISSION_INTRO          — fallback global
 *
 * Resultado: { roleLine, quote, operation }
 */
import { cinematicIntros } from '../../data/cinematicIntros.js'

// ─── Mapeo de personaje → arquetipo ──────────────────────────────────────────
// Usado solo si un personaje no tiene entrada en cinematicIntros.
const CHARACTER_ARCHETYPES = {
  'harry-potter':    'hero',
  'gollum':          'chaotic',
  'john-wick':       'action',
  'walter-white':    'villain',
  'darth-vader':     'villain',
  'tony-stark':      'strategic',
  'sherlock':        'detective',
  'jack-sparrow':    'chaotic',
  'gandalf':         'mystic',
  'goku':            'fighter',
  'ip-man':          'fighter',
  'el-profesor':     'strategic',
  'capitan-flint':   'villain',
  'jax-teller':      'action',
  'nathan-algren':   'warrior',
  'lara-croft':      'survivor',
  'spider-man':      'hero',
  'terminator':      'action',
  'ragnar-lothbrok': 'warrior',
  'leonidas':        'warrior',
  'tommy-shelby':    'villain',
  'eleven':          'mystic',
  'geralt':          'action',
  'jon-snow':        'warrior',
  'kurt-sloane':     'fighter',
  'venom':           'chaotic',
  'furiosa':         'survivor',
  'alice':           'survivor',
  'katniss':         'hero',
  'bryan-mills':     'action',
  'frank-martin':    'action',
  'rocky-balboa':    'fighter',
  'tony-ja':         'fighter',
  'james-bond':      'strategic',
  'la-novia':        'action',
  'tyler-durden':    'villain',
  'hannibal':        'villain',
  'norman-bates':    'villain',
  'wolverine':       'action',
  'john-mcclane':    'action',
}

// ─── Plantillas por arquetipo ─────────────────────────────────────────────────
const ARCHETYPE_INTROS = {
  action: {
    roleLine:  'Operativo activo. Objetivo confirmado.',
    quote:     'Un error alcanza.',
    operation: 'Operación: Ejecución',
  },
  strategic: {
    roleLine:  'Cerebro de la operación',
    quote:     'Cada movimiento estaba previsto.',
    operation: 'Operación: Jaque Mate',
  },
  chaotic: {
    roleLine:  'Variable impredecible. Activo.',
    quote:     'Los mejores planes son los que no existen.',
    operation: 'Operación: Caos Controlado',
  },
  villain: {
    roleLine:  'Amenaza clasificada. Nivel máximo.',
    quote:     'Todo el mundo tiene un precio.',
    operation: 'Operación: Dominio',
  },
  hero: {
    roleLine:  'Protector. En campo.',
    quote:     'Cada decisión tiene consecuencias.',
    operation: 'Operación: Última Línea',
  },
  detective: {
    roleLine:  'Análisis activo. Sin margen de error.',
    quote:     'Los hechos no mienten. Las personas sí.',
    operation: 'Operación: Deducción',
  },
  fighter: {
    roleLine:  'Combatiente de élite. Listo.',
    quote:     'El cuerpo recuerda lo que la mente olvida.',
    operation: 'Operación: Combate',
  },
  survivor: {
    roleLine:  'Sobreviviente. Curtido en campo.',
    quote:     'Llegué hasta acá. No me detengo ahora.',
    operation: 'Operación: Supervivencia',
  },
  mystic: {
    roleLine:  'Fuerzas que no se explican. Activas.',
    quote:     'Hay cosas más grandes que el miedo.',
    operation: 'Operación: El Umbral',
  },
  warrior: {
    roleLine:  'Guerrero probado en batalla.',
    quote:     'El honor se defiende con la vida.',
    operation: 'Operación: Última Batalla',
  },
}

// ─── Default global ───────────────────────────────────────────────────────────
export const DEFAULT_MISSION_INTRO = {
  roleLine:  'Operativo activo',
  quote:     'Cada decisión tiene consecuencias.',
  operation: 'Operación: Clasificada',
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * getMissionIntro(character) → { roleLine, quote, operation }
 *
 * Resuelve el intro cinematográfico en este orden:
 *   1. cinematicIntros por ID (fuente de verdad principal)
 *   2. character.cinematic.missionIntro (datos legacy)
 *   3. plantilla de arquetipo
 *   4. fallback global
 */
export function getMissionIntro(character) {
  const id = character?.id

  // Nivel 1 — datos únicos por personaje
  if (id && cinematicIntros[id]) {
    return cinematicIntros[id]
  }

  // Nivel 2 — datos legacy en characters.js
  const legacy = character?.cinematic?.missionIntro
  if (legacy?.quote) {
    return {
      roleLine:  legacy.roleLine  ?? character?.description ?? '',
      quote:     legacy.quote,
      operation: legacy.operation ?? legacy.missionLabel ?? '',
    }
  }

  // Nivel 3 — arquetipo
  const archetype = CHARACTER_ARCHETYPES[id] ?? null
  if (archetype && ARCHETYPE_INTROS[archetype]) {
    return ARCHETYPE_INTROS[archetype]
  }

  // Nivel 4 — default global
  return DEFAULT_MISSION_INTRO
}
