import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { buildSceneSystemPrompt } from '../../utils/ultimaCenaSceneBuilder.js'
import { streamMistral, withSseStream } from '../../utils/mistral.js'
import { SCENE_MAX_TOKENS } from '../../config/constants.js'

const router = Router()

router.post('/ultima-cena/scene', async (req, res) => {
  const { chars: charList, trigger, tema, sceneFlow, dialogueRules, isEvento } = req.body

  if (!charList || charList.length < 3 || charList.length > 4) {
    return res.status(400).json({ error: 'Se necesitan entre 3 y 4 personajes' })
  }

  if (!trigger || typeof trigger !== 'string' || !trigger.trim()) {
    return res.status(400).json({ error: 'El trigger no puede estar vacío' })
  }

  const resolvedChars = charList.map(({ id, name }) => {
    const found = characters[id]
    if (found) return { ...found, name: name || id }
    return { name: name || id, systemPrompt: `Sos ${name || id}, un personaje icónico. Respondé siempre en español.` }
  })

  const temaLine = tema ? `\nCONTEXTO DE LA REUNIÓN: ${tema}` : ''
  const triggerType = isEvento ? 'EVENTO QUE IRRUMPE EN LA MESA' : 'SITUACIÓN'
  const dialogueLine = dialogueRules ? `\nTONO Y ESTILO ESPECÍFICO: ${dialogueRules}` : ''

  const systemPrompt = buildSceneSystemPrompt({ resolvedChars, temaLine, dialogueLine, triggerType })

  await withSseStream(res, () => streamMistral(res, systemPrompt, [{ role: 'user', content: trigger }], SCENE_MAX_TOKENS), {
    logPrefix: 'Error /ultima-cena/scene',
    errorMessage: 'Error al generar la escena',
  })
})

export default router
