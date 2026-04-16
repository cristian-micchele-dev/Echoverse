const ARCS = [
  { character: 'gollum',          arcName: 'Las Cuevas',               levels: [1,  2]  },
  { character: 'aragorn',         arcName: 'Camino del Rey',           levels: [3,  4]  },
  { character: 'aquiles',         arcName: 'La Ilíada',                levels: [5,  6]  },
  { character: 'ragnar-lothbrok', arcName: 'El Norte',                 levels: [7,  8]  },
  { character: 'el-profesor',     arcName: 'El Plan',                  levels: [9,  10] },
  { character: 'jax-teller',      arcName: 'Charming',                 levels: [11, 12] },
  { character: 'jack-sparrow',    arcName: 'El Mar de las Islas',      levels: [13, 14] },
  { character: 'sherlock',        arcName: 'Baker Street',             levels: [15, 16] },
  { character: 'gandalf',         arcName: 'La Tierra Media',          levels: [17, 18] },
  { character: 'geralt',          arcName: 'El Continente (Rivia)',    levels: [19, 20] },
  { character: 'ip-man',          arcName: 'Foshan',                   levels: [21, 22] },
  { character: 'tony-stark',      arcName: 'Stark Industries',         levels: [23, 24] },
  { character: 'terminator',      arcName: 'Protocolo Skynet',         levels: [25, 26] },
  { character: 'walter-white',    arcName: 'Nuevo México',             levels: [27, 28] },
  { character: 'john-wick',       arcName: 'El Continente',            levels: [29, 29] },
  { character: 'darth-vader',     arcName: 'La Estrella de la Muerte', levels: [30, 30] },
]

export function getDifficultyForLevel(level) {
  if (level <= 5)  return 'easy'
  if (level <= 20) return 'normal'
  return 'hard'
}

const SPECIAL_LEVEL = {
  level: 31,
  character: null,
  arcName: 'Protocolo de Emergencia',
  difficulty: 'hard',
  type: 'countdown',
}

export const MISSION_LEVELS = [
  ...Array.from({ length: 30 }, (_, i) => {
    const level = i + 1
    const arc = ARCS.find(a => level >= a.levels[0] && level <= a.levels[1])
    return {
      level,
      character: arc.character,
      arcName: arc.arcName,
      difficulty: getDifficultyForLevel(level),
    }
  }),
  SPECIAL_LEVEL,
]

export const CAMPAIGN_ARCS = MISSION_LEVELS.reduce((acc, lvl) => {
  const existing = acc.find(a => a.arcName === lvl.arcName)
  if (existing) {
    existing.levels.push(lvl)
  } else {
    acc.push({ arcName: lvl.arcName, character: lvl.character, levels: [lvl] })
  }
  return acc
}, [])
