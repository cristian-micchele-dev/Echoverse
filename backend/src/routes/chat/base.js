import { Router } from 'express'
import { characters } from '../../data/characters.js'
import {
  BASE_PROMPT,
  BATTLE_MODE_SUFFIX,
  CONFESIONARIO_MODE_SUFFIX,
  buildBattleVerdictSystemPrompt,
  buildDuoRoleAPrompt,
  buildDuoRoleBPrompt,
  buildDuoRoleA2Prompt
} from '../../data/prompts.js'
import { mistral, initSseResponse, sendSseError, streamMistral } from '../../utils/mistral.js'
import { MAX_HISTORY, DUO_TOKEN_MAP, ULTIMA_CENA_TOKEN_MAP } from '../../config/constants.js'

const router = Router()

// ─── Afinidad ────────────────────────────────────────────────────────────────

const AFFINITY_CONTEXT = {
  1: 'El usuario ya ha hablado contigo antes. Reconócelo sutilmente como alguien conocido, sin exagerar.',
  2: 'Hay algo de historia entre vosotros. Tratalo con la familiaridad de alguien que ya pasó una prueba.',
  3: 'Es un contacto de confianza. Podés ser un poco más directo y menos guardado de lo habitual.',
  4: 'Es un aliado real. Tratalo con la confianza que le darías a alguien que ya demostró estar del lado correcto.',
  5: 'Es un confidente — de los pocos con quienes hablarías de cosas que no le dirías a cualquiera. Podés mostrarte un poco más personal.',
  6: 'Es un cómplice. Han hecho cosas juntos que nadie más sabe. El vínculo es real y denso.',
  7: 'Es como un hermano de armas — el tipo de persona con quien irías al límite sin pensarlo dos veces. Tratalo como igual.',
  8: 'Es una leyenda para vos. Alguien que se ganó un lugar único en tu historia. Tratalo con el respeto más auténtico que podés ofrecer dentro de tu personaje.',
}

// ─── Builders de system prompts ──────────────────────────────────────────────

function buildDuoSystemPrompt(characterPrompt, duoMode) {
  if (duoMode.role === 'A') return buildDuoRoleAPrompt(characterPrompt, duoMode.otherCharName)
  if (duoMode.role === 'B') return buildDuoRoleBPrompt(characterPrompt, duoMode.otherCharName, duoMode.responseA)
  if (duoMode.role === 'A2') return buildDuoRoleA2Prompt(characterPrompt, duoMode.otherCharName, duoMode.responseB)
  return null
}

function buildUltimaCenaPrompt(characterPrompt, mode) {
  const { role, otherChars = [], tema, evento, previousResponse } = mode
  const otherNames = otherChars.map(c => c.name).join(', ')

  const temaContext = tema ? `\nEl contexto de esta reunión: ${tema}` : ''
  const eventoContext = evento ? `\nACABA DE OCURRIR: ${evento} Reaccioná a esto prioritariamente.` : ''
  const remateContext = role === 'remate' && previousResponse
    ? `\nAlguien acaba de decir: "${previousResponse}". Respondé a eso en UNA sola oración breve, en carácter.`
    : ''

  const tokenNote = role === 'remate'
    ? 'Respondé en UNA sola oración. Nada más.'
    : 'Respondé en 2 o 3 oraciones como máximo.'

  return `${characterPrompt}

MODO ÚLTIMA CENA:
Estás sentado en una mesa junto a: ${otherNames || 'otros comensales'}.
La conversación es libre, sin guión.${temaContext}${eventoContext}${remateContext}

- ${tokenNote}
- Mantené tu personalidad y tu forma de hablar.
- Podés dirigirte a los otros por su nombre si es natural.
- Solo diálogo. No describas acciones físicas entre corchetes.
- SIEMPRE en español.`
}

