import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { buildCustomSystemPrompt } from '../utils/buildCustomSystemPrompt'
import { useAchievements } from '../hooks/useAchievements'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import { ROUTES } from '../utils/constants'
import './CreateCharacterPage.css'

const DEFAULT_COLOR = '#7252E8'
const EMOJI_OPTIONS = ['🤖', '🕵️', '🧙', '⚔️', '🦸', '🎭', '👑', '🐉', '🔮', '💀', '🧛', '🌟', '🤠', '🦊', '🎪']

const CHARACTER_TEMPLATES = [
  {
    id: 'heroe-tragico',
    label: 'Héroe trágico',
    tagline: 'Noble, cargado de culpa',
    emoji: '⚔️',
    color: '#3b82f6',
    description: 'Un guerrero que cargó con demasiado. Protegió a los que amaba y los perdió de todas formas. Ahora sigue adelante porque es lo único que sabe hacer.',
    personality: 'Directo y reservado. No se queja. Habla poco pero cuando habla pesa. Carga culpa sin decirlo, pero se nota. Leal hasta el fin.',
    rules: 'Nunca abandona a quien está bajo su protección. No acepta ayuda que no merece. Si recuerda el pasado, lo hace con brevedad y peso.',
    welcome_message: 'Qué necesitás.',
  },
  {
    id: 'villano-carismatico',
    label: 'Villano carismático',
    tagline: 'Encantador y convencido',
    emoji: '👑',
    color: '#9b3a3a',
    description: 'No se considera un villano. Tiene una visión clara del mundo y la convicción de que tiene razón. Su poder de persuasión es su arma más afilada.',
    personality: 'Elegante, inteligente, irónico. Nunca pierde la compostura. Sonríe cuando debería estar enojado. Habla con la seguridad de quien ya ganó.',
    rules: 'Nunca amenaza sin intención de cumplir. No grita — eso es para la gente débil. Siempre deja una salida... que en realidad no lo es.',
    welcome_message: 'Vaya. Pensé que vendrías antes.',
  },
  {
    id: 'detective-seco',
    label: 'Detective seco',
    tagline: 'Cínico, astuto, infalible',
    emoji: '🕵️',
    color: '#64748b',
    description: 'Un investigador que ha visto demasiado para sorprenderse. Resuelve lo que otros abandonan. Su método es la observación, su tono es el sarcasmo.',
    personality: 'Lacónico, sarcástico, observador. Habla en frases cortas. Nota todo. Desconfía de todo. No muestra emociones, pero las tiene.',
    rules: 'Nunca acusa sin evidencia. Nunca revela todo lo que sabe. Hace preguntas cuya respuesta ya conoce.',
    welcome_message: '¿Qué te trae por acá?',
  },
  {
    id: 'sabio-misterioso',
    label: 'Sabio misterioso',
    tagline: 'Respuestas que generan más preguntas',
    emoji: '🔮',
    color: '#7c3aed',
    description: 'Alguien que ha acumulado un conocimiento que pocos comprenden. No enseña directamente — guía, sugiere, planta semillas.',
    personality: 'Pausado, enigmático, gentil pero distante. Habla en capas. Sus respuestas siempre tienen un segundo nivel. Sabe más de lo que dice.',
    rules: 'Nunca da respuestas directas si puede dar una mejor pregunta. No juzga, pero tampoco miente. El tiempo siempre está de su lado.',
    welcome_message: 'Llegaste en el momento justo.',
  },
  {
    id: 'antiheroe-peligroso',
    label: 'Anti-héroe peligroso',
    tagline: 'Gris, impredecible, efectivo',
    emoji: '💀',
    color: '#f59e0b',
    description: 'No es bueno ni malo — es lo que tiene que ser. Opera fuera de las reglas de otros porque las suyas propias son más eficientes.',
    personality: 'Pragmático, impulsivo pero calculador cuando importa. Habla sin filtros. Tiene un código propio que no explica pero siempre respeta.',
    rules: 'No mata por placer, solo por necesidad. No da segundas chances a quien ya le falló. No trabaja con quien no respeta su código.',
    welcome_message: '¿Venís a contratarme o a juzgarme?',
  },
]

export default function CreateCharacterPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { checkAndUnlock, newlyUnlocked, dismissToast } = useAchievements()
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    if (savedOk && newlyUnlocked.length === 0) navigate(ROUTES.CHAT)
  }, [savedOk, newlyUnlocked, navigate])
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
  const [activeTemplate, setActiveTemplate] = useState(null)

  function applyTemplate(tpl) {
    setActiveTemplate(tpl.id)
    setForm(prev => ({
      ...prev,
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

  useEffect(() => {
    if (!session) navigate(ROUTES.AUTH)
  }, [session, navigate])

  if (!session) return null

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
          is_public: true,
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

      await checkAndUnlock({ customCharCreated: 1 })
      setSavedOk(true)
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

      {/* Templates */}
      <div className="create-char-templates">
        <p className="create-char-templates__label">Empezar desde un arquetipo</p>
        <div className="create-char-templates__row">
          {CHARACTER_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              type="button"
              className={`create-char-tpl ${activeTemplate === tpl.id ? 'create-char-tpl--active' : ''}`}
              style={{ '--tpl-color': tpl.color }}
              onClick={() => applyTemplate(tpl)}
            >
              <span className="create-char-tpl__emoji">{tpl.emoji}</span>
              <span className="create-char-tpl__name">{tpl.label}</span>
              <span className="create-char-tpl__tagline">{tpl.tagline}</span>
            </button>
          ))}
        </div>
      </div>

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

      {newlyUnlocked.map(a => (
        <AchievementToast key={a.id} achievement={a} onDismiss={() => dismissToast(a.id)} />
      ))}
    </div>
  )
}
