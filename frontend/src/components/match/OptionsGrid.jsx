import { useMemo } from 'react'
import { characters } from '../../data/characters'
import './OptionsGrid.css'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function OptionsGrid({ optionIds, onSelect, disabled, lastResult }) {
  // Shuffle once per question (stable via useMemo keyed on ids string)
  const shuffled = useMemo(
    () => shuffle(optionIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optionIds.join(',')]
  )

  const chars = shuffled.map(id => characters.find(c => c.id === id)).filter(Boolean)

  function getModifier(id) {
    if (!lastResult) return ''
    if (id === lastResult.chosenId) return 'opt--chosen'
    return 'opt--dim'
  }

  return (
    <div className={`options-grid options-grid--${chars.length}`}>
      {chars.map(char => (
        <button
          key={char.id}
          className={`opt ${getModifier(char.id)}`}
          style={{ '--char-color': char.themeColor }}
          onClick={() => !disabled && onSelect(char.id)}
          disabled={disabled}
        >
          <div className="opt__img">
            <img src={char.image} alt={char.name} />
          </div>
          <div className="opt__body">
            <span className="opt__name">{char.name}</span>
            <span className="opt__universe">{char.universe}</span>
          </div>
          <div className="opt__glow" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
