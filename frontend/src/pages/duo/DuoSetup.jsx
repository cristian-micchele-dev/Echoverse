import { Helmet } from 'react-helmet-async'
import { characters } from '../../data/characters'
import { ROUTES } from '../../utils/constants'

export default function DuoSetup({ charA, charB, search, onSelectChar, onSetSearch, onStart, navigate }) {
  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.universe.toLowerCase().includes(search.toLowerCase())
  )

  const isSelected = (char) => charA?.id === char.id || charB?.id === char.id
  const getSlot = (char) => charA?.id === char.id ? 'A' : charB?.id === char.id ? 'B' : null

  return (
    <div className="duo-page">
      <Helmet>
        <title>Duelo de Personajes — EchoVerse</title>
        <meta name="description" content="Enfrentá dos personajes icónicos en una conversación épica. Elegí quién debate con quién y observá cómo chocan sus filosofías." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/duo" />
      </Helmet>

      <header className="duo-header">
        <button className="duo-back-btn" onClick={() => navigate(ROUTES.HOME)} aria-label="Volver al inicio">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <div className="duo-header__title">
          <span className="duo-header__eyebrow">Modo especial</span>
          <h1>💬 Chat en Alianza</h1>
          <p>Elegí dos personajes y chateá con los dos a la vez.</p>
        </div>
      </header>

      <div className="duo-setup">
        <div className="duo-slots">
          <div className={`duo-slot ${charA ? 'duo-slot--filled' : 'duo-slot--empty'}`}>
            {charA ? (
              <>
                <img src={charA.image} alt={charA.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
                <span>{charA.name}</span>
              </>
            ) : <span className="duo-slot__placeholder">Personaje 1</span>}
          </div>
          <div className="duo-and">+</div>
          <div className={`duo-slot ${charB ? 'duo-slot--filled' : 'duo-slot--empty'}`}>
            {charB ? (
              <>
                <img src={charB.image} alt={charB.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
                <span>{charB.name}</span>
              </>
            ) : <span className="duo-slot__placeholder">Personaje 2</span>}
          </div>
        </div>

        <div className="duo-search-wrap">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className="duo-search-input"
            type="text"
            placeholder="Buscar personaje..."
            value={search}
            onChange={e => onSetSearch(e.target.value)}
            aria-label="Buscar personaje"
          />
          {search && <button className="duo-search-clear" onClick={() => onSetSearch('')}>✕</button>}
        </div>

        <div className="duo-char-grid" role="list">
          {filtered.map(char => (
            <button
              key={char.id}
              className={`duo-char-btn ${isSelected(char) ? 'duo-char-btn--selected' : ''}`}
              style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient }}
              onClick={() => onSelectChar(char)}
              aria-label={`${isSelected(char) ? 'Quitar' : 'Agregar'} ${char.name}`}
              aria-pressed={isSelected(char)}
              role="listitem"
            >
              {getSlot(char) && <span className="duo-char-slot">{getSlot(char)}</span>}
              <div className="duo-char-img">
                <img src={char.image} alt={char.name} loading="lazy" decoding="async" />
              </div>
              <span className="duo-char-name">{char.name}</span>
            </button>
          ))}
        </div>

        <button
          className="duo-start-btn"
          onClick={onStart}
          disabled={!charA || !charB}
        >
          💬 Iniciar Alianza
        </button>
      </div>
    </div>
  )
}
