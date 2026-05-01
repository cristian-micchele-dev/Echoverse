import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useStreaming } from '../hooks/useStreaming'
import { ROUTES } from '../utils/constants'
import {
  calculateProfile,
  applyStateEffects,
  pickDilemas
} from '../data/dilemas'
import { getAffinityData, getAffinityLevel } from '../utils/affinity'
import { recordCompletion } from '../utils/recordCompletion'
import './DilemmaPage.css'
import { API_URL } from '../config/api.js'
import { useAuth } from '../context/AuthContext'
import { INITIAL_STATE } from './dilema/constants.js'
import SelectPhase from './dilema/SelectPhase.jsx'
import ScenarioPhase from './dilema/ScenarioPhase.jsx'
import IntroPhase from './dilema/IntroPhase.jsx'
import DilemmaPhase from './dilema/DilemmaPhase.jsx'
import ReactionPhase from './dilema/ReactionPhase.jsx'
import ProfilePhase from './dilema/ProfilePhase.jsx'

export default function DilemmaPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  // ─── Phase machine ────────────────────────────────────────────────────────
  // select → scenario → intro → dilemma → reaction → profile
  const [phase, setPhase] = useState('select')
  const [visible, setVisible] = useState(false)

  // ─── Session data ─────────────────────────────────────────────────────────
  const [character, setCharacter] = useState(null)
  const [affinityLevel, setAffinityLevel] = useState(0)
  const [scenario, setScenario] = useState(null)
  const [sessionDilemas, setSessionDilemas] = useState([]) // dilemas elegidos al azar para esta sesión
  const [roundIndex, setRoundIndex] = useState(0)
  const [narrativeState, setNarrativeState] = useState(INITIAL_STATE)
  const [choiceHistory, setChoiceHistory] = useState([])

  // ─── Current round ────────────────────────────────────────────────────────
  const [pendingChoice, setPendingChoice] = useState(null) // { key, label, dilema }
  const [globalVotes, setGlobalVotes] = useState(null)
  const [reaction, setReaction] = useState('')
  const [consequenceVisible, setConsequenceVisible] = useState(false)

  const { isLoading: isStreaming, streamChat } = useStreaming()

  // ─── Profile ──────────────────────────────────────────────────────────────
  const [moralProfile, setMoralProfile] = useState(null)
  const [profileVisible, setProfileVisible] = useState(false)

  const reactionRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const recordedRef = useRef(false)
  useEffect(() => {
    if (phase === 'profile' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'dilema')
    }
  }, [phase, session])

  // ─── Transition helper ────────────────────────────────────────────────────
  function transitionTo(nextPhase, delay = 0) {
    setTimeout(() => setPhase(nextPhase), delay)
  }

  // ─── Character select ─────────────────────────────────────────────────────
  function handleCharSelect(char) {
    setCharacter(char)
    const { messageCount } = getAffinityData(char.id)
    setAffinityLevel(getAffinityLevel(messageCount))
    transitionTo('scenario', 80)
  }

  // ─── Scenario select ──────────────────────────────────────────────────────
  async function handleScenarioSelect(sc) {
    const variants = sc.introVariants ?? [sc.introLines]
    const introLines = variants[Math.floor(Math.random() * variants.length)]
    setScenario({ ...sc, introLines })

    let seen = []
    if (session) {
      try {
        const r = await fetch(`${API_URL}/db/dilema-seen`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        seen = await r.json()
      } catch { seen = [] }
    } else {
      try { seen = JSON.parse(localStorage.getItem('dilema-seen') || '[]') } catch { seen = [] }
    }

    setSessionDilemas(pickDilemas(sc.dilemmaPool, 4, seen))
    transitionTo('intro', 80)
  }

  // ─── Intro → first dilema ─────────────────────────────────────────────────
  function handleIntroNext() {
    setRoundIndex(0)
    transitionTo('dilemma', 80)
  }

  // ─── Choice selection ─────────────────────────────────────────────────────
  function handleChoiceSelect(choice, dilema) {
    setPendingChoice({ ...choice, dilemaId: dilema.id, dilemmaQuestion: dilema.question, allChoices: dilema.choices })
    setReaction('')
    setGlobalVotes(null)
    setConsequenceVisible(false)
    transitionTo('reaction', 60)
    fetchReaction(choice, dilema)
    fetch(`${API_URL}/db/dilema-votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dilemaId: dilema.id, choiceKey: choice.key })
    })
      .then(r => r.json())
      .then(votes => { if (votes && !votes.error) setGlobalVotes(votes) })
      .catch(() => {})
  }

  const fetchReaction = useCallback(async (choice, dilema) => {
    const historyPayload = choiceHistory.map(c => ({
      dilemmaQuestion: c.dilemmaQuestion,
      choiceLabel: c.label
    }))

    try {
      await streamChat(
        `${API_URL}/dilema`,
        {
          characterId: character.id,
          dilemmaQuestion: dilema.question,
          choiceLabel: choice.label,
          choiceKey: choice.key,
          choiceHistory: historyPayload,
          affinityLevel
        },
        chunk => {
          setReaction(prev => prev + chunk)
          reactionRef.current?.scrollTo({ top: reactionRef.current.scrollHeight, behavior: 'smooth' })
        }
      )
    } catch {
      setReaction('El silencio también es una respuesta.')
    } finally {
      setTimeout(() => setConsequenceVisible(true), 400)
    }
  }, [character, choiceHistory, affinityLevel, streamChat])

  // ─── Advance from reaction ────────────────────────────────────────────────
  function handleReactionNext() {
    const dilema = sessionDilemas[roundIndex]
    const choice = pendingChoice

    // Update state
    const newState = applyStateEffects(narrativeState, choice.stateEffects)
    setNarrativeState(newState)

    // Update history
    const newHistory = [
      ...choiceHistory,
      {
        dilemaId: dilema.id,
        dilemmaQuestion: dilema.question,
        key: choice.key,
        label: choice.label
      }
    ]
    setChoiceHistory(newHistory)

    const isLast = roundIndex >= sessionDilemas.length - 1

    if (isLast) {
      const profile = calculateProfile(newState)
      setMoralProfile(profile)
      // Persistir ids vistos para evitar repetición en próximas sesiones
      const played = sessionDilemas.map(d => d.id)
      if (session) {
        fetch(`${API_URL}/db/dilema-seen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ dilemaIds: played })
        }).catch(() => {})
      } else {
        try {
          const seen = JSON.parse(localStorage.getItem('dilema-seen') || '[]')
          localStorage.setItem('dilema-seen', JSON.stringify([...new Set([...seen, ...played])]))
        } catch { /* ignore */ }
      }
      transitionTo('profile', 80)
      setTimeout(() => setProfileVisible(true), 400)
    } else {
      setRoundIndex(prev => prev + 1)
      transitionTo('dilemma', 80)
    }
  }

  // ─── Restart ──────────────────────────────────────────────────────────────
  function handleRestart() {
    setPhase('select')
    setCharacter(null)
    setAffinityLevel(0)
    setScenario(null)
    setSessionDilemas([])
    setRoundIndex(0)
    setNarrativeState(INITIAL_STATE)
    setChoiceHistory([])
    setPendingChoice(null)
    setReaction('')
    setGlobalVotes(null)
    setMoralProfile(null)
    setProfileVisible(false)
    setConsequenceVisible(false)
  }

  // ─── Derived ──────────────────────────────────────────────────────────────
  const currentDilema = sessionDilemas[roundIndex] ?? null
  const totalRounds = sessionDilemas.length
  const tensionPercent = Math.min(narrativeState.tension, 100)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`dilema-page ${visible ? 'dilema-page--visible' : ''}`}
      style={{
        '--tension': tensionPercent / 100,
        '--char-color': character?.themeColor ?? '#c9a84c',
        '--char-gradient': character?.gradient ?? 'none'
      }}
    >
      <Helmet>
        <title>Dilemas Morales — EchoVerse</title>
        <meta name="description" content="Sin salida limpia. Decidí en dilemas filosóficos junto a los personajes más icónicos del cine y la TV." />
        <link rel="canonical" href="https://echoverse-jet.vercel.app/dilema" />
      </Helmet>
      {/* Background */}
      <div className="dilema-ambient" />
      {character && (
        <div className="dilema-bg-char" aria-hidden="true">
          <img src={character.image} alt="" />
        </div>
      )}

      {phase === 'select'   && <SelectPhase onSelect={handleCharSelect} onBack={() => navigate(ROUTES.HOME)} />}
      {phase === 'scenario' && character && (
        <ScenarioPhase character={character} onSelect={handleScenarioSelect} onBack={() => setPhase('select')} />
      )}
      {phase === 'intro' && scenario && character && (
        <IntroPhase scenario={scenario} character={character} onNext={handleIntroNext} onBack={() => setPhase('scenario')} />
      )}
      {phase === 'dilemma' && currentDilema && (
        <DilemmaPhase
          dilema={currentDilema}
          roundIndex={roundIndex}
          totalRounds={totalRounds}
          character={character}
          narrativeState={narrativeState}
          affinityLevel={affinityLevel}
          onChoose={handleChoiceSelect}
          onExit={handleRestart}
        />
      )}
      {phase === 'reaction' && pendingChoice && (
        <ReactionPhase
          choice={pendingChoice}
          character={character}
          narrativeState={narrativeState}
          reaction={reaction}
          isStreaming={isStreaming}
          consequenceVisible={consequenceVisible}
          globalVotes={globalVotes}
          reactionRef={reactionRef}
          roundIndex={roundIndex}
          totalRounds={totalRounds}
          onNext={handleReactionNext}
          onExit={handleRestart}
        />
      )}
      {phase === 'profile' && moralProfile && (
        <ProfilePhase
          profile={moralProfile}
          character={character}
          choices={choiceHistory}
          narrativeState={narrativeState}
          visible={profileVisible}
          onRestart={handleRestart}
          onHome={() => navigate(ROUTES.HOME)}
        />
      )}
    </div>
  )
}
