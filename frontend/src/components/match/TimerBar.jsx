import { useEffect } from 'react'
import './TimerBar.css'

export default function TimerBar({ duration, onTimeout, paused = false }) {
  useEffect(() => {
    if (paused) return
    const t = setTimeout(onTimeout, duration * 1000)
    return () => clearTimeout(t)
  }, [duration, onTimeout, paused])

  return (
    <div className="tbar-track" role="progressbar" aria-label="Tiempo restante">
      <div
        className={`tbar-fill${paused ? ' tbar-fill--paused' : ''}`}
        style={{ '--tbar-duration': `${duration}s` }}
      />
    </div>
  )
}
