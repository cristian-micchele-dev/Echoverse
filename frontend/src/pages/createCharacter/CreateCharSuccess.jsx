import AchievementToast from '../../components/AchievementToast/AchievementToast'
import { ROUTES } from '../../utils/constants'

export default function CreateCharSuccess({ form, imagePreview, createdId, navigate, newlyUnlocked, dismissToast }) {
  return (
    <div className="create-char-page create-char-page--success">
      {newlyUnlocked.length > 0 && (
        <AchievementToast
          achievement={newlyUnlocked[0]}
          onDismiss={() => dismissToast(newlyUnlocked[0].id)}
        />
      )}
      <div className="create-char-success">
        <div className="create-char-success__avatar" style={{ '--char-color': form.color, borderColor: form.color }}>
          {imagePreview
            ? <img src={imagePreview} alt={form.name} />
            : <span>{form.emoji}</span>
          }
        </div>
        <div className="create-char-success__check">✓</div>
        <h2 className="create-char-success__name">{form.name} está listo</h2>
        <p className="create-char-success__desc">{form.description}</p>
        <div className="create-char-success__actions">
          <button
            className="create-char-success__cta"
            style={{ background: form.color }}
            onClick={() => navigate(ROUTES.CHAT_CHARACTER(createdId))}
          >
            Chatear ahora →
          </button>
          <button
            className="create-char-success__later"
            onClick={() => navigate(ROUTES.CHAT)}
          >
            Ver más tarde
          </button>
        </div>
      </div>
    </div>
  )
}
