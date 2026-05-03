import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'
import { DIM_CONFIG } from './constants.js'
import ParecidoBg from './ParecidoBg.jsx'

export default function ParecidoResult({ bgVisible, topMatches, userProfile, copied, onShare, onRestart }) {
  const navigate = useNavigate()
  const [first, second, third] = topMatches

  return (
    <div className="par-page par-page--result">
      <ParecidoBg visible={bgVisible} />
      <div className="par-result">
        <p className="par-result__eyebrow">Tu perfil revela…</p>

        {first && first.char && (
          <div className="par-match-main" style={{ '--char-color': first.char.themeColor }}>
            <div className="par-match-main__avatar-wrap">
              {first.char.image
                ? <img src={first.char.image} alt={first.char.name} className="par-match-main__avatar" />
                : <span className="par-match-main__emoji">{first.char.emoji}</span>
              }
              <span className="par-match-main__pct">{first.matchPct}%</span>
            </div>
            <h2 className="par-match-main__name">{first.char.name}</h2>
            <p className="par-match-main__universe">{first.char.universe}</p>
            <p className="par-match-main__desc">
              {first.description || ''}
            </p>
            <button
              className="par-chat-btn"
              onClick={() => navigate(ROUTES.CHAT_CHARACTER(first.id))}
              style={{ background: first.char.themeColor }}
            >
              Chatear con {first.char.name}
            </button>
          </div>
        )}

        {userProfile && (
          <div className="par-dims">
            <p className="par-dims__title">Tu perfil en 5 dimensiones</p>
            {DIM_CONFIG.map(({ key, label, lo, hi }) => {
              const pct = Math.round(((userProfile[key] ?? 2.5) - 1) / 3 * 100)
              return (
                <div key={key} className="par-dim">
                  <div className="par-dim__header">
                    <span className="par-dim__label">{label}</span>
                    <span className="par-dim__ends">
                      <span>{lo}</span>
                      <span>{hi}</span>
                    </span>
                  </div>
                  <div className="par-dim__track">
                    <div
                      className="par-dim__fill"
                      style={{ width: `${pct}%`, '--char-color': first?.char?.themeColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {(second || third) && (
          <div className="par-also">
            <p className="par-also__label">También te parecés a…</p>
            <div className="par-also__row">
              {[second, third].filter(Boolean).map(match => match?.char && (
                <button
                  key={match.id}
                  className="par-also-card"
                  style={{ '--char-color': match.char.themeColor }}
                  onClick={() => navigate(ROUTES.CHAT_CHARACTER(match.id))}
                >
                  <div className="par-also-card__avatar-wrap">
                    {match.char.image
                      ? <img src={match.char.image} alt={match.char.name} className="par-also-card__avatar" />
                      : <span className="par-also-card__emoji">{match.char.emoji}</span>
                    }
                  </div>
                  <span className="par-also-card__pct">{match.matchPct}%</span>
                  <span className="par-also-card__name">{match.char.name}</span>
                  <span className="par-also-card__universe">{match.char.universe}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="par-result__actions">
          <button
            className="par-action-btn par-action-btn--share"
            onClick={onShare}
            style={{ '--char-color': first?.char?.themeColor }}
          >
            {copied ? '✓ ¡Copiado!' : '🔗 Compartir resultado'}
          </button>
          <button className="par-action-btn par-action-btn--secondary" onClick={onRestart}>
            Volver a intentar
          </button>
          <button className="par-action-btn par-action-btn--ghost" onClick={() => navigate(ROUTES.HOME)}>
            Inicio
          </button>
        </div>
      </div>
    </div>
  )
}
