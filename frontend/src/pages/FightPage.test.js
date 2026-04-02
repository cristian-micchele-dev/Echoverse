import { describe, test, expect } from 'vitest'
import { parseFightResponse } from './FightPage.jsx'

describe('parseFightResponse', () => {
  test('extrae valores de daño del formato DAÑO_JUGADOR|DAÑO_RIVAL', () => {
    const text = 'El golpe fue devastador.\nDAÑO_JUGADOR: 20 | DAÑO_RIVAL: 15'
    const result = parseFightResponse(text)
    expect(result.playerDmg).toBe(20)
    expect(result.enemyDmg).toBe(15)
    expect(result.narrative).toBe('El golpe fue devastador.')
  })

  test('limita el daño máximo a 45', () => {
    const text = 'Ataque brutal.\nDAÑO_JUGADOR: 99 | DAÑO_RIVAL: 100'
    const result = parseFightResponse(text)
    expect(result.playerDmg).toBe(45)
    expect(result.enemyDmg).toBe(45)
  })

  test('devuelve daño por defecto de 10 cuando no hay línea de daño', () => {
    const text = 'Texto sin daño explícito.'
    const result = parseFightResponse(text)
    expect(result.playerDmg).toBe(10)
    expect(result.enemyDmg).toBe(10)
  })

  test('detecta [FIN] correctamente', () => {
    const text = 'El combate concluyó. [FIN]\nDAÑO_JUGADOR: 0 | DAÑO_RIVAL: 30'
    const result = parseFightResponse(text)
    expect(result.isFinal).toBe(true)
  })

  test('parsea opciones A-D después del separador ---', () => {
    const text = 'Narrativa de combate.\n---\n[A] Golpe directo\n[B] Esquivar\n[C] Contraatacar\n[D] Usar habilidad especial\nDAÑO_JUGADOR: 15 | DAÑO_RIVAL: 20'
    const result = parseFightResponse(text)
    expect(result.choices.length).toBeGreaterThanOrEqual(3)
  })
})
