import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { initSseResponse, sendSseError, streamMistral } from '../../utils/mistral.js'
import { MISSION_MAX_RECENT } from '../../config/constants.js'

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

  initSseResponse(res)

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

  try {
    await streamMistral(res, missionSystemPrompt, messages, isFinal ? 450 : 480)
  } catch (error) {
    console.error('Error Mistral /mission:', error.message)
    sendSseError(res, 'Error al generar misión')
  }
})

export default router
