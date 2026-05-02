import { QUICK_PROVOCATIONS } from './constants.js'

export default function CenaMesa({
  visible,
  selected,
  messages,
  input,
  isLoading,
  streamingChar,
  currentTema,
  tema,
  onSend,
  onTriggerEvento,
  onInputChange,
  onKeyDown,
  onBack,
  bottomRef,
  inputRef,
  generateScene,
}) {
  return (
    <div className={`cena-page cena-page--mesa ${visible ? 'cena-page--visible' : ''}`}>

      <header className="cena-mesa-header">
        <button className="cena-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="cena-asientos">
          {selected.map(char => (
            <div
              key={char.id}
              className={`cena-asiento ${streamingChar?.id === char.id ? 'cena-asiento--typing' : ''}`}
              style={{ '--char-color': char.themeColor }}
            >
              <div className="cena-asiento__img-wrap">
                <img src={char.image} alt={char.name} onError={e => e.target.style.display='none'} />
              </div>
              <span className="cena-asiento__name">{char.name.split(' ')[0]}</span>
              {streamingChar?.id === char.id && (
                <span className="cena-asiento__typing-dots"><span/><span/><span/></span>
              )}
            </div>
          ))}
        </div>

        <button
          className="cena-evento-btn"
          onClick={onTriggerEvento}
          disabled={isLoading}
          title="Provocar evento"
        >
          🎲
        </button>
      </header>

      <div className="cena-messages">
        {messages.length === 0 && (
          <div className="cena-empty">
            <div className="cena-empty__avatars">
              {selected.map(char => (
                <img
                  key={char.id}
                  src={char.image}
                  alt={char.name}
                  style={{ borderColor: char.themeColor }}
                  onError={e => e.target.style.display='none'}
                />
              ))}
            </div>
            <p>La mesa está lista.<br />Dirigite a alguien o lanzá un tema.</p>
            {tema !== 'libre' && (
              <span className="cena-empty__tema">
                {currentTema.label}
              </span>
            )}
            <p className="cena-empty__hint">
              Usá <strong>@Nombre</strong> para hablarle a uno solo · 🎲 para provocar un evento
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isSceneStart = i > 0 && (msg.role === 'user' || msg.role === 'evento')

          if (msg.role === 'evento') {
            return (
              <div key={i} className={`cena-evento-msg${isSceneStart ? ' cena-scene-start' : ''}`}>
                <span className="cena-evento-msg__bar" />
                <p>{msg.content}</p>
                <span className="cena-evento-msg__bar" />
              </div>
            )
          }

          if (msg.role === 'user') {
            return (
              <div key={i} className={`cena-msg cena-msg--user${isSceneStart ? ' cena-scene-start' : ''}`}>
                <div className="cena-msg__bubble cena-msg__bubble--user">
                  <p>{msg.content}</p>
                </div>
              </div>
            )
          }

          if (msg.role === 'reaction') {
            return (
              <div key={i} className="cena-reaction">
                <div className="cena-reaction__avatar" style={{ '--char-color': msg.char.themeColor }}>
                  {msg.char.image && (
                    <img src={msg.char.image} alt={msg.char.name} onError={e => e.target.style.display='none'} />
                  )}
                </div>
                <p className="cena-reaction__text">({msg.content})</p>
              </div>
            )
          }

          return (
            <div key={i} className="cena-msg cena-msg--char">
              <div className="cena-msg__avatar" style={{ '--char-color': msg.char.themeColor }}>
                {msg.char.image && (
                  <img src={msg.char.image} alt={msg.char.name} onError={e => e.target.style.display='none'} />
                )}
              </div>
              <div className="cena-msg__body">
                <span className="cena-msg__name" style={{ color: msg.char.themeColor }}>
                  {msg.char.name}
                </span>
                <div className="cena-msg__bubble" style={{ '--char-color': msg.char.themeColor }}>
                  <p>{msg.content}</p>
                </div>
              </div>
            </div>
          )
        })}

        {isLoading && !streamingChar && (
          <div className="cena-generating">
            {selected.map((char, i) => (
              <div
                key={char.id}
                className="cena-generating__avatar"
                style={{ '--char-color': char.themeColor, animationDelay: `${i * 0.15}s` }}
              >
                <img src={char.image} alt={char.name} onError={e => e.target.style.display='none'} />
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="cena-input-area">
        <div className="cena-provocations">
          {QUICK_PROVOCATIONS.map((p, i) => (
            <button
              key={i}
              className="cena-provocation-chip"
              onClick={() => generateScene(p, false)}
              disabled={isLoading}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="cena-input-row">
          <textarea
            ref={inputRef}
            className="cena-input"
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder="Lanzá un tema… o @Nombre para hablarle a uno solo"
            rows={1}
            disabled={isLoading}
          />
          <button
            className="cena-send-btn"
            onClick={onSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading
              ? <span className="cena-send-loading" />
              : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 9h14M9.5 3L16 9l-6.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            }
          </button>
        </div>
      </div>
    </div>
  )
}
