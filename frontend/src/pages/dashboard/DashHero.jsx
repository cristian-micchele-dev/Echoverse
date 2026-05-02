import { getGreeting } from './utils.js'

export default function DashHero({ initial, username, heroContext, fetchingStats, streakDisplay, charsDisplay, messagesDisplay }) {
  return (
    <section className="dash-hero">
      <div className="dash-hero__inner">
        <div className="dash-hero__id">
          <div className="dash-avatar">{initial}</div>
          <div>
            <p className="dash-hero__eyebrow">{getGreeting()}</p>
            <h1 className="dash-hero__name">{username}</h1>
            {heroContext && (
              <span className="dash-hero__context">{heroContext}</span>
            )}
          </div>
        </div>
        <div className="dash-stats">
          <div className="dash-stat">
            <svg className="dash-stat__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C9 7 5 9 5 14a7 7 0 0 0 14 0c0-5-4-7-7-12zm0 17a5 5 0 0 1-5-5c0-3.5 2.5-5.5 5-9 2.5 3.5 5 5.5 5 9a5 5 0 0 1-5 5zm-2-2.5a3 3 0 0 0 4-2.5c0-1.5-1-2.5-2-4-1 1.5-2 2.5-2 4a3 3 0 0 0 0 2.5z"/>
            </svg>
            {fetchingStats
              ? <span className="dash-skeleton dash-skeleton--val" />
              : <span className="dash-stat__value">{streakDisplay}</span>}
            <span className="dash-stat__label">días de racha</span>
          </div>
          <div className="dash-stat-sep" />
          <div className="dash-stat">
            <svg className="dash-stat__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
            {fetchingStats
              ? <span className="dash-skeleton dash-skeleton--val" />
              : <span className="dash-stat__value">{charsDisplay}</span>}
            <span className="dash-stat__label">personajes</span>
          </div>
          <div className="dash-stat-sep" />
          <div className="dash-stat">
            <svg className="dash-stat__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 11H7v-2h10v2zm0-3H7V8h10v2z"/>
            </svg>
            {fetchingStats
              ? <span className="dash-skeleton dash-skeleton--val" />
              : <span className="dash-stat__value">{messagesDisplay}</span>}
            <span className="dash-stat__label">mensajes</span>
          </div>
        </div>
      </div>
      <div className="dash-hero__fade" />
    </section>
  )
}
