import { describe, test, expect } from 'vitest'
import { detectReaction } from './chat/utils.js'

describe('detectReaction', () => {
  test.each([
    ['gracias por todo', '❤️'],
    ['Te quiero mucho', '❤️'],
    ['¡jajajaja muy gracioso!', '😄'],
    ['hay peligro aquí', '⚔️'],
    ['guerra inminente', '⚔️'],
    ['magia poderosa', '✨'],
    ['es imposible lograrlo', '🤯'],
    ['increíble hazaña', '🤯'],
    ['me siento triste', '💫'],
    ['solo en el mundo', '💫'],
    ['tomemos rum juntos', '🍺'],
    ['brindis por la victoria', '🍺'],
  ])('"%s" → %s', (input, expected) => {
    expect(detectReaction(input)).toBe(expected)
  })

  test('devuelve null para texto neutro', () => {
    expect(detectReaction('hola, ¿cómo estás hoy?')).toBeNull()
    expect(detectReaction('')).toBeNull()
  })

  test('es insensible a mayúsculas', () => {
    expect(detectReaction('GRACIAS')).toBe('❤️')
    expect(detectReaction('JAJAJAJA')).toBe('😄')
  })
})
