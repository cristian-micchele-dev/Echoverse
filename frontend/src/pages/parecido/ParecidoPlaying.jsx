import { OPTION_LETTERS } from './constants.js'
import ParecidoBg from './ParecidoBg.jsx'

export default function ParecidoPlaying({ bgVisible, question, currentIndex, total, selected, animating, onAnswer, onAbort }) {
  const progress = (currentIndex / total) * 100

  return (
    <div className="par-page par-page--playing">
      <ParecidoBg visible={bgVisible} />
      <div className="par-progress-bar">
        <div className="par-progress-bar__fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="par-play-header">
        <button className="par-back-btn par-back-btn--sm" onClick={onAbort}>
          ✕
        </button>
        <span className="par-question-num">{currentIndex + 1} / {total}</span>
      </div>

      <div className="par-play-body">
        <p className="par-question-text">{question.text}</p>

        <div className="par-options">
          {question.options.map((opt, i) => (
            <button
              key={i}
              className={`par-option ${selected === i ? 'par-option--chosen' : ''} ${selected !== null && selected !== i ? 'par-option--out' : ''}`}
              onClick={() => onAnswer(i)}
              disabled={animating}
            >
              <span className="par-option__letter">{OPTION_LETTERS[i]}</span>
              <span className="par-option__text">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
