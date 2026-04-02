import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characters } from '../data/characters'
import './ModeSelectorPage.css'

const MAIN_MODES = [
  {
    id: 'mission',
    characterId: 'el-profesor',
    eyebrow: 'Historia Interactiva',
    label: 'Modo Misión',
    desc: 'Una misión real. Cada decisión tiene peso.',
    route: '/mission',
    accent: '#D4576B',
    tag: '4 misiones activas',
  },
  {
    id: 'interrogation',
    characterId: 'walter-white',
    eyebrow: 'Detección de Mentiras',
    label: 'Interrogatorio',
    desc: 'El personaje puede estar mintiendo. Detectá las contradicciones.',
    route: '/interrogation',
    accent: '#6D4AFF',
    tag: 'IA reactiva',
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
  },
]

const SECONDARY_MODES = [
  {
    id: 'chat',
    eyebrow: 'Chat con Personaje',
    label: 'Chat 1 a 1',
    desc: 'Sin guión. Sin filtros. Solo ellos, tal cual son.',
    route: '/chat',
    accent: '#4A9B7B',
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
]


export default function ModeSelectorPage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

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
                {char && (
                  <div className="ms-main-card__visual">
                    <img src={char.image} alt="" />
                    <div className="ms-main-card__visual-fade" />
                  </div>
                )}
                <div className="ms-main-card__body">
                  <span className="ms-main-card__eyebrow">{mode.eyebrow}</span>
                  <span className="ms-main-card__label">{mode.label}</span>
                  <p className="ms-main-card__desc">{mode.desc}</p>
                  <span className="ms-main-card__tag">{mode.tag}</span>
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
                <span className="ms-secondary-card__label">{mode.label}</span>
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
