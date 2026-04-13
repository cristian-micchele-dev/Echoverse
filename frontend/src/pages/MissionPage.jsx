import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { readSSEStream } from '../utils/sse'
import CinematicIntro from '../components/CinematicIntro/CinematicIntro'
import './MissionPage.css'
import { API_URL } from '../config/api.js'
import { CAMPAIGN_ARCS } from '../data/missionLevels.js'
import { getMissionProgress, isLevelUnlocked, saveLevelComplete, resetProgress } from '../utils/missionProgress.js'
import { useAuth } from '../context/AuthContext'

const MISSION_TRACKS = [
  '/sounds/ArcSound - Dark Suspense Cinematic.mp3',
  '/sounds/ArcSound - Cinema Cinematic Trailer.mp3',
]
let trackIndex = 0

const CHAR_SURNAMES = {
  'harry-potter': 'Potter', 'gollum': 'el Maldito', 'john-wick': 'Wick',
  'walter-white': 'White', 'darth-vader': 'Vader', 'tony-stark': 'Stark',
  'sherlock': 'Holmes', 'jack-sparrow': 'Sparrow', 'gandalf': 'el Gris',
  'goku': 'Son', 'ip-man': 'Ip', 'el-profesor': 'Alves', 'capitan-flint': 'Flint',
  'jax-teller': 'Teller', 'nathan-algren': 'Algren', 'lara-croft': 'Croft',
  'spider-man': 'Parker', 'terminator': 'T-800', 'ragnar-lothbrok': 'Lothbrok',
  'leonidas': 'de Esparta', 'tommy-shelby': 'Shelby', 'eleven': 'Hopper',
  'geralt': 'de Rivia', 'jon-snow': 'Snow', 'kurt-sloane': 'Sloane',
  'venom': 'Brock', 'furiosa': 'Furiosa', 'alice': 'Abernathy',
  'katniss': 'Everdeen', 'bryan-mills': 'Mills', 'frank-martin': 'Martin',
  'rocky-balboa': 'Balboa', 'tony-ja': 'Ja', 'james-bond': 'Bond',
  'la-novia': 'Dragonfly', 'tyler-durden': 'Durden', 'hannibal': 'Lecter',
  'norman-bates': 'Bates', 'wolverine': 'Logan', 'john-mcclane': 'McClane',
  'iko-uwais': 'Rama', 'superman': 'Kent', 'ethan-hunt': 'Hunt',
  'joker': 'el Joker', 'aragorn': 'Elessar', 'batman': 'Wayne',
  'kratos': 'el Fantasma', 'nascimento': 'Nascimento', 'bruce-lee': 'Lee',
  'aquiles': 'de Ftía', 'the-punisher': 'Castle', 'william-wallace': 'Wallace',
  'casey-ryback': 'Ryback'
}

const VIDA_NAMES = {
  combate:       'Resistencia',
  infiltracion:  'Cobertura',
  rescate:       'Margen',
  investigacion: 'Control'
}

const DIFFICULTIES = [
  { id: 'easy',   label: 'Fácil',   desc: 'El personaje te guía', color: '#4ade80' },
  { id: 'normal', label: 'Normal',  desc: 'Equilibrado',          color: '#facc15' },
  { id: 'hard',   label: 'Difícil', desc: 'Sin piedad',           color: '#f87171' }
]

const MISSION_TYPES = [
  { id: 'combate',       label: '⚔ Combate',       desc: 'Supervivencia' },
  { id: 'infiltracion',  label: '🕵 Infiltración',  desc: 'Espionaje' },
  { id: 'rescate',       label: '🛡 Rescate',        desc: 'Protección' },
  { id: 'investigacion', label: '🔍 Investigación', desc: 'Misterio' }
]

function stripMd(str) {
  return str.replace(/\*\*/g, '').replace(/\*/g, '')
}

