import { Router } from 'express'
import OpenAI from 'openai'
import { characters } from '../data/characters.js'
import {
  BASE_PROMPT,
  BATTLE_MODE_SUFFIX,
  CONFESIONARIO_MODE_SUFFIX,
  GUESS_CLUES_SYSTEM_PROMPT,
  SWIPE_CARDS_SUFFIX,
  ESTEOESE_QUESTIONS_SUFFIX,
  ESTEOESE_RESULT_SUFFIX,
  FIGHT_ROUND_SYSTEM_PROMPT,
  buildBattleVerdictSystemPrompt,
  buildDuoRoleAPrompt,
  buildDuoRoleBPrompt,
  buildDuoRoleA2Prompt
} from '../data/prompts.js'
import { buildSceneSystemPrompt, extractCharDesc } from '../utils/ultimaCenaSceneBuilder.js'

const router = Router()

const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: 'https://api.mistral.ai/v1'
})

async function streamMistral(res, systemPrompt, messages, maxTokens = 512) {
  const cleanMessages = messages.map(({ role, content }) => ({ role, content }))
  const stream = await mistral.chat.completions.create({
    model: 'mistral-small-latest',
    messages: [{ role: 'system', content: systemPrompt }, ...cleanMessages],
    stream: true,
    max_tokens: maxTokens
  })
  for await (const chunk of stream) {
    if (res.writableEnded) break
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`)
  }
  if (!res.writableEnded) {
    res.write('data: [DONE]\n\n')
    res.end()
  }
}

function initSseResponse(res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
}

function sendSseError(res, message) {
  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
}

const MAX_HISTORY = 10 // últimos 10 mensajes (~5 turnos de conversación)

const DUO_TOKEN_MAP = { A: 150, B: 150, A2: 60 }
const ULTIMA_CENA_TOKEN_MAP = { respond: 100, remate: 55 }

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

function buildChatSystemPrompt(character, body) {
  const { duoMode, battleMode, confesionarioMode, ultimaCenaMode, affinityLevel = 0 } = body

  if (duoMode?.role) {
    return buildDuoSystemPrompt(character.systemPrompt, duoMode)
  }

  if (ultimaCenaMode?.role) {
    return buildUltimaCenaPrompt(character.systemPrompt, ultimaCenaMode)
  }

  if (battleMode) {
    return `${character.systemPrompt}${BATTLE_MODE_SUFFIX}`
  }

  if (confesionarioMode) {
    return `${character.systemPrompt}${CONFESIONARIO_MODE_SUFFIX}`
  }

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

router.post('/chat', async (req, res) => {
  const { characterId, messages: rawMessages } = req.body
  const messages = rawMessages?.slice(-MAX_HISTORY) ?? []

  const character = characters[characterId]
  if (!character) {
    return res.status(404).json({ error: 'Personaje no encontrado' })
  }

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

router.post('/guess/clues', async (req, res) => {
  const { characterId } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  const systemPrompt = GUESS_CLUES_SYSTEM_PROMPT

  try {
    const completion = await mistral.chat.completions.create({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Personaje: ${characterId}\nContexto: ${character.systemPrompt.substring(0, 400)}` }
      ],
      stream: false,
      max_tokens: 400
    })
    const text = completion.choices[0].message.content
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON')
    const clues = JSON.parse(jsonMatch[0])
    res.json({ clues: clues.slice(0, 4) })
  } catch (error) {
    console.error('Error /guess/clues:', error.message)
    res.status(500).json({ error: 'Error al generar pistas' })
  }
})

router.post('/guess/feedback', async (req, res) => {
  const { characterId, correct, guessedName } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  const systemPrompt = `${character.systemPrompt}

Estás en un juego de adivinanzas. Alguien acaba de intentar adivinar quién sos.
Respondé con UNA sola frase corta y en tu voz característica.
${correct
    ? 'El jugador acertó. Reaccioná positivamente pero en tu estilo — puede ser sorpresa, orgullo, humor o sarcasmo según tu personalidad.'
    : `El jugador se equivocó, eligió "${guessedName || 'otro personaje'}". Dales una pequeña pista indirecta o comentá el error con tu voz — sin revelar tu nombre.`
}
Máximo 1 oración. Sin presentación, sin contexto. Solo la reacción.
Respondé en español.`

  try {
    const completion = await mistral.chat.completions.create({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: correct ? '¡Correcto!' : `Eligieron a "${guessedName || 'otro personaje'}".` }
      ],
      stream: false,
      max_tokens: 80
    })
    const message = completion.choices[0].message.content.trim()
    res.json({ message })
  } catch (error) {
    console.error('Error /guess/feedback:', error.message)
    res.status(500).json({ error: 'Error al generar feedback' })
  }
})

