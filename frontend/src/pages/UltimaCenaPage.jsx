import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { MESA_TEMAS } from '../data/mesaTemas'
import { readSSEStream } from '../utils/sse'
import { ROUTES } from '../utils/constants'
import { parseSseLine } from '../utils/ultimaCenaHelpers'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import './UltimaCenaPage.css'
import { API_URL } from '../config/api.js'
import { Helmet } from 'react-helmet-async'

// ─── Constantes de dominio ────────────────────────────────────────────────────
const MIN_COMENSALES = 3
const MAX_COMENSALES = 4
const SCROLL_DELAY_MS = 60

const QUICK_PROVOCATIONS = [
  '¿Alguien tiene algo que confesar?',
  '¿En quién de los presentes confiarían menos?',
  '¿Cuál fue el mayor error que cometieron?',
  '¿Qué harían si esta fuera la última vez que están juntos?',
  '¿Qué piensan de verdad el uno del otro?',
  'Si tuvieran que elegir solo a uno de los presentes para una misión imposible, ¿a quién elegirían?',
]

// ─── Component ───────────────────────────────────────────────────────────────
export default function UltimaCenaPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)
  const [selected, setSelected] = useState([]) // 3-4 chars
  const [tema, setTema] = useState('libre')
  const [phase, setPhase] = useState('setup') // setup | mesa
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [streamingChar, setStreamingChar] = useState(null) // char currently being written

  const [visible, setVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    if (phase === 'mesa' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'ultima-cena')
    }
  }, [phase, session])

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const selectedRef = useRef(selected)
  // Ref síncrono para guard de concurrencia — evita doble-disparo antes del re-render
  const isLoadingRef = useRef(false)
  selectedRef.current = selected

  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.universe.toLowerCase().includes(search.toLowerCase())
  )

  const toggleChar = (char) => {
    if (selected.find(c => c.id === char.id)) {
      setSelected(prev => prev.filter(c => c.id !== char.id))
    } else if (selected.length < MAX_COMENSALES) {
      setSelected(prev => [...prev, char])
    }
  }

  const isCharSelected = (char) => selected.some(c => c.id === char.id)
  const getSlotIndex = (char) => selected.findIndex(c => c.id === char.id)

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), SCROLL_DELAY_MS)
  }

  const currentTema = MESA_TEMAS.find(t => t.id === tema) ?? MESA_TEMAS[0]

  /**
   * Genera una escena completa. Un solo llamado al backend produce
   * todas las intervenciones de todos los personajes.
   */
  const generateScene = useCallback(async (trigger, isEvento = false) => {
    // Usar ref como guard síncrono — evita race condition antes del próximo render
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    const currentSelected = selectedRef.current

    const triggerMsg = isEvento
      ? { role: 'evento', content: trigger }
      : { role: 'user', content: trigger }

    setMessages(prev => [...prev, triggerMsg])
    setIsLoading(true)
    scrollToBottom()

    let lineBuffer = ''

    const handleSseLine = (line) =>
      parseSseLine(line, currentSelected, setStreamingChar, setMessages, scrollToBottom)

    try {
      const response = await fetch(`${API_URL}/ultima-cena/scene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chars: currentSelected.map(c => ({ id: c.id, name: c.name })),
          trigger,
          tema: currentTema.prompt,
          sceneFlow: currentTema.sceneFlow,
          dialogueRules: currentTema.dialogueRules,
          isEvento
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      await readSSEStream(response, chunk => {
        lineBuffer += chunk

        // Extraer todas las líneas completas que hayan llegado
        const lines = lineBuffer.split('\n')
        // El último elemento es el fragmento incompleto (puede ser '')
        lineBuffer = lines.pop()

        for (const line of lines) {
          handleSseLine(line)
        }
      })

      // Procesar cualquier fragmento final que no haya terminado con \n
      if (lineBuffer.trim()) {
        handleSseLine(lineBuffer)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'evento',
        content: 'Error de conexión. Intentá de nuevo.'
      }])
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
      setStreamingChar(null)
      inputRef.current?.focus()
    }
  }, [currentTema])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoadingRef.current) return
    setInput('')
    await generateScene(trimmed, false)
  }, [input, generateScene])

  const triggerEvento = useCallback(async () => {
    if (isLoadingRef.current) return
    const pool = currentTema.eventos
    const evento = pool[Math.floor(Math.random() * pool.length)]
    await generateScene(evento, true)
  }, [generateScene, currentTema])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Setup ───────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className={`cena-page ${visible ? 'cena-page--visible' : ''}`}>
        <Helmet>
          <title>La Última Cena — EchoVerse</title>
          <meta name="description" content="Elegí 5 personajes icónicos para tu última cena imaginaria. ¿Con quién querrías compartir la mesa? Sherlock, Gandalf, Joker y más." />
          <link rel="canonical" href="https://echoverse-jet.vercel.app/ultima-cena" />
        </Helmet>
        <div className="cena-bg" aria-hidden="true" />

        <header className="cena-header">
          <button className="cena-back-btn" onClick={() => navigate(ROUTES.HOME)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
          <div className="cena-header__title">
            <span className="cena-header__eyebrow">Multijugador Narrativo</span>
            <h1>Última Cena</h1>
            <p>Elegí 3 o 4 personajes. Dirigite a uno o lanzá un tema — la mesa reacciona.</p>
          </div>
        </header>

        <div className="cena-setup">

          {/* Slots */}
          <div className="cena-slots">
            {Array.from({ length: MAX_COMENSALES }, (_, i) => i).map(i => {
              const char = selected[i]
              return (
                <div
                  key={i}
                  className={`cena-slot ${char ? 'cena-slot--filled' : 'cena-slot--empty'} ${i >= MIN_COMENSALES ? 'cena-slot--optional' : ''}`}
                  style={char ? { '--slot-color': char.themeColor } : {}}
                >
                  {char ? (
                    <>
                      <img src={char.image} alt={char.name} onError={e => e.target.style.display='none'} />
                      <span className="cena-slot__name">{char.name.split(' ')[0]}</span>
                      <button className="cena-slot__remove" onClick={() => toggleChar(char)}>✕</button>
                    </>
                  ) : (
                    <>
                      <div className="cena-slot__plus">+</div>
                      <span className="cena-slot__placeholder">
                        {i < MIN_COMENSALES ? `Asiento ${i + 1}` : 'Opcional'}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Temas */}
          <div className="cena-temas">
            <span className="cena-temas__label">Tema de mesa</span>
            <div className="cena-temas__grid">
              {MESA_TEMAS.map(t => (
                <button
                  key={t.id}
                  className={`cena-tema-btn ${tema === t.id ? 'cena-tema-btn--active' : ''}`}
                  onClick={() => setTema(t.id)}
                >
                  <span className="cena-tema-btn__label">{t.label}</span>
                  <span className="cena-tema-btn__desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Búsqueda */}
          <div className="cena-search-wrap">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              className="cena-search-input"
              type="text"
              placeholder="Buscar personaje..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="cena-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>

          <div className="cena-char-grid">
            {filtered.map(char => {
              const slotIdx = getSlotIndex(char)
              const full = !isCharSelected(char) && selected.length >= MAX_COMENSALES
              return (
                <button
                  key={char.id}
                  className={`cena-char-btn ${isCharSelected(char) ? 'cena-char-btn--selected' : ''} ${full ? 'cena-char-btn--disabled' : ''}`}
                  style={{ '--char-color': char.themeColor }}
                  onClick={() => toggleChar(char)}
                  disabled={full}
                >
                  {slotIdx >= 0 && <span className="cena-char-slot">{slotIdx + 1}</span>}
                  <div className="cena-char-img">
                    <img src={char.image} alt={char.name} />
                  </div>
                  <span className="cena-char-name">{char.name}</span>
                </button>
              )
            })}
          </div>


          <button
            className="cena-start-btn"
            onClick={() => setPhase('mesa')}
            disabled={selected.length < MIN_COMENSALES}
          >
            🍷 Sentarse a la mesa
          </button>
        </div>
      </div>
    )
  }

  // ─── Mesa ─────────────────────────────────────────────────────────────────
  return (
    <div className={`cena-page cena-page--mesa ${visible ? 'cena-page--visible' : ''}`}>

      {/* Header */}
      <header className="cena-mesa-header">
        <button
          className="cena-back-btn"
          onClick={() => { setPhase('setup'); setMessages([]); recordedRef.current = false }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="cena-asientos">
          {selected.map(char => (
            <div
              key={char.id}
              className={`cena-asiento ${streamingChar?.id === char.id ? 'cena-asiento--typing' : ''}`}
              style={{ '--char-color': char.themeColor }}
            >
              <div className="cena-asiento__img-wrap">
                <img src={char.image} alt={char.name} onError={e => e.target.style.display='none'} />
              </div>
              <span className="cena-asiento__name">{char.name.split(' ')[0]}</span>
              {streamingChar?.id === char.id && (
                <span className="cena-asiento__typing-dots"><span/><span/><span/></span>
              )}
            </div>
          ))}
        </div>

        <button
          className="cena-evento-btn"
          onClick={triggerEvento}
          disabled={isLoading}
          title="Provocar evento"
        >
          🎲
        </button>
      </header>

      {/* Mensajes */}
      <div className="cena-messages">
        {messages.length === 0 && (
          <div className="cena-empty">
            <div className="cena-empty__avatars">
              {selected.map(char => (
                <img
                  key={char.id}
                  src={char.image}
                  alt={char.name}
                  style={{ borderColor: char.themeColor }}
                  onError={e => e.target.style.display='none'}
                />
              ))}
            </div>
            <p>La mesa está lista.<br />Dirigite a alguien o lanzá un tema.</p>
            {tema !== 'libre' && (
              <span className="cena-empty__tema">
                {currentTema.label}
              </span>
            )}
            <p className="cena-empty__hint">
              Usá <strong>@Nombre</strong> para hablarle a uno solo · 🎲 para provocar un evento
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isSceneStart = i > 0 && (msg.role === 'user' || msg.role === 'evento')
          // ── Evento ─────────────────────────────────────
          if (msg.role === 'evento') {
            return (
              <div key={i} className={`cena-evento-msg${isSceneStart ? ' cena-scene-start' : ''}`}>
                <span className="cena-evento-msg__bar" />
                <p>{msg.content}</p>
                <span className="cena-evento-msg__bar" />
              </div>
            )
          }
          // ── Usuario ────────────────────────────────────
          if (msg.role === 'user') {
            return (
              <div key={i} className={`cena-msg cena-msg--user${isSceneStart ? ' cena-scene-start' : ''}`}>
                <div className="cena-msg__bubble cena-msg__bubble--user">
                  <p>{msg.content}</p>
                </div>
              </div>
            )
          }
          // ── Reacción silenciosa ────────────────────────
          if (msg.role === 'reaction') {
            return (
              <div key={i} className="cena-reaction">
                <div className="cena-reaction__avatar" style={{ '--char-color': msg.char.themeColor }}>
                  {msg.char.image && (
                    <img src={msg.char.image} alt={msg.char.name} onError={e => e.target.style.display='none'} />
                  )}
                </div>
                <p className="cena-reaction__text">({msg.content})</p>
              </div>
            )
          }
          // ── Personaje ──────────────────────────────────
          return (
            <div key={i} className="cena-msg cena-msg--char">
              <div className="cena-msg__avatar" style={{ '--char-color': msg.char.themeColor }}>
                {msg.char.image && (
                  <img src={msg.char.image} alt={msg.char.name} onError={e => e.target.style.display='none'} />
                )}
              </div>
              <div className="cena-msg__body">
                <span className="cena-msg__name" style={{ color: msg.char.themeColor }}>
                  {msg.char.name}
                </span>
                <div className="cena-msg__bubble" style={{ '--char-color': msg.char.themeColor }}>
                  <p>{msg.content}</p>
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator mientras el AI genera */}
        {isLoading && !streamingChar && (
          <div className="cena-generating">
            {selected.map((char, i) => (
              <div
                key={char.id}
                className="cena-generating__avatar"
                style={{ '--char-color': char.themeColor, animationDelay: `${i * 0.15}s` }}
              >
                <img src={char.image} alt={char.name} onError={e => e.target.style.display='none'} />
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="cena-input-area">
        {/* Quick provocations */}
        <div className="cena-provocations">
          {QUICK_PROVOCATIONS.map((p, i) => (
            <button
              key={i}
              className="cena-provocation-chip"
              onClick={() => generateScene(p, false)}
              disabled={isLoading}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="cena-input-row">
          <textarea
            ref={inputRef}
            className="cena-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Lanzá un tema… o @Nombre para hablarle a uno solo"
            rows={1}
            disabled={isLoading}
          />
          <button
            className="cena-send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            {isLoading
              ? <span className="cena-send-loading" />
              : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 9h14M9.5 3L16 9l-6.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            }
          </button>
        </div>
      </div>
    </div>
  )
}
