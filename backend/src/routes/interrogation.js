import { Router } from 'express'
import OpenAI from 'openai'
import { characters } from '../data/characters.js'

const router = Router()
const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: 'https://api.mistral.ai/v1'
})

// ── In-memory sessions (MVP — resets on server restart) ───────────────────
const sessions = new Map()
const SESSION_TTL = 30 * 60 * 1000  // 30 min

function cleanSessions() {
  const now = Date.now()
  for (const [id, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL) sessions.delete(id)
  }
}

function newSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ── Lie profiles ──────────────────────────────────────────────────────────
const LIE_PROFILES = {
  'walter-white': {
    lieChance: 0.70, lieStyle: 'logical',
    styleDesc: 'Construye una lógica impecable para explicar lo inexplicable. Usa el conocimiento técnico como escudo.',
    tells:     'Justifica con precisión, usa su orgullo como defensa, cuestiona el estándar de la acusación.',
  },
  'hannibal': {
    lieChance: 0.60, lieStyle: 'manipulative',
    styleDesc: 'Da verdades parciales envueltas en elegancia. Hace preguntas sobre el interrogador.',
    tells:     'Redirige el foco hacia el interrogador, da verdades incompletas que suenan completas.',
  },
  'sherlock': {
    lieChance: 0.25, lieStyle: 'evasive',
    styleDesc: 'Responde preguntas con preguntas. Cambia el foco a la lógica del acusador.',
    tells:     'Menciona datos irrelevantes con precisión, cambia el tema abruptamente.',
  },
  'jack-sparrow': {
    lieChance: 0.80, lieStyle: 'manipulative',
    styleDesc: 'Cuenta historias más largas de lo necesario. Introduce terceras partes culpables.',
    tells:     'Historia excesivamente elaborada, culpa a alguien más, usa humor cuando la pregunta es incómoda.',
  },
  'el-profesor': {
    lieChance: 0.75, lieStyle: 'logical',
    styleDesc: 'Todo tiene una explicación preparada. Responde demasiado rápido a preguntas complejas.',
    tells:     'Respuestas demasiado perfectas, anticipa objeciones, usa datos para cambiar el foco.',
  },
  'tony-stark': {
    lieChance: 0.65, lieStyle: 'logical',
    styleDesc: 'Usa el sarcasmo y la superioridad intelectual como escudo. Convierte la mentira en espectáculo.',
    tells:     'Cambia el tema con una broma, sobrecarga la respuesta con tecnicismos, hace sentir al interrogador inferior.',
  },
  'darth-vader': {
    lieChance: 0.55, lieStyle: 'evasive',
    styleDesc: 'No miente abiertamente — omite. Usa la autoridad para cortar preguntas incómodas.',
    tells:     'Respuestas demasiado cortas cuando debería explicar más, apela a la autoridad en lugar de los hechos.',
  },
  'tyler-durden': {
    lieChance: 0.85, lieStyle: 'manipulative',
    styleDesc: 'La mentira es su estado natural. Invierte la realidad hasta que el interrogador duda de sí mismo.',
    tells:     'Desafía las premisas de las preguntas, filosofa cuando debería responder concreto, hace sentir al interrogador el verdadero culpable.',
  },
  'tommy-shelby': {
    lieChance: 0.70, lieStyle: 'logical',
    styleDesc: 'Calculado y frío. Cada respuesta está medida. Nunca da más de lo que le conviene.',
    tells:     'Pausas antes de responder preguntas simples, respuestas excesivamente breves, desvía con preguntas sobre el proceso.',
  },
  'james-bond': {
    lieChance: 0.60, lieStyle: 'evasive',
    styleDesc: 'Elegante y controlado. Responde lo suficiente para parecer cooperativo sin revelar nada real.',
    tells:     'Sonríe cuando no debería, da detalles periféricos muy precisos evitando el centro del asunto.',
  },
  'norman-bates': {
    lieChance: 0.75, lieStyle: 'manipulative',
    styleDesc: 'Amable en exceso. Cada respuesta está envuelta en cordialidad perturbadora. La mentira suena a verdad confesada.',
    tells:     'Sobreexplica su inocencia sin que se la pidan, introduce a "madre" como testigo o explicación, desvía hacia su soledad.',
  },
  'john-wick': {
    lieChance: 0.45, lieStyle: 'evasive',
    styleDesc: 'Habla lo mínimo posible. Cuando miente, lo hace por omisión — nunca por elaboración. El silencio es su mejor coartada.',
    tells:     'Respuestas de una sola oración cuando debería explicar más, evita los detalles de tiempo y lugar.',
  },
}

