import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../../data/characters'
import { IMPOSTOR_TOPICS, DIFFICULTY_CONFIG, SCORE_RANKS } from '../../data/impostorData'
import { useAuth } from '../../context/AuthContext'
import { recordCompletion } from '../../utils/recordCompletion'
import { ROUTES } from '../../utils/constants'
import { API_URL } from '../../config/api'
import { Helmet } from 'react-helmet-async'
import './ImpostorPage.css'

const TOTAL_ROUNDS = 5
const HINT_COST_PCT = 0.3

const HINT_CLUES = [
  'El impostor delata su verdadera filosofía de vida en algún momento.',
  'Prestá atención al ritmo: el impostor habla diferente a como ese personaje suele hacerlo.',
  'El impostor usa una expresión que su personaje jamás usaría.',
  'Los valores del impostor asoman aunque intenta ocultarlos.',
  'Hay algo en el tono que no encaja con la historia de ese personaje.',
]

function getCharacter(id) {
  return characters.find(c => c.id === id) || null
}

function pickTopics(n) {
  return [...IMPOSTOR_TOPICS].sort(() => Math.random() - 0.5).slice(0, n)
}

function calcRank(correct, total) {
  const pct = correct / total
  return SCORE_RANKS.find(r => pct >= r.min) || SCORE_RANKS[SCORE_RANKS.length - 1]
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function ImpostorPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)

  const [phase, setPhase] = useState('intro')
  const [difficulty, setDifficulty] = useState('medium')

  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [topics] = useState(() => pickTopics(TOTAL_ROUNDS))
  const [roundData, setRoundData] = useState(null)
  const [visibleCount, setVisibleCount] = useState(0)
  const [selectedVote, setSelectedVote] = useState(null)
  const [roundCorrect, setRoundCorrect] = useState(null)
  const [history, setHistory] = useState([])
  const [hintsUsed, setHintsUsed] = useState(0)
  const [safeCharId, setSafeCharId] = useState(null)
  const [hintClue, setHintClue] = useState(null)
  const [ranking, setRanking] = useState([])
  const [isNewBest, setIsNewBest] = useState(false)

  const config = DIFFICULTY_CONFIG[difficulty]

  async function startRound(currentRound) {
    const topic = topics[currentRound - 1].text
    setPhase('loading')
    setRoundData(null)
    setVisibleCount(0)
    setSelectedVote(null)
    setRoundCorrect(null)
    setHintsUsed(0)
    setSafeCharId(null)
    setHintClue(null)

    try {
      const res = await fetch(`${API_URL}/impostor/round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      })
      if (!res.ok) throw new Error('Error del servidor')
      const data = await res.json()
      setRoundData(data)
      setPhase('playing')

      // Stagger card reveal
      for (let i = 1; i <= data.responses.length; i++) {
        await new Promise(r => setTimeout(r, i === 1 ? 300 : 700))
        setVisibleCount(i)
      }
      setPhase('voting')
    } catch (err) {
      console.error(err)
      setPhase('intro')
    }
  }

  function useHint() {
    if (!roundData || hintsUsed >= 2) return
    const nextHints = hintsUsed + 1
    setHintsUsed(nextHints)

    if (nextHints === 1) {
      // Hint 1: mark a random innocent as safe
      const innocents = roundData.responses
        .filter(r => !r.isImpostor)
        .map(r => r.characterId)
      setSafeCharId(pickRandom(innocents))
    } else {
      // Hint 2: text clue about the impostor's tell
      setHintClue(pickRandom(HINT_CLUES))
    }
  }

  function vote(characterId) {
    if (!roundData) return
    setSelectedVote(characterId)
    const impostorCharId = roundData.responses[roundData.impostorSlot].characterId
    const correct = characterId === impostorCharId
    setRoundCorrect(correct)

    const discount = Math.round(config.points * HINT_COST_PCT * hintsUsed)
    const pts = correct ? Math.max(config.points - discount, 10) : 0
    setScore(s => s + pts)
    setHistory(h => [...h, { correct, points: pts, topic: topics[round - 1].text, round }])
    setPhase('reveal')
  }

  async function loadRanking() {
    try {
      const res = await fetch(`${API_URL}/db/impostor-ranking`)
      if (res.ok) setRanking(await res.json())
    } catch {}
  }

  async function saveScore(finalScore, finalCorrect) {
    try {
      const res = await fetch(`${API_URL}/db/impostor-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ score: finalScore, correct: finalCorrect, difficulty }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsNewBest(data.isNewBest)
      }
    } catch {}
    loadRanking()
  }

  function nextRound() {
    const nextRoundNum = round + 1
    if (nextRoundNum > TOTAL_ROUNDS) {
      setPhase('result')
      if (!recordedRef.current) {
        recordedRef.current = true
        const finalCorrect = history.filter(h => h.correct).length
        if (session) {
          recordCompletion(session, 'impostor').catch(() => {})
          saveScore(score, finalCorrect)
        } else {
          loadRanking()
        }
      }
    } else {
      setRound(nextRoundNum)
      startRound(nextRoundNum)
    }
  }

  function restart() {
    setPhase('intro')
    setRound(1)
    setScore(0)
    setHistory([])
    setRoundData(null)
    setVisibleCount(0)
    setSelectedVote(null)
    setRoundCorrect(null)
    setHintsUsed(0)
    setSafeCharId(null)
    setHintClue(null)
    setIsNewBest(false)
    recordedRef.current = false
  }

  const impostorChar = roundData ? getCharacter(roundData.responses[roundData.impostorSlot]?.characterId) : null
  const actorChar = roundData ? getCharacter(roundData.actorId) : null
  const correctCount = history.filter(h => h.correct).length
  const rank = calcRank(correctCount, TOTAL_ROUNDS)
  const maxScore = TOTAL_ROUNDS * config.points

  return (
    <div className="imp">
      <Helmet>
        <title>El Impostor — EchoVerse</title>
        <meta name="description" content="Cuatro personajes responden. Uno miente. ¿Podés detectarlo?" />
      </Helmet>

      {/* ─── INTRO ─── */}
      {phase === 'intro' && (
        <div className="imp-intro">
          <button className="imp-back" onClick={() => navigate(ROUTES.MODOS)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>

          <div className="imp-intro__content">
            <span className="imp-intro__eyebrow">Modo Deducción</span>
            <h1 className="imp-intro__title">El Impostor</h1>
            <p className="imp-intro__desc">
              Cuatro personajes responden al mismo tema.<br />
              Uno de ellos es un impostor fingiendo ser otro.<br />
              <strong>Tu trabajo: detectarlo.</strong>
            </p>

            <div className="imp-intro__difficulty">
              <span className="imp-intro__difficulty-label">Dificultad</span>
              <div className="imp-intro__difficulty-btns">
                {Object.entries(DIFFICULTY_CONFIG).map(([key, val]) => (
                  <button
                    key={key}
                    className={`imp-diff-btn ${difficulty === key ? 'imp-diff-btn--active' : ''}`}
                    style={{ '--diff-color': val.color }}
                    onClick={() => setDifficulty(key)}
                  >
                    <span className="imp-diff-btn__label">{val.label}</span>
                    <span className="imp-diff-btn__pts">+{val.points} pts/ronda</span>
                    <span className="imp-diff-btn__desc">{val.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="imp-start-btn" onClick={() => startRound(1)}>
              Comenzar partida
            </button>
          </div>
        </div>
      )}

      {/* ─── LOADING ─── */}
      {phase === 'loading' && (
        <div className="imp-loading">
          <div className="imp-loading__spinner" />
          <p className="imp-loading__text">Los personajes están respondiendo...</p>
        </div>
      )}

      {/* ─── PLAYING + VOTING ─── */}
      {(phase === 'playing' || phase === 'voting') && roundData && (
        <div className="imp-game">
          <div className="imp-game__header">
            <div className="imp-game__meta">
              <span className="imp-game__round">Ronda {round}/{TOTAL_ROUNDS}</span>
              <span className="imp-game__score">{score} pts</span>
            </div>
            <p className="imp-game__topic">"{topics[round - 1].text}"</p>
          </div>

          <div className="imp-cards">
            {roundData.responses.map((resp, i) => {
              const char = getCharacter(resp.characterId)
              const isVisible = i < visibleCount
              const isSafe = resp.characterId === safeCharId
              return (
                <div
                  key={resp.characterId}
                  className={`imp-card ${isVisible ? 'imp-card--visible' : ''} ${isSafe ? 'imp-card--safe' : ''}`}
                  style={{ '--card-delay': `${i * 0.05}s` }}
                >
                  <div className="imp-card__header">
                    <div className="imp-card__avatar-wrap">
                      {char?.image
                        ? <img className="imp-card__avatar" src={char.image} alt={char.name} />
                        : <span className="imp-card__avatar imp-card__avatar--fallback">{char?.name?.[0] ?? '?'}</span>
                      }
                    </div>
                    <div className="imp-card__identity">
                      <span className="imp-card__name">{char?.name || resp.characterId}</span>
                      {char?.description && (
                        <span className="imp-card__bio">{char.description}</span>
                      )}
                    </div>
                    {isSafe && <span className="imp-card__safe-badge">Inocente</span>}
                  </div>
                  {isVisible && (
                    <div className="imp-card__response-wrap">
                      <p className="imp-card__response">{resp.response}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {phase === 'voting' && (
            <div className="imp-vote">
              {hintClue && (
                <div className="imp-hint-clue">
                  <span className="imp-hint-clue__icon">💡</span>
                  <span>{hintClue}</span>
                </div>
              )}

              <div className="imp-vote__actions">
                <p className="imp-vote__prompt">¿Quién es el impostor?</p>
                {hintsUsed < 2 && (
                  <button className="imp-hint-btn" onClick={useHint}>
                    💡 Pista {hintsUsed + 1}/2
                    <span className="imp-hint-btn__cost">
                      −{Math.round(config.points * HINT_COST_PCT)} pts
                    </span>
                  </button>
                )}
              </div>

              <div className="imp-vote__btns">
                {roundData.responses.map((resp) => {
                  const char = getCharacter(resp.characterId)
                  const isSafe = resp.characterId === safeCharId
                  return (
                    <button
                      key={resp.characterId}
                      className={`imp-vote__btn ${isSafe ? 'imp-vote__btn--safe' : ''}`}
                      onClick={() => !isSafe && vote(resp.characterId)}
                      disabled={isSafe}
                    >
                      {char?.image && <img className="imp-vote__btn-avatar" src={char.image} alt="" />}
                      <span>{char?.name || resp.characterId}</span>
                      {isSafe && <span className="imp-vote__safe-label">Inocente</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── REVEAL ─── */}
      {phase === 'reveal' && roundData && (
        <div className="imp-reveal">
          <div className={`imp-reveal__verdict ${roundCorrect ? 'imp-reveal__verdict--correct' : 'imp-reveal__verdict--wrong'}`}>
            <span className="imp-reveal__verdict-icon">{roundCorrect ? '✓' : '✗'}</span>
            <span className="imp-reveal__verdict-text">{roundCorrect ? '¡Correcto!' : 'Era otro...'}</span>
          </div>

          <div className="imp-reveal__detail">
            <p className="imp-reveal__line">
              El impostor era{' '}
              <strong>{impostorChar?.emoji} {impostorChar?.name}</strong>
            </p>
            <p className="imp-reveal__line imp-reveal__line--secondary">
              ...fingiendo ser {impostorChar?.name}, pero en realidad era{' '}
              <strong>{actorChar?.emoji} {actorChar?.name}</strong>
            </p>
          </div>

          <div className="imp-reveal__points">
            {roundCorrect
              ? <span className="imp-reveal__pts-gain">+{config.points} pts</span>
              : <span className="imp-reveal__pts-zero">+0 pts</span>
            }
          </div>

          <button className="imp-reveal__next" onClick={nextRound}>
            {round < TOTAL_ROUNDS ? 'Siguiente ronda →' : 'Ver resultado final →'}
          </button>
        </div>
      )}

      {/* ─── RESULT ─── */}
      {phase === 'result' && (
        <div className="imp-result">
          <div className="imp-result__rank">
            <span className="imp-result__rank-label">{rank.label}</span>
            <p className="imp-result__rank-desc">{rank.desc}</p>
          </div>

          <div className="imp-result__score">
            <span className="imp-result__score-num">{score}</span>
            <span className="imp-result__score-max">/{maxScore} pts</span>
          </div>

          <div className="imp-result__breakdown">
            <span className="imp-result__correct-count">{correctCount}/{TOTAL_ROUNDS} detecciones correctas</span>
          </div>

          <div className="imp-result__history">
            {history.map((h) => (
              <div key={h.round} className={`imp-result__row ${h.correct ? 'imp-result__row--ok' : 'imp-result__row--fail'}`}>
                <span className="imp-result__row-icon">{h.correct ? '✓' : '✗'}</span>
                <span className="imp-result__row-round">Ronda {h.round}</span>
                <span className="imp-result__row-pts">{h.correct ? `+${h.points}` : '+0'}</span>
              </div>
            ))}
          </div>

          {isNewBest && (
            <div className="imp-result__new-best">Nuevo récord personal 🏆</div>
          )}

          {ranking.length > 0 && (
            <div className="imp-ranking">
              <h3 className="imp-ranking__title">Ranking Global</h3>
              <div className="imp-ranking__list">
                {ranking.map((entry, i) => (
                  <div key={i} className={`imp-ranking__row ${i < 3 ? `imp-ranking__row--top${i + 1}` : ''}`}>
                    <span className="imp-ranking__pos">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <span className="imp-ranking__name">{entry.username}</span>
                    <span className="imp-ranking__diff">{entry.best_difficulty}</span>
                    <span className="imp-ranking__score">{entry.best_score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="imp-result__actions">
            <button className="imp-start-btn" onClick={restart}>Jugar de nuevo</button>
            <button className="imp-back imp-back--inline" onClick={() => navigate(ROUTES.MODOS)}>Volver a modos</button>
          </div>
        </div>
      )}
    </div>
  )
}
