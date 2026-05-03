import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { characterMap } from '../data/characters'
import { useStreaming } from '../hooks/useStreaming'
import { useMissionImage } from '../hooks/useMissionImage'
import { useMissionAudio } from '../hooks/useMissionAudio'
import CinematicIntro from '../components/CinematicIntro/CinematicIntro'
import MissionVictory from '../components/MissionVictory/MissionVictory'
import MissionCharSelect from './mission/MissionCharSelect'
import MissionSetup from './mission/MissionSetup'
import MissionPlayHeader from './mission/MissionPlayHeader'
import MissionScene from './mission/MissionScene'
import MissionChoices from './mission/MissionChoices'
import MissionEndActions from './mission/MissionEndActions'
import { stripMd, parseMissionResponse } from './mission/parsers.js'
import './MissionPage.css'
import { API_URL } from '../config/api.js'
import { CAMPAIGN_ARCS } from '../data/missionLevels.js'
import { getMissionProgress, saveLevelComplete, resetProgress } from '../utils/game/missionProgress.js'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/api/recordCompletion'
import { ROUTES } from '../utils/constants'
import {
  CHAR_SURNAMES, VIDA_NAMES, INITIAL_VIDA, INITIAL_SIGILO,
  DIFFICULTIES, MISSION_TYPES,
} from './mission/constants.jsx'

// eslint-disable-next-line react-refresh/only-export-components
export { parseChoices, parseEffects, parseMissionResponse } from './mission/parsers.js'

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
        handleChoice(worstChoice) // eslint-disable-line react-hooks/immutability
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
    const char = characterMap[levelConfig.character]
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

  const vidaState = vida >= 4 ? 'optimal' : vida >= 2 ? 'injured' : 'critical'
  const vidaName  = VIDA_NAMES[missionType] || 'Resistencia'
  const riesgoIsDanger = (difficulty === 'hard' || difficulty === 'normal') && riesgo >= 4
  const sigiloIsDanger = difficulty === 'hard' && sigilo <= 1
  const turnNumber = history.length + (phase === 'ended' ? 0 : 1)

  /* ── Intro cinematográfica ── */
  if (phase === 'intro') {
    return (
      <CinematicIntro
        character={selectedChar}
        mode="mission"
        onFinish={handleIntroFinish}
      />
    )
  }

  /* ── Selección de personaje ── */
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

  /* ── Setup ── */
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

  /* ── Misión en curso ── */
  return (
    <div
      className={`mission-page mission-page--playing ${isEnded ? 'mission-page--ended' : ''} ${!isEnded && vidaState === 'critical' ? 'mission-page--critical' : ''}`}
      style={{ '--char-color': selectedChar.themeColor, '--char-gradient': selectedChar.gradient }}
    >
      <MissionPlayHeader
        selectedChar={selectedChar}
        muted={muted}
        onToggleMute={() => setMuted(m => !m)}
        history={history}
        isEnded={isEnded}
        turnNumber={turnNumber}
        isCountdownLevel={isCountdownLevel}
        countdown={countdown}
        vida={vida}
        vidaFlash={vidaFlash}
        vidaState={vidaState}
        vidaName={vidaName}
        riesgoIsDanger={riesgoIsDanger}
        riesgo={riesgo}
        sigiloIsDanger={sigiloIsDanger}
        sigilo={sigilo}
        playerAlias={playerAlias}
        onAbandon={handleRestart}
      />

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

        <MissionScene
          isEnded={isEnded}
          missionResult={missionResult}
          missionTitle={missionTitle}
          sceneImage={sceneImage}
          imageError={imageError}
          onImageError={() => setImageError(true)}
          imageLoading={imageLoading}
          selectedChar={selectedChar}
          missionType={missionType}
          streaming={streaming}
          currentText={currentText}
          sceneKey={sceneKey}
          history={history}
        />

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

        <MissionChoices
          streaming={streaming}
          choices={choices}
          fetchError={fetchError}
          currentText={currentText}
          isEnded={isEnded}
          onChoice={handleChoice}
          onRetry={() => fetchMission(selectedChar, history, { vida, riesgo })}
        />

        {isEnded && !streaming && (
          <MissionEndActions
            campaignMode={campaignMode}
            missionResult={missionResult}
            selectedLevel={selectedLevel}
            copied={copied}
            onNextLevel={handleNextLevel}
            onRestart={handleRestart}
            onNewMission={() => { setHistory([]); setMissionTitle(''); setPhase('setup') }}
            onRetryLevel={() => { setHistory([]); setMissionTitle(''); setPhase('setup') }}
            onShare={handleShare}
            navigate={navigate}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Victory overlay ── */}
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
