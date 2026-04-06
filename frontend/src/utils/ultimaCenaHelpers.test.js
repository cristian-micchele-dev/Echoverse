/**
 * Tests unitarios para ultimaCenaHelpers.js
 *
 * Cubre:
 *  - findCharByName: coincidencia exacta, parcial, case-insensitive,
 *    artículos cortos descartados, sin match, lista vacía
 *  - parseSseLine: formato [Name]:, formato Name:, línea vacía,
 *    línea sin match de personaje, side effects sobre setters
 *
 * Runner: Vitest (vitest run)
 * Entorno: node (configurado en vite.config.js)
 */

import { describe, it, expect, vi } from 'vitest'
import { findCharByName, parseSseLine } from './ultimaCenaHelpers.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CHARS = [
  { id: 'frodo', name: 'Frodo Bolsón' },
  { id: 'john-wick', name: 'John Wick' },
  { id: 'walter-white', name: 'Walter White' },
  { id: 'tony', name: 'Tony Stark' },
]

// ─── findCharByName ───────────────────────────────────────────────────────────

describe('findCharByName', () => {
  it('retorna el personaje en coincidencia exacta (case-insensitive)', () => {
    const result = findCharByName('John Wick', CHARS)
    expect(result?.id).toBe('john-wick')
  })

  it('es case-insensitive en la comparación exacta', () => {
    const result = findCharByName('JOHN WICK', CHARS)
    expect(result?.id).toBe('john-wick')
  })

  it('matchea cuando el AI emite solo el primer nombre (Frodo)', () => {
    // "Frodo" es parte de "Frodo Bolsón" y tiene 5 caracteres — debe matchear
    const result = findCharByName('Frodo', CHARS)
    expect(result?.id).toBe('frodo')
  })

  it('matchea cuando el AI emite solo el apellido (Stark)', () => {
    // "Stark" tiene 5 caracteres, está en "Tony Stark"
    const result = findCharByName('Stark', CHARS)
    expect(result?.id).toBe('tony')
  })

  it('matchea cuando el AI emite el nombre completo con espacios extra', () => {
    const result = findCharByName('  Walter White  ', CHARS)
    expect(result?.id).toBe('walter-white')
  })

  it('NO matchea partes de 3 caracteres o menos (evita artículos como "the", "del")', () => {
    // "Wick" tiene 4 chars — sí matchea; pero "el" y "la" (2-3 chars) no deben matchear
    // Probamos con un nombre que solo comparte partes cortas con cualquier char
    const result = findCharByName('de la Mesa', CHARS)
    // "Mesa" no está en ningún nombre; "la" y "de" tienen 2-3 chars y deben ser ignorados
    expect(result).toBeUndefined()
  })

  it('retorna undefined si el nombre no matchea ningún personaje', () => {
    const result = findCharByName('Gandalf', CHARS)
    expect(result).toBeUndefined()
  })

  it('retorna undefined con lista vacía de personajes', () => {
    const result = findCharByName('John Wick', [])
    expect(result).toBeUndefined()
  })

  it('retorna undefined con string vacío', () => {
    const result = findCharByName('', CHARS)
    expect(result).toBeUndefined()
  })

  it('matchea cuando el nombre del AI tiene texto extra pero incluye parte significativa', () => {
    // El AI podría emitir "Walter" y eso debe matchear "Walter White"
    const result = findCharByName('Walter', CHARS)
    expect(result?.id).toBe('walter-white')
  })

  // Caso de regresión: el bug original fallaba en matching flexible cuando
  // las partes eran exactamente de 4 caracteres (límite de la condición > 3)
  it('regresion: matchea partes de exactamente 4 caracteres (limite > 3)', () => {
    // "Wick" tiene exactamente 4 caracteres — la condición es > 3, así que sí matchea
    const result = findCharByName('Wick', CHARS)
    expect(result?.id).toBe('john-wick')
  })

  // Caso de regresión: el bug original ignoraba nombres emitidos con mayúsculas mezcladas
  it('regresion: matching funciona con nombres emitidos con capitalización mezclada', () => {
    const result = findCharByName('frodo bolsón', CHARS)
    expect(result?.id).toBe('frodo')
  })
})

// ─── parseSseLine ─────────────────────────────────────────────────────────────

