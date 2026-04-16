import { useNavigate } from 'react-router-dom'
import { characters } from '../../data/characters'
import './OnboardingModal.css'

const MODES = [
  {
    icon: '💬',
    label: 'Chat con Personaje',
    desc: 'Hablá directamente con cualquiera de los 52 personajes. Sin guión, en tiempo real.',
    route: '/chat',
    accent: '#70a8e0',
    characterId: 'sherlock',
    badge: 'Popular',
  },
  {
    icon: '🎯',
    label: 'Modo Misión',
    desc: 'Tomá decisiones dentro de una historia interactiva. Cada elección tiene consecuencias.',
    route: '/mission',
    accent: '#D4576B',
    characterId: 'el-profesor',
    badge: 'Historia',
  },
  {
    icon: '🧩',
    label: 'Adivina el Personaje',
    desc: 'Pistas de a una, puntaje que baja. ¿Cuánto los conocés realmente?',
    route: '/guess',
    accent: '#7aab6e',
    characterId: 'gollum',
    badge: 'Trivia',
  },
]

export default function OnboardingModal({ onClose }) {
  const navigate = useNavigate()

  function handleSelect(route) {
    localStorage.setItem('echoverse-visited', '1')
    onClose()
    navigate(route)
  }

  function handleDismiss() {
    localStorage.setItem('echoverse-visited', '1')
    onClose()
  }

  return (
    <div className="onb-backdrop" onClick={handleDismiss}>
      <div className="onb-modal" onClick={e => e.stopPropagation()}>
        <div className="onb-header">
          <span className="onb-eyebrow">BIENVENIDO A ECHOVERSE</span>
          <h2 className="onb-title">¿Por dónde<em> empezás?</em></h2>
          <p className="onb-sub">Elegí un modo para comenzar. Podés explorar el resto desde el menú.</p>
        </div>

        <div className="onb-modes">
          {MODES.map(mode => {
            const char = characters.find(c => c.id === mode.characterId)
            return (
              <button
                key={mode.route}
                className="onb-mode"
                style={{ '--accent': mode.accent }}
                onClick={() => handleSelect(mode.route)}
              >
                {char && (
                  <div className="onb-mode__img-wrap">
                    <img src={char.image} alt={char.name} className="onb-mode__img" />
                    <div className="onb-mode__img-fade" />
                  </div>
                )}
                <div className="onb-mode__body">
                  <div className="onb-mode__top">
                    <span className="onb-mode__icon">{mode.icon}</span>
                    <span className="onb-mode__badge">{mode.badge}</span>
                  </div>
                  <span className="onb-mode__label">{mode.label}</span>
                  <p className="onb-mode__desc">{mode.desc}</p>
                  <span className="onb-mode__cta">Empezar →</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="onb-footer">
          <button className="onb-skip" onClick={handleDismiss}>
            Explorar primero
          </button>
        </div>
      </div>
    </div>
  )
}
