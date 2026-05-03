import { describe, test, expect } from 'vitest'
import { parseChoices, parseEffects, parseMissionResponse } from './MissionPage.jsx'

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

  test('parsea opciones con paréntesis de cierre [A) en lugar de [A]', () => {
    const block = '[A) Abrir el sobre\n[B) Pedir detalles\n[C) Salir por la puerta'
    const result = parseChoices(block)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ key: 'A', text: 'Abrir el sobre', type: null })
    expect(result[1]).toEqual({ key: 'B', text: 'Pedir detalles', type: null })
    expect(result[2]).toEqual({ key: 'C', text: 'Salir por la puerta', type: null })
  })

  test('elimina etiqueta ENCADENADO del texto visible', () => {
    const block = '[A] Rompés la lámpara ENCADENADO: [el ruido atrae refuerzos]\n[B] Salís\n[C] Esperás'
    const result = parseChoices(block)
    expect(result[0].text).toBe('Rompés la lámpara')
    expect(result[0].text).not.toContain('ENCADENADO')
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

  test('extrae correctamente el bloque EFECTOS del response completo', () => {
    const text = `TITULO: La Trampa
ESCENA:
Entrás al almacén. Tres guardias patrullan el perímetro.
OPCIONES:
[A] Atacar al primero por sorpresa
[B] Rodear el edificio en silencio
[C] Esperar a que cambien turno

EFECTOS:
A: vida-1 riesgo+2 sigilo-1 desc:El ataque atrae atención
B: vida+0 riesgo-1 sigilo+1 desc:Lográs pasar sin ser visto
C: vida+0 riesgo+0 sigilo+0 desc:Nada cambia por ahora
`
    const result = parseMissionResponse(text)
    expect(result.effects).not.toBeNull()
    expect(result.effects.A).toEqual({ vida: -1, riesgo: 2, sigilo: -1, descripcion: 'El ataque atrae atención' })
    expect(result.effects.B).toEqual({ vida: 0, riesgo: -1, sigilo: 1, descripcion: 'Lográs pasar sin ser visto' })
    expect(result.effects.C).toEqual({ vida: 0, riesgo: 0, sigilo: 0, descripcion: 'Nada cambia por ahora' })
  })

  test('el bloque EFECTOS no aparece en la narrativa', () => {
    const text = `ESCENA:
Caminás por el pasillo oscuro hacia la salida.

OPCIONES:
[A] Atacar
[B] Huir
[C] Negociar

EFECTOS:
A: vida-1 riesgo+1 sigilo+0 desc:Riesgo alto
B: vida+0 riesgo-1 sigilo+0 desc:Escapás
C: vida+0 riesgo+0 sigilo+1 desc:Paz momentánea
`
    const result = parseMissionResponse(text)
    expect(result.narrative).not.toContain('EFECTOS')
    expect(result.narrative).not.toContain('vida')
    expect(result.narrative).not.toContain('riesgo')
  })
})

describe('parseEffects', () => {
  test('parsea el bloque completo de efectos A, B, C', () => {
    const block = `A: vida+1 riesgo-1 sigilo+0 desc:Avanzás sin ser visto
B: vida-2 riesgo+2 sigilo-1 desc:Te detectan y huís
C: vida+0 riesgo+1 sigilo+1 desc:Esperás el momento exacto`
    const result = parseEffects(block)
    expect(result).not.toBeNull()
    expect(result.A).toEqual({ vida: 1, riesgo: -1, sigilo: 0, descripcion: 'Avanzás sin ser visto' })
    expect(result.B).toEqual({ vida: -2, riesgo: 2, sigilo: -1, descripcion: 'Te detectan y huís' })
    expect(result.C).toEqual({ vida: 0, riesgo: 1, sigilo: 1, descripcion: 'Esperás el momento exacto' })
  })

  test('sigilo es 0 por defecto cuando no está en el bloque', () => {
    const block = 'A: vida+1 riesgo-1 desc:Sin sigilo aquí'
    const result = parseEffects(block)
    expect(result.A.sigilo).toBe(0)
  })

  test('descripcion es null cuando no hay campo desc', () => {
    const block = 'A: vida+0 riesgo+1 sigilo-1'
    const result = parseEffects(block)
    expect(result.A.descripcion).toBeNull()
  })

  test('retorna null para texto sin formato de efectos', () => {
    expect(parseEffects('')).toBeNull()
    expect(parseEffects('texto sin formato')).toBeNull()
  })

  test('parsea valores negativos correctamente', () => {
    const block = 'A: vida-3 riesgo+2 sigilo-2 desc:Caída libre'
    const result = parseEffects(block)
    expect(result.A.vida).toBe(-3)
    expect(result.A.riesgo).toBe(2)
    expect(result.A.sigilo).toBe(-2)
  })

  test('es case-insensitive en la letra de opción', () => {
    const block = 'a: vida+1 riesgo+0 sigilo+0 desc:minúscula'
    const result = parseEffects(block)
    expect(result).not.toBeNull()
    expect(result.A).toBeDefined()
  })

  test('parsea solo las opciones presentes (bloque parcial)', () => {
    const block = 'A: vida+1 riesgo+0 sigilo+0 desc:Solo A'
    const result = parseEffects(block)
    expect(result.A).toBeDefined()
    expect(result.B).toBeUndefined()
    expect(result.C).toBeUndefined()
  })
})
