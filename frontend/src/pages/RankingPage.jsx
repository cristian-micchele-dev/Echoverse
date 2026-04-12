import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import './RankingPage.css'

const TABS = [
  { id: 'missions', label: 'Misiones', icon: '⚔️' },
  { id: 'guess',    label: 'Adivina',  icon: '🔍' },
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tab, setTab] = useState('missions')
  // null = not fetched yet (loading), array = loaded
  const [data, setData] = useState({ missions: null, guess: null })

  useEffect(() => {
    if (data[tab] !== null) return
    fetch(`${API_URL}/db/leaderboard/${tab}`)
      .then(r => r.json())
      .then(rows => setData(prev => ({ ...prev, [tab]: Array.isArray(rows) ? rows : [] })))
      .catch(() => setData(prev => ({ ...prev, [tab]: [] })))
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = data[tab]        // null while loading, array when ready
  const isMissions = tab === 'missions'

  return (
    <div className="rk">
      <div className="rk-grain" aria-hidden="true" />

      <div className="rk-inner">
        {/* Header */}
        <div className="rk-header">
          <button className="rk-back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>

          <div className="rk-title-wrap">
            <span className="rk-eyebrow">COMPETENCIA GLOBAL</span>
            <h1 className="rk-title">Ranking</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="rk-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`rk-tab ${tab === t.id ? 'rk-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="rk-board">
          {rows === null ? (
            <div className="rk-loading">
              <div className="rk-spinner" />
              <span>Cargando ranking…</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="rk-empty">
              <span className="rk-empty__icon">🏆</span>
              <p className="rk-empty__title">Nadie en el ranking todavía</p>
              <p className="rk-empty__sub">Sé el primero en aparecer acá</p>
              <button className="rk-empty__cta" onClick={() => navigate(isMissions ? '/mission' : '/guess')}>
                {isMissions ? 'Ir a Misiones →' : 'Jugar Adivina →'}
              </button>
            </div>
          ) : (
            <ol className="rk-list">
              {rows.map((row, i) => {
                const isMe = user && row.userId === user.id
                return (
                  <li key={row.userId} className={`rk-row ${isMe ? 'rk-row--me' : ''}`}>
                    <span className="rk-row__pos">
                      {i < 3 ? MEDALS[i] : <span className="rk-row__num">{i + 1}</span>}
                    </span>
                    <span className="rk-row__username">
                      {row.username}
                      {isMe && <span className="rk-row__you">tú</span>}
                    </span>
                    <span className="rk-row__score">
                      {isMissions
                        ? <>{row.level} <span className="rk-row__unit">niveles</span></>
                        : <>{row.score} <span className="rk-row__unit">pts</span></>
                      }
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {/* CTA */}
        {rows !== null && rows.length > 0 && (
          <div className="rk-cta-wrap">
            <button className="rk-cta" onClick={() => navigate(isMissions ? '/mission' : '/guess')}>
              {isMissions ? 'Escalar en Misiones →' : 'Mejorar score en Adivina →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
