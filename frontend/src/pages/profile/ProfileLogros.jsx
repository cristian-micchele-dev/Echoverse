import { ACHIEVEMENTS } from '../../data/achievements'

export default function ProfileLogros({ unlockedIds, nextAchievement }) {
  return (
    <section className="pp-section">
      <div className="pp-section__header">
        <span className="pp-section__eyebrow">PROGRESIÓN</span>
        <h2 className="pp-section__title">Logros</h2>
      </div>

      {nextAchievement && (
        <div className="pp-next-achievement">
          <span className="pp-next-achievement__icon">{nextAchievement.emoji}</span>
          <div className="pp-next-achievement__info">
            <span className="pp-next-achievement__label">Próximo logro</span>
            <span className="pp-next-achievement__name">{nextAchievement.name}</span>
            <p className="pp-next-achievement__desc">{nextAchievement.desc}</p>
          </div>
        </div>
      )}

      <div className="pp-achievements">
        {ACHIEVEMENTS.map(a => {
          const unlocked = unlockedIds.has(a.id)
          return (
            <div
              key={a.id}
              className={`pp-badge ${unlocked ? 'pp-badge--unlocked' : 'pp-badge--locked'}`}
              data-tooltip={!unlocked ? a.desc : undefined}
            >
              <span className="pp-badge__emoji">{unlocked ? a.emoji : '🔒'}</span>
              <span className="pp-badge__name">{a.name}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
