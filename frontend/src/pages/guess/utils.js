import { MAX_SCORE } from './constants.js'

export function getBestScore() {
  try { return parseInt(localStorage.getItem('guess-best-score') || '0') } catch { return 0 }
}

export function saveBestScore(score) {
  try {
    if (score > getBestScore()) localStorage.setItem('guess-best-score', String(score))
  // eslint-disable-next-line no-empty
  } catch {}
}

export function pickRandom(arr, exclude = [], n = 1) {
  const pool = arr.filter(c => !exclude.includes(c.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return n === 1 ? shuffled[0] : shuffled.slice(0, n)
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function calcRank(score) {
  const pct = score / MAX_SCORE
  if (pct === 1)   return { label: 'Leyenda',    desc: 'Adivinaste todo a la primera. Tu conocimiento es impresionante.', color: '#fbbf24', icon: '◆' }
  if (pct >= 0.85) return { label: 'Detective',  desc: 'Casi perfecto. Las pistas apenas te hicieron falta.',            color: '#a78bfa', icon: '◇' }
  if (pct >= 0.65) return { label: 'Conocedor',  desc: 'Buen ojo. Reconocés a la mayoría sin necesitar mucha ayuda.',    color: '#60a5fa', icon: '○' }
  if (pct >= 0.45) return { label: 'Aprendiz',   desc: 'Algunos se te escaparon, pero vas aprendiendo.',                 color: '#34d399', icon: '△' }
  return               { label: 'Espectador', desc: 'Todavía queda mucho universo por explorar.',                      color: '#94a3b8', icon: '◌' }
}
