import { API_URL } from '../config/api'

export async function recordCompletion(session, mode) {
  if (!session) return
  await fetch(`${API_URL}/db/mode-completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode }),
  }).catch(() => {})
}
