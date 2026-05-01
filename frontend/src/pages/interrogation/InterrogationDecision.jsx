import { TONE_LABELS } from './constants.js'

export default function InterrogationDecision({
  selectedChar,
  exchanges,
  flagged,
  notes,
  isLoading,
  onSubmitVerdict,
  onBack,
}) {
  const charColor = selectedChar?.themeColor ?? '#fff'
  const questionCount = exchanges.length
  const toneStats = exchanges.reduce((acc, ex) => {
    if (ex.emotionalTone) acc[ex.emotionalTone] = (acc[ex.emotionalTone] || 0) + 1
    return acc
  }, {})

  return (
    <div className="ip ip--decision" style={{ '--cc': charColor }}>
      <div className="ip-bg ip-bg--dark" aria-hidden="true">
        <div className="ip-bg__spotlight ip-bg__spotlight--1" />
        <div className="ip-bg__spotlight ip-bg__spotlight--2" />
        <div className="ip-bg__vignette" />
      </div>

      <div className="ip-decision">
        <div className="ip-decision__char">
          <div className="ip-decision__char-img" style={{ '--cc': charColor }}>
            <img src={selectedChar?.image} alt={selectedChar?.name} loading="lazy" decoding="async" />
          </div>
          <h2 className="ip-decision__char-name">{selectedChar?.name}</h2>
        </div>

        <h1 className="ip-decision__title">¿Cuál es tu veredicto?</h1>
        <p className="ip-decision__subtitle">
          Basado en {questionCount} pregunta{questionCount !== 1 ? 's' : ''} — confía en tu instinto.
        </p>

        {Object.keys(toneStats).length > 0 && (
          <div className="ip-decision__stats">
            <p className="ip-decision__stats-label">Señales detectadas:</p>
            <div className="ip-decision__tone-list">
              {Object.entries(toneStats).map(([tone, count]) => (
                <span
                  key={tone}
                  className="ip-tone-stat"
                  style={{ '--tc': TONE_LABELS[tone]?.color ?? '#aaa' }}
                >
                  {TONE_LABELS[tone]?.label ?? tone} ×{count}
                </span>
              ))}
            </div>
          </div>
        )}

        {flagged.size > 0 && (
          <div className="ip-decision__flagged">
            <p className="ip-decision__flagged-label">⚑ Respuestas marcadas como sospechosas:</p>
            {exchanges.filter((_, i) => flagged.has(i)).map((ex, i) => (
              <div key={i} className="ip-decision__flag-item">
                <p className="ip-decision__flag-q">"{ex.question}"</p>
                <p className="ip-decision__flag-a">{ex.response}</p>
              </div>
            ))}
          </div>
        )}

        {notes.trim() && (
          <div className="ip-decision__notes">
            <p className="ip-decision__notes-label">Tus notas:</p>
            <p className="ip-decision__notes-text">{notes}</p>
          </div>
        )}

        <div className="ip-decision__btns">
          <button
            className="ip-verdict-btn ip-verdict-btn--lie"
            onClick={() => onSubmitVerdict('lying')}
            disabled={isLoading}
          >
            <span className="ip-verdict-btn__icon">⚡</span>
            <span className="ip-verdict-btn__label">Está mintiendo</span>
            <span className="ip-verdict-btn__sub">Ocultó la verdad</span>
          </button>
          <button
            className="ip-verdict-btn ip-verdict-btn--truth"
            onClick={() => onSubmitVerdict('truth')}
            disabled={isLoading}
          >
            <span className="ip-verdict-btn__icon">✓</span>
            <span className="ip-verdict-btn__label">Dice la verdad</span>
            <span className="ip-verdict-btn__sub">Es inocente</span>
          </button>
        </div>

        <button className="ip-back ip-back--decision" onClick={onBack}>
          ← Volver al interrogatorio
        </button>

        {isLoading && <p className="ip-loading-msg">Procesando veredicto...</p>}
      </div>
    </div>
  )
}
