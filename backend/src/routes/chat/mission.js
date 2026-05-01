import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { streamMistral, withSseStream, callMistral } from '../../utils/mistral.js'
import { MISSION_MAX_RECENT } from '../../config/constants.js'

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt'

const router = Router()

const DIFFICULTY_INSTRUCTIONS = {
  easy: `Dificultad FÁCIL: Una opción siempre es más segura y reconocible que las demás. Usá etiquetas de tipo (agresiva/sigilosa/táctica). La opción táctica o sigilosa debe tener el menor coste total. Efectos suaves: rango -1 a +1.`,
  normal: `Dificultad NORMAL: Trade-offs reales entre las 3 opciones. Sin etiquetas de tipo. Ninguna opción mejora las 3 barras a la vez — siempre hay algo que se pierde. Copy neutro: describí la ACCIÓN, no si es riesgosa o segura.`,
  hard: `Dificultad DIFÍCIL — REGLAS OBLIGATORIAS:
1. Las 3 opciones deben tener tono idéntico — solo describí QUÉ hace el jugador, nunca CÓMO de riesgoso es
2. Palabras PROHIBIDAS en el texto de las opciones: "con cuidado", "sigilosamente", "calculado", "preciso", "ventaja", "seguro", "aprovechá", "estratégico", "prudente", "directo", "rápidamente"
3. Una opción debe parecer sin coste inmediato pero tener consecuencia encadenada en la siguiente escena — marcala en desc como "ENCADENADO: [efecto diferido]"
4. La ESCENA debe omitir al menos 1 dato que el jugador necesitaría para decidir con certeza (¿cuántos enemigos? ¿está la salida abierta? ¿lo vieron?)
5. Efectos asimétricos y severos: rango -3 a +2. Ninguna opción puede tener los 3 valores neutrales o positivos.`
}

const OPTION_FORMAT = {
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

const EFECTOS_NOTE = {
  easy:   `(rango -1 a +1 — la opción B o C debe tener el menor coste total)`,
  normal: `(rango -2 a +2 — ninguna opción puede mejorar las 3 barras a la vez — siempre hay trade-off)`,
  hard:   `(rango -3 a +2 — efectos severos y asimétricos — una opción DEBE usar "ENCADENADO:" en desc — ninguna opción puede tener vida+0 riesgo+0 sigilo+0 o todos positivos)`
}

const MISSION_TYPE_MAP = {
  combate:       'Tipo COMBATE: decisiones de timing físico, posicionamiento, fuerza vs. astucia.',
  infiltracion:  'Tipo INFILTRACIÓN: decisiones de sigilo, engaño, improvisación bajo presión.',
  rescate:       'Tipo RESCATE: decisiones con peso moral, alguien en peligro, el tiempo corre.',
  investigacion: 'Tipo INVESTIGACIÓN: decisiones de deducción, interpretación, revelación de pistas.'
}

function buildMissionMessages({ history, recentHistory, alias, isFinal, difficulty }) {
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

  if (history.length > MISSION_MAX_RECENT) {
    const older = history.slice(0, history.length - MISSION_MAX_RECENT)
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
          ? `${alias} eligió: ${entry.choice}. Continuá — escena nueva y distinta a la anterior — ESCENA: / ${optionReminder} / EFECTOS: con sigilo y desc.`
          : `${alias} eligió: ${entry.choice}. Continuá.`
    })
  }

  return messages
}

