import './CharacterSelector.css'

// Selector de personaje reutilizable.
// Props:
//   characters — array de objetos de characters.js
//   onSelect(character) — callback
export default function CharacterSelector({ characters, onSelect }) {
  return (
    <div className="char-selector">
      {characters.map((char, i) => (
        <button
          key={char.id}
          className="char-selector__card"
          style={{
            '--char-color':    char.themeColor,
            '--char-gradient': char.gradient,
            '--card-delay':    `${i * 0.025}s`
          }}
          onClick={() => onSelect(char)}
        >
          <div
            className="char-selector__bg"
            style={{ background: char.gradient }}
          >
            {char.image && (
              <img src={char.image} alt={char.name} className="char-selector__img" loading="lazy" decoding="async" />
            )}
          </div>
          <div className="char-selector__overlay" />
          {!char.image && (
            <span className="char-selector__emoji">{char.emoji}</span>
          )}
          <div className="char-selector__info">
            <span className="char-selector__universe">{char.universe}</span>
            <span className="char-selector__name">{char.name}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
