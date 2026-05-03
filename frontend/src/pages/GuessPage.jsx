import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { guessData } from '../data/guessData'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import { shareResult } from '../utils/share'
import { API_URL } from '../config/api'
import { ROUNDS, MAX_HINTS, POINTS, CANDIDATES } from './guess/constants.js'
import { saveBestScore, pickRandom, shuffle, calcRank } from './guess/utils.js'
import GuessIntro from './guess/GuessIntro.jsx'
import GuessPlaying from './guess/GuessPlaying.jsx'
import GuessReveal from './guess/GuessReveal.jsx'
import GuessSummary from './guess/GuessSummary.jsx'
import './GuessPage.css'

export default function GuessPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)

  const [phase, setPhase]             = useState('intro')
  const [target, setTarget]           = useState(null)
  const [candidates, setCandidates]   = useState([])
  const [hintsShown, setHintsShown]   = useState(1)
  const [result, setResult]           = useState(null)
  const [guessed, setGuessed]         = useState(null)
  const [totalScore, setTotalScore]   = useState(0)
  const [round, setRound]             = useState(1)
  const [usedIds, setUsedIds]         = useState([])
  const [revealing, setRevealing]     = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [history, setHistory]         = useState([])
  const [ranking, setRanking]         = useState([])
  const [rankingFetched, setRankingFetched] = useState(false)

  const hintAreaRef = useRef(null)

  const playableCharacters = useMemo(() => characters.filter(c => guessData[c.id]), [])

  const data   = target ? guessData[target.id] : null
  const hints  = data?.hints ?? []
  const maxPts = POINTS[hintsShown - 1] ?? POINTS[POINTS.length - 1]

  // ── Start round ───────────────────────────────────────────────────────────

  const startRound = (char, currentRound) => {
    const decoys = pickRandom(playableCharacters, [char.id], CANDIDATES - 1)
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
    const char = pickRandom(playableCharacters, [], 1)
    startRound(char, 1)
  }

  // ── Reveal next hint ──────────────────────────────────────────────────────

  const revealNextHint = () => {
    if (hintsShown >= MAX_HINTS) return
    setHintsShown(h => h + 1)
    setTimeout(() => {
      if (hintAreaRef.current) hintAreaRef.current.scrollTop = hintAreaRef.current.scrollHeight
    }, 60)
  }

  // ── Handle guess ──────────────────────────────────────────────────────────

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

  // ── Next round or summary ─────────────────────────────────────────────────

  const nextRound = () => {
    const nextIdx = round + 1
    if (nextIdx > ROUNDS) {
      setPhase('summary')
      return
    }
    const char = pickRandom(playableCharacters, [...usedIds], 1)
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
    setRanking([])
    setRankingFetched(false)
    recordedRef.current = false
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    const rank    = calcRank(totalScore)
    const correct = history.filter(h => h.win).length
    const res = await shareResult(
      `${rank.label} — Adiviné ${correct}/${ROUNDS} personajes con ${totalScore} pts en EchoVerse. ¿Podés superarme? echoverse-jet.vercel.app`
    )
    if (res === 'copied') { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000) }
  }

  // ── Record completion ─────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'summary' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'guess')

      if (session) {
        fetch(`${API_URL}/db/guess-score`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: totalScore }),
        }).catch(() => {})
      }

      fetch(`${API_URL}/db/guess-ranking`)
        .then(r => { if (!r.ok) throw new Error('ranking error'); return r.json() })
        .then(data => { if (Array.isArray(data)) setRanking(data) })
        .catch(() => {})
        .finally(() => setRankingFetched(true))
    }
  }, [phase, session, totalScore])

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'intro') return <GuessIntro onStart={startGame} navigate={navigate} />

  if (phase === 'playing') return (
    <GuessPlaying
      round={round}
      totalScore={totalScore}
      hints={hints}
      hintsShown={hintsShown}
      maxPts={maxPts}
      candidates={candidates}
      result={result}
      revealing={revealing}
      hintAreaRef={hintAreaRef}
      canRevealMore={hintsShown < MAX_HINTS}
      onRevealHint={revealNextHint}
      onGuess={handleGuess}
      onExit={resetGame}
    />
  )

  if (phase === 'reveal') return (
    <GuessReveal
      target={target}
      result={result}
      guessed={guessed}
      hintsShown={hintsShown}
      maxPts={maxPts}
      history={history}
      round={round}
      onNext={nextRound}
      onReset={resetGame}
    />
  )

  if (phase === 'summary') return (
    <GuessSummary
      totalScore={totalScore}
      history={history}
      ranking={ranking}
      rankingFetched={rankingFetched}
      shareCopied={shareCopied}
      onStartGame={startGame}
      onShare={handleShare}
      navigate={navigate}
    />
  )
}