router.post('/mission', async (req, res) => {
  const { characterId, history = [], playerName, difficulty = 'normal', missionType = 'combate', stats = {}, finalResult = null, isCampaign = false } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  const isFinal = history.length >= 5 || !!finalResult
  const recentHistory = history.slice(-MISSION_MAX_RECENT)

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
${DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.normal}
${MISSION_TYPE_MAP[missionType] || MISSION_TYPE_MAP.combate}
${statsLine}${loseConditionsNote}

${isFinal
    ? `DESENLACE FINAL.
${finalResult === 'lose'
      ? 'El agente FALLÓ la misión. Tono de derrota. Puede incluir su muerte o captura. Hacelo oscuro y definitivo.'
      : 'El agente COMPLETÓ la misión con ÉXITO. El protagonista VIVE y logra el objetivo. Tono victorioso, frío, contundente. NUNCA insinúes muerte ni derrota del protagonista.'}
2-3 oraciones épicas en segunda persona. Terminá con [FIN].`
    : `FORMATO OBLIGATORIO — no salirse de esta estructura:

${history.length === 0 ? 'TITULO:\n[frase épica de 3-5 palabras]\n\n' : ''}ESCENA:
[máx 2 líneas — NUEVA situación: locación, obstáculo o giro distinto a la escena anterior — nunca repetir lo que ya ocurrió — segunda persona — ir directo al conflicto${difficulty === 'hard' ? ' — omití un dato clave que el jugador necesita para decidir con certeza' : ''}]

OPCIONES:
${OPTION_FORMAT[difficulty] || OPTION_FORMAT.normal}

EFECTOS:
A: vida+0 riesgo+1 sigilo-1 desc:[resultado breve en 1 línea]
B: vida+0 riesgo-1 sigilo+2 desc:[resultado breve en 1 línea]
C: vida-1 riesgo+0 sigilo+0 desc:[resultado breve en 1 línea]

${EFECTOS_NOTE[difficulty] || EFECTOS_NOTE.normal}`
  }`

  const messages = buildMissionMessages({ history, recentHistory, alias, isFinal, difficulty })

  await withSseStream(res, () => streamMistral(res, missionSystemPrompt, messages, isFinal ? 480 : 600), {
    logPrefix: 'Error Mistral /mission',
    errorMessage: 'Error al generar misión',
  })
})

// ─── POST /api/mission/image-prompt ─────────────────────────────────────────
// Genera UN prompt visual de portada cinematográfica al inicio de la misión.
// No por turno — una sola imagen que acompaña toda la misión.

router.post('/mission/image-prompt', async (req, res) => {
  const { characterId, difficulty, missionType } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  const systemPrompt = `You are an expert image-generation prompt engineer. Create a single cinematic cover image prompt for a mission.

Rules:
- Max 25 words
- Cinematic, dramatic, dark atmosphere
- Include the character, the environment and the mood
- No text, no UI elements, no watermark
- English only

Respond with ONLY the prompt. No quotes, no explanation.`

  const userContent = `Character: ${character.name}
Difficulty: ${difficulty || 'normal'}
Mission type: ${missionType || 'combate'}
Character vibe: ${character.systemPrompt.slice(0, 200)}`

  try {
    const imagePrompt = await callMistral({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      maxTokens: 120,
      temperature: 0.8,
    })

    const clean = imagePrompt.trim().replace(/^["']|["']$/g, '')
    const truncated = clean.length > 180 ? clean.slice(0, 180) + '...' : clean
    res.json({ imagePrompt: truncated })
  } catch (error) {
    console.error('Error /mission/image-prompt:', error.message)
    const fallback = `cinematic scene, ${character.name}, ${missionType || 'action'} mission, ${difficulty || 'normal'} difficulty, dark atmosphere, dramatic lighting, movie still`
    res.json({ imagePrompt: fallback })
  }
})

// ─── POST /api/mission/scene-image-prompt ───────────────────────────────────
// Recibe la narrativa de una escena y genera un prompt de imagen en inglés
// que capture el contexto visual completo (lugar, acción, atmósfera).

router.post('/mission/scene-image-prompt', async (req, res) => {
  const { narrative, characterId, title, difficulty, missionType } = req.body
  const character = characters[characterId]

  if (!narrative) return res.status(400).json({ error: 'Missing narrative' })

  const systemPrompt = `You are an expert image-generation prompt engineer. Translate the Spanish mission scene into a vivid cinematic image prompt in ENGLISH.

Rules:
- Max 25 words. Be concise but visual.
- Include: location, main character, action, atmosphere.
- Match the mission type and difficulty in tone (hard = darker, tense).
- No text, no UI, no watermark, no quotes.
- Respond with ONLY the prompt. No explanation.`

  const missionContext = [
    title ? `Mission: "${title}"` : '',
    missionType ? `Type: ${missionType}` : '',
    difficulty ? `Difficulty: ${difficulty}` : '',
  ].filter(Boolean).join(' | ')

  const userContent = `Character: ${character ? character.name : 'agent'}
${missionContext}
Scene: ${narrative.slice(0, 500)}`

  try {
    const imagePrompt = await callMistral({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      maxTokens: 180,
      temperature: 0.6,
    })

    const clean = imagePrompt.trim().replace(/^["']|["']$/g, '')
    const truncated = clean.length > 200 ? clean.slice(0, 200) + '...' : clean
    res.json({ imagePrompt: truncated })
  } catch (error) {
    console.error('Error /mission/scene-image-prompt:', error.message)
    const fallback = `cinematic scene, ${character ? character.name : 'agent'}, dark atmosphere, dramatic lighting, movie still`
    res.json({ imagePrompt: fallback })
  }
})

// ─── GET /api/mission/image-proxy ───────────────────────────────────────────
// Proxy para evitar bloqueos CORS / 403 desde el navegador hacia Pollinations.
// El frontend pide la imagen acá y el backend la retransmite como stream.

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function fetchPollinations(url, retries = 2) {
  const attempt = async (left, delayMs) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      clearTimeout(timeout)
      return response
    } catch (err) {
      clearTimeout(timeout)
      if (left > 0) {
        await sleep(delayMs)
        return attempt(left - 1, delayMs * 2)
      }
      throw err
    }
  }
  return attempt(retries, 2000)
}

router.get('/mission/image-proxy', async (req, res) => {
  const { prompt, width = 1024, height = 576, seed, nologo = 'true' } = req.query
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed || Math.floor(Math.random() * 10000)}&nologo=${nologo}&model=flux-schnell&enhance=false`

  try {
    let response
    for (let attempt = 0; attempt <= 2; attempt++) {
      response = await fetchPollinations(url)
      if (response.status !== 429) break
      if (attempt < 2) {
        const wait = (parseInt(response.headers.get('retry-after') || '8', 10) + attempt * 4) * 1000
        console.warn(`[image-proxy] 429 de Pollinations, reintentando en ${wait / 1000}s (intento ${attempt + 1}/2)`)
        await sleep(wait)
      }
    }
    if (!response.ok) {
      console.error(`[image-proxy] Upstream error: ${response.status} for prompt "${prompt.slice(0, 60)}..."`)
      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limited by image provider' })
      }
      throw new Error(`Upstream ${response.status}`)
    }
    const contentType = response.headers.get('content-type') || 'image/png'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=300')
    const buffer = Buffer.from(await response.arrayBuffer())
    res.send(buffer)
    return
  } catch (err) {
    console.error(`[image-proxy] Error fetching image:`, err.message || err)
    res.status(502).json({ error: 'Failed to fetch image' })
  }
})

export default router
