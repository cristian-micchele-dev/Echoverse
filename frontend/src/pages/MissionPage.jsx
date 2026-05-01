import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { useStreaming } from '../hooks/useStreaming'
import { useMissionImage } from '../hooks/useMissionImage'
import { useMissionAudio } from '../hooks/useMissionAudio'
import CinematicIntro from '../components/CinematicIntro/CinematicIntro'
import MissionVictory from '../components/MissionVictory/MissionVictory'
import MissionCharSelect from './mission/MissionCharSelect'
import MissionSetup from './mission/MissionSetup'
import './MissionPage.css'
import { API_URL } from '../config/api.js'
import { CAMPAIGN_ARCS } from '../data/missionLevels.js'
import { getMissionProgress, saveLevelComplete, resetProgress } from '../utils/missionProgress.js'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import { ROUTES } from '../utils/constants'
import {
  CHAR_SURNAMES, VIDA_NAMES, INITIAL_VIDA, INITIAL_SIGILO,
  DIFFICULTIES, MISSION_TYPES,
} from './mission/constants.jsx'

function stripMd(str) {
  return str.replace(/\*\*/g, '').replace(/\*/g, '')
}

// eslint-disable-next-line react-refresh/only-export-components
export function parseChoices(block) {
  const choices = []
  const pattern = /\[([ABC])[)\]]\s*([\s\S]*?)(?=\s*\[[ABC][)\]]|EFECTOS:|$)/g
  let match
  while ((match = pattern.exec(block)) !== null) {
    let text = stripMd(match[2].replace(/\s*ENCADENADO:\s*\[[^\]]*\]/gi, '').replace(/,\s*$/, '').trim())
    const typeMatch = text.match(/^(táctica|agresiva|sigilosa|creativa|social)\s*[—-]\s*/i)
    const type = typeMatch ? typeMatch[1].toLowerCase() : null
    if (typeMatch) text = text.slice(typeMatch[0].length).trim()
    if (text) choices.push({ key: match[1], text, type })
  }
  return choices
}

// eslint-disable-next-line react-refresh/only-export-components
export function parseEffects(text) {
  const effects = {}
  const pattern = /([ABC]):\s*vida([+-]?\d+)\s+riesgo([+-]?\d+)(?:\s+sigilo([+-]?\d+))?(?:\s+desc:([^\n]+))?/gi
  let match
  while ((match = pattern.exec(text)) !== null) {
    effects[match[1].toUpperCase()] = {
      vida: parseInt(match[2], 10),
      riesgo: parseInt(match[3], 10),
      sigilo: match[4] ? parseInt(match[4], 10) : 0,
      descripcion: match[5] ? match[5].trim() : null
    }
  }
  return Object.keys(effects).length > 0 ? effects : null
}

// eslint-disable-next-line react-refresh/only-export-components
export function parseMissionResponse(text) {
  let title = null
  let cleanText = text

  const titleMatch = text.match(/^\*{0,2}(?:MISIÓN|TITULO):\*{0,2}\s*\n?\s*(.+?)(?:\n|$)/i)
  if (titleMatch) {
    title = titleMatch[1].trim().replace(/^\*+|\*+$/g, '')
    cleanText = text.slice(titleMatch[0].length).trimStart()
  }

  const isFinal = cleanText.includes('[FIN]')
  if (isFinal) cleanText = cleanText.replace('[FIN]', '').trim()

  let effects = null
  const efectosMatch = cleanText.match(/\nEFECTOS:\n([\s\S]*?)(\n\n|$)/)
  if (efectosMatch) {
    effects = parseEffects(efectosMatch[1])
    cleanText = cleanText.slice(0, efectosMatch.index).trim()
  }

  cleanText = cleanText
    .replace(/^\*{0,2}ESCENA:\*{0,2}\s*\n?/im, '')
    .replace(/\n\*{0,2}OPCIONES:\*{0,2}\s*\n/i, '\n\n---\n')

  const sepMatch = cleanText.match(/\n?\s*---\s*\n/)
  if (sepMatch) {
    const narrative = stripMd(cleanText.slice(0, sepMatch.index).trim())
    const choiceBlock = cleanText.slice(sepMatch.index + sepMatch[0].length)
    return { narrative, choices: parseChoices(choiceBlock), isFinal, title, effects }
  }

  const firstChoice = cleanText.search(/\[A[)\]]/)
  if (firstChoice !== -1) {
    const narrative = stripMd(cleanText.slice(0, firstChoice).replace(/---/g, '').trim())
    return { narrative, choices: parseChoices(cleanText.slice(firstChoice)), isFinal, title, effects }
  }

  return { narrative: stripMd(cleanText), choices: [], isFinal, title, effects }
}

