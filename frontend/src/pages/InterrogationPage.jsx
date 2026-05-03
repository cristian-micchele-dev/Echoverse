import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { characterMap } from '../data/characters'
import { INTERROGATION_CHAR_IDS } from '../data/interrogationData'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { recordCompletion } from '../utils/recordCompletion'
import './InterrogationPage.css'
import { API_URL } from '../config/api.js'
import {
  POOL_SIZE,
  calcQuestionPressureDelta,
  calcConfrontationPressureDelta,
} from './interrogation/constants.js'
import InterrogationIntro from './interrogation/InterrogationIntro'
import InterrogationChat from './interrogation/InterrogationChat'
import InterrogationConfrontation from './interrogation/InterrogationConfrontation'
import InterrogationDecision from './interrogation/InterrogationDecision'
import InterrogationReveal from './interrogation/InterrogationReveal'

function pickRandom(arr, n) {
  const copy = [...arr]
  const result = []
  while (result.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(i, 1)[0])
  }
  return result
}

const allIntChars = INTERROGATION_CHAR_IDS
  .map(id => characterMap[id])
  .filter(Boolean)

export default function InterrogationPage() {
  const { session } = useAuth()
  const { showConfirm } = useToast()
  const recordedRef = useRef(false)

  const [sessionSeed, setSessionSeed] = useState(0)

  useEffect(() => {
    document.title = 'Interrogatorio — EchoVerse'
    return () => { document.title = 'EchoVerse' }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const intChars = useMemo(() => pickRandom(allIntChars, POOL_SIZE), [sessionSeed])

  const [phase, setPhase]               = useState('intro')
  const [selectedChar, setSelectedChar] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)

  const [sessionId, setSessionId]               = useState(null)
  const [openingStatement, setOpeningStatement] = useState('')
  const [exchanges, setExchanges]               = useState([])
  const [inputValue, setInputValue]             = useState('')
  const [isLoading, setIsLoading]               = useState(false)
  const [pressureLevel, setPressureLevel]       = useState(0)

  const [revealData, setRevealData] = useState(null)

  const [usedSuggestions, setUsedSuggestions] = useState(new Set())

  const [flagged, setFlagged]       = useState(new Set())
  const [notes, setNotes]           = useState('')
  const [notesOpen, setNotesOpen]   = useState(false)

  const [confrontationResponse, setConfrontationResponse]   = useState(null)
  const [selectedConfrontation, setSelectedConfrontation]   = useState(null)
  const [confrontationTone, setConfrontationTone]           = useState(null)

  const chatEndRef = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [exchanges, isLoading])

  useEffect(() => {
    if (phase === 'interrogation') {
      setTimeout(() => inputRef.current?.focus(), 400)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'reveal' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'interrogation')
    }
  }, [phase, session])

  const startSession = useCallback(async () => {
    if (!selectedChar || !selectedScenario) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/interrogation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId:     selectedChar.id,
          scenario:        selectedScenario.text,
          hiddenTruth:     selectedScenario.hiddenTruth,
          innocentVersion: selectedScenario.innocentVersion,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar')
      setSessionId(data.sessionId)
      setOpeningStatement(data.openingStatement)
      setExchanges([])
      setPressureLevel(0)
      setPhase('interrogation')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedChar, selectedScenario])

  const sendMessage = useCallback(async (q) => {
    if (!q || !sessionId || isLoading || exchanges.length >= 8) return
    setIsLoading(true)
    const tempExchange = { question: q, response: null, emotionalTone: null, confidence: null }
    setExchanges(prev => [...prev, tempExchange])
    try {
      const res = await fetch(`${API_URL}/interrogation/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: q }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setExchanges(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          question: q, response: data.response,
          emotionalTone: data.emotionalTone, confidence: data.confidence,
          questionIndex: data.questionIndex,
        }
        return updated
      })
      setPressureLevel(prev =>
        Math.min(100, Math.max(0, prev + calcQuestionPressureDelta(data.emotionalTone, data.confidence)))
      )
    } catch (err) {
      console.error(err)
      setExchanges(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], response: 'No hubo respuesta.', emotionalTone: 'calm', confidence: 0.5 }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, isLoading, exchanges.length])

  const askQuestion = useCallback(() => {
    const q = inputValue.trim()
    if (!q) return
    setInputValue('')
    sendMessage(q)
  }, [inputValue, sendMessage])

  const sendSuggestion = useCallback((q) => {
    setUsedSuggestions(prev => new Set([...prev, q]))
    sendMessage(q)
  }, [sendMessage])

  const toggleFlag = useCallback((index) => {
    setFlagged(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const submitVerdict = useCallback(async (verdict) => {
    if (!sessionId) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/interrogation/verdict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, verdict }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setRevealData({ ...data, userVerdict: verdict })
      setPhase('reveal')
      if (session && selectedChar && selectedScenario && data.playerPerformance) {
        fetch(`${API_URL}/db/interrogation-result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            characterId:    selectedChar.id,
            scenario:       selectedScenario.text,
            isLying:        data.isLying,
            correct:        data.correct,
            totalQuestions: data.playerPerformance.totalQuestions,
            pressureCount:  data.playerPerformance.pressureCount,
            rank:           data.playerPerformance.rank,
          }),
        }).catch(() => {})
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, session, selectedChar, selectedScenario])

  const submitConfrontation = useCallback(async (text) => {
    if (!sessionId || isLoading) return
    setSelectedConfrontation(text)
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/interrogation/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setConfrontationResponse(data.response)
      setConfrontationTone(data.emotionalTone)
      setPressureLevel(prev =>
        Math.min(100, Math.max(0, prev + calcConfrontationPressureDelta(data.emotionalTone, data.confidence)))
      )
    } catch (err) {
      console.error(err)
      setConfrontationResponse('Sin respuesta.')
      setConfrontationTone('calm')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, isLoading])

  const resetGame = () => {
    setSessionSeed(s => s + 1)
    setPhase('intro')
    setSelectedChar(null)
    setSelectedScenario(null)
    setSessionId(null)
    setOpeningStatement('')
    setExchanges([])
    setInputValue('')
    setRevealData(null)
    setPressureLevel(0)
    setUsedSuggestions(new Set())
    setConfrontationResponse(null)
    setSelectedConfrontation(null)
    setConfrontationTone(null)
    setFlagged(new Set())
    setNotes('')
    setNotesOpen(false)
    recordedRef.current = false
  }

  if (phase === 'intro') {
    return (
      <InterrogationIntro
        intChars={intChars}
        selectedChar={selectedChar}
        setSelectedChar={setSelectedChar}
        selectedScenario={selectedScenario}
        setSelectedScenario={setSelectedScenario}
        isLoading={isLoading}
        startSession={startSession}
      />
    )
  }

  if (phase === 'interrogation') {
    return (
      <InterrogationChat
        selectedChar={selectedChar}
        selectedScenario={selectedScenario}
        openingStatement={openingStatement}
        exchanges={exchanges}
        inputValue={inputValue}
        setInputValue={setInputValue}
        isLoading={isLoading}
        pressureLevel={pressureLevel}
        flagged={flagged}
        notes={notes}
        setNotes={setNotes}
        notesOpen={notesOpen}
        setNotesOpen={setNotesOpen}
        usedSuggestions={usedSuggestions}
        chatEndRef={chatEndRef}
        inputRef={inputRef}
        onAskQuestion={askQuestion}
        onSendSuggestion={sendSuggestion}
        onToggleFlag={toggleFlag}
        onDecide={() => setPhase('confrontation')}
        onAbandon={() => showConfirm('¿Abandonar el interrogatorio?', resetGame)}
      />
    )
  }

  if (phase === 'confrontation') {
    return (
      <InterrogationConfrontation
        selectedChar={selectedChar}
        selectedScenario={selectedScenario}
        confrontationResponse={confrontationResponse}
        selectedConfrontation={selectedConfrontation}
        confrontationTone={confrontationTone}
        isLoading={isLoading}
        onSubmitConfrontation={submitConfrontation}
        onBack={() => setPhase('interrogation')}
        onVerdict={() => setPhase('decision')}
      />
    )
  }

  if (phase === 'decision') {
    return (
      <InterrogationDecision
        selectedChar={selectedChar}
        exchanges={exchanges}
        flagged={flagged}
        notes={notes}
        isLoading={isLoading}
        onSubmitVerdict={submitVerdict}
        onBack={() => setPhase('interrogation')}
      />
    )
  }

  if (phase === 'reveal' && revealData) {
    return (
      <InterrogationReveal
        selectedChar={selectedChar}
        revealData={revealData}
        onPlayAgain={resetGame}
      />
    )
  }

  return null
}
