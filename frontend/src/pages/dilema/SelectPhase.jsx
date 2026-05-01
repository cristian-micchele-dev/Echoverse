import { useState } from 'react'
import { characters } from '../../data/characters'
import { RECOMMENDED_CHAR_IDS } from '../../data/dilemas'

export default function SelectPhase({ onSelect, onBack }) {
  const [filter, setFilter] = useState('recommended')

  const displayed = filter === 'recommended'
    ? characters.filter(c => RECOMMENDED_CHAR_IDS.has(c.id))
    : characters

  return (
    <div className="dilema-phase dilema-select">
      <div className="dilema-select__header">
        <button className="dilema-back-btn" onClick={onBack}>← Volver</button>
        <div className="dilema-select__title-block">
          <span className="dilema-eyebrow">Modo</span>
          <h1 className="dilema-title-hero">DILEMAS</h1>
          <p className="dilema-subtitle-hero">No todas las decisiones tienen una respuesta correcta.<br />Algunas solo tienen un precio.</p>
        </div>

        <div className="dilema-filter-tabs" role="group" aria-label="Filtrar personajes">
          <button
            className={`dilema-filter-tab ${filter === 'recommended' ? 'dilema-filter-tab--active' : ''}`}
            onClick={() => setFilter('recommended')}
            aria-pressed={filter === 'recommended'}
          >
            Recomendados
          </button>
          <button
            className={`dilema-filter-tab ${filter === 'all' ? 'dilema-filter-tab--active' : ''}`}
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
          >
            Todos
          </button>
        </div>
      </div>

      <div className="dilema-char-grid" role="list">
        {displayed.map(char => (
          <button
            key={char.id}
            className="dilema-char-card"
            style={{ '--card-color': char.themeColor }}
            onClick={() => onSelect(char)}
            aria-label={`Jugar dilemas con ${char.name} (${char.universe})`}
            role="listitem"
          >
            <div className="dilema-char-card__img-wrap">
              <img
                src={char.image}
                alt={char.name}
                className="dilema-char-card__img"
                onError={e => { e.currentTarget.style.opacity = '0' }}
              />
              <div className="dilema-char-card__glow" />
            </div>
            <div className="dilema-char-card__info">
              <span className="dilema-char-card__name">{char.name}</span>
              <span className="dilema-char-card__universe">{char.universe}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
