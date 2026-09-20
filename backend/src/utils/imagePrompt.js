/**
 * Limpia el prompt de imagen que devuelve el modelo antes de mandarlo a
 * Pollinations: quita markdown (*, _, `), comillas envolventes y espacios
 * redundantes, y trunca al largo máximo.
 */
export function cleanImagePrompt(text, maxLen = 200) {
  const clean = (text || '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim()
  return clean.length > maxLen ? clean.slice(0, maxLen) + '...' : clean
}
