import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { getMissionProgress } from '../utils/missionProgress'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api'
import './ModeSelectorPage.css'

const MAIN_MODES = [
  {
    id: 'mission',
    image: '/images/modomision.jfif',
    eyebrow: 'Historia Interactiva',
    label: 'Modo Misión',
    desc: 'Una misión real. Cada decisión tiene peso.',
    route: '/mission',
    accent: '#D4576B',
    tag: '4 misiones activas',
    badge: '⭐ Popular',
    difficulty: '🔴 Intenso',
    duration: '~15 min',
  },
  {
    id: 'interrogation',
    image: '/images/interrogatoriojpg.jpg',
    eyebrow: 'Detección de Mentiras',
    label: 'Interrogatorio',
    desc: 'El personaje puede estar mintiendo. Detectá las contradicciones.',
    route: '/interrogation',
    accent: '#6D4AFF',
    tag: 'IA reactiva',
    difficulty: '🟡 Medio',
    duration: '~8 min',
  },
  {
    id: 'dilema',
    characterId: 'gandalf',
    eyebrow: 'Filosofía Interactiva',
    label: 'Dilemas',
    desc: 'Sin salida limpia. Solo la elección que podés defender.',
    route: '/dilema',
    accent: '#C9954A',
    tag: 'Sin respuesta correcta',
    difficulty: '🟡 Medio',
    duration: '~5 min',
  },
  {
    id: 'ultima-cena',
    image: '/images/ultimacena2.jfif',
    eyebrow: 'Multijugador Narrativo',
    label: 'Última Cena',
    desc: 'Elegís 3 o 4 personajes y los sentás a la misma mesa.',
    route: '/ultima-cena',
    accent: '#8B4A2A',
    tag: 'Hasta 4 personajes',
    badge: '✨ Nuevo',
    difficulty: '🟢 Fácil',
    duration: '~10 min',
  },
  {
    id: 'parecido',
    image: '/images/aquientepareces.jfif',
    eyebrow: 'Test de Personalidad',
    label: '¿A qué personaje te parecés?',
    desc: '15 preguntas aleatorias. 52 personajes. Tu perfil al descubierto.',
    route: '/parecido',
    accent: '#9475F0',
    tag: '50 preguntas en rotación',
    badge: '✨ Nuevo',
    difficulty: '🟢 Fácil',
    duration: '~4 min',
  },
]

const SECONDARY_MODES = [
  {
    id: 'chat',
    image: '/images/ragnarchat1a1.png',
    eyebrow: 'Chat con Personaje',
    label: 'Chat 1 a 1',
    desc: 'Sin guión. Sin filtros. Solo ellos, tal cual son.',
    route: '/chat',
    accent: '#4A9B7B',
    badge: '💬 Popular',
    tag: 'Sin límite',
  },
  {
    id: 'duo',
    image: '/images/ipmanstevenseagal.png',
    eyebrow: 'Dos Personajes',
    label: 'Chat en Alianza',
    desc: 'Elegís dos personajes y los hacés interactuar.',
    route: '/duo',
    accent: '#7B9B4A',
    tag: '2 personajes',
  },
  {
    id: 'guess',
    image: '/images/adivinaelpersonaje.png',
    eyebrow: 'Pistas y Deducción',
    label: 'Adivina el Personaje',
    desc: 'Pistas de a una. Cuanto antes lo adivinás, más puntos.',
    route: '/guess',
    accent: '#9B4A7B',
    tag: 'Con puntaje',
    difficulty: '🟡 Medio',
    duration: '~3 min',
  },
  {
    id: 'swipe',
    image: '/images/wolverineSwipe.jpg',
    eyebrow: 'Verdad o Mentira',
    label: 'Swipe',
    desc: 'Tenés segundos para decidir. ¿Cuánto los conocés?',
    route: '/swipe',
    accent: '#4A7B9B',
    tag: 'Velocidad',
    difficulty: '🟡 Medio',
    duration: '~2 min',
  },
  {
    id: 'salas',
    image: '/images/jaxtellersupermanchatenvivo.png',
    eyebrow: 'Chat Multijugador',
    label: 'Salas en vivo',
    desc: 'Chateá con un personaje junto a otros usuarios en tiempo real.',
    route: '/salas',
    accent: '#C9954A',
    badge: '🔴 En vivo',
    tag: 'Multijugador',
  },
]


export default function ModeSelectorPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [visible, setVisible] = useState(false)
  const [missionLevel] = useState(() => {
    const local = getMissionProgress()
    return local.highestUnlocked > 1 ? local.highestUnlocked : 1
  })
  const [modeCompletions, setModeCompletions] = useState({})

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    if (!session) return
    fetch(`${API_URL}/db/mode-completions`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    }).then(r => r.json()).then(data => {
      if (data && typeof data === 'object') setModeCompletions(data)
    }).catch(() => {})
  }, [session])

  return (
    <div className={`ms ${visible ? 'ms--visible' : ''}`}>

      <div className="ms-bg" aria-hidden="true" />

      <div className="ms-inner">

        {/* Header */}
        <header className="ms-header">
          <button className="ms-back" onClick={() => navigate(ROUTES.HOME)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
          <div className="ms-hero">
            <span className="ms-eyebrow">Elegí tu modo</span>
            <h1 className="ms-title">¿Cómo querés<br /><em>entrar?</em></h1>
            <p className="ms-subtitle">Cada modo es una experiencia distinta. Elegí la que más te llame.</p>
          </div>
        </header>

        {/* Todos los modos — grid unificado */}
        <div className="ms-main-grid">
          {[...MAIN_MODES, ...SECONDARY_MODES].map((mode, i) => {
            const char = characters.find(c => c.id === mode.characterId)
            return (
              <button
                key={mode.id}
                className="ms-main-card"
                style={{ '--accent': mode.accent, animationDelay: `${i * 70}ms` }}
                onClick={() => navigate(mode.route)}
              >
                {(char || mode.image) && (
                  <div className="ms-main-card__visual">
                    <img src={mode.image ?? char.image} alt="" />
                    <div className="ms-main-card__visual-fade" />
                  </div>
                )}
                <div className="ms-main-card__body">
                  <div className="ms-main-card__badges">
                    {mode.badge && <span className="ms-main-card__badge ms-badge--highlight">{mode.badge}</span>}
                    {mode.tag && <span className="ms-main-card__tag">{mode.tag}</span>}
                    {mode.id === 'mission' && missionLevel > 1 && (
                      <span className="ms-main-card__badge ms-badge--progress">📍 Nivel {missionLevel - 1}/30</span>
                    )}
                    {modeCompletions[mode.id] > 0 && (
                      <span className="ms-main-card__badge ms-badge--played">✓ {modeCompletions[mode.id]}×</span>
                    )}
                  </div>
                  <span className="ms-main-card__eyebrow">{mode.eyebrow}</span>
                  <span className="ms-main-card__label">{mode.label}</span>
                  <p className="ms-main-card__desc">{mode.desc}</p>
                  {(mode.difficulty || mode.duration) && (
                    <div className="ms-main-card__stats">
                      {mode.difficulty && <span>{mode.difficulty}</span>}
                      {mode.difficulty && mode.duration && <span className="ms-stat-dot" />}
                      {mode.duration && <span>⏱ {mode.duration}</span>}
                    </div>
                  )}
                </div>
                <div className="ms-main-card__glow" aria-hidden="true" />
              </button>
            )
          })}
        </div>


      </div>
    </div>
  )
}
