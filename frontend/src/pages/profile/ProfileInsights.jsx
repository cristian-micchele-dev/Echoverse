export default function ProfileInsights({
  activityGrid, favMode,
  guessScore, dilemasCount, customCharsCount,
  animGuess, animDilemas, animCustom,
}) {
  const hasMiniStats = guessScore > 0 || dilemasCount > 0 || customCharsCount > 0

  return (
    <>
      <div className="pp-insights">
        <div className="pp-activity">
          <span className="pp-activity__label">Actividad — últimos 28 días</span>
          <div className="pp-activity__grid">
            {activityGrid.map((day, i) => {
              const intensity = day.count === 0 ? 0 : day.count < 5 ? 1 : day.count < 15 ? 2 : 3
              return (
                <div
                  key={i}
                  className={`pp-activity__day pp-activity__day--${intensity}`}
                  title={day.count > 0 ? `${day.count} mensajes` : 'Sin actividad'}
                />
              )
            })}
          </div>
        </div>
        {favMode && (
          <div className="pp-fav-mode">
            <span className="pp-fav-mode__label">Modo favorito</span>
            <span className="pp-fav-mode__emoji">{favMode.emoji}</span>
            <span className="pp-fav-mode__name">{favMode.label}</span>
            <span className="pp-fav-mode__count">{favMode.count}x jugado</span>
          </div>
        )}
      </div>

      {hasMiniStats && (
        <div className="pp-mini-stats">
          {guessScore > 0 && (
            <div className="pp-mini-stat">
              <span className="pp-mini-stat__icon">🎯</span>
              <span className="pp-mini-stat__num">{animGuess}</span>
              <span className="pp-mini-stat__label">Mejor puntaje Adivina</span>
            </div>
          )}
          {dilemasCount > 0 && (
            <div className="pp-mini-stat">
              <span className="pp-mini-stat__icon">⚖️</span>
              <span className="pp-mini-stat__num">{animDilemas}</span>
              <span className="pp-mini-stat__label">Dilemas vistos</span>
            </div>
          )}
          {customCharsCount > 0 && (
            <div className="pp-mini-stat">
              <span className="pp-mini-stat__icon">🤖</span>
              <span className="pp-mini-stat__num">{animCustom}</span>
              <span className="pp-mini-stat__label">Personajes creados</span>
            </div>
          )}
        </div>
      )}
    </>
  )
}
