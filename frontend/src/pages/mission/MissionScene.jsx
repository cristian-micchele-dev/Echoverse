import { MISSION_TYPES } from './constants.jsx'

export default function MissionScene({
  isEnded, missionResult, missionTitle,
  sceneImage, imageError, onImageError, imageLoading,
  selectedChar, missionType,
  streaming, currentText, sceneKey,
  history,
}) {
  return (
    <div className={`mission-current ${isEnded ? 'mission-current--final' : ''}`}>
      {isEnded && missionResult === 'win' && (
        <div className="mission-final-badge mission-final-badge--win">✔ Misión Completada</div>
      )}
      {isEnded && missionResult === 'lose' && (
        <div className="mission-final-badge mission-final-badge--lose">✕ Misión Fallida</div>
      )}
      {missionTitle && (
        <div className="mission-title-badge">{missionTitle}</div>
      )}

      {sceneImage && !imageError ? (
        <div className="mission-scene-image">
          <img
            key={sceneImage}
            src={sceneImage}
            alt="Escena de la misión"
            onError={onImageError}
          />
        </div>
      ) : imageLoading ? (
        <div className="mission-scene-image mission-scene-image--loading">
          <span className="mission-scene-image__loading-label">Generando escena…</span>
        </div>
      ) : selectedChar?.image ? (
        <div className="mission-scene-image mission-scene-image--fallback">
          <img src={selectedChar.image} alt={selectedChar.name} />
          <div className="mission-scene-image__overlay" />
        </div>
      ) : (
        <div
          className="mission-scene-placeholder"
          style={{ '--char-gradient': selectedChar?.gradient || 'linear-gradient(135deg, #333, #111)' }}
        >
          <div className="mission-scene-placeholder__overlay" />
          <div className="mission-scene-placeholder__content">
            <span className="mission-scene-placeholder__label">Misión</span>
            <span className="mission-scene-placeholder__name">{selectedChar?.name}</span>
            <span className="mission-scene-placeholder__type">{MISSION_TYPES.find(m => m.id === missionType)?.label}</span>
          </div>
        </div>
      )}

      {!isEnded && (
        <div className="mission-turn-badge">
          {history.length === 0 ? '⚡ La misión comienza' : `— Turno ${history.length + 1}`}
        </div>
      )}

      <div key={sceneKey} className="mission-scene">
        <p className="mission-narrative">
          {currentText}
          {streaming && <span className="mission-cursor">▋</span>}
        </p>
      </div>
    </div>
  )
}
