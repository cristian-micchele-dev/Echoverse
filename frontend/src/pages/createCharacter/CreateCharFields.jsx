export default function CreateCharFields({ form, onChange }) {
  return (
    <>
      <div className="create-char-field">
        <div className="create-char-label-row">
          <label className="create-char-label">
            Nombre <span className="create-char-required">*</span>
          </label>
          <span className={`create-char-count ${form.name.length >= 54 ? 'create-char-count--warn' : ''}`}>
            {form.name.length}/60
          </span>
        </div>
        <input
          className="create-char-input"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Detective Noir"
          maxLength={60}
          required
        />
      </div>

      <div className="create-char-field">
        <div className="create-char-label-row">
          <label className="create-char-label">
            Descripción <span className="create-char-required">*</span>
          </label>
          <span className={`create-char-count ${form.description.length >= 540 ? 'create-char-count--warn' : ''}`}>
            {form.description.length}/600
          </span>
        </div>
        <textarea
          className="create-char-textarea"
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Un detective cínico de los años 40 que resuelve casos imposibles"
          rows={3}
          maxLength={600}
          required
        />
      </div>

      <div className="create-char-field">
        <div className="create-char-label-row">
          <label className="create-char-label">
            Personalidad <span className="create-char-required">*</span>
          </label>
          <span className={`create-char-count ${form.personality.length >= 360 ? 'create-char-count--warn' : ''}`}>
            {form.personality.length}/400
          </span>
        </div>
        <textarea
          className="create-char-textarea"
          name="personality"
          value={form.personality}
          onChange={onChange}
          placeholder="Lacónico, sarcástico, habla en metáforas, nunca muestra emociones"
          rows={3}
          maxLength={400}
          required
        />
      </div>

      <div className="create-char-field">
        <div className="create-char-label-row">
          <label className="create-char-label">
            Reglas <span className="create-char-optional">(opcional)</span>
          </label>
          <span className={`create-char-count ${form.rules.length >= 270 ? 'create-char-count--warn' : ''}`}>
            {form.rules.length}/300
          </span>
        </div>
        <textarea
          className="create-char-textarea"
          name="rules"
          value={form.rules}
          onChange={onChange}
          placeholder="Nunca pide ayuda. Nunca admite que no sabe algo."
          rows={2}
          maxLength={300}
        />
      </div>

      <div className="create-char-field">
        <div className="create-char-label-row">
          <label className="create-char-label">
            Mensaje de bienvenida <span className="create-char-optional">(opcional)</span>
          </label>
          <span className={`create-char-count ${form.welcome_message.length >= 270 ? 'create-char-count--warn' : ''}`}>
            {form.welcome_message.length}/300
          </span>
        </div>
        <textarea
          className="create-char-textarea"
          name="welcome_message"
          value={form.welcome_message}
          onChange={onChange}
          placeholder="¿Qué querés?"
          rows={2}
          maxLength={300}
        />
      </div>
    </>
  )
}
