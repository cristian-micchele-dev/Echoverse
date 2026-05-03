import { readSSEStream } from '../../utils/api/sse'
import { API_URL } from '../../config/api.js'

export async function fetchCharResponse(characterId, messages, duoMode = null) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId, messages, ...(duoMode && { duoMode }) })
  })
  let full = ''
  await readSSEStream(response, content => { full += content })
  return full
}

export function buildHistory(msgs, myCharId) {
  return msgs.map(msg => {
    if (msg.role === 'user') return { role: 'user', content: msg.content }
    if (msg.char?.id === myCharId) return { role: 'assistant', content: msg.content }
    return { role: 'user', content: `[${msg.char?.name}]: ${msg.content}` }
  })
}
