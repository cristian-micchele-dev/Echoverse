const MODE_ROUTES = {
  interrogation: '/interrogation',
  mission: '/mission',
  dilema: '/dilema',
  guess: '/guess',
  swipe: '/swipe',
  chat: '/chat',
  story: '/story',
}

export const MODE_LABELS = {
  interrogation: 'Interrogatorio',
  mission: 'Misión',
  dilema: 'Dilema',
  guess: 'Adivina el Personaje',
  swipe: 'Swipe',
  chat: 'Chat libre',
  story: 'Historia interactiva',
}

const RAW_CHALLENGES = [
  { characterId: 'sherlock',       mode: 'interrogation', label: 'Interrogatorio con Sherlock' },
  { characterId: 'walter-white',   mode: 'dilema',        label: 'Dilema con Heisenberg' },
  { characterId: 'darth-vader',    mode: 'swipe',         label: 'Swipe: Darth Vader' },
  { characterId: 'gandalf',        mode: 'dilema',        label: 'Dilema con Gandalf' },
  { characterId: 'tony-stark',     mode: 'swipe',         label: 'Swipe: Tony Stark' },
  { characterId: 'john-wick',      mode: 'mission',       label: 'Misión al estilo John Wick' },
  { characterId: 'el-profesor',    mode: 'story',         label: 'Historia con El Profesor' },
  { characterId: 'jack-sparrow',   mode: 'chat',          label: 'Chat con Jack Sparrow' },
  { characterId: 'joker',          mode: 'interrogation', label: 'Interrogatorio al Joker' },
  { characterId: 'hannibal',       mode: 'interrogation', label: 'Interrogatorio a Hannibal' },
  { characterId: 'kratos',         mode: 'mission',       label: 'Misión con Kratos' },
  { characterId: 'batman',         mode: 'dilema',        label: 'Dilema con Batman' },
  { characterId: 'wolverine',      mode: 'swipe',         label: 'Swipe: Wolverine' },
  { characterId: 'aragorn',        mode: 'mission',       label: 'Misión con Aragorn' },
  { characterId: 'lara-croft',     mode: 'story',         label: 'Historia con Lara Croft' },
  { characterId: 'james-bond',     mode: 'interrogation', label: 'Interrogatorio con Bond' },
  { characterId: 'tyler-durden',   mode: 'chat',          label: 'Chat con Tyler Durden' },
  { characterId: 'terminator',     mode: 'swipe',         label: 'Swipe: Terminator' },
  { characterId: 'gollum',         mode: 'guess',         label: 'Adivina el Personaje' },
  { characterId: 'el-profesor',    mode: 'interrogation', label: 'Interrogatorio a El Profesor' },
  { characterId: 'sherlock',       mode: 'swipe',         label: 'Swipe: Sherlock Holmes' },
  { characterId: 'gandalf',        mode: 'story',         label: 'Historia con Gandalf' },
  { characterId: 'tony-stark',     mode: 'chat',          label: 'Chat con Tony Stark' },
  { characterId: 'darth-vader',    mode: 'mission',       label: 'Misión con Darth Vader' },
  { characterId: 'john-wick',      mode: 'interrogation', label: 'Interrogatorio a John Wick' },
  { characterId: 'jack-sparrow',   mode: 'story',         label: 'Historia con Jack Sparrow' },
  { characterId: 'batman',         mode: 'interrogation', label: 'Interrogatorio con Batman' },
  { characterId: 'katniss',        mode: 'mission',       label: 'Misión con Katniss' },
  { characterId: 'ethan-hunt',     mode: 'mission',       label: 'Misión con Ethan Hunt' },
  { characterId: 'walter-white',   mode: 'story',         label: 'Historia con Walter White' },
]

export const challenges = RAW_CHALLENGES.map(c => ({
  ...c,
  route: MODE_ROUTES[c.mode],
}))

export function getTodayChallenge() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '') // '20260411'
  const seed = parseInt(dateStr) % challenges.length
  return challenges[seed]
}
