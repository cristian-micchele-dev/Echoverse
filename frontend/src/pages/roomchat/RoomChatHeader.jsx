import { usernameColor } from './utils.js'

export default function RoomChatHeader({ character, room, onlineUsers, copied, onBack, onShare }) {
  return (
    <header className="rchat-header">
      <button className="rchat-header__back" onClick={onBack}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Salas
      </button>

      <div className="rchat-header__char">
        <img src={character.image} alt={character.name} className="rchat-header__char-img" />
        <div className="rchat-header__char-info">
          <span className="rchat-header__char-name">{character.name}</span>
          {room.name && <span className="rchat-header__room-name">"{room.name}"</span>}
        </div>
      </div>

      <button
        className={`rchat-share-btn${copied ? ' rchat-share-btn--copied' : ''}`}
        onClick={onShare}
        title="Copiar link de la sala"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        <span>{copied ? 'Copiado' : 'Compartir'}</span>
      </button>

      {onlineUsers.length > 0 && (
        <div className="rchat-header__presence">
          {onlineUsers.slice(0, 4).map((u, i) => (
            <span
              key={i}
              className="rchat-presence-dot"
              title={u.username}
              style={{ '--dot-color': usernameColor(u.username || 'x') }}
            />
          ))}
          {onlineUsers.length > 4 && (
            <span className="rchat-presence-more">+{onlineUsers.length - 4}</span>
          )}
          <span className="rchat-presence-count">{onlineUsers.length} online</span>
        </div>
      )}
    </header>
  )
}
