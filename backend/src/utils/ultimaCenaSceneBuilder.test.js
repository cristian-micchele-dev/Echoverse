/**
 * Tests unitarios para ultimaCenaSceneBuilder.js
 *
 * Cubre:
 *  - extractCharDesc: línea larga, líneas cortas/encabezados/ítems descartados,
 *    límite de 220 chars, sistema prompt vacío
 *  - buildSceneSystemPrompt: presencia de personajes, roles asignados, triggerType,
 *    temaLine y dialogueLine opcionales, conteo de intervenciones, formato de salida
 *
 * Runner: node --test (ES Modules nativos)
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractCharDesc,
  buildSceneSystemPrompt,
  SCENE_ROLES
} from './ultimaCenaSceneBuilder.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CHAR_FRODO = {
  name: 'Frodo Bolsón',
  systemPrompt: `Eres Frodo Bolsón, el portador del Anillo. Eres valiente y humilde.`
}

const CHAR_VADER = {
  name: 'Darth Vader',
  systemPrompt: `You are Darth Vader, Dark Lord of the Sith. You are imposing and authoritative.`
}

const CHAR_SHERLOCK = {
  name: 'Sherlock Holmes',
  systemPrompt: `You are Sherlock Holmes, the world's only consulting detective. You are extraordinarily observant.`
}

const CHAR_FALLBACK = {
  name: 'Personaje X',
  systemPrompt: `Sos Personaje X, un personaje icónico. Respondé siempre en español.`
}

const THREE_CHARS = [CHAR_FRODO, CHAR_VADER, CHAR_SHERLOCK]
const FOUR_CHARS = [CHAR_FRODO, CHAR_VADER, CHAR_SHERLOCK, CHAR_FALLBACK]

const BASE_PARAMS = {
  temaLine: '',
  resolvedFlow: '1. Reacciones al trigger. 2. Conflicto. 3. Resolución.',
  dialogueLine: '',
  triggerType: 'SITUACIÓN'
}

// ─── extractCharDesc ──────────────────────────────────────────────────────────

describe('extractCharDesc', () => {
  it('extrae la primera línea con más de 30 caracteres', () => {
    const prompt = `Eres Frodo Bolsón, el portador del Anillo Único, el hobbit que cargó el peso del mundo.`
    const result = extractCharDesc(prompt)
    assert.ok(result.length > 0)
    assert.ok(result.includes('Frodo'))
  })

  it('descarta líneas de encabezado que empiezan con #', () => {
    const prompt = `# Personaje\nEres un personaje famoso con una historia rica y compleja en el universo de ficción.`
    const result = extractCharDesc(prompt)
    assert.ok(!result.startsWith('#'))
    assert.ok(result.includes('personaje famoso'))
  })

  it('descarta líneas de ítem que empiezan con -', () => {
    const prompt = `- Rasgo uno\n- Rasgo dos\nEres un personaje icónico con décadas de historia y evolución narrativa.`
    const result = extractCharDesc(prompt)
    assert.ok(!result.startsWith('-'))
    assert.ok(result.includes('personaje icónico'))
  })

  it('limita la descripción a 220 caracteres', () => {
    const longLine = 'A'.repeat(300) + ' más texto adicional que no debe aparecer'
    const result = extractCharDesc(longLine)
    assert.ok(result.length <= 220)
  })

  it('retorna string vacío si ninguna línea tiene más de 30 caracteres', () => {
    const prompt = `Corta\nTambién corta\nMuy breve`
    const result = extractCharDesc(prompt)
    assert.equal(result, '')
  })

  it('retorna string vacío con prompt vacío', () => {
    const result = extractCharDesc('')
    assert.equal(result, '')
  })

  it('ignora líneas cortas aunque tengan más de 3 palabras', () => {
    // "Hola mundo esto es" tiene 18 chars — menos de 30 — debe ser ignorada
    const prompt = `Hola mundo esto es\nEsta es una descripción suficientemente larga como para ser seleccionada por el extractor.`
    const result = extractCharDesc(prompt)
    assert.ok(result.includes('suficientemente larga'))
  })
})

// ─── buildSceneSystemPrompt ───────────────────────────────────────────────────

describe('buildSceneSystemPrompt', () => {
  it('incluye el nombre de cada personaje en el prompt', () => {
    const prompt = buildSceneSystemPrompt({ resolvedChars: THREE_CHARS, ...BASE_PARAMS })

    assert.ok(prompt.includes('Frodo Bolsón'))
    assert.ok(prompt.includes('Darth Vader'))
    assert.ok(prompt.includes('Sherlock Holmes'))
  })

  it('asigna los roles en orden: Líder, Opositor, Mediador para 3 personajes', () => {
    const prompt = buildSceneSystemPrompt({ resolvedChars: THREE_CHARS, ...BASE_PARAMS })

    assert.ok(prompt.includes(SCENE_ROLES[0]), 'debe incluir el rol Líder')
    assert.ok(prompt.includes(SCENE_ROLES[1]), 'debe incluir el rol Opositor')
    assert.ok(prompt.includes(SCENE_ROLES[2]), 'debe incluir el rol Mediador')
  })

  it('asigna los 4 roles para 4 personajes', () => {
    const prompt = buildSceneSystemPrompt({ resolvedChars: FOUR_CHARS, ...BASE_PARAMS })

    for (const role of SCENE_ROLES) {
      assert.ok(prompt.includes(role), `debe incluir el rol ${role}`)
    }
  })

  it('el conteo de intervenciones en REGLAS ESTRICTAS es 2 * cantidad de personajes', () => {
    const prompt3 = buildSceneSystemPrompt({ resolvedChars: THREE_CHARS, ...BASE_PARAMS })
    assert.ok(prompt3.includes('EXACTAMENTE 6 intervenciones'), 'debe indicar 6 para 3 personajes')

    const prompt4 = buildSceneSystemPrompt({ resolvedChars: FOUR_CHARS, ...BASE_PARAMS })
    assert.ok(prompt4.includes('EXACTAMENTE 8 intervenciones'), 'debe indicar 8 para 4 personajes')
  })

  it('incluye el triggerType en el prompt', () => {
    const prompt = buildSceneSystemPrompt({
      resolvedChars: THREE_CHARS,
      ...BASE_PARAMS,
      triggerType: 'EVENTO QUE IRRUMPE EN LA MESA'
    })
    assert.ok(prompt.includes('EVENTO QUE IRRUMPE EN LA MESA'))
  })

  it('incluye temaLine cuando está presente', () => {
    const prompt = buildSceneSystemPrompt({
      resolvedChars: THREE_CHARS,
      ...BASE_PARAMS,
      temaLine: '\nCONTEXTO DE LA REUNIÓN: Es la última noche antes de algo que cambiará todo.'
    })
    assert.ok(prompt.includes('CONTEXTO DE LA REUNIÓN'))
    assert.ok(prompt.includes('última noche'))
  })

  it('no incluye "CONTEXTO DE LA REUNIÓN" cuando temaLine está vacío', () => {
    const prompt = buildSceneSystemPrompt({ resolvedChars: THREE_CHARS, ...BASE_PARAMS })
    assert.ok(!prompt.includes('CONTEXTO DE LA REUNIÓN'))
  })

  it('incluye dialogueLine cuando está presente', () => {
    const prompt = buildSceneSystemPrompt({
      resolvedChars: THREE_CHARS,
      ...BASE_PARAMS,
      dialogueLine: '\nTONO Y ESTILO ESPECÍFICO: Frases cortantes.'
    })
    assert.ok(prompt.includes('TONO Y ESTILO ESPECÍFICO'))
    assert.ok(prompt.includes('Frases cortantes.'))
  })

  it('el formato de salida usa corchetes para el nombre del personaje', () => {
    const prompt = buildSceneSystemPrompt({ resolvedChars: THREE_CHARS, ...BASE_PARAMS })
    // La línea de formato debe ser exactamente: [Nombre del personaje]: diálogo aquí
    assert.ok(prompt.includes('[Nombre del personaje]: diálogo aquí'))
  })

  it('incluye la instrucción SIEMPRE en español', () => {
    const prompt = buildSceneSystemPrompt({ resolvedChars: THREE_CHARS, ...BASE_PARAMS })
    assert.ok(prompt.includes('SIEMPRE en español'))
  })

  it('incluye el flujo de escena en el prompt', () => {
    const customFlow = 'Paso 1. Conflicto. Paso 2. Resolución dramática.'
    const prompt = buildSceneSystemPrompt({
      resolvedChars: THREE_CHARS,
      ...BASE_PARAMS,
      resolvedFlow: customFlow
    })
    assert.ok(prompt.includes(customFlow))
  })

  it('formatea el bloque de personaje con [Nombre] — ROL', () => {
    const prompt = buildSceneSystemPrompt({ resolvedChars: THREE_CHARS, ...BASE_PARAMS })
    // Debe contener el patrón [Nombre] — ROL EN ESTA ESCENA: Rol
    assert.ok(prompt.match(/\[Frodo Bolsón\] — ROL EN ESTA ESCENA: Líder/))
  })
})
