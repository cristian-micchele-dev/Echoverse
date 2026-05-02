import { useState } from 'react'
import { PRESET_EVENTS } from './utils.js'

export default function EventPicker({ onSelect, onClose }) {
  const [custom, setCustom] = useState('')

  function handlePreset(text) {
    onSelect(text)
    onClose()
  }

  function handleCustom(e) {
    e.preventDefault()
    if (!custom.trim()) return
    onSelect(custom.trim())
    onClose()
  }

  return (
    <div className="rchat-overlay" onClick={onClose}>
      <div className="rchat-event-picker" onClick={e => e.stopPropagation()}>
        <div className="rchat-event-picker__header">
          <span>⚡ Disparar evento dramático</span>
          <button className="rchat-event-picker__close" onClick={onClose}>✕</button>
        </div>
        <div className="rchat-event-picker__presets">
          {PRESET_EVENTS.map(ev => (
            <button key={ev} className="rchat-event-preset-btn" onClick={() => handlePreset(ev)}>
              {ev}
            </button>
          ))}
        </div>
        <form className="rchat-event-picker__custom" onSubmit={handleCustom}>
          <input
            className="rchat-input"
            placeholder="O escribí tu propio evento..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            maxLength={120}
            autoFocus
          />
          <button
            type="submit"
            className="rchat-send-btn"
            disabled={!custom.trim()}
            aria-label="Disparar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
