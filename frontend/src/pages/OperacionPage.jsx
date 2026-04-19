import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { missions } from '../data/missions'
import MissionRunner from '../components/mission/MissionRunner'
import CharacterSelector from '../components/CharacterSelector/CharacterSelector'
import { ROUTES } from '../utils/constants'
import './OperacionPage.css'

export default function OperacionPage() {
  const navigate = useNavigate()

  const [phase,      setPhase]      = useState('chars')   // chars | missions | playing
  const [character,  setCharacter]  = useState(null)
  const [mission,    setMission]    = useState(null)
  // missionKey fuerza un remount de MissionRunner al repetir la misma
  const [missionKey, setMissionKey] = useState(0)

  const handleCharSelect = (char) => {
    setCharacter(char)
    setPhase('missions')
  }

  const handleMissionSelect = (m) => {
    setMission(m)
    setMissionKey(k => k + 1)
    setPhase('playing')
  }

  // El usuario quiere volver a elegir misión (desde MissionSummary)
  const handleReplay = () => {
    setPhase('missions')
  }

  // ── Selección de personaje ────────────────────────
  if (phase === 'chars') {
    return (
      <div className="operacion-page">
        <div className="operacion-page__top-bar">
          <button className="operacion-page__back" onClick={() => navigate(ROUTES.HOME)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
        </div>
        <div className="operacion-page__intro">
          <span className="operacion-page__eyebrow">🎯 Modo Misión</span>
          <h1 className="operacion-page__title">Elegí tu agente</h1>
          <p className="operacion-page__sub">
            Cada personaje reacciona distinto ante las mismas decisiones. El resultado depende de quién sos.
          </p>
        </div>
        <CharacterSelector characters={characters} onSelect={handleCharSelect} />
      </div>
    )
  }

  // ── Selección de misión ───────────────────────────
  if (phase === 'missions') {
    return (
      <div
        className="operacion-page"
        style={{ '--char-color': character.themeColor }}
      >
        <div className="operacion-page__top-bar">
          <button className="operacion-page__back" onClick={() => setPhase('chars')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
          <div className="operacion-page__char-badge">
            {character.image
              ? <img src={character.image} alt={character.name} className="operacion-page__char-avatar" />
              : <span>{character.emoji}</span>
            }
            <span className="operacion-page__char-name">{character.name}</span>
          </div>
        </div>

        <div className="operacion-page__intro">
          <span className="operacion-page__eyebrow">Elegí la operación</span>
          <h2 className="operacion-page__title">¿Cuál es la misión?</h2>
        </div>

        <div className="operacion-page__missions">
          {missions.map((m, i) => (
            <button
              key={m.id}
              className="operacion-mission-card"
              style={{ '--card-delay': `${i * 0.07}s` }}
              onClick={() => handleMissionSelect(m)}
            >
              <span className="operacion-mission-card__emoji">{m.emoji}</span>
              <div className="operacion-mission-card__body">
                <span className="operacion-mission-card__title">{m.title}</span>
                <span className="operacion-mission-card__desc">{m.description}</span>
                <span className="operacion-mission-card__steps">
                  {m.steps.length} escenas
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="operacion-mission-card__arrow">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Jugando ───────────────────────────────────────
  return (
    <div
      className="operacion-page operacion-page--playing"
      style={{ '--char-color': character.themeColor, '--char-gradient': character.gradient }}
    >
      <div className="operacion-page__top-bar">
        <button className="operacion-page__back" onClick={() => setPhase('missions')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Abandonar
        </button>
      </div>

      <MissionRunner
        key={missionKey}
        mission={mission}
        character={character}
        onReplay={handleReplay}
        onHome={() => navigate(ROUTES.HOME)}
      />
    </div>
  )
}
