import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { buildCustomSystemPrompt } from '../utils/buildCustomSystemPrompt'
import { useAchievements } from '../hooks/useAchievements'
import { ROUTES } from '../utils/constants'
import './CreateCharacterPage.css'

const DEFAULT_COLOR = '#7252E8'
const EMOJI_OPTIONS = ['🤖', '🕵️', '🧙', '⚔️', '🦸', '🎭', '👑', '🐉', '🔮', '💀', '🧛', '🌟', '🤠', '🦊', '🎪']

export default function CreateCharacterPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { checkAndUnlock } = useAchievements()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    personality: '',
    rules: '',
    welcome_message: '',
    emoji: '🤖',
    color: DEFAULT_COLOR,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  if (!session) {
    navigate(ROUTES.AUTH)
    return null
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function uploadAvatar(userId, charId) {
    if (!imageFile) return null
    const ext = imageFile.name.split('.').pop().toLowerCase()
    const path = `custom-chars/${userId}/${charId}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, imageFile, { contentType: imageFile.type })
    if (uploadErr) throw new Error(uploadErr.message)
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.description.trim() || !form.personality.trim()) {
      setError('Nombre, descripción y personalidad son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)

    try {
      const system_prompt = buildCustomSystemPrompt({
        name: form.name,
        description: form.description,
        personality: form.personality,
        rules: form.rules,
      })

      // Crear personaje directamente vía cliente Supabase (session del usuario activa)
      const { data: inserted, error: insertErr } = await supabase
        .from('custom_characters')
        .insert({
          user_id: session.user.id,
          name: form.name,
          description: form.description,
          personality: form.personality,
          rules: form.rules || null,
          welcome_message: form.welcome_message || null,
          emoji: form.emoji || '🤖',
          color: form.color || '#7252E8',
          system_prompt,
          avatar_url: null,
        })
        .select('id')
        .single()

      if (insertErr) throw new Error(insertErr.message)

      const id = inserted.id

      // Si hay imagen, subirla y actualizar avatar_url (no bloquea si falla)
      if (imageFile) {
        try {
          const avatarUrl = await uploadAvatar(session.user.id, id)
          if (avatarUrl) {
            await supabase
              .from('custom_characters')
              .update({ avatar_url: avatarUrl })
              .eq('id', id)
              .eq('user_id', session.user.id)
          }
        } catch (imgErr) {
          console.warn('Upload imagen falló:', imgErr.message)
        }
      }

      checkAndUnlock({ customCharCreated: 1 })
      navigate(ROUTES.CHAT)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="create-char-page">
      <header className="create-char-header">
        <button className="create-char-back" onClick={() => navigate(ROUTES.CHAT)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <div>
          <span className="create-char-eyebrow">Personaje personalizado</span>
          <h1 className="create-char-title">Crear personaje</h1>
        </div>
      </header>

      <form className="create-char-form" onSubmit={handleSubmit}>
        {/* Avatar */}
        <div className="create-char-avatar-section">
          <div
            className="create-char-avatar-preview"
            style={{ '--char-color': form.color, borderColor: form.color }}
          >
            {imagePreview
              ? <img src={imagePreview} alt="preview" />
              : <span className="create-char-avatar-emoji">{form.emoji}</span>
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
              {form.emoji} Emoji
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>
          {showEmojiPicker && (
            <div className="create-char-emoji-picker">
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  type="button"
                  className={`create-char-emoji-opt ${form.emoji === em ? 'create-char-emoji-opt--active' : ''}`}
                  onClick={() => { setForm(p => ({ ...p, emoji: em })); setShowEmojiPicker(false) }}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nombre */}
        <div className="create-char-field">
          <label className="create-char-label">
            Nombre <span className="create-char-required">*</span>
          </label>
          <input
            className="create-char-input"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Detective Noir"
            maxLength={60}
            required
          />
        </div>

        {/* Descripción */}
        <div className="create-char-field">
          <label className="create-char-label">
            Descripción <span className="create-char-required">*</span>
          </label>
          <textarea
            className="create-char-textarea"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Un detective cínico de los años 40 que resuelve casos imposibles"
            rows={3}
            maxLength={400}
            required
          />
        </div>

        {/* Personalidad */}
        <div className="create-char-field">
          <label className="create-char-label">
            Personalidad <span className="create-char-required">*</span>
          </label>
          <textarea
            className="create-char-textarea"
            name="personality"
            value={form.personality}
            onChange={handleChange}
            placeholder="Lacónico, sarcástico, habla en metáforas, nunca muestra emociones"
            rows={3}
            maxLength={400}
            required
          />
        </div>

        {/* Reglas opcionales */}
        <div className="create-char-field">
          <label className="create-char-label">
            Reglas <span className="create-char-optional">(opcional)</span>
          </label>
          <textarea
            className="create-char-textarea"
            name="rules"
            value={form.rules}
            onChange={handleChange}
            placeholder="Nunca pide ayuda. Nunca admite que no sabe algo."
            rows={2}
            maxLength={300}
          />
        </div>

        {/* Mensaje de bienvenida */}
        <div className="create-char-field">
          <label className="create-char-label">
            Mensaje de bienvenida <span className="create-char-optional">(opcional)</span>
          </label>
          <textarea
            className="create-char-textarea"
            name="welcome_message"
            value={form.welcome_message}
            onChange={handleChange}
            placeholder="¿Qué querés?"
            rows={2}
            maxLength={300}
          />
        </div>

        {/* Color del tema */}
        <div className="create-char-field create-char-field--row">
          <label className="create-char-label">Color del tema</label>
          <div className="create-char-color-wrap">
            <input
              type="color"
              className="create-char-color-input"
              value={form.color}
              onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
            />
            <span className="create-char-color-value">{form.color}</span>
          </div>
        </div>

        {error && <p className="create-char-error">{error}</p>}

        <button
          type="submit"
          className="create-char-submit"
          style={{ '--char-color': form.color }}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Crear personaje'}
        </button>
      </form>
    </div>
  )
}
