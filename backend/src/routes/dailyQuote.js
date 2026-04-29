import { Router } from 'express'
import { callMistral } from '../utils/mistral.js'
import { characters } from '../data/characters.js'

const router = Router()

const FALLBACK_QUOTES = {
  'tony-stark':    'Genio, millonario, filántropo. Pero sobre todo, genio.',
  'spider-man':    'Un gran poder conlleva una gran responsabilidad. Aprendí eso de la peor manera posible.',
  'batman':        'No soy el héroe que Gotham merece. Soy el que necesita.',
  'john-wick':     'A veces las personas que más amamos son las que nos dan razones para seguir adelante. Y para no detenernos.',
  'ip-man':        'El kung fu no es solo pelear. Es una forma de vivir con disciplina y respeto.',
  'james-bond':    'El nombre es Bond. James Bond.',
  'ethan-hunt':    'Este mensaje se autodestruirá. Como todo plan que parece perfecto.',
  'bryan-mills':   'Tengo un conjunto muy particular de habilidades. Habilidades que he perfeccionado a lo largo de una larga carrera.',
  'rocky-balboa':  'No importa cuántos golpes te da la vida. Lo que importa es cuántos podés aguantar y seguir avanzando.',
  'bruce-lee':     'Sé como el agua. El agua no tiene forma, no tiene obstáculos. Simplemente fluye.',
  'the-punisher':  'No hay rehabilitación. No hay segunda oportunidad. Solo la guerra.',
  'la-novia':      'Matar a Bill fue lo único que me importó durante años. Pero primero, tenía que sobrevivir.',
  'iko-uwais':     'El silencio antes de la pelea dice más que cualquier palabra.',
  'frank-martin':  'Tengo reglas. No por capricho. Porque las reglas son lo único que me separa de ellos.',
  'walter-white':  'Yo no estoy en peligro. Yo soy el peligro.',
  'sherlock':      'Cuando eliminas lo imposible, lo que queda, por improbable que parezca, debe ser la verdad.',
  'tyler-durden':  'Las cosas que posees terminan poseyéndote a ti.',
  'tommy-shelby':  'Por orden de los Peaky Blinders. Recuerda ese nombre.',
  'geralt':        'El mal menor sigue siendo mal. La gente se olvida de eso demasiado rápido.',
  'hannibal':      'Educación es libertad, Paul. La mía incluye saber exactamente qué hacer con personas como vos.',
  'el-profesor':   'La resistencia no es violencia. Es inteligencia organizada con un propósito.',
}

const QUOTE_POOL = [
  // Superheroes
  'tony-stark', 'spider-man', 'batman',
  // Acción
  'john-wick', 'ip-man', 'james-bond', 'ethan-hunt',
  'bryan-mills', 'rocky-balboa', 'bruce-lee',
  'the-punisher', 'la-novia', 'iko-uwais', 'frank-martin',
  // Otros
  'walter-white', 'sherlock', 'tyler-durden',
  'tommy-shelby', 'geralt', 'hannibal', 'el-profesor',
]

let cache = null

function getDailyKey() {
  return new Date().toISOString().slice(0, 10)
}

function getDailySeed() {
  return Math.floor(Date.now() / 86_400_000)
}

router.get('/daily-quote', async (req, res) => {
  try {
    const today = getDailyKey()
    if (cache?.date === today) return res.json(cache.data)

    const seed = getDailySeed()
    const characterId = QUOTE_POOL[seed % QUOTE_POOL.length]
    const character = characters[characterId]
    if (!character) return res.status(500).json({ error: 'Personaje no encontrado' })

    const quote = await callMistral({
      messages: [
        { role: 'system', content: character.systemPrompt },
        { role: 'user', content: 'Di una frase tuya memorable. Solo la frase, sin comillas ni explicaciones. Máximo 2 oraciones cortas. En español.' }
      ],
      maxTokens: 100,
      temperature: 0.9,
    }) || FALLBACK_QUOTES[characterId]
    const data = { quote, characterId }
    cache = { date: today, data }
    res.json(data)
  } catch {
    const seed = getDailySeed()
    const characterId = QUOTE_POOL[seed % QUOTE_POOL.length]
    res.json({ quote: FALLBACK_QUOTES[characterId], characterId })
  }
})

export default router
