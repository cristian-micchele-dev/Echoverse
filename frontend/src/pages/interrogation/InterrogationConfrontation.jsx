import { TONE_LABELS } from './constants.js'

export default function InterrogationConfrontation({
  selectedChar,
  selectedScenario,
  confrontationResponse,
  selectedConfrontation,
  confrontationTone,
  isLoading,
  onSubmitConfrontation,
  onBack,
  onVerdict,
}) {
  const charColor = selectedChar?.themeColor ?? '#fff'

  return (
    <div className="ip ip--confrontation" style={{ '--cc': charColor }}>
      <div className="ip-bg ip-bg--dark" aria-hidden="true">
        <div className="ip-bg__spotlight ip-bg__spotlight--1" />
        <div className="ip-bg__spotlight ip-bg__spotlight--2" />
        <div className="ip-bg__vignette" />
      </div>

      <div className="ip-confrontation">
        <div className="ip-confrontation__char">
          <div className="ip-confrontation__char-img" style={{ '--cc': charColor }}>
            <img src={selectedChar?.image} alt={selectedChar?.name} loading="lazy" decoding="async" />
          </div>
        </div>

        {!confrontationResponse ? (
          <>
            <div className="ip-confrontation__header">
              <span className="ip-confrontation__eyebrow">Confrontación final</span>
              <h2 className="ip-confrontation__title">Poné las cartas sobre la mesa</h2>
              <p className="ip-confrontation__sub">Una sola acusación. No hay vuelta atrás.</p>
            </div>

            <div className="ip-confrontation__options">
              {(selectedScenario?.confrontations ?? []).map((text, i) => (
                <button
                  key={i}
                  className="ip-confrontation__option"
                  style={{ '--cc': charColor }}
                  onClick={() => onSubmitConfrontation(text)}
                  disabled={isLoading}
                >
                  <span className="ip-confrontation__option-num">{i + 1}</span>
                  <span className="ip-confrontation__option-text">{text}</span>
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="ip-confrontation__loading">
                <div className="ip-typing"><span /><span /><span /></div>
              </div>
            )}

            <button className="ip-back ip-back--decision" onClick={onBack}>
              ← Volver al interrogatorio
            </button>
          </>
        ) : (
          <div className="ip-confrontation__response">
            <div className="ip-confrontation__response-header">
              <span className="ip-confrontation__response-label">{selectedChar?.name} responde:</span>
              {confrontationTone && (
                <span
                  className="ip-tone-badge"
                  style={{ '--tc': TONE_LABELS[confrontationTone]?.color ?? '#aaa' }}
                >
                  {TONE_LABELS[confrontationTone]?.label ?? confrontationTone}
                </span>
              )}
            </div>
            <div className="ip-confrontation__accusation">
              <span className="ip-confrontation__accusation-label">Tu acusación</span>
              <p className="ip-confrontation__accusation-text">"{selectedConfrontation}"</p>
            </div>
            <div className="ip-confrontation__reply">
              <p className="ip-confrontation__reply-text">{confrontationResponse}</p>
            </div>
            <button
              className="ip-decide-btn"
              style={{ '--cc': charColor }}
              onClick={onVerdict}
            >
              Dar mi veredicto →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