export default function MissionPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('chars')
  const [selectedChar, setSelectedChar] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [difficulty, setDifficulty] = useState('normal')
  const [missionType, setMissionType] = useState('combate')
  const [missionTitle, setMissionTitle] = useState('')
  const [history, setHistory] = useState([])
  const [currentText, setCurrentText] = useState('')
  const [choices, setChoices] = useState([])
  const [currentEffects, setCurrentEffects] = useState(null)
  const [fetchError, setFetchError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [vida, setVida] = useState(4)
  const [riesgo, setRiesgo] = useState(0)
  const [sigilo, setSigilo] = useState(3)
  const [choiceFeedback, setChoiceFeedback] = useState(null)
  const [vidaFlash, setVidaFlash] = useState(null)
  const [missionResult, setMissionResult] = useState(null)
  const [pendingStats, setPendingStats] = useState(null)
  const [victoryDismissed, setVictoryDismissed] = useState(false)
  const [victoryReady, setVictoryReady] = useState(false)
  const { session } = useAuth()
  const { isLoading: streaming, streamChat } = useStreaming()
  const [campaignMode, setCampaignMode] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [timerActive, setTimerActive] = useState(false)
  const [campaignProgress, setCampaignProgress] = useState(() => getMissionProgress())
  const bottomRef = useRef(null)
  const nameInputRef = useRef(null)
  const missionRecordedRef = useRef(false)

  const { muted, setMuted } = useMissionAudio(phase)
  const {
    sceneImage, imageError, setImageError,
    imageLoading, sceneKey, bumpSceneKey,
    resetImageState, fetchMissionImage,
  } = useMissionImage()

  useEffect(() => {
    document.title = 'Modo Misión — EchoVerse'
    return () => { document.title = 'EchoVerse' }
  }, [])

  useEffect(() => {
    if (phase === 'ended' && !missionRecordedRef.current) {
      missionRecordedRef.current = true
      recordCompletion(session, 'mission')
    }
  }, [phase, session])

  useEffect(() => {
    if (!session) return
    fetch(`${API_URL}/db/mission-progress`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.highestUnlocked > 1) {
          setCampaignProgress(data)
        } else {
          const local = getMissionProgress()
          if (local.highestUnlocked > 1) {
            fetch(`${API_URL}/db/mission-progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ highestUnlocked: local.highestUnlocked, completedLevels: local.completedLevels })
            }).catch(() => {})
            resetProgress()
          }
        }
      })
      .catch(() => {})
  }, [session])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentText, choices])

  useEffect(() => {
    if (phase === 'setup') setTimeout(() => nameInputRef.current?.focus(), 100)
  }, [phase])

  const isCountdownLevel = selectedLevel?.type === 'countdown'

  useEffect(() => {
    if (!isCountdownLevel) return
    if (choices.length > 0 && !streaming) {
      setCountdown(30)
      setTimerActive(true)
    }
  }, [choices, streaming, isCountdownLevel])

  useEffect(() => {
    if (!timerActive || countdown === null) return
    if (countdown <= 0) {
      setTimerActive(false)
      if (currentEffects && choices.length > 0) {
        let worstKey = choices[0].key
        let worstScore = Infinity
        for (const ch of choices) {
          const eff = currentEffects[ch.key]
          if (eff) {
            const score = (eff.vida || 0) - (eff.riesgo || 0) + (eff.sigilo ?? 0)
            if (score < worstScore) { worstScore = score; worstKey = ch.key }
          }
        }
        const worstChoice = choices.find(c => c.key === worstKey) || choices[0]
        handleChoice(worstChoice)
      }
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [timerActive, countdown]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delay del overlay de victoria ────────────────────────────────────────
  const isEnded = phase === 'ended'
  useEffect(() => {
    if (isEnded && missionResult === 'win' && !streaming) {
      const t = setTimeout(() => setVictoryReady(true), 7000)
      return () => clearTimeout(t)
    }
  }, [isEnded, missionResult, streaming])

  const surname = selectedChar ? (CHAR_SURNAMES[selectedChar.id] || '') : ''
  const playerAlias = playerName.trim() ? `${playerName.trim()} ${surname}`.trim() : ''

  const fetchMission = async (char, historyArray, currentStats, finalResult = null) => {
    setCurrentText('')
    setChoices([])
    setCurrentEffects(null)
    setFetchError(false)
    bumpSceneKey()

    let fullText = ''

    try {
      await streamChat(
        `${API_URL}/mission`,
        {
          characterId: char.id,
          history: historyArray,
          playerName: playerAlias,
          difficulty,
          missionType,
          stats: currentStats,
          finalResult,
          isCampaign: campaignMode
        },
        content => {
          fullText += content
          let display = fullText
            .replace(/^\*{0,2}(?:MISIÓN|TITULO):\*{0,2}[^\n]*\n(?:[^\n]+\n)?/i, '')
            .replace(/^\*{0,2}ESCENA:\*{0,2}\s*\n?/im, '')
            .replace(/\n\*{0,2}(?:OPCIONES|EFECTOS):\*{0,2}[\s\S]*$/, '')
            .replace(/\[FIN\]/g, '')
          const sepIdx = display.search(/\n?\s*---\s*\n/)
          setCurrentText(stripMd((sepIdx !== -1 ? display.slice(0, sepIdx) : display).trim()))
        }
      )

      if (fullText) {
        const { narrative, choices: parsed, title, effects } = parseMissionResponse(fullText)
        if (title) setMissionTitle(title)
        setCurrentText(narrative)
        if (effects) setCurrentEffects(effects)
        if (!finalResult) setChoices(parsed)
        if (historyArray.length === 0) {
          fetchMissionImage(char, difficulty, missionType, narrative, title || '')
        }
      }
    } catch {
      setFetchError(true)
    }
  }

  const handleCharSelect = (char) => {
    setSelectedChar(char)
    if (isCountdownLevel) setPlayerName(char.name)
    setPhase('setup')
  }

  const handleCampaignLevelSelect = (levelConfig) => {
    if (levelConfig.type === 'countdown') {
      setSelectedLevel(levelConfig)
      setDifficulty('hard')
      setPhase('chars')
      return
    }
    const char = characters.find(c => c.id === levelConfig.character)
    if (!char) return
    setSelectedLevel(levelConfig)
    setSelectedChar(char)
    setDifficulty(levelConfig.difficulty)
    setPlayerName(char.name)
    setPhase('setup')
  }

  const handleNextLevel = () => {
    const nextConfig = CAMPAIGN_ARCS.flatMap(a => a.levels).find(l => l.level === selectedLevel?.level + 1)
    if (nextConfig) {
      handleCampaignLevelSelect(nextConfig)
    } else {
      handleRestart()
    }
  }

  const handleStartMission = () => {
    if (!campaignMode && !playerName.trim()) return
    if (campaignMode && !playerName.trim() && selectedChar) setPlayerName(selectedChar.name)
    const startVida   = INITIAL_VIDA[difficulty]   ?? 4
    const startSigilo = INITIAL_SIGILO[difficulty] ?? 3
    const stats = { vida: startVida, riesgo: 0, sigilo: startSigilo }
    setHistory([])
    setMissionTitle('')
    setVida(startVida)
    setRiesgo(0)
    setSigilo(startSigilo)
    setChoiceFeedback(null)
    setCurrentEffects(null)
    setMissionResult(null)
    setVictoryDismissed(false)
    setVictoryReady(false)
    setPendingStats(stats)
    setPhase('intro')
  }

  const handleIntroFinish = useCallback(() => {
    setPhase('playing')
    if (pendingStats) fetchMission(selectedChar, [], pendingStats)
  }, [pendingStats, selectedChar]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = (choice) => {
    setChoiceFeedback(null)
    setTimerActive(false)
    setCountdown(null)
    const fx = currentEffects?.[choice.key]
    const newVida   = fx ? Math.max(0, Math.min(5, vida   + fx.vida))          : vida
    const newRiesgo = fx ? Math.max(0, Math.min(5, riesgo + fx.riesgo))        : riesgo
    const newSigilo = fx ? Math.max(0, Math.min(5, sigilo + (fx.sigilo ?? 0))) : sigilo
    setVida(newVida)
    setRiesgo(newRiesgo)
    setSigilo(newSigilo)
    if (fx && fx.vida !== 0) {
      setVidaFlash(fx.vida < 0 ? 'hit' : 'heal')
      setTimeout(() => setVidaFlash(null), 450)
    }
    if (fx?.descripcion) {
      setChoiceFeedback({ text: fx.descripcion, vida: fx.vida, riesgo: fx.riesgo, sigilo: fx.sigilo ?? 0 })
    }
    const newHistory = [...history, { narrative: currentText, choice: `${choice.key}) ${choice.text}` }]
    setHistory(newHistory)
    setChoices([])

    const loseByRiesgo = (difficulty === 'hard' || difficulty === 'normal') && newRiesgo >= 5
    const loseBySigilo = difficulty === 'hard' && newSigilo === 0
    if (newVida === 0 || loseByRiesgo || loseBySigilo) {
      setMissionResult('lose')
      setPhase('ended')
      fetchMission(selectedChar, newHistory, { vida: 0, riesgo: newRiesgo, sigilo: newSigilo }, 'lose')
      return
    }

    if (newHistory.length >= 5) {
      setMissionResult('win')
      setPhase('ended')
      if (campaignMode && selectedLevel) {
        saveLevelComplete(selectedLevel.level)
        const updated = getMissionProgress()
        setCampaignProgress(updated)
        if (session) {
          fetch(`${API_URL}/db/mission-progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ highestUnlocked: updated.highestUnlocked, completedLevels: updated.completedLevels })
          }).catch(() => {})
        }
      }
      fetchMission(selectedChar, newHistory, { vida: newVida, riesgo: newRiesgo, sigilo: newSigilo }, 'win')
      return
    }

    fetchMission(selectedChar, newHistory, { vida: newVida, riesgo: newRiesgo, sigilo: newSigilo })
  }

  const handleRestart = () => {
    setTimerActive(false)
    setCountdown(null)
    setPhase('chars')
    setSelectedChar(null)
    setSelectedLevel(null)
    setCampaignProgress(getMissionProgress())
    setPlayerName('')
    setHistory([])
    setCurrentText('')
    setChoices([])
    setCurrentEffects(null)
    setMissionResult(null)
    setFetchError(false)
    setMissionTitle('')
    setCopied(false)
    setVida(4)
    setRiesgo(0)
    setSigilo(3)
    setChoiceFeedback(null)
    setVidaFlash(null)
    resetImageState()
    setVictoryReady(false)
    missionRecordedRef.current = false
  }

  const handleShare = async () => {
    const diff = DIFFICULTIES.find(d => d.id === difficulty)?.label
    const mtype = MISSION_TYPES.find(m => m.id === missionType)?.label
    const decisionsText = history.map((e, i) => `  ${i + 1}. ${e.choice}`).join('\n')
    const resultLabel = missionResult === 'win' ? '✔ Completada' : missionResult === 'lose' ? '✕ Fallida' : ''
    const text = [
      `⚔ MISIÓN: ${missionTitle || 'Sin título'}${resultLabel ? ` — ${resultLabel}` : ''}`,
      `Personaje: ${selectedChar?.name}  |  Jugador: ${playerAlias}`,
      `Dificultad: ${diff}  |  Tipo: ${mtype}`,
      '',
      'Decisiones:',
      decisionsText,
      '',
      '— EchoVerse'
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }

  const totalTurns = 5
  const turnNumber = history.length + (phase === 'ended' ? 0 : 1)
  const vidaState = vida >= 4 ? 'optimal' : vida >= 2 ? 'injured' : 'critical'
  const vidaName  = VIDA_NAMES[missionType] || 'Resistencia'
  const riesgoIsDanger = (difficulty === 'hard' || difficulty === 'normal') && riesgo >= 4
  const sigiloIsDanger = difficulty === 'hard' && sigilo <= 1

  /* ── Intro cinematográfica ───────────────────────── */
  if (phase === 'intro') {
    return (
      <CinematicIntro
        character={selectedChar}
        mode="mission"
        onFinish={handleIntroFinish}
      />
    )
  }

  /* ── Selección de personaje ──────────────────────── */
  if (phase === 'chars') {
    return (
      <MissionCharSelect
        campaignMode={campaignMode}
        setCampaignMode={setCampaignMode}
        campaignProgress={campaignProgress}
        setCampaignProgress={setCampaignProgress}
        handleCharSelect={handleCharSelect}
        handleCampaignLevelSelect={handleCampaignLevelSelect}
      />
    )
  }

  /* ── Setup ──────────────────────────────────────── */
  if (phase === 'setup') {
    return (
      <MissionSetup
        campaignMode={campaignMode}
        selectedChar={selectedChar}
        selectedLevel={selectedLevel}
        playerName={playerName}
        setPlayerName={setPlayerName}
        playerAlias={playerAlias}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        missionType={missionType}
        setMissionType={setMissionType}
        nameInputRef={nameInputRef}
        handleStartMission={handleStartMission}
        onBack={() => setPhase('chars')}
      />
    )
  }

  /* ── Misión en curso ─────────────────────────────── */
  return (
    <div
      className={`mission-page mission-page--playing ${isEnded ? 'mission-page--ended' : ''} ${!isEnded && vidaState === 'critical' ? 'mission-page--critical' : ''}`}
      style={{ '--char-color': selectedChar.themeColor, '--char-gradient': selectedChar.gradient }}
    >
      <div className="mission-play-header">
        <div className="mission-header-top">
          <div className="mission-header-left">
            <button className="mission-back-btn mission-back-btn--abandon" onClick={handleRestart}>
              ✕ Abandonar
            </button>
            <button
              className="mission-mute-btn"
              onClick={() => setMuted(m => !m)}
              title={muted ? 'Activar música' : 'Silenciar música'}
              aria-label={muted ? 'Activar música' : 'Silenciar música'}
              aria-pressed={muted}
            >
              {muted
                ? <svg width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M3 9v4h4l5 5V4L7 9H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="17" y1="9" x2="21" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="21" y1="9" x2="17" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                : <svg width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M3 9v4h4l5 5V4L7 9H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M16 8.5a5 5 0 0 1 0 5M19 6a9 9 0 0 1 0 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              }
            </button>
          </div>
          <div className="mission-play-identity">
            {selectedChar.image
              ? <img src={selectedChar.image} alt={selectedChar.name} className="mission-play-avatar" loading="lazy" decoding="async" />
              : <span className="mission-play-avatar-emoji">{selectedChar.emoji}</span>
            }
            <div>
              <span className="mission-play-name">{selectedChar.name}</span>
              <span className="mission-play-universe">{playerAlias}</span>
            </div>
          </div>
          <div className="mission-progress">
            {Array.from({ length: totalTurns }).map((_, i) => (
              <span
                key={i}
                className={`mission-progress__dot ${
                  i < history.length ? 'mission-progress__dot--done' :
                  i === history.length && !isEnded ? 'mission-progress__dot--active' : ''
                }`}
              />
            ))}
            <span className="mission-progress__label">
              {isEnded ? 'Final' : `${Math.min(turnNumber, totalTurns)} / ${totalTurns}`}
            </span>
          </div>
        </div>
        <div className="mission-stats">
          {isCountdownLevel && countdown !== null && (
            <div className={`mission-countdown ${countdown <= 10 ? 'mission-countdown--urgent' : ''}`}>
              <span className="mission-countdown__icon">⏱</span>
              <span className="mission-countdown__value">{countdown}s</span>
            </div>
          )}
          <div className={`mission-stat mission-stat--${vidaState}${vidaFlash ? ` mission-stat--flash-${vidaFlash}` : ''}`} title={vidaName}>
            <span className="mission-stat__icon mission-stat__icon--vida">❤</span>
            <div className="mission-stat__bar">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`mission-stat__pip ${i < vida ? 'mission-stat__pip--on' : ''} mission-stat__pip--vida`} />
              ))}
            </div>
            <span className="mission-stat__name">{vidaName}</span>
          </div>
          <div className={`mission-stat${riesgoIsDanger ? ' mission-stat--critical' : ''}`} title="Riesgo">
            <span className="mission-stat__icon">👁</span>
            <div className="mission-stat__bar">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`mission-stat__pip ${i < riesgo ? 'mission-stat__pip--on' : ''} mission-stat__pip--riesgo`} />
              ))}
            </div>
            <span className="mission-stat__name">Riesgo</span>
          </div>
          <div className={`mission-stat${sigiloIsDanger ? ' mission-stat--critical' : ''}`} title="Sigilo">
            <span className="mission-stat__icon">🌑</span>
            <div className="mission-stat__bar">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`mission-stat__pip ${i < sigilo ? 'mission-stat__pip--on' : ''} mission-stat__pip--sigilo`} />
              ))}
            </div>
            <span className="mission-stat__name">Sigilo</span>
          </div>
        </div>
      </div>

      <div className="mission-play-content">

        {history.map((entry, i) => (
          <div key={i} className="mission-entry mission-entry--collapsed">
            <span className="mission-entry__turn-label">T{i + 1}</span>
            <span className="mission-entry__choice-badge">↩ {entry.choice}</span>
          </div>
        ))}

        {choiceFeedback && (
          <div className="mission-choice-result">
            <p className="mission-choice-result__text">{choiceFeedback.text}</p>
            <div className="mission-choice-result__changes">
              {choiceFeedback.vida   !== 0 && <span className={`mission-delta ${choiceFeedback.vida   > 0 ? 'mission-delta--up' : 'mission-delta--down'}`}>{vidaName} {choiceFeedback.vida > 0 ? '+' : ''}{choiceFeedback.vida}</span>}
              {choiceFeedback.riesgo !== 0 && <span className={`mission-delta ${choiceFeedback.riesgo > 0 ? 'mission-delta--bad' : 'mission-delta--good'}`}>👁 {choiceFeedback.riesgo > 0 ? '+' : ''}{choiceFeedback.riesgo}</span>}
              {choiceFeedback.sigilo !== 0 && <span className={`mission-delta ${choiceFeedback.sigilo > 0 ? 'mission-delta--up' : 'mission-delta--down'}`}>🌑 {choiceFeedback.sigilo > 0 ? '+' : ''}{choiceFeedback.sigilo}</span>}
            </div>
          </div>
        )}

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
                onError={() => setImageError(true)}
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

        {isEnded && !streaming && history.length > 0 && (
          <div className="mission-decisions">
            <p className="mission-decisions__label">Tu camino</p>
            {history.map((e, i) => (
              <div key={i} className="mission-decisions__item">
                <span className="mission-decisions__num">{i + 1}</span>
                <span className="mission-decisions__text">{e.choice}</span>
              </div>
            ))}
          </div>
        )}

        {!streaming && choices.length > 0 && (
          <div className="mission-choices">
            <div className="mission-choices__label">⚡ Tomá una decisión</div>
            <div className="mission-choices__list">
              {choices.map((choice, index) => (
                <button
                  key={choice.key}
                  className={`mission-choice-btn ${choice.type ? `mission-choice-btn--${choice.type}` : ''}`}
                  style={{ '--i': index }}
                  onClick={() => handleChoice(choice)}
                >
                  <span className="mission-choice-btn__key">{choice.key}</span>
                  <span className="mission-choice-btn__body">
                    {choice.type && <span className="mission-choice-btn__type">{choice.type}</span>}
                    <span className="mission-choice-btn__text">{choice.text}</span>
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {!streaming && choices.length === 0 && !isEnded && (fetchError || currentText) && (
          <div className="mission-choices">
            <p className="mission-choices__label mission-choices__label--warn">
              {fetchError ? 'Error de conexión — puede ser un límite de la API' : 'No se generaron acciones'}
            </p>
            <button className="mission-choice-btn" onClick={() => fetchMission(selectedChar, history, { vida, riesgo })}>
              <span className="mission-choice-btn__key">↺</span>
              <span className="mission-choice-btn__text">Reintentar</span>
            </button>
          </div>
        )}

        {isEnded && !streaming && (
          <div className="mission-end-actions">
            {campaignMode && missionResult === 'win' && selectedLevel?.level === 30 ? (
              <div className="mission-campaign-complete">
                <p className="mission-campaign-complete__title">¡Campaña completada!</p>
                <p className="mission-campaign-complete__sub">Superaste los 30 niveles. Sos una leyenda.</p>
                <button className="mission-end-btn mission-end-btn--chars" onClick={handleRestart}>
                  Volver a campaña
                </button>
              </div>
            ) : campaignMode && missionResult === 'win' ? (
              <>
                <button className="mission-end-btn mission-end-btn--next" onClick={handleNextLevel}>
                  Siguiente nivel
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="mission-end-actions__row">
                  <button className="mission-end-btn mission-end-btn--chars" onClick={handleRestart}>Campaña</button>
                  <button className="mission-end-btn mission-end-btn--home" onClick={() => navigate(ROUTES.HOME)}>Inicio</button>
                </div>
              </>
            ) : campaignMode && missionResult === 'lose' ? (
              <>
                <button className="mission-end-btn mission-end-btn--new" onClick={() => {
                  setHistory([])
                  setMissionTitle('')
                  setPhase('setup')
                }}>
                  Reintentar nivel
                </button>
                <div className="mission-end-actions__row">
                  <button className="mission-end-btn mission-end-btn--chars" onClick={handleRestart}>Campaña</button>
                  <button className="mission-end-btn mission-end-btn--home" onClick={() => navigate(ROUTES.HOME)}>Inicio</button>
                </div>
              </>
            ) : (
              <>
                <button className="mission-end-btn mission-end-btn--new" onClick={() => {
                  setHistory([])
                  setMissionTitle('')
                  setPhase('setup')
                }}>
                  Nueva misión
                </button>
                <div className="mission-end-actions__row">
                  <button className="mission-end-btn mission-end-btn--share" onClick={handleShare}>
                    {copied ? 'Copiado' : 'Compartir'}
                  </button>
                  <button className="mission-end-btn mission-end-btn--chars" onClick={handleRestart}>Otro personaje</button>
                  <button className="mission-end-btn mission-end-btn--home" onClick={() => navigate(ROUTES.HOME)}>Inicio</button>
                </div>
              </>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Victory overlay ──────────────────────────────── */}
      {isEnded && missionResult === 'win' && !streaming && victoryReady && !victoryDismissed && (
        <MissionVictory
          missionTitle={missionTitle}
          campaignMode={campaignMode}
          selectedLevel={selectedLevel}
          vida={vida}
          sigilo={sigilo}
          riesgo={riesgo}
          vidaName={vidaName}
          history={history}
          onDismiss={() => setVictoryDismissed(true)}
          onNextLevel={handleNextLevel}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
