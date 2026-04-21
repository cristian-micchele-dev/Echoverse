import { forwardRef } from 'react'
import './ShareCard.css'

function truncate(text, max = 180) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

const ShareCard = forwardRef(function ShareCard({ character, messages }, ref) {
  return (
    <div
      className="share-card"
      ref={ref}
      style={{ background: character.gradient }}
    >
      <div className="share-card__overlay" />

      <div className="share-card__header">
        <div className="share-card__avatar">
          <img
            src={character.image}
            alt={character.name}
            crossOrigin="anonymous"
          />
        </div>
        <div className="share-card__char-info">
          <span className="share-card__name">{character.name}</span>
          <span className="share-card__universe">{character.universe}</span>
        </div>
        <span className="share-card__logo">EchoVerse</span>
      </div>

      <div className="share-card__messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`share-card__bubble share-card__bubble--${msg.role}`}
            style={
              msg.role === 'assistant'
                ? { borderColor: character.themeColor, color: '#fff' }
                : {}
            }
          >
            <p>{truncate(msg.content)}</p>
          </div>
        ))}
      </div>

      <div className="share-card__footer">
        ✦ echoverse-jet.vercel.app
      </div>
    </div>
  )
})

export default ShareCard
