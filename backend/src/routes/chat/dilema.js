import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { streamMistral, withSseStream } from '../../utils/mistral.js'

const router = Router()

router.post('/dilema', async (req, res) => {
  const { characterId, dilemmaQuestion, choiceLabel, choiceKey, choiceHistory, affinityLevel = 0 } = req.body

  const character = characters[characterId]
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' })
  if (!dilemmaQuestion || typeof dilemmaQuestion !== 'string') return res.status(400).json({ error: 'dilemmaQuestion requerido' })

  const safeHistory = Array.isArray(choiceHistory) ? choiceHistory : []
  const historyLines = safeHistory
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

  await withSseStream(res, () => streamMistral(res, systemPrompt, [{ role: 'user', content: 'Reaccioná a mi elección.' }], 200), {
    logPrefix: 'Error Mistral /dilema',
    errorMessage: 'Error al contactar la IA',
  })
})

export default router
