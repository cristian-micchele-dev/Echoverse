import { ROUTES } from '../../utils/constants'

export default function ChatCustomChars({ customChars, deletingId, onSelect, onDelete, navigate }) {
  return (
    <div className="custom-chars-section">
      <button
        className="custom-chars-create-btn"
        onClick={() => navigate(ROUTES.CREAR_PERSONAJE)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Crear personaje
      </button>

      {customChars.length === 0 ? (
        <div className="custom-chars-empty">
          <span className="custom-chars-empty__icon">🤖</span>
          <p className="custom-chars-empty__text">Todavía no creaste ningún personaje.<br />¡Diseñá el tuyo!</p>
        </div>
      ) : (
        <div className="custom-chars-list">
          {customChars.map(char => (
            <div
              key={char.id}
              className="custom-char-item"
              style={{ '--ci-color': char.color || '#7252E8' }}
              onClick={() => onSelect(`custom-${char.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(`custom-${char.id}`)}
            >
              <div className="custom-char-item__avatar">
                {char.avatar_url
                  ? <img src={char.avatar_url} alt={char.name} loading="lazy" />
                  : <span>{char.emoji || '🤖'}</span>
                }
              </div>
              <div className="custom-char-item__info">
                <span className="custom-char-item__name">{char.name}</span>
                <span className="custom-char-item__tag">Personaje personalizado</span>
              </div>
              <button
                className="custom-char-item__edit"
                onClick={e => { e.stopPropagation(); navigate(ROUTES.EDITAR_PERSONAJE(char.id)) }}
                aria-label={`Editar ${char.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                className="custom-char-item__delete"
                onClick={e => onDelete(char.id, e)}
                disabled={deletingId === char.id}
                aria-label={`Eliminar ${char.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4h10M6 4V3h4v1M5 4l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <svg className="custom-char-item__arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
