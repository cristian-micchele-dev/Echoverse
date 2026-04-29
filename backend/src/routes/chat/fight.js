import { Router } from 'express'
import { characters } from '../../data/characters.js'
import { FIGHT_ROUND_SYSTEM_PROMPT } from '../../data/prompts.js'
import { streamMistral, withSseStream } from '../../utils/mistral.js'

const router = Router()

router.post('/fight/round', async (req, res) => {
  const { playerCharId, enemyCharId, playerHP, enemyHP, round, totalRounds, history = [], action } = req.body
  const playerChar = characters[playerCharId]
  const enemyChar = characters[enemyCharId]
  if (!playerChar || !enemyChar) return res.status(404).json({ error: 'Personaje no encontrado' })

  const isFinal = round >= totalRounds || playerHP <= 0 || enemyHP <= 0

  const historyText = history.length > 0
    ? history.slice(-3).map((h, i) => `R${i + 1}: ${h.action}`).join(' | ')
    : ''

  const userMessage = isFinal
    ? `COMBATE FINAL: ${playerChar.name} (${playerHP} HP) vs ${enemyChar.name} (${enemyHP} HP).
${historyText ? `Historial: ${historyText}.` : ''}
${action ? `Último movimiento: ${action}.` : ''}
Ganador: ${playerHP > enemyHP ? playerChar.name : enemyHP > playerHP ? enemyChar.name : 'empate'}.
Narrá el remate en 2-3 oraciones épicas. Terminá con [FIN].`
    : `RONDA ${round}/${totalRounds}: ${playerChar.name} (${playerHP} HP) vs ${enemyChar.name} (${enemyHP} HP).
${historyText ? `Historial: ${historyText}.` : ''}
${action ? `${playerChar.name} ejecuta: ${action}.` : `Inicio del combate.`}

Narrá en EXACTAMENTE 2 oraciones cortas usando habilidades reales de cada personaje.
Luego en una línea exacta: DAÑO_JUGADOR: [0-30]|DAÑO_RIVAL: [0-30]
(DAÑO_JUGADOR = daño que recibe ${playerChar.name}, DAÑO_RIVAL = daño que recibe ${enemyChar.name})
Luego:
---
Exactamente 3 movimientos para ${playerChar.name}:
[A] movimiento corto
[B] movimiento corto
[C] movimiento corto`

  await withSseStream(res, () => streamMistral(res, FIGHT_ROUND_SYSTEM_PROMPT, [{ role: 'user', content: userMessage }], isFinal ? 300 : 250), {
    logPrefix: 'Error Mistral /fight/round',
    errorMessage: 'Error al generar combate',
  })
})

export default router
