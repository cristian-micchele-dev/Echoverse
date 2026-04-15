import { useEffect } from 'react'
import './AchievementToast.css'

const PARTICLE_COUNT = { common: 0, rare: 8, legendary: 14 }

export default function AchievementToast({ achievement, onDismiss }) {
  const rarity = achievement.rarity ?? 'common'
  const particleCount = PARTICLE_COUNT[rarity] ?? 0

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={`ach-toast ach-toast--${rarity}`} role="alert">
      {particleCount > 0 && (
        <div className="ach-burst" aria-hidden="true">
          {Array.from({ length: particleCount }).map((_, i) => (
            <span
              key={i}
              className="ach-burst__particle"
              style={{ '--i': i, '--total': particleCount }}
            />
          ))}
        </div>
      )}
      <div className="ach-toast__body">
        <span className="ach-toast__emoji">{achievement.emoji}</span>
        <div className="ach-toast__content">
          <span className="ach-toast__label">
            {rarity === 'legendary' ? '✦ Logro legendario' : rarity === 'rare' ? '★ Logro raro' : 'Logro desbloqueado'}
          </span>
          <span className="ach-toast__name">{achievement.name}</span>
        </div>
        <button className="ach-toast__close" onClick={onDismiss} aria-label="Cerrar">✕</button>
      </div>
      <div className="ach-toast__progress">
        <div className="ach-toast__progress-bar" />
      </div>
    </div>
  )
}
