export default function ChatEmpty({ character, emptyImgError, onEmptyImgError, onSelectQuestion }) {
  return (
    <div className="empty-chat">
      <div className="empty-chat__avatar">
        {character.image && !emptyImgError
          ? <img src={character.image} alt={character.name} onError={onEmptyImgError} />
          : <span>{character.emoji}</span>
        }
      </div>
      <p className="empty-chat__name">{character.name}</p>
      {character.welcomeMessage && (
        <div className="empty-chat__welcome">
          <p>{character.welcomeMessage}</p>
        </div>
      )}
      {character.suggestedQuestions?.length > 0 && (
        <div className="suggested-questions">
          {character.suggestedQuestions.map((q, i) => (
            <button
              key={i}
              className="suggested-q"
              style={{ '--sq-i': i }}
              onClick={() => onSelectQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
