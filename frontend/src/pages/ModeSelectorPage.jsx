import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import { getMissionProgress } from '../utils/missionProgress'
import { useAuth } from '../context/AuthContext'
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
    id: 'speed',
    eyebrow: 'Preguntas Rápidas',
    label: 'Speed Round',
    desc: '60 segundos. Todo lo que puedas preguntar.',
    route: '/speed',
    accent: '#FF6B35',
    badge: '⚡ Nuevo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'entrenamiento',
    eyebrow: 'Sesión Personal',
    label: 'Entrenamiento',
    desc: 'El personaje te enseña lo que mejor sabe. 5 fases.',
    route: '/entrenamiento',
    accent: '#C07A3A',
    badge: '🥋 Nuevo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2z" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M6 21v-1a6 6 0 0 1 12 0v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M9 13l3 4 3-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'chat',
    eyebrow: 'Chat con Personaje',
    label: 'Chat 1 a 1',
    desc: 'Sin guión. Sin filtros. Solo ellos, tal cual son.',
    route: '/chat',
    accent: '#4A9B7B',
    badge: '💬 Popular',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-5 4V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'duo',
    eyebrow: 'Dos Personajes',
    label: 'Chat en Alianza',
    desc: 'Elegís dos personajes y los hacés interactuar.',
    route: '/duo',
    accent: '#7B9B4A',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.7"/>
        <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M2 20c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M16 15c3.3 0 6 1.7 6 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'guess',
    eyebrow: 'Pistas y Deducción',
    label: 'Adivina el Personaje',
    desc: 'Pistas de a una. Cuanto antes lo adivinás, más puntos.',
    route: '/guess',
    accent: '#9B4A7B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'swipe',
    eyebrow: 'Verdad o Mentira',
    label: 'Swipe',
    desc: 'Tenés segundos para decidir. ¿Cuánto los conocés?',
    route: '/swipe',
    accent: '#4A7B9B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'salas',
    eyebrow: 'Chat Multijugador',
    label: 'Salas en vivo',
    desc: 'Chateá con un personaje junto a otros usuarios en tiempo real.',
    route: '/salas',
    accent: '#C9954A',
    badge: '🔴 Nuevo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
        <circle cx="17" cy="9" r="3" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M1 21c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M17 15c2.8 0 5 1.5 5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
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
          <button className="ms-back" onClick={() => navigate('/')}>
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

        {/* Tier 1 — Protagonist modes */}
        <div className="ms-main-grid">
          {MAIN_MODES.map((mode, i) => {
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
                    <span className="ms-main-card__tag">{mode.tag}</span>
                    {mode.id === 'mission' && missionLevel > 1 && (
                      <span className="ms-main-card__badge ms-badge--progress">📍 Nivel {missionLevel - 1}/30</span>
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

        {/* Divider */}
        <div className="ms-divider">
          <span>También disponible</span>
        </div>

        {/* Tier 2 — Secondary modes */}
        <div className="ms-secondary-grid">
          {SECONDARY_MODES.map((mode, i) => (
            <button
              key={mode.id}
              className="ms-secondary-card"
              style={{ '--accent': mode.accent, animationDelay: `${(MAIN_MODES.length + i) * 70}ms` }}
              onClick={() => navigate(mode.route)}
            >
              <div className="ms-secondary-card__icon">{mode.icon}</div>
              <div className="ms-secondary-card__text">
                <span className="ms-secondary-card__eyebrow">{mode.eyebrow}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="ms-secondary-card__label">{mode.label}</span>
                  {mode.badge && <span className="ms-badge--highlight ms-badge--sm">{mode.badge}</span>}
                  {modeCompletions[mode.id] > 0 && (
                    <span className="ms-badge--played ms-badge--sm">✓ {modeCompletions[mode.id]}×</span>
                  )}
                </div>
                <p className="ms-secondary-card__desc">{mode.desc}</p>
              </div>
              <svg className="ms-secondary-card__arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>


      </div>
    </div>
  )
}
