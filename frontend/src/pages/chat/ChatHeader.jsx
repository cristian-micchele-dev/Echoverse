import { getAffinityData, getAffinityLevel, getAffinityLabel, getAffinityEmoji } from '../../utils/affinity'

export default function ChatHeader({
  character, characterId, isCustom,
  isTyping, cloudSaved, messages,
  headerImgError, onHeaderImgError,
  onBack, onChangeChar, onShare, onClear,
}) {
  return (
    <header className="chat-header">
      <button className="back-btn" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Volver
      </button>
      <button className="change-char-btn" onClick={onChangeChar} title="Cambiar personaje">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M1 13c0-2.2 2.2-4 5-4M15 13c0-2.2-2.2-4-5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span>Cambiar</span>
      </button>

      <div className="chat-header__character">
        <div className={`chat-header__avatar ${isTyping ? 'chat-header__avatar--typing' : ''}`}>
          {character.image && !headerImgError
            ? <img src={character.image} alt={character.name} onError={onHeaderImgError} />
            : <span>{character.emoji}</span>
          }
        </div>
        <div>
          <h2 className="chat-header__name">{character.name}</h2>
          <span className="chat-header__universe">{character.universe}</span>
          {!isCustom && (() => {
            const level = getAffinityLevel(getAffinityData(characterId).messageCount)
            return level >= 1 ? (
              <span className="chat-header__affinity">
                {getAffinityEmoji(level)} {getAffinityLabel(level)}
              </span>
            ) : null
          })()}
        </div>
      </div>

      <div className="chat-header__actions">
        <div className="chat-header__status">
          <span className="status-dot" />
          <span>{isTyping ? 'Escribiendo...' : 'En línea'}</span>
          {cloudSaved && (
            <span className="cloud-saved-indicator">✓ Guardado</span>
          )}
        </div>
        {messages.length > 0 && (
          <>
            <button className="share-btn" onClick={onShare} title="Compartir conversación">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="12" cy="2.5" r="1.8" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="12" cy="12.5" r="1.8" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="3" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10.3 3.4L4.7 6.6M10.3 11.6L4.7 8.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="clear-btn" onClick={onClear} title="Nueva conversación">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M1.5 7.5a6 6 0 1 0 6-6 6 6 0 0 0-4.24 1.76M1.5 1.5v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
