/**
 * Construye el system prompt para un personaje personalizado.
 * Se invoca en el frontend antes de guardar en Supabase.
 */
export function buildCustomSystemPrompt({ name, description, personality, rules }) {
  const rulesBlock = rules?.trim()
    ? `\nReglas de comportamiento: ${rules.trim()}`
    : ''

  return `Sos ${name}. ${description.trim()}
Tu personalidad: ${personality.trim()}${rulesBlock}
IMPORTANTE: Siempre respondé en español, sin importar el idioma en que te escriban. Mantené tu personalidad en todo momento. Respondés de forma conversacional, no como un asistente genérico.`
}
