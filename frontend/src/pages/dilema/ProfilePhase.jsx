import { characterMap } from '../../data/characters'
import { PROFILE_RECS } from './constants.js'

export default function ProfilePhase({ profile, character, choices, narrativeState, visible, onRestart, onHome }) {
  const bondLabel = narrativeState.bondScore >= 15
    ? 'Vínculo fuerte'
    : narrativeState.bondScore >= 1
    ? 'Vínculo distante'
    : narrativeState.bondScore === 0
    ? 'Vínculo neutro'
    : 'Vínculo roto'

  const guiltLabel = narrativeState.guiltLoad >= 60
    ? 'Culpa profunda'
    : narrativeState.guiltLoad >= 30
    ? 'Culpa latente'
    : 'Culpa leve'

  const recIds = PROFILE_RECS[profile.id] || []
  const recs = recIds.map(id => characterMap[id]).filter(Boolean)

  return (
    <div className={`dilema-phase dilema-profile ${visible ? 'dilema-profile--visible' : ''}`}>

      <div className="dilema-profile__top">
        <img
          src={character.image}
          alt={character.name}
          className="dilema-profile__char-img"
          onError={e => { e.currentTarget.style.opacity = '0' }}
        />
        <div className="dilema-profile__header">
          <span className="dilema-eyebrow">Tu perfil moral</span>
          <h2 className="dilema-profile__label">{profile.label}</h2>
        </div>
      </div>

      <p className="dilema-profile__description">{profile.description}</p>

      <div className="dilema-profile__stats">
        <div className="dilema-profile__stat">
          <span className="dilema-profile__stat-label">Vínculo con {character.name}</span>
          <span className={`dilema-profile__stat-value ${narrativeState.bondScore < 0 ? 'neg' : ''}`}>{bondLabel}</span>
        </div>
        <div className="dilema-profile__stat">
          <span className="dilema-profile__stat-label">Peso acumulado</span>
          <span className="dilema-profile__stat-value">{guiltLabel}</span>
        </div>
      </div>

      <div className="dilema-profile__choices">
        <span className="dilema-eyebrow" style={{ marginBottom: '0.75rem', display: 'block' }}>Tus decisiones</span>
        {choices.map((c, i) => (
          <div key={i} className="dilema-profile__choice-row">
            <span className="dilema-profile__choice-key">{String.fromCharCode(65 + i)}</span>
            <span className="dilema-profile__choice-text">{c.label}</span>
          </div>
        ))}
      </div>

      {recs.length > 0 && (
        <div className="dilema-recs">
          <span className="dilema-eyebrow">Con este perfil, estos personajes te van a desafiar</span>
          <div className="dilema-recs__grid">
            {recs.map(char => (
              <div key={char.id} className="dilema-rec-card" style={{ '--char-color': char.themeColor }}>
                {char.image && <img src={char.image} alt={char.name} className="dilema-rec-card__img" />}
                <span className="dilema-rec-card__name">{char.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dilema-profile__ctas">
        <button className="dilema-btn-primary" onClick={onRestart}>
          ¿Y si hubieras elegido diferente?
        </button>
        <button className="dilema-btn-ghost" onClick={onHome}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
