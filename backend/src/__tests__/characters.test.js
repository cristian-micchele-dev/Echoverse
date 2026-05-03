/**
 * Tests para backend/src/data/characters.js
 *
 * Cubre:
 *  - Integridad del catálogo: ids únicos, campos obligatorios, instrucción de idioma
 *
 * Migrado de node:test → Jest
 */

import { describe, test, expect } from '@jest/globals'
import { characters } from '../data/characters.js'

const entries = Object.entries(characters)

describe('characters — integridad de datos', () => {
  test('el catálogo tiene personajes definidos', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  test('cada personaje tiene id y systemPrompt como strings no vacíos', () => {
    for (const [key, char] of entries) {
      expect(typeof char.id).toBe('string')
      expect(typeof char.systemPrompt).toBe('string')
      expect(char.id.length).toBeGreaterThan(0)
      expect(char.systemPrompt.length).toBeGreaterThan(0)
    }
  })

  test('el id de cada personaje coincide con su clave en el mapa', () => {
    for (const [key, char] of entries) {
      expect(char.id).toBe(key)
    }
  })

  test('no hay ids duplicados', () => {
    const ids = Object.values(characters).map(c => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  test('cada systemPrompt tiene longitud razonable (> 100 chars)', () => {
    for (const [, char] of entries) {
      expect(char.systemPrompt.length).toBeGreaterThanOrEqual(100)
    }
  })

  test('cada personaje instruye al modelo a responder en un idioma', () => {
    const languagePatterns = [/español/i, /spanish/i, /same language/i, /mismo idioma/i]
    for (const [key, char] of entries) {
      const hasLanguageInstruction = languagePatterns.some(p => p.test(char.systemPrompt))
      expect(hasLanguageInstruction).toBe(true)
    }
  })
})
