/**
 * Utilidades para parsear respuestas del AI en los distintos modos de juego.
 * Centraliza lógica compartida entre FightPage, StoryPage y ConfesionarioPage.
 */

/**
 * Detecta si la respuesta contiene la marca de final [FIN].
 * @param {string} text
 * @returns {boolean}
 */
export function hasFinalFlag(text) {
  return text.includes('[FIN]')
}

/**
 * Extrae el porcentaje de resultado de texto con formato "RESULTADO: X%".
 * @param {string} text
 * @returns {number|null}
 */
export function extractPercentage(text) {
  const m = text.match(/RESULTADO:\s*(\d+)%/i)
  return m ? parseInt(m[1]) : null
}

/**
 * Extrae daños del combate desde marcador "DAÑO_JUGADOR: X | DAÑO_RIVAL: Y".
 * Devuelve los valores capeados al máximo permitido.
 * @param {string} text
 * @param {number} [cap=45] — valor máximo de daño por turno
 * @returns {{ playerDmg: number, enemyDmg: number, cleanText: string }}
 */
export function parseDamageMarkers(text, cap = 45) {
  const m = text.match(/DAÑO_JUGADOR:\s*(\d+)\s*\|\s*DAÑO_RIVAL:\s*(\d+)/i)
  if (!m) return { playerDmg: 10, enemyDmg: 10, cleanText: text }
  return {
    playerDmg: Math.min(cap, parseInt(m[1])),
    enemyDmg: Math.min(cap, parseInt(m[2])),
    cleanText: text.slice(0, m.index).trim()
  }
}

/**
 * Parsea un bloque de texto y extrae opciones en formato [A]/[B]/[C]/[D].
 * Soporta opciones con o sin markdown en negrita (**[A]**).
 * Fallback a formato A) / A.
 * @param {string} block
 * @param {string} [keys='ABCD'] — letras válidas para las opciones
 * @returns {{ key: string, text: string }[]}
 */
export function parseChoicesFromText(block, keys = 'ABCD') {
  const escapedKeys = keys.split('').join('')
  const bracketPattern = new RegExp(
    `\\*{0,2}\\[([${escapedKeys}])\\]\\*{0,2}:?\\s*([\\s\\S]*?)(?=\\s*\\*{0,2}\\[[${escapedKeys}]\\]|$)`,
    'g'
  )
  const choices = []
  let match
  while ((match = bracketPattern.exec(block)) !== null) {
    const text = match[2]
      .replace(/,\s*$/, '')
      .replace(/\n+$/, '')
      .trim()
    if (text) choices.push({ key: match[1], text })
  }
  if (choices.length >= 2) return choices

  // Fallback: A) / A.
  const letterPattern = new RegExp(`^([${escapedKeys}])[).] +(.+)$`, 'gm')
  const fallback = []
  while ((match = letterPattern.exec(block)) !== null) {
    fallback.push({ key: match[1], text: match[2].trim() })
  }
  return fallback.length >= 2 ? fallback : choices
}

/**
 * Separa narrativa y opciones de una respuesta AI.
 * Estrategia: busca separador "---", luego primer "[A]".
 * Elimina [FIN] del texto narrativo.
 * @param {string} text — texto completo recibido del backend
 * @param {string} [keys='ABC'] — letras válidas para las opciones
 * @returns {{ narrative: string, choices: { key: string, text: string }[], isFinal: boolean }}
 */
export function extractNarrativeAndChoices(text, keys = 'ABC') {
  const isFinal = hasFinalFlag(text)
  let cleanText = text.replace('[FIN]', '').trim()

  const sepMatch = cleanText.match(/\n?\s*---\s*\n/)
  if (sepMatch) {
    const narrative = cleanText.slice(0, sepMatch.index).trim()
    const choiceBlock = cleanText.slice(sepMatch.index + sepMatch[0].length)
    return { narrative, choices: parseChoicesFromText(choiceBlock, keys), isFinal }
  }

  const firstChoice = cleanText.search(/\[A\]/)
  if (firstChoice !== -1) {
    const narrative = cleanText.slice(0, firstChoice).replace(/---/g, '').trim()
    const choiceBlock = cleanText.slice(firstChoice)
    return { narrative, choices: parseChoicesFromText(choiceBlock, keys), isFinal }
  }

  return { narrative: cleanText, choices: [], isFinal }
}

/**
 * Parsea la respuesta completa del modo Combate.
 * Extrae daños, opciones y narrativa en un solo paso.
 * @param {string} text
 * @param {number} [damageCap=45]
 * @returns {{ narrative: string, choices: { key: string, text: string }[], playerDmg: number, enemyDmg: number, isFinal: boolean }}
 */
export function parseFightResponse(text, damageCap = 45) {
  const { playerDmg, enemyDmg, cleanText } = parseDamageMarkers(text, damageCap)
  const { narrative, choices, isFinal } = extractNarrativeAndChoices(cleanText, 'ABCD')
  return { narrative, choices, playerDmg, enemyDmg, isFinal }
}

/**
 * Parsea la respuesta completa del modo Historia.
 * @param {string} text
 * @returns {{ narrative: string, choices: { key: string, text: string }[], isFinal: boolean }}
 */
export function parseStoryResponse(text) {
  return extractNarrativeAndChoices(text, 'ABC')
}

/**
 * Parsea una pregunta del modo Confesionario.
 * Soporta [A], **[A]**, A) y A. con narrativa antes de las opciones.
 * @param {string} rawText
 * @returns {{ narrative: string, options: { key: string, text: string }[] }}
 */
export function parseQuestion(rawText) {
  const options = parseChoicesFromText(rawText, 'ABCD')
  if (options.length < 2) return { narrative: rawText, options: [] }

  const firstOptIdx = rawText.search(/\*{0,2}\[A\]|\bA[).]\s/)
  const narrative = firstOptIdx > 0 ? rawText.slice(0, firstOptIdx).trim() : rawText
  return { narrative, options }
}
