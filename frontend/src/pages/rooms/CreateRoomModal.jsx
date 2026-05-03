import { useState, useEffect, useRef } from 'react'
import { characters } from '../../data/characters'

export default function CreateRoomModal({ onClose, onCreate }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.universe.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate() {
    if (!selected || creating) return
    setCreating('loading')
    try {
      await onCreate(selected.id, name.trim())
    } catch {
      setCreating('')
    }
  }

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={e => e.stopPropagation()}>
        <div className="rm-modal__header">
          <h2 className="rm-modal__title">Nueva sala</h2>
          <button className="rm-modal__close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="rm-modal__search-wrap">
          <input
            ref={inputRef}
            className="input-base rm-modal__search"
            placeholder="Buscar personaje..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="rm-modal__grid">
          {filtered.map(char => (
            <button
              key={char.id}
              className={`rm-modal__char ${selected?.id === char.id ? 'rm-modal__char--active' : ''}`}
              onClick={() => setSelected(char)}
              style={selected?.id === char.id ? { '--char-accent': char.themeColor } : {}}
            >
              <img src={char.image} alt={char.name} className="rm-modal__char-img" loading="lazy" decoding="async" />
              <span className="rm-modal__char-name">{char.name}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="rm-modal__footer">
            <input
              className="input-base rm-modal__name-input"
              placeholder={`Nombre de la sala (opcional)`}
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button
              className="btn-primary rm-modal__create-btn"
              onClick={handleCreate}
              disabled={creating === 'loading'}
            >
              {creating === 'loading' ? 'Creando...' : `Crear sala con ${selected.name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
