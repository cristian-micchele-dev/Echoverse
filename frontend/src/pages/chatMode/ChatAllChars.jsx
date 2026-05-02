import { characters } from '../../data/characters'
import CharacterCard from '../../components/CharacterCard/CharacterCard'
import { CHARACTER_CATEGORIES, CATEGORY_CHIPS, CHARACTER_ORDER } from '../../data/characterConfig'
import { isRankSufficient } from '../../utils/affinity'

export default function ChatAllChars({ search, selectedCategory, selectedId, onSearch, onSelectCategory, onSelect, session, userRank, communityChars }) {
  const filtered = characters
    .filter(c => {
      const matchesSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.universe.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || CHARACTER_CATEGORIES[c.id] === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      const ai = CHARACTER_ORDER.indexOf(a.id)
      const bi = CHARACTER_ORDER.indexOf(b.id)
      return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
    })

  return (
    <>
      <div className="chat-mode-search-wrap">
        <svg className="chat-mode-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          className="chat-mode-search"
          placeholder="Buscar personaje o universo..."
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      <div className="chat-mode-chips" role="group" aria-label="Filtrar por categoría">
        {CATEGORY_CHIPS.map(({ key, label }) => (
          <button
            key={key}
            className={`chat-mode-chip${selectedCategory === key ? ' chat-mode-chip--active' : ''}`}
            onClick={() => onSelectCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="chat-mode-grid">
        {filtered.map((char, i) => (
          <CharacterCard
            key={char.id}
            character={char}
            index={i}
            onSelect={onSelect}
            selected={selectedId === char.id}
            locked={!!(char.unlockRank && (!session || !isRankSufficient(userRank, char.unlockRank)))}
          />
        ))}
      </div>

      {filtered.length === 0 && search && (
        <div className="chat-mode-empty">
          <span className="chat-mode-empty__icon">🔍</span>
          <p className="chat-mode-empty__text">
            No encontramos personajes con <strong>"{search}"</strong>
          </p>
          <button className="chat-mode-empty__clear" onClick={() => onSearch('')}>
            Limpiar búsqueda
          </button>
        </div>
      )}

      {session && !search && communityChars.length > 0 && (
        <div className="community-section">
          <div className="community-section__header">
            <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
              <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="15" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M1 18c0-3 2.8-4.5 7-4.5S15 15 15 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M15 13.5c2.5 0 5 1.2 5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span>Creados por la comunidad</span>
          </div>
          <div className="custom-chars-list">
            {communityChars.map(char => (
              <div
                key={char.id}
                className="custom-char-item"
                style={{ '--ci-color': char.color || '#7252E8' }}
                onClick={() => onSelect(`custom-${char.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onSelect(`custom-${char.id}`)}
              >
                <div className="custom-char-item__avatar">
                  {char.avatar_url
                    ? <img src={char.avatar_url} alt={char.name} loading="lazy" />
                    : <span>{char.emoji || '🤖'}</span>
                  }
                </div>
                <div className="custom-char-item__info">
                  <span className="custom-char-item__name">{char.name}</span>
                  <span className="custom-char-item__tag">🌐 Comunidad</span>
                </div>
                <svg className="custom-char-item__arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
