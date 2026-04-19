import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { GUESS_CLUES_SYSTEM_PROMPT } from '../../data/prompts.js'
import { mistral } from '../../utils/mistral.js'

const router = Router()

router.post('/guess/clues', async (req, res) => {
  const { characterId } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  try {
    const completion = await mistral.chat.completions.create({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: GUESS_CLUES_SYSTEM_PROMPT },
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

export default router
