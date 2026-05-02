const TOTAL_TURNS = 5

export default function MissionPlayHeader({
  selectedChar, muted, onToggleMute,
  history, isEnded, turnNumber,
  isCountdownLevel, countdown,
  vida, vidaFlash, vidaState, vidaName,
  riesgoIsDanger, riesgo,
  sigiloIsDanger, sigilo,
  playerAlias, onAbandon,
}) {
  return (
    <div className="mission-play-header">
      <div className="mission-header-top">
        <div className="mission-header-left">
          <button className="mission-back-btn mission-back-btn--abandon" onClick={onAbandon}>
            ✕ Abandonar
          </button>
          <button
            className="mission-mute-btn"
            onClick={onToggleMute}
            title={muted ? 'Activar música' : 'Silenciar música'}
            aria-label={muted ? 'Activar música' : 'Silenciar música'}
            aria-pressed={muted}
          >
            {muted
              ? <svg width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M3 9v4h4l5 5V4L7 9H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="17" y1="9" x2="21" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="21" y1="9" x2="17" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M3 9v4h4l5 5V4L7 9H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M16 8.5a5 5 0 0 1 0 5M19 6a9 9 0 0 1 0 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            }
          </button>
        </div>

        <div className="mission-play-identity">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="mission-play-avatar" loading="lazy" decoding="async" />
            : <span className="mission-play-avatar-emoji">{selectedChar.emoji}</span>
          }
          <div>
            <span className="mission-play-name">{selectedChar.name}</span>
            <span className="mission-play-universe">{playerAlias}</span>
          </div>
        </div>

        <div className="mission-progress">
          {Array.from({ length: TOTAL_TURNS }).map((_, i) => (
            <span
              key={i}
              className={`mission-progress__dot ${
                i < history.length ? 'mission-progress__dot--done' :
                i === history.length && !isEnded ? 'mission-progress__dot--active' : ''
              }`}
            />
          ))}
          <span className="mission-progress__label">
            {isEnded ? 'Final' : `${Math.min(turnNumber, TOTAL_TURNS)} / ${TOTAL_TURNS}`}
          </span>
        </div>
      </div>

      <div className="mission-stats">
        {isCountdownLevel && countdown !== null && (
          <div className={`mission-countdown ${countdown <= 10 ? 'mission-countdown--urgent' : ''}`}>
            <span className="mission-countdown__icon">⏱</span>
            <span className="mission-countdown__value">{countdown}s</span>
          </div>
        )}
        <div className={`mission-stat mission-stat--${vidaState}${vidaFlash ? ` mission-stat--flash-${vidaFlash}` : ''}`} title={vidaName}>
          <span className="mission-stat__icon mission-stat__icon--vida">❤</span>
          <div className="mission-stat__bar">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`mission-stat__pip ${i < vida ? 'mission-stat__pip--on' : ''} mission-stat__pip--vida`} />
            ))}
          </div>
          <span className="mission-stat__name">{vidaName}</span>
        </div>
        <div className={`mission-stat${riesgoIsDanger ? ' mission-stat--critical' : ''}`} title="Riesgo">
          <span className="mission-stat__icon">👁</span>
          <div className="mission-stat__bar">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`mission-stat__pip ${i < riesgo ? 'mission-stat__pip--on' : ''} mission-stat__pip--riesgo`} />
            ))}
          </div>
          <span className="mission-stat__name">Riesgo</span>
        </div>
        <div className={`mission-stat${sigiloIsDanger ? ' mission-stat--critical' : ''}`} title="Sigilo">
          <span className="mission-stat__icon">🌑</span>
          <div className="mission-stat__bar">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`mission-stat__pip ${i < sigilo ? 'mission-stat__pip--on' : ''} mission-stat__pip--sigilo`} />
            ))}
          </div>
          <span className="mission-stat__name">Sigilo</span>
        </div>
      </div>
    </div>
  )
}