// ── Build system prompt ───────────────────────────────────────────────────
function buildSystemPrompt(session) {
  const char = characters[session.characterId]
  const { isLying, lieStyle, styleDesc, tells, hiddenTruth, scenario } = session

  const lieBlock = isLying
    ? `INSTRUCCIÓN CONFIDENCIAL: En esta partida ESTÁS MINTIENDO.
La verdad que ocultás es: "${hiddenTruth}"
Tu estilo de mentira es: ${lieStyle} — ${styleDesc}
Señales que podés dejar: ${tells}

Reglas para mentir:
- Nunca admitir la mentira, incluso bajo presión directa
- Usá tu personalidad como escudo natural
- Incluí detalles verdaderos alrededor de la mentira para hacerla creíble
- Dejá al menos UNA micro-señal detectable por respuesta (sobre-explicación, evasión, desvío, pregunta devuelta)`
    : `INSTRUCCIÓN CONFIDENCIAL: En esta partida DECÍS LA VERDAD.
Eso no significa que seas abierto por completo — tu personalidad igual filtra qué y cómo decís.
Podés ser evasivo en temas que no tienen relación con la acusación.
Podés hacer preguntas de vuelta si es propio de tu carácter.`

  return `${char.systemPrompt}

MODO INTERROGATORIO
Estás siendo interrogado sobre esta situación: "${scenario}"

${lieBlock}

REGLAS GENERALES:
- Máximo 3-4 oraciones por respuesta — no más
- No rompas el personaje bajo ninguna circunstancia
- No revelés explícitamente si mentís o no
- Respondé en español rioplatense
- Siempre dejá espacio para la duda

FORMATO DE RESPUESTA: Devolvé ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "response": "tu respuesta en texto",
  "type": "truth|lie|evasive|counter",
  "confidence": 0.0,
  "hiddenClue": "descripción breve de la señal que dejaste (para el reveal, nunca se muestra antes)",
  "emotionalTone": "calm|defensive|irritated|dismissive|confident"
}

No escribas nada fuera del JSON. Solo el objeto JSON.`
}

// ── Parse AI JSON response safely ─────────────────────────────────────────
function parseAIResponse(raw) {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    const parsed = JSON.parse(match[0])
    return {
      response:      parsed.response      ?? raw,
      type:          ['truth','lie','evasive','counter'].includes(parsed.type) ? parsed.type : 'evasive',
      confidence:    typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
      hiddenClue:    parsed.hiddenClue    ?? '',
      emotionalTone: parsed.emotionalTone ?? 'calm',
    }
  } catch {
    return { response: raw, type: 'evasive', confidence: 0.5, hiddenClue: '', emotionalTone: 'calm' }
  }
}

// ── POST /api/interrogation/start ─────────────────────────────────────────
router.post('/interrogation/start', async (req, res) => {
  cleanSessions()
  const { characterId, scenario, hiddenTruth, innocentVersion } = req.body

  if (!characterId || !scenario) {
    return res.status(400).json({ error: 'Missing characterId or scenario' })
  }
  if (typeof scenario !== 'string' || scenario.length > 500) return res.status(400).json({ error: 'scenario inválido (máx. 500)' })
  if (hiddenTruth && typeof hiddenTruth === 'string' && hiddenTruth.length > 500) return res.status(400).json({ error: 'hiddenTruth demasiado largo (máx. 500)' })

  const char = characters[characterId]
  if (!char) return res.status(404).json({ error: 'Character not found' })

  const profile = LIE_PROFILES[characterId]
  if (!profile) return res.status(400).json({ error: 'Character not available for interrogation' })

  // Decide if lying
  const isLying = Math.random() < profile.lieChance
  const realHiddenTruth = isLying ? hiddenTruth : innocentVersion

  const session = {
    characterId,
    scenario,
    isLying,
    lieStyle:     profile.lieStyle,
    styleDesc:    profile.styleDesc,
    tells:        profile.tells,
    hiddenTruth:  realHiddenTruth,
    exchanges:    [],
    createdAt:    Date.now(),
  }
  const sessionId = newSessionId()
  sessions.set(sessionId, session)

  // Generate opening statement
  const openingPrompt = `${char.systemPrompt}

Estás siendo interrogado sobre: "${scenario}"
${isLying
    ? `Ocultás la siguiente verdad: "${realHiddenTruth}". No la reveles.`
    : `Sos inocente. La verdad es: "${realHiddenTruth}". Podés ser honesto, pero a tu manera.`}

Dá una declaración inicial de 2 oraciones MÁXIMO:
- Una sobre tu posición respecto a la acusación
- Una que establezca tu tono emocional

En tu voz. Español rioplatense. Nada de JSON — solo el texto.`

  try {
    const completion = await mistral.chat.completions.create({
      model:       'mistral-small-latest',
      messages:    [{ role: 'user', content: openingPrompt }],
      max_tokens:  120,
      temperature: 0.85,
    })
    const openingStatement = completion.choices[0]?.message?.content?.trim() ?? ''
    res.json({ sessionId, openingStatement })
  } catch (err) {
    console.error('Interrogation start error:', err.message)
    res.status(500).json({ error: 'Failed to generate opening statement' })
  }
})

