import { describe, test, expect } from 'vitest'
import { parseStoryResponse } from './StoryPage.jsx'

describe('parseStoryResponse', () => {
  test('separa narrativa y opciones en el separador ---', () => {
    const text = 'El dragón se acerca lentamente.\n---\n[A] Atacar\n[B] Huir\n[C] Llamar a un aliado'
    const result = parseStoryResponse(text)
    expect(result.narrative).toBe('El dragón se acerca lentamente.')
    expect(result.choices).toHaveLength(3)
    expect(result.choices[0]).toEqual({ key: 'A', text: 'Atacar' })
  })

  test('detecta [FIN] en el texto', () => {
    const text = 'Y así terminó la historia. [FIN]'
    const result = parseStoryResponse(text)
    expect(result.isFinal).toBe(true)
    expect(result.narrative).not.toContain('[FIN]')
  })

  test('fallback: encuentra [A] sin separador ---', () => {
    const text = 'Narrativa aquí.[A] Opción uno[B] Opción dos[C] Opción tres'
    const result = parseStoryResponse(text)
    expect(result.choices.length).toBeGreaterThan(0)
  })

  test('texto sin opciones devuelve choices vacío e isFinal false', () => {
    const text = 'Solo narrativa, sin opciones de ningún tipo.'
    const result = parseStoryResponse(text)
    expect(result.narrative).toBe('Solo narrativa, sin opciones de ningún tipo.')
    expect(result.choices).toEqual([])
    expect(result.isFinal).toBe(false)
  })
})
