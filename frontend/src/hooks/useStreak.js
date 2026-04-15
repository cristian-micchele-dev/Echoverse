import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'

export function useStreak() {
  const { session } = useAuth()
  const [streak, setStreak] = useState({ current: 0, longest: 0 })

  useEffect(() => {
    if (!session) return
    fetch(`${API_URL}/db/streak`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (typeof data.current === 'number') setStreak(data)
      })
      .catch(() => {})
  }, [session])

  return { streak }
}
