export default function ActivePoll({ poll, myVote, onVote, onSendResult, isRoomCreator }) {
  const totalVotes = Object.keys(poll.votes).length

  function getCount(opt) {
    return Object.values(poll.votes).filter(v => v === opt).length
  }

  function getPct(opt) {
    if (!totalVotes) return 0
    return Math.round((getCount(opt) / totalVotes) * 100)
  }

  function getWinner() {
    if (!totalVotes) return null
    return poll.options.reduce((a, b) => getCount(a) >= getCount(b) ? a : b)
  }

  return (
    <div className="rchat-poll-active">
      <div className="rchat-poll-active__header">
        <span className="rchat-poll-active__icon">📊</span>
        <span className="rchat-poll-active__q">{poll.question}</span>
        <span className="rchat-poll-active__count">{totalVotes} voto{totalVotes !== 1 ? 's' : ''}</span>
      </div>
      <div className="rchat-poll-active__opts">
        {poll.options.map(opt => {
          const pct = getPct(opt)
          const voted = myVote === opt
          return (
            <button
              key={opt}
              className={`rchat-poll-option ${voted ? 'rchat-poll-option--voted' : ''} ${myVote && !voted ? 'rchat-poll-option--dim' : ''}`}
              onClick={() => onVote(opt)}
              disabled={!!myVote}
            >
              <span className="rchat-poll-option__label">{opt}</span>
              <div className="rchat-poll-option__bar-wrap">
                <div className="rchat-poll-option__bar" style={{ '--pct': `${pct}%` }} />
              </div>
              <span className="rchat-poll-option__pct">{pct}%</span>
            </button>
          )
        })}
      </div>
      {isRoomCreator && (
        <button className="rchat-poll-send-result" onClick={() => onSendResult(getWinner(), totalVotes)}>
          Enviar resultado al personaje
        </button>
      )}
    </div>
  )
}
