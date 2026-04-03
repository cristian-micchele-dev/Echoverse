import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { INTERROGATION_CHAR_IDS, SCENARIOS } from '../data/interrogationData'
import './InterrogationPage.css'
import { API_URL } from '../config/api.js'
const MAX_QUESTIONS = 8
const MIN_QUESTIONS = 2
const POOL_SIZE = 5  // shown per session

const TONE_LABELS = {
  calm:       { label: 'Calmo',      color: '#70a8e0' },
  defensive:  { label: 'Defensivo',  color: '#f59e0b' },
  irritated:  { label: 'Irritado',   color: '#ef4444' },
  dismissive: { label: 'Despectivo', color: '#a78bfa' },
  confident:  { label: 'Seguro',     color: '#34d399' },
}

function pickRandom(arr, n) {
  const copy = [...arr]
  const result = []
  while (result.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(i, 1)[0])
  }
  return result
}

const allIntChars = INTERROGATION_CHAR_IDS
  .map(id => characters.find(c => c.id === id))
  .filter(Boolean)

export default function InterrogationPage() {
  const navigate = useNavigate()

  const [sessionSeed, setSessionSeed] = useState(0)

  // Pick a fresh random selection of POOL_SIZE characters each game
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const intChars = useMemo(() => pickRandom(allIntChars, POOL_SIZE), [sessionSeed])

  // Phases: intro | interrogation | decision | reveal
  const [phase, setPhase]               = useState('intro')
  const [selectedChar, setSelectedChar] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)

  // Session state
  const [sessionId, setSessionId]         = useState(null)
  const [openingStatement, setOpeningStatement] = useState('')
  const [exchanges, setExchanges]         = useState([])
  const [inputValue, setInputValue]       = useState('')
  const [isLoading, setIsLoading]         = useState(false)
  const [pressureLevel, setPressureLevel] = useState(0)

  // Reveal state
  const [revealData, setRevealData] = useState(null)

  // Suggestion chips state
  const [usedSuggestions, setUsedSuggestions] = useState(new Set())

  // Confrontation phase state
  const [confrontationResponse, setConfrontationResponse] = useState(null)
  const [selectedConfrontation, setSelectedConfrontation] = useState(null)
  const [confrontationTone, setConfrontationTone] = useState(null)

  const chatEndRef  = useRef(null)
  const inputRef    = useRef(null)

  const questionCount = exchanges.length

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [exchanges, isLoading])

  // Focus input when entering interrogation
  useEffect(() => {
    if (phase === 'interrogation') {
      setTimeout(() => inputRef.current?.focus(), 400)
    }
  }, [phase])

  // ── Start session ────────────────────────────────────────────
  const startSession = useCallback(async () => {
    if (!selectedChar || !selectedScenario) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/interrogation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId:     selectedChar.id,
          scenario:        selectedScenario.text,
          hiddenTruth:     selectedScenario.hiddenTruth,
          innocentVersion: selectedScenario.innocentVersion,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar')
      setSessionId(data.sessionId)
      setOpeningStatement(data.openingStatement)
      setExchanges([])
      setPressureLevel(0)
      setPhase('interrogation')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedChar, selectedScenario])

  // ── Send message (shared by ask + suggestion chips) ──────────
  const sendMessage = useCallback(async (q) => {
    if (!q || !sessionId || isLoading || questionCount >= MAX_QUESTIONS) return
    setIsLoading(true)

    // Optimistic: show question immediately
    const tempExchange = { question: q, response: null, emotionalTone: null, confidence: null }
    setExchanges(prev => [...prev, tempExchange])

    try {
      const res = await fetch(`${API_URL}/interrogation/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: q }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')

      setExchanges(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          question:      q,
          response:      data.response,
          emotionalTone: data.emotionalTone,
          confidence:    data.confidence,
          questionIndex: data.questionIndex,
        }
        return updated
      })

      // Update pressure based on emotional tone + confidence
      const pressureDelta = (() => {
        let delta = 5  // base: cada pregunta suma presión
        if (['defensive', 'irritated'].includes(data.emotionalTone)) delta += 15
        else if (data.emotionalTone === 'dismissive') delta += 5
        else if (data.emotionalTone === 'confident') delta -= 10
        if (typeof data.confidence === 'number' && data.confidence < 0.4) delta += 10
        return delta
      })()
      setPressureLevel(prev => Math.min(100, Math.max(0, prev + pressureDelta)))
    } catch (err) {
      console.error(err)
      setExchanges(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          response: 'No hubo respuesta.',
          emotionalTone: 'calm',
          confidence: 0.5,
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, isLoading, questionCount])

  // ── Ask question (from text input) ───────────────────────────
  const askQuestion = useCallback(() => {
    const q = inputValue.trim()
    if (!q) return
    setInputValue('')
    sendMessage(q)
  }, [inputValue, sendMessage])

  // ── Send suggestion chip ──────────────────────────────────────
  const sendSuggestion = useCallback((q) => {
    setUsedSuggestions(prev => new Set([...prev, q]))
    sendMessage(q)
  }, [sendMessage])

  // ── Submit verdict ────────────────────────────────────────────
  const submitVerdict = useCallback(async (verdict) => {
    if (!sessionId) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/interrogation/verdict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, verdict }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setRevealData({ ...data, userVerdict: verdict })
      setPhase('reveal')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // ── Submit confrontation ──────────────────────────────────────
  const submitConfrontation = useCallback(async (text) => {
    if (!sessionId || isLoading) return
    setSelectedConfrontation(text)
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/interrogation/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setConfrontationResponse(data.response)
      setConfrontationTone(data.emotionalTone)
      const confrontationDelta = (() => {
        let delta = 10  // confrontación siempre suma más presión
        if (['defensive', 'irritated'].includes(data.emotionalTone)) delta += 20
        else if (data.emotionalTone === 'dismissive') delta += 10
        else if (data.emotionalTone === 'confident') delta -= 5
        if (typeof data.confidence === 'number' && data.confidence < 0.4) delta += 10
        return delta
      })()
      setPressureLevel(prev => Math.min(100, Math.max(0, prev + confrontationDelta)))
    } catch (err) {
      console.error(err)
      setConfrontationResponse('Sin respuesta.')
      setConfrontationTone('calm')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, isLoading])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      askQuestion()
    }
  }

  const resetGame = () => {
    setSessionSeed(s => s + 1)  // triggers fresh character selection
    setPhase('intro')
    setSelectedChar(null)
    setSelectedScenario(null)
    setSessionId(null)
    setOpeningStatement('')
    setExchanges([])
    setInputValue('')
    setRevealData(null)
    setPressureLevel(0)
    setUsedSuggestions(new Set())
    setConfrontationResponse(null)
    setSelectedConfrontation(null)
    setConfrontationTone(null)
  }

  // ════════════════════════════════════════════════════════════
  // INTRO
  // ════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div className="ip ip--intro">
        <div className="ip-bg" aria-hidden="true">
          <div className="ip-bg__spotlight ip-bg__spotlight--1" />
          <div className="ip-bg__spotlight ip-bg__spotlight--2" />
          <div className="ip-bg__grid" />
          <div className="ip-bg__vignette" />
        </div>

        <button className="ip-back ip-back--intro" onClick={() => navigate('/')}>← Volver</button>

        <div className="ip-intro">
          <div className="ip-intro__badge">MODO</div>
          <h1 className="ip-intro__title">Interrogatorio</h1>
          <p className="ip-intro__desc">
            Uno de estos personajes oculta algo. Hacé las preguntas correctas,
            detectá las contradicciones y decidí: ¿está mintiendo o dice la verdad?
          </p>
          <div className="ip-intro__features">
            <div className="ip-intro__feature ip-intro__feature--chars">
              <span className="ip-intro__feature-icon">🎭</span>
              <div className="ip-intro__feature-text">
                <span className="ip-intro__feature-title">Elenco variable</span>
                <span className="ip-intro__feature-sub">5 de 12 personajes, distintos cada vez</span>
              </div>
            </div>
            <div className="ip-intro__feature ip-intro__feature--questions">
              <span className="ip-intro__feature-icon">❓</span>
              <div className="ip-intro__feature-text">
                <span className="ip-intro__feature-title">Hasta 8 preguntas</span>
                <span className="ip-intro__feature-sub">Decidí cuándo ya tenés suficiente</span>
              </div>
            </div>
            <div className="ip-intro__feature ip-intro__feature--clues">
              <span className="ip-intro__feature-icon">🔍</span>
              <div className="ip-intro__feature-text">
                <span className="ip-intro__feature-title">Detectá las señales</span>
                <span className="ip-intro__feature-sub">Tono emocional, evasión, contradicciones</span>
              </div>
            </div>
          </div>

          <div className="ip-char-grid">
            {intChars.map((char, i) => (
              <button
                key={char.id}
                className={`ip-char-card ${selectedChar?.id === char.id ? 'ip-char-card--selected' : ''}`}
                style={{ '--cc': char.themeColor }}
                onClick={() => { setSelectedChar(char); setSelectedScenario(null) }}
              >
                <div className="ip-char-card__img">
                  <img src={char.image} alt={char.name} />
                </div>
                <div className="ip-char-card__overlay" />
                <span className="ip-char-card__num">#{String(i + 1).padStart(2, '0')}</span>
                <div className="ip-char-card__info">
                  <span className="ip-char-card__name">{char.name}</span>
                  <span className="ip-char-card__universe">{char.universe}</span>
                </div>
                {selectedChar?.id === char.id && (
                  <div className="ip-char-card__check">✓</div>
                )}
              </button>
            ))}
          </div>

          {selectedChar && (
            <div className="ip-scenario-section">
              <p className="ip-scenario-label">Elegí el escenario:</p>
              <div className="ip-scenario-grid">
                {(SCENARIOS[selectedChar.id] ?? []).map(s => (
                  <button
                    key={s.id}
                    className={`ip-scenario-card ${selectedScenario?.id === s.id ? 'ip-scenario-card--selected' : ''}`}
                    onClick={() => setSelectedScenario(s)}
                  >
                    <p className="ip-scenario-card__text">{s.text}</p>
                    {selectedScenario?.id === s.id && (
                      <span className="ip-scenario-card__check">✓ Seleccionado</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedChar && selectedScenario && (
            <button
              className="ip-start-btn"
              onClick={startSession}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando...' : 'Comenzar interrogatorio'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // INTERROGATION
  // ════════════════════════════════════════════════════════════
  if (phase === 'interrogation') {
    const canDecide  = questionCount >= MIN_QUESTIONS
    const isMaxed    = questionCount >= MAX_QUESTIONS
    const charColor  = selectedChar?.themeColor ?? '#fff'

    return (
      <div className="ip ip--interrogation" style={{ '--cc': charColor }}>
        <div className="ip-bg ip-bg--dark" aria-hidden="true">
          <div className="ip-bg__spotlight ip-bg__spotlight--1" />
          <div className="ip-bg__spotlight ip-bg__spotlight--2" />
          <div className="ip-bg__char-glow" />
          {selectedChar?.image && (
            <div className="ip-bg__ghost">
              <img src={selectedChar.image} alt="" />
            </div>
          )}
          <div className="ip-bg__scanlines" />
          <div className="ip-bg__vignette" />
        </div>

        {/* Header */}
        <header className="ip-intr-header">
          <button className="ip-back" onClick={() => { if (window.confirm('¿Abandonar el interrogatorio?')) resetGame() }}>
            ← Salir
          </button>
          <div className="ip-intr-header__char">
            <div className="ip-intr-header__img" style={{ '--cc': charColor }}>
              <img src={selectedChar?.image} alt={selectedChar?.name} />
            </div>
            <div className="ip-intr-header__info">
              <span className="ip-intr-header__name">{selectedChar?.name}</span>
              <span className="ip-intr-header__status">En interrogatorio</span>
            </div>
          </div>
          <div className="ip-intr-header__counter">
            <span className="ip-intr-header__q-num">{questionCount}</span>
            <span className="ip-intr-header__q-max">/{MAX_QUESTIONS}</span>
            <span className="ip-intr-header__q-label">preguntas</span>
          </div>
        </header>

        {/* Pressure bar */}
        <div className="ip-pressure-bar">
          <span className="ip-pressure-bar__label">Presión</span>
          <div className="ip-pressure-bar__track">
            <div
              className="ip-pressure-bar__fill"
              style={{ width: `${pressureLevel}%` }}
            />
          </div>
          <span className="ip-pressure-bar__pct">{pressureLevel}%</span>
        </div>

        {/* Scenario */}
        <div className="ip-scenario-banner">
          <span className="ip-scenario-banner__label">Situación:</span>
          <span className="ip-scenario-banner__text">{selectedScenario?.text}</span>
        </div>

        {/* Chat area */}
        <div className="ip-chat">
          {/* Opening statement */}
          {openingStatement && (
            <div className="ip-bubble ip-bubble--char ip-bubble--opening">
              <div className="ip-bubble__avatar" style={{ '--cc': charColor }}>
                <img src={selectedChar?.image} alt={selectedChar?.name} />
              </div>
              <div className="ip-bubble__body">
                <span className="ip-bubble__name">{selectedChar?.name}</span>
                <p className="ip-bubble__text">{openingStatement}</p>
              </div>
            </div>
          )}

          {/* Exchanges */}
          {exchanges.map((ex, i) => (
            <div key={i} className="ip-exchange">
              {/* Question (user) */}
              <div className="ip-bubble ip-bubble--user">
                <div className="ip-bubble__body">
                  <span className="ip-bubble__name">Interrogador</span>
                  <p className="ip-bubble__text">{ex.question}</p>
                </div>
              </div>

              {/* Response (char) */}
              {ex.response ? (
                <div className="ip-bubble ip-bubble--char">
                  <div className="ip-bubble__avatar" style={{ '--cc': charColor }}>
                    <img src={selectedChar?.image} alt={selectedChar?.name} />
                  </div>
                  <div className="ip-bubble__body">
                    <div className="ip-bubble__meta">
                      <span className="ip-bubble__name">{selectedChar?.name}</span>
                      {ex.emotionalTone && (
                        <span
                          className="ip-tone-badge"
                          style={{ '--tc': TONE_LABELS[ex.emotionalTone]?.color ?? '#aaa' }}
                        >
                          {TONE_LABELS[ex.emotionalTone]?.label ?? ex.emotionalTone}
                        </span>
                      )}
                    </div>
                    <p className="ip-bubble__text">{ex.response}</p>
                  </div>
                </div>
              ) : (
                <div className="ip-bubble ip-bubble--char ip-bubble--loading">
                  <div className="ip-bubble__avatar" style={{ '--cc': charColor }}>
                    <img src={selectedChar?.image} alt={selectedChar?.name} />
                  </div>
                  <div className="ip-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="ip-input-area">
          {isMaxed ? (
            <p className="ip-input-maxed">Alcanzaste el límite de preguntas. Es hora de confrontar.</p>
          ) : (
            <>
              {/* Suggestion chips */}
              {selectedScenario?.suggestedQuestions && (
                <div className="ip-suggestions">
                  {selectedScenario.suggestedQuestions
                    .filter(q => !usedSuggestions.has(q))
                    .map((q, i) => (
                      <button
                        key={i}
                        className="ip-suggestion-chip"
                        onClick={() => sendSuggestion(q)}
                        disabled={isLoading}
                      >
                        {q}
                      </button>
                    ))
                  }
                </div>
              )}
              <div className="ip-input-wrap">
                <textarea
                  ref={inputRef}
                  className="ip-input"
                  placeholder="Hacé tu pregunta..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  className="ip-send-btn"
                  onClick={askQuestion}
                  disabled={!inputValue.trim() || isLoading}
                  style={{ '--cc': charColor }}
                >
                  ↑
                </button>
              </div>
            </>
          )}

          {canDecide && (
            <button
              className="ip-decide-btn"
              onClick={() => setPhase('confrontation')}
              style={{ '--cc': charColor }}
            >
              Confrontar →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // CONFRONTATION
  // ════════════════════════════════════════════════════════════
  if (phase === 'confrontation') {
    const charColor = selectedChar?.themeColor ?? '#fff'

    return (
      <div className="ip ip--confrontation" style={{ '--cc': charColor }}>
        <div className="ip-bg ip-bg--dark" aria-hidden="true">
          <div className="ip-bg__spotlight ip-bg__spotlight--1" />
          <div className="ip-bg__spotlight ip-bg__spotlight--2" />
          <div className="ip-bg__vignette" />
        </div>

        <div className="ip-confrontation">
          <div className="ip-confrontation__char">
            <div className="ip-confrontation__char-img" style={{ '--cc': charColor }}>
              <img src={selectedChar?.image} alt={selectedChar?.name} />
            </div>
          </div>

          {!confrontationResponse ? (
            <>
              <div className="ip-confrontation__header">
                <span className="ip-confrontation__eyebrow">Confrontación final</span>
                <h2 className="ip-confrontation__title">Poné las cartas sobre la mesa</h2>
                <p className="ip-confrontation__sub">Una sola acusación. No hay vuelta atrás.</p>
              </div>

              <div className="ip-confrontation__options">
                {(selectedScenario?.confrontations ?? []).map((text, i) => (
                  <button
                    key={i}
                    className="ip-confrontation__option"
                    style={{ '--cc': charColor }}
                    onClick={() => submitConfrontation(text)}
                    disabled={isLoading}
                  >
                    <span className="ip-confrontation__option-num">{i + 1}</span>
                    <span className="ip-confrontation__option-text">{text}</span>
                  </button>
                ))}
              </div>

              {isLoading && (
                <div className="ip-confrontation__loading">
                  <div className="ip-typing"><span /><span /><span /></div>
                </div>
              )}

              <button className="ip-back ip-back--decision" onClick={() => setPhase('interrogation')}>
                ← Volver al interrogatorio
              </button>
            </>
          ) : (
            <div className="ip-confrontation__response">
              <div className="ip-confrontation__response-header">
                <span className="ip-confrontation__response-label">{selectedChar?.name} responde:</span>
                {confrontationTone && (
                  <span
                    className="ip-tone-badge"
                    style={{ '--tc': TONE_LABELS[confrontationTone]?.color ?? '#aaa' }}
                  >
                    {TONE_LABELS[confrontationTone]?.label ?? confrontationTone}
                  </span>
                )}
              </div>
              <div className="ip-confrontation__accusation">
                <span className="ip-confrontation__accusation-label">Tu acusación</span>
                <p className="ip-confrontation__accusation-text">"{selectedConfrontation}"</p>
              </div>
              <div className="ip-confrontation__reply">
                <p className="ip-confrontation__reply-text">{confrontationResponse}</p>
              </div>
              <button
                className="ip-decide-btn"
                style={{ '--cc': charColor }}
                onClick={() => setPhase('decision')}
              >
                Dar mi veredicto →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // DECISION
  // ════════════════════════════════════════════════════════════
  if (phase === 'decision') {
    const charColor = selectedChar?.themeColor ?? '#fff'
    const toneStats = exchanges.reduce((acc, ex) => {
      if (ex.emotionalTone) acc[ex.emotionalTone] = (acc[ex.emotionalTone] || 0) + 1
      return acc
    }, {})

    return (
      <div className="ip ip--decision" style={{ '--cc': charColor }}>
        <div className="ip-bg ip-bg--dark" aria-hidden="true">
          <div className="ip-bg__spotlight ip-bg__spotlight--1" />
          <div className="ip-bg__spotlight ip-bg__spotlight--2" />
          <div className="ip-bg__vignette" />
        </div>

        <div className="ip-decision">
          <div className="ip-decision__char">
            <div className="ip-decision__char-img" style={{ '--cc': charColor }}>
              <img src={selectedChar?.image} alt={selectedChar?.name} />
            </div>
            <h2 className="ip-decision__char-name">{selectedChar?.name}</h2>
          </div>

          <h1 className="ip-decision__title">¿Cuál es tu veredicto?</h1>
          <p className="ip-decision__subtitle">
            Basado en {questionCount} pregunta{questionCount !== 1 ? 's' : ''} — confía en tu instinto.
          </p>

          {Object.keys(toneStats).length > 0 && (
            <div className="ip-decision__stats">
              <p className="ip-decision__stats-label">Señales detectadas:</p>
              <div className="ip-decision__tone-list">
                {Object.entries(toneStats).map(([tone, count]) => (
                  <span
                    key={tone}
                    className="ip-tone-stat"
                    style={{ '--tc': TONE_LABELS[tone]?.color ?? '#aaa' }}
                  >
                    {TONE_LABELS[tone]?.label ?? tone} ×{count}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="ip-decision__btns">
            <button
              className="ip-verdict-btn ip-verdict-btn--lie"
              onClick={() => submitVerdict('lying')}
              disabled={isLoading}
            >
              <span className="ip-verdict-btn__icon">⚡</span>
              <span className="ip-verdict-btn__label">Está mintiendo</span>
              <span className="ip-verdict-btn__sub">Ocultó la verdad</span>
            </button>
            <button
              className="ip-verdict-btn ip-verdict-btn--truth"
              onClick={() => submitVerdict('truth')}
              disabled={isLoading}
            >
              <span className="ip-verdict-btn__icon">✓</span>
              <span className="ip-verdict-btn__label">Dice la verdad</span>
              <span className="ip-verdict-btn__sub">Es inocente</span>
            </button>
          </div>

          <button className="ip-back ip-back--decision" onClick={() => setPhase('interrogation')}>
            ← Volver al interrogatorio
          </button>

          {isLoading && <p className="ip-loading-msg">Procesando veredicto...</p>}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // REVEAL
  // ════════════════════════════════════════════════════════════
  if (phase === 'reveal' && revealData) {
    const charColor   = selectedChar?.themeColor ?? '#fff'
    const { correct, isLying, hiddenTruth, cluesReview, revealText, closingLine } = revealData

    return (
      <div className={`ip ip--reveal ${correct ? 'ip--correct' : 'ip--wrong'}`} style={{ '--cc': charColor }}>
        <div className="ip-bg ip-bg--dark" aria-hidden="true">
          <div className="ip-bg__spotlight ip-bg__spotlight--1" />
          <div className="ip-bg__spotlight ip-bg__spotlight--2" />
          <div className="ip-bg__vignette" />
        </div>

        <div className="ip-reveal">
          {/* Result banner */}
          <div className={`ip-reveal__banner ${correct ? 'ip-reveal__banner--correct' : 'ip-reveal__banner--wrong'}`}>
            <span className="ip-reveal__banner-icon">{correct ? '✓' : '✗'}</span>
            <span className="ip-reveal__banner-text">
              {correct ? '¡Instinto correcto!' : 'Te engañaron'}
            </span>
          </div>

          {/* Character + closing line */}
          <div className="ip-reveal__char">
            <div className="ip-reveal__char-img" style={{ '--cc': charColor }}>
              <img src={selectedChar?.image} alt={selectedChar?.name} />
            </div>
            {closingLine && (
              <div className="ip-reveal__closing">
                <span className="ip-reveal__closing-quote">"</span>
                <p className="ip-reveal__closing-text">{closingLine}</p>
                <span className="ip-reveal__closing-quote">"</span>
              </div>
            )}
          </div>

          {/* Reveal text */}
          {revealText && (
            <div className="ip-reveal__text">
              <p className="ip-reveal__text-label">
                {isLying ? '💡 La verdad oculta' : '✓ Lo que realmente pasó'}
              </p>
              <p className="ip-reveal__text-body">{revealText}</p>
            </div>
          )}

          {/* Truth */}
          <div className="ip-reveal__truth">
            <span className="ip-reveal__truth-label">Verdad:</span>
            <span className="ip-reveal__truth-body">{hiddenTruth}</span>
          </div>

          {/* Clues review */}
          {cluesReview?.length > 0 && (
            <div className="ip-reveal__clues">
              <p className="ip-reveal__clues-label">Señales que dejó:</p>
              <div className="ip-reveal__clues-list">
                {cluesReview.map((c, i) => (
                  <div key={i} className="ip-clue">
                    <span className="ip-clue__num">P{c.questionIndex}</span>
                    <div className="ip-clue__body">
                      <p className="ip-clue__question">"{c.question}"</p>
                      <p className="ip-clue__clue">{c.clue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="ip-reveal__actions">
            <button className="ip-start-btn" onClick={resetGame}>
              Jugar de nuevo
            </button>
            <button className="ip-back" onClick={() => navigate('/')}>
              Inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
