import { Router } from 'express'
import { characters } from '../data/characters.js'
import { initSseResponse, sendSseError, streamMistral } from '../utils/mistral.js'

const router = Router()

function buildRpgSystemPrompt(characterPrompt, isFinal, turnNumber, traitProfile) {
  if (isFinal) {
    const dominantTraits = Object.entries(traitProfile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([trait, count]) => `${trait} (${count}x)`)
      .join(', ')

    return `${characterPrompt}

MODO FORJA TU LEYENDA — DESENLACE FINAL:
Sos el compañero de viaje del protagonista. Narrás en segunda persona ("entraste", "decidiste", "enfrentaste").

El protagonista demostró ser principalmente: ${dominantTraits || 'alguien difícil de definir'}.

Escribí el desenlace final en 3-4 párrafos poderosos, coherente con cómo actuó el protagonista durante toda la aventura. Puede ser un triunfo, una derrota con dignidad, o algo en el medio — lo importante es que sea emotivo y resuene con sus elecciones.

Luego, en líneas separadas y exactas:
[TÍTULO] (título corto para este personaje, ej: "El Estratega en las Sombras" o "El Guerrero Sin Miedo")
[RASGO] (solo el nombre del rasgo dominante en minúsculas, sin espacios)
[FRASE] (una frase tuya de despedida, en tu voz característica, reconociendo la forma en que actuó el protagonista. Entre comillas.)
[FIN]`
  }

  return `${characterPrompt}

MODO FORJA TU LEYENDA — Turno ${turnNumber} de 6:
Sos el compañero de viaje del protagonista en esta aventura. La historia se narra en segunda persona ("entrás", "ves", "decidís").

El protagonista es quien actúa — vos estás presente, reaccionás, comentás, pero no tomás las decisiones por él.

Escribí 2-3 párrafos narrativos donde el protagonista se enfrenta a una situación concreta. Incluí tu presencia (una frase tuya, una acción tuya) pero el foco es el protagonista y lo que enfrenta.

Luego, en una línea sola: ---
Después, exactamente 3 opciones. Cada opción tiene un rasgo entre pipes que define el tipo de acción:
[A|rasgo] texto de la opción
[B|rasgo] texto de la opción
[C|rasgo] texto de la opción

Rasgos disponibles: valiente, astuto, compasivo, implacable, sabio, rebelde, leal.
Cada opción debe ser distinta en enfoque y tener consecuencias reales. Nada de opciones neutras.`
}

function buildRpgMessages(worldPrompt, history, isFinal) {
  const recentHistory = history.slice(-4)
  const messages = []

  if (history.length === 0) {
    messages.push({
      role: 'user',
      content: isFinal
        ? `Escenario: ${worldPrompt}. Escribí el desenlace con [TÍTULO], [RASGO], [FRASE] y [FIN].`
        : `Escenario: ${worldPrompt}\n\nIniciá la historia. Terminá con:\n---\n[A|rasgo] opción\n[B|rasgo] opción\n[C|rasgo] opción`
    })
    return messages
  }

  if (history.length > 4) {
    const older = history.slice(0, history.length - 4)
    const recap = older.map((e, i) => `Turno ${i + 1}: ${e.choice}`).join(' | ')
    messages.push({
      role: 'user',
      content: `Escenario: ${worldPrompt}. Decisiones anteriores: ${recap}.`
    })
  } else {
    messages.push({ role: 'user', content: `Escenario: ${worldPrompt}` })
  }

  for (let i = 0; i < recentHistory.length; i++) {
    const entry = recentHistory[i]
    messages.push({ role: 'assistant', content: entry.narrative })
    const isLast = i === recentHistory.length - 1
    messages.push({
      role: 'user',
      content: isLast && isFinal
        ? `Elegí: ${entry.choice}. Escribí el desenlace final. Incluí [TÍTULO], [RASGO], [FRASE] y [FIN].`
        : isLast
          ? `Elegí: ${entry.choice}. Continuá con 2-3 párrafos y las 3 opciones con rasgos: [A|rasgo] opción, [B|rasgo] opción, [C|rasgo] opción.`
          : `Elegí: ${entry.choice}.`
    })
  }

  return messages
}

router.post('/rpg', async (req, res) => {
  const { characterId, worldPrompt, history = [], traitProfile = {}, isFinal = false } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  initSseResponse(res)

  const systemPrompt = buildRpgSystemPrompt(character.systemPrompt, isFinal, history.length + 1, traitProfile)
  const messages = buildRpgMessages(worldPrompt, history, isFinal)

  try {
    await streamMistral(res, systemPrompt, messages, isFinal ? 1000 : 900)
  } catch (error) {
    console.error('Error Mistral /rpg:', error.message)
    sendSseError(res, 'Error al generar historia')
  }
})

export default router
