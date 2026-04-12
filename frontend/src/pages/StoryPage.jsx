import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { storyScenarios } from '../data/stories'
import { readSSEStream } from '../utils/sse'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import './StoryPage.css'
import { API_URL } from '../config/api.js'

function parseChoices(block) {
  const choices = []
  // Captura [A/B/C] seguido de texto hasta el próximo [A/B/C] o fin — maneja una o múltiples líneas
  const pattern = /\[([ABC])\]\s*([\s\S]*?)(?=\s*\[[ABC]\]|$)/g
  let match
  while ((match = pattern.exec(block)) !== null) {
    const text = match[2].replace(/,\s*$/, '').trim()
    if (text) choices.push({ key: match[1], text })
  }
  return choices
}

export function parseStoryResponse(text) {
  const isFinal = text.includes('[FIN]')

  // Buscar el separador --- (con o sin newline antes)
  const sepMatch = text.match(/\n?\s*---\s*\n/)

  if (sepMatch) {
    const narrative = text.slice(0, sepMatch.index).trim()
    const choiceBlock = text.slice(sepMatch.index + sepMatch[0].length)
    return { narrative, choices: parseChoices(choiceBlock), isFinal }
  }

  // Fallback: buscar [A] directamente en el texto aunque no haya separador
  const firstChoice = text.search(/\[A\]/)
  if (firstChoice !== -1) {
    const narrative = text.slice(0, firstChoice).replace(/---/g, '').trim()
    const choiceBlock = text.slice(firstChoice)
    return { narrative, choices: parseChoices(choiceBlock), isFinal }
  }

  return { narrative: text.replace('[FIN]', '').trim(), choices: [], isFinal }
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
  const [streaming, setStreaming] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentText, choices])

  useEffect(() => {
    if (phase === 'ended' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'story')
    }
  }, [phase, session])

  const fetchStory = async (char, scenario, historyArray) => {
    setStreaming(true)
    setCurrentText('')
    setChoices([])
    setFetchError(false)

    let fullText = ''

    try {
      const res = await fetch(`${API_URL}/story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: char.id,
          scenarioPrompt: scenario.prompt,
          history: historyArray
        })
      })

      await readSSEStream(res, content => {
        fullText += content
        const sepIdx = fullText.search(/\n?\s*---\s*\n/)
        setCurrentText(sepIdx !== -1 ? fullText.slice(0, sepIdx).trim() : fullText)
      })

      if (fullText) {
        const { narrative, choices: parsed, isFinal } = parseStoryResponse(fullText)
        setCurrentText(narrative)
        if (isFinal) setPhase('ended')
        else setChoices(parsed)
      }
    } catch {
      setFetchError(true)
    } finally {
      setStreaming(false)
    }
  }

  const handleCharSelect = (char) => {
    setSelectedChar(char)
    setPhase('scenarios')
  }

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario)
    setHistory([])
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
    setPhase('chars')
    setSelectedChar(null)
    setSelectedScenario(null)
    setHistory([])
    setCurrentText('')
    setChoices([])
    setStreaming(false)
    setFetchError(false)
  }

  const turnNumber = history.length + (phase === 'ended' ? 0 : 1)
  const totalTurns = 5

  /* ── FASE: selección de personaje ─────────────────── */
  if (phase === 'chars') {
    return (
      <div className="story-page">
        <div className="story-top-bar">
          <button className="story-back-btn" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
            {storyScenarios.map(scenario => (
              <button
                key={scenario.id}
                className="story-scenario-card"
                style={{ '--scenario-color': scenario.color }}
                onClick={() => handleScenarioSelect(scenario)}
              >
                <span className="story-scenario-card__emoji">{scenario.emoji}</span>
                <div className="story-scenario-card__body">
                  <span className="story-scenario-card__title">{scenario.title}</span>
                  <span className="story-scenario-card__desc">{scenario.description}</span>
                </div>
                <svg className="story-scenario-card__arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── FASE: jugando / desenlace ────────────────────── */
  const isEnded = phase === 'ended'

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
        {!streaming && choices.length === 0 && !isEnded && (fetchError || currentText) && (
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
            <button className="story-end-btn story-end-btn--home" onClick={() => navigate('/')}>
              🏠 Inicio
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
