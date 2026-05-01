import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { characters } from '../data/characters'
import { loadSession } from '../utils/session'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import DailyChallenge from '../components/DailyChallenge/DailyChallenge'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api.js'
import './LandingPage.css'
import { HERO_CHAR_IDS, PILLARS } from './landing/constants.js'
import ArrowIcon from './landing/ArrowIcon.jsx'
import LandingHero from './landing/LandingHero.jsx'
import LandingCast from './landing/LandingCast.jsx'
import LandingPreviews from './landing/LandingPreviews.jsx'
import LandingModes from './landing/LandingModes.jsx'
import CommunitySection from './landing/CommunitySection.jsx'
import WelcomePanel from './landing/WelcomePanel.jsx'
import BenefitsPanel from './landing/BenefitsPanel.jsx'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [visible, setVisible]         = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const [onlineCount, setOnlineCount] = useState(null)
  const [communityChars, setCommunityChars] = useState([])
  const sidRef = useRef(null)
  const lpRef  = useRef(null)

  const heroChars   = HERO_CHAR_IDS.map(id => characters.find(c => c.id === id)).filter(Boolean)
  const session     = loadSession()
  const sessionChar = session ? characters.find(c => c.id === session.characterId) : null

  useEffect(() => {
    if (user) navigate(ROUTES.DASHBOARD, { replace: true })
  }, [user, navigate])

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('custom_characters')
      .select('id, name, emoji, color, avatar_url, description')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setCommunityChars(data) })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    const root = lpRef.current
    if (!root) return
    const targets = root.querySelectorAll('.lp-reveal')
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-reveal--visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -24px 0px' }
    )
    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Online counter — ping every 20s
  useEffect(() => {
    if (!sidRef.current) {
      let stored = localStorage.getItem('echo_sid')
      if (!stored) {
        stored = Math.random().toString(36).slice(2, 18)
        localStorage.setItem('echo_sid', stored)
      }
      sidRef.current = stored
    }
    const ping = () => {
      fetch(`${API_URL}/online/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid: sidRef.current }),
      })
        .then(r => r.json())
        .then(d => setOnlineCount(d.online))
        .catch(() => {})
    }
    ping()
    const id = setInterval(ping, 20_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`lp ${visible ? 'lp--visible' : ''}`} ref={lpRef}>
      <Helmet>
        <title>EchoVerse — Chateá con personajes ficticios usando IA</title>
        <meta name="description" content="Conversá con Darth Vader, Sherlock Holmes, Walter White y más de 60 personajes icónicos del cine y la TV. Decisiones reales, respuestas únicas." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/" />
        <meta property="og:url" content="https://echoverse-jet.vercel.app/" />
      </Helmet>

      <div className="lp-grain" aria-hidden="true" />

      <LandingHero
        heroChars={heroChars}
        session={session}
        sessionChar={sessionChar}
        user={user}
        navigate={navigate}
      />

      {user && (
        <section className="lp-daily">
          <div className="lp-container">
            <WelcomePanel user={user} navigate={navigate} />
            <DailyChallenge />
          </div>
        </section>
      )}

      <LandingCast navigate={navigate} />

      <LandingPreviews navigate={navigate} />

      {!user && (
        <section className="lp-register">
          <div className="lp-container">
            <BenefitsPanel onRegister={() => navigate(ROUTES.AUTH)} />
          </div>
        </section>
      )}

      {user && <CommunitySection communityChars={communityChars} navigate={navigate} />}

      <LandingModes navigate={navigate} />

      <section className="lp-register">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal">
            <span className="lp-eyebrow lp-eyebrow--inline">
              POR QUÉ ECHOVERSE
              <span className="lp-eyebrow__rule lp-eyebrow__rule--right" />
            </span>
            <h2 className="lp-section-title">
              No es un chatbot.<br /><em>Es otra cosa.</em>
            </h2>
          </div>
          <div className="lp-pillars lp-reveal" style={{ '--reveal-delay': '0.1s' }}>
            {PILLARS.map(p => (
              <div key={p.num} className="lp-pillar">
                <span className="lp-pillar__num">{p.num}</span>
                <h3 className="lp-pillar__title">{p.title}</h3>
                <p className="lp-pillar__desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-end">
        <div className="lp-end__ambient" aria-hidden="true" />
        <div className="lp-container lp-end__inner">
          <span className="lp-eyebrow">¿ESTÁS LISTO?</span>
          <h2 className="lp-end__title">
            No viniste a mirar.<br />
            <em>Viniste a decidir.</em>
          </h2>
          <p className="lp-end__sub">El universo te espera. Los personajes, también.</p>
          <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={() => navigate(ROUTES.MODOS)}>
            Entrar ahora <ArrowIcon size={17} />
          </button>
        </div>
      </section>

      <section className="lp-about">
        <div className="lp-container lp-about__inner">
          <div className="lp-about__body">
            <span className="lp-eyebrow">SOBRE EL CREADOR</span>
            <h2 className="lp-about__name">Cristian Micchele</h2>
            <p className="lp-about__bio">
              Full-stack developer apasionado por crear experiencias web que se sienten distintas.
              EchoVerse nació de combinar inteligencia artificial con personajes que ya amás.
            </p>
            <div className="lp-about__links">
              <a href="https://github.com/cristian-micchele-dev" target="_blank" rel="noopener noreferrer" className="lp-about__link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/cristianmicchele/" target="_blank" rel="noopener noreferrer" className="lp-about__link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <span className="lp-footer__logo">ECHOVERSE</span>
          <span className="lp-footer__powered">Powered by Mistral AI</span>
          <div className="lp-footer__legal">
            <a href="/terms" className="lp-footer__legal-link">Términos</a>
            <span className="lp-footer__legal-sep">·</span>
            <a href="/privacy" className="lp-footer__legal-link">Privacidad</a>
            <span className="lp-footer__legal-sep">·</span>
            <span className="lp-footer__year">© 2026</span>
          </div>
        </div>
      </footer>

      {onlineCount !== null && (
        <div className="lp-online">
          <span className="lp-online__dot" />
          {onlineCount} {onlineCount === 1 ? 'persona online' : 'personas online'}
        </div>
      )}

      <button
        className={`lp-scroll-top${scrolled ? ' lp-scroll-top--visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 12V4M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
