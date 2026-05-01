import { BENEFITS } from './constants.js'
import ArrowIcon from './ArrowIcon.jsx'

function BenefitIcon({ name }) {
  if (name === 'fire') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2c0 0-5 5.5-5 10a5 5 0 0 0 10 0c0-2-1-4-2-5 0 2-1.5 3-2.5 3C11 8 12 2 12 2z"/>
    </svg>
  )
  if (name === 'cloud') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
    </svg>
  )
  if (name === 'puzzle') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <circle cx="7" cy="7" r="1" fill="currentColor"/>
    </svg>
  )
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function BenefitsPanel({ onRegister }) {
  return (
    <div className="lp-benefits lp-reveal">
      <div className="lp-benefits__header">
        <span className="lp-eyebrow lp-eyebrow--inline">
          SOLO REGISTRADOS
          <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
        </span>
        <h2 className="lp-section-title">
          Tu progreso,<br /><em>donde vayas.</em>
        </h2>
        <p className="lp-benefits__sub">Gratis. Sin tarjeta. En 30 segundos.</p>
      </div>
      <div className="lp-benefits__grid">
        {BENEFITS.map((b, i) => (
          <div
            key={b.icon}
            className="lp-benefit-card lp-reveal"
            style={{ '--reveal-delay': `${i * 0.08}s` }}
          >
            <div className="lp-benefit-card__icon">
              <BenefitIcon name={b.icon} />
            </div>
            <span className="lp-benefit-card__title">{b.title}</span>
            <p className="lp-benefit-card__desc">{b.desc}</p>
          </div>
        ))}
      </div>
      <button className="lp-btn lp-btn--primary" onClick={onRegister}>
        Registrarse gratis <ArrowIcon size={15} />
      </button>
    </div>
  )
}
