import { usernameColor } from './utils.js'

export default function RoomBubble({ msg, currentUserId, charColor, charName }) {
  const isMe = msg.user_id === currentUserId
  const isAI = msg.role === 'assistant'

  if (msg.type === 'event') {
    return (
      <div className="rchat-event-bubble">
        <span className="rchat-event-icon">⚡</span>
        <span className="rchat-event-text">{msg.content}</span>
        <span className="rchat-event-by">— {msg.username}</span>
      </div>
    )
  }

  if (msg.type === 'poll') {
    let pollData = null
    try { pollData = JSON.parse(msg.content) } catch { /* skip */ }
    if (pollData) {
      return (
        <div className="rchat-poll-snapshot">
          <span className="rchat-poll-snapshot__icon">📊</span>
          <span className="rchat-poll-snapshot__q">{pollData.question}</span>
          <div className="rchat-poll-snapshot__opts">
            {pollData.options.map(opt => (
              <span key={opt} className="rchat-poll-snapshot__opt">{opt}</span>
            ))}
          </div>
          <span className="rchat-poll-snapshot__by">Encuesta de {msg.username}</span>
        </div>
      )
    }
  }

  return (
    <div className={`rchat-bubble-row ${isMe ? 'rchat-bubble-row--me' : isAI ? 'rchat-bubble-row--ai' : 'rchat-bubble-row--other'}`}>
      {!isMe && (
        <span
          className="rchat-bubble-sender"
          style={{ color: isAI ? charColor : usernameColor(msg.username || 'Usuario') }}
        >
          {isAI ? (charName || msg.username || 'Personaje') : (msg.username || 'Usuario')}
        </span>
      )}
      <div
        className={`rchat-bubble ${isMe ? 'rchat-bubble--me' : isAI ? 'rchat-bubble--ai' : 'rchat-bubble--other'}`}
        style={isMe ? { '--bubble-color': charColor } : {}}
      >
        {msg.content}
      </div>
    </div>
  )
}
