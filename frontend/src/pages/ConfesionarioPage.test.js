import { describe, test, expect } from 'vitest'
import { parseQuestion } from './ConfesionarioPage.jsx'

describe('parseQuestion', () => {
  test('parsea formato [A][B][C][D] estándar', () => {
    const text = 'Esta es la pregunta que te hago.\n[A] Primera opción\n[B] Segunda opción\n[C] Tercera opción\n[D] Cuarta opción'
    const result = parseQuestion(text)
    expect(result.options).toHaveLength(4)
    expect(result.options[0]).toEqual({ key: 'A', text: 'Primera opción' })
    expect(result.options[3]).toEqual({ key: 'D', text: 'Cuarta opción' })
  })

  test('parsea formato markdown **[A]** con negrita', () => {
    const text = 'Pregunta en formato rico.\n**[A]** Opción A\n**[B]** Opción B\n**[C]** Opción C\n**[D]** Opción D'
    const result = parseQuestion(text)
    expect(result.options).toHaveLength(4)
    expect(result.options[0].key).toBe('A')
  })

  test('fallback: parsea formato A) B) C) D)', () => {
    const text = 'Pregunta alternativa.\nA) Primera\nB) Segunda\nC) Tercera\nD) Cuarta'
    const result = parseQuestion(text)
    expect(result.options).toHaveLength(4)
    expect(result.options[0]).toEqual({ key: 'A', text: 'Primera' })
  })

  test('devuelve options vacío para texto sin opciones reconocibles', () => {
    const text = 'Solo una pregunta sin formato de opciones.'
    const result = parseQuestion(text)
    expect(result.options).toEqual([])
    expect(result.narrative).toBe('Solo una pregunta sin formato de opciones.')
  })

  test('extrae correctamente la narrativa antes de las opciones', () => {
    const text = 'Intro del personaje.\nPregunta central aquí.\n[A] Sí\n[B] No\n[C] Tal vez\n[D] No sé'
    const result = parseQuestion(text)
    expect(result.narrative).toContain('Pregunta central aquí')
    expect(result.options).toHaveLength(4)
  })
})
