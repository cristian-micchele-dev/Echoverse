import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CharacterBioModal.css'

export default function CharacterBioModal({ character, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleChat(e) {
    e.stopPropagation()
    navigate(`/chat/${character.id}`)
    onClose()
  }

  const [imgError, setImgError] = useState(false)
  const showImage = character.image && !imgError

  return (
    <div
      className="bio-modal__overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Historia de ${character.name}`}
    >
      <div
        className="bio-modal"
        style={{
          '--char-color': character.themeColor,
          '--char-dim': character.themeColorDim,
          '--char-gradient': character.gradient,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header con imagen */}
        <div className="bio-modal__header" style={{ background: character.gradient }}>
          {showImage ? (
            <img
              src={character.image}
              alt={character.name}
              className="bio-modal__img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="bio-modal__emoji">{character.emoji}</div>
          )}
          <div className="bio-modal__header-overlay" />
          <div className="bio-modal__header-content">
            <span className="bio-modal__universe">{character.universe}</span>
            <h2 className="bio-modal__name">{character.name}</h2>
            <p className="bio-modal__tagline">{character.description}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="bio-modal__body">
          <p className="bio-modal__bio">{character.bio || 'Sin historia disponible.'}</p>
        </div>

        {/* Acciones */}
        <div className="bio-modal__footer">
          <button className="bio-modal__chat-btn" onClick={handleChat}>
            <span>Chatear ahora</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Cerrar */}
        <button className="bio-modal__close" onClick={onClose} aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
