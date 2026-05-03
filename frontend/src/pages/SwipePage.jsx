import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStreaming } from '../hooks/useStreaming'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/api/recordCompletion'
import { addModeXP } from '../utils/game/affinity'
import { useLevelUpToast } from '../hooks/useLevelUpToast'
import { THRESHOLD } from './swipe/constants.js'
import SwipeChars from './swipe/SwipeChars.jsx'
import SwipeLoading from './swipe/SwipeLoading.jsx'
import SwipePlaying from './swipe/SwipePlaying.jsx'
import SwipeResult from './swipe/SwipeResult.jsx'
import './SwipePage.css'
import { API_URL } from '../config/api.js'

export default function SwipePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)

  const [phase, setPhase] = useState('chars')
  const [selectedChar, setSelectedChar] = useState(null)
  const [cards, setCards] = useState([])
  const { levelUpToast, dismissLevelUp, notifyLevelUp } = useLevelUpToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [leaving, setLeaving] = useState(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [feedbackData, setFeedbackData] = useState(null)
  const [result, setResult] = useState({ score: null, analysis: '' })
  const [error, setError] = useState(null)
  const { isLoading: streaming, streamChat } = useStreaming()
  const [timeLeft, setTimeLeft] = useState(15)
  const [streak, setStreak] = useState(0)

  const startX = useRef(null)
  const advanceRef = useRef(null)
  const autoTimerRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (phase === 'result' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'swipe')
      if (selectedChar) {
        const res = addModeXP(selectedChar.id, 'swipe')
        notifyLevelUp(res, selectedChar.name)
      }
    }
  }, [phase, session, selectedChar, notifyLevelUp])

  useEffect(() => {
    if (phase !== 'playing') return
    setTimeLeft(15)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [currentIndex, phase])

  useEffect(() => {
    if (feedbackData || leaving) clearInterval(timerRef.current)
  }, [feedbackData, leaving])

  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing' && !feedbackData && !leaving) {
      handleAnswer(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  const handleCharSelect = async (char) => {
    setSelectedChar(char)
    setPhase('loading')
    setError(null)
    try {
      const res = await fetch(`${API_URL}/swipe/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: char.id })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCards(data.cards)
      setCurrentIndex(0)
      setAnswers([])
      setPhase('playing')
    } catch {
      setError('Error al cargar las preguntas. Reintentá.')
      setPhase('chars')
    }
  }

  const handleAnswer = (userSaysTrue) => {
    if (leaving || feedbackData) return
    clearInterval(timerRef.current)
    const card = cards[currentIndex]
    const correct = userSaysTrue === card.answer
    const newStreak = correct ? streak + 1 : 0
    setStreak(newStreak)
    const multiplier = newStreak >= 5 ? 2.0 : newStreak >= 3 ? 1.5 : 1.0
    const newAnswers = [...answers, { correct, difficulty: card.difficulty || 'easy', multiplier }]
    const isLast = currentIndex + 1 >= cards.length
    const dir = userSaysTrue ? 'right' : 'left'
    setLeaving(dir)

    setTimeout(() => {
      setLeaving(null)
      setDragX(0)
      const feedback = { correct, text: card.feedback || '', difficulty: card.difficulty || '', showExplanation: false }
      setFeedbackData(feedback)

      const advance = () => {
        clearTimeout(autoTimerRef.current)
        advanceRef.current = null
        setFeedbackData(null)
        if (isLast) {
          const diffPts = { hard: 200, medium: 150, easy: 100 }
          const score = newAnswers.reduce((acc, a) => acc + (a.correct ? Math.round((diffPts[a.difficulty] ?? 100) * a.multiplier) : 0), 0)
          setAnswers(newAnswers)
          setPhase('result')
          fetchResult(score, newAnswers.length)
        } else {
          setAnswers(newAnswers)
          setCurrentIndex(i => i + 1)
        }
      }
      advanceRef.current = advance
      autoTimerRef.current = setTimeout(advance, 1800)
    }, 350)
  }

  const onPointerDown = (e) => {
    if (leaving || feedbackData) return
    startX.current = e.clientX ?? e.touches?.[0]?.clientX
    setIsDragging(true)
  }
  const onPointerMove = (e) => {
    if (!isDragging || startX.current === null) return
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - startX.current
    setDragX(x)
  }
  const onPointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > THRESHOLD) handleAnswer(true)
    else if (dragX < -THRESHOLD) handleAnswer(false)
    else setDragX(0)
    startX.current = null
  }

  const fetchResult = async (score, total) => {
    setResult({ score, analysis: '' })
    let fullText = ''
    try {
      await streamChat(
        `${API_URL}/swipe/result`,
        { characterId: selectedChar.id, score, total },
        content => {
          fullText += content
          setResult(r => ({ ...r, analysis: fullText }))
        }
      )
    } catch {
      setError('Error al generar el resultado.')
    }
  }

  const handleRestart = () => {
    clearInterval(timerRef.current)
    setPhase('chars'); setSelectedChar(null); setCards([]); setCurrentIndex(0)
    setAnswers([]); setLeaving(null); setDragX(0); setIsDragging(false)
    setFeedbackData(null); setResult({ score: null, analysis: '' }); setError(null)
    setTimeLeft(15); setStreak(0)
    recordedRef.current = false
  }

  const handleShowExplanation = () => {
    clearTimeout(autoTimerRef.current)
    setFeedbackData(d => ({ ...d, showExplanation: true }))
  }

  if (phase === 'chars') return <SwipeChars navigate={navigate} error={error} onSelectChar={handleCharSelect} />
  if (phase === 'loading') return <SwipeLoading selectedChar={selectedChar} />
  if (phase === 'playing') return (
    <SwipePlaying
      selectedChar={selectedChar}
      cards={cards}
      currentIndex={currentIndex}
      leaving={leaving}
      dragX={dragX}
      isDragging={isDragging}
      feedbackData={feedbackData}
      timeLeft={timeLeft}
      streak={streak}
      onAnswer={handleAnswer}
      onRestart={handleRestart}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onShowExplanation={handleShowExplanation}
      onAdvance={() => advanceRef.current?.()}
    />
  )

  return (
    <SwipeResult
      selectedChar={selectedChar}
      result={result}
      answers={answers}
      cards={cards}
      streaming={streaming}
      levelUpToast={levelUpToast}
      dismissLevelUp={dismissLevelUp}
      onRestart={handleRestart}
      onPlayAgain={() => handleCharSelect(selectedChar)}
      navigate={navigate}
    />
  )
}
