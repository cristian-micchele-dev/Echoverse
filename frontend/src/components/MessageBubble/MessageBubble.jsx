import { useState } from 'react'
import './MessageBubble.css'

export default function MessageBubble({ message, character, isStreaming, isGrouped, reaction }) {
  const isUser = message.role === 'user'
  const [imgError, setImgError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const handleShare = () => {
    const quote = `"${message.content}"\n— ${character.name}, ChatPersonajes`
    navigator.clipboard.writeText(quote).then(() => {
      setShared(true)
      setTimeout(() => setShared(false), 1800)
    })
  }

  return (
    <div className={[
      'bubble-row',
      isUser ? 'bubble-row--user' : 'bubble-row--char',
      isGrouped ? 'bubble-row--grouped' : ''
    ].join(' ')}>
      {!isUser && (
        <div className={`bubble-avatar ${isGrouped ? 'bubble-avatar--hidden' : ''}`}>
          {character.image && !imgError
            ? <img src={character.image} alt={character.name} onError={() => setImgError(true)} />
            : <span>{character.emoji}</span>
          }
        </div>
      )}
      <div className={`bubble-wrap ${isUser ? 'bubble-wrap--user' : ''}`}>
        <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--char'}`}>
          {message.content || (isStreaming ? '' : '...')}
          {isStreaming && <span className="typing-cursor">▋</span>}
        </div>

        {!isUser && message.content && !isStreaming && (
          <div className="bubble-actions">
            {reaction && (
              <span className="bubble-reaction" title="Reacción del personaje">{reaction}</span>
            )}
            <button className="copy-btn" onClick={handleCopy} title="Copiar mensaje">
              {copied
                ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="1.5" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 4.5h1.5v6a1 1 0 0 0 1 1h5v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              }
            </button>
            <button className="share-btn" onClick={handleShare} title="Copiar como cita">
              {shared
                ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 9.5V11h1.5l4.4-4.4-1.5-1.5L2 9.5zM10.7 3.8a.4.4 0 0 0 0-.57l-1-1a.4.4 0 0 0-.57 0l-.78.78 1.57 1.57.78-.78z" fill="currentColor"/></svg>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
