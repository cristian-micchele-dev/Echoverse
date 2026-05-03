import { useNavigate } from 'react-router-dom'
import { characters, characterMap } from '../../data/characters'
import { CAMPAIGN_ARCS } from '../../data/missionLevels.js'
import { getMissionProgress, resetProgress } from '../../utils/game/missionProgress.js'
import { ROUTES } from '../../utils/constants'
import { Helmet } from 'react-helmet-async'

export default function MissionCharSelect({
  campaignMode,
  setCampaignMode,
  campaignProgress,
  setCampaignProgress,
  handleCharSelect,
  handleCampaignLevelSelect,
}) {
  const navigate = useNavigate()

  return (
    <div className="mission-page">
      <Helmet>
        <title>Modo Misión — EchoVerse</title>
        <meta name="description" content="Tomá decisiones dentro de historias interactivas con personajes como El Profesor. Cada elección tiene consecuencias reales." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/mission" />
      </Helmet>
      <div className="mission-top-bar">
        <button className="mission-back-btn" onClick={() => navigate(ROUTES.HOME)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
      </div>
      <div className="mission-intro">
        <span className="mission-intro__eyebrow">⚔ Modo Misión</span>
        <h1 className="mission-intro__title">
          {campaignMode ? 'Campaña — 31 Niveles' : 'Entrá al Universo'}
        </h1>
        <p className="mission-intro__sub">
          {campaignMode
            ? 'Progresá nivel a nivel encarnando a cada personaje. Dificultad creciente.'
            : 'Elegí un personaje. Él te lanzará directo a una misión en su mundo — vos sos el protagonista.'}
        </p>
      </div>

      <div className="mission-mode-tabs">
        <button
          className={`mission-mode-tab ${!campaignMode ? 'mission-mode-tab--active' : ''}`}
          onClick={() => setCampaignMode(false)}
        >
          Libre
        </button>
        <button
          className={`mission-mode-tab ${campaignMode ? 'mission-mode-tab--active' : ''}`}
          onClick={() => setCampaignMode(true)}
        >
          Campaña
        </button>
      </div>

      {!campaignMode && (
        <div className="mission-chars-grid">
          {characters.map((char, i) => (
            <button
              key={char.id}
              className="mission-char-card"
              style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient, '--card-delay': `${i * 0.03}s` }}
              onClick={() => handleCharSelect(char)}
            >
              <div className="mission-char-card__bg" style={{ background: char.gradient }}>
                {char.image && <img src={char.image} alt={char.name} className="mission-char-card__img" loading="lazy" decoding="async" />}
              </div>
              <div className="mission-char-card__overlay" />
              <div className="mission-char-card__info">
                <span className="mission-char-card__universe">{char.universe}</span>
                <span className="mission-char-card__name">{char.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {campaignMode && (
        <div className="campaign-grid-wrapper">
          <div className="campaign-grid">
            {CAMPAIGN_ARCS.map((arc, arcIdx) => {
              const isSpecial = arc.levels[0].type === 'countdown'
              const arcChar = isSpecial ? null : characterMap[arc.character]
              const allLevelsCompleted = arc.levels.every(lvl => !!campaignProgress.completedLevels[lvl.level])
              const firstUnlocked = arc.levels[0].level <= campaignProgress.highestUnlocked
              const arcLocked = !firstUnlocked
              const diff = arc.levels[0].difficulty
              const diffColor = diff === 'easy' ? '#4ade80' : diff === 'normal' ? '#facc15' : '#f87171'
              const diffLabel = diff === 'easy' ? 'Fácil' : diff === 'normal' ? 'Normal' : 'Difícil'
              return (
                <div
                  key={arc.arcName}
                  className={`campaign-card ${arcLocked ? 'campaign-card--locked' : allLevelsCompleted ? 'campaign-card--done' : 'campaign-card--open'} ${isSpecial ? 'campaign-card--special' : ''}`}
                  style={{ '--char-color': isSpecial ? '#ef4444' : (arcChar?.themeColor || '#888'), '--card-delay': `${arcIdx * 0.04}s` }}
                >
                  <div className="campaign-card__bg">
                    {arcChar?.image && <img src={arcChar.image} alt={arcChar.name} className="campaign-card__img" loading="lazy" decoding="async" />}
                    {isSpecial && <div className="campaign-card__special-bg">⏱</div>}
                    <div className="campaign-card__overlay" />
                  </div>

                  <div className="campaign-card__diff" style={{ color: diffColor, borderColor: `color-mix(in srgb, ${diffColor} 35%, transparent)` }}>
                    <span className="campaign-card__diff-dot" style={{ background: diffColor }} />
                    {diffLabel}
                  </div>

                  {allLevelsCompleted && (
                    <div className="campaign-card__ribbon">✔ Completado</div>
                  )}

                  {arcLocked && (
                    <div className="campaign-card__lock-overlay">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                  )}

                  <div className="campaign-card__content">
                    <div className="campaign-card__meta">
                      <span className="campaign-card__char">{isSpecial ? 'Cualquier personaje' : arcChar?.name}</span>
                      <h3 className="campaign-card__title">{arc.arcName}</h3>
                    </div>
                    <div className="campaign-card__levels">
                      {arc.levels.map(lvl => {
                        const unlocked = lvl.level <= campaignProgress.highestUnlocked
                        const completed = !!campaignProgress.completedLevels[lvl.level]
                        return (
                          <button
                            key={lvl.level}
                            className={`campaign-card-lvl ${completed ? 'campaign-card-lvl--done' : unlocked ? 'campaign-card-lvl--open' : 'campaign-card-lvl--locked'}`}
                            disabled={!unlocked}
                            onClick={() => handleCampaignLevelSelect(lvl)}
                          >
                            <span className="campaign-card-lvl__num">{lvl.level}</span>
                            <span className="campaign-card-lvl__icon">
                              {completed ? '✔' : unlocked ? (isSpecial ? '⏱' : '▶') : '🔒'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="campaign-reset">
            <button className="campaign-reset-btn" onClick={() => {
              resetProgress()
              setCampaignProgress(getMissionProgress())
            }}>
              Reiniciar progreso
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
