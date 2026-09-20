/**
 * Tests para backend/src/utils/imagePrompt.js — limpieza del prompt de imagen
 * que devuelve el modelo antes de mandarlo a Pollinations.
 */

import { describe, test, expect } from '@jest/globals'
import { cleanImagePrompt } from '../utils/imagePrompt.js'

describe('cleanImagePrompt', () => {
  test('quita asteriscos de markdown al inicio y en el medio', () => {
    expect(cleanImagePrompt('*Neon-lit Manhattan alley, **John Wick** walking*'))
      .toBe('Neon-lit Manhattan alley, John Wick walking')
  })

  test('quita comillas envolventes, backticks y guiones bajos', () => {
    expect(cleanImagePrompt('"`dim café interior`, _three men_ at the bar"'))
      .toBe('dim café interior, three men at the bar')
  })

  test('colapsa espacios múltiples y saltos de línea', () => {
    expect(cleanImagePrompt('dim café\n\ninterior,   smoke')).toBe('dim café interior, smoke')
  })

  test('trunca al máximo indicado agregando puntos suspensivos', () => {
    const long = 'a'.repeat(250)
    const out = cleanImagePrompt(long, 200)
    expect(out).toHaveLength(203)
    expect(out.endsWith('...')).toBe(true)
  })

  test('devuelve string vacío para entrada vacía o solo markdown', () => {
    expect(cleanImagePrompt('')).toBe('')
    expect(cleanImagePrompt('***')).toBe('')
  })
})
