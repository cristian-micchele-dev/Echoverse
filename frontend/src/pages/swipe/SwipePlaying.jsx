import { THRESHOLD } from './constants.js'

export default function SwipePlaying({
  selectedChar,
  cards,
  currentIndex,
  leaving,
  dragX,
  isDragging,
  feedbackData,
  timeLeft,
  streak,
  onAnswer,
  onRestart,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onShowExplanation,
  onAdvance,
}) {
  const card = cards[currentIndex]
  const nextCard = cards[currentIndex + 1]
  const rotation = dragX * 0.06
  const leftOpacity = Math.min(1, Math.max(0, -dragX / THRESHOLD))
  const rightOpacity = Math.min(1, Math.max(0, dragX / THRESHOLD))

  return (
    <div className="swipe-page swipe-page--playing" style={{ '--char-color': selectedChar.themeColor }}>
      <div className="swipe-play-header">
        <button className="swipe-back-btn swipe-back-btn--sm" onClick={onRestart}>✕</button>
        <div className="swipe-play-progress">
          {cards.map((_, i) => (
            <span key={i} className={`swipe-dot ${i < currentIndex ? 'swipe-dot--done' : i === currentIndex ? 'swipe-dot--active' : ''}`} />
          ))}
        </div>
        {selectedChar.image
          ? <img src={selectedChar.image} alt={selectedChar.name} className="swipe-play-avatar" loading="lazy" decoding="async" />
          : <span className="swipe-play-emoji">{selectedChar.emoji}</span>}
      </div>

      <div className="swipe-timer-track">
        <div
          className={`swipe-timer-fill ${timeLeft <= 5 ? 'swipe-timer-fill--urgent' : ''}`}
          style={{ width: `${(timeLeft / 15) * 100}%` }}
        />
      </div>

      <div className="swipe-bg-tint swipe-bg-tint--false" style={{ opacity: leftOpacity * 0.18 }} />
      <div className="swipe-bg-tint swipe-bg-tint--true"  style={{ opacity: rightOpacity * 0.18 }} />

      {selectedChar.image && (
        <div className="swipe-bg-char">
          <img src={selectedChar.image} alt="" loading="lazy" decoding="async" />
        </div>
      )}

      <div className="swipe-arena">
        <div className="swipe-indicator swipe-indicator--left" style={{ opacity: leftOpacity }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M21 7L7 21M7 7l14 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          FALSO
        </div>
        <div className="swipe-indicator swipe-indicator--right" style={{ opacity: rightOpacity }}>
          VERDAD
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 14l7 7L23 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {nextCard && (
          <div className="swipe-card swipe-card--behind">
            <p className="swipe-card__text">{nextCard.statement}</p>
          </div>
        )}

        {feedbackData && (
          <div className={`swipe-feedback ${feedbackData.correct ? 'swipe-feedback--correct' : 'swipe-feedback--wrong'}`}>
            <span className="swipe-feedback__icon">{feedbackData.correct ? '✓' : '✗'}</span>
            <p className="swipe-feedback__label">{feedbackData.correct ? 'Correcto' : 'No era así'}</p>
            {feedbackData.text && !feedbackData.showExplanation && (
              <button className="swipe-feedback__toggle" onClick={onShowExplanation}>
                Ver explicación
              </button>
            )}
            {feedbackData.text && feedbackData.showExplanation && (
              <>
                <p className="swipe-feedback__text">{feedbackData.text}</p>
                <button className="swipe-feedback__next" onClick={onAdvance}>
                  Continuar →
                </button>
              </>
            )}
          </div>
        )}

        <div
          className={`swipe-card swipe-card--top ${isDragging ? 'swipe-card--dragging' : ''} ${leaving === 'right' ? 'swipe-card--leaving-right' : ''} ${leaving === 'left' ? 'swipe-card--leaving-left' : ''} ${card?.quote ? 'swipe-card--quote' : ''}`}
          style={{ transform: `translateX(${dragX}px) rotate(${rotation}deg)` }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        >
          <div className="swipe-card__stamp swipe-card__stamp--true"  style={{ opacity: rightOpacity }}>✓ VERDAD</div>
          <div className="swipe-card__stamp swipe-card__stamp--false" style={{ opacity: leftOpacity }}>✗ FALSO</div>
          <div className="swipe-card__deco">{card?.quote ? '\u201C' : '?'}</div>
          <p className="swipe-card__text">{card?.statement}</p>
          {card?.quote && (
            <span className="swipe-card__quote-label">
              {selectedChar.image
                ? <img src={selectedChar.image} alt="" className="swipe-card__quote-avatar" loading="lazy" decoding="async" />
                : <span>{selectedChar.emoji}</span>}
              {selectedChar.name}
            </span>
          )}
        </div>
      </div>

      <div className="swipe-btns">
        <button className="swipe-btn swipe-btn--false" onClick={() => onAnswer(false)}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M20 6L6 20M6 6l14 14" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="swipe-counter-wrap">
          <div className="swipe-counter">{currentIndex + 1}<span>/{cards.length}</span></div>
          {streak >= 2
            ? <p className="swipe-streak">🔥 {streak}× racha{streak >= 5 ? ' ×2' : streak >= 3 ? ' ×1.5' : ''}</p>
            : <p className="swipe-counter__hint">deslizá o usá los botones</p>
          }
        </div>
        <button className="swipe-btn swipe-btn--true" onClick={() => onAnswer(true)}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M4 13l7 7L22 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
