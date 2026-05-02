import { characters } from '../../data/characters'
import { MODES } from './constants.js'

export default function DashModes({ modeCompletions, modesRef, navigate }) {
  const exploredCount = MODES.filter(m => m.completionKey && modeCompletions[m.completionKey] > 0).length
  const trackableTotal = MODES.filter(m => m.completionKey).length

  const modeTitle = exploredCount === 0
    ? { line1: 'Todo por', line2: 'descubrir.' }
    : exploredCount < 4
    ? { line1: 'Seguís', line2: 'explorando.' }
    : exploredCount < trackableTotal
    ? { line1: 'Elegí cómo', line2: 'entrás.' }
    : { line1: 'Tu zona', line2: 'de confort.' }

  const sortedModes = [...MODES].sort((a, b) => {
    const aOrder = a.completionKey === null ? 1 : (modeCompletions[a.completionKey] || 0) === 0 ? 0 : 2
    const bOrder = b.completionKey === null ? 1 : (modeCompletions[b.completionKey] || 0) === 0 ? 0 : 2
    return aOrder - bOrder
  })

  return (
    <section className="dash-section">
      <div className="dash-section-header">
        <span className="dash-eyebrow">Modos de juego <span className="dash-eyebrow__rule" /></span>
        <div className="dash-section-header__row">
          <h2 className="dash-section-title">{modeTitle.line1}<br /><em>{modeTitle.line2}</em></h2>
          {exploredCount > 0 && (
            <span className="dash-modes-explored">{exploredCount}/{trackableTotal} explorados</span>
          )}
        </div>
      </div>
      <div className="dash-modes-grid" ref={modesRef}>
        {sortedModes.map(mode => {
          const char = characters.find(c => c.id === mode.characterId)
          const img = mode.image ?? char?.image
          const timesPlayed = mode.completionKey ? (modeCompletions[mode.completionKey] || 0) : 0
          const isNew = mode.completionKey !== null && timesPlayed === 0
          return (
            <button
              key={mode.route}
              className={`dash-mode-card${isNew ? ' dash-mode-card--new' : ''}`}
              style={{ '--mode-color': mode.color }}
              onClick={() => navigate(mode.route)}
            >
              <div className="dash-mode-card__thumb">
                {img && <img src={img} alt="" />}
                <span className="dash-mode-card__genre">{mode.eyebrow}</span>
                {isNew && <span className="dash-mode-card__new-badge">NUEVO</span>}
                {timesPlayed > 0 && (
                  <span className="dash-mode-card__played">✓ {timesPlayed}x</span>
                )}
              </div>
              <div className="dash-mode-card__info">
                <span className="dash-mode-card__label">{mode.label}</span>
                <span className="dash-mode-card__tag">{mode.tag}</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
