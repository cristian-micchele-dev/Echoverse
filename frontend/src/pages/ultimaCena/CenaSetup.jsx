import { Helmet } from 'react-helmet-async'
import { characters } from '../../data/characters'
import { MESA_TEMAS } from '../../data/mesaTemas'
import { ROUTES } from '../../utils/constants'
import { MIN_COMENSALES, MAX_COMENSALES } from './constants.js'

export default function CenaSetup({ visible, selected, tema, search, onToggleChar, onSetTema, onSetSearch, onStart, navigate }) {
  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.universe.toLowerCase().includes(search.toLowerCase())
  )

  const isCharSelected = (char) => selected.some(c => c.id === char.id)
  const getSlotIndex = (char) => selected.findIndex(c => c.id === char.id)

  return (
    <div className={`cena-page ${visible ? 'cena-page--visible' : ''}`}>
      <Helmet>
        <title>La Última Cena — EchoVerse</title>
        <meta name="description" content="Elegí 5 personajes icónicos para tu última cena imaginaria. ¿Con quién querrías compartir la mesa? Sherlock, Gandalf, Joker y más." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/ultima-cena" />
      </Helmet>
      <div className="cena-bg" aria-hidden="true" />

      <header className="cena-header">
        <button className="cena-back-btn" onClick={() => navigate(ROUTES.HOME)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <div className="cena-header__title">
          <span className="cena-header__eyebrow">Multijugador Narrativo</span>
          <h1>Última Cena</h1>
          <p>Elegí 3 o 4 personajes. Dirigite a uno o lanzá un tema — la mesa reacciona.</p>
        </div>
      </header>

      <div className="cena-setup">
        <div className="cena-slots">
          {Array.from({ length: MAX_COMENSALES }, (_, i) => i).map(i => {
            const char = selected[i]
            return (
              <div
                key={i}
                className={`cena-slot ${char ? 'cena-slot--filled' : 'cena-slot--empty'} ${i >= MIN_COMENSALES ? 'cena-slot--optional' : ''}`}
                style={char ? { '--slot-color': char.themeColor } : {}}
              >
                {char ? (
                  <>
                    <img src={char.image} alt={char.name} onError={e => e.target.style.display='none'} />
                    <span className="cena-slot__name">{char.name.split(' ')[0]}</span>
                    <button className="cena-slot__remove" onClick={() => onToggleChar(char)}>✕</button>
                  </>
                ) : (
                  <>
                    <div className="cena-slot__plus">+</div>
                    <span className="cena-slot__placeholder">
                      {i < MIN_COMENSALES ? `Asiento ${i + 1}` : 'Opcional'}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="cena-temas">
          <span className="cena-temas__label">Tema de mesa</span>
          <div className="cena-temas__grid">
            {MESA_TEMAS.map(t => (
              <button
                key={t.id}
                className={`cena-tema-btn ${tema === t.id ? 'cena-tema-btn--active' : ''}`}
                onClick={() => onSetTema(t.id)}
              >
                <span className="cena-tema-btn__label">{t.label}</span>
                <span className="cena-tema-btn__desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="cena-search-wrap">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className="cena-search-input"
            type="text"
            placeholder="Buscar personaje..."
            value={search}
            onChange={e => onSetSearch(e.target.value)}
          />
          {search && <button className="cena-search-clear" onClick={() => onSetSearch('')}>✕</button>}
        </div>

        <div className="cena-char-grid">
          {filtered.map(char => {
            const slotIdx = getSlotIndex(char)
            const full = !isCharSelected(char) && selected.length >= MAX_COMENSALES
            return (
              <button
                key={char.id}
                className={`cena-char-btn ${isCharSelected(char) ? 'cena-char-btn--selected' : ''} ${full ? 'cena-char-btn--disabled' : ''}`}
                style={{ '--char-color': char.themeColor }}
                onClick={() => onToggleChar(char)}
                disabled={full}
              >
                {slotIdx >= 0 && <span className="cena-char-slot">{slotIdx + 1}</span>}
                <div className="cena-char-img">
                  <img src={char.image} alt={char.name} />
                </div>
                <span className="cena-char-name">{char.name}</span>
              </button>
            )
          })}
        </div>

        <button
          className="cena-start-btn"
          onClick={onStart}
          disabled={selected.length < MIN_COMENSALES}
        >
          🍷 Sentarse a la mesa
        </button>
      </div>
    </div>
  )
}
