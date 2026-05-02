export default function DuoChat({
  charA, charB,
  messages, input, isLoading, typingChar,
  onSend, onInputChange, onKeyDown, onBack,
  bottomRef, inputRef,
}) {
  return (
    <div className="duo-page duo-page--chat">
      <header className="duo-chat-header">
        <button className="duo-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <div className="duo-chat-combatants">
          <div className="duo-chat-char" style={{ '--char-color': charA.themeColor }}>
            <img src={charA.image} alt={charA.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
            <div>
              <span className="duo-chat-char__name">{charA.name}</span>
              {typingChar === 'charA' && <span className="duo-chat-char__typing">escribiendo...</span>}
            </div>
          </div>
          <span className="duo-chat-plus">⇄</span>
          <div className="duo-chat-char" style={{ '--char-color': charB.themeColor }}>
            <img src={charB.image} alt={charB.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
            <div>
              <span className="duo-chat-char__name">{charB.name}</span>
              {typingChar === 'charB' && <span className="duo-chat-char__typing">escribiendo...</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="duo-messages">
        {messages.length === 0 && (
          <div className="duo-empty">
            <div className="duo-empty__avatars">
              <img src={charA.image} alt={charA.name} style={{ borderColor: charA.themeColor }} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
              <img src={charB.image} alt={charB.name} style={{ borderColor: charB.themeColor }} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
            </div>
            <p>Los dos están listos. ¿Qué les querés preguntar?</p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'user') {
            return (
              <div key={i} className="duo-msg duo-msg--user">
                <div className="duo-msg__bubble duo-msg__bubble--user">
                  <p>{msg.content}</p>
                </div>
              </div>
            )
          }
          const isA = msg.role === 'charA'
          return (
            <div key={i} className={`duo-msg ${isA ? 'duo-msg--a' : 'duo-msg--b'} ${msg.isRemate ? 'duo-msg--remate' : ''}`}>
              <div className="duo-msg__avatar" style={{ '--char-color': msg.char.themeColor }}>
                <img src={msg.char.image} alt={msg.char.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
              </div>
              <div className="duo-msg__bubble" style={{ '--char-color': msg.char.themeColor }}>
                {msg.isRemate && <span className="duo-msg__remate-label">↩</span>}
                <p>{msg.content}</p>
              </div>
            </div>
          )
        })}

        {typingChar && (() => {
          const char = typingChar === 'charA' ? charA : charB
          return (
            <div className={`duo-msg ${typingChar === 'charA' ? 'duo-msg--a' : 'duo-msg--b'}`}>
              <div className="duo-msg__avatar" style={{ '--char-color': char.themeColor }}>
                <img src={char.image} alt={char.name} onError={e => e.target.style.display='none'} loading="lazy" decoding="async" />
              </div>
              <div className="duo-msg__bubble duo-msg__bubble--typing" style={{ '--char-color': char.themeColor }}>
                <span /><span /><span />
              </div>
            </div>
          )
        })()}

        <div ref={bottomRef} />
      </div>

      <div className="duo-input-area">
        <textarea
          ref={inputRef}
          className="duo-input"
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder="Provocá, preguntá, desafiá..."
          rows={1}
          disabled={isLoading}
          aria-label="Mensaje para los personajes"
        />
        <button
          className="duo-send-btn"
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          aria-label="Enviar mensaje"
        >
          {isLoading
            ? <span className="duo-send-loading" />
            : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9h14M9.5 3L16 9l-6.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )
          }
        </button>
      </div>
    </div>
  )
}
