import { TONE_LABELS, MAX_QUESTIONS, MIN_QUESTIONS } from './constants.js'

export default function InterrogationChat({
  selectedChar,
  selectedScenario,
  openingStatement,
  exchanges,
  inputValue,
  setInputValue,
  isLoading,
  pressureLevel,
  flagged,
  notes,
  setNotes,
  notesOpen,
  setNotesOpen,
  usedSuggestions,
  chatEndRef,
  inputRef,
  onAskQuestion,
  onSendSuggestion,
  onToggleFlag,
  onDecide,
  onAbandon,
}) {
  const questionCount = exchanges.length
  const canDecide = questionCount >= MIN_QUESTIONS
  const isMaxed = questionCount >= MAX_QUESTIONS
  const charColor = selectedChar?.themeColor ?? '#fff'

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onAskQuestion()
    }
  }

  return (
    <div className="ip ip--interrogation" style={{ '--cc': charColor }}>
      <div className="ip-bg ip-bg--dark" aria-hidden="true">
        <div className="ip-bg__spotlight ip-bg__spotlight--1" />
        <div className="ip-bg__spotlight ip-bg__spotlight--2" />
        <div className="ip-bg__char-glow" />
        {selectedChar?.image && (
          <div className="ip-bg__ghost">
            <img src={selectedChar.image} alt="" loading="lazy" decoding="async" />
          </div>
        )}
        <div className="ip-bg__scanlines" />
        <div className="ip-bg__vignette" />
      </div>

      <header className="ip-intr-header">
        <button className="ip-back" onClick={onAbandon}>← Salir</button>
        <div className="ip-intr-header__char">
          <div className="ip-intr-header__img" style={{ '--cc': charColor }}>
            <img src={selectedChar?.image} alt={selectedChar?.name} loading="lazy" decoding="async" />
          </div>
          <div className="ip-intr-header__info">
            <span className="ip-intr-header__name">{selectedChar?.name}</span>
            <span className="ip-intr-header__status">En interrogatorio</span>
          </div>
        </div>
        <div className="ip-intr-header__counter">
          <span className="ip-intr-header__q-num">{questionCount}</span>
          <span className="ip-intr-header__q-max">/{MAX_QUESTIONS}</span>
          <span className="ip-intr-header__q-label">preguntas</span>
        </div>
      </header>

      <div className="ip-pressure-bar">
        <span className="ip-pressure-bar__label">Presión</span>
        <div className="ip-pressure-bar__track">
          <div className="ip-pressure-bar__fill" style={{ width: `${pressureLevel}%` }} />
        </div>
        <span className="ip-pressure-bar__pct">{pressureLevel}%</span>
      </div>

      <div className="ip-scenario-banner">
        <span className="ip-scenario-banner__label">Situación:</span>
        <span className="ip-scenario-banner__text">{selectedScenario?.text}</span>
      </div>

      <div className="ip-chat">
        {openingStatement && (
          <div className="ip-bubble ip-bubble--char ip-bubble--opening">
            <div className="ip-bubble__avatar" style={{ '--cc': charColor }}>
              <img src={selectedChar?.image} alt={selectedChar?.name} loading="lazy" decoding="async" />
            </div>
            <div className="ip-bubble__body">
              <span className="ip-bubble__name">{selectedChar?.name}</span>
              <p className="ip-bubble__text">{openingStatement}</p>
            </div>
          </div>
        )}

        {exchanges.map((ex, i) => (
          <div key={i} className="ip-exchange">
            <div className="ip-bubble ip-bubble--user">
              <div className="ip-bubble__body">
                <span className="ip-bubble__name">Interrogador</span>
                <p className="ip-bubble__text">{ex.question}</p>
              </div>
            </div>

            {ex.response ? (
              <div className="ip-bubble ip-bubble--char">
                <div className="ip-bubble__avatar" style={{ '--cc': charColor }}>
                  <img src={selectedChar?.image} alt={selectedChar?.name} loading="lazy" decoding="async" />
                </div>
                <div className="ip-bubble__body">
                  <div className="ip-bubble__meta">
                    <span className="ip-bubble__name">{selectedChar?.name}</span>
                    {ex.emotionalTone && (
                      <span
                        className="ip-tone-badge"
                        style={{ '--tc': TONE_LABELS[ex.emotionalTone]?.color ?? '#aaa' }}
                      >
                        {TONE_LABELS[ex.emotionalTone]?.label ?? ex.emotionalTone}
                      </span>
                    )}
                    <button
                      className={`ip-flag-btn ${flagged.has(i) ? 'ip-flag-btn--active' : ''}`}
                      onClick={() => onToggleFlag(i)}
                      title={flagged.has(i) ? 'Quitar marca' : 'Marcar como sospechoso'}
                    >
                      {flagged.has(i) ? '⚑' : '⚐'}
                    </button>
                  </div>
                  <p className="ip-bubble__text">{ex.response}</p>
                </div>
              </div>
            ) : (
              <div className="ip-bubble ip-bubble--char ip-bubble--loading">
                <div className="ip-bubble__avatar" style={{ '--cc': charColor }}>
                  <img src={selectedChar?.image} alt={selectedChar?.name} loading="lazy" decoding="async" />
                </div>
                <div className="ip-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="ip-input-area">
        {isMaxed ? (
          <p className="ip-input-maxed">Alcanzaste el límite de preguntas. Es hora de confrontar.</p>
        ) : (
          <>
            {selectedScenario?.suggestedQuestions && (
              <div className="ip-suggestions">
                {selectedScenario.suggestedQuestions
                  .filter(q => !usedSuggestions.has(q))
                  .map((q, i) => (
                    <button
                      key={i}
                      className="ip-suggestion-chip"
                      onClick={() => onSendSuggestion(q)}
                      disabled={isLoading}
                    >
                      {q}
                    </button>
                  ))
                }
              </div>
            )}
            <div className="ip-input-wrap">
              <textarea
                ref={inputRef}
                className="ip-input"
                placeholder="Hacé tu pregunta..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={isLoading}
              />
              <button
                className="ip-send-btn"
                onClick={onAskQuestion}
                disabled={!inputValue.trim() || isLoading}
                style={{ '--cc': charColor }}
              >
                ↑
              </button>
            </div>
          </>
        )}

        <div className="ip-notes-wrap">
          <button
            className={`ip-notes-toggle ${notesOpen ? 'ip-notes-toggle--open' : ''}`}
            onClick={() => setNotesOpen(o => !o)}
          >
            <span>📝 Notas</span>
            {flagged.size > 0 && <span className="ip-notes-toggle__count">{flagged.size} marcadas</span>}
            <span className="ip-notes-toggle__arrow">{notesOpen ? '▲' : '▼'}</span>
          </button>
          {notesOpen && (
            <textarea
              className="ip-notes-textarea"
              placeholder="Anotá tus sospechas, contradicciones detectadas..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          )}
        </div>

        {canDecide && (
          <button
            className="ip-decide-btn"
            onClick={onDecide}
            style={{ '--cc': charColor }}
          >
            Confrontar →
          </button>
        )}
      </div>
    </div>
  )
}
