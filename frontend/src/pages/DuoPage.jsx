import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import { fetchCharResponse, buildHistory } from './duo/utils.js'
import DuoSetup from './duo/DuoSetup.jsx'
import DuoChat from './duo/DuoChat.jsx'
import './DuoPage.css'

export default function DuoPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)

  const [charA, setCharA] = useState(null)
  const [charB, setCharB] = useState(null)
  const [phase, setPhase] = useState('setup')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [typingChar, setTypingChar] = useState(null)
  const [search, setSearch] = useState('')

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (phase === 'chat' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'duo')
    }
  }, [phase, session])

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const detectAddressed = (text, a, b) => {
    const lower = text.toLowerCase()
    const wordsA = a.name.toLowerCase().split(' ')
    const wordsB = b.name.toLowerCase().split(' ')
    const mentionsA = wordsA.some(w => w.length > 2 && lower.includes(w))
    const mentionsB = wordsB.some(w => w.length > 2 && lower.includes(w))
    if (mentionsA && !mentionsB) return 'A'
    if (mentionsB && !mentionsA) return 'B'
    return 'both'
  }

  const selectChar = (char) => {
    if (!charA) { setCharA(char); return }
    if (charA.id === char.id) { setCharA(null); return }
    if (!charB) { setCharB(char); return }
    if (charB.id === char.id) { setCharB(null); return }
    setCharB(char)
  }

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const addressed = detectAddressed(trimmed, charA, charB)
    const userMsg = { role: 'user', content: trimmed }
    const updatedMsgs = [...messages, userMsg]
    setMessages(updatedMsgs)
    setInput('')
    setIsLoading(true)
    scrollToBottom()

    try {
      if (addressed === 'A' || addressed === 'both') {
        setTypingChar('charA')
        const histA = buildHistory(updatedMsgs, charA.id)
        const responseA = await fetchCharResponse(charA.id, histA, { role: 'A', otherCharName: charB.name })
        const msgA = { role: 'charA', content: responseA, char: charA }
        updatedMsgs.push(msgA)
        setMessages([...updatedMsgs])
        scrollToBottom()

        if (addressed === 'both') {
          setTypingChar('charB')
          const histB = buildHistory(updatedMsgs, charB.id)
          const responseB = await fetchCharResponse(charB.id, histB, { role: 'B', otherCharName: charA.name, responseA })
          const msgB = { role: 'charB', content: responseB, char: charB }
          updatedMsgs.push(msgB)
          setMessages([...updatedMsgs])
          scrollToBottom()

          setTypingChar(null)
          const histA2 = buildHistory(updatedMsgs, charA.id)
          const responseA2 = await fetchCharResponse(charA.id, histA2, { role: 'A2', otherCharName: charB.name, responseB })
          if (responseA2.trim() !== '[SKIP]') {
            const msgA2 = { role: 'charA', content: responseA2, char: charA, isRemate: true }
            updatedMsgs.push(msgA2)
            setMessages([...updatedMsgs])
            scrollToBottom()
          }
        }
      } else if (addressed === 'B') {
        setTypingChar('charB')
        const histB = buildHistory(updatedMsgs, charB.id)
        const responseB = await fetchCharResponse(charB.id, histB, { role: 'A', otherCharName: charA.name })
        const msgB = { role: 'charB', content: responseB, char: charB }
        updatedMsgs.push(msgB)
        setMessages([...updatedMsgs])
        scrollToBottom()
      }
    } catch {
      setMessages(prev => [...prev, { role: 'charA', content: 'Error al conectar con el servidor.', char: charA }])
    } finally {
      setIsLoading(false)
      setTypingChar(null)
      inputRef.current?.focus()
    }
  }, [input, isLoading, messages, charA, charB])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (phase === 'setup') {
    return (
      <DuoSetup
        charA={charA}
        charB={charB}
        search={search}
        onSelectChar={selectChar}
        onSetSearch={setSearch}
        onStart={() => setPhase('chat')}
        navigate={navigate}
      />
    )
  }

  return (
    <DuoChat
      charA={charA}
      charB={charB}
      messages={messages}
      input={input}
      isLoading={isLoading}
      typingChar={typingChar}
      onSend={sendMessage}
      onInputChange={e => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      onBack={() => { setPhase('setup'); setMessages([]); recordedRef.current = false }}
      bottomRef={bottomRef}
      inputRef={inputRef}
    />
  )
}
