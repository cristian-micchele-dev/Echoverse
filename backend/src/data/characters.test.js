import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { characters } from './characters.js'

const entries = Object.entries(characters)

describe('characters — integridad de datos', () => {
  test('el catálogo tiene personajes definidos', () => {
    assert.ok(entries.length > 0, 'debe haber al menos un personaje')
  })

  test('cada personaje tiene id y systemPrompt como strings no vacíos', () => {
    for (const [key, char] of entries) {
      assert.equal(typeof char.id, 'string', `${key}: id debe ser string`)
      assert.equal(typeof char.systemPrompt, 'string', `${key}: systemPrompt debe ser string`)
      assert.ok(char.id.length > 0, `${key}: id no puede estar vacío`)
      assert.ok(char.systemPrompt.length > 0, `${key}: systemPrompt no puede estar vacío`)
    }
  })

  test('el id de cada personaje coincide con su clave en el mapa', () => {
    for (const [key, char] of entries) {
      assert.equal(char.id, key, `${char.id}: id no coincide con la clave "${key}"`)
    }
  })

  test('no hay ids duplicados', () => {
    const ids = Object.values(characters).map(c => c.id)
    const unique = new Set(ids)
    assert.equal(unique.size, ids.length, `hay ids duplicados: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`)
  })

  test('cada systemPrompt tiene longitud razonable (> 100 chars)', () => {
    for (const [key, char] of entries) {
      assert.ok(
        char.systemPrompt.length >= 100,
        `${key}: systemPrompt demasiado corto (${char.systemPrompt.length} chars)`
      )
    }
  })

  test('cada personaje instruye al modelo a responder en un idioma', () => {
    const languagePatterns = [/español/i, /spanish/i, /same language/i, /mismo idioma/i]
    for (const [key, char] of entries) {
      const hasLanguageInstruction = languagePatterns.some(p => p.test(char.systemPrompt))
      assert.ok(hasLanguageInstruction, `${key}: falta instrucción de idioma en systemPrompt`)
    }
  })
})
