import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { ESTEOESE_QUESTIONS_SUFFIX, ESTEOESE_RESULT_SUFFIX } from '../../data/prompts.js'
import { mistral, initSseResponse, sendSseError, streamMistral } from '../../utils/mistral.js'

const router = Router()

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

export default router
