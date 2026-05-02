import { timeAgo } from '../../utils/session'

export default function DashResume({ activeSession, sessionChar, onNavigate, onClear }) {
  if (!activeSession || !sessionChar) return null

  const route = activeSession.route || `/chat/${sessionChar.id}`

  return (
    <section className="dash-section">
      <span className="dash-eyebrow">Sesión activa <span className="dash-eyebrow__rule" /></span>
      <div
        className="dash-resume"
        style={{ '--char-color': sessionChar.themeColor }}
        onClick={() => onNavigate(route)}
      >
        <div className="dash-resume__img-wrap">
          <img src={sessionChar.image} alt={sessionChar.name} className="dash-resume__img" />
        </div>
        <div className="dash-resume__info">
          <span className="dash-resume__char">{sessionChar.name}</span>
          <span className="dash-resume__meta">{activeSession.modeLabel} · {timeAgo(activeSession.timestamp)}</span>
          {activeSession.lastMessage && (
            <span className="dash-resume__quote">
              &ldquo;{activeSession.lastMessage.length > 80
                ? activeSession.lastMessage.slice(0, 80) + '…'
                : activeSession.lastMessage}&rdquo;
            </span>
          )}
        </div>
        <button
          className="dash-resume__cta"
          onClick={e => { e.stopPropagation(); onNavigate(route) }}
        >
          Retomar
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="dash-resume__dismiss" onClick={onClear} title="Quitar">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </section>
  )
}
