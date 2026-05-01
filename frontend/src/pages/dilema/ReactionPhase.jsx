function VoteBreakdown({ votes, choices, userChoiceKey }) {
  const total = Object.values(votes).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  return (
    <div className="dilema-votes">
      <span className="dilema-votes__title">Así votó la comunidad</span>
      {choices.map(c => {
        const count = votes[c.key] ?? 0
        const pct = Math.round((count / total) * 100)
        const isUser = c.key === userChoiceKey
        return (
          <div key={c.key} className={`dilema-votes__row ${isUser ? 'dilema-votes__row--user' : ''}`}>
            <span className="dilema-votes__key">{c.key}</span>
            <div className="dilema-votes__bar-wrap">
              <div className="dilema-votes__bar" style={{ width: `${pct}%` }} />
              <span className="dilema-votes__label">{c.label}</span>
            </div>
            <span className="dilema-votes__pct">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default function ReactionPhase({
  choice, character, narrativeState,
  reaction, isStreaming, consequenceVisible, globalVotes,
  reactionRef, roundIndex, totalRounds, onNext, onExit
}) {
  const isLast = roundIndex >= totalRounds - 1

  const charState =
    narrativeState.bondScore <= -15 ? 'broken' :
    narrativeState.bondScore < 0    ? 'distant' :
    narrativeState.tension >= 60    ? 'tense' : ''

  return (
    <div className="dilema-phase dilema-reaction">

      <button className="dilema-back-btn dilema-back-btn--exit" onClick={onExit}>✕</button>

      <div className="dilema-reaction__header">
        <div className="dilema-reaction__char-wrap">
          <img
            src={character.image}
            alt={character.name}
            className={`dilema-reaction__char-img${charState ? ` dilema-char--${charState}` : ''}`}
            onError={e => { e.currentTarget.style.opacity = '0' }}
          />
          <div className="dilema-reaction__char-glow" />
        </div>
        <div className="dilema-reaction__meta">
          <span className="dilema-eyebrow">{character.name} reacciona</span>
          <span className="dilema-reaction__choice-echo">"{choice.label}"</span>
        </div>
      </div>

      <div className="dilema-reaction__text-wrap" ref={reactionRef} aria-live="polite" aria-atomic="false">
        {reaction && (
          <p className="dilema-reaction__text">
            {reaction}
            {isStreaming && <span className="dilema-cursor" />}
          </p>
        )}
        {!reaction && isStreaming && (
          <div className="dilema-reaction__thinking">
            <span /><span /><span />
          </div>
        )}
      </div>

      {consequenceVisible && (
        <div className="dilema-consequence">
          <span className="dilema-consequence__bar" />
          <p className="dilema-consequence__text">{choice.consequence}</p>
        </div>
      )}

      {consequenceVisible && globalVotes && choice.allChoices && (
        <VoteBreakdown votes={globalVotes} choices={choice.allChoices} userChoiceKey={choice.key} />
      )}

      {consequenceVisible && !isStreaming && (
        <button className="dilema-btn-primary dilema-btn-primary--reaction" onClick={onNext}>
          {isLast ? 'Ver mi perfil' : 'Continuar'}
        </button>
      )}
    </div>
  )
}
