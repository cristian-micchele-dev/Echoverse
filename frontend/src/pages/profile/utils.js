import { useState, useEffect } from 'react'
import { characters } from '../../data/characters'

export const RANK_TIERS = [
  { min: 500, label: 'Leyenda',    color: '#f59e0b' },
  { min: 200, label: 'Maestro',    color: '#a78bfa' },
  { min: 75,  label: 'Veterano',   color: '#60a5fa' },
  { min: 20,  label: 'Explorador', color: '#34d399' },
  { min: 0,   label: 'Curioso',    color: '#9ca3af' },
]

export function getRank(totalMessages) {
  return RANK_TIERS.find(t => totalMessages >= t.min) ?? RANK_TIERS[RANK_TIERS.length - 1]
}

export const MODE_META = {
  interrogation:  { label: 'Interrogatorio',       emoji: '🕵️' },
  swipe:          { label: 'Swipe',                emoji: '🃏' },
  dilema:         { label: 'Dilemas',              emoji: '⚖️' },
  story:          { label: 'Historia',             emoji: '📖' },
  parecido:       { label: '¿A quién te parecés?', emoji: '🪞' },
  guess:          { label: 'Adivina el Personaje', emoji: '🔍' },
  confesionario:  { label: 'Confesionario',        emoji: '🪑' },
  'este-o-ese':   { label: 'Este o Ese',           emoji: '⚡' },
}

export function getActivityGrid(daysBack = 28) {
  const now = Date.now()
  const dayCounts = {}
  characters.forEach(char => {
    try {
      const raw = localStorage.getItem(`chat-${char.id}`)
      if (!raw) return
      JSON.parse(raw).forEach(msg => {
        if (!msg.ts) return
        const daysAgo = Math.floor((now - msg.ts) / 86400000)
        if (daysAgo < daysBack) {
          dayCounts[daysAgo] = (dayCounts[daysAgo] || 0) + 1
        }
      })
    } catch { /* ignore */ }
  })
  return Array.from({ length: daysBack }, (_, i) => ({
    daysAgo: daysBack - 1 - i,
    count: dayCounts[daysBack - 1 - i] || 0,
  }))
}

export function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!target) return
    let frame
    const start = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) { frame = requestAnimationFrame(tick) }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return count
}
