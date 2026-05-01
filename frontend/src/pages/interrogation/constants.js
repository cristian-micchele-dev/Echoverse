export const MAX_QUESTIONS = 8
export const MIN_QUESTIONS = 2
export const POOL_SIZE = 5

export const TONE_LABELS = {
  calm:       { label: 'Calmo',      color: '#70a8e0' },
  defensive:  { label: 'Defensivo',  color: '#f59e0b' },
  irritated:  { label: 'Irritado',   color: '#ef4444' },
  dismissive: { label: 'Despectivo', color: '#a78bfa' },
  confident:  { label: 'Seguro',     color: '#34d399' },
}

export function calcQuestionPressureDelta(emotionalTone, confidence) {
  let delta = 5
  if (['defensive', 'irritated'].includes(emotionalTone)) delta += 15
  else if (emotionalTone === 'dismissive') delta += 5
  else if (emotionalTone === 'confident') delta -= 10
  if (typeof confidence === 'number' && confidence < 0.4) delta += 10
  return delta
}

export function calcConfrontationPressureDelta(emotionalTone, confidence) {
  let delta = 10
  if (['defensive', 'irritated'].includes(emotionalTone)) delta += 20
  else if (emotionalTone === 'dismissive') delta += 10
  else if (emotionalTone === 'confident') delta -= 5
  if (typeof confidence === 'number' && confidence < 0.4) delta += 10
  return delta
}
