import { useState, useEffect, useRef } from 'react'
import { shareMessage } from '../../utils/sharing/shareImage'
import './MessageBubble.css'

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏']

export default function MessageBubble({ message, character, isStreaming, isGrouped, reaction, userReaction, onReact }) {
  const isUser = message.role === 'user'
  const [imgError, setImgError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef(null)

  // Cerrar picker al click fuera
  useEffect(() => {
    if (!showPicker) return
    const handleOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showPicker])

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleShare = async () => {
    if (isSharing) return
    setIsSharing(true)
    try {
      await shareMessage(message, character)
      setShared(true)
      setTimeout(() => setShared(false), 2500)
    } catch {
      // Fallback silencioso
    } finally {
      setIsSharing(false)
    }
  }

  const handleReact = (emoji) => {
    onReact?.(emoji)
    setShowPicker(false)
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
        {message.ts && !isStreaming && (
          <span className="msg-time">
            {new Date(message.ts).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {/* Badge de reacción del usuario */}
        {userReaction && (
          <button
            className="user-reaction-badge"
            onClick={() => onReact?.(userReaction)}
            title="Quitar reacción"
          >
            {userReaction}
          </button>
        )}

        {!isUser && message.content && !isStreaming && (
          <div className="bubble-actions">
            {reaction && (
              <span className="bubble-reaction" title="Reacción del personaje">{reaction}</span>
            )}

            {/* Picker de reacciones del usuario */}
            <div className="reaction-picker-wrap" ref={pickerRef}>
              <button
                className={`react-btn ${userReaction ? 'react-btn--active' : ''}`}
                onClick={() => setShowPicker(p => !p)}
                title="Reaccionar"
              >
                {userReaction || '😊'}
              </button>
              {showPicker && (
                <div className="reaction-picker">
                  {REACTION_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      className={`reaction-option ${userReaction === emoji ? 'reaction-option--selected' : ''}`}
                      onClick={() => handleReact(emoji)}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="copy-btn" onClick={handleCopy} title="Copiar mensaje">
              {copied
                ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="1.5" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 4.5h1.5v6a1 1 0 0 0 1 1h5v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              }
            </button>

            <button className="share-btn" onClick={handleShare} disabled={isSharing} title="Compartir como imagen">
              {shared
                ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : isSharing
                  ? <span className="share-btn__loading" />
                  : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v7M3.5 4L6.5 1l3 3M2 9.5v2h9v-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
