import { getSituationById } from '../../data/situations'
import './MissionSummary.css'

const RESULT_META = {
  win:     { label: 'Éxito',   icon: '✓', cls: 'win' },
  partial: { label: 'Parcial', icon: '◑', cls: 'partial' },
  fail:    { label: 'Fallo',   icon: '✕', cls: 'fail' },
  chaos:   { label: 'Caos',    icon: '⚡', cls: 'chaos' }
}

export default function MissionSummary({ mission, character, results, finalStatus, onReplay, onHome }) {
  const ending = mission.endings[finalStatus] || mission.endings.fail
  const wins   = results.filter(r => r.outcome.result === 'win').length
  const fails  = results.filter(r => r.outcome.result === 'fail').length

  return (
    <div
      className={`mission-summary mission-summary--${finalStatus}`}
      style={{ '--char-color': character.themeColor }}
    >
      {/* Header */}
      <div className="mission-summary__header">
        <div className="mission-summary__char">
          {character.image
            ? <img src={character.image} alt={character.name} className="mission-summary__avatar" />
            : <span className="mission-summary__avatar-emoji">{character.emoji}</span>
          }
        </div>
        <div className={`mission-summary__badge mission-summary__badge--${finalStatus}`}>
          {ending.title}
        </div>
        <p className="mission-summary__narrative">{ending.narrative}</p>
      </div>

      {/* Score */}
      <div className="mission-summary__score">
        <div className="mission-summary__score-item mission-summary__score-item--win">
          <span className="mission-summary__score-num">{wins}</span>
          <span className="mission-summary__score-label">Éxitos</span>
        </div>
        <div className="mission-summary__score-divider" />
        <div className="mission-summary__score-item mission-summary__score-item--fail">
          <span className="mission-summary__score-num">{fails}</span>
          <span className="mission-summary__score-label">Fallos</span>
        </div>
        <div className="mission-summary__score-divider" />
        <div className="mission-summary__score-item">
          <span className="mission-summary__score-num">{results.length}</span>
          <span className="mission-summary__score-label">Decisiones</span>
        </div>
      </div>

      {/* Decisiones */}
      <div className="mission-summary__decisions">
        <p className="mission-summary__decisions-label">Tu camino</p>
        {results.map((r, i) => {
          const sit  = getSituationById(r.situationId)
          const meta = RESULT_META[r.outcome.result]
          return (
            <div key={i} className={`mission-summary__step mission-summary__step--${meta.cls}`}>
              <span className="mission-summary__step-num">{i + 1}</span>
              <div className="mission-summary__step-body">
                <span className="mission-summary__step-scene">
                  {sit ? sit.text.slice(0, 55) + (sit.text.length > 55 ? '…' : '') : r.situationId}
                </span>
                <span className={`mission-summary__step-result mission-summary__step-result--${meta.cls}`}>
                  {meta.icon} {meta.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Acciones */}
      <div className="mission-summary__actions">
        <button className="mission-summary__btn mission-summary__btn--replay" onClick={onReplay}>
          🔄 Nueva misión
        </button>
        <button className="mission-summary__btn mission-summary__btn--home" onClick={onHome}>
          🏠 Inicio
        </button>
      </div>
    </div>
  )
}
