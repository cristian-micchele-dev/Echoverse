import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { characters } from '../data/characters'
import CharacterCard from '../components/CharacterCard/CharacterCard'
import { ROUTES, chatHistoryKey } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import { supabase } from '../lib/supabase'
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
  const { session } = useAuth()
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const [recentChats, setRecentChats] = useState(() => getRecentChats())
  const [activeTab, setActiveTab] = useState(recentChats.length > 0 ? 'recent' : 'all')
  const [customChars, setCustomChars] = useState([])
  const [communityChars, setCommunityChars] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Cargar personajes personalizados si el usuario está autenticado
  useEffect(() => {
    if (!session) return
    supabase
      .from('custom_characters')
      .select('id, name, emoji, color, avatar_url, welcome_message, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setCustomChars(data ?? []))
  }, [session])

  // Cargar personajes públicos de la comunidad
  useEffect(() => {
    if (!session) return
    supabase
      .from('custom_characters')
      .select('id, name, emoji, color, avatar_url, welcome_message, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setCommunityChars(data ?? []))
  }, [session])

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

  async function handleDeleteCustomChar(id, e) {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar este personaje?')) return
    setDeletingId(id)
    await supabase
      .from('custom_characters')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
    setCustomChars(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
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
          {session && (
            <button
              className={`chat-mode-switcher__btn${activeTab === 'custom' ? ' chat-mode-switcher__btn--active' : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M11 3v2M11 17v2M3 11h2M17 11h2M5.6 5.6l1.4 1.4M15 15l1.4 1.4M15 7l1.4-1.4M5.6 16.4l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Mis personajes
            </button>
          )}
          {session && (
            <button
              className={`chat-mode-switcher__btn${activeTab === 'community' ? ' chat-mode-switcher__btn--active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="15" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M1 18c0-3 2.8-4.5 7-4.5S15 15 15 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M15 13.5c2.5 0 5 1.2 5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Comunidad
            </button>
          )}
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
                  ? <img src={char.image} alt={char.name} loading="lazy" decoding="async" />
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

      {/* ── Vista "Mis personajes" (custom) ── */}
      {activeTab === 'custom' && (
        <div className="custom-chars-section">
          <button
            className="custom-chars-create-btn"
            onClick={() => navigate(ROUTES.CREAR_PERSONAJE)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Crear personaje
          </button>

          {customChars.length === 0 ? (
            <div className="custom-chars-empty">
              <span className="custom-chars-empty__icon">🤖</span>
              <p className="custom-chars-empty__text">Todavía no creaste ningún personaje.<br />¡Diseñá el tuyo!</p>
            </div>
          ) : (
            <div className="custom-chars-list">
              {customChars.map(char => (
                <div
                  key={char.id}
                  className="custom-char-item"
                  style={{ '--ci-color': char.color || '#7252E8' }}
                  onClick={() => handleSelect(`custom-${char.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleSelect(`custom-${char.id}`)}
                >
                  <div className="custom-char-item__avatar">
                    {char.avatar_url
                      ? <img src={char.avatar_url} alt={char.name} loading="lazy" />
                      : <span>{char.emoji || '🤖'}</span>
                    }
                  </div>
                  <div className="custom-char-item__info">
                    <span className="custom-char-item__name">{char.name}</span>
                    <span className="custom-char-item__tag">Personaje personalizado</span>
                  </div>
                  <button
                    className="custom-char-item__delete"
                    onClick={e => handleDeleteCustomChar(char.id, e)}
                    disabled={deletingId === char.id}
                    aria-label={`Eliminar ${char.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 4h10M6 4V3h4v1M5 4l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <svg className="custom-char-item__arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Vista "Comunidad" ── */}
      {activeTab === 'community' && (
        <div className="custom-chars-section">
          {communityChars.length === 0 ? (
            <div className="custom-chars-empty">
              <span className="custom-chars-empty__icon">🌐</span>
              <p className="custom-chars-empty__text">Todavía no hay personajes de la comunidad.<br />¡Sé el primero en crear uno!</p>
              <button className="custom-chars-create-btn" style={{ marginTop: 12 }} onClick={() => navigate(ROUTES.CREAR_PERSONAJE)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                Crear personaje
              </button>
            </div>
          ) : (
            <div className="custom-chars-list">
              {communityChars.map(char => (
                <div
                  key={char.id}
                  className="custom-char-item"
                  style={{ '--ci-color': char.color || '#7252E8' }}
                  onClick={() => handleSelect(`custom-${char.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleSelect(`custom-${char.id}`)}
                >
                  <div className="custom-char-item__avatar">
                    {char.avatar_url
                      ? <img src={char.avatar_url} alt={char.name} loading="lazy" />
                      : <span>{char.emoji || '🤖'}</span>
                    }
                  </div>
                  <div className="custom-char-item__info">
                    <span className="custom-char-item__name">{char.name}</span>
                    <span className="custom-char-item__tag" style={{ color: 'rgba(255,255,255,0.4)' }}>🌐 Comunidad</span>
                  </div>
                  <svg className="custom-char-item__arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
          )}
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
