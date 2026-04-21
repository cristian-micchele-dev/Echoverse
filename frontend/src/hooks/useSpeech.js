import { useState, useEffect } from 'react'

export function useSpeech() {
  const [speakingId, setSpeakingId] = useState(null)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Cancelar al desmontar
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel()
    }
  }, [isSupported])

  function speak(id, text, voiceConfig = {}) {
    if (!isSupported) return
    window.speechSynthesis.cancel()

    // Toggle: si ya estaba hablando este mensaje, parar
    if (speakingId === id) {
      setSpeakingId(null)
      return
    }

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'es-ES'
    utter.pitch = voiceConfig.pitch ?? 1
    utter.rate = voiceConfig.rate ?? 1
    utter.onend = () => setSpeakingId(null)
    utter.onerror = () => setSpeakingId(null)
    window.speechSynthesis.speak(utter)
    setSpeakingId(id)
  }

  function stop() {
    if (isSupported) window.speechSynthesis.cancel()
    setSpeakingId(null)
  }

  return { speak, stop, speakingId, isSupported }
}
