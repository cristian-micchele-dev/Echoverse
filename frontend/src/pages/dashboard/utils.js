import { useState, useEffect } from 'react'

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function useCountUp(target, active = true, duration = 900) {
  const [value, setValue] = useState(target)
  useEffect(() => {
    if (!active) return
    let start = null
    let raf
    const step = (timestamp) => {
      if (target === 0) {
        setValue(0)
        return
      }
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
}
