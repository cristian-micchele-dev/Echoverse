import { Helmet } from 'react-helmet-async'
import { ROUTES } from '../../utils/constants'

export default function ChatModeHeader({ navigate, recentChats, activeTab, onTabChange, onGoDuo, session }) {
  return (
    <>
      <Helmet>
        <title>Elegí tu personaje — EchoVerse</title>
        <meta name="description" content="Más de 60 personajes icónicos del cine y la TV te esperan para conversar en tiempo real con IA." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/chat" />
      </Helmet>

      <header className="chat-mode-header">
        <button className="chat-mode-back" onClick={() => navigate(ROUTES.HOME)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>

        <div className="chat-mode-hero">
          <span className="chat-mode-eyebrow">Chat con Personaje</span>
          <h1 className="chat-mode-title">¿Cómo querés chatear?</h1>
          <p className="chat-mode-subtitle">Elegí un personaje y conversá. Sin guión, sin filtros.</p>
        </div>

        <div className="chat-mode-switcher">
          {recentChats.length > 0 && (
            <button
              className={`chat-mode-switcher__btn${activeTab === 'recent' ? ' chat-mode-switcher__btn--active' : ''}`}
              onClick={() => onTabChange('recent')}
            >
              <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M11 7v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Mis chats
            </button>
          )}
          <button
            className={`chat-mode-switcher__btn${activeTab === 'all' ? ' chat-mode-switcher__btn--active' : ''}`}
            onClick={() => onTabChange('all')}
          >
            <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
              <path d="M4 4h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H7l-4 3V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
            1 Personaje
          </button>
          {session && (
            <button
              className={`chat-mode-switcher__btn${activeTab === 'custom' ? ' chat-mode-switcher__btn--active' : ''}`}
              onClick={() => onTabChange('custom')}
            >
              <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M11 3v2M11 17v2M3 11h2M17 11h2M5.6 5.6l1.4 1.4M15 15l1.4 1.4M15 7l1.4-1.4M5.6 16.4l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Mis personajes
            </button>
          )}
          <button className="chat-mode-switcher__btn" onClick={onGoDuo}>
            <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
              <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="14.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M1 18c0-3 2.8-4.5 6.5-4.5S13 15 13 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M13 18c0-3 2.8-4.5 6.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            2 Personajes
          </button>
        </div>
      </header>
    </>
  )
}
