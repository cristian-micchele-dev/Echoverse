import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'

export default function InterrogationReveal({ selectedChar, revealData, onPlayAgain }) {
  const navigate = useNavigate()
  const charColor = selectedChar?.themeColor ?? '#fff'
  const { correct, isLying, hiddenTruth, cluesReview, revealText, closingLine, playerPerformance } = revealData

  return (
    <div className={`ip ip--reveal ${correct ? 'ip--correct' : 'ip--wrong'}`} style={{ '--cc': charColor }}>
      <div className="ip-bg ip-bg--dark" aria-hidden="true">
        <div className="ip-bg__spotlight ip-bg__spotlight--1" />
        <div className="ip-bg__spotlight ip-bg__spotlight--2" />
        <div className="ip-bg__vignette" />
      </div>

      <div className="ip-reveal">
        <div className={`ip-reveal__banner ${correct ? 'ip-reveal__banner--correct' : 'ip-reveal__banner--wrong'}`}>
          <span className="ip-reveal__banner-icon">{correct ? '✓' : '✗'}</span>
          <span className="ip-reveal__banner-text">
            {correct ? '¡Instinto correcto!' : 'Te engañaron'}
          </span>
        </div>

        <div className="ip-reveal__char">
          <div className="ip-reveal__char-img" style={{ '--cc': charColor }}>
            <img src={selectedChar?.image} alt={selectedChar?.name} loading="lazy" decoding="async" />
          </div>
          {closingLine && (
            <div className="ip-reveal__closing">
              <span className="ip-reveal__closing-quote">"</span>
              <p className="ip-reveal__closing-text">{closingLine}</p>
              <span className="ip-reveal__closing-quote">"</span>
            </div>
          )}
        </div>

        {revealText && (
          <div className="ip-reveal__text">
            <p className="ip-reveal__text-label">
              {isLying ? '💡 La verdad oculta' : '✓ Lo que realmente pasó'}
            </p>
            <p className="ip-reveal__text-body">{revealText}</p>
          </div>
        )}

        <div className="ip-reveal__truth">
          <span className="ip-reveal__truth-label">Verdad:</span>
          <span className="ip-reveal__truth-body">{hiddenTruth}</span>
        </div>

        {cluesReview?.length > 0 && (
          <div className="ip-reveal__clues">
            <p className="ip-reveal__clues-label">Señales que dejó:</p>
            <div className="ip-reveal__clues-list">
              {cluesReview.map((c, i) => (
                <div key={i} className="ip-clue">
                  <span className="ip-clue__num">P{c.questionIndex}</span>
                  <div className="ip-clue__body">
                    <p className="ip-clue__question">"{c.question}"</p>
                    <p className="ip-clue__clue">{c.clue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {playerPerformance && (
          <div className="ip-reveal__performance">
            <p className="ip-performance__rank">{playerPerformance.rank}</p>
            <p className="ip-performance__desc">{playerPerformance.desc}</p>
            <div className="ip-performance__stats">
              <span className="ip-performance__stat">
                <strong>{playerPerformance.totalQuestions}</strong> preguntas
              </span>
              <span className="ip-performance__stat-dot" />
              <span className="ip-performance__stat">
                <strong>{playerPerformance.pressureCount}</strong> bajo presión
              </span>
              <span className="ip-performance__stat-dot" />
              <span className="ip-performance__stat">
                <strong>{playerPerformance.evasionCount}</strong> evasiones
              </span>
            </div>
          </div>
        )}

        <div className="ip-reveal__actions">
          <button className="ip-start-btn" onClick={onPlayAgain}>
            Jugar de nuevo
          </button>
          <button className="ip-back" onClick={() => navigate(ROUTES.HOME)}>
            Inicio
          </button>
        </div>
      </div>
    </div>
  )
}
