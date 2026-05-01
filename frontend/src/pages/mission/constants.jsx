export const DIFFICULTIES = [
  { id: 'easy',   label: 'Fácil',   desc: 'El personaje te guía', color: '#4ade80' },
  { id: 'normal', label: 'Normal',  desc: 'Equilibrado',          color: '#facc15' },
  { id: 'hard',   label: 'Difícil', desc: 'Sin piedad',           color: '#f87171' }
]

export const MISSION_TYPES = [
  { id: 'combate',       label: 'Combate',       desc: 'Supervivencia' },
  { id: 'infiltracion',  label: 'Infiltración',  desc: 'Espionaje' },
  { id: 'rescate',       label: 'Rescate',       desc: 'Protección' },
  { id: 'investigacion', label: 'Investigación', desc: 'Misterio' }
]

export const MISSION_TYPE_ICONS = {
  combate: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
      <line x1="13" y1="19" x2="19" y2="13"/>
      <line x1="16" y1="16" x2="20" y2="20"/>
      <line x1="19" y1="21" x2="21" y2="19"/>
    </svg>
  ),
  infiltracion: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  rescate: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  investigacion: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
}

export const CHAR_SURNAMES = {
  'harry-potter': 'Potter', 'gollum': 'el Maldito', 'john-wick': 'Wick',
  'walter-white': 'White', 'darth-vader': 'Vader', 'tony-stark': 'Stark',
  'sherlock': 'Holmes', 'jack-sparrow': 'Sparrow', 'gandalf': 'el Gris',
  'goku': 'Son', 'ip-man': 'Ip', 'el-profesor': 'Alves', 'capitan-flint': 'Flint',
  'jax-teller': 'Teller', 'nathan-algren': 'Algren', 'lara-croft': 'Croft',
  'spider-man': 'Parker', 'terminator': 'T-800', 'ragnar-lothbrok': 'Lothbrok',
  'leonidas': 'de Esparta', 'tommy-shelby': 'Shelby', 'eleven': 'Hopper',
  'geralt': 'de Rivia', 'jon-snow': 'Snow', 'kurt-sloane': 'Sloane',
  'venom': 'Brock', 'furiosa': 'Furiosa', 'alice': 'Abernathy',
  'katniss': 'Everdeen', 'bryan-mills': 'Mills', 'frank-martin': 'Martin',
  'rocky-balboa': 'Balboa', 'tony-ja': 'Ja', 'james-bond': 'Bond',
  'la-novia': 'Dragonfly', 'tyler-durden': 'Durden', 'hannibal': 'Lecter',
  'norman-bates': 'Bates', 'wolverine': 'Logan', 'john-mcclane': 'McClane',
  'iko-uwais': 'Rama', 'superman': 'Kent', 'ethan-hunt': 'Hunt',
  'joker': 'el Joker', 'aragorn': 'Elessar', 'batman': 'Wayne',
  'kratos': 'el Fantasma', 'nascimento': 'Nascimento', 'bruce-lee': 'Lee',
  'aquiles': 'de Ftía', 'the-punisher': 'Castle', 'william-wallace': 'Wallace',
  'casey-ryback': 'Ryback', 'harley-quinn': 'Quinn', 'tyrion-lannister': 'Lannister'
}

export const VIDA_NAMES = {
  combate:       'Resistencia',
  infiltracion:  'Cobertura',
  rescate:       'Margen',
  investigacion: 'Control'
}

export const INITIAL_VIDA   = { easy: 5, normal: 4, hard: 3 }
export const INITIAL_SIGILO = { easy: 4, normal: 3, hard: 2 }
