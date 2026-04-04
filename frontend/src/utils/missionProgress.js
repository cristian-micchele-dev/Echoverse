const KEY = 'mission-campaign-progress'

function getDefault() {
  return { highestUnlocked: 1, completedLevels: {} }
}

export function getMissionProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? getDefault()
  } catch {
    return getDefault()
  }
}

export function isLevelUnlocked(level) {
  return level <= getMissionProgress().highestUnlocked
}

export function saveLevelComplete(level) {
  const progress = getMissionProgress()
  progress.completedLevels[level] = { completed: true, date: Date.now() }
  if (level >= progress.highestUnlocked) progress.highestUnlocked = level + 1
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export function resetProgress() {
  localStorage.removeItem(KEY)
}
