import { CHARACTER_TEMPLATES } from './constants.js'

export default function CreateCharTemplates({ activeTemplate, onApplyTemplate }) {
  return (
    <div className="create-char-templates">
      <p className="create-char-templates__label">Empezar desde un arquetipo</p>
      <div className="create-char-templates__row">
        {CHARACTER_TEMPLATES.map(tpl => (
          <button
            key={tpl.id}
            type="button"
            className={`create-char-tpl ${activeTemplate === tpl.id ? 'create-char-tpl--active' : ''}`}
            style={{ '--tpl-color': tpl.color }}
            onClick={() => onApplyTemplate(tpl)}
          >
            <span className="create-char-tpl__emoji">{tpl.emoji}</span>
            <span className="create-char-tpl__name">{tpl.label}</span>
            <span className="create-char-tpl__tagline">{tpl.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
