import { characterMap } from '../../data/characters'
import './Feedback.css'

export default function Feedback({ result }) {
  const { chosenId, isTimeout, insight, explanation } = result

  const chosenChar = chosenId ? characterMap[chosenId] : null

  if (isTimeout) {
    return (
      <div className="fb fb--timeout">
        <div className="fb__left">
          <span className="fb__icon" aria-hidden="true">⏱</span>
        </div>
        <div className="fb__body">
          <p className="fb__verdict">Se acabó el tiempo</p>
          <p className="fb__line">¿En qué estabas pensando?</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fb fb--reveal"
      style={{ '--chosen-color': chosenChar?.themeColor ?? '#a78bfa' }}
    >
      <div className="fb__left">
        {chosenChar && (
          <div className="fb__avatar">
            <img src={chosenChar.image} alt={chosenChar.name} />
          </div>
        )}
      </div>
      <div className="fb__body">
        <p className="fb__verdict">
          Elegiste a <strong>{chosenChar?.name ?? chosenId}</strong>
        </p>
        {insight && <p className="fb__insight">{insight}</p>}
        {explanation && <p className="fb__line">{explanation}</p>}
      </div>
    </div>
  )
}
