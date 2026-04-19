import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { readSSEStream } from '../utils/sse'
import { useStreaming } from '../hooks/useStreaming'
import { ROUTES } from '../utils/constants'
import './BattlePage.css'
import { API_URL } from '../config/api.js'
const sleep = ms => new Promise(r => setTimeout(r, ms))

function renderVerdictContent(text) {
  return text.split('\n').filter(l => l.trim()).map((line, i) => {
    if (/🏆/.test(line))
      return <div key={i} className="battle-verdict__winner-line">{line}</div>
    if (/📊/.test(line))
      return <p key={i} className="battle-verdict__section-title">{line}</p>
    if (/🧠/.test(line))
      return <p key={i} className="battle-verdict__section-title">{line}</p>
    if (/^-\s/.test(line))
      return <p key={i} className="battle-verdict__bullet">{line}</p>
    return <p key={i} className="battle-verdict__para">{line}</p>
  })
}

async function fetchFullResponse(characterId, messages) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId, messages, battleMode: true })
  })
  let fullContent = ''
  await readSSEStream(response, content => { fullContent += content })
  return fullContent
}

export default function BattlePage() {
  const navigate = useNavigate()
  const [charA, setCharA] = useState(null)
  const [charB, setCharB] = useState(null)
  const [topic, setTopic] = useState('')
  const [rounds, setRounds] = useState(3)
  const [search, setSearch] = useState('')
  const [battleLog, setBattleLog] = useState([])
  const [status, setStatus] = useState('idle') // idle | running | done
  const [currentStreaming, setCurrentStreaming] = useState(null)
  const [verdict, setVerdict] = useState('')
  const [verdictStatus, setVerdictStatus] = useState('idle') // idle | loading | done
  const [userVote, setUserVote] = useState(null)
  const [voteData, setVoteData] = useState(null)
  const bottomRef = useRef(null)

  const { streamChat: streamVerdict } = useStreaming()

  const getVoteKey = (a, b) => [a.id, b.id].sort().join('-')

  const loadVotes = (a, b) => {
    const key = getVoteKey(a, b)
    const stored = JSON.parse(localStorage.getItem(`battle-votes-${key}`) || '{}')
    const myVote = localStorage.getItem(`battle-my-vote-${key}`)
    setVoteData({ [a.id]: stored[a.id] || 0, [b.id]: stored[b.id] || 0 })
    setUserVote(myVote || null)
  }

  const castVote = (charId) => {
    const key = getVoteKey(charA, charB)
    const stored = JSON.parse(localStorage.getItem(`battle-votes-${key}`) || '{}')
    stored[charId] = (stored[charId] || 0) + 1
    localStorage.setItem(`battle-votes-${key}`, JSON.stringify(stored))
    localStorage.setItem(`battle-my-vote-${key}`, charId)
    setVoteData({ [charA.id]: stored[charA.id] || 0, [charB.id]: stored[charB.id] || 0 })
    setUserVote(charId)
  }

  const selectChar = (char) => {
    if (!charA) { setCharA(char); return }
    if (charA.id === char.id) { setCharA(null); return }
    if (!charB) { setCharB(char); return }
    if (charB.id === char.id) { setCharB(null); return }
    setCharB(char)
  }

  const isSelected = (char) => charA?.id === char.id || charB?.id === char.id
  const getSlot = (char) => charA?.id === char.id ? 'A' : charB?.id === char.id ? 'B' : null

  const startBattle = async () => {
    if (!charA || !charB || !topic.trim()) return
    setStatus('running')
    setBattleLog([])
    loadVotes(charA, charB)

    const historyA = []
    const historyB = []
    const log = []

    const addMessage = (char, content) => {
      log.push({ char, content })
      setBattleLog([...log])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }

    try {
      let lastMessage = topic.trim()

      for (let round = 0; round < rounds; round++) {
        // Turno de Char A
        setCurrentStreaming(charA.id)
        historyA.push({ role: 'user', content: lastMessage })
        const responseA = await fetchFullResponse(charA.id, historyA)
        historyA.push({ role: 'assistant', content: responseA })
        addMessage(charA, responseA)
        lastMessage = responseA
        await sleep(950)

        // Turno de Char B
        setCurrentStreaming(charB.id)
        historyB.push({ role: 'user', content: lastMessage })
        const responseB = await fetchFullResponse(charB.id, historyB)
        historyB.push({ role: 'assistant', content: responseB })
        addMessage(charB, responseB)
        lastMessage = responseB
        if (round < rounds - 1) await sleep(950)
      }
    } catch {
      addMessage(charA, 'Error al conectar con el servidor.')
    } finally {
      setStatus('done')
      setCurrentStreaming(null)
      fetchVerdict(log)
    }
  }

  const fetchVerdict = async (log) => {
    setVerdictStatus('loading')
    setVerdict('')
    let full = ''
    try {
      await streamVerdict(
        `${API_URL}/battle/verdict`,
        {
          topic,
          charA: { name: charA.name, universe: charA.universe },
          charB: { name: charB.name, universe: charB.universe },
          battleLog: log.map(e => ({ charName: e.char.name, content: e.content }))
        },
        content => {
          full += content
          setVerdict(full)
        }
      )
    } catch {
      setVerdict('Error al obtener el veredicto.')
    } finally {
      setVerdictStatus('done')
    }
  }

  const reset = () => {
    setBattleLog([])
    setTopic('')
    setStatus('idle')
    setCurrentStreaming(null)
    setVerdict('')
    setVerdictStatus('idle')
    setUserVote(null)
    setVoteData(null)
    setCharA(null)
    setCharB(null)
  }

  return (
    <div className="battle-page">
      <header className="battle-header">
        <button className="battle-back-btn" onClick={() => navigate(ROUTES.HOME)} aria-label="Volver al inicio">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <div className="battle-header__title">
          <span className="battle-header__eyebrow">Modo especial</span>
          <h1>⚔️ Batalla de Personajes</h1>
          <p>Elegí dos personajes y un tema. Los dejamos debatir solos.</p>
        </div>
      </header>

      {status === 'idle' && (
        <div className="battle-setup">
          {/* Selección de personajes */}
          <div className="battle-selection">
            <div className="battle-slots">
              <div className={`battle-slot ${charA ? 'battle-slot--filled' : 'battle-slot--empty'}`}>
                {charA ? (
                  <>
                    <img src={charA.image} alt={charA.name} onError={e => e.target.style.display='none'} />
                    <span>{charA.name}</span>
                  </>
                ) : <span className="battle-slot__placeholder">Jugador 1</span>}
              </div>
              <div className="battle-vs">VS</div>
              <div className={`battle-slot ${charB ? 'battle-slot--filled' : 'battle-slot--empty'}`}>
                {charB ? (
                  <>
                    <img src={charB.image} alt={charB.name} onError={e => e.target.style.display='none'} />
                    <span>{charB.name}</span>
                  </>
                ) : <span className="battle-slot__placeholder">Jugador 2</span>}
              </div>
            </div>
          </div>

          <div className="battle-search-wrap">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              className="battle-search-input"
              type="text"
              placeholder="Buscar personaje..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar personaje"
            />
            {search && (
              <button className="battle-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="battle-char-grid" role="list">
            {characters.filter(c =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.universe.toLowerCase().includes(search.toLowerCase())
            ).map(char => (
              <button
                key={char.id}
                className={`battle-char-btn ${isSelected(char) ? 'battle-char-btn--selected' : ''}`}
                style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient }}
                onClick={() => selectChar(char)}
                aria-label={`${isSelected(char) ? 'Quitar' : 'Seleccionar'} ${char.name}`}
                aria-pressed={isSelected(char)}
                role="listitem"
              >
                {getSlot(char) && <span className="battle-char-slot">{getSlot(char)}</span>}
                <div className="battle-char-img">
                  <img src={char.image} alt={char.name} />
                </div>
                <span className="battle-char-name">{char.name}</span>
              </button>
            ))}
          </div>

          <div className="battle-topic-wrap">
            <label className="battle-topic-label" htmlFor="battle-topic">Tema del debate o pregunta inicial</label>
            <input
              id="battle-topic"
              className="battle-topic-input"
              type="text"
              placeholder='Ej: "¿Quién es más poderoso?" o "Convenceme de unirme a tu lado"'
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startBattle()}
            />
          </div>

          <div className="battle-rounds-wrap">
            <span className="battle-rounds-label" id="rounds-label">Rondas por personaje:</span>
            <div className="battle-rounds-selector" role="group" aria-labelledby="rounds-label">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  className={`battle-round-btn ${rounds === n ? 'battle-round-btn--active' : ''}`}
                  onClick={() => setRounds(n)}
                  aria-pressed={rounds === n}
                  aria-label={`${n} ronda${n > 1 ? 's' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            className="battle-start-btn"
            onClick={startBattle}
            disabled={!charA || !charB || !topic.trim()}
          >
            ⚔️ ¡Iniciar Batalla!
          </button>
        </div>
      )}

      {(status === 'running' || status === 'done') && (
        <div className="battle-arena">
          <div className="battle-combatants">
            <div className="battle-combatant" style={{ '--char-color': charA.themeColor }}>
              <img src={charA.image} alt={charA.name} onError={e => e.target.style.display='none'} />
              <span>{charA.name}</span>
              {currentStreaming === charA.id && <span className="battle-thinking">pensando...</span>}
            </div>
            <div className="battle-topic-display">"{topic}"</div>
            <div className="battle-combatant" style={{ '--char-color': charB.themeColor }}>
              <img src={charB.image} alt={charB.name} onError={e => e.target.style.display='none'} />
              <span>{charB.name}</span>
              {currentStreaming === charB.id && <span className="battle-thinking">pensando...</span>}
            </div>
          </div>

          <div className="battle-log" aria-live="polite" aria-atomic="false" aria-label="Registro de la batalla">
            {battleLog.map((entry, i) => (
              <div
                key={i}
                className={`battle-message ${entry.char.id === charA.id ? 'battle-message--left' : 'battle-message--right'}`}
                style={{ '--char-color': entry.char.themeColor }}
              >
                <div className="battle-message__avatar">
                  <img src={entry.char.image} alt={entry.char.name} onError={e => e.target.style.display='none'} />
                </div>
                <div className="battle-message__bubble">
                  <span className="battle-message__name">{entry.char.name}</span>
                  <p>{entry.content}</p>
                </div>
              </div>
            ))}

            {currentStreaming && (
              <div className={`battle-message ${currentStreaming === charA.id ? 'battle-message--left' : 'battle-message--right'}`}
                style={{ '--char-color': (currentStreaming === charA.id ? charA : charB).themeColor }}>
                <div className="battle-message__avatar">
                  <img src={(currentStreaming === charA.id ? charA : charB).image} alt="" onError={e => e.target.style.display='none'} />
                </div>
                <div className="battle-message__bubble battle-message__bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {status === 'done' && (
            <>
              {verdictStatus !== 'idle' && (
                <div className="battle-verdict">
                  <div className="battle-verdict__header">
                    <span className="battle-verdict__icon">⚖️</span>
                    <div>
                      <p className="battle-verdict__title">Veredicto del Experto</p>
                      <p className="battle-verdict__subtitle">Análisis imparcial del debate</p>
                    </div>
                  </div>
                  <div className="battle-verdict__body">
                    {verdictStatus === 'loading' && !verdict && (
                      <div className="battle-verdict__thinking">
                        <span /><span /><span />
                      </div>
                    )}
                    {verdict && (
                      <div className="battle-verdict__text">
                        {renderVerdictContent(verdict)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {voteData && (
                <div className="battle-vote">
                  <p className="battle-vote__title">🗳️ ¿Quién ganó según vos?</p>
                  {!userVote ? (
                    <div className="battle-vote__btns" role="group" aria-label="Votar por el ganador">
                      <button
                        className="battle-vote__btn"
                        style={{ '--char-color': charA.themeColor }}
                        onClick={() => castVote(charA.id)}
                        aria-label={`Votar por ${charA.name}`}
                      >
                        <img src={charA.image} alt="" onError={e => e.target.style.display='none'} />
                        {charA.name}
                      </button>
                      <button
                        className="battle-vote__btn"
                        style={{ '--char-color': charB.themeColor }}
                        onClick={() => castVote(charB.id)}
                        aria-label={`Votar por ${charB.name}`}
                      >
                        <img src={charB.image} alt="" onError={e => e.target.style.display='none'} />
                        {charB.name}
                      </button>
                    </div>
                  ) : (
                    <div className="battle-vote__results">
                      {[charA, charB].map(char => {
                        const total = (voteData[charA.id] || 0) + (voteData[charB.id] || 0)
                        const count = voteData[char.id] || 0
                        const pct = total ? Math.round((count / total) * 100) : 0
                        const isWinner = pct >= 50
                        const isMyVote = userVote === char.id
                        return (
                          <div key={char.id} className={`battle-vote__bar-row ${isMyVote ? 'battle-vote__bar-row--mine' : ''}`}>
                            <img src={char.image} alt={char.name} onError={e => e.target.style.display='none'} />
                            <div className="battle-vote__bar-wrap">
                              <div className="battle-vote__bar-label">
                                <span style={{ color: char.themeColor }}>{char.name}</span>
                                <span>{pct}% {isMyVote && '← tu voto'} {isWinner && count > 0 && '🏆'}</span>
                              </div>
                              <div className="battle-vote__bar-track">
                                <div
                                  className="battle-vote__bar-fill"
                                  style={{ width: `${pct}%`, background: char.themeColor }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <p className="battle-vote__total">{(voteData[charA.id] || 0) + (voteData[charB.id] || 0)} votos en total para este matchup</p>
                    </div>
                  )}
                </div>
              )}

              <div className="battle-done">
                <p>⚔️ Batalla finalizada</p>
                <div className="battle-done-actions">
                  <button className="battle-new-btn" onClick={reset}>Nueva Batalla</button>
                  <button className="battle-home-btn" onClick={() => navigate(ROUTES.HOME)}>Volver al inicio</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
