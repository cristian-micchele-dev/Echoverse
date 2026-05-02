import { guessData } from '../../data/guessData'
import { ROUNDS } from './constants.js'
import GuessBg from './GuessBg.jsx'

const LEVEL_BADGES = [
  { icon: '◆', label: 'Primera pista', color: '#fbbf24' },
  { icon: '◇', label: 'Segunda pista', color: '#a78bfa' },
  { icon: '○', label: 'Tercera pista', color: '#60a5fa' },
]

export default function GuessReveal({
  target, result, guessed,
  hintsShown, maxPts,
  history, round,
  onNext, onReset,
}) {
  const isWin      = result === 'win'
  const targetData = guessData[target.id]
  const isLast     = round >= ROUNDS
  const badge      = LEVEL_BADGES[hintsShown - 1]

  return (
    <div className="gp gp--reveal">
      <GuessBg />

      <div className="gp-reveal-glow" style={{ '--cc': target.themeColor }} aria-hidden="true" />
      {isWin && <div className="gp-reveal-burst" style={{ '--cc': target.themeColor }} aria-hidden="true" />}

      <div className="gp-reveal-card" style={{ '--cc': target.themeColor }}>
        <div className={`gp-reveal-avatar ${isWin ? 'gp-reveal-avatar--win' : ''}`}>
          <img src={target.image} alt={target.name} loading="lazy" decoding="async" />
        </div>

        <div className={`gp-reveal-mark gp-reveal-mark--${isWin ? 'win' : 'lose'}`}>
          {isWin ? '✔' : '✕'}
        </div>

        <h2 className="gp-reveal-name" style={{ color: target.themeColor }}>
          {target.name}
        </h2>
        <p className="gp-reveal-universe">{target.universe}</p>

        {targetData?.revealPhrase && (
          <blockquote className="gp-reveal-quote">
            "{targetData.revealPhrase}"
          </blockquote>
        )}

        {isWin && (
          <div className="gp-reveal-score">
            <span className="gp-reveal-badge" style={{ '--bc': badge.color }}>
              {badge.icon} {badge.label}
            </span>
            <span className="gp-reveal-pts">+{maxPts} pts</span>
          </div>
        )}

        {!isWin && guessed && (
          <p className="gp-reveal-wrong">
            Elegiste a <strong style={{ color: guessed.themeColor }}>{guessed.name}</strong>
          </p>
        )}

        <div className="gp-round-dots">
          {history.map((h, i) => (
            <span
              key={i}
              className={`gp-round-dot gp-round-dot--${h.win ? 'win' : 'lose'}`}
              title={h.char.name}
            />
          ))}
          {Array.from({ length: ROUNDS - history.length }).map((_, i) => (
            <span key={`e-${i}`} className="gp-round-dot gp-round-dot--empty" />
          ))}
        </div>

        <div className="gp-reveal-actions">
          <button className="gp-start-btn" onClick={onNext}>
            {isLast ? 'Ver resultado' : 'Siguiente'}
          </button>
          <button className="gp-back-btn" onClick={onReset}>Salir</button>
        </div>
      </div>
    </div>
  )
}
