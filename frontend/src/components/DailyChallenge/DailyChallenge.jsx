import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../../data/characters'
import { getTodayChallenge, MODE_LABELS } from '../../data/dailyChallenges'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../config/api'
import './DailyChallenge.css'

export default function DailyChallenge() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [completed, setCompleted] = useState(false)

  const challenge = getTodayChallenge()
  const char = characters.find(c => c.id === challenge.characterId)

  useEffect(() => {
    if (!session || !char) return
    fetch(`${API_URL}/db/daily-challenge`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => setCompleted(!!data.completed))
      .catch(() => {})
  }, [session, char])

  if (!char) return null

  const modeLabel = MODE_LABELS[challenge.mode] || challenge.mode

  return (
    <div
      className={`dc ${completed ? 'dc--done' : ''}`}
      style={{ '--dc-color': char.themeColor, '--dc-dim': char.themeColorDim, '--dc-gradient': char.gradient }}
    >
      <div className="dc__aside">
        <img src={char.image} alt={char.name} className="dc__img" />
        <div className="dc__img-fade" />
      </div>

      <div className="dc__body">
        <div className="dc__header">
          <span className="dc__eyebrow">HOY · DESAFÍO DEL DÍA</span>
          {completed && <span className="dc__done-badge">✓ Completado</span>}
        </div>

        <span className="dc__mode">{modeLabel}</span>
        <h3 className="dc__title">{challenge.label}</h3>
        <p className="dc__char-name">{char.name} · {char.universe}</p>

        {!completed && (
          <button className="dc__cta" onClick={() => navigate(challenge.route)}>
            Jugar ahora →
          </button>
        )}
      </div>

      <div className="dc__ambient" />
    </div>
  )
}
