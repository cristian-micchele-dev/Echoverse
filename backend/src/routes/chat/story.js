import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { initSseResponse, sendSseError, streamMistral } from '../../utils/mistral.js'
import { STORY_MAX_RECENT } from '../../config/constants.js'

const router = Router()

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
  if (!scenarioPrompt || typeof scenarioPrompt !== 'string') return res.status(400).json({ error: 'scenarioPrompt requerido' })
  if (scenarioPrompt.length > 500) return res.status(400).json({ error: 'scenarioPrompt demasiado largo (máx. 500)' })
  if (!Array.isArray(history)) return res.status(400).json({ error: 'history debe ser un array' })

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

export default router
