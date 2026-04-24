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
    <div className="ip">
      <Helmet>
        <title>El Impostor — EchoVerse</title>
        <meta name="description" content="Cuatro personajes responden. Uno miente. ¿Podés detectarlo?" />
      </Helmet>

      {/* ─── INTRO ─── */}
      {phase === 'intro' && (
        <div className="ip-intro">
          <button className="ip-back" onClick={() => navigate(ROUTES.MODOS)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>

          <div className="ip-intro__content">
            <span className="ip-intro__eyebrow">Modo Deducción</span>
            <h1 className="ip-intro__title">El Impostor</h1>
            <p className="ip-intro__desc">
              Cuatro personajes responden al mismo tema.<br />
              Uno de ellos es un impostor fingiendo ser otro.<br />
              <strong>Tu trabajo: detectarlo.</strong>
            </p>

            <div className="ip-intro__difficulty">
              <span className="ip-intro__difficulty-label">Dificultad</span>
              <div className="ip-intro__difficulty-btns">
                {Object.entries(DIFFICULTY_CONFIG).map(([key, val]) => (
                  <button
                    key={key}
                    className={`ip-diff-btn ${difficulty === key ? 'ip-diff-btn--active' : ''}`}
                    style={{ '--diff-color': val.color }}
                    onClick={() => setDifficulty(key)}
                  >
                    <span className="ip-diff-btn__label">{val.label}</span>
                    <span className="ip-diff-btn__pts">+{val.points} pts/ronda</span>
                    <span className="ip-diff-btn__desc">{val.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="ip-start-btn" onClick={() => startRound(1)}>
              Comenzar partida
            </button>
          </div>
        </div>
      )}

      {/* ─── LOADING ─── */}
      {phase === 'loading' && (
        <div className="ip-loading">
          <div className="ip-loading__spinner" />
          <p className="ip-loading__text">Los personajes están respondiendo...</p>
        </div>
      )}

      {/* ─── PLAYING + VOTING ─── */}
      {(phase === 'playing' || phase === 'voting') && roundData && (
        <div className="ip-game">
          <div className="ip-game__header">
            <div className="ip-game__meta">
              <span className="ip-game__round">Ronda {round}/{TOTAL_ROUNDS}</span>
              <span className="ip-game__score">{score} pts</span>
            </div>
            <p className="ip-game__topic">"{topics[round - 1].text}"</p>
          </div>

          <div className="ip-cards">
            {roundData.responses.map((resp, i) => {
              const char = getCharacter(resp.characterId)
              const isVisible = i < visibleCount
              const isSafe = resp.characterId === safeCharId
              return (
                <div
                  key={resp.characterId}
                  className={`ip-card ${isVisible ? 'ip-card--visible' : ''} ${isSafe ? 'ip-card--safe' : ''}`}
                  style={{ '--card-delay': `${i * 0.05}s` }}
                >
                  <div className="ip-card__header">
                    <div className="ip-card__avatar-wrap">
                      {char?.image
                        ? <img className="ip-card__avatar" src={char.image} alt={char.name} />
                        : <span className="ip-card__avatar ip-card__avatar--fallback">{char?.name?.[0] ?? '?'}</span>
                      }
                    </div>
                    <div className="ip-card__identity">
                      <span className="ip-card__name">{char?.name || resp.characterId}</span>
                      {char?.description && (
                        <span className="ip-card__bio">{char.description}</span>
                      )}
                    </div>
                    {isSafe && <span className="ip-card__safe-badge">Inocente</span>}
                  </div>
                  {isVisible && (
                    <div className="ip-card__response-wrap">
                      <p className="ip-card__response">{resp.response}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {phase === 'voting' && (
            <div className="ip-vote">
              {hintClue && (
                <div className="ip-hint-clue">
                  <span className="ip-hint-clue__icon">💡</span>
                  <span>{hintClue}</span>
                </div>
              )}

              <div className="ip-vote__actions">
                <p className="ip-vote__prompt">¿Quién es el impostor?</p>
                {hintsUsed < 2 && (
                  <button className="ip-hint-btn" onClick={useHint}>
                    💡 Pista {hintsUsed + 1}/2
                    <span className="ip-hint-btn__cost">
                      −{Math.round(config.points * HINT_COST_PCT)} pts
                    </span>
                  </button>
                )}
              </div>

              <div className="ip-vote__btns">
                {roundData.responses.map((resp) => {
                  const char = getCharacter(resp.characterId)
                  const isSafe = resp.characterId === safeCharId
                  return (
                    <button
                      key={resp.characterId}
                      className={`ip-vote__btn ${isSafe ? 'ip-vote__btn--safe' : ''}`}
                      onClick={() => !isSafe && vote(resp.characterId)}
                      disabled={isSafe}
                    >
                      {char?.image && <img className="ip-vote__btn-avatar" src={char.image} alt="" />}
                      <span>{char?.name || resp.characterId}</span>
                      {isSafe && <span className="ip-vote__safe-label">Inocente</span>}
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
        <div className="ip-reveal">
          <div className={`ip-reveal__verdict ${roundCorrect ? 'ip-reveal__verdict--correct' : 'ip-reveal__verdict--wrong'}`}>
            <span className="ip-reveal__verdict-icon">{roundCorrect ? '✓' : '✗'}</span>
            <span className="ip-reveal__verdict-text">{roundCorrect ? '¡Correcto!' : 'Era otro...'}</span>
          </div>

          <div className="ip-reveal__detail">
            <p className="ip-reveal__line">
              El impostor era{' '}
              <strong>{impostorChar?.emoji} {impostorChar?.name}</strong>
            </p>
            <p className="ip-reveal__line ip-reveal__line--secondary">
              ...fingiendo ser {impostorChar?.name}, pero en realidad era{' '}
              <strong>{actorChar?.emoji} {actorChar?.name}</strong>
            </p>
          </div>

          <div className="ip-reveal__points">
            {roundCorrect
              ? <span className="ip-reveal__pts-gain">+{config.points} pts</span>
              : <span className="ip-reveal__pts-zero">+0 pts</span>
            }
          </div>

          <button className="ip-reveal__next" onClick={nextRound}>
            {round < TOTAL_ROUNDS ? 'Siguiente ronda →' : 'Ver resultado final →'}
          </button>
        </div>
      )}

      {/* ─── RESULT ─── */}
      {phase === 'result' && (
        <div className="ip-result">
          <div className="ip-result__rank">
            <span className="ip-result__rank-label">{rank.label}</span>
            <p className="ip-result__rank-desc">{rank.desc}</p>
          </div>

          <div className="ip-result__score">
            <span className="ip-result__score-num">{score}</span>
            <span className="ip-result__score-max">/{maxScore} pts</span>
          </div>

          <div className="ip-result__breakdown">
            <span className="ip-result__correct-count">{correctCount}/{TOTAL_ROUNDS} detecciones correctas</span>
          </div>

          <div className="ip-result__history">
            {history.map((h) => (
              <div key={h.round} className={`ip-result__row ${h.correct ? 'ip-result__row--ok' : 'ip-result__row--fail'}`}>
                <span className="ip-result__row-icon">{h.correct ? '✓' : '✗'}</span>
                <span className="ip-result__row-round">Ronda {h.round}</span>
                <span className="ip-result__row-pts">{h.correct ? `+${h.points}` : '+0'}</span>
              </div>
            ))}
          </div>

          {isNewBest && (
            <div className="ip-result__new-best">Nuevo récord personal 🏆</div>
          )}

          {ranking.length > 0 && (
            <div className="ip-ranking">
              <h3 className="ip-ranking__title">Ranking Global</h3>
              <div className="ip-ranking__list">
                {ranking.map((entry, i) => (
                  <div key={i} className={`ip-ranking__row ${i < 3 ? `ip-ranking__row--top${i + 1}` : ''}`}>
                    <span className="ip-ranking__pos">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <span className="ip-ranking__name">{entry.username}</span>
                    <span className="ip-ranking__diff">{entry.best_difficulty}</span>
                    <span className="ip-ranking__score">{entry.best_score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ip-result__actions">
            <button className="ip-start-btn" onClick={restart}>Jugar de nuevo</button>
            <button className="ip-back ip-back--inline" onClick={() => navigate(ROUTES.MODOS)}>Volver a modos</button>
          </div>
        </div>
      )}
    </div>
  )
}
