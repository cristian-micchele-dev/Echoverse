import { DIFFICULTIES, MISSION_TYPES, MISSION_TYPE_ICONS } from './constants.jsx'

export default function MissionSetup({
  campaignMode,
  selectedChar,
  selectedLevel,
  playerName,
  setPlayerName,
  playerAlias,
  difficulty,
  setDifficulty,
  missionType,
  setMissionType,
  nameInputRef,
  handleStartMission,
  onBack,
}) {
  const step1Done = campaignMode || playerName.trim().length > 0
  const activeDiff = DIFFICULTIES.find(d => d.id === difficulty)

  return (
    <div className="mission-page mission-page--setup" style={{ '--char-color': selectedChar.themeColor }}>
      <div className="mission-top-bar">
        <button className="mission-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
      </div>

      <div className="mission-setup">
        {!campaignMode && (
          <div className="mission-setup__steps">
            <div className={`mission-setup__step-dot ${step1Done ? 'mission-setup__step-dot--done' : 'mission-setup__step-dot--active'}`} />
            <div className={`mission-setup__step-line ${step1Done ? 'mission-setup__step-line--done' : ''}`} />
            <div className={`mission-setup__step-dot ${step1Done ? 'mission-setup__step-dot--done' : ''}`} />
            <div className={`mission-setup__step-line ${step1Done ? 'mission-setup__step-line--done' : ''}`} />
            <div className={`mission-setup__step-dot ${step1Done ? 'mission-setup__step-dot--active' : ''}`} />
          </div>
        )}

        <div className="mission-setup__char">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="mission-setup__avatar" loading="lazy" decoding="async" />
            : <span className="mission-setup__emoji">{selectedChar.emoji}</span>
          }
          <p className="mission-setup__char-name">{selectedChar.name}</p>
          <p className="mission-setup__char-universe">{selectedChar.universe}</p>
          {campaignMode && selectedLevel && (
            <div className="mission-setup__level-badge">Nivel {selectedLevel.level}</div>
          )}
        </div>

        {campaignMode ? (
          <div className="mission-setup__section mission-setup__section--reveal" style={{ '--reveal-delay': '0s' }}>
            <p className="mission-setup__question">En esta misión sos</p>
            <p className="mission-setup__campaign-identity">{selectedChar.name}</p>
          </div>
        ) : (
          <div className="mission-setup__section">
            <p className="mission-setup__question">¿Cómo te llamás?</p>
            <input
              ref={nameInputRef}
              className="mission-setup__name-input"
              type="text"
              placeholder="Tu nombre..."
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStartMission()}
              maxLength={24}
              aria-label="Tu nombre de agente"
            />
            {playerAlias && (
              <div className="mission-setup__alias-block">
                <span className="mission-setup__alias-label">Serás conocido como</span>
                <p className="mission-setup__alias-name">{playerAlias}</p>
                <div className="mission-setup__alias-line" />
              </div>
            )}
          </div>
        )}

        {step1Done && (
          <div className="mission-setup__section mission-setup__section--reveal" style={{ '--reveal-delay': '0s' }}>
            <p className="mission-setup__question">¿Qué tipo de operación?</p>
            <div className="mission-setup__type-grid">
              {MISSION_TYPES.map(m => (
                <button
                  key={m.id}
                  className={`mission-setup__type-card ${missionType === m.id ? 'mission-setup__type-card--active' : ''}`}
                  onClick={() => setMissionType(m.id)}
                >
                  <span className="mission-setup__type-icon">{MISSION_TYPE_ICONS[m.id]}</span>
                  <span className="mission-setup__type-label">{m.label}</span>
                  <span className="mission-setup__type-desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step1Done && (
          <div className="mission-setup__section mission-setup__section--reveal" style={{ '--reveal-delay': '0.07s' }}>
            <p className="mission-setup__question">Nivel de riesgo</p>
            {campaignMode ? (
              <div className="mission-setup__pills">
                <div
                  className="mission-setup__pill mission-setup__pill--active mission-setup__pill--locked"
                  style={{ '--pill-color': activeDiff?.color }}
                >
                  <span className="mission-setup__pill-label">{activeDiff?.label}</span>
                  <span className="mission-setup__pill-desc">{activeDiff?.desc} — fijado por campaña</span>
                </div>
              </div>
            ) : (
              <div className="mission-setup__pills">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.id}
                    className={`mission-setup__pill ${difficulty === d.id ? 'mission-setup__pill--active' : ''}`}
                    style={{ '--pill-color': d.color }}
                    onClick={() => setDifficulty(d.id)}
                  >
                    <span className="mission-setup__pill-label">{d.label}</span>
                    <span className="mission-setup__pill-desc">{d.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step1Done && (
          <button
            className="mission-setup__start mission-setup__section--reveal"
            disabled={!campaignMode && !playerName.trim()}
            onClick={handleStartMission}
            style={{ '--reveal-delay': '0.13s' }}
          >
            {campaignMode ? 'Comenzar nivel' : 'Iniciar operación'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
