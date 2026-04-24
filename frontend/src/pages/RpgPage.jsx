import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { characters } from '../data/characters'
import { RPG_WORLDS, RPG_WORLDS_MAP } from '../data/rpgWorlds'
import { useStreaming } from '../hooks/useStreaming'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import { addModeXP } from '../utils/affinity'
import { useLevelUpToast } from '../hooks/useLevelUpToast'
import { parseRpgResponse } from '../utils/aiResponseParser'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api.js'
import './RpgPage.css'

const MAX_TURNS = 6

const TRAIT_META = {
  valiente:   { emoji: '⚔️', label: 'Valiente',   color: '#E05252' },
  astuto:     { emoji: '🧠', label: 'Astuto',     color: '#7252E8' },
  compasivo:  { emoji: '💛', label: 'Compasivo',  color: '#E8C252' },
  implacable: { emoji: '🔥', label: 'Implacable', color: '#E87C52' },
  sabio:      { emoji: '📚', label: 'Sabio',      color: '#52A8E8' },
  rebelde:    { emoji: '⚡', label: 'Rebelde',    color: '#52D98C' },
  leal:       { emoji: '🛡️', label: 'Leal',       color: '#A852E8' },
}

// Characters that have RPG worlds defined
const RPG_CHAR_IDS = new Set(RPG_WORLDS.map(w => w.characterId))
const rpgCharacters = characters.filter(c => RPG_CHAR_IDS.has(c.id))

