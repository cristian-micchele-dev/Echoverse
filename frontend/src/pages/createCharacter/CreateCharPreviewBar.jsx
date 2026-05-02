export default function CreateCharPreviewBar({ form, imagePreview }) {
  return (
    <div className="create-char-preview" style={{ '--char-color': form.color }}>
      <div className="create-char-preview__avatar">
        {imagePreview
          ? <img src={imagePreview} alt="" />
          : <span>{form.emoji}</span>
        }
      </div>
      <div className="create-char-preview__chat">
        <span className="create-char-preview__name">
          {form.name || 'Nombre del personaje'}
        </span>
        <div className="create-char-preview__bubble">
          {form.welcome_message || (form.name ? `Hola, soy ${form.name}.` : 'Vista previa del mensaje de bienvenida')}
        </div>
      </div>
    </div>
  )
}