const STORY_MAX_RECENT = 4

function buildStorySystemPrompt(characterPrompt, isFinal, turnNumber) {
  const turnInstruction = isFinal
    ? `DESENLACE FINAL. Cerrá la historia con 4 párrafos poderosos y coherentes con todas las decisiones tomadas hasta acá. El final debe fluir naturalmente de las elecciones del usuario — no aparecer de la nada. Puede ser un triunfo costoso, una derrota con dignidad, una redención, o una tragedia inevitable. Lo importante: que sea emotivo, cinematográfico y que deje huella. Usá tu voz característica hasta el último párrafo. Al final, en una línea sola: [FIN]`
    : `Turno ${turnNumber} de 5. Escribí 3 párrafos narrativos intensos y vívidos (unas 150 palabras). La narrativa debe tener tensión real y consecuencias palpables.
Luego, en una línea sola: ---
Después, exactamente 3 opciones DRÁSTICAS y con peso moral — no opciones neutras, cada una debe implicar un costo o un riesgo real:
[A] opción A
[B] opción B
[C] opción C`

  return `${characterPrompt}

MODO HISTORIA INTERACTIVA:
Narrás una historia alternativa en primera persona, con tu voz y personalidad característica. El tono es intenso, dramático y cinematográfico en todo momento.

${turnInstruction}`
}

function buildStoryMessages(scenarioPrompt, history, isFinal) {
  const recentHistory = history.slice(-STORY_MAX_RECENT)
  const messages = []

  if (history.length > STORY_MAX_RECENT) {
    const older = history.slice(0, history.length - STORY_MAX_RECENT)
    const recap = older.map((e, i) => `Turno ${i + 1}: ${e.choice}`).join(' | ')
    messages.push({
      role: 'user',
      content: `Escenario inicial: ${scenarioPrompt}. Decisiones previas: ${recap}.`
    })
  } else if (recentHistory.length === 0) {
    // Turno 1: el loop no corre, incluir el recordatorio de formato directamente
    messages.push({
      role: 'user',
      content: isFinal
        ? `Iniciá y cerrá la historia: ${scenarioPrompt}. Terminá con [FIN].`
        : `Iniciá la historia: ${scenarioPrompt}\n\nRecordá: terminá con ---\n[A] opción\n[B] opción\n[C] opción`
    })
  } else {
    messages.push({ role: 'user', content: `Iniciá la historia: ${scenarioPrompt}` })
  }

  for (let i = 0; i < recentHistory.length; i++) {
    const entry = recentHistory[i]
    messages.push({ role: 'assistant', content: entry.narrative })
    const isLast = i === recentHistory.length - 1
    messages.push({
      role: 'user',
      content: isLast && isFinal
        ? `Elegí: ${entry.choice}. Escribí el desenlace final: épico, dramático y coherente con todas las decisiones tomadas. Puede ser feliz o trágico, pero que golpee emocionalmente. Terminá con [FIN].`
        : isLast
          ? `Elegí: ${entry.choice}. Continuá — 3 párrafos vívidos, luego en una línea sola el separador ---, después exactamente [A] opción, [B] opción, [C] opción.`
          : `Elegí: ${entry.choice}. Continuá.`
    })
  }

  return messages
}