export default function RpgPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { isLoading: streaming, isTyping, streamChat } = useStreaming()
  const { levelUpToast, dismissLevelUp, notifyLevelUp } = useLevelUpToast()
  const recordedRef = useRef(false)
  const bottomRef = useRef(null)

  const [phase, setPhase] = useState('select')         // 'select' | 'playing' | 'ended'
  const [selectStep, setSelectStep] = useState('chars') // 'chars' | 'worlds'
  const [selectedChar, setSelectedChar] = useState(null)
  const [selectedWorld, setSelectedWorld] = useState(null)
  const [history, setHistory] = useState([])
  const [traitProfile, setTraitProfile] = useState({})
  const [currentText, setCurrentText] = useState('')
  const [choices, setChoices] = useState([])
  const [result, setResult] = useState(null)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentText, choices])

  useEffect(() => {
    if (phase === 'ended' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'rpg')
      if (selectedChar) {
        const res = addModeXP(selectedChar.id, 'rpg')
        notifyLevelUp(res, selectedChar.name)
      }
    }
  }, [phase, session, selectedChar, notifyLevelUp])

  async function fetchRpg(char, world, historyArray, newTraitProfile) {
    setCurrentText('')
    setChoices([])
    setFetchError(false)
    const isFinal = historyArray.length >= MAX_TURNS - 1

    let fullText = ''

    try {
      await streamChat(
        `${API_URL}/rpg`,
        { characterId: char.id, worldPrompt: world.prompt, history: historyArray, traitProfile: newTraitProfile, isFinal },
        content => {
          fullText += content
          const sepIdx = fullText.search(/\n?\s*---\s*\n/)
          setCurrentText(sepIdx !== -1 ? fullText.slice(0, sepIdx).trim() : fullText)
        }
      )

      if (fullText) {
        const parsed = parseRpgResponse(fullText, isFinal)
        setCurrentText(parsed.narrative)
        if (parsed.isFinal) {
          setResult(parsed.result)
          setPhase('ended')
        } else {
          setChoices(parsed.choices)
        }
      }
    } catch {
      setFetchError(true)
    }
  }

  function handleCharSelect(char) {
    setSelectedChar(char)
    setSelectStep('worlds')
  }

  function handleWorldSelect(world) {
    setSelectedWorld(world)
    setHistory([])
    setTraitProfile({})
    recordedRef.current = false
    setPhase('playing')
    fetchRpg(selectedChar, world, [], {})
  }

  function handleChoice(choice) {
    const newHistory = [
      ...history,
      { narrative: currentText, choice: `${choice.key}) ${choice.text}`, trait: choice.trait }
    ]
    const newTraitProfile = { ...traitProfile, [choice.trait]: (traitProfile[choice.trait] || 0) + 1 }
    setHistory(newHistory)
    setTraitProfile(newTraitProfile)
    setChoices([])
    fetchRpg(selectedChar, selectedWorld, newHistory, newTraitProfile)
  }

  function handleRestart() {
    setPhase('select')
    setSelectStep('chars')
    setSelectedChar(null)
    setSelectedWorld(null)
    setHistory([])
    setTraitProfile({})
    setCurrentText('')
    setChoices([])
    setResult(null)
    setFetchError(false)
    recordedRef.current = false
  }

  const turn = history.length + (phase === 'ended' ? 0 : 1)

  const sortedTraits = Object.entries(traitProfile)
    .sort((a, b) => b[1] - a[1])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === 'select') {
    return (
      <div className="rpg-page">
        <Helmet><title>Forja tu Leyenda — Echoverse</title></Helmet>

        {selectStep === 'chars' && (
          <div className="rpg-select">
            <button className="rpg-back-btn" onClick={() => navigate(ROUTES.MODOS)}>← Modos</button>
            <div className="rpg-select__header">
              <h1 className="rpg-select__title">Forja tu Leyenda</h1>
              <p className="rpg-select__sub">Elegí tu compañero de viaje</p>
            </div>
            <div className="rpg-char-grid">
              {rpgCharacters.map(char => (
                <button
                  key={char.id}
                  className="rpg-char-card"
                  onClick={() => handleCharSelect(char)}
                >
                  <div
                    className="rpg-char-card__avatar"
                    style={{ backgroundImage: `url(${char.image})`, borderColor: char.themeColor }}
                  />
                  <span className="rpg-char-card__name">{char.name}</span>
                  <span className="rpg-char-card__universe">{char.universe}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectStep === 'worlds' && selectedChar && (
          <div className="rpg-select">
            <button className="rpg-back-btn" onClick={() => setSelectStep('chars')}>← Personajes</button>
            <div className="rpg-select__header">
              <div
                className="rpg-select__char-avatar"
                style={{ backgroundImage: `url(${selectedChar.image})`, borderColor: selectedChar.themeColor }}
              />
              <h2 className="rpg-select__title">{selectedChar.name}</h2>
              <p className="rpg-select__sub">Elegí el mundo donde comienza tu leyenda</p>
            </div>
            <div className="rpg-world-grid">
              {(RPG_WORLDS_MAP[selectedChar.id] || []).map(world => (
                <button
                  key={world.id}
                  className="rpg-world-card"
                  onClick={() => handleWorldSelect(world)}
                >
                  <span className="rpg-world-card__emoji">{world.emoji}</span>
                  <span className="rpg-world-card__title">{world.title}</span>
                  <p className="rpg-world-card__desc">{world.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'ended' && result) {
    const dominant = TRAIT_META[result.dominantTrait]
    return (
      <div className="rpg-page">
        <Helmet><title>Tu Leyenda — Echoverse</title></Helmet>
        {levelUpToast && (
          <AchievementToast
            message={levelUpToast.message}
            subtext={levelUpToast.subtext}
            onDismiss={dismissLevelUp}
          />
        )}
        <div className="rpg-ended">
          <div className="rpg-sheet">
            <div className="rpg-sheet__crown">⚔️</div>
            <h2 className="rpg-sheet__title">{result.title}</h2>
            {dominant && (
              <div className="rpg-sheet__dominant" style={{ color: dominant.color }}>
                <span>{dominant.emoji}</span>
                <span>{dominant.label}</span>
              </div>
            )}

            <div className="rpg-sheet__traits">
              {sortedTraits.map(([trait, count]) => {
                const meta = TRAIT_META[trait]
                if (!meta) return null
                return (
                  <div key={trait} className="rpg-sheet__trait" style={{ '--trait-color': meta.color }}>
                    <span className="rpg-sheet__trait-emoji">{meta.emoji}</span>
                    <span className="rpg-sheet__trait-label">{meta.label}</span>
                    <span className="rpg-sheet__trait-count">{count}x</span>
                  </div>
                )
              })}
            </div>

            {result.farewell && (
              <blockquote className="rpg-sheet__farewell">
                <span className="rpg-sheet__farewell-char">{selectedChar?.name}:</span>
                <em>"{result.farewell}"</em>
              </blockquote>
            )}

            <div className="rpg-sheet__actions">
              <button className="rpg-btn rpg-btn--primary" onClick={handleRestart}>
                Nueva Leyenda
              </button>
              <button className="rpg-btn rpg-btn--ghost" onClick={() => navigate(ROUTES.MODOS)}>
                Modos
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing phase ──────────────────────────────────────────────────────────
  return (
    <div className="rpg-page">
      <Helmet><title>Forja tu Leyenda — Echoverse</title></Helmet>
      {levelUpToast && (
        <AchievementToast
          message={levelUpToast.message}
          subtext={levelUpToast.subtext}
          onDismiss={dismissLevelUp}
        />
      )}

      <div className="rpg-playing">
        {/* Header */}
        <div className="rpg-header">
          <button className="rpg-back-btn rpg-back-btn--inline" onClick={handleRestart}>←</button>
          <div className="rpg-header__char">
            <div
              className="rpg-header__avatar"
              style={{ backgroundImage: `url(${selectedChar?.image})`, borderColor: selectedChar?.themeColor }}
            />
            <div>
              <span className="rpg-header__name">{selectedChar?.name}</span>
              <span className="rpg-header__world">{selectedWorld?.title}</span>
            </div>
          </div>
          <div className="rpg-header__turn">
            <span className="rpg-header__turn-label">Turno</span>
            <span className="rpg-header__turn-num">{Math.min(turn, MAX_TURNS)}/{MAX_TURNS}</span>
          </div>
        </div>

        <div className="rpg-content">
          {/* Narrative */}
          <div className="rpg-narrative-col">
            <div className="rpg-narrative">
              {isTyping && !currentText && (
                <div className="rpg-typing">
                  <span /><span /><span />
                </div>
              )}
              {currentText && (
                <div className="rpg-narrative__text">
                  {currentText.split('\n').filter(Boolean).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
            </div>

            {fetchError && (
              <div className="rpg-error">
                <p>Algo salió mal.</p>
                <button
                  className="rpg-btn rpg-btn--ghost"
                  onClick={() => fetchRpg(selectedChar, selectedWorld, history, traitProfile)}
                >
                  Reintentar
                </button>
              </div>
            )}

            {!streaming && choices.length > 0 && (
              <div className="rpg-choices">
                {choices.map(choice => {
                  const meta = TRAIT_META[choice.trait]
                  return (
                    <button
                      key={choice.key}
                      className="rpg-choice"
                      onClick={() => handleChoice(choice)}
                    >
                      <span className="rpg-choice__key">{choice.key}</span>
                      {meta && (
                        <span className="rpg-choice__trait" style={{ color: meta.color }}>
                          {meta.emoji} {meta.label}
                        </span>
                      )}
                      <span className="rpg-choice__text">{choice.text}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Trait sidebar */}
          <aside className="rpg-trait-sidebar">
            <span className="rpg-trait-sidebar__title">Tu perfil</span>
            {sortedTraits.length === 0 ? (
              <span className="rpg-trait-sidebar__empty">Tus rasgos aparecerán aquí</span>
            ) : (
              sortedTraits.map(([trait, count]) => {
                const meta = TRAIT_META[trait]
                if (!meta) return null
                return (
                  <div key={trait} className="rpg-trait-pill" style={{ '--trait-color': meta.color }}>
                    <span>{meta.emoji}</span>
                    <span className="rpg-trait-pill__label">{meta.label}</span>
                    <span className="rpg-trait-pill__count">{count}x</span>
                  </div>
                )
              })
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
