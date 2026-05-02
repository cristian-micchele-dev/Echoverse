import { ROUTES } from '../../utils/constants'
import { ROUNDS, MAX_SCORE } from './constants.js'
import { calcRank, getBestScore } from './utils.js'
import GuessBg from './GuessBg.jsx'

export default function GuessSummary({
  totalScore, history,
  ranking, rankingFetched,
  shareCopied,
  onStartGame, onShare, navigate,
}) {
  const rank    = calcRank(totalScore)
  const correct = history.filter(h => h.win).length
  const best    = getBestScore()
  const isNew   = totalScore >= best

  return (
    <div className="gp gp--summary">
      <GuessBg />

      <div className="gp-summary">
        <span className="gp-eyebrow">Resultado final</span>

        <div className="gp-summary__rank" style={{ '--rc': rank.color }}>
          <span className="gp-summary__rank-icon">{rank.icon}</span>
          <span className="gp-summary__rank-label">{rank.label}</span>
        </div>
        <p className="gp-summary__rank-desc">{rank.desc}</p>

        <div className="gp-summary__score">
          <span className="gp-summary__score-num">{totalScore}</span>
          <span className="gp-summary__score-max">/ {MAX_SCORE} pts</span>
        </div>

        {isNew && (
          <span className="gp-summary__best">✦ Nuevo récord personal</span>
        )}

        <div className="gp-summary__stats">
          <div className="gp-summary__stat">
            <span className="gp-summary__stat-val">{correct}</span>
            <span className="gp-summary__stat-lbl">correctas</span>
          </div>
          <div className="gp-summary__stat-div" />
          <div className="gp-summary__stat">
            <span className="gp-summary__stat-val">{ROUNDS - correct}</span>
            <span className="gp-summary__stat-lbl">falladas</span>
          </div>
          <div className="gp-summary__stat-div" />
          <div className="gp-summary__stat">
            <span className="gp-summary__stat-val">{ROUNDS}</span>
            <span className="gp-summary__stat-lbl">rondas</span>
          </div>
        </div>

        <div className="gp-summary__history">
          {history.map((h, i) => (
            <div key={i} className={`gp-summary__hist-item gp-summary__hist-item--${h.win ? 'win' : 'lose'}`}>
              <div className="gp-summary__hist-img">
                <img src={h.char.image} alt={h.char.name} loading="lazy" decoding="async" />
              </div>
              <span className="gp-summary__hist-mark">{h.win ? '✔' : '✕'}</span>
            </div>
          ))}
        </div>

        <div className="gp-ranking">
          <h3 className="gp-ranking__title">Ranking global</h3>
          {!rankingFetched ? (
            <p className="gp-ranking__loading">Cargando...</p>
          ) : ranking.length === 0 ? (
            <p className="gp-ranking__loading">Sin datos aún.</p>
          ) : (
            <ol className="gp-ranking__list">
              {ranking.map((entry, i) => (
                <li key={i} className={`gp-ranking__row${i === 0 ? ' gp-ranking__row--first' : ''}`}>
                  <span className="gp-ranking__pos">{i + 1}</span>
                  <span className="gp-ranking__name">{entry.username}</span>
                  <span className="gp-ranking__score">{entry.best_score} pts</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="gp-summary__actions">
          <button className="gp-start-btn" onClick={onStartGame}>Jugar de nuevo</button>
          <button className="gp-back-btn" onClick={() => navigate(ROUTES.HOME)}>Inicio</button>
          <button className="gp-back-btn" onClick={onShare}>
            {shareCopied ? '✓ ¡Copiado!' : '↗ Compartir'}
          </button>
        </div>
      </div>
    </div>
  )
}
