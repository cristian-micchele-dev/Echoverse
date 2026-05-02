import { Helmet } from 'react-helmet-async'
import { characters } from '../../data/characters'
import { ROUTES } from '../../utils/constants'

export default function SwipeChars({ navigate, error, onSelectChar }) {
  return (
    <div className="swipe-page">
      <Helmet>
        <title>Verdad o Mentira — EchoVerse</title>
        <meta name="description" content="¿Verdad o mentira? Respondé en segundos sobre los personajes más icónicos del cine y la TV." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/swipe" />
      </Helmet>
      <div className="swipe-top-bar">
        <button className="swipe-back-btn" onClick={() => navigate(ROUTES.HOME)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
      </div>
      <div className="swipe-intro">
        <span className="swipe-intro__eyebrow">👆 Swipe</span>
        <h1 className="swipe-intro__title">¿Verdad o Mentira?</h1>
        <p className="swipe-intro__sub">El personaje te lanza afirmaciones de su universo. Deslizá para responder.</p>
        {error && <p className="swipe-error">{error}</p>}
      </div>
      <div className="swipe-chars-grid">
        {characters.map((char, i) => (
          <button
            key={char.id}
            className="swipe-char-card"
            style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient, '--card-delay': `${i * 0.03}s` }}
            onClick={() => onSelectChar(char)}
          >
            <div className="swipe-char-card__bg" style={{ background: char.gradient }}>
              {char.image && <img src={char.image} alt={char.name} className="swipe-char-card__img" loading="lazy" decoding="async" />}
            </div>
            <div className="swipe-char-card__overlay" />
            <div className="swipe-char-card__info">
              <span className="swipe-char-card__universe">{char.universe}</span>
              <span className="swipe-char-card__name">{char.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
