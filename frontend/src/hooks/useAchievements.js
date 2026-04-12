import { useState, useEffect, useCallback, useRef } from 'react'
import { ACHIEVEMENTS } from '../data/achievements'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'

export function useAchievements() {
  const { session } = useAuth()
  const [unlockedIds, setUnlockedIds] = useState(new Set())
  const [newlyUnlocked, setNewlyUnlocked] = useState([])
  const loadedRef = useRef(false)

  // Cargar logros ya desbloqueados al montar
  useEffect(() => {
    if (!session || loadedRef.current) return
    loadedRef.current = true
    fetch(`${API_URL}/db/achievements`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUnlockedIds(new Set(data.map(a => a.achievement_id)))
        }
      })
      .catch(() => {})
  }, [session])

  /**
   * Verificar y desbloquear logros según las stats actuales del usuario.
   * @param {object} stats
   *   - totalMessages: number
   *   - completedLevels: number
   *   - charactersCount: number
   *   - dilemasCount: number
   *   - guessScore: number
   *   - dailyCompleted: number
   */
  const checkAndUnlock = useCallback(async (stats) => {
    if (!session) return

    const toUnlock = ACHIEVEMENTS.filter(a => {
      if (unlockedIds.has(a.id)) return false
      const { type, threshold } = a.condition
      const map = {
        messages_sent:     stats.totalMessages   ?? 0,
        missions_completed: stats.completedLevels ?? 0,
        characters_chatted: stats.charactersCount ?? 0,
        dilemas_answered:   stats.dilemasCount    ?? 0,
        guess_score:        stats.guessScore      ?? 0,
        daily_completed:    stats.dailyCompleted  ?? 0,
      }
      return (map[type] ?? 0) >= threshold
    })

    if (toUnlock.length === 0) return

    const freshlyUnlocked = []
    await Promise.all(toUnlock.map(async (achievement) => {
      try {
        const res = await fetch(`${API_URL}/db/achievements`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ achievementId: achievement.id }),
        })
        const data = await res.json()
        if (data.isNew) {
          freshlyUnlocked.push(achievement)
          setUnlockedIds(prev => new Set([...prev, achievement.id]))
        }
      } catch { /* failed silently */ }
    }))

    if (freshlyUnlocked.length > 0) {
      setNewlyUnlocked(prev => [...prev, ...freshlyUnlocked])
    }
  }, [session, unlockedIds])

  const dismissToast = useCallback((id) => {
    setNewlyUnlocked(prev => prev.filter(a => a.id !== id))
  }, [])

  return { unlockedIds, checkAndUnlock, newlyUnlocked, dismissToast }
}
