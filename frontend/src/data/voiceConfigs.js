// Configuraciones de voz para Web Speech API por personaje
// pitch: 0.1–2 (1 = normal), rate: 0.1–10 (1 = normal)

const specificConfigs = {
  'darth-vader':  { pitch: 0.4,  rate: 0.82 },
  'terminator':   { pitch: 0.35, rate: 0.72 },
  'gollum':       { pitch: 1.5,  rate: 1.15 },
  'john-wick':    { pitch: 0.55, rate: 0.78 },
  'gandalf':      { pitch: 0.65, rate: 0.88 },
  'tony-stark':   { pitch: 1.0,  rate: 1.12 },
  'sherlock':     { pitch: 1.05, rate: 1.08 },
  'joker':        { pitch: 1.2,  rate: 0.95 },
  'walter-white': { pitch: 0.85, rate: 0.95 },
  'rocky-balboa': { pitch: 0.8,  rate: 0.88 },
  'wolverine':    { pitch: 0.6,  rate: 0.9  },
  'kratos':       { pitch: 0.45, rate: 0.8  },
  'jack-sparrow': { pitch: 0.9,  rate: 0.88 },
  'batman':       { pitch: 0.4,  rate: 0.82 },
  'ragnar-lothbrok': { pitch: 0.7, rate: 0.9 },
}

const byTone = {
  dark:     { pitch: 0.55, rate: 0.85 },
  mystical: { pitch: 0.85, rate: 0.92 },
  glitch:   { pitch: 1.3,  rate: 1.1  },
  viking:   { pitch: 0.7,  rate: 0.9  },
}

export function getVoiceConfig(character) {
  return (
    specificConfigs[character.id] ??
    byTone[character.notificationTone] ??
    { pitch: 1.0, rate: 1.0 }
  )
}
