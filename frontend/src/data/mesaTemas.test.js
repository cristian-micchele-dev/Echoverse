/**
 * Tests de integridad de datos para MESA_TEMAS.
 *
 * Cubre:
 *  - Ids únicos
 *  - Campos requeridos presentes y con tipo correcto
 *  - Arrays de eventos no vacíos
 *  - Tema 'libre' presente como fallback garantizado
 *
 * Runner: Vitest (vitest run)
 */

import { describe, it, expect } from 'vitest'
import { MESA_TEMAS } from './mesaTemas.js'

const REQUIRED_FIELDS = ['id', 'label', 'desc', 'prompt', 'sceneFlow', 'dialogueRules', 'eventos']

describe('MESA_TEMAS — integridad de datos', () => {
  it('es un array con al menos un tema', () => {
    expect(Array.isArray(MESA_TEMAS)).toBe(true)
    expect(MESA_TEMAS.length).toBeGreaterThan(0)
  })

  it('todos los ids son strings no vacíos', () => {
    for (const tema of MESA_TEMAS) {
      expect(typeof tema.id).toBe('string')
      expect(tema.id.trim().length).toBeGreaterThan(0)
    }
  })

  it('todos los ids son únicos', () => {
    const ids = MESA_TEMAS.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it.each(REQUIRED_FIELDS)('todos los temas tienen el campo "%s"', (field) => {
    for (const tema of MESA_TEMAS) {
      expect(tema).toHaveProperty(field)
    }
  })

  it('todos los campos de texto son strings', () => {
    const stringFields = ['id', 'label', 'desc', 'prompt', 'sceneFlow', 'dialogueRules']
    for (const tema of MESA_TEMAS) {
      for (const field of stringFields) {
        expect(typeof tema[field]).toBe('string')
      }
    }
  })

  it('todos los arrays de eventos contienen al menos un evento', () => {
    for (const tema of MESA_TEMAS) {
      expect(Array.isArray(tema.eventos)).toBe(true)
      expect(tema.eventos.length).toBeGreaterThan(0)
    }
  })

  it('todos los eventos son strings no vacíos', () => {
    for (const tema of MESA_TEMAS) {
      for (const evento of tema.eventos) {
        expect(typeof evento).toBe('string')
        expect(evento.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('existe un tema con id "libre" (usado como fallback)', () => {
    const libreExists = MESA_TEMAS.some(t => t.id === 'libre')
    expect(libreExists).toBe(true)
  })

  it('el tema "libre" tiene prompt vacío (mesa sin restricción narrativa)', () => {
    const libre = MESA_TEMAS.find(t => t.id === 'libre')
    expect(libre?.prompt).toBe('')
  })

  it('todos los temas tienen label visible (no solo id técnico)', () => {
    for (const tema of MESA_TEMAS) {
      expect(tema.label.trim().length).toBeGreaterThan(0)
      // label no debe ser igual al id (son campos con propósitos distintos)
      expect(tema.label).not.toBe(tema.id)
    }
  })
})
