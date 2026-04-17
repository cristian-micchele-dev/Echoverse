import { useState, useCallback } from 'react'

/**
 * Muestra un toast cuando addModeXP detecta una subida de nivel.
 * Uso:
 *   const { levelUpToast, dismissLevelUp, notifyLevelUp } = useLevelUpToast()
 *   const result = addModeXP(char.id, 'story')
 *   notifyLevelUp(result, char.name)
 *
 * Renderizar:
 *   {levelUpToast && <AchievementToast achievement={levelUpToast} onDismiss={dismissLevelUp} />}
 */
export function useLevelUpToast() {
  const [levelUpToast, setLevelUpToast] = useState(null)

  const notifyLevelUp = useCallback((result, charName = '') => {
    if (!result?.levelUp) return
    setLevelUpToast({
      id: 'level-up',
      emoji: result.newEmoji || '⭐',
      name: charName
        ? `${result.newLabel} de ${charName}`
        : result.newLabel,
      rarity: result.newLevel >= 6 ? 'legendary' : result.newLevel >= 3 ? 'rare' : 'common',
    })
  }, [])

  const dismissLevelUp = useCallback(() => setLevelUpToast(null), [])

  return { levelUpToast, dismissLevelUp, notifyLevelUp }
}
