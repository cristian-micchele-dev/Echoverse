import { ROUNDS, COST_LABEL } from './constants.js'
import GuessBg from './GuessBg.jsx'

export default function GuessPlaying({
  round, totalScore,
  hints, hintsShown, maxPts,
  candidates, result, revealing,
  hintAreaRef, canRevealMore,
  onRevealHint, onGuess, onExit,
}) {
  return (
    <div className="gp gp--playing">
      <GuessBg />

      <header className="gp-header">
        <button className="gp-back-btn" onClick={onExit}>← Salir</button>
        <div className="gp-status">
          <span className="gp-status__round">{round} / {ROUNDS}</span>
          <span className="gp-status__pts">{totalScore} pts</span>
        </div>
      </header>

      <div className="gp-hints" ref={hintAreaRef}>
        <div className="gp-hints__top">
          <span className="gp-hints__label">Pistas reveladas</span>
          <span className="gp-pts-badge">{maxPts} pts disponibles</span>
        </div>

        {hints.slice(0, hintsShown).map((h, i) => (
          <div key={i} className={`gp-hint gp-hint--l${i + 1}`} style={{ '--idx': i }}>
            <div className="gp-hint__header">
              <span className="gp-hint__num">#{i + 1}</span>
              <span className="gp-hint__level">{h.level}</span>
            </div>
            <p className="gp-hint__text">{h.text}</p>
          </div>
        ))}
      </div>

      <div className="gp-reveal-wrap">
        {canRevealMore ? (
          <button className="gp-reveal-btn" onClick={onRevealHint}>
            <span className="gp-reveal-btn__icon">◎</span>
            <span className="gp-reveal-btn__text">
              Pista {hintsShown + 1} · {hints[hintsShown]?.level}
            </span>
            <span className="gp-reveal-btn__cost">{COST_LABEL[hintsShown]}</span>
          </button>
        ) : (
          <p className="gp-reveal-maxed">Todas las pistas reveladas — elegí tu respuesta</p>
        )}
      </div>

      <div className="gp-candidates">
        {candidates.map(char => (
          <button
            key={char.id}
            className="gp-candidate"
            style={{ '--cc': char.themeColor, '--cg': char.gradient }}
            onClick={() => onGuess(char)}
            disabled={!!result || revealing}
          >
            <div className="gp-candidate__img">
              <img src={char.image} alt={char.name} loading="lazy" decoding="async" />
            </div>
            <span className="gp-candidate__name">{char.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
