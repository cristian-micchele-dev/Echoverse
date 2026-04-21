import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { readSSEStream } from '../utils/sse'
import { ROUTES } from '../utils/constants'
import './DuoPage.css'
import { API_URL } from '../config/api.js'

async function fetchCharResponse(characterId, messages, duoMode = null) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId, messages, ...(duoMode && { duoMode }) })
  })
  let full = ''
  await readSSEStream(response, content => { full += content })
  return full
}

function buildHistory(msgs, myCharId) {
  return msgs.map(msg => {
    if (msg.role === 'user') return { role: 'user', content: msg.content }
    if (msg.char?.id === myCharId) return { role: 'assistant', content: msg.content }
    return { role: 'user', content: `[${msg.char?.name}]: ${msg.content}` }
  })
}

export default function DuoPage() {
  const navigate = useNavigate()
  const [charA, setCharA] = useState(null)
  const [charB, setCharB] = useState(null)
  const [phase, setPhase] = useState('setup') // setup | chat
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [typingChar, setTypingChar] = useState(null)
  const [search, setSearch] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.universe.toLowerCase().includes(search.toLowerCase())
  )

  const selectChar = (char) => {
    if (!charA) { setCharA(char); return }
    if (charA.id === char.id) { setCharA(null); return }
    if (!charB) { setCharB(char); return }
    if (charB.id === char.id) { setCharB(null); return }
    setCharB(char)
  }

  const isSelected = (char) => charA?.id === char.id || charB?.id === char.id
  const getSlot = (char) => charA?.id === char.id ? 'A' : charB?.id === char.id ? 'B' : null

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const detectAddressed = (text, a, b) => {
    const lower = text.toLowerCase()
    const wordsA = a.name.toLowerCase().split(' ')
    const wordsB = b.name.toLowerCase().split(' ')
    const mentionsA = wordsA.some(w => w.length > 2 && lower.includes(w))
    const mentionsB = wordsB.some(w => w.length > 2 && lower.includes(w))
    if (mentionsA && !mentionsB) return 'A'
    if (mentionsB && !mentionsA) return 'B'
    return 'both'
  }

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const addressed = detectAddressed(trimmed, charA, charB)
    const userMsg = { role: 'user', content: trimmed }
    const updatedMsgs = [...messages, userMsg]
    setMessages(updatedMsgs)
    setInput('')
    setIsLoading(true)
    scrollToBottom()

    try {
      if (addressed === 'A' || addressed === 'both') {
        setTypingChar('charA')
        const histA = buildHistory(updatedMsgs, charA.id, charB)
        const responseA = await fetchCharResponse(charA.id, histA, {
          role: 'A',
          otherCharName: charB.name
        })
        const msgA = { role: 'charA', content: responseA, char: charA }
        updatedMsgs.push(msgA)
        setMessages([...updatedMsgs])
        scrollToBottom()

        if (addressed === 'both') {
          setTypingChar('charB')
          const histB = buildHistory(updatedMsgs, charB.id, charA)
          const responseB = await fetchCharResponse(charB.id, histB, {
            role: 'B',
            otherCharName: charA.name,
            responseA
          })
          const msgB = { role: 'charB', content: responseB, char: charB }
          updatedMsgs.push(msgB)
          setMessages([...updatedMsgs])
          scrollToBottom()

          setTypingChar('charA')
          const responseA2 = await fetchCharResponse(charA.id, [], {
            role: 'A2',
            otherCharName: charB.name,
            responseB
          })
          const msgA2 = { role: 'charA', content: responseA2, char: charA, isRemate: true }
          updatedMsgs.push(msgA2)
          setMessages([...updatedMsgs])
          scrollToBottom()
        }
      } else if (addressed === 'B') {
        setTypingChar('charB')
        const histB = buildHistory(updatedMsgs, charB.id, charA)
        const responseB = await fetchCharResponse(charB.id, histB, {
          role: 'A',
          otherCharName: charA.name
        })
        const msgB = { role: 'charB', content: responseB, char: charB }
        updatedMsgs.push(msgB)
        setMessages([...updatedMsgs])
        scrollToBottom()
      }
    } catch {
      setMessages(prev => [...prev, { role: 'charA', content: 'Error al conectar con el servidor.', char: charA }])
    } finally {
      setIsLoading(false)
      setTypingChar(null)
      inputRef.current?.focus()
    }
  }, [input, isLoading, messages, charA, charB])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Setup ───────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="duo-page">
        <header className="duo-header">
          <button className="duo-back-btn" onClick={() => navigate(ROUTES.HOME)} aria-label="Volver al inicio">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
          <div className="duo-header__title">
            <span className="duo-header__eyebrow">Modo especial</span>
            <h1>💬 Chat en Alianza</h1>
            <p>Elegí dos personajes y chateá con los dos a la vez.</p>
          </div>
        </header>

        <div className="duo-setup">
          <div className="duo-slots">
            <div className={`duo-slot ${charA ? 'duo-slot--filled' : 'duo-slot--empty'}`}>
              {charA ? (
                <>
                  <img src={charA.image} alt={charA.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
                  <span>{charA.name}</span>
                </>
              ) : <span className="duo-slot__placeholder">Personaje 1</span>}
            </div>
            <div className="duo-and">+</div>
            <div className={`duo-slot ${charB ? 'duo-slot--filled' : 'duo-slot--empty'}`}>
              {charB ? (
                <>
                  <img src={charB.image} alt={charB.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
                  <span>{charB.name}</span>
                </>
              ) : <span className="duo-slot__placeholder">Personaje 2</span>}
            </div>
          </div>

          <div className="duo-search-wrap">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              className="duo-search-input"
              type="text"
              placeholder="Buscar personaje..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar personaje"
            />
            {search && <button className="duo-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>

          <div className="duo-char-grid" role="list">
            {filtered.map(char => (
              <button
                key={char.id}
                className={`duo-char-btn ${isSelected(char) ? 'duo-char-btn--selected' : ''}`}
                style={{ '--char-color': char.themeColor, '--char-gradient': char.gradient }}
                onClick={() => selectChar(char)}
                aria-label={`${isSelected(char) ? 'Quitar' : 'Agregar'} ${char.name}`}
                aria-pressed={isSelected(char)}
                role="listitem"
              >
                {getSlot(char) && <span className="duo-char-slot">{getSlot(char)}</span>}
                <div className="duo-char-img">
                  <img src={char.image} alt={char.name} loading="lazy" decoding="async" />
                </div>
                <span className="duo-char-name">{char.name}</span>
              </button>
            ))}
          </div>

          <button
            className="duo-start-btn"
            onClick={() => setPhase('chat')}
            disabled={!charA || !charB}
          >
            💬 Iniciar Alianza
          </button>
        </div>
      </div>
    )
  }

  // ─── Chat ─────────────────────────────────────────
  return (
    <div className="duo-page duo-page--chat">
      <header className="duo-chat-header">
        <button className="duo-back-btn" onClick={() => { setPhase('setup'); setMessages([]) }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <div className="duo-chat-combatants">
          <div className="duo-chat-char" style={{ '--char-color': charA.themeColor }}>
            <img src={charA.image} alt={charA.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
            <div>
              <span className="duo-chat-char__name">{charA.name}</span>
              {typingChar === 'charA' && <span className="duo-chat-char__typing">escribiendo...</span>}
            </div>
          </div>
          <span className="duo-chat-plus">⇄</span>
          <div className="duo-chat-char" style={{ '--char-color': charB.themeColor }}>
            <img src={charB.image} alt={charB.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
            <div>
              <span className="duo-chat-char__name">{charB.name}</span>
              {typingChar === 'charB' && <span className="duo-chat-char__typing">escribiendo...</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="duo-messages">
        {messages.length === 0 && (
          <div className="duo-empty">
            <div className="duo-empty__avatars">
              <img src={charA.image} alt={charA.name} style={{ borderColor: charA.themeColor }} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
              <img src={charB.image} alt={charB.name} style={{ borderColor: charB.themeColor }} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
            </div>
            <p>Los dos están listos. ¿Qué les querés preguntar?</p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'user') {
            return (
              <div key={i} className="duo-msg duo-msg--user">
                <div className="duo-msg__bubble duo-msg__bubble--user">
                  <p>{msg.content}</p>
                </div>
              </div>
            )
          }
          const isA = msg.role === 'charA'
          return (
            <div key={i} className={`duo-msg ${isA ? 'duo-msg--a' : 'duo-msg--b'} ${msg.isRemate ? 'duo-msg--remate' : ''}`}>
              <div className="duo-msg__avatar" style={{ '--char-color': msg.char.themeColor }}>
                <img src={msg.char.image} alt={msg.char.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
              </div>
              <div className="duo-msg__bubble" style={{ '--char-color': msg.char.themeColor }}>
                {msg.isRemate && <span className="duo-msg__remate-label">↩</span>}
                <p>{msg.content}</p>
              </div>
            </div>
          )
        })}

        {typingChar && (() => {
          const char = typingChar === 'charA' ? charA : charB
          return (
            <div className={`duo-msg ${typingChar === 'charA' ? 'duo-msg--a' : 'duo-msg--b'}`}>
              <div className="duo-msg__avatar" style={{ '--char-color': char.themeColor }}>
                <img src={char.image} alt={char.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
              </div>
              <div className="duo-msg__bubble duo-msg__bubble--typing" style={{ '--char-color': char.themeColor }}>
                <span /><span /><span />
              </div>
            </div>
          )
        })()}

        <div ref={bottomRef} />
      </div>

      <div className="duo-input-area">
        <textarea
          ref={inputRef}
          className="duo-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Provocá, preguntá, desafiá..."
          rows={1}
          disabled={isLoading}
          aria-label="Mensaje para los personajes"
        />
        <button
          className="duo-send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          aria-label="Enviar mensaje"
        >
          {isLoading
            ? <span className="duo-send-loading" />
            : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9h14M9.5 3L16 9l-6.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )
          }
        </button>
      </div>
    </div>
  )
}