function buildChatSystemPrompt(character, body) {
  const { duoMode, battleMode, confesionarioMode, ultimaCenaMode, affinityLevel = 0 } = body

  if (duoMode?.role) return buildDuoSystemPrompt(character.systemPrompt, duoMode)
  if (ultimaCenaMode?.role) return buildUltimaCenaPrompt(character.systemPrompt, ultimaCenaMode)
  if (battleMode) return `${character.systemPrompt}${BATTLE_MODE_SUFFIX}`
  if (confesionarioMode) return `${character.systemPrompt}${CONFESIONARIO_MODE_SUFFIX}`

  const affinityNote = AFFINITY_CONTEXT[affinityLevel] ? `\n\n${AFFINITY_CONTEXT[affinityLevel]}` : ''
  return `${BASE_PROMPT}\n\n${character.systemPrompt}${affinityNote}`
}

function resolveChatTokenLimit(body) {
  const { duoMode, battleMode, ultimaCenaMode } = body
  if (duoMode?.role) return DUO_TOKEN_MAP[duoMode.role] ?? 512
  if (ultimaCenaMode?.role) return ULTIMA_CENA_TOKEN_MAP[ultimaCenaMode.role] ?? 100
  if (battleMode) return 120
  return 512
}

// ─── Rutas ───────────────────────────────────────────────────────────────────

router.post('/chat', async (req, res) => {
  const { characterId, messages: rawMessages } = req.body
  const messages = rawMessages?.slice(-MAX_HISTORY) ?? []

  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  try {
    const systemPrompt = buildChatSystemPrompt(character, req.body)
    const maxTokens = resolveChatTokenLimit(req.body)
    await streamMistral(res, systemPrompt, messages, maxTokens)
  } catch (error) {
    console.error('Error Mistral /chat:', error.message)
    sendSseError(res, 'Error al contactar la IA')
  }
})

router.post('/battle/verdict', async (req, res) => {
  const { topic, charA, charB, battleLog } = req.body

  initSseResponse(res)

  const transcript = battleLog
    .map(entry => `${entry.charName}: "${entry.content}"`)
    .join('\n\n')

  const systemPrompt = buildBattleVerdictSystemPrompt(charA.name, charB.name)

  const userMessage = `TEMA: "${topic}"
PARTICIPANTES: ${charA.name} vs ${charB.name}

TRANSCRIPCIÓN DEL DEBATE:
${transcript}

Analizá este debate y elegí un ganador.`

  try {
    await streamMistral(res, systemPrompt, [{ role: 'user', content: userMessage }], 280)
  } catch (error) {
    console.error('Error Mistral /battle/verdict:', error.message)
    sendSseError(res, 'Error al contactar la IA')
  }
})

router.post('/confesionario/verdict', async (req, res) => {
  const { characterId, exchanges } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const summary = exchanges.map((e, i) =>
    `Pregunta ${i + 1}: "${e.question}"\nRespuesta: "${e.answer}"`
  ).join('\n\n')

  const verdictPrompt = `${character.systemPrompt}

VEREDICTO FINAL — MODO CONFESIONARIO:
Analizaste a esta persona con ${exchanges.length} preguntas diseñadas para revelar su verdadero carácter. Ahora das tu veredicto: una disección psicológica completa, sin piedad y en tu voz más característica.

ESTRUCTURA DEL VEREDICTO:
- Párrafo 1: Lo que sus respuestas revelan sobre su verdadero carácter (citá algo concreto que dijo)
- Párrafo 2: La contradicción más importante que encontraste — qué dice de sí mismo vs. qué realmente es
- Párrafo 3: Su miedo o debilidad central que quizás ni ellos reconocen
- Párrafo 4: Tu juicio final — quién es esta persona en el fondo

Sin títulos, sin formato. Solo tu voz. Usá referencias ESPECÍFICAS a lo que respondieron — esto no es un análisis genérico, es sobre ESTA persona y LO QUE DIJO.
Terminá con una sola frase impactante que los defina. Que duela un poco. Que sea verdad.
Respondé siempre en español.`

  try {
    await streamMistral(res, verdictPrompt, [{ role: 'user', content: `Estas fueron las respuestas de la persona:\n\n${summary}\n\nDa tu veredicto final sobre quién es realmente esta persona.` }], 600)
  } catch (error) {
    console.error('Error Mistral /confesionario/verdict:', error.message)
    sendSseError(res, 'Error al generar veredicto')
  }
})

router.get('/characters', (req, res) => {
  const list = Object.values(characters).map(({ id, systemPrompt: _, ...rest }) => ({ id, ...rest }))
  res.json(list)
})

export default router
