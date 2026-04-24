import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'
import './ComunidadPage.css'
import { Helmet } from 'react-helmet-async'

export default function ComunidadPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [chars, setChars] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    supabase
      .from('custom_characters')
      .select('id, name, emoji, color, avatar_url, description, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setChars(data)
        setLoading(false)
        requestAnimationFrame(() => setVisible(true))
      })
  }, [])

  const filtered = chars.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(id) {
    if (!session) { navigate(ROUTES.AUTH); return }
    navigate(ROUTES.CHAT_CHARACTER(`custom-${id}`))
  }

  return (
    <div className={`cp-page${visible ? ' cp-page--visible' : ''}`}>
      <Helmet>
        <title>Comunidad — EchoVerse</title>
        <meta name="description" content="Conocé a los fans de EchoVerse. Descubrí quién está chateando con tus personajes favoritos del cine y la TV." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/comunidad" />
      </Helmet>

      {/* ── Hero ── */}
      <div className="cp-hero">
        <button className="cp-back" onClick={() => navigate(-1)}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>

        <div className="cp-hero__main">
          <div>
            <p className="cp-eyebrow">🌐 Comunidad</p>
            <h1 className="cp-title">Personajes<br /><em>creados por jugadores</em></h1>
            {!loading && (
              <p className="cp-subtitle">
                {chars.length} {chars.length === 1 ? 'personaje' : 'personajes'} disponibles · Chateá con cualquiera
              </p>
            )}
          </div>

          {session && (
            <button className="cp-crear" onClick={() => navigate(ROUTES.CREAR_PERSONAJE)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Crear el tuyo
            </button>
          )}
        </div>

        <div className="cp-search-wrap">
          <svg className="cp-search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            className="cp-search"
            type="text"
            placeholder="Buscar personaje..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="cp-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      {loading && (
        <div className="cp-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cp-skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="cp-empty">
          <span className="cp-empty__icon">🌐</span>
          <p className="cp-empty__text">
            {search ? `Sin resultados para "${search}"` : 'Todavía no hay personajes públicos.'}
          </p>
          {!search && session && (
            <button className="cp-empty__cta" onClick={() => navigate(ROUTES.CREAR_PERSONAJE)}>
              Sé el primero en crear uno
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="cp-grid">
          {filtered.map((char, i) => (
            <button
              key={char.id}
              className="cp-card"
              style={{
                '--ci': char.color || '#7252E8',
                animationDelay: `${Math.min(i, 12) * 0.05}s`,
              }}
              onClick={() => handleSelect(char.id)}
            >
              {/* Fondo */}
              <div className="cp-card__bg">
                {char.avatar_url
                  ? <img src={char.avatar_url} alt={char.name} loading="lazy" />
                  : (
                    <div
                      className="cp-card__bg-color"
                      style={{ background: `radial-gradient(ellipse at 50% 30%, color-mix(in srgb, ${char.color || '#7252E8'} 30%, #1a1a2e), #0d0d1a)` }}
                    >
                      <span className="cp-card__bg-emoji">{char.emoji || '🤖'}</span>
                    </div>
                  )
                }
                <div className="cp-card__overlay" />
              </div>

              {/* Contenido */}
              <div className="cp-card__content">
                <span className="cp-card__badge">🌐 Comunidad</span>
                <h3 className="cp-card__name">{char.name}</h3>
                {char.description && (
                  <p className="cp-card__desc">
                    {char.description.length > 80 ? char.description.slice(0, 80) + '…' : char.description}
                  </p>
                )}
                <span className="cp-card__cta">
                  Chatear
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>

              {/* Borde glow */}
              <div className="cp-card__border" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
