import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { readSSEStream } from '../utils/sse'
import './FightPage.css'
import { API_URL } from '../config/api.js'
const MAX_ROUNDS = 3
const INITIAL_HP = 100

function parseChoices(block) {
  const choices = []
  const pattern = /\[([A-D])\]\s*([\s\S]*?)(?=\s*\[[A-D]\]|$)/g
  let match
  while ((match = pattern.exec(block)) !== null) {
    const text = match[2].replace(/,\s*$/, '').replace(/\n\[[A-Z]\][\s\S]*/g, '').trim()
    if (text) choices.push({ key: match[1], text })
  }
  return choices
}

export function parseFightResponse(text) {
  let cleanText = text
  let playerDmg = 10
  let enemyDmg = 10

  const dmgMatch = text.match(/DAÑO_JUGADOR:\s*(\d+)\s*\|\s*DAÑO_RIVAL:\s*(\d+)/i)
  if (dmgMatch) {
    playerDmg = Math.min(45, parseInt(dmgMatch[1]))
    enemyDmg = Math.min(45, parseInt(dmgMatch[2]))
    cleanText = text.slice(0, dmgMatch.index).trim()
  }

  const isFinal = cleanText.includes('[FIN]')
  if (isFinal) cleanText = cleanText.replace('[FIN]', '').trim()

  const sepMatch = cleanText.match(/\n?\s*---\s*\n/)
  if (sepMatch) {
    return {
      narrative: cleanText.slice(0, sepMatch.index).trim(),
      choices: parseChoices(cleanText.slice(sepMatch.index + sepMatch[0].length)),
      playerDmg, enemyDmg, isFinal
    }
  }
  const firstChoice = cleanText.search(/\[A\]/)
  if (firstChoice !== -1) {
    return {
      narrative: cleanText.slice(0, firstChoice).replace(/---/g, '').trim(),
      choices: parseChoices(cleanText.slice(firstChoice)),
      playerDmg, enemyDmg, isFinal
    }
  }
  return { narrative: cleanText, choices: [], playerDmg, enemyDmg, isFinal }
}