describe('parseSseLine', () => {
  function makeSetters() {
    return {
      setStreamingChar: vi.fn(),
      setMessages: vi.fn(),
      scrollToBottom: vi.fn(),
    }
  }

  it('parsea formato [Name]: texto y llama los setters con el personaje correcto', () => {
    const { setStreamingChar, setMessages, scrollToBottom } = makeSetters()
    parseSseLine('[John Wick]: Nadie escapa.', CHARS, setStreamingChar, setMessages, scrollToBottom)

    expect(setStreamingChar).toHaveBeenCalledOnce()
    expect(setStreamingChar).toHaveBeenCalledWith(expect.objectContaining({ id: 'john-wick' }))

    expect(setMessages).toHaveBeenCalledOnce()
    const updaterFn = setMessages.mock.calls[0][0]
    const result = updaterFn([])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      role: 'char',
      charId: 'john-wick',
      content: 'Nadie escapa.',
    })

    expect(scrollToBottom).toHaveBeenCalledOnce()
  })

  it('parsea formato Name: texto (sin corchetes)', () => {
    const { setStreamingChar, setMessages, scrollToBottom } = makeSetters()
    parseSseLine('Walter White: Yo soy el peligro.', CHARS, setStreamingChar, setMessages, scrollToBottom)

    expect(setStreamingChar).toHaveBeenCalledOnce()
    expect(setStreamingChar).toHaveBeenCalledWith(expect.objectContaining({ id: 'walter-white' }))
    expect(setMessages).toHaveBeenCalledOnce()
  })

  it('no llama ningún setter si la línea está vacía', () => {
    const { setStreamingChar, setMessages, scrollToBottom } = makeSetters()
    parseSseLine('', CHARS, setStreamingChar, setMessages, scrollToBottom)
    parseSseLine('   ', CHARS, setStreamingChar, setMessages, scrollToBottom)

    expect(setStreamingChar).not.toHaveBeenCalled()
    expect(setMessages).not.toHaveBeenCalled()
    expect(scrollToBottom).not.toHaveBeenCalled()
  })

  it('no llama ningún setter si la línea no tiene formato nombre: texto', () => {
    const { setStreamingChar, setMessages, scrollToBottom } = makeSetters()
    parseSseLine('una línea sin formato válido', CHARS, setStreamingChar, setMessages, scrollToBottom)

    expect(setStreamingChar).not.toHaveBeenCalled()
    expect(setMessages).not.toHaveBeenCalled()
  })

  it('ignora líneas cuyo nombre no mapea a ningún comensal seleccionado', () => {
    const { setStreamingChar, setMessages, scrollToBottom } = makeSetters()
    // "Gandalf" no está en CHARS
    parseSseLine('[Gandalf]: Una frase cualquiera.', CHARS, setStreamingChar, setMessages, scrollToBottom)

    expect(setStreamingChar).not.toHaveBeenCalled()
    expect(setMessages).not.toHaveBeenCalled()
  })

  it('el mensaje agregado a setMessages incluye char completo con id y name', () => {
    const { setStreamingChar, setMessages, scrollToBottom } = makeSetters()
    parseSseLine('[Tony Stark]: Soy Iron Man.', CHARS, setStreamingChar, setMessages, scrollToBottom)

    const updaterFn = setMessages.mock.calls[0][0]
    const result = updaterFn([])
    expect(result[0].char).toMatchObject({ id: 'tony', name: 'Tony Stark' })
  })

  it('setMessages usa el patrón funcional (prev => [...prev, nuevo])', () => {
    const { setStreamingChar, setMessages, scrollToBottom } = makeSetters()
    const existingMessages = [{ role: 'user', content: 'hola' }]
    parseSseLine('[Frodo Bolsón]: Mi tesoro.', CHARS, setStreamingChar, setMessages, scrollToBottom)

    const updaterFn = setMessages.mock.calls[0][0]
    const result = updaterFn(existingMessages)
    // Debe preservar mensajes anteriores y agregar el nuevo al final
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(existingMessages[0])
    expect(result[1].charId).toBe('frodo')
  })

  it('parsea correctamente cuando el nombre emitido por el AI es solo el primer nombre', () => {
    const { setStreamingChar, setMessages } = makeSetters()
    // El AI puede emitir "[Walter]: texto" aunque el personaje registrado sea "Walter White"
    parseSseLine('[Walter]: Así empieza.', CHARS, setStreamingChar, setMessages, vi.fn())

    expect(setStreamingChar).toHaveBeenCalledOnce()
    expect(setStreamingChar).toHaveBeenCalledWith(expect.objectContaining({ id: 'walter-white' }))
  })
})
