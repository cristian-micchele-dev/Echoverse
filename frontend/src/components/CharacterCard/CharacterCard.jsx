import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CharacterCard.css'

export default function CharacterCard({ character, index = 0, messageCount = 0, onSelect }) {
  const navigate = useNavigate()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const showImage = character.image && !imgError

  function handleClick() {
    if (onSelect) onSelect(character.id)
    else navigate(`/chat/${character.id}`)
  }

  return (
    <div
      className="char-card"
      style={{
        '--char-color': character.themeColor,
        '--char-gradient': character.gradient,
        '--char-dim': character.themeColorDim,
        '--card-delay': `${index * 0.05}s`,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
    >
      {/* Fondo: imagen o gradiente */}
      <div className="char-card__bg" style={{ background: character.gradient }}>
        {showImage && (
          <img
            src={character.image}
            alt={character.name}
            className={`char-card__img ${imgLoaded ? 'char-card__img--loaded' : ''}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Overlay degradado sobre la imagen */}
      <div className="char-card__overlay" />

      {/* Emoji cuando no hay imagen */}
      {!showImage && (
        <div className="char-card__emoji">{character.emoji}</div>
      )}

      {/* Scanline — pasa al hover */}
      <div className="char-card__scanline" />

      {/* Contenido inferior */}
      <div className="char-card__content">
        <span className="char-card__universe">{character.universe}</span>
        <h3 className="char-card__name">{character.name}</h3>
        <p className="char-card__desc">{character.description}</p>
        <div className="char-card__cta">
          <span>Chatear</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Borde glow */}
      <div className="char-card__border" />
    </div>
  )
}
