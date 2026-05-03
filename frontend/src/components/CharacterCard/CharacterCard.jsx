import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CharacterBioModal from '../CharacterBioModal/CharacterBioModal'
import { characterBios } from '../../data/characterBios'
import { getAffinityData, getAffinityLevel, getAffinityLabel, getAffinityEmoji, RANK_LABELS } from '../../utils/affinity'
import './CharacterCard.css'

export default function CharacterCard({ character, index = 0, onSelect, selected = false, locked = false }) {
  const navigate = useNavigate()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [bioOpen, setBioOpen] = useState(false)

  const { messageCount } = getAffinityData(character.id)
  const affinityLevel = getAffinityLevel(messageCount)

  const showImage = character.image && !imgError

  function handleClick() {
    if (locked) return
    if (onSelect) onSelect(character.id)
    else navigate(`/chat/${character.id}`)
  }

  function handleInfoClick(e) {
    e.stopPropagation()
    setBioOpen(true)
  }

  return (
    <>
      <div
        className={`char-card${selected ? ' char-card--selected' : ''}${locked ? ' char-card--locked' : ''}`}
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
          {showImage && !imgLoaded && (
            <div className="char-card__img-skeleton skeleton" />
          )}
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

        {/* Badge de afinidad */}
        {affinityLevel >= 1 && (
          <div className="char-card__badge" title="Tu nivel de afinidad — chateá más para subir">
            {getAffinityEmoji(affinityLevel)} {getAffinityLabel(affinityLevel)}
          </div>
        )}

        {/* Botón info */}
        {characterBios[character.id] && (
          <button
            className="char-card__info"
            onClick={handleInfoClick}
            onKeyDown={e => e.key === 'Enter' && handleInfoClick(e)}
            aria-label={`Ver historia de ${character.name}`}
            tabIndex={0}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6.5 6v3.5M6.5 4.5v.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        )}

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

        {/* Overlay de personaje bloqueado */}
        {locked && (
          <div className="char-card__lock">
            <span className="char-card__lock-icon">🔒</span>
            <span className="char-card__lock-label">
              Desbloqueá en nivel<br /><strong>{RANK_LABELS[character.unlockRank]}</strong>
            </span>
          </div>
        )}

        {/* Borde glow */}
        <div className="char-card__border" />
      </div>

      {bioOpen && (
        <CharacterBioModal character={character} onClose={() => setBioOpen(false)} />
      )}
    </>
  )
}