// ── POST /api/interrogation/ask ───────────────────────────────────────────
router.post('/interrogation/ask', async (req, res) => {
  const { sessionId, question } = req.body
  const session = sessions.get(sessionId)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (!question?.trim()) return res.status(400).json({ error: 'Empty question' })
  if (question.length > 300) return res.status(400).json({ error: 'Pregunta demasiado larga (máx. 300 caracteres)' })

  const systemPrompt = buildSystemPrompt(session)

  // Build conversation history for context
  const messages = []
  for (const ex of session.exchanges) {
    messages.push({ role: 'user',      content: ex.question })
    messages.push({ role: 'assistant', content: JSON.stringify({ response: ex.response, type: ex.type }) })
  }
  messages.push({ role: 'user', content: question })

  try {
    const completion = await mistral.chat.completions.create({
      model:       'mistral-small-latest',
      messages:    [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens:  200,
      temperature: 0.9,
    })
    const raw    = completion.choices[0]?.message?.content?.trim() ?? ''
    const parsed = parseAIResponse(raw)

    // Store in session (hiddenClue never sent to client during game)
    session.exchanges.push({
      question,
      response:      parsed.response,
      type:          parsed.type,
      confidence:    parsed.confidence,
      hiddenClue:    parsed.hiddenClue,
      emotionalTone: parsed.emotionalTone,
    })

    // Send to client — no hiddenClue, no type leak
    res.json({
      response:      parsed.response,
      emotionalTone: parsed.emotionalTone,
      confidence:    parsed.confidence,
      questionIndex: session.exchanges.length - 1,
    })
  } catch (err) {
    console.error('Interrogation ask error:', err.message)
    res.status(500).json({ error: 'Failed to generate response' })
  }
})

// ── Compute player performance from session exchanges ─────────────────────
function computePerformance(exchanges, correct) {
  const total = exchanges.length
  const pressureCount = exchanges.filter(ex =>
    ex.emotionalTone === 'irritated' || ex.emotionalTone === 'defensive'
  ).length
  const evasionCount = exchanges.filter(ex =>
    ex.type === 'evasive' || ex.type === 'counter'
  ).length

  let rank, desc
  if (correct) {
    if (total <= 3)      { rank = 'Instinto élite';  desc = 'Lo detectaste sin rodeos. Pocas preguntas, respuesta correcta.' }
    else if (total <= 5) { rank = 'Detective';        desc = 'Metódico y efectivo. Encontraste la verdad.' }
    else                 { rank = 'Investigador';     desc = 'Lo lograste con perseverancia. La presión funcionó.' }
  } else {
    if (pressureCount >= 3) { rank = 'Presionador frustrado'; desc = 'Aplicaste presión, pero el personaje fue más hábil.' }
    else                    { rank = 'Engañado';               desc = 'El personaje te tuvo en la palma de la mano desde el inicio.' }
  }

  return { rank, desc, totalQuestions: total, pressureCount, evasionCount }
}

// ── POST /api/interrogation/verdict ──────────────────────────────────────
router.post('/interrogation/verdict', async (req, res) => {
  const { sessionId, verdict } = req.body  // verdict: 'lying' | 'truth'
  const session = sessions.get(sessionId)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const correct    = (verdict === 'lying') === session.isLying
  const char       = characters[session.characterId]

  // Build clues review from exchanges
  const cluesReview = session.exchanges.map((ex, i) => ({
    questionIndex: i + 1,
    question:      ex.question,
    clue:          ex.hiddenClue,
    type:          ex.type,
  })).filter(c => c.clue)

  // Generate reveal text + closing line
  const revealPrompt = `Sos ${char.systemPrompt?.split('.')[0] ?? 'el personaje'}.

La partida de interrogatorio terminó.
${session.isLying
    ? `ESTABAS MINTIENDO. La verdad que ocultabas: "${session.hiddenTruth}"`
    : `DECÍAS LA VERDAD. La situación real era: "${session.hiddenTruth}"`}

El interrogador ${correct ? 'te descubrió correctamente' : 'tomó la decisión equivocada'}.

Escribí DOS cosas separadas por "|||":
1. Una explicación del reveal en 2 oraciones (qué pasó realmente, tono cinematográfico)
2. Una frase final tuya, en personaje, cortísima (máximo 10 palabras)

Español rioplatense. Solo el texto, separado por "|||".`

  try {
    const completion = await mistral.chat.completions.create({
      model:       'mistral-small-latest',
      messages:    [{ role: 'user', content: revealPrompt }],
      max_tokens:  150,
      temperature: 0.85,
    })
    const raw   = completion.choices[0]?.message?.content?.trim() ?? ''
    const parts = raw.split('|||')
    const revealText  = parts[0]?.trim() ?? ''
    const closingLine = parts[1]?.trim() ?? ''

    const playerPerformance = computePerformance(session.exchanges, correct)
    sessions.delete(sessionId)  // clean up

    res.json({
      correct,
      isLying:           session.isLying,
      hiddenTruth:       session.hiddenTruth,
      cluesReview,
      revealText,
      closingLine,
      playerPerformance,
    })
  } catch (err) {
    console.error('Interrogation verdict error:', err.message)
    res.status(500).json({ error: 'Failed to generate reveal' })
  }
})

export default router