function HPBar({ hp, side }) {
  const color = hp > 60 ? '#4ade80' : hp > 30 ? '#facc15' : '#f87171'
  return (
    <div className={`fcard__hp-bar-wrap ${side === 'enemy' ? 'fcard__hp-bar-wrap--enemy' : ''}`}>
      <div className="fcard__hp-bar" style={{ width: `${hp}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
    </div>
  )
}

export default function FightPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('pick-player')
  const [playerChar, setPlayerChar] = useState(null)
  const [enemyChar, setEnemyChar] = useState(null)
  const [playerHP, setPlayerHP] = useState(INITIAL_HP)
  const [enemyHP, setEnemyHP] = useState(INITIAL_HP)
  const [round, setRound] = useState(1)
  const [history, setHistory] = useState([])
  const [currentText, setCurrentText] = useState('')
  const [choices, setChoices] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [winner, setWinner] = useState(null)
  const [fetchError, setFetchError] = useState(false)
  const [flashPlayer, setFlashPlayer] = useState(false)
  const [flashEnemy, setFlashEnemy] = useState(false)
  const [lastDmg, setLastDmg] = useState({ player: null, enemy: null })
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentText, choices])

  const fetchRound = async (pChar, eChar, pHP, eHP, historyArr, action = null) => {
    setStreaming(true)
    setCurrentText('')
    setChoices([])
    setFetchError(false)
    setLastDmg({ player: null, enemy: null })
    let fullText = ''

    try {
      const res = await fetch(`${API_URL}/fight/round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCharId: pChar.id,
          enemyCharId: eChar.id,
          playerHP: pHP, enemyHP: eHP,
          round: historyArr.length + 1,
          totalRounds: MAX_ROUNDS,
          history: historyArr,
          action
        })
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)

      await readSSEStream(res, content => {
        fullText += content
        const dmgIdx = fullText.search(/DAÑO_JUGADOR:/i)
        const display = dmgIdx !== -1 ? fullText.slice(0, dmgIdx).trim() : fullText
        const sepIdx = display.search(/\n?\s*---\s*\n/)
        setCurrentText(sepIdx !== -1 ? display.slice(0, sepIdx).trim() : display)
      })

      const { narrative, choices: parsed, playerDmg, enemyDmg, isFinal } = parseFightResponse(fullText)
      setCurrentText(narrative)

      if (action !== null) {
        const newPHP = Math.max(0, pHP - playerDmg)
        const newEHP = Math.max(0, eHP - enemyDmg)
        setLastDmg({ player: playerDmg > 0 ? `-${playerDmg}` : null, enemy: enemyDmg > 0 ? `-${enemyDmg}` : null })
        if (playerDmg > 0) { setFlashPlayer(true); setTimeout(() => setFlashPlayer(false), 600) }
        if (enemyDmg > 0) { setTimeout(() => { setFlashEnemy(true); setTimeout(() => setFlashEnemy(false), 600) }, 250) }
        setPlayerHP(newPHP)
        setEnemyHP(newEHP)

        if (isFinal || newPHP <= 0 || newEHP <= 0 || historyArr.length + 1 >= MAX_ROUNDS) {
          const w = newPHP > newEHP ? 'player' : newEHP > newPHP ? 'enemy' : 'draw'
          setWinner(w)
          setPhase('ended')
        } else {
          setChoices(parsed)
          setRound(historyArr.length + 2)
        }
      } else {
        setChoices(parsed)
      }
    } catch { setFetchError(true) }
    finally { setStreaming(false) }
  }

  const startFight = (pChar, eChar) => {
    setPhase('fighting')
    setPlayerHP(INITIAL_HP); setEnemyHP(INITIAL_HP)
    setRound(1); setHistory([]); setWinner(null)
    setCurrentText(''); setChoices([])
    fetchRound(pChar, eChar, INITIAL_HP, INITIAL_HP, [], null)
  }

  const handleAction = (choice) => {
    const newHistory = [...history, { action: `${choice.key}) ${choice.text}`, narrative: currentText }]
    setHistory(newHistory)
    setChoices([])
    fetchRound(playerChar, enemyChar, playerHP, enemyHP, newHistory, `${choice.key}) ${choice.text}`)
  }

  const handleReset = () => {
    setPhase('pick-player'); setPlayerChar(null); setEnemyChar(null)
    setPlayerHP(INITIAL_HP); setEnemyHP(INITIAL_HP)
    setRound(1); setHistory([]); setCurrentText('')
    setChoices([]); setStreaming(false); setWinner(null); setFetchError(false)
  }

  /* ── Pick player ── */
  if (phase === 'pick-player') return (
    <div className="fight-page">
      <div className="fight-top-bar">
        <button className="fight-back-btn" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
      </div>
      <div className="fight-intro">
        <span className="fight-intro__eyebrow">⚔ Modo Combate</span>
        <h1 className="fight-intro__title">Tu personaje</h1>
        <p className="fight-intro__sub">¿Con quién vas a pelear?</p>
      </div>
      <div className="fight-chars-grid">
        {characters.map((char, i) => (
          <button key={char.id} className="fight-char-card"
            style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient, '--card-delay': `${i * 0.03}s` }}
            onClick={() => { setPlayerChar(char); setPhase('pick-enemy') }}>
            <div className="fight-char-card__bg" style={{ background: char.gradient }}>
              {char.image && <img src={char.image} alt={char.name} className="fight-char-card__img" />}
            </div>
            <div className="fight-char-card__overlay" />
            <div className="fight-char-card__info">
              <span className="fight-char-card__universe">{char.universe}</span>
              <span className="fight-char-card__name">{char.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  /* ── Pick enemy ── */
  if (phase === 'pick-enemy') return (
    <div className="fight-page">
      <div className="fight-top-bar">
        <button className="fight-back-btn" onClick={() => setPhase('pick-player')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
      </div>
      <div className="fight-intro">
        <div className="fight-intro__picked">
          {playerChar.image
            ? <img src={playerChar.image} alt={playerChar.name} className="fight-intro__picked-avatar" style={{ '--char-color': playerChar.themeColor }} />
            : <span>{playerChar.emoji}</span>}
          <span className="fight-intro__picked-name" style={{ color: playerChar.themeColor }}>{playerChar.name}</span>
        </div>
        <h1 className="fight-intro__title">El rival</h1>
        <p className="fight-intro__sub">¿A quién vas a enfrentar?</p>
      </div>
      <div className="fight-chars-grid">
        {characters.filter(c => c.id !== playerChar.id).map((char, i) => (
          <button key={char.id} className="fight-char-card"
            style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient, '--card-delay': `${i * 0.03}s` }}
            onClick={() => { setEnemyChar(char); startFight(playerChar, char) }}>
            <div className="fight-char-card__bg" style={{ background: char.gradient }}>
              {char.image && <img src={char.image} alt={char.name} className="fight-char-card__img" />}
            </div>
            <div className="fight-char-card__overlay" />
            <div className="fight-char-card__info">
              <span className="fight-char-card__universe">{char.universe}</span>
              <span className="fight-char-card__name">{char.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  /* ── Arena ── */
  const isEnded = phase === 'ended'
  const pColor = playerChar?.themeColor || '#fff'
  const eColor = enemyChar?.themeColor || '#f87171'

  return (
    <div className="fight-page fight-page--arena"
      style={{ '--pc': pColor, '--ec': eColor }}>

      {/* Cards VS */}
      <div className="fight-vs-section">
        {/* Player card */}
        <div className={`fcard fcard--player ${flashPlayer ? 'fcard--hit' : ''} ${isEnded && winner === 'enemy' ? 'fcard--loser' : ''} ${isEnded && winner === 'player' ? 'fcard--winner' : ''}`}
          style={{ '--cc': pColor }}>
          {lastDmg.player && <span className="fcard__dmg fcard__dmg--player">{lastDmg.player}</span>}
          <div className="fcard__img-wrap">
            {playerChar.image
              ? <img src={playerChar.image} alt={playerChar.name} className="fcard__img" />
              : <span className="fcard__emoji">{playerChar.emoji}</span>}
          </div>
          <div className="fcard__footer">
            <HPBar hp={playerHP} side="player" />
            <div className="fcard__footer-row">
              <span className="fcard__name">{playerChar.name}</span>
              <span className="fcard__hp-num" style={{ color: playerHP > 60 ? '#4ade80' : playerHP > 30 ? '#facc15' : '#f87171' }}>{playerHP}</span>
            </div>
          </div>
          {isEnded && winner === 'player' && <div className="fcard__crown">👑</div>}
        </div>

        {/* VS */}
        <div className="fight-vs-badge">
          {isEnded ? <span className="fight-vs-badge__fin">FIN</span> : <>
            <span className="fight-vs-badge__vs">VS</span>
            <span className="fight-vs-badge__round">R{round}/{MAX_ROUNDS}</span>
          </>}
        </div>

        {/* Enemy card */}
        <div className={`fcard fcard--enemy ${flashEnemy ? 'fcard--hit' : ''} ${isEnded && winner === 'player' ? 'fcard--loser' : ''} ${isEnded && winner === 'enemy' ? 'fcard--winner' : ''}`}
          style={{ '--cc': eColor }}>
          {lastDmg.enemy && <span className="fcard__dmg fcard__dmg--enemy">{lastDmg.enemy}</span>}
          <div className="fcard__img-wrap">
            {enemyChar.image
              ? <img src={enemyChar.image} alt={enemyChar.name} className="fcard__img" />
              : <span className="fcard__emoji">{enemyChar.emoji}</span>}
          </div>
          <div className="fcard__footer">
            <HPBar hp={enemyHP} side="enemy" />
            <div className="fcard__footer-row">
              <span className="fcard__name">{enemyChar.name}</span>
              <span className="fcard__hp-num" style={{ color: enemyHP > 60 ? '#4ade80' : enemyHP > 30 ? '#facc15' : '#f87171' }}>{enemyHP}</span>
            </div>
          </div>
          {isEnded && winner === 'enemy' && <div className="fcard__crown">👑</div>}
        </div>
      </div>

      {/* Narración */}
      <div className="fight-log">
        {history.map((e, i) => (
          <div key={i} className="fight-log__entry">
            <span className="fight-log__round">R{i + 1}</span>
            {e.narrative ? <span className="fight-log__text">{e.narrative}</span> : null}
            {e.action ? <span className="fight-log__action">↳ {e.action}</span> : null}
          </div>
        ))}

        <div className="fight-log__current">
          {isEnded && winner && (
            <div className={`fight-winner-label ${winner === 'player' ? 'fight-winner-label--player' : winner === 'enemy' ? 'fight-winner-label--enemy' : ''}`}>
              {winner === 'draw' ? '⚔ EMPATE' : `🏆 ${winner === 'player' ? playerChar.name : enemyChar.name} GANA`}
            </div>
          )}
          <p className="fight-log__narrative">
            {currentText}
            {streaming && <span className="fight-cursor">▋</span>}
          </p>
        </div>

        {/* Acciones */}
        {!streaming && choices.length > 0 && (
          <div className="fight-moves">
            <p className="fight-moves__label">— Tu movimiento —</p>
            <div className="fight-moves__list">
              {choices.map(c => (
                <button key={c.key} className="fight-move-btn" onClick={() => handleAction(c)}>
                  <span className="fight-move-btn__key">{c.key}</span>
                  <span className="fight-move-btn__text">{c.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!streaming && fetchError && (
          <div className="fight-moves">
            <button className="fight-move-btn" onClick={() => fetchRound(playerChar, enemyChar, playerHP, enemyHP, history, null)}>
              <span className="fight-move-btn__key">↺</span>
              <span className="fight-move-btn__text">Reintentar</span>
            </button>
          </div>
        )}

        {isEnded && !streaming && (
          <div className="fight-end-actions">
            <button className="fight-end-btn fight-end-btn--rematch" onClick={() => startFight(playerChar, enemyChar)}>⚔ Revancha</button>
            <button className="fight-end-btn" onClick={handleReset}>👥 Nuevo combate</button>
            <button className="fight-end-btn" onClick={() => navigate('/')}>🏠 Inicio</button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
