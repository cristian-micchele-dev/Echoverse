export default function DashNav({ initial, username, loggingOut, onNavigateDash, onNavigatePerfil, onLogout }) {
  return (
    <nav className="dash-nav">
      <button className="dash-nav__brand" onClick={onNavigateDash}>
        <span className="dash-nav__brand-echo">Echo</span>
        <span className="dash-nav__brand-verse">Verse</span>
      </button>
      <div className="dash-nav__actions">
        <button
          className="dash-nav__profile"
          onClick={onNavigatePerfil}
          title="Ver perfil"
        >
          <span className="dash-nav__profile-avatar">{initial}</span>
          <span className="dash-nav__profile-name">{username}</span>
        </button>
        <button
          className="dash-nav__logout"
          onClick={onLogout}
          disabled={loggingOut}
          title="Cerrar sesión"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
