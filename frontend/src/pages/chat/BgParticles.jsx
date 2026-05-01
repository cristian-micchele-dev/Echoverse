const COUNTS = { stars: 22, rain: 16, particles: 14, embers: 12, lightning: 5, sparks: 14, smoke: 10, snow: 18 }

export default function BgParticles({ effect }) {
  if (!effect || effect === 'none') return null
  const count = COUNTS[effect] || 0
  return (
    <div className={`chat-bg-effect chat-bg-effect--${effect}`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="bg-particle" style={{ '--i': i }} />
      ))}
    </div>
  )
}
