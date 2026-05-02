import DailyChallenge from '../../components/DailyChallenge/DailyChallenge'

export default function DashFeatured({ featured, featuredChar, countdown, navigate }) {
  return (
    <section className="dash-section">
      <div className="dash-section-header">
        <span className="dash-eyebrow">Hoy <span className="dash-eyebrow__rule" /></span>
        <div className="dash-section-header__row">
          <h2 className="dash-section-title">El universo<br /><em>y el desafío.</em></h2>
          <span className="dash-countdown">Cambia en {countdown}</span>
        </div>
      </div>
      <div className="dash-hoy-grid">
        {featured && featuredChar && (
          <div
            className="dash-featured"
            style={{ '--char-color': featuredChar.themeColor, '--char-gradient': featuredChar.gradient }}
            onClick={() => navigate(featured.route)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate(featured.route)}
          >
            <div className="dash-featured__body">
              <span className="dash-featured__badge">{featured.badge}</span>
              <h3 className="dash-featured__hook">
                {featured.hook}
                <span className="dash-featured__hook-accent"> {featured.hookAccent}</span>
              </h3>
              <button
                className="dash-featured__cta"
                onClick={e => { e.stopPropagation(); navigate(featured.route) }}
              >
                {featured.cta}
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="dash-featured__img-wrap">
              <img src={featuredChar.image} alt={featuredChar.name} className="dash-featured__img" />
              <div className="dash-featured__img-fade" />
            </div>
          </div>
        )}
        <DailyChallenge />
      </div>
    </section>
  )
}
