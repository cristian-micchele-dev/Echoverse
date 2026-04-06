/**
 * Helpers puros extraídos de chat.js para la construcción del system prompt
 * de la escena completa de la Última Cena. Exportados para permitir testing unitario.
 */

export const SCENE_ROLES = ['Líder', 'Opositor', 'Mediador', 'Ejecutor']

/**
 * Extrae la primera oración descriptiva del system prompt de un personaje.
 * Busca la primera línea con más de 30 caracteres que no sea encabezado ni ítem.
 * Limita a 220 caracteres para no saturar el contexto de escena.
 */
export function extractCharDesc(systemPrompt) {
  return systemPrompt
    .split('\n')
    .map(l => l.trim())
    .find(l => l.length > 30 && !l.startsWith('#') && !l.startsWith('-'))
    ?.slice(0, 220) ?? ''
}

/**
 * Construye el system prompt cinematográfico para la Última Cena.
 *
 * @param {object} params
 * @param {Array<{name: string, systemPrompt: string}>} params.resolvedChars
 * @param {string} params.temaLine     — contexto de la reunión (puede ser '')
 * @param {string} params.dialogueLine — tono/estilo específico (puede ser '')
 * @param {string} params.triggerType  — 'SITUACIÓN' | 'EVENTO QUE IRRUMPE EN LA MESA'
 */
export function buildSceneSystemPrompt({ resolvedChars, temaLine, dialogueLine, triggerType }) {
  const charBlock = resolvedChars
    .map(c => `[${c.name}]\n${extractCharDesc(c.systemPrompt)}`)
    .join('\n\n')

  return `Sos el escritor de una conversación inmersiva entre ${resolvedChars.length} personajes ficticios. Cada uno tiene una voz única, un tono propio y una forma de pensar coherente con su origen.

PERSONAJES:
${charBlock}
${temaLine}

REGLAS DE RESPUESTA:

Si el trigger menciona EXPLÍCITAMENTE a un personaje por nombre:
- SOLO ese personaje responde con diálogo.
- Los demás pueden mostrar reacciones silenciosas — breves, sin hablar.
- Máximo 2 reacciones silenciosas de otros personajes. No todos tienen que reaccionar.

Si el trigger NO menciona a nadie específico:
- Responden máximo 2 o 3 personajes.
- Sin redundancia. Cada respuesta aporta algo distinto.

FORMATO OBLIGATORIO — una entrada por línea, sin líneas en blanco entre entradas:
[Nombre del personaje]: texto del diálogo
(Nombre del personaje acción o actitud breve)

RESTRICCIONES:
- Diálogos: máximo 20 palabras por intervención.
- Reacciones silenciosas: máximo 10 palabras, siempre entre paréntesis, comenzando con el nombre del personaje.
- Sin narrador. Sin acotaciones fuera de los formatos indicados.
- No romper personaje. No mencionar que sos una IA.
- SIEMPRE en español, sin importar el idioma del personaje original.
${dialogueLine}

TRIGGER — ${triggerType}:`
}
