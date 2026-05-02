export default function ProfileSkeleton({ fetchError, onRetry }) {
  return (
    <div className="pp-skeleton-layout">
      <div className="pp-section">
        <div className="skeleton pp-skeleton-title" />
        <div className="skeleton pp-skeleton-block" />
      </div>
      <div className="pp-section">
        <div className="skeleton pp-skeleton-title" />
        <div className="pp-skeleton-cards">
          {[1, 2, 3].map(i => <div key={i} className="skeleton pp-skeleton-card" />)}
        </div>
      </div>
      <div className="pp-section">
        <div className="skeleton pp-skeleton-title" />
        <div className="pp-skeleton-cards">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton pp-skeleton-ach" />)}
        </div>
      </div>
      {fetchError && (
        <div className="pp-error-banner">
          <span>⚠️ No se pudieron cargar algunos datos.</span>
          <button className="pp-retry-btn" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}
