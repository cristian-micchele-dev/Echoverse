export default function ChatInputArea({ inputRef, input, onChange, onKeyDown, onSend, isLoading, characterName }) {
  return (
    <div className="input-area">
      <textarea
        ref={inputRef}
        className="message-input"
        value={input}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={`Escribile a ${characterName}...`}
        rows={1}
        disabled={isLoading}
      />
      <button
        className="send-btn"
        onClick={onSend}
        disabled={!input.trim() || isLoading}
        aria-label="Enviar mensaje"
      >
        {isLoading
          ? <span className="send-btn__loading" />
          : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9h14M9.5 3L16 9l-6.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        }
      </button>
    </div>
  )
}
