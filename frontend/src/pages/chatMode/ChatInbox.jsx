import { formatChatTime } from './utils.js'

export default function ChatInbox({ recentChats, onSelect, onDeleteChat }) {
  return (
    <div className="chat-inbox">
      {recentChats.map(({ char, last, ts }) => (
        <div
          key={char.id}
          className="chat-inbox-item"
          style={{ '--ci-color': char.themeColor }}
          onClick={() => onSelect(char.id)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onSelect(char.id)}
        >
          <div className="chat-inbox-item__avatar">
            {char.image
              ? <img src={char.image} alt={char.name} loading="lazy" decoding="async" />
              : <span>{char.emoji}</span>
            }
          </div>
          <div className="chat-inbox-item__body">
            <div className="chat-inbox-item__top">
              <span className="chat-inbox-item__name">{char.name}</span>
              <span className="chat-inbox-item__time">{formatChatTime(ts)}</span>
            </div>
            <div className="chat-inbox-item__bottom">
              <span className="chat-inbox-item__universe">{char.universe}</span>
              <span className="chat-inbox-item__preview">
                {last.role === 'user' ? 'Vos: ' : ''}
                {last.content?.slice(0, 55)}{last.content?.length > 55 ? '…' : ''}
              </span>
            </div>
          </div>
          <button
            className="chat-inbox-item__delete"
            onClick={e => onDeleteChat(char.id, e)}
            aria-label={`Eliminar chat con ${char.name}`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M6 4V3h4v1M5 4l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <svg className="chat-inbox-item__arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ))}
    </div>
  )
}
