import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { buildCustomSystemPrompt } from '../utils/ai/buildCustomSystemPrompt'
import { ROUTES } from '../utils/constants'
import { DEFAULT_COLOR, EMOJI_OPTIONS } from './createCharacter/constants.js'
import './CreateCharacterPage.css'

export default function EditCharacterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    if (!session) { navigate(ROUTES.AUTH); return }

    supabase
      .from('custom_characters')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) { navigate(ROUTES.CHAT); return }
        setForm({
          name: data.name ?? '',
          description: data.description ?? '',
          personality: data.personality ?? '',
          rules: data.rules ?? '',
          welcome_message: data.welcome_message ?? '',
          emoji: data.emoji ?? '🤖',
          color: data.color ?? DEFAULT_COLOR,
        })
        setCurrentAvatarUrl(data.avatar_url ?? null)
        setLoading(false)
      })
  }, [id, session, navigate])

  if (!session || loading || !form) return null

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
      .upload(path, imageFile, { contentType: imageFile.type, upsert: true })
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

      const updates = {
        name: form.name,
        description: form.description,
        personality: form.personality,
        rules: form.rules || null,
        welcome_message: form.welcome_message || null,
        emoji: form.emoji || '🤖',
        color: form.color || DEFAULT_COLOR,
        system_prompt,
      }

      const { error: updateErr } = await supabase
        .from('custom_characters')
        .update(updates)
        .eq('id', id)
        .eq('user_id', session.user.id)

      if (updateErr) throw new Error(updateErr.message)

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

      navigate(ROUTES.CHAT)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const previewSrc = imagePreview ?? currentAvatarUrl

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
          <h1 className="create-char-title">Editar personaje</h1>
        </div>
      </header>

      <form className="create-char-form" onSubmit={handleSubmit}>
        {/* Avatar */}
        <div className="create-char-avatar-section">
          <div
            className="create-char-avatar-preview"
            style={{ '--char-color': form.color, borderColor: form.color }}
          >
            {previewSrc
              ? <img src={previewSrc} alt="preview" />
              : <span className="create-char-avatar-emoji">{form.emoji}</span>
            }
          </div>
          <div className="create-char-avatar-controls">
            <button
              type="button"
              className="create-char-btn-outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewSrc ? 'Cambiar foto' : 'Subir foto'}
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
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
