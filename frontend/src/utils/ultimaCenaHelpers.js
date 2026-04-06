/**
 * Helpers puros extraídos de UltimaCenaPage para permitir testing unitario.
 * El componente importa estas funciones desde aquí.
 */

/**
 * Busca el personaje seleccionado cuyo nombre coincide con el texto del AI.
 * Acepta coincidencia exacta, o cuando una parte significativa del nombre
 * registrado aparece en el nombre emitido por el AI (o viceversa).
 * Partes de 4+ caracteres para evitar artículos ("the", "el", "la", "de").
 */
export function findCharByName(name, chars) {
  const lowerName = name.toLowerCase().trim()
  return chars.find(c => {
    const cLower = c.name.toLowerCase()
    if (cLower === lowerName) return true
    // Partes del nombre registrado presentes en el nombre emitido por el AI
    const partsOfRegistered = cLower.split(' ')
    if (partsOfRegistered.some(part => part.length > 3 && lowerName.includes(part))) return true
    // Partes del nombre emitido por el AI presentes en el nombre registrado
    const partsOfEmitted = lowerName.split(' ')
    return partsOfEmitted.some(part => part.length > 3 && cLower.includes(part))
  })
}

/**
 * Identifica el personaje al que pertenece una reacción silenciosa.
 * Las reacciones tienen formato "(Nombre del personaje hace algo...)"
 * — el nombre del personaje siempre aparece al inicio del contenido.
 */
export function findCharInReaction(content, selectedChars) {
  const contentLower = content.toLowerCase()
  return selectedChars.find(c => {
    const nameLower = c.name.toLowerCase()
    if (contentLower.startsWith(nameLower)) return true
    const firstName = nameLower.split(' ')[0]
    return firstName.length > 3 && contentLower.startsWith(firstName)
  })
}

/**
 * Parsea una línea de SSE y, si corresponde a un comensal, agrega el mensaje al estado.
 *
 * Formatos soportados:
 *   [Nombre]: diálogo        → burbuja de diálogo (role: 'char')
 *   Nombre: diálogo          → burbuja de diálogo (role: 'char')
 *   (Nombre acción breve)    → reacción silenciosa (role: 'reaction')
 */
export function parseSseLine(line, selectedChars, setStreamingChar, setMessages, scrollToBottom) {
  const trimmed = line.trim()
  if (!trimmed) return

  // Reacción silenciosa: (Nombre hace algo)
  const reactionMatch = trimmed.match(/^\((.+)\)$/)
  if (reactionMatch) {
    const content = reactionMatch[1].trim()
    const char = findCharInReaction(content, selectedChars)
    if (!char) return
    setMessages(prev => [...prev, { role: 'reaction', charId: char.id, char, content }])
    scrollToBottom()
    return
  }

  // Diálogo: [Nombre]: texto  o  Nombre: texto
  const match = trimmed.match(/^\[(.+?)\]:\s*(.+)$/) || trimmed.match(/^([^[\]:]+):\s*(.+)$/)
  if (!match) return

  const charName = match[1].trim()
  const content = match[2].trim()
  const char = findCharByName(charName, selectedChars)
  if (!char) return

  setStreamingChar(char)
  setMessages(prev => [...prev, { role: 'char', charId: char.id, char, content }])
  scrollToBottom()
}
