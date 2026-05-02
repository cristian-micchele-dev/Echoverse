import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { buildCustomSystemPrompt } from '../utils/buildCustomSystemPrompt'
import { useAchievements } from '../hooks/useAchievements'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import { ROUTES } from '../utils/constants'
import { DEFAULT_COLOR } from './createCharacter/constants.js'
import CreateCharTemplates from './createCharacter/CreateCharTemplates.jsx'
import CreateCharAvatarPicker from './createCharacter/CreateCharAvatarPicker.jsx'
import CreateCharFields from './createCharacter/CreateCharFields.jsx'
import CreateCharColorPicker from './createCharacter/CreateCharColorPicker.jsx'
import CreateCharPreviewBar from './createCharacter/CreateCharPreviewBar.jsx'
import CreateCharSuccess from './createCharacter/CreateCharSuccess.jsx'
import './CreateCharacterPage.css'

export default function CreateCharacterPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { checkAndUnlock, newlyUnlocked, dismissToast } = useAchievements()
  const [savedOk, setSavedOk] = useState(false)
  const [createdId, setCreatedId] = useState(null)

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
  const [activeTemplate, setActiveTemplate] = useState(null)

  useEffect(() => {
    if (!session) navigate(ROUTES.AUTH)
  }, [session, navigate])

  if (!session) return null

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImageChange(file, preview) {
    setImageFile(file)
    setImagePreview(preview)
  }

  function handleEmojiSelect(em) {
    setForm(prev => ({ ...prev, emoji: em }))
  }

  function handleColorChange(c) {
    setForm(prev => ({ ...prev, color: c }))
  }

  function applyTemplate(tpl) {
    setActiveTemplate(tpl.id)
    setForm(prev => ({
      ...prev,
      name: prev.name.trim() ? prev.name : tpl.label,
      description: tpl.description,
      personality: tpl.personality,
      rules: tpl.rules,
      welcome_message: tpl.welcome_message,
      emoji: tpl.emoji,
      color: tpl.color,
    }))
    setImagePreview(null)
    setImageFile(null)
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
          color: form.color || DEFAULT_COLOR,
          system_prompt,
          avatar_url: null,
          is_public: true,
        })
        .select('id')
        .single()

      if (insertErr) throw new Error(insertErr.message)

      const id = inserted.id

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

      await checkAndUnlock({ customCharCreated: 1 })
      setCreatedId(id)
      setSavedOk(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (savedOk && createdId) {
    return (
      <CreateCharSuccess
        form={form}
        imagePreview={imagePreview}
        createdId={createdId}
        navigate={navigate}
        newlyUnlocked={newlyUnlocked}
        dismissToast={dismissToast}
      />
    )
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

      <CreateCharTemplates activeTemplate={activeTemplate} onApplyTemplate={applyTemplate} />

      <form className="create-char-form" onSubmit={handleSubmit}>
        <CreateCharAvatarPicker
          emoji={form.emoji}
          color={form.color}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          onEmojiSelect={handleEmojiSelect}
        />

        <CreateCharFields form={form} onChange={handleChange} />

        <CreateCharColorPicker color={form.color} onColorChange={handleColorChange} />

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

      {newlyUnlocked.map(a => (
        <AchievementToast key={a.id} achievement={a} onDismiss={() => dismissToast(a.id)} />
      ))}

      <CreateCharPreviewBar form={form} imagePreview={imagePreview} />
    </div>
  )
}