router.post('/story', async (req, res) => {
  const { characterId, scenarioPrompt, history = [] } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const isFinal = history.length >= 5
  const storySystemPrompt = buildStorySystemPrompt(character.systemPrompt, isFinal, history.length + 1)
  const messages = buildStoryMessages(scenarioPrompt, history, isFinal)

  try {
    await streamMistral(res, storySystemPrompt, messages, isFinal ? 1000 : 900)
  } catch (error) {
    console.error('Error Mistral /story:', error.message)
    sendSseError(res, 'Error al generar historia')
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

function buildMissionMessages({ history, recentHistory, alias, isFinal, difficulty, MAX_RECENT }) {
  const messages = []
  const optionReminder = difficulty === 'easy'
    ? 'OPCIONES: [A] agresiva [B] sigilosa [C] táctica'
    : 'OPCIONES: [A] [B] [C] — copy neutro, solo la acción'

  if (recentHistory.length === 0) {
    messages.push({
      role: 'user',
      content: isFinal
        ? `Cerrá la misión para ${alias}. Terminá con [FIN].`
        : history.length === 0
          ? `Iniciá la misión para ${alias}. Formato: TITULO: / ESCENA: / ${optionReminder} / EFECTOS: con sigilo y desc.`
          : `Continuá la misión para ${alias}. Formato: ESCENA: / ${optionReminder} / EFECTOS: con sigilo y desc.`
    })
    return messages
  }

  if (history.length > MAX_RECENT) {
    const older = history.slice(0, history.length - MAX_RECENT)
    const recap = older.map((e, i) => `T${i + 1}: ${e.choice}`).join(' | ')
    messages.push({ role: 'user', content: `Decisiones previas: ${recap}.` })
  } else {
    messages.push({ role: 'user', content: `Iniciá la misión para ${alias}.` })
  }

  for (let i = 0; i < recentHistory.length; i++) {
    const entry = recentHistory[i]
    messages.push({ role: 'assistant', content: entry.narrative })
    const isLast = i === recentHistory.length - 1
    messages.push({
      role: 'user',
      content: isLast && isFinal
        ? `${alias} eligió: ${entry.choice}. Desenlace final. Terminá con [FIN].`
        : isLast
          ? `${alias} eligió: ${entry.choice}. Continuá — ESCENA: / ${optionReminder} / EFECTOS: con sigilo y desc.`
          : `${alias} eligió: ${entry.choice}. Continuá.`
    })
  }

  return messages
}

router.post('/mission', async (req, res) => {
  const { characterId, history = [], playerName, difficulty = 'normal', missionType = 'combate', stats = {}, finalResult = null, isCampaign = false } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const isFinal = history.length >= 5 || !!finalResult
  const MAX_RECENT = 4
  const recentHistory = history.slice(-MAX_RECENT)

  const alias = playerName || 'el agente'
  const vida = stats.vida ?? 4
  const riesgo = stats.riesgo ?? 0
  const sigilo = stats.sigilo ?? 3
  const estadoNarrativo =
    vida >= 4 ? 'opera con plena capacidad' :
    vida === 3 ? 'muestra desgaste pero sigue en pie' :
    vida === 2 ? 'está herido, cada movimiento le cuesta' :
    'está al límite, un error más y todo termina'
  const statsLine = `Estado del agente: ${estadoNarrativo}. Riesgo ${riesgo}/5 | Sigilo ${sigilo}/5${riesgo >= 4 ? ' — ⚠ RIESGO CRÍTICO: más enemigos y complicaciones' : ''}${sigilo >= 4 ? ' — sigilo alto: opciones sigilosas tienen ventaja' : sigilo <= 1 ? ' — sigilo bajo: probabilidad alta de ser detectado' : ''}`

  const difficultyInstructions = {
    easy: `Dificultad FÁCIL: Una opción siempre es más segura y reconocible que las demás. Usá etiquetas de tipo (agresiva/sigilosa/táctica). La opción táctica o sigilosa debe tener el menor coste total. Efectos suaves: rango -1 a +1.`,
    normal: `Dificultad NORMAL: Trade-offs reales entre las 3 opciones. Sin etiquetas de tipo. Ninguna opción mejora las 3 barras a la vez — siempre hay algo que se pierde. Copy neutro: describí la ACCIÓN, no si es riesgosa o segura.`,
    hard: `Dificultad DIFÍCIL — REGLAS OBLIGATORIAS:
1. Las 3 opciones deben tener tono idéntico — solo describí QUÉ hace el jugador, nunca CÓMO de riesgoso es
2. Palabras PROHIBIDAS en el texto de las opciones: "con cuidado", "sigilosamente", "calculado", "preciso", "ventaja", "seguro", "aprovechá", "estratégico", "prudente", "directo", "rápidamente"
3. Una opción debe parecer sin coste inmediato pero tener consecuencia encadenada en la siguiente escena — marcala en desc como "ENCADENADO: [efecto diferido]"
4. La ESCENA debe omitir al menos 1 dato que el jugador necesitaría para decidir con certeza (¿cuántos enemigos? ¿está la salida abierta? ¿lo vieron?)
5. Efectos asimétricos y severos: rango -3 a +2. Ninguna opción puede tener los 3 valores neutrales o positivos.`
  }

  const optionFormatByDifficulty = {
    easy: `[A] agresiva — [acción directa/riesgosa, máx 8 palabras]
[B] sigilosa — [acción encubierta/discreta, máx 8 palabras]
[C] táctica — [acción calculada/lateral, máx 8 palabras]`,
    normal: `[A] [acción, máx 8 palabras — sin señales de riesgo o seguridad]
[B] [acción, máx 8 palabras — sin señales de riesgo o seguridad]
[C] [acción, máx 8 palabras — sin señales de riesgo o seguridad]`,
    hard: `[A] [acción, máx 7 palabras — solo qué hace el jugador, sin adverbios ni señales]
[B] [acción, máx 7 palabras — solo qué hace el jugador, sin adverbios ni señales]
[C] [acción, máx 7 palabras — solo qué hace el jugador, sin adverbios ni señales]`
  }

  const efectosNoteByDifficulty = {
    easy:   `(rango -1 a +1 — la opción B o C debe tener el menor coste total)`,
    normal: `(rango -2 a +2 — ninguna opción puede mejorar las 3 barras a la vez — siempre hay trade-off)`,
    hard:   `(rango -3 a +2 — efectos severos y asimétricos — una opción DEBE usar "ENCADENADO:" en desc — ninguna opción puede tener vida+0 riesgo+0 sigilo+0 o todos positivos)`
  }

  const missionTypeMap = {
    combate:       'Tipo COMBATE: decisiones de timing físico, posicionamiento, fuerza vs. astucia.',
    infiltracion:  'Tipo INFILTRACIÓN: decisiones de sigilo, engaño, improvisación bajo presión.',
    rescate:       'Tipo RESCATE: decisiones con peso moral, alguien en peligro, el tiempo corre.',
    investigacion: 'Tipo INVESTIGACIÓN: decisiones de deducción, interpretación, revelación de pistas.'
  }

  const loseConditionsNote = difficulty === 'hard'
    ? `\nDERROTA EN DIFÍCIL: vida=0 O riesgo=5 O sigilo=0. ${riesgo >= 4 ? '⚠ RIESGO EN 4 — próximo incremento termina la misión.' : ''} ${sigilo <= 1 ? '⚠ SIGILO EN 1 — próximo decremento termina la misión.' : ''}`
    : difficulty === 'normal'
      ? `\nDERROTA ADICIONAL EN NORMAL: riesgo=5 también termina la misión. ${riesgo >= 4 ? '⚠ RIESGO EN 4.' : ''}`
      : ''

  const missionSystemPrompt = `${character.systemPrompt}

${isCampaign
    ? `MODO CAMPAÑA — ENCARNACIÓN:
El jugador ENCARNA a ${alias}. Narrá en segunda persona estricta como si el jugador FUERA ${alias}:
- Usá sus habilidades únicas, su forma de moverse, pensar y actuar característica
- Las opciones deben reflejar lo que ESTE personaje haría — no un agente genérico
- Su personalidad, miedos, obsesiones y estilo deben impregnar cada escena y cada decisión
- Tratalo como el protagonista que ES, no como un agente externo
- Usá segunda persona: "Entrás", "Ves", "Sentís", "Tus manos..."`
    : `MODO MISIÓN — NARRADOR EN SEGUNDA PERSONA:
El jugador se llama ${alias}. Usá siempre segunda persona ("Entrás", "Ves", "Tenés que").`}
${difficultyInstructions[difficulty] || difficultyInstructions.normal}
${missionTypeMap[missionType] || missionTypeMap.combate}
${statsLine}${loseConditionsNote}

${isFinal
    ? `DESENLACE FINAL.
${finalResult === 'lose'
      ? 'El agente FALLÓ la misión. Tono de derrota. Puede incluir su muerte o captura. Hacelo oscuro y definitivo.'
      : 'El agente COMPLETÓ la misión con ÉXITO. El protagonista VIVE y logra el objetivo. Tono victorioso, frío, contundente. NUNCA insinúes muerte ni derrota del protagonista.'}
2-3 oraciones épicas en segunda persona. Terminá con [FIN].`
    : `FORMATO OBLIGATORIO — no salirse de esta estructura:

${history.length === 0 ? 'TITULO:\n[frase épica de 3-5 palabras]\n\n' : ''}ESCENA:
[máx 2 líneas, segunda persona, ir directo al conflicto, alta tensión${difficulty === 'hard' ? ' — omití un dato clave que el jugador necesita para decidir con certeza' : ''}]

OPCIONES:
${optionFormatByDifficulty[difficulty] || optionFormatByDifficulty.normal}

EFECTOS:
A: vida+0 riesgo+1 sigilo-1 desc:[resultado breve en 1 línea]
B: vida+0 riesgo-1 sigilo+2 desc:[resultado breve en 1 línea]
C: vida-1 riesgo+0 sigilo+0 desc:[resultado breve en 1 línea]

${efectosNoteByDifficulty[difficulty] || efectosNoteByDifficulty.normal}`
  }`

  const messages = buildMissionMessages({ history, recentHistory, alias, isFinal, difficulty, MAX_RECENT })

  try {
    await streamMistral(res, missionSystemPrompt, messages, isFinal ? 450 : 480)
  } catch (error) {
    console.error('Error Mistral /mission:', error.message)
    sendSseError(res, 'Error al generar misión')
  }
})

router.post('/fight/round', async (req, res) => {
  const { playerCharId, enemyCharId, playerHP, enemyHP, round, totalRounds, history = [], action } = req.body
  const playerChar = characters[playerCharId]
  const enemyChar = characters[enemyCharId]
  if (!playerChar || !enemyChar) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const isFinal = round >= totalRounds || playerHP <= 0 || enemyHP <= 0

  const historyText = history.length > 0
    ? history.slice(-3).map((h, i) => `R${i + 1}: ${h.action}`).join(' | ')
    : ''

  const systemPrompt = FIGHT_ROUND_SYSTEM_PROMPT

  const userMessage = isFinal
    ? `COMBATE FINAL: ${playerChar.name} (${playerHP} HP) vs ${enemyChar.name} (${enemyHP} HP).
${historyText ? `Historial: ${historyText}.` : ''}
${action ? `Último movimiento: ${action}.` : ''}
Ganador: ${playerHP > enemyHP ? playerChar.name : enemyHP > playerHP ? enemyChar.name : 'empate'}.
Narrá el remate en 2-3 oraciones épicas. Terminá con [FIN].`
    : `RONDA ${round}/${totalRounds}: ${playerChar.name} (${playerHP} HP) vs ${enemyChar.name} (${enemyHP} HP).
${historyText ? `Historial: ${historyText}.` : ''}
${action ? `${playerChar.name} ejecuta: ${action}.` : `Inicio del combate.`}

Narrá en EXACTAMENTE 2 oraciones cortas usando habilidades reales de cada personaje.
Luego en una línea exacta: DAÑO_JUGADOR: [0-30]|DAÑO_RIVAL: [0-30]
(DAÑO_JUGADOR = daño que recibe ${playerChar.name}, DAÑO_RIVAL = daño que recibe ${enemyChar.name})
Luego:
---
Exactamente 3 movimientos para ${playerChar.name}:
[A] movimiento corto
[B] movimiento corto
[C] movimiento corto`

  try {
    await streamMistral(res, systemPrompt, [{ role: 'user', content: userMessage }], isFinal ? 300 : 250)
  } catch (error) {
    console.error('Error Mistral /fight/round:', error.message)
    sendSseError(res, 'Error al generar combate')
  }
})

router.post('/swipe/cards', async (req, res) => {
  const { characterId } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  const systemPrompt = `${character.systemPrompt}${SWIPE_CARDS_SUFFIX}`

  try {
    const completion = await mistral.chat.completions.create({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generá las 10 afirmaciones.' }
      ],
      stream: false,
      max_tokens: 900
    })
    const text = completion.choices[0].message.content
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON')
    const cards = JSON.parse(jsonMatch[0])
    res.json({ cards: cards.slice(0, 10) })
  } catch (error) {
    console.error('Error /swipe/cards:', error.message)
    res.status(500).json({ error: 'Error al generar las afirmaciones' })
  }
})

router.post('/swipe/result', async (req, res) => {
  const { characterId, score, total } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const systemPrompt = `${character.systemPrompt}

El jugador acaba de responder un quiz de verdad/mentira sobre tu universo. Sacó ${score} de ${total} preguntas correctas.
Reaccioná en tu voz característica: 2-3 oraciones. Si sacó mucho (8-10): impresionado o retador. Si sacó poco (0-4): burlón o decepcionado. Si sacó regular (5-7): neutro pero con tu sarcasmo habitual.
Respondé en español, sin saludos, directo.`

  try {
    await streamMistral(res, systemPrompt, [{
      role: 'user', content: `Saqué ${score}/${total}. ¿Qué opinás?`
    }], 200)
  } catch (error) {
    console.error('Error Mistral /swipe/result:', error.message)
    sendSseError(res, 'Error al generar resultado')
  }
})

router.post('/esteoese/questions', async (req, res) => {
  const { characterId } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  const systemPrompt = `${character.systemPrompt}${ESTEOESE_QUESTIONS_SUFFIX}`

  try {
    const completion = await mistral.chat.completions.create({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generá los 8 pares.' }
      ],
      stream: false,
      max_tokens: 500
    })
    const text = completion.choices[0].message.content
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON')
    const questions = JSON.parse(jsonMatch[0])
    res.json({ questions: questions.slice(0, 8) })
  } catch (error) {
    console.error('Error /esteoese/questions:', error.message)
    res.status(500).json({ error: 'Error al generar preguntas' })
  }
})

router.post('/esteoese/result', async (req, res) => {
  const { characterId, answers } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const choicesList = answers.map((a, i) => `${i + 1}. ${a.question} → "${a.chosen}"`).join('\n')

  const systemPrompt = `${character.systemPrompt}${ESTEOESE_RESULT_SUFFIX}`

  try {
    await streamMistral(res, systemPrompt, [{
      role: 'user',
      content: `Estas fueron sus elecciones:\n${choicesList}\n\n¿Qué tan parecido es a vos?`
    }], 280)
  } catch (error) {
    console.error('Error Mistral /esteoese/result:', error.message)
    sendSseError(res, 'Error al generar resultado')
  }
})

// ─── Speed Round ─────────────────────────────────────────────────────────────

router.post('/speed', async (req, res) => {
  const { characterId, messages: rawMessages = [] } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const systemPrompt = `${character.systemPrompt}

MODO SPEED ROUND:
El usuario está en una sesión de preguntas rápidas de 60 segundos contigo.
REGLA ABSOLUTA: Respondé en MÁXIMO 2 oraciones cortas. NUNCA más.
Sé directo, contundente y en tu voz más característica.
Sin introducción, sin contexto. Solo la respuesta.
Respondé siempre en español.`

  const messages = rawMessages.slice(-6)
  try {
    await streamMistral(res, systemPrompt, messages, 80)
  } catch (error) {
    console.error('Error Mistral /speed:', error.message)
    sendSseError(res, 'Error al contactar la IA')
  }
})

// ─── Entrenamiento ───────────────────────────────────────────────────────────

router.post('/entrenamiento', async (req, res) => {
  const { characterId, messages: rawMessages = [], turn = 1, isFinal = false } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const especialidad = character.especialidad || 'tu habilidad más característica'

  const systemPrompt = `${character.systemPrompt}

MODO ENTRENAMIENTO:
Estás entrenando al usuario en: ${especialidad}.
El entrenamiento tiene 5 fases progresivas.

${isFinal
    ? `FASE FINAL (Turno ${turn}/5):
Emitís tu juicio final sobre el progreso del usuario. Serio, honesto, en tu voz.
¿Aprendió algo real? ¿Tiene lo que hace falta? Sin condescendencia fácil.
2-4 oraciones. Terminá con [FIN].`
    : turn === 1
      ? `FASE 1 — EVALUACIÓN INICIAL:
Antes de empezar, evaluá al usuario. ¿Por qué quiere aprender? ¿Tiene lo que hace falta?
Hacele UNA pregunta directa que revele algo de su carácter o motivación.
Respondé en 2-3 oraciones en tu voz más característica.`
      : `FASE ${turn}/5 — EJERCICIO PROGRESIVO:
Proponé un ejercicio o desafío concreto relacionado con ${especialidad}.
Debe ser más exigente que el anterior. Pedile que lo ejecute o reflexione sobre algo específico.
Respondé en 2-4 oraciones. Si el usuario respondió al ejercicio anterior, evalualo brevemente antes de avanzar.`
  }

Respondé siempre en español.`

  const messages = rawMessages.slice(-8)
  try {
    await streamMistral(res, systemPrompt, messages, isFinal ? 300 : 200)
  } catch (error) {
    console.error('Error Mistral /entrenamiento:', error.message)
    sendSseError(res, 'Error al contactar la IA')
  }
})

router.get('/characters', (req, res) => {
  const list = Object.values(characters).map(({ id, systemPrompt: _ , ...rest }) => ({ id, ...rest }))
  res.json(list)
})

router.post('/dilema', async (req, res) => {
  const { characterId, dilemmaQuestion, choiceLabel, choiceKey, choiceHistory, affinityLevel = 0 } = req.body

  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const historyLines = (choiceHistory ?? [])
    .slice(-4)
    .map((c, i) => `${i + 1}. Ante "${c.dilemmaQuestion}", eligió: "${c.choiceLabel}"`)
    .join('\n')

  const historyContext = historyLines
    ? `\nDECISIONES PREVIAS DEL USUARIO EN ESTA SESIÓN:\n${historyLines}`
    : ''

  const secretChoiceNote = choiceKey === 'C'
    ? '\nEl usuario eligió una opción secreta que muy pocos ven. Reaccioná con reconocimiento genuino — no exagerado — como si algo en él te hubiera sorprendido.'
    : ''

  const systemPrompt = `${character.systemPrompt}

MODO DILEMAS MORALES — REACCIÓN:

El usuario acaba de enfrentar este dilema: "${dilemmaQuestion}"
Eligió: "${choiceLabel}"
${historyContext}${secretChoiceNote}

INSTRUCCIONES PARA TU REACCIÓN:
- Respondé en 3 a 4 oraciones cortas. No más.
- Reaccioná desde TU propia moral y personalidad — no como árbitro imparcial ni guía moral.
- No digas cuál era la decisión correcta. No moralices directamente.
- Si hay decisiones previas en el historial que sean dramáticamente relevantes, referenciá UNA de forma implícita — nunca hagas un resumen del historial completo.
- Puede validarte, sorprenderte, decepcionarte o perturbarte — según tu carácter específico.
- Tono: adulto, intenso, sin concesiones sentimentales fáciles. Sin frases terapéuticas.
- SIEMPRE respondé en español, sin importar el idioma del system prompt original.`

  try {
    await streamMistral(res, systemPrompt, [{ role: 'user', content: 'Reaccioná a mi elección.' }], 200)
  } catch (error) {
    console.error('Error Mistral /dilema:', error.message)
    sendSseError(res, 'Error al contactar la IA')
  }
})

// ─── Última Cena — helpers ────────────────────────────────────────────────────
// buildSceneSystemPrompt y extractCharDesc importadas de ../utils/ultimaCenaSceneBuilder.js
const SCENE_MAX_TOKENS = 380

// ─── Última Cena — escena completa ───────────────────────────────────────────
router.post('/ultima-cena/scene', async (req, res) => {
  const { chars: charList, trigger, tema, sceneFlow, dialogueRules, isEvento } = req.body

  if (!charList || charList.length < 3 || charList.length > 4) {
    return res.status(400).json({ error: 'Se necesitan entre 3 y 4 personajes' })
  }

  if (!trigger || typeof trigger !== 'string' || !trigger.trim()) {
    return res.status(400).json({ error: 'El trigger no puede estar vacío' })
  }

  // Resolve each character: use backend DB if available, fall back to name-only
  // Always attach `name` from the frontend since backend chars don't have that field
  const resolvedChars = charList.map(({ id, name }) => {
    const found = characters[id]
    if (found) return { ...found, name: name || id }
    return { name: name || id, systemPrompt: `Sos ${name || id}, un personaje icónico. Respondé siempre en español.` }
  })

  initSseResponse(res)

  const temaLine = tema ? `\nCONTEXTO DE LA REUNIÓN: ${tema}` : ''
  const triggerType = isEvento ? 'EVENTO QUE IRRUMPE EN LA MESA' : 'SITUACIÓN'
  const dialogueLine = dialogueRules ? `\nTONO Y ESTILO ESPECÍFICO: ${dialogueRules}` : ''

  const systemPrompt = buildSceneSystemPrompt({ resolvedChars, temaLine, dialogueLine, triggerType })

  try {
    await streamMistral(res, systemPrompt, [{ role: 'user', content: trigger }], SCENE_MAX_TOKENS)
  } catch (error) {
    console.error('Error /ultima-cena/scene:', error.message)
    sendSseError(res, 'Error al generar la escena')
  }
})

export default router
