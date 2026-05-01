export const HERO_CHAR_IDS = ['john-wick', 'darth-vader', 'sherlock', 'walter-white', 'el-profesor', 'gandalf']

export const CAST = [
  { id: 'john-wick',     quote: 'No confía en nadie. Ni en vos.',              tag: 'Silencio letal' },
  { id: 'sherlock',      quote: 'Ya te está leyendo. Desde que entraste.',      tag: 'Mente privilegiada' },
  { id: 'walter-white',  quote: 'Siempre sabe más de lo que dice.',             tag: 'Doble fondo' },
  { id: 'darth-vader',   quote: 'El miedo es tu primer paso hacia él.',         tag: 'Poder absoluto' },
  { id: 'el-profesor',   quote: 'Cada movida ya estaba calculada.',             tag: 'Estrategia fría' },
  { id: 'gandalf',       quote: 'Llega exactamente cuando debe llegar.',        tag: 'Sabiduría antigua' },
  { id: 'tony-stark',    quote: 'Genio, millonario, sin filtros. En ese orden.',tag: 'Sin filtros' },
  { id: 'jack-sparrow',  quote: 'Tiene un plan. Probablemente falla.',          tag: 'Caos controlado' },
]

export const PROTAGONIST_MODES = [
  {
    id: 'mission',
    label: 'Modo Misión',
    eyebrow: 'HISTORIA INTERACTIVA',
    desc: 'Una misión real. Cada decisión tiene peso. Una equivocación puede costarte todo.',
    cta: 'Ver misiones',
    route: '/mission',
    accent: '#D4576B',
    tag: '4 MISIONES ACTIVAS',
    characterId: 'el-profesor',
  },
  {
    id: 'dilema',
    label: 'Dilemas',
    eyebrow: 'FILOSOFÍA INTERACTIVA',
    desc: 'Sin salida limpia. Solo la elección que podés defender ante él.',
    cta: 'Enfrentar el dilema',
    route: '/dilema',
    accent: '#C9954A',
    tag: 'SIN RESPUESTA CORRECTA',
    characterId: 'gandalf',
  },
  {
    id: 'interrogation',
    label: 'Interrogatorio',
    eyebrow: 'DETECCIÓN DE MENTIRAS',
    desc: 'El personaje puede estar mintiendo. Detectá las contradicciones. Decidí si le creés.',
    cta: 'Iniciar interrogatorio',
    route: '/interrogation',
    accent: '#6D4AFF',
    tag: 'IA REACTIVA',
    characterId: 'walter-white',
  },
]

export const SECONDARY_MODES = [
  {
    num: '01',
    label: 'Chat con Personaje',
    eyebrow: 'Conversación IA',
    desc: 'Sin guión. Sin respuestas preparadas. Solo ellos, tal cual son, respondiendo en tiempo real.',
    route: '/chat',
    characterId: 'sherlock',
    color: '#70a8e0',
    duration: 'Sin límite',
    difficulty: 'Fácil',
    badge: '💬 Popular',
  },
  {
    num: '02',
    label: 'Adivina el Personaje',
    eyebrow: 'Trivia con puntaje',
    desc: 'Pistas de a una. Cuanto antes lo adivinás, más puntos conseguís. Cada pista baja tu score.',
    route: '/guess',
    characterId: 'gollum',
    color: '#7aab6e',
    duration: '~3 min',
    difficulty: 'Medio',
    badge: '🧩 Trivia',
  },
  {
    num: '03',
    label: 'Swipe',
    eyebrow: 'Respuesta rápida',
    desc: 'Verdad o mentira. Tenés segundos para decidir. ¿Cuánto los conocés realmente?',
    route: '/swipe',
    characterId: 'tony-stark',
    color: '#e87040',
    duration: '~2 min',
    difficulty: 'Rápido',
    badge: '⚡ Rápido',
  },
]

export const CONVERSATION_PREVIEWS = [
  {
    characterId: 'walter-white',
    user: '¿Te arrepentís de algo?',
    reply: 'El arrepentimiento es para la gente débil. Pero... a veces, a las 3 de la mañana, me pregunto quién sería si hubiera aceptado el dinero de Grey Matter hace veinte años. Nada de esto hubiera pasado. Eso no es arrepentimiento. Es curiosidad.',
  },
  {
    characterId: 'sherlock',
    user: '¿Cómo sabés en qué estoy pensando?',
    reply: 'No lo sé. Lo deduzco. Tu mirada fue hacia la izquierda antes de hablar — recuerdo episódico, no lógico. Tus manos están cruzadas pero los pulgares apuntan hacia arriba. Defensivo pero seguro. Pensás que tengo razón, y eso te incomoda.',
  },
  {
    characterId: 'john-wick',
    user: '¿Por qué seguís en esto?',
    reply: 'Porque me sacaron lo único que me quedaba. Después de eso no hay razón para parar. Solo el siguiente paso.',
  },
]

export const PILLARS = [
  { num: '01', title: 'IA que no rompe el personaje', desc: 'Responden con su voz, su lógica y sus contradicciones. Nunca salen del rol.' },
  { num: '02', title: 'Decisiones con consecuencias', desc: 'No hay respuestas correctas automáticas. Lo que elegís cambia el rumbo de la historia.' },
  { num: '03', title: 'Universos que reconocés',      desc: 'Personajes que ya conocés, en situaciones que nunca esperabas.' },
  { num: '04', title: 'Rejugable por diseño',         desc: 'Cada sesión es única. La IA nunca repite la misma historia dos veces.' },
]

export const BENEFITS = [
  { icon: 'fire',   title: 'Racha diaria',             desc: 'Acumulá días activos y mantené tu racha sin perder progreso.' },
  { icon: 'cloud',  title: 'Progreso en la nube',      desc: 'Tu historial guardado y accesible desde cualquier dispositivo.' },
  { icon: 'puzzle', title: 'Desafío diario',           desc: 'Un nuevo reto cada día, exclusivo para usuarios registrados.' },
  { icon: 'person', title: 'Personajes personalizados', desc: 'Creá y compartís tus propios personajes con la comunidad.' },
]
