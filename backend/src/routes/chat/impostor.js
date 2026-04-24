import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { mistral } from '../../utils/mistral.js'

const router = Router()

const IMPOSTOR_POOL = [
  'john-wick', 'walter-white', 'gandalf', 'sherlock', 'darth-vader',
  'tony-stark', 'jack-sparrow', 'hannibal', 'tommy-shelby', 'jon-snow',
  'geralt', 'el-profesor', 'ragnar-lothbrok', 'tyler-durden', 'wolverine',
  'james-bond', 'lara-croft', 'venom', 'la-novia', 'katniss',
]

const DIFFICULTY_INSTRUCTIONS = {
  easy: 'Tu imitación falla en varios puntos obvios: tu vocabulario real se cuela en frases que ese personaje jamás usaría, tu tono revela claramente tu verdadera forma de ser, y tu manera de ver el tema delata tu filosofía de vida real, no la de él/ella.',
  medium: 'Tu imitación es bastante convincente, pero se filtran 2 señales de tu verdadera identidad: en algún momento tu ritmo o actitud cambia sutilmente, o usás una expresión que pertenece más a tu universo que al de ese personaje.',
  hard: 'Tu imitación es casi perfecta. Solo se cuela un detalle muy sutil: quizás tu postura ante el tema revela levemente tus valores reales en lugar de los suyos, o una frase suena ligeramente distinta a como ese personaje hablaría.',
}

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

async function generateResponse(systemPrompt, topic, maxTokens = 100) {
  const completion = await mistral.chat.completions.create({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: topic },
    ],
    stream: false,
    max_tokens: maxTokens,
  })
  return completion.choices[0].message.content.trim()
}

router.post('/impostor/round', async (req, res) => {
  const { topic, difficulty = 'medium' } = req.body
  if (!topic) return res.status(400).json({ error: 'Se requiere un tema.' })

  const validIds = IMPOSTOR_POOL.filter(id => characters[id])
  if (validIds.length < 5) return res.status(500).json({ error: 'Pool de personajes insuficiente.' })

  const picked = pickRandom(validIds, 5)
  const slotIds = picked.slice(0, 4)
  const actorId = picked[4]
  const impostorSlot = Math.floor(Math.random() * 4)
  const targetId = slotIds[impostorSlot]

  const actor = characters[actorId]
  const target = characters[targetId]

  const difficultyRule = DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.medium

  const impostorSystemPrompt = `${target.systemPrompt}

--- CONTEXTO INTERNO (nunca lo mencionés en tu respuesta) ---
Sos ${actorId} intentando imitar a ${targetId}. Conocés bien a este personaje y hacés un esfuerzo real por sonar como él/ella, pero tu verdadera naturaleza se filtra inevitablemente.
${difficultyRule}
Respondé en español. Máximo 2 oraciones cortas. No aclarés que estás imitando a nadie. No rompas la ilusión.`

  try {
    const responsePromises = slotIds.map((charId, index) => {
      const char = characters[charId]
      if (!char) return Promise.resolve('...')

      if (index === impostorSlot) {
        return generateResponse(impostorSystemPrompt, topic)
      }

      const systemPrompt = `${char.systemPrompt}

Respondé al siguiente tema con 1-2 oraciones cortas. Sé completamente fiel a tu voz, tu historia y tus valores — usá tu forma de hablar característica, tus expresiones propias, tu filosofía de vida. No rompas personaje bajo ningún concepto. Respondé en español.`
      return generateResponse(systemPrompt, topic)
    })

    const responses = await Promise.all(responsePromises)

    res.json({
      responses: slotIds.map((charId, i) => ({
        characterId: charId,
        response: responses[i],
        isImpostor: i === impostorSlot,
      })),
      impostorSlot,
      actorId,
    })
  } catch (error) {
    console.error('Error /impostor/round:', error.message)
    res.status(500).json({ error: 'Error al generar la ronda.' })
  }
})

export default router
