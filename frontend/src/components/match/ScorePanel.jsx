import './ScorePanel.css'

export default function ScorePanel({ round, total }) {
  return (
    <div className="scp">
      <span className="scp__round">
        <span className="scp__round-cur">{round}</span>
        <span className="scp__round-sep">/</span>
        <span className="scp__round-tot">{total}</span>
      </span>
    </div>
  )
}