// eslint-disable-next-line react-refresh/only-export-components
export function parseChoices(block) {
  const choices = []
  const pattern = /\[([ABC])\]\s*([\s\S]*?)(?=\s*\[[ABC]\]|EFECTOS:|$)/g
  let match
  while ((match = pattern.exec(block)) !== null) {
    let text = stripMd(match[2].replace(/,\s*$/, '').trim())
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

  // Handle "TITULO:\ntítulo", "MISIÓN: título", "**TITULO:**\n*título*", etc.
  const titleMatch = text.match(/^\*{0,2}(?:MISIÓN|TITULO):\*{0,2}\s*\n?\s*(.+?)(?:\n|$)/i)
  if (titleMatch) {
    title = titleMatch[1].trim().replace(/^\*+|\*+$/g, '')
    cleanText = text.slice(titleMatch[0].length).trimStart()
  }

  const isFinal = cleanText.includes('[FIN]')
  if (isFinal) cleanText = cleanText.replace('[FIN]', '').trim()

  // Extract EFECTOS before parsing options
  let effects = null
  const efectosMatch = cleanText.match(/\nEFECTOS:\n([\s\S]*?)(\n\n|$)/)
  if (efectosMatch) {
    effects = parseEffects(efectosMatch[1])
    cleanText = cleanText.slice(0, efectosMatch.index).trim()
  }

  // Strip ESCENA: label and normalize OPCIONES: to --- separator (handles **ESCENA:** etc.)
  cleanText = cleanText
    .replace(/^\*{0,2}ESCENA:\*{0,2}\s*\n?/im, '')
    .replace(/\n\*{0,2}OPCIONES:\*{0,2}\s*\n/i, '\n\n---\n')

  const sepMatch = cleanText.match(/\n?\s*---\s*\n/)
  if (sepMatch) {
    const narrative = stripMd(cleanText.slice(0, sepMatch.index).trim())
    const choiceBlock = cleanText.slice(sepMatch.index + sepMatch[0].length)
    return { narrative, choices: parseChoices(choiceBlock), isFinal, title, effects }
  }

  const firstChoice = cleanText.search(/\[A\]/)
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
  const [streaming, setStreaming] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [vida, setVida] = useState(4)
  const [riesgo, setRiesgo] = useState(0)
  const [sigilo, setSigilo] = useState(3)
  const [choiceFeedback, setChoiceFeedback] = useState(null) // { text, vida, riesgo, sigilo }
  const [vidaFlash, setVidaFlash] = useState(null) // 'hit' | 'heal' | null
  const [missionResult, setMissionResult] = useState(null) // 'win' | 'lose' | null
  const [pendingStats,  setPendingStats]  = useState(null)
  const [muted, setMuted] = useState(false)
  const { session } = useAuth()
  const [campaignMode, setCampaignMode] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [campaignProgress, setCampaignProgress] = useState(() => getMissionProgress())
  const bottomRef = useRef(null)
  const nameInputRef = useRef(null)
  const audioRef = useRef(null)
  const mutedRef = useRef(muted)

  // Cargar progreso desde DB si hay sesión; si DB está vacía pero localStorage tiene datos, sincronizar
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
          // DB vacía — si localStorage tiene progreso, subirlo a la DB ahora
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

  // ── Mute toggle ──────────────────────────────────────────────────────────
  useEffect(() => {
    mutedRef.current = muted
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  // ── Música de misión ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return

    const track = MISSION_TRACKS[trackIndex % MISSION_TRACKS.length]
    trackIndex++
    const audio = new Audio(track)
    audio.loop = true
    audio.volume = 0
    audio.muted = mutedRef.current
    audio.play().catch(() => {})
    audioRef.current = audio

    // Fade in hasta 0.35
    let v = 0
    const fadeIn = setInterval(() => {
      v = Math.min(v + 0.02, 0.35)
      audio.volume = v
      if (v >= 0.35) clearInterval(fadeIn)
    }, 80)

    return () => {
      clearInterval(fadeIn)
      // Fade out al salir de 'playing'
      let vol = audio.volume
      const fadeOut = setInterval(() => {
        vol = Math.max(vol - 0.04, 0)
        audio.volume = vol
        if (vol <= 0) {
          clearInterval(fadeOut)
          audio.pause()
          audio.src = ''
        }
      }, 50)
    }
  }, [phase])

  const surname = selectedChar ? (CHAR_SURNAMES[selectedChar.id] || '') : ''
  const playerAlias = playerName.trim() ? `${playerName.trim()} ${surname}`.trim() : ''

  const fetchMission = async (char, historyArray, currentStats, finalResult = null) => {
    setStreaming(true)
    setCurrentText('')
    setChoices([])
    setCurrentEffects(null)
    setFetchError(false)
    let fullText = ''
    let feedbackCleared = false

    try {
      const res = await fetch(`${API_URL}/mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: char.id,
          history: historyArray,
          playerName: playerAlias,
          difficulty,
          missionType,
          stats: currentStats,
          finalResult,
          isCampaign: campaignMode
        })
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)

      await readSSEStream(res, content => {
        if (!feedbackCleared) { setChoiceFeedback(null); feedbackCleared = true }
        fullText += content
        let display = fullText
          .replace(/^\*{0,2}(?:MISIÓN|TITULO):\*{0,2}[^\n]*\n(?:[^\n]+\n)?/i, '')
          .replace(/^\*{0,2}ESCENA:\*{0,2}\s*\n?/im, '')
          .replace(/\n\*{0,2}(?:OPCIONES|EFECTOS):\*{0,2}[\s\S]*$/, '')
          .replace(/\[FIN\]/g, '')
        const sepIdx = display.search(/\n?\s*---\s*\n/)
        setCurrentText(stripMd((sepIdx !== -1 ? display.slice(0, sepIdx) : display).trim()))
      })

      if (fullText) {
        const { narrative, choices: parsed, title, effects } = parseMissionResponse(fullText)
        if (title) setMissionTitle(title)
        setCurrentText(narrative)
        if (effects) setCurrentEffects(effects)
        if (!finalResult) setChoices(parsed)
      }
    } catch {
      setFetchError(true)
    } finally {
      setStreaming(false)
    }
  }

  const handleCharSelect = (char) => {
    setSelectedChar(char)
    setPhase('setup')
  }

  const handleCampaignLevelSelect = (levelConfig) => {
    const char = characters.find(c => c.id === levelConfig.character)
    if (!char) return
    setSelectedLevel(levelConfig.level)
    setSelectedChar(char)
    setDifficulty(levelConfig.difficulty)
    setPlayerName(char.name)
    setPhase('setup')
  }

  const handleNextLevel = () => {
    const nextConfig = CAMPAIGN_ARCS.flatMap(a => a.levels).find(l => l.level === selectedLevel + 1)
    if (nextConfig) {
      handleCampaignLevelSelect(nextConfig)
    } else {
      handleRestart()
    }
  }

  const initialVida   = { easy: 5, normal: 4, hard: 3 }
  const initialSigilo = { easy: 4, normal: 3, hard: 2 }

  const handleStartMission = () => {
    if (!campaignMode && !playerName.trim()) return
    if (campaignMode && !playerName.trim() && selectedChar) setPlayerName(selectedChar.name)
    const startVida   = initialVida[difficulty]   ?? 4
    const startSigilo = initialSigilo[difficulty] ?? 3
    const stats = { vida: startVida, riesgo: 0, sigilo: startSigilo }
    setHistory([])
    setMissionTitle('')
    setVida(startVida)
    setRiesgo(0)
    setSigilo(startSigilo)
    setChoiceFeedback(null)
    setCurrentEffects(null)
    setMissionResult(null)
    setPendingStats(stats)
    setPhase('intro')   // ← mostrar intro antes de jugar
  }

  const handleIntroFinish = useCallback(() => {
    setPhase('playing')
    if (pendingStats) fetchMission(selectedChar, [], pendingStats)
  }, [pendingStats, selectedChar]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = (choice) => {
    const fx = currentEffects?.[choice.key]
    const newVida   = fx ? Math.max(0, Math.min(5, vida   + fx.vida))            : vida
    const newRiesgo = fx ? Math.max(0, Math.min(5, riesgo + fx.riesgo))          : riesgo
    const newSigilo = fx ? Math.max(0, Math.min(5, sigilo + (fx.sigilo ?? 0)))   : sigilo
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
        saveLevelComplete(selectedLevel)
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
    setStreaming(false)
    setFetchError(false)
    setMissionTitle('')
    setCopied(false)
    setVida(4)
    setRiesgo(0)
    setSigilo(3)
    setChoiceFeedback(null)
    setVidaFlash(null)
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
      <div className="mission-page">
        <div className="mission-top-bar">
          <button className="mission-back-btn" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
        </div>
        <div className="mission-intro">
          <span className="mission-intro__eyebrow">⚔ Modo Misión</span>
          <h1 className="mission-intro__title">
            {campaignMode ? 'Campaña — 30 Niveles' : 'Entrá al Universo'}
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
                  {char.image && <img src={char.image} alt={char.name} className="mission-char-card__img" />}
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
          <div className="campaign-arcs">
            {CAMPAIGN_ARCS.map(arc => {
              const arcChar = characters.find(c => c.id === arc.character)
              return (
                <div key={arc.arcName} className="campaign-arc">
                  <div className="campaign-arc__header" style={{ '--char-color': arcChar?.themeColor || '#888' }}>
                    {arcChar?.image && (
                      <img src={arcChar.image} alt={arcChar.name} className="campaign-arc__avatar" />
                    )}
                    <div className="campaign-arc__info">
                      <span className="campaign-arc__name">{arc.arcName}</span>
                      <span className="campaign-arc__char">{arcChar?.name}</span>
                    </div>
                    <span className="campaign-arc__diff-badge">
                      {arc.levels[0].difficulty === 'easy' ? '🟢 Fácil' : arc.levels[0].difficulty === 'normal' ? '🟡 Normal' : '🔴 Difícil'}
                    </span>
                  </div>
                  <div className="campaign-levels">
                    {arc.levels.map(lvl => {
                      const unlocked = isLevelUnlocked(lvl.level)
                      const completed = !!campaignProgress.completedLevels[lvl.level]
                      return (
                        <button
                          key={lvl.level}
                          className={`campaign-level-btn ${completed ? 'campaign-level-btn--done' : unlocked ? 'campaign-level-btn--open' : 'campaign-level-btn--locked'}`}
                          style={{ '--char-color': arcChar?.themeColor || '#888' }}
                          disabled={!unlocked}
                          onClick={() => handleCampaignLevelSelect(lvl)}
                        >
                          <span className="campaign-level-btn__num">{lvl.level}</span>
                          <span className="campaign-level-btn__state">
                            {completed ? '✔' : unlocked ? '▶' : '🔒'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <div className="campaign-reset">
              <button className="campaign-reset-btn" onClick={() => { resetProgress(); setCampaignProgress(getMissionProgress()) }}>
                Reiniciar progreso
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ── Setup ──────────────────────────────────────── */
  if (phase === 'setup') {
    const step1Done = campaignMode || playerName.trim().length > 0
    const activeDiff = DIFFICULTIES.find(d => d.id === difficulty)

    return (
      <div className="mission-page mission-page--setup" style={{ '--char-color': selectedChar.themeColor }}>
        <div className="mission-top-bar">
          <button className="mission-back-btn" onClick={() => setPhase('chars')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
        </div>

        <div className="mission-setup">
          {/* Indicador de pasos */}
          {!campaignMode && (
            <div className="mission-setup__steps">
              <div className={`mission-setup__step-dot ${step1Done ? 'mission-setup__step-dot--done' : 'mission-setup__step-dot--active'}`} />
              <div className={`mission-setup__step-line ${step1Done ? 'mission-setup__step-line--done' : ''}`} />
              <div className={`mission-setup__step-dot ${step1Done ? 'mission-setup__step-dot--done' : ''}`} />
              <div className={`mission-setup__step-line ${step1Done ? 'mission-setup__step-line--done' : ''}`} />
              <div className={`mission-setup__step-dot ${step1Done ? 'mission-setup__step-dot--active' : ''}`} />
            </div>
          )}

          {/* Personaje */}
          <div className="mission-setup__char">
            {selectedChar.image
              ? <img src={selectedChar.image} alt={selectedChar.name} className="mission-setup__avatar" />
              : <span className="mission-setup__emoji">{selectedChar.emoji}</span>
            }
            <p className="mission-setup__char-name">{selectedChar.name}</p>
            <p className="mission-setup__char-universe">{selectedChar.universe}</p>
            {campaignMode && selectedLevel && (
              <div className="mission-setup__level-badge">Nivel {selectedLevel.level}</div>
            )}
          </div>

          {/* Paso 1: Identidad */}
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

          {/* Paso 2: Tipo de misión */}
          {step1Done && (
            <div className="mission-setup__section mission-setup__section--reveal" style={{ '--reveal-delay': '0s' }}>
              <p className="mission-setup__question">¿Qué tipo de operación?</p>
              <div className="mission-setup__type-grid">
                {MISSION_TYPES.map(m => {
                  const [icon, ...words] = m.label.split(' ')
                  return (
                    <button
                      key={m.id}
                      className={`mission-setup__type-card ${missionType === m.id ? 'mission-setup__type-card--active' : ''}`}
                      onClick={() => setMissionType(m.id)}
                    >
                      <span className="mission-setup__type-icon">{icon}</span>
                      <span className="mission-setup__type-label">{words.join(' ')}</span>
                      <span className="mission-setup__type-desc">{m.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Paso 3: Dificultad */}
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

          {/* CTA */}
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

  const isEnded = phase === 'ended'

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
            >
              {muted
                ? <svg width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M3 9v4h4l5 5V4L7 9H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="17" y1="9" x2="21" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="21" y1="9" x2="17" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                : <svg width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M3 9v4h4l5 5V4L7 9H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M16 8.5a5 5 0 0 1 0 5M19 6a9 9 0 0 1 0 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              }
            </button>
          </div>
          <div className="mission-play-identity">
            {selectedChar.image
              ? <img src={selectedChar.image} alt={selectedChar.name} className="mission-play-avatar" />
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
          {!isEnded && (
            <div className="mission-turn-badge">
              {history.length === 0 ? '⚡ La misión comienza' : `— Turno ${history.length + 1}`}
            </div>
          )}
          <div className="mission-scene">
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
              {choices.map(choice => (
                <button
                  key={choice.key}
                  className={`mission-choice-btn ${choice.type ? `mission-choice-btn--${choice.type}` : ''}`}
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
                  <button className="mission-end-btn mission-end-btn--chars" onClick={handleRestart}>
                    Campaña
                  </button>
                  <button className="mission-end-btn mission-end-btn--home" onClick={() => navigate('/')}>
                    Inicio
                  </button>
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
                  <button className="mission-end-btn mission-end-btn--chars" onClick={handleRestart}>
                    Campaña
                  </button>
                  <button className="mission-end-btn mission-end-btn--home" onClick={() => navigate('/')}>
                    Inicio
                  </button>
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
                  <button className="mission-end-btn mission-end-btn--chars" onClick={handleRestart}>
                    Otro personaje
                  </button>
                  <button className="mission-end-btn mission-end-btn--home" onClick={() => navigate('/')}>
                    Inicio
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
