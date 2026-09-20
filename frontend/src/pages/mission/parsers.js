export function stripMd(str) {
  return str.replace(/\*\*/g, '').replace(/\*/g, '')
}

export function parseChoices(block) {
  const choices = []
  const pattern = /\[([ABC])[)\]]\s*([\s\S]*?)(?=\s*\[[ABC][)\]]|EFECTOS:|$)/g
  let match
  while ((match = pattern.exec(block)) !== null) {
    let text = stripMd(match[2].replace(/\s*ENCADENADO:\s*\[[^\]]*\]/gi, '').replace(/,\s*$/, '').trim())
    const typeMatch = text.match(/^(táctica|agresiva|sigilosa|creativa|social)\s*[—-]\s*/i)
    const type = typeMatch ? typeMatch[1].toLowerCase() : null
    if (typeMatch) text = text.slice(typeMatch[0].length).trim()
    if (text) choices.push({ key: match[1], text, type })
  }
  return choices
}

// Tolerante a variaciones del modelo: espacios/comas entre stats ("vida +1, riesgo -2")
// y corchetes copiados del template en desc ("desc:[texto]").
export function parseEffects(text) {
  const effects = {}
  const pattern = /([ABC]):\s*vida\s*([+-]?\d+)[,\s]+riesgo\s*([+-]?\d+)(?:[,\s]+sigilo\s*([+-]?\d+))?(?:[,\s]*desc:\s*([^\n]+))?/gi
  let match
  while ((match = pattern.exec(text)) !== null) {
    const desc = match[5]
      ? stripMd(match[5].trim().replace(/^\[|\]$/g, '').trim())
      : null
    effects[match[1].toUpperCase()] = {
      vida: parseInt(match[2], 10),
      riesgo: parseInt(match[3], 10),
      sigilo: match[4] ? parseInt(match[4], 10) : 0,
      descripcion: desc || null
    }
  }
  return Object.keys(effects).length > 0 ? effects : null
}

export function parseMissionResponse(text) {
  let title = null
  let cleanText = text

  // El modelo puede escribir TÍTULO con acento y envolver cabecera/valor en **negrita**
  const titleMatch = text.match(/^\*{0,2}(?:MISI[ÓO]N|T[ÍI]TULO):\*{0,2}\s*\n?\s*(.+?)(?:\n|$)/i)
  if (titleMatch) {
    title = titleMatch[1].trim().replace(/^\*+|\*+$/g, '')
    cleanText = text.slice(titleMatch[0].length).trimStart()
  }

  const isFinal = cleanText.includes('[FIN]')
  if (isFinal) cleanText = cleanText.replace('[FIN]', '').trim()

  let effects = null
  const efectosMatch = cleanText.match(/\n\*{0,2}EFECTOS:\*{0,2}[ \t]*\n([\s\S]*?)(\n\n|$)/i)
  if (efectosMatch) {
    effects = parseEffects(efectosMatch[1])
    cleanText = cleanText.slice(0, efectosMatch.index).trim()
  }

  cleanText = cleanText
    .replace(/^\*{0,2}ESCENA:\*{0,2}\s*\n?/im, '')
    .replace(/\n\*{0,2}OPCIONES:\*{0,2}\s*\n/i, '\n\n---\n')

  const sepMatch = cleanText.match(/\n?\s*---\s*\n/)
  if (sepMatch) {
    const narrative = stripMd(cleanText.slice(0, sepMatch.index).trim())
    const choiceBlock = cleanText.slice(sepMatch.index + sepMatch[0].length)
    return { narrative, choices: parseChoices(choiceBlock), isFinal, title, effects }
  }

  const firstChoice = cleanText.search(/\[A[)\]]/)
  if (firstChoice !== -1) {
    const narrative = stripMd(cleanText.slice(0, firstChoice).replace(/---/g, '').trim())
    return { narrative, choices: parseChoices(cleanText.slice(firstChoice)), isFinal, title, effects }
  }

  return { narrative: stripMd(cleanText), choices: [], isFinal, title, effects }
}
