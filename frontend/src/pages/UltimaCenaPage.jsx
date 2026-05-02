import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MESA_TEMAS } from '../data/mesaTemas'
import { readSSEStream } from '../utils/sse'
import { parseSseLine } from '../utils/ultimaCenaHelpers'
import { useAuth } from '../context/AuthContext'
import { recordCompletion } from '../utils/recordCompletion'
import { SCROLL_DELAY_MS } from './ultimaCena/constants.js'
import CenaSetup from './ultimaCena/CenaSetup.jsx'
import CenaMesa from './ultimaCena/CenaMesa.jsx'
import './UltimaCenaPage.css'
import { API_URL } from '../config/api.js'

export default function UltimaCenaPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const recordedRef = useRef(false)

  const [selected, setSelected] = useState([])
  const [tema, setTema] = useState('libre')
  const [phase, setPhase] = useState('setup')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [streamingChar, setStreamingChar] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    if (phase === 'mesa' && !recordedRef.current) {
      recordedRef.current = true
      recordCompletion(session, 'ultima-cena')
    }
  }, [phase, session])

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const selectedRef = useRef(selected)
  const isLoadingRef = useRef(false)
  selectedRef.current = selected

  const currentTema = MESA_TEMAS.find(t => t.id === tema) ?? MESA_TEMAS[0]

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), SCROLL_DELAY_MS)
  }

  const toggleChar = (char) => {
    if (selected.find(c => c.id === char.id)) {
      setSelected(prev => prev.filter(c => c.id !== char.id))
    } else if (selected.length < 4) {
      setSelected(prev => [...prev, char])
    }
  }

  const generateScene = useCallback(async (trigger, isEvento = false) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    const currentSelected = selectedRef.current

    const triggerMsg = isEvento
      ? { role: 'evento', content: trigger }
      : { role: 'user', content: trigger }

    setMessages(prev => [...prev, triggerMsg])
    setIsLoading(true)
    scrollToBottom()

    let lineBuffer = ''

    const handleSseLine = (line) =>
      parseSseLine(line, currentSelected, setStreamingChar, setMessages, scrollToBottom)

    try {
      const response = await fetch(`${API_URL}/ultima-cena/scene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chars: currentSelected.map(c => ({ id: c.id, name: c.name })),
          trigger,
          tema: currentTema.prompt,
          sceneFlow: currentTema.sceneFlow,
          dialogueRules: currentTema.dialogueRules,
          isEvento
        })
      })

      if (!response.ok) throw new Error(`Error ${response.status}`)

      await readSSEStream(response, chunk => {
        lineBuffer += chunk
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop()
        for (const line of lines) handleSseLine(line)
      })

      if (lineBuffer.trim()) handleSseLine(lineBuffer)
    } catch {
      setMessages(prev => [...prev, { role: 'evento', content: 'Error de conexión. Intentá de nuevo.' }])
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
      setStreamingChar(null)
      inputRef.current?.focus()
    }
  }, [currentTema])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoadingRef.current) return
    setInput('')
    await generateScene(trimmed, false)
  }, [input, generateScene])

  const triggerEvento = useCallback(async () => {
    if (isLoadingRef.current) return
    const pool = currentTema.eventos
    const evento = pool[Math.floor(Math.random() * pool.length)]
    await generateScene(evento, true)
  }, [generateScene, currentTema])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (phase === 'setup') {
    return (
      <CenaSetup
        visible={visible}
        selected={selected}
        tema={tema}
        search={search}
        onToggleChar={toggleChar}
        onSetTema={setTema}
        onSetSearch={setSearch}
        onStart={() => setPhase('mesa')}
        navigate={navigate}
      />
    )
  }

  return (
    <CenaMesa
      visible={visible}
      selected={selected}
      messages={messages}
      input={input}
      isLoading={isLoading}
      streamingChar={streamingChar}
      currentTema={currentTema}
      tema={tema}
      onSend={sendMessage}
      onTriggerEvento={triggerEvento}
      onInputChange={e => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      onBack={() => { setPhase('setup'); setMessages([]); recordedRef.current = false }}
      bottomRef={bottomRef}
      inputRef={inputRef}
      generateScene={generateScene}
    />
  )
}
