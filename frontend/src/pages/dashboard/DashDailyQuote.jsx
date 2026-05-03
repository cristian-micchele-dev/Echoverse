import { characterMap } from '../../data/characters'

export default function DashDailyQuote({ dailyQuote, navigate }) {
  if (!dailyQuote) return null
  const char = characterMap[dailyQuote.characterId]
  if (!char) return null

  return (
    <section className="dash-section">
      <span className="dash-eyebrow">Frase del día <span className="dash-eyebrow__rule" /></span>
      <div
        className="dash-quote"
        style={{ '--char-color': char.themeColor }}
        onClick={() => navigate(`/chat/${char.id}`)}
        role="button"
        tabIndex={0}
      >
        <div className="dash-quote__img-wrap">
          <img src={char.image} alt={char.name} className="dash-quote__img" />
        </div>
        <div className="dash-quote__body">
          <p className="dash-quote__text">"{dailyQuote.quote}"</p>
          <span className="dash-quote__char">— {char.name}</span>
        </div>
      </div>
    </section>
  )
}
