import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { storyScenarios } from '../data/stories'
import { useStreaming } from '../hooks/useStreaming'
import { ROUTES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import { parseStoryResponse } from '../utils/aiResponseParser'
import { addModeXP } from '../utils/affinity'
import { useLevelUpToast } from '../hooks/useLevelUpToast'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import './StoryPage.css'
import { API_URL } from '../config/api.js'

const MAX_TOTAL_TURNS = 11

function getStorySaveKey(charId, scenarioId) {
  return `story-save-${charId}-${scenarioId}`
}

function loadStorySave(charId, scenarioId) {
  try {
    const raw = localStorage.getItem(getStorySaveKey(charId, scenarioId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveStoryProgress(charId, scenarioId, history, currentText) {
  try {
    localStorage.setItem(
      getStorySaveKey(charId, scenarioId),
      JSON.stringify({ history, currentText, savedAt: Date.now() })
    )
  } catch { /* storage unavailable */ }
}

function clearStorySave(charId, scenarioId) {
  try { localStorage.removeItem(getStorySaveKey(charId, scenarioId)) } catch { /* noop */ }
}

export default function StoryPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)
  const [phase, setPhase] = useState('chars')
  const [selectedChar, setSelectedChar] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [history, setHistory] = useState([])
  const [currentText, setCurrentText] = useState('')
  const [choices, setChoices] = useState([])
  const [fetchError, setFetchError] = useState(false)
  const { isLoading: streaming, streamChat } = useStreaming()
  const bottomRef = useRef(null)
  const { levelUpToast, dismissLevelUp, notifyLevelUp } = useLevelUpToast()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentText, choices])

  useEffect(() => {
    if (phase === 'ended' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'story')
      if (selectedChar) {
        clearStorySave(selectedChar.id, selectedScenario?.id)
        const result = addModeXP(selectedChar.id, 'story')
        notifyLevelUp(result, selectedChar.name)
      }
    }
  }, [phase, session, selectedChar, selectedScenario, notifyLevelUp])

  const [turnLimit, setTurnLimit] = useState(5)

  const fetchStory = async (char, scenario, historyArray, maxTurns = turnLimit) => {
    setCurrentText('')
    setChoices([])
    setFetchError(false)

    let fullText = ''

    try {
      await streamChat(
        `${API_URL}/story`,
        {
          characterId: char.id,
          scenarioPrompt: scenario.prompt,
          history: historyArray
        },
        content => {
          fullText += content
          const sepIdx = fullText.search(/\n?\s*---\s*\n/)
          setCurrentText(sepIdx !== -1 ? fullText.slice(0, sepIdx).trim() : fullText)
        }
      )

      if (fullText) {
        const { narrative, choices: parsed, isFinal } = parseStoryResponse(fullText)
        setCurrentText(narrative)
        saveStoryProgress(char.id, scenario.id, historyArray, narrative)
        if (isFinal) {
          if (historyArray.length + 1 < maxTurns) {
            setChoices(parsed)
          } else if (historyArray.length + 1 < MAX_TOTAL_TURNS) {
            setPhase('extendable')
          } else {
            setPhase('ended')
          }
        } else {
          setChoices(parsed)
        }
      }
    } catch {
      setFetchError(true)
    }
  }

  const handleCharSelect = (char) => {
    setSelectedChar(char)
    setPhase('scenarios')
  }

  const handleScenarioSelect = (scenario, resume = false) => {
    setSelectedScenario(scenario)
    if (resume) {
      const saved = loadStorySave(selectedChar.id, scenario.id)
      if (saved) {
        setHistory(saved.history)
        setCurrentText(saved.currentText)
        setPhase('playing')
        fetchStory(selectedChar, scenario, saved.history)
        return
      }
    }
    setHistory([])
    setCurrentText('')
    setPhase('playing')
    fetchStory(selectedChar, scenario, [])
  }

  const handleChoice = (choice) => {
    const newHistory = [
      ...history,
      { narrative: currentText, choice: `${choice.key}) ${choice.text}` }
    ]
    setHistory(newHistory)
    setChoices([])
    fetchStory(selectedChar, selectedScenario, newHistory)
  }

  const handleRestart = () => {
    if (selectedChar && selectedScenario) {
      clearStorySave(selectedChar.id, selectedScenario.id)
    }
    setTurnLimit(5)
    recordedRef.current = false
    setPhase('chars')
    setSelectedChar(null)
    setSelectedScenario(null)
    setHistory([])
    setCurrentText('')
    setChoices([])
    setFetchError(false)
  }

  const turnNumber = history.length + (phase === 'ended' || phase === 'extendable' ? 0 : 1)
  const totalTurns = turnLimit

  const handleExtend = () => {
    const newLimit = Math.min(MAX_TOTAL_TURNS, turnLimit + 3)
    setTurnLimit(newLimit)
    setPhase('playing')
    fetchStory(selectedChar, selectedScenario, history, newLimit)
  }

  /* ── FASE: selección de personaje ─────────────────── */
  if (phase === 'chars') {
    return (
      <div className="story-page">
        <div className="story-top-bar">
          <button className="story-back-btn" onClick={() => navigate(ROUTES.HOME)} aria-label="Volver al inicio">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
        </div>
        <div className="story-intro">
          <span className="story-intro__eyebrow">✦ Modo Historia ✦</span>
          <h1 className="story-intro__title">Reescribí el Destino</h1>
          <p className="story-intro__sub">Elegí un personaje, elegí un escenario alternativo y tomá decisiones que cambiarán su historia para siempre.</p>
        </div>
        <div className="story-chars-grid">
          {characters.map((char, i) => (
            <button
              key={char.id}
              className="story-char-card"
              style={{
                '--char-color': char.themeColor,
                '--char-gradient': char.gradient,
                '--card-delay': `${i * 0.03}s`
              }}
              onClick={() => handleCharSelect(char)}
            >
              <div className="story-char-card__bg" style={{ background: char.gradient }}>
                {char.image && (
                  <img src={char.image} alt={char.name} className="story-char-card__img" />
                )}
              </div>
              <div className="story-char-card__overlay" />
              <div className="story-char-card__info">
                <span className="story-char-card__universe">{char.universe}</span>
                <span className="story-char-card__name">{char.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ── FASE: selección de escenario ─────────────────── */
  if (phase === 'scenarios') {
    return (
      <div className="story-page story-page--scenarios" style={{ '--char-color': selectedChar.themeColor }}>
        <div className="story-top-bar">
          <button className="story-back-btn" onClick={() => setPhase('chars')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
        </div>

        <div className="story-char-hero">
          <div className="story-char-hero__avatar-wrap" style={{ '--char-color': selectedChar.themeColor }}>
            {selectedChar.image
              ? <img src={selectedChar.image} alt={selectedChar.name} className="story-char-hero__avatar" />
              : <span className="story-char-hero__emoji">{selectedChar.emoji}</span>
            }
          </div>
          <div className="story-char-hero__text">
            <p className="story-char-hero__universe">{selectedChar.universe}</p>
            <h2 className="story-char-hero__name">{selectedChar.name}</h2>
          </div>
        </div>

        <div className="story-scenarios-wrap">
          <p className="story-scenarios-label">¿Qué historia querés explorar?</p>
          <div className="story-scenarios-list">
            {storyScenarios.map(scenario => {
              const saved = loadStorySave(selectedChar.id, scenario.id)
              return (
                <div key={scenario.id} className="story-scenario-row">
                  <button
                    className="story-scenario-card"
                    style={{ '--scenario-color': scenario.color }}
                    onClick={() => handleScenarioSelect(scenario)}
                  >
                    <span className="story-scenario-card__emoji">{scenario.emoji}</span>
                    <div className="story-scenario-card__body">
                      <span className="story-scenario-card__title">{scenario.title}</span>
                      <span className="story-scenario-card__desc">{scenario.description}</span>
                    </div>
                    {saved && <span className="story-scenario-card__saved">Guardado</span>}
                    <svg className="story-scenario-card__arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {saved && (
                    <button
                      className="story-scenario-continue"
                      style={{ '--scenario-color': scenario.color }}
                      onClick={() => handleScenarioSelect(scenario, true)}
                    >
                      ▶ Continuar ({saved.history.length} turno{saved.history.length !== 1 ? 's' : ''})
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  /* ── FASE: jugando / desenlace ────────────────────── */
  const isEnded = phase === 'ended'
  const isExtendable = phase === 'extendable'

  return (
    <div
      className={`story-page story-page--playing ${isEnded ? 'story-page--ended' : ''}`}
      style={{ '--char-color': selectedChar.themeColor, '--char-gradient': selectedChar.gradient }}
    >
      {/* Header */}
      <div className="story-play-header">
        <button className="story-back-btn story-back-btn--abandon" onClick={handleRestart}>
          ✕ Abandonar
        </button>
        <div className="story-play-identity">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="story-play-avatar" />
            : <span className="story-play-avatar-emoji">{selectedChar.emoji}</span>
          }
          <span className="story-play-name">{selectedChar.name}</span>
          <span className="story-play-scenario">{selectedScenario.emoji} {selectedScenario.title}</span>
        </div>
        <div className="story-progress">
          {Array.from({ length: totalTurns }).map((_, i) => (
            <span
              key={i}
              className={`story-progress__dot ${
                i < history.length ? 'story-progress__dot--done' :
                i === history.length && !isEnded ? 'story-progress__dot--active' : ''
              }`}
            />
          ))}
          <span className="story-progress__label">
            {isEnded ? 'Final' : `${Math.min(turnNumber, totalTurns)} / ${totalTurns}`}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="story-play-content">

        {/* Historial de turnos anteriores */}
        {history.map((entry, i) => (
          <div key={i} className="story-entry">
            <div className="story-entry__turn-label">Turno {i + 1}</div>
            <p className="story-entry__narrative">{entry.narrative}</p>
            <div className="story-entry__choice-badge">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {entry.choice}
            </div>
          </div>
        ))}

        {/* Narrativa actual */}
        <div className={`story-current ${isEnded ? 'story-current--final' : ''}`}>
          {isEnded && (
            <div className="story-final-badge">
              <span>✦</span> Desenlace Final <span>✦</span>
            </div>
          )}
          {!isEnded && (
            <div className="story-turn-badge">
              {history.length === 0 ? 'Turno 1 — La historia comienza' : `Turno ${history.length + 1}`}
            </div>
          )}
          <p className="story-narrative">
            {currentText}
            {streaming && <span className="story-cursor">▋</span>}
          </p>
        </div>

        {/* Elecciones */}
        {!streaming && choices.length > 0 && (
          <div className="story-choices">
            <p className="story-choices__label">¿Qué hacés?</p>
            <div className="story-choices__list">
              {choices.map(choice => (
                <button
                  key={choice.key}
                  className="story-choice-btn"
                  onClick={() => handleChoice(choice)}
                >
                  <span className="story-choice-btn__key">{choice.key}</span>
                  <span className="story-choice-btn__text">{choice.text}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fallback: sin opciones y no es el final */}
        {!streaming && choices.length === 0 && !isEnded && !isExtendable && (fetchError || currentText) && (
          <div className="story-choices">
            <p className="story-choices__label story-choices__label--warn">
              {fetchError ? 'Error de conexión — puede ser un límite de la API' : 'No se generaron opciones correctamente'}
            </p>
            <button
              className="story-choice-btn"
              onClick={() => fetchStory(selectedChar, selectedScenario, history)}
            >
              <span className="story-choice-btn__key">↺</span>
              <span className="story-choice-btn__text">Reintentar este turno</span>
            </button>
          </div>
        )}

        {/* Continuar historia */}
        {isExtendable && !streaming && (
          <div className="story-end-actions">
            <button className="story-end-btn story-end-btn--extend" onClick={handleExtend}>
              ➕ Continuar historia
            </button>
            <button className="story-end-btn story-end-btn--home" onClick={() => setPhase('ended')}>
              Terminar aquí
            </button>
          </div>
        )}

        {/* Fin */}
        {isEnded && !streaming && (
          <div className="story-end-actions">
            <button className="story-end-btn story-end-btn--new" onClick={() => {
              setPhase('scenarios')
              setHistory([])
              setCurrentText('')
              setChoices([])
            }}>
              🔄 Otro escenario
            </button>
            <button className="story-end-btn story-end-btn--chars" onClick={handleRestart}>
              👤 Otro personaje
            </button>
            <button className="story-end-btn story-end-btn--home" onClick={() => navigate(ROUTES.HOME)}>
              🏠 Inicio
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
      {levelUpToast && (
        <AchievementToast achievement={levelUpToast} onDismiss={dismissLevelUp} />
      )}
    </div>
  )
}
