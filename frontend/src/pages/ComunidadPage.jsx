import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'
import './ComunidadPage.css'

export default function ComunidadPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [chars, setChars] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('custom_characters')
      .select('id, name, emoji, color, avatar_url, description, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setChars(data)
        setLoading(false)
      })
  }, [])

  const filtered = chars.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(id) {
    if (!session) {
      navigate(ROUTES.AUTH)
      return
    }
    navigate(ROUTES.CHAT_CHARACTER(`custom-${id}`))
  }

  return (
    <div className="comunidad-page">
      <header className="comunidad-header">
        <button className="comunidad-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <div className="comunidad-header__text">
          <span className="comunidad-eyebrow">Comunidad</span>
          <h1 className="comunidad-title">Personajes personalizados</h1>
          {!loading && <span className="comunidad-count">{chars.length} personajes</span>}
        </div>
        {session && (
          <button className="comunidad-crear-btn" onClick={() => navigate(ROUTES.CREAR_PERSONAJE)}>
            + Crear el tuyo
          </button>
        )}
      </header>

      <div className="comunidad-search-wrap">
        <svg className="comunidad-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          className="comunidad-search"
          type="text"
          placeholder="Buscar personaje..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="comunidad-loading">
          <div className="comunidad-skeleton" />
          <div className="comunidad-skeleton" />
          <div className="comunidad-skeleton" />
          <div className="comunidad-skeleton" />
          <div className="comunidad-skeleton" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="comunidad-empty">
          <span className="comunidad-empty__icon">🌐</span>
          <p className="comunidad-empty__text">
            {search ? `No hay resultados para "${search}"` : 'Todavía no hay personajes públicos.'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="comunidad-list">
          {filtered.map(char => (
            <button
              key={char.id}
              className="custom-char-item"
              style={{ '--ci-color': char.color || '#7252E8' }}
              onClick={() => handleSelect(char.id)}
            >
              <div className="custom-char-item__avatar">
                {char.avatar_url
                  ? <img src={char.avatar_url} alt={char.name} loading="lazy" />
                  : <span>{char.emoji || '🤖'}</span>
                }
              </div>
              <div className="custom-char-item__info">
                <span className="custom-char-item__name">{char.name}</span>
                <span className="custom-char-item__tag">
                  {char.description
                    ? (char.description.length > 70 ? char.description.slice(0, 70) + '…' : char.description)
                    : '🌐 Comunidad'
                  }
                </span>
              </div>
              <svg className="custom-char-item__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
