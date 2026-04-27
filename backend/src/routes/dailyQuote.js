import { Router } from 'express'
import { mistral } from '../utils/mistral.js'
import { characters } from '../data/characters.js'

const router = Router()

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

    const completion = await mistral.chat.completions.create({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: character.systemPrompt },
        { role: 'user', content: 'Di una frase tuya memorable. Solo la frase, sin comillas ni explicaciones. Máximo 2 oraciones cortas. En español.' }
      ],
      max_tokens: 100,
      temperature: 0.9,
    })

    const quote = completion.choices[0]?.message?.content?.trim() || ''
    const data = { quote, characterId }
    cache = { date: today, data }
    res.json(data)
  } catch {
    res.status(500).json({ error: 'No se pudo generar la frase del día' })
  }
})

export default router
