import { API_URL } from '../config/api'
import { getTodayChallenge } from '../data/dailyChallenges'

export async function recordCompletion(session, mode, characterId = null) {
  if (!session) return

  fetch(`${API_URL}/db/mode-completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode }),
  }).catch(() => {})

  const today = getTodayChallenge()
  if (today.mode === mode) {
    fetch(`${API_URL}/db/daily-challenge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ characterId: characterId ?? today.characterId, mode }),
    }).catch(() => {})
  }
}
