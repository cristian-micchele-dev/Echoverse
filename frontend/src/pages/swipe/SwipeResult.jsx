import AchievementToast from '../../components/AchievementToast/AchievementToast'
import { ROUTES } from '../../utils/constants'

export default function SwipeResult({ selectedChar, result, answers, cards, streaming, levelUpToast, dismissLevelUp, onRestart, onPlayAgain, navigate }) {
  const score = result.score ?? 0
  const total = cards.length
  const correctCount = answers.filter(a => a.correct).length
  const pct = Math.round((correctCount / total) * 100)

  const bestKey = `swipe-best-${selectedChar?.id}`
  const prevBest = parseInt(localStorage.getItem(bestKey) || '0', 10)
  const isNewBest = score > prevBest
  if (isNewBest && total > 0) localStorage.setItem(bestKey, String(score))

  const scoreBadge = pct >= 80 ? { label: '⭐ Maestro', cls: 'swipe-badge--master' }
    : pct >= 50 ? { label: '👍 Buen intento', cls: 'swipe-badge--ok' }
    : { label: '📚 A repasar', cls: 'swipe-badge--low' }

  return (
    <div className="swipe-page swipe-page--result" style={{ '--char-color': selectedChar.themeColor }}>
      <div className="swipe-result">
        <div className="swipe-result__char">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="swipe-result__avatar" loading="lazy" decoding="async" />
            : <span className="swipe-result__emoji">{selectedChar.emoji}</span>}
        </div>
        <div className="swipe-result__score">
          <span className="swipe-result__num">{score}</span>
          <span className="swipe-result__denom">pts</span>
        </div>
        <p className="swipe-result__correct">{correctCount} / {total} correctas</p>
        <div className="swipe-result__bar-wrap">
          <div className="swipe-result__bar" style={{ '--pct': `${pct}%` }} />
        </div>
        <p className="swipe-result__pct">{pct}% correcto</p>

        <div className="swipe-result__badges">
          <span className={`swipe-badge ${scoreBadge.cls}`}>{scoreBadge.label}</span>
          {isNewBest && total > 0 && <span className="swipe-badge swipe-badge--best">🏆 Nuevo récord</span>}
          {!isNewBest && prevBest > 0 && (
            <span className="swipe-badge swipe-badge--prev">Mejor: {prevBest} pts</span>
          )}
        </div>

        {result.analysis && (
          <p className="swipe-result__analysis">
            {result.analysis}
            {streaming && <span className="swipe-cursor">▋</span>}
          </p>
        )}
        {!result.analysis && streaming && (
          <div className="swipe-loading__dots"><span /><span /><span /></div>
        )}

        {!streaming && (
          <div className="swipe-answers">
            <p className="swipe-answers__label">Respuestas</p>
            {cards.map((card, i) => {
              const userCorrect = answers[i]?.correct
              return (
                <div key={i} className={`swipe-answer ${userCorrect ? 'swipe-answer--correct' : 'swipe-answer--wrong'}`}>
                  <span className="swipe-answer__icon">{userCorrect ? '✓' : '✗'}</span>
                  <div className="swipe-answer__content">
                    <p className="swipe-answer__statement">{card.statement}</p>
                    <div className="swipe-answer__meta">
                      <span className="swipe-answer__truth">{card.answer ? 'Verdad' : 'Falso'}</span>
                      {card.difficulty && <span className="swipe-answer__diff">{card.difficulty}</span>}
                    </div>
                    {card.feedback && <p className="swipe-answer__feedback">{card.feedback}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!streaming && result.analysis && (
          <div className="swipe-result__actions">
            <button className="swipe-result-btn swipe-result-btn--primary" onClick={onPlayAgain}>
              Jugar de nuevo
            </button>
            <button className="swipe-result-btn" onClick={onRestart}>Otro personaje</button>
            <button className="swipe-result-btn" onClick={() => navigate(ROUTES.HOME)}>Inicio</button>
          </div>
        )}
      </div>
      {levelUpToast && (
        <AchievementToast achievement={levelUpToast} onDismiss={dismissLevelUp} />
      )}
    </div>
  )
}
