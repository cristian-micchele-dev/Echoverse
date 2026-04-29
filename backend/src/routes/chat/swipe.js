import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { SWIPE_CARDS_SUFFIX } from '../../data/prompts.js'
import { callMistral, streamMistral, withSseStream } from '../../utils/mistral.js'

const router = Router()

router.post('/swipe/cards', async (req, res) => {
  const { characterId } = req.body
  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })

  const systemPrompt = `${character.systemPrompt}${SWIPE_CARDS_SUFFIX}`

  try {
    const text = await callMistral({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generá las 10 afirmaciones.' }
      ],
      maxTokens: 900,
      model: 'mistral-large-latest',
    })
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

  const systemPrompt = `${character.systemPrompt}

El jugador acaba de responder un quiz de verdad/mentira sobre tu universo. Sacó ${score} de ${total} preguntas correctas.
Reaccioná en tu voz característica: 2-3 oraciones. Si sacó mucho (8-10): impresionado o retador. Si sacó poco (0-4): burlón o decepcionado. Si sacó regular (5-7): neutro pero con tu sarcasmo habitual.
Respondé en español, sin saludos, directo.`

  await withSseStream(res, () => streamMistral(res, systemPrompt, [{ role: 'user', content: `Saqué ${score}/${total}. ¿Qué opinás?` }], 200), {
    logPrefix: 'Error Mistral /swipe/result',
    errorMessage: 'Error al generar resultado',
  })
})

export default router
