import { ROUTES } from '../../utils/constants'

export default function RoomChatInputBar({
  inputRef, user, input, onChange, onSend,
  sending, isAiResponding, sendError,
  characterName, myUsername,
  onShowEventPicker, onShowPollCreator,
  navigate,
}) {
  if (!user) {
    return (
      <div className="rchat-input-bar">
        <div className="rchat-guest-bar">
          <p className="rchat-guest-bar__text">
            Solo podés leer. Para participar,{' '}
            <button className="rchat-guest-bar__link" onClick={() => navigate(ROUTES.AUTH)}>
              registrate o iniciá sesión
            </button>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rchat-input-bar">
      <form className="rchat-input-form" onSubmit={onSend}>
        {sendError && (
          <p className="rchat-send-error">
            {sendError}{' '}
            {(sendError.includes('sesión') || sendError.includes('registr')) && (
              <button className="rchat-send-error__link" onClick={() => navigate(ROUTES.AUTH)}>
                Ir al login
              </button>
            )}
          </p>
        )}
        <div className="rchat-input-row">
          <button
            type="button"
            className="rchat-action-btn"
            onClick={onShowEventPicker}
            title="Disparar evento dramático"
            disabled={sending || isAiResponding}
          >
            ⚡
          </button>
          <button
            type="button"
            className="rchat-action-btn"
            onClick={onShowPollCreator}
            title="Crear votación grupal"
            disabled={sending || isAiResponding}
          >
            📊
          </button>
          <input
            ref={inputRef}
            className="rchat-input"
            placeholder={`Escribile a ${characterName}...`}
            value={input}
            onChange={onChange}
            disabled={sending}
            maxLength={500}
            autoComplete="off"
          />
          <button
            type="submit"
            className="rchat-send-btn"
            disabled={!input.trim() || sending}
            aria-label="Enviar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {myUsername && (
          <p className="rchat-typing-as">
            Chateando como <strong>{myUsername}</strong>
          </p>
        )}
      </form>
    </div>
  )
}
