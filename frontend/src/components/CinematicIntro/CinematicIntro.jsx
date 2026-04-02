import { useState, useEffect, useCallback } from 'react'
import { getMissionIntro } from '../../utils/missionIntro'
import './CinematicIntro.css'

/* ── Configuración de tiempos ─────────────────────────── */
const ENTER_MS = 700
const HOLD_MS  = 2600
const LEAVE_MS = 500

/* ── Etiquetas por modo ───────────────────────────────── */
const MODE_LABELS = {
  mission:  'MODO MISIÓN',
  action:   'MODO OPERATIVO',
  battle:   'MODO BATALLA',
  story:    'MODO HISTORIA',
}

/**
 * CinematicIntro — Intro cinematográfica reutilizable por modo.
 *
 * Props:
 *   character  – objeto de personaje (de characters.js)
 *   mode       – 'mission' | 'action' | 'battle' | 'story'
 *   onFinish   – callback invocado al terminar o saltar
 */
export default function CinematicIntro({ character, mode = 'mission', onFinish }) {
  const [anim, setAnim] = useState('entering')

  // Resolver intro con cadena de fallback inteligente
  const introData   = getMissionIntro(character)
  const modeLabel   = MODE_LABELS[mode] ?? 'MODO MISIÓN'
  const accentColor = character?.themeColor ?? '#c9a84c'

  // ── Saltar ───────────────────────────────────────────
  const handleSkip = useCallback(() => {
    setAnim('leaving')
    setTimeout(onFinish, LEAVE_MS)
  }, [onFinish])

  // ── Ciclo de vida ────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setAnim('visible'), 50)
    const t2 = setTimeout(() => setAnim('leaving'), ENTER_MS + HOLD_MS)
    const t3 = setTimeout(onFinish, ENTER_MS + HOLD_MS + LEAVE_MS)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinish])

  return (
    <div
      className={`ci ci--${anim}`}
      style={{
        '--ci-color':  accentColor,
        '--ci-enter':  `${ENTER_MS}ms`,
        '--ci-leave':  `${LEAVE_MS}ms`,
      }}
      onClick={handleSkip}
      aria-label="Intro cinematográfica. Click para saltar."
    >
      {/* ── Barras de letterbox ── */}
      <div className="ci-bar ci-bar--top"    aria-hidden="true" />
      <div className="ci-bar ci-bar--bottom" aria-hidden="true" />

      {/* ── Fondo ── */}
      <div className="ci-bg" aria-hidden="true">
        {character?.image && (
          <img
            src={character.image}
            alt=""
            className="ci-bg__img"
            draggable="false"
          />
        )}
        <div className="ci-bg__color-wash" />
        <div className="ci-bg__overlay"   />
        <div className="ci-bg__scanlines" />
        <div className="ci-bg__grain"     />
      </div>

      {/* ── Línea de acento lateral izquierda ── */}
      <div className="ci-accent-line" aria-hidden="true" />

      {/* ── Contenido ── */}
      <div className="ci-content">

        {/* Eyebrow: modo */}
        <p className="ci-eyebrow" style={{ '--d': '0ms' }}>
          <span className="ci-eyebrow__dash" />
          {modeLabel}
          <span className="ci-eyebrow__dash" />
        </p>

        {/* Separador */}
        <div className="ci-rule" style={{ '--d': '100ms' }} aria-hidden="true" />

        {/* Nombre del personaje */}
        <h1 className="ci-name" style={{ '--d': '200ms' }}>
          {character?.name?.toUpperCase() ?? 'AGENTE'}
        </h1>

        {/* Rol — único por personaje */}
        {(introData.roleLine || character?.description) && (
          <p className="ci-desc" style={{ '--d': '340ms' }}>
            {introData.roleLine || character.description}
          </p>
        )}

        {/* Frase icónica */}
        <blockquote className="ci-quote" style={{ '--d': '520ms' }}>
          &ldquo;{introData.quote}&rdquo;
        </blockquote>

        {/* Nombre de operación */}
        {(introData.operation || introData.missionLabel) && (
          <p className="ci-mission-tag" style={{ '--d': '720ms' }}>
            {introData.operation ?? introData.missionLabel}
          </p>
        )}
      </div>

      {/* ── Hint de skip ── */}
      <p className="ci-skip-hint" aria-hidden="true">
        Toca para saltar
      </p>
    </div>
  )
}
