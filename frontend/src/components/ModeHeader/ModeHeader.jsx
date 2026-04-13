import { useNavigate } from 'react-router-dom'
import './ModeHeader.css'

export default function ModeHeader({ modeName, modeEmoji, backPath = '/', backLabel = 'Modos' }) {
  const navigate = useNavigate()
  return (
    <header className="mode-header">
      <button className="mode-header__back" onClick={() => navigate(backPath)}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {backLabel}
      </button>
      <div className="mode-header__badge">
        {modeEmoji && <span className="mode-header__emoji" aria-hidden="true">{modeEmoji}</span>}
        <span className="mode-header__name">{modeName}</span>
      </div>
    </header>
  )
}
