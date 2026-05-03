import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { ROUTES } from '../../utils/constants'
import { API_URL } from '../../config/api.js'
import { charById, timeAgo } from './utils.js'

export default function RoomCard({ room, isAdmin, session, onDelete }) {
  const navigate = useNavigate()
  const { showConfirm } = useToast()
  const char = charById[room.character_id]
  if (!char) return null

  function handleDelete(e) {
    e.stopPropagation()
    showConfirm(`¿Borrar la sala de ${char.name}?`, async () => {
      const res = await fetch(`${API_URL}/rooms/${room.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) onDelete(room.id)
    })
  }

  return (
    <article
      className="rm-card"
      style={{ '--room-color': char.themeColor, '--room-gradient': char.gradient }}
      onClick={() => navigate(ROUTES.SALA(room.id))}
    >
      <div className="rm-card__bg" />

      {isAdmin && (
        <button
          className="rm-card__delete-btn"
          onClick={handleDelete}
          title="Borrar sala"
          aria-label="Borrar sala"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className="rm-card__img-wrap">
        <img src={char.image} alt={char.name} className="rm-card__img" loading="lazy" decoding="async" />
        <div className="rm-card__img-fade" />
      </div>

      <div className="rm-card__body">
        <div className="rm-card__top">
          <span className="rm-card__char-name">{char.name}</span>
          {room.is_ai_responding && (
            <span className="rm-card__typing-badge">
              <span className="rm-card__typing-dot" />
              respondiendo
            </span>
          )}
        </div>

        {room.name
          ? <p className="rm-card__room-name">"{room.name}"</p>
          : <p className="rm-card__room-name rm-card__room-name--empty">Sin nombre</p>
        }

        <div className="rm-card__footer">
          <span className="rm-card__time">{timeAgo(room.created_at)}</span>
          <span className="rm-card__enter">
            Entrar
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </article>
  )
}
