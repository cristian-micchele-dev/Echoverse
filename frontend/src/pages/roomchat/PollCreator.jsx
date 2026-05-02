import { useState } from 'react'

export default function PollCreator({ onCreate, onClose }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  function setOption(i, val) {
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o))
  }

  function addOption() {
    if (options.length < 4) setOptions(prev => [...prev, ''])
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validOpts = options.map(o => o.trim()).filter(Boolean)
    if (!question.trim() || validOpts.length < 2) return
    onCreate(question.trim(), validOpts)
    onClose()
  }

  return (
    <div className="rchat-overlay" onClick={onClose}>
      <div className="rchat-poll-creator" onClick={e => e.stopPropagation()}>
        <div className="rchat-poll-creator__header">
          <span>📊 Crear votación</span>
          <button className="rchat-event-picker__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="rchat-poll-creator__form">
          <input
            className="rchat-input"
            placeholder="Pregunta de la votación..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            maxLength={120}
            autoFocus
          />
          <div className="rchat-poll-creator__opts">
            {options.map((opt, i) => (
              <input
                key={i}
                className="rchat-input"
                placeholder={`Opción ${i + 1}...`}
                value={opt}
                onChange={e => setOption(i, e.target.value)}
                maxLength={60}
              />
            ))}
            {options.length < 4 && (
              <button type="button" className="rchat-poll-add-opt" onClick={addOption}>
                + Agregar opción
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary rchat-poll-creator__submit"
            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
          >
            Iniciar votación
          </button>
        </form>
      </div>
    </div>
  )
}
