import { useState, useEffect, useRef } from 'react'
import { characterMap } from '../data/characters'
import { getRandomQuestions, MATCH_DESCRIPTIONS, computeUserProfile, rankCharacters } from '../data/parecidoQuiz'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/api/recordCompletion'
import ParecidoIntro from './parecido/ParecidoIntro.jsx'
import ParecidoPlaying from './parecido/ParecidoPlaying.jsx'
import ParecidoResult from './parecido/ParecidoResult.jsx'
import './ParecidoPage.css'

export default function ParecidoPage() {
  const { session } = useAuth()
  const recordedRef = useRef(false)
  const [bgVisible, setBgVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setBgVisible(true)) }, [])

  const [phase, setPhase]                    = useState('intro')
  const [activeQuestions, setActiveQuestions] = useState([])
  const [currentIndex, setCurrentIndex]      = useState(0)
  const [answers, setAnswers]                = useState([])
  const [selected, setSelected]              = useState(null)
  const [animating, setAnimating]            = useState(false)
  const [topMatches, setTopMatches]          = useState([])
  const [userProfile, setUserProfile]        = useState(null)
  const [copied, setCopied]                  = useState(false)

  useEffect(() => {
    if (phase === 'result' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'parecido')
    }
  }, [phase, session])

  function handleStart() {
    setActiveQuestions(getRandomQuestions(15))
    setCurrentIndex(0)
    setAnswers([])
    setSelected(null)
    setAnimating(false)
    setTopMatches([])
    setPhase('playing')
  }

  function handleAnswer(optIdx) {
    if (animating) return
    setSelected(optIdx)
    setAnimating(true)

    const vector = activeQuestions[currentIndex].options[optIdx].vector
    const newAnswers = [...answers, vector]

    setTimeout(() => {
      if (currentIndex + 1 >= activeQuestions.length) {
        const profile = computeUserProfile(newAnswers)
        const top3 = rankCharacters(profile)
        const enriched = top3.map(({ id, matchPct }) => ({
          id,
          matchPct,
          char: characterMap[id],
          description: MATCH_DESCRIPTIONS[id] || '',
        }))
        setUserProfile(profile)
        setTopMatches(enriched)
        setPhase('result')
      } else {
        setCurrentIndex(i => i + 1)
        setSelected(null)
        setAnimating(false)
      }
    }, 380)
  }

  function handleRestart() {
    setPhase('intro')
    setCurrentIndex(0)
    setAnswers([])
    setSelected(null)
    setAnimating(false)
    setTopMatches([])
    setUserProfile(null)
    setCopied(false)
  }

  function handleShare() {
    const top = topMatches[0]
    if (!top?.char) return
    const text = `Soy ${top.matchPct}% compatible con ${top.char.name} en EchoVerse ¿Y vos?`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (phase === 'intro') {
    return <ParecidoIntro bgVisible={bgVisible} onStart={handleStart} />
  }

  if (phase === 'playing') {
    return (
      <ParecidoPlaying
        bgVisible={bgVisible}
        question={activeQuestions[currentIndex]}
        currentIndex={currentIndex}
        total={activeQuestions.length}
        selected={selected}
        animating={animating}
        onAnswer={handleAnswer}
        onAbort={handleRestart}
      />
    )
  }

  return (
    <ParecidoResult
      bgVisible={bgVisible}
      topMatches={topMatches}
      userProfile={userProfile}
      copied={copied}
      onShare={handleShare}
      onRestart={handleRestart}
    />
  )
}
