export default function StreamingBubble({ content, charName, charColor }) {
  return (
    <div className="rchat-bubble-row rchat-bubble-row--ai">
      <span className="rchat-bubble-sender" style={{ color: charColor }}>{charName}</span>
      <div className="rchat-bubble rchat-bubble--ai rchat-bubble--streaming">
        {content}
        <span className="rchat-cursor" aria-hidden="true" />
      </div>
    </div>
  )
}
