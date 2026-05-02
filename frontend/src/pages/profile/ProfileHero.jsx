import { ROUTES } from '../../utils/constants'

export default function ProfileHero({
  initial, displayName, rank,
  animChars, animMsgs, animLevels, animStreak,
  user, navigate,
  onLogout, onDeleteAccount,
}) {
  return (
    <div className="pp-hero">
      <div className="pp-hero__inner">
        <button className="pp-back" onClick={() => navigate(ROUTES.HOME)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver
        </button>

        <div className="pp-hero__profile">
          <div className="pp-avatar">{initial}</div>
          <div className="pp-hero__meta">
            <h1 className="pp-username">{displayName}</h1>
            <span className="pp-tag" style={{ color: rank.color }}>EchoVerse · {rank.label}</span>
          </div>
        </div>

        <div className="pp-stats">
          <div className="pp-stat">
            <svg className="pp-stat__icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            <span className="pp-stat__num">{animChars}</span>
            <span className="pp-stat__label">Personajes</span>
          </div>
          <div className="pp-stats__rule" />
          <div className="pp-stat">
            <svg className="pp-stat__icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-5 4V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
            </svg>
            <span className="pp-stat__num">{animMsgs}</span>
            <span className="pp-stat__label">Mensajes</span>
          </div>
          <div className="pp-stats__rule" />
          <div className="pp-stat">
            <svg className="pp-stat__icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
            </svg>
            <span className="pp-stat__num">{animLevels}</span>
            <span className="pp-stat__label">Niveles</span>
          </div>
          <div className="pp-stats__rule" />
          <div className="pp-stat pp-stat--streak">
            <svg className="pp-stat__icon pp-stat__icon--streak" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-3-2-5-2-5s0 3-3 4c2-4 0-9 0-9z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
            </svg>
            <span className="pp-stat__num">{animStreak}</span>
            <span className="pp-stat__label">Racha</span>
          </div>
        </div>

        {user?.email === 'cristian.aiki1@gmail.com' && (
          <button className="pp-admin-link" onClick={() => navigate(ROUTES.ADMIN)}>Panel admin</button>
        )}
        <button className="pp-logout" onClick={onLogout}>Cerrar sesión</button>
        <button className="pp-delete-account" onClick={onDeleteAccount}>Eliminar cuenta</button>
      </div>
    </div>
  )
}
