import { useState, useRef } from 'react'
import { EMOJI_OPTIONS } from './constants.js'

export default function CreateCharAvatarPicker({ emoji, color, imagePreview, onImageChange, onEmojiSelect }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onImageChange(file, ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="create-char-avatar-section">
      <div
        className="create-char-avatar-preview"
        style={{ '--char-color': color, borderColor: color }}
      >
        {imagePreview
          ? <img src={imagePreview} alt="preview" />
          : <span className="create-char-avatar-emoji">{emoji}</span>
        }
      </div>
      <div className="create-char-avatar-controls">
        <button
          type="button"
          className="create-char-btn-outline"
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? 'Cambiar foto' : 'Subir foto'}
        </button>
        <button
          type="button"
          className="create-char-btn-ghost"
          onClick={() => setShowEmojiPicker(p => !p)}
        >
          {emoji} Emoji
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {showEmojiPicker && (
        <div className="create-char-emoji-picker">
          {EMOJI_OPTIONS.map(em => (
            <button
              key={em}
              type="button"
              className={`create-char-emoji-opt ${emoji === em ? 'create-char-emoji-opt--active' : ''}`}
              onClick={() => { onEmojiSelect(em); setShowEmojiPicker(false) }}
            >
              {em}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
