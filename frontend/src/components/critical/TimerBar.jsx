import { useEffect, useRef, useState } from 'react'
import './TimerBar.css'

export default function TimerBar({ duration, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const startRef    = useRef(null)
  const expiredRef  = useRef(false)
  const onExpireRef = useRef(onExpire)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  useEffect(() => {
    startRef.current   = Date.now()
    expiredRef.current = false

    const id = setInterval(() => {
      const elapsed   = Date.now() - startRef.current
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(remaining)

      if (remaining === 0 && !expiredRef.current) {
        expiredRef.current = true
        clearInterval(id)
        onExpireRef.current?.()
      }
    }, 50)

    return () => clearInterval(id)
  }, [duration])

  const pct     = timeLeft / duration
  const urgency = pct < 0.33 ? 'critical' : pct < 0.66 ? 'warning' : 'safe'
  const secs    = Math.ceil(timeLeft / 1000)

  return (
    <div className="timer-bar">
      <div className="timer-bar__track">
        <div
          className={`timer-bar__fill timer-bar__fill--${urgency}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className={`timer-bar__count timer-bar__count--${urgency}`}>{secs}</span>
    </div>
  )
}
