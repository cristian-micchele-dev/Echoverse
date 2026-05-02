export default function DashCast({ popularChars, chattedCharIds, popularRef, navigate }) {
  return (
    <section className="dash-section">
      <div className="dash-section-header">
        <span className="dash-eyebrow">Elenco <span className="dash-eyebrow__rule" /></span>
        <h2 className="dash-section-title">
          {chattedCharIds.size === 0 ? <>Empezá a<br /><em>conocerlos.</em></> : <>Con quién<br /><em>vas hoy.</em></>}
        </h2>
      </div>
      <div className="dash-popular-scroll" ref={popularRef}>
        {popularChars.map(char => {
          const known = chattedCharIds.has(char.id)
          return (
            <button
              key={char.id}
              className={`dash-popular-card${known ? ' dash-popular-card--known' : ''}`}
              style={{ '--char-color': char.themeColor }}
              onClick={() => navigate(`/chat/${char.id}`)}
            >
              <div className="dash-popular-card__img-wrap">
                <img src={char.image} alt={char.name} className="dash-popular-card__img" />
                <div className="dash-popular-card__fade" />
                {known && <span className="dash-popular-card__known">✓</span>}
                <div className="dash-popular-card__footer">
                  <span className="dash-popular-card__name">{char.name.split(' ')[0]}</span>
                  <span className="dash-popular-card__action">{known ? 'Volver' : 'Chatear'}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
