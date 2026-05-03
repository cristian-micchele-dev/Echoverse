import { characterMap } from '../../data/characters'
import { ROUTES } from '../../utils/constants'
import { timeAgo } from '../../utils/session'

export default function ProfileInterrogations({ interrogationResults, navigate }) {
  return (
    <section className="pp-section">
      <div className="pp-section__header">
        <span className="pp-section__eyebrow">HISTORIAL</span>
        <h2 className="pp-section__title">Interrogatorios</h2>
      </div>

      {interrogationResults.length > 0 ? (
        <div className="pp-intr-list">
          {interrogationResults.slice(0, 5).map(r => {
            const char = characterMap[r.character_id]
            return (
              <div key={r.id} className={`pp-intr-row ${r.correct ? 'pp-intr-row--correct' : 'pp-intr-row--wrong'}`}>
                <span className="pp-intr-row__verdict">{r.correct ? '✓' : '✗'}</span>
                {char && <img className="pp-intr-row__avatar" src={char.image} alt={char.name} loading="lazy" decoding="async" />}
                <div className="pp-intr-row__body">
                  <span className="pp-intr-row__char">{char?.name ?? r.character_id}</span>
                  <span className="pp-intr-row__rank">{r.rank}</span>
                </div>
                <span className="pp-intr-row__meta">{r.total_questions}P · {timeAgo(new Date(r.played_at).getTime())}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="pp-empty-cta" onClick={() => navigate(ROUTES.INTERROGATION)}>
          <span className="pp-empty-cta__icon">🕵️</span>
          <div>
            <p className="pp-empty-cta__title">Todavía no hiciste ningún interrogatorio</p>
            <p className="pp-empty-cta__sub">Detectá mentiras. Descubrí la verdad →</p>
          </div>
        </div>
      )}
    </section>
  )
}
