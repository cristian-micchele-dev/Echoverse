import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { characters } from '../data/characters'
import CharacterCard from '../components/CharacterCard/CharacterCard'
import { ROUTES, chatHistoryKey } from '../utils/constants'
import './ChatModePage.css'

function formatChatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return d.toLocaleDateString('es-AR', { weekday: 'long' })
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function getRecentChats() {
  return characters
    .map(char => {
      try {
        const raw = localStorage.getItem(chatHistoryKey(char.id))
        if (!raw) return null
        const msgs = JSON.parse(raw)
        if (!msgs?.length) return null
        const last = msgs[msgs.length - 1]
        return { char, last, ts: last.ts ?? 0 }
      } catch { return null }
    })
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts)
}

export default function ChatModePage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const [recentChats, setRecentChats] = useState(() => getRecentChats())
  const [activeTab, setActiveTab] = useState(recentChats.length > 0 ? 'recent' : 'all')

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.universe.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(characterId) {
    setSelectedId(characterId)
    setExiting(true)
    setTimeout(() => navigate(ROUTES.CHAT_CHARACTER(characterId)), 260)
  }

  function handleDeleteChat(charId, e) {
    e.stopPropagation()
    localStorage.removeItem(chatHistoryKey(charId))
    const updated = recentChats.filter(r => r.char.id !== charId)
    setRecentChats(updated)
    if (updated.length === 0) setActiveTab('all')
  }

  function goToDuo() {
    setExiting(true)
    setTimeout(() => navigate(ROUTES.DUO), 260)
  }

  return (
    <div className={`chat-mode ${visible ? 'chat-mode--visible' : ''} ${exiting ? 'chat-mode--exiting' : ''}`}>
      <Helmet>
        <title>Elegí tu personaje — EchoVerse</title>
        <meta name="description" content="Más de 60 personajes icónicos del cine y la TV te esperan para conversar en tiempo real con IA." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/chat" />
      </Helmet>

      <header className="chat-mode-header">
        <button className="chat-mode-back" onClick={() => navigate(ROUTES.HOME)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>

        <div className="chat-mode-hero">
          <span className="chat-mode-eyebrow">Chat con Personaje</span>
          <h1 className="chat-mode-title">¿Cómo querés chatear?</h1>
          <p className="chat-mode-subtitle">Elegí un personaje y conversá. Sin guión, sin filtros.</p>
        </div>

        <div className="chat-mode-switcher">
          {recentChats.length > 0 && (
            <button
              className={`chat-mode-switcher__btn${activeTab === 'recent' ? ' chat-mode-switcher__btn--active' : ''}`}
              onClick={() => setActiveTab('recent')}
            >
              <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M11 7v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Mis chats
            </button>
          )}
          <button
            className={`chat-mode-switcher__btn${activeTab === 'all' ? ' chat-mode-switcher__btn--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
              <path d="M4 4h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H7l-4 3V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
            1 Personaje
          </button>
          <button className="chat-mode-switcher__btn" onClick={goToDuo}>
            <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
              <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="14.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M1 18c0-3 2.8-4.5 6.5-4.5S13 15 13 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M13 18c0-3 2.8-4.5 6.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            2 Personajes
          </button>
        </div>
      </header>

      {/* ── Vista "Mis chats" estilo WhatsApp ── */}
      {activeTab === 'recent' && (
        <div className="chat-inbox">
          {recentChats.map(({ char, last, ts }) => (
            <div
              key={char.id}
              className="chat-inbox-item"
              style={{ '--ci-color': char.themeColor }}
              onClick={() => handleSelect(char.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleSelect(char.id)}
            >
              <div className="chat-inbox-item__avatar">
                {char.image
                  ? <img src={char.image} alt={char.name} />
                  : <span>{char.emoji}</span>
                }
              </div>
              <div className="chat-inbox-item__body">
                <div className="chat-inbox-item__top">
                  <span className="chat-inbox-item__name">{char.name}</span>
                  <span className="chat-inbox-item__time">{formatChatTime(ts)}</span>
                </div>
                <div className="chat-inbox-item__bottom">
                  <span className="chat-inbox-item__universe">{char.universe}</span>
                  <span className="chat-inbox-item__preview">
                    {last.role === 'user' ? 'Vos: ' : ''}
                    {last.content?.slice(0, 55)}{last.content?.length > 55 ? '…' : ''}
                  </span>
                </div>
              </div>
              <button
                className="chat-inbox-item__delete"
                onClick={e => handleDeleteChat(char.id, e)}
                aria-label={`Eliminar chat con ${char.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4h10M6 4V3h4v1M5 4l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <svg className="chat-inbox-item__arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* ── Vista "Todos los personajes" ── */}
      {activeTab === 'all' && (
        <>
          <div className="chat-mode-search-wrap">
            <svg className="chat-mode-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="chat-mode-search"
              placeholder="Buscar personaje o universo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="chat-mode-grid">
            {filtered.map((char, i) => (
              <CharacterCard
                key={char.id}
                character={char}
                index={i}
                onSelect={handleSelect}
                selected={selectedId === char.id}
              />
            ))}
          </div>
          {filtered.length === 0 && search && (
            <div className="chat-mode-empty">
              <span className="chat-mode-empty__icon">🔍</span>
              <p className="chat-mode-empty__text">
                No encontramos personajes con <strong>"{search}"</strong>
              </p>
              <button className="chat-mode-empty__clear" onClick={() => setSearch('')}>
                Limpiar búsqueda
              </button>
            </div>
          )}
        </>
      )}

    </div>
  )
}
