import { describe, test, expect } from 'vitest'
import { parseChoices, parseMissionResponse } from './MissionPage.jsx'

describe('parseChoices', () => {
  test('parsea tres opciones [A][B][C] correctamente', () => {
    const block = '[A] Atacar de frente\n[B] Huir\n[C] Negociar'
    const result = parseChoices(block)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ key: 'A', text: 'Atacar de frente', type: null })
    expect(result[1]).toEqual({ key: 'B', text: 'Huir', type: null })
    expect(result[2]).toEqual({ key: 'C', text: 'Negociar', type: null })
  })

  test('devuelve array vacío para bloque sin opciones', () => {
    expect(parseChoices('')).toEqual([])
    expect(parseChoices('Texto sin corchetes')).toEqual([])
  })

  test('elimina comas finales en el texto de las opciones', () => {
    const block = '[A] Primera opción,\n[B] Segunda opción,'
    const result = parseChoices(block)
    expect(result[0].text).toBe('Primera opción')
  })
})

describe('parseMissionResponse', () => {
  test('extrae título del prefijo MISIÓN:', () => {
    const text = 'MISIÓN: La Gran Prueba\nEras el héroe.\n---\n[A] Atacar\n[B] Huir\n[C] Negociar'
    const result = parseMissionResponse(text)
    expect(result.title).toBe('La Gran Prueba')
    expect(result.narrative).toBe('Eras el héroe.')
    expect(result.choices).toHaveLength(3)
    expect(result.isFinal).toBe(false)
  })

  test('detecta el marcador [FIN]', () => {
    const text = 'La misión ha terminado. [FIN]'
    const result = parseMissionResponse(text)
    expect(result.isFinal).toBe(true)
    expect(result.narrative).not.toContain('[FIN]')
  })

  test('devuelve effects null cuando no hay bloque EFECTOS', () => {
    const text = 'Bien ejecutado.\nCALIFICACIÓN: 85% — Héroe digno'
    const result = parseMissionResponse(text)
    expect(result.effects).toBeNull()
  })

  test('devuelve choices vacío y sin título para narrativa simple', () => {
    const text = 'Una historia sin opciones aquí.'
    const result = parseMissionResponse(text)
    expect(result.choices).toEqual([])
    expect(result.isFinal).toBe(false)
    expect(result.title).toBeNull()
    expect(result.effects).toBeNull()
  })

  test('parsea opciones sin separador --- usando fallback [A]', () => {
    const text = 'Narrativa corta.[A] Opción uno[B] Opción dos[C] Opción tres'
    const result = parseMissionResponse(text)
    expect(result.choices.length).toBeGreaterThan(0)
  })
})
