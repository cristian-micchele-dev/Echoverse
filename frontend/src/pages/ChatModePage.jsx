import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { characters } from '../data/characters'
import CharacterCard from '../components/CharacterCard/CharacterCard'
import { ROUTES } from '../utils/constants'
import './ChatModePage.css'

export default function ChatModePage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

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
          <button className="chat-mode-switcher__btn chat-mode-switcher__btn--active">
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

    </div>
  )
}
