import { useEffect } from 'react'
import './AchievementToast.css'

export default function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="ach-toast" role="alert">
      <span className="ach-toast__emoji">{achievement.emoji}</span>
      <div className="ach-toast__content">
        <span className="ach-toast__label">Logro desbloqueado</span>
        <span className="ach-toast__name">{achievement.name}</span>
      </div>
      <button className="ach-toast__close" onClick={onDismiss} aria-label="Cerrar">✕</button>
    </div>
  )
}
