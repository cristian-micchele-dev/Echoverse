import { useState } from 'react'
import './VerdictBubble.css'

export default function VerdictBubble({ character, message, isStreaming }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div
      className="verdict-bubble"
      style={{
        '--char-color': character.themeColor,
        '--char-dim': character.themeColorDim,
      }}
    >
      <div className="verdict-bubble__header">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2v1M4 4l1 1M12 4l-1 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M3 7h4l-2 3H3a2 2 0 0 1 0-3zM13 7h-4l2 3h2a2 2 0 0 0 0-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M8 3v9M6 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span>VEREDICTO DE {character.name.toUpperCase()}</span>
      </div>

      <div className="verdict-bubble__content">
        {message.content || (isStreaming ? '' : '…')}
        {isStreaming && <span className="typing-cursor">▋</span>}
      </div>

      {message.content && !isStreaming && (
        <div className="verdict-bubble__footer">
          <button className="verdict-bubble__copy" onClick={handleCopy}>
            {copied
              ? <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 6l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Copiado</>
              : <>Copiar veredicto</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
