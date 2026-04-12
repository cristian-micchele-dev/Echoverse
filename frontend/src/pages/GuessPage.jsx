import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { guessData }   from '../data/guessData'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import './GuessPage.css'

const ROUNDS     = 8
const MAX_HINTS  = 3
const POINTS     = [100, 70, 40]   // points available at hint 1 / 2 / 3
const COST_LABEL = [null, '−30 pts', '−30 pts']
const CANDIDATES = 5
const MAX_SCORE  = ROUNDS * POINTS[0]  // 800

function getBestScore() {
  try { return parseInt(localStorage.getItem('guess-best-score') || '0') } catch { return 0 }
}
function saveBestScore(score) {
  try {
    if (score > getBestScore()) localStorage.setItem('guess-best-score', String(score))
  // eslint-disable-next-line no-empty
  } catch {}
}

function pickRandom(arr, exclude = [], n = 1) {
  const pool = arr.filter(c => !exclude.includes(c.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return n === 1 ? shuffled[0] : shuffled.slice(0, n)
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function calcRank(score) {
  const pct = score / MAX_SCORE
  if (pct === 1)    return { label: 'Leyenda',       desc: 'Adivinaste todo a la primera. Tu conocimiento es impresionante.', color: '#fbbf24', icon: '◆' }
  if (pct >= 0.85)  return { label: 'Detective',      desc: 'Casi perfecto. Las pistas apenas te hicieron falta.', color: '#a78bfa', icon: '◇' }
  if (pct >= 0.65)  return { label: 'Conocedor',      desc: 'Buen ojo. Reconocés a la mayoría sin necesitar mucha ayuda.', color: '#60a5fa', icon: '○' }
  if (pct >= 0.45)  return { label: 'Aprendiz',       desc: 'Algunos se te escaparon, pero vas aprendiendo.', color: '#34d399', icon: '△' }
  return               { label: 'Espectador',      desc: 'Todavía queda mucho universo por explorar.', color: '#94a3b8', icon: '◌' }
}

export default function GuessPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)

  const [phase, setPhase]             = useState('intro')
  const [target, setTarget]           = useState(null)
  const [candidates, setCandidates]   = useState([])
  const [hintsShown, setHintsShown]   = useState(1)
  const [result, setResult]           = useState(null)   // 'win' | 'lose'
  const [guessed, setGuessed]         = useState(null)
  const [totalScore, setTotalScore]   = useState(0)
  const [round, setRound]             = useState(1)
  const [usedIds, setUsedIds]         = useState([])
  const [revealing, setRevealing]     = useState(false)
  const [history, setHistory]         = useState([])     // [{win, pts, char}]

  const hintAreaRef = useRef(null)

  const data   = target ? guessData[target.id] : null
  const hints  = data?.hints ?? []
  const maxPts = POINTS[hintsShown - 1] ?? POINTS[POINTS.length - 1]

  // ── Start round ──────────────────────────────────────
  const startRound = (char, currentRound) => {
    const decoys = pickRandom(characters, [char.id], CANDIDATES - 1)
    const pool   = shuffle([char, ...decoys])
    setTarget(char)
    setCandidates(pool)
    setHintsShown(1)
    setResult(null)
    setGuessed(null)
    setRevealing(false)
    setRound(currentRound)
    setPhase('playing')
  }

  const startGame = () => {
    setTotalScore(0)
    setUsedIds([])
    setHistory([])
    const char = pickRandom(characters, [], 1)
    startRound(char, 1)
  }

  // ── Reveal next hint ─────────────────────────────────
  const revealNextHint = () => {
    if (hintsShown >= MAX_HINTS) return
    setHintsShown(h => h + 1)
    setTimeout(() => {
      if (hintAreaRef.current) hintAreaRef.current.scrollTop = hintAreaRef.current.scrollHeight
    }, 60)
  }

  // ── Handle guess ─────────────────────────────────────
  const handleGuess = (char) => {
    if (result || revealing) return
    const correct = char.id === target.id
    setGuessed(char)
    setRevealing(true)

    setTimeout(() => {
      const pts = correct ? maxPts : 0
      const newTotal = totalScore + pts
      if (correct) {
        setTotalScore(newTotal)
        saveBestScore(newTotal)
        setResult('win')
      } else {
        setResult('lose')
      }
      setRevealing(false)
      setUsedIds(prev => [...prev, target.id])
      setHistory(prev => [...prev, { win: correct, pts, char: target }])
      setPhase('reveal')
    }, 600)
  }

  useEffect(() => {
    if (phase === 'summary' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'guess')
    }
  }, [phase, session])

  // ── Next round or summary ────────────────────────────
  const nextRound = () => {
    const nextIdx = round + 1
    if (nextIdx > ROUNDS) {
      setPhase('summary')
      return
    }
    const newUsed = [...usedIds]
    const char = pickRandom(characters, newUsed, 1)
    startRound(char, nextIdx)
  }

  const resetGame = () => {
    setPhase('intro')
    setTotalScore(0)
    setRound(1)
    setUsedIds([])
    setTarget(null)
    setCandidates([])
    setResult(null)
    setGuessed(null)
    setHistory([])
  }

  // ─────────────────────────────────────────────────────
  // INTRO
  // ─────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="gp gp--intro">
        <div className="gp-bg" aria-hidden="true">
          <div className="gp-orb gp-orb--1" />
          <div className="gp-orb gp-orb--2" />
          <div className="gp-orb gp-orb--3" />
          <div className="gp-stars" />
          <div className="gp-bg-vignette" />
        </div>

        <div className="gp-intro-strip" aria-hidden="true">
          {[...characters, ...characters].map((c, i) => (
            <div key={`s-${i}`} className="gp-intro-strip__card">
              <img src={c.image} alt="" />
            </div>
          ))}
        </div>

        <button className="gp-back-btn" onClick={() => navigate('/')}>← Volver</button>

        <div className="gp-intro-content">
          <span className="gp-eyebrow">Modo</span>
          <h1 className="gp-intro-title">¿Lo reconocés?</h1>
          <p className="gp-intro-sub">
            Pistas psicológicas y contextuales. Cuanto antes lo adivines, más puntos ganás.
          </p>

          <div className="gp-intro-pills">
            <span className="gp-pill">{ROUNDS} rondas</span>
            <span className="gp-pill">100 pts máx.</span>
            <span className="gp-pill">◈ Deducción pura</span>
          </div>

          <div className="gp-teaser">
            <span className="gp-teaser__label">Pista 1 · Psicológica</span>
            <p className="gp-teaser__text">
              Lleva el peso del mundo en sus hombros desde niño, pero nunca lo buscó —
              simplemente no sabe cómo evitarlo.
            </p>
          </div>

          <button className="gp-start-btn" onClick={startGame}>Empezar a adivinar</button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // PLAYING
  // ─────────────────────────────────────────────────────
  if (phase === 'playing') {
    const canRevealMore = hintsShown < MAX_HINTS

    return (
      <div className="gp gp--playing">
        <div className="gp-bg" aria-hidden="true">
          <div className="gp-orb gp-orb--1" />
          <div className="gp-orb gp-orb--2" />
          <div className="gp-orb gp-orb--3" />
          <div className="gp-stars" />
          <div className="gp-bg-vignette" />
        </div>

        <header className="gp-header">
          <button className="gp-back-btn" onClick={resetGame}>← Salir</button>
          <div className="gp-status">
            <span className="gp-status__round">{round} / {ROUNDS}</span>
            <span className="gp-status__pts">{totalScore} pts</span>
          </div>
        </header>

        <div className="gp-hints" ref={hintAreaRef}>
          <div className="gp-hints__top">
            <span className="gp-hints__label">Pistas reveladas</span>
            <span className="gp-pts-badge">{maxPts} pts disponibles</span>
          </div>

          {hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className={`gp-hint gp-hint--l${i + 1}`} style={{ '--idx': i }}>
              <div className="gp-hint__header">
                <span className="gp-hint__num">#{i + 1}</span>
                <span className="gp-hint__level">{h.level}</span>
              </div>
              <p className="gp-hint__text">{h.text}</p>
            </div>
          ))}
        </div>

        <div className="gp-reveal-wrap">
          {canRevealMore ? (
            <button className="gp-reveal-btn" onClick={revealNextHint}>
              <span className="gp-reveal-btn__icon">◎</span>
              <span className="gp-reveal-btn__text">
                Pista {hintsShown + 1} · {hints[hintsShown]?.level}
              </span>
              <span className="gp-reveal-btn__cost">{COST_LABEL[hintsShown]}</span>
            </button>
          ) : (
            <p className="gp-reveal-maxed">Todas las pistas reveladas — elegí tu respuesta</p>
          )}
        </div>

        <div className="gp-candidates">
          {candidates.map(char => (
            <button
              key={char.id}
              className="gp-candidate"
              style={{ '--cc': char.themeColor, '--cg': char.gradient }}
              onClick={() => handleGuess(char)}
              disabled={!!result || revealing}
            >
              <div className="gp-candidate__img">
                <img src={char.image} alt={char.name} />
              </div>
              <span className="gp-candidate__name">{char.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // REVEAL
  // ─────────────────────────────────────────────────────
  if (phase === 'reveal') {
    const isWin      = result === 'win'
    const targetData = guessData[target.id]
    const isLast     = round >= ROUNDS

    const LEVEL_BADGES = [
      { icon: '◆', label: 'Primera pista', color: '#fbbf24' },
      { icon: '◇', label: 'Segunda pista', color: '#a78bfa' },
      { icon: '○', label: 'Tercera pista', color: '#60a5fa' },
    ]
    const badge = LEVEL_BADGES[hintsShown - 1]

    return (
      <div className="gp gp--reveal">
        <div className="gp-bg" aria-hidden="true">
          <div className="gp-orb gp-orb--1" />
          <div className="gp-orb gp-orb--2" />
          <div className="gp-orb gp-orb--3" />
          <div className="gp-stars" />
          <div className="gp-bg-vignette" />
        </div>

        <div className="gp-reveal-glow" style={{ '--cc': target.themeColor }} aria-hidden="true" />

        <div className="gp-reveal-card" style={{ '--cc': target.themeColor }}>
          <div className="gp-reveal-avatar">
            <img src={target.image} alt={target.name} />
          </div>

          <div className={`gp-reveal-mark gp-reveal-mark--${isWin ? 'win' : 'lose'}`}>
            {isWin ? '✔' : '✕'}
          </div>

          <h2 className="gp-reveal-name" style={{ color: target.themeColor }}>
            {target.name}
          </h2>
          <p className="gp-reveal-universe">{target.universe}</p>

          {targetData?.revealPhrase && (
            <blockquote className="gp-reveal-quote">
              "{targetData.revealPhrase}"
            </blockquote>
          )}

          {isWin && (
            <div className="gp-reveal-score">
              <span className="gp-reveal-badge" style={{ '--bc': badge.color }}>
                {badge.icon} {badge.label}
              </span>
              <span className="gp-reveal-pts">+{maxPts} pts</span>
            </div>
          )}

          {!isWin && guessed && (
            <p className="gp-reveal-wrong">
              Elegiste a <strong style={{ color: guessed.themeColor }}>{guessed.name}</strong>
            </p>
          )}

          {/* Round progress dots */}
          <div className="gp-round-dots">
            {history.map((h, i) => (
              <span
                key={i}
                className={`gp-round-dot gp-round-dot--${h.win ? 'win' : 'lose'}`}
                title={h.char.name}
              />
            ))}
            {Array.from({ length: ROUNDS - history.length }).map((_, i) => (
              <span key={`e-${i}`} className="gp-round-dot gp-round-dot--empty" />
            ))}
          </div>

          <div className="gp-reveal-actions">
            <button className="gp-start-btn" onClick={nextRound}>
              {isLast ? 'Ver resultado' : 'Siguiente'}
            </button>
            <button className="gp-back-btn" onClick={resetGame}>Salir</button>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────
  if (phase === 'summary') {
    const rank    = calcRank(totalScore)
    const correct = history.filter(h => h.win).length
    const best    = getBestScore()
    const isNew   = totalScore >= best

    return (
      <div className="gp gp--summary">
        <div className="gp-bg" aria-hidden="true">
          <div className="gp-orb gp-orb--1" />
          <div className="gp-orb gp-orb--2" />
          <div className="gp-orb gp-orb--3" />
          <div className="gp-stars" />
          <div className="gp-bg-vignette" />
        </div>

        <div className="gp-summary">
          <span className="gp-eyebrow">Resultado final</span>

          {/* Rank */}
          <div className="gp-summary__rank" style={{ '--rc': rank.color }}>
            <span className="gp-summary__rank-icon">{rank.icon}</span>
            <span className="gp-summary__rank-label">{rank.label}</span>
          </div>
          <p className="gp-summary__rank-desc">{rank.desc}</p>

          {/* Score */}
          <div className="gp-summary__score">
            <span className="gp-summary__score-num">{totalScore}</span>
            <span className="gp-summary__score-max">/ {MAX_SCORE} pts</span>
          </div>

          {isNew && (
            <span className="gp-summary__best">✦ Nuevo récord personal</span>
          )}

          {/* Stats */}
          <div className="gp-summary__stats">
            <div className="gp-summary__stat">
              <span className="gp-summary__stat-val">{correct}</span>
              <span className="gp-summary__stat-lbl">correctas</span>
            </div>
            <div className="gp-summary__stat-div" />
            <div className="gp-summary__stat">
              <span className="gp-summary__stat-val">{ROUNDS - correct}</span>
              <span className="gp-summary__stat-lbl">falladas</span>
            </div>
            <div className="gp-summary__stat-div" />
            <div className="gp-summary__stat">
              <span className="gp-summary__stat-val">{ROUNDS}</span>
              <span className="gp-summary__stat-lbl">rondas</span>
            </div>
          </div>

          {/* History row */}
          <div className="gp-summary__history">
            {history.map((h, i) => (
              <div key={i} className={`gp-summary__hist-item gp-summary__hist-item--${h.win ? 'win' : 'lose'}`}>
                <div className="gp-summary__hist-img">
                  <img src={h.char.image} alt={h.char.name} />
                </div>
                <span className="gp-summary__hist-mark">{h.win ? '✔' : '✕'}</span>
              </div>
            ))}
          </div>

          <div className="gp-summary__actions">
            <button className="gp-start-btn" onClick={startGame}>Jugar de nuevo</button>
            <button className="gp-back-btn" onClick={() => navigate('/')}>Inicio</button>
          </div>
        </div>
      </div>
    )
  }
}
