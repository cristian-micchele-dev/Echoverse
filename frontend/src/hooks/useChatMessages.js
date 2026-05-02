import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { chatHistoryKey, MAX_STORED_MESSAGES } from '../utils/constants'
import { API_URL } from '../config/api.js'
import { saveSession } from '../utils/session'
import { playNotificationSound, detectReaction, updateHistoryMeta } from '../pages/chat/utils.js'

/**
 * Gestiona el ciclo de vida completo de los mensajes de un chat:
 * persistencia en localStorage, sincronización con la BD, reacciones,
 * sonido de notificación, afinidad y logros.
 */
export function useChatMessages({ characterId, character, session, isCustom, isLoading, checkAndUnlock }) {
  const storageKey = chatHistoryKey(characterId)
  const userReactionsKey = `reactions-${characterId}`

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  // Derivado de messages — no requiere estado separado
  const reactions = useMemo(() => {
    const result = {}
    messages.forEach((msg, i) => {
      if (msg.role === 'assistant' && msg.content) {
        const reaction = detectReaction(msg.content)
        if (reaction) result[i] = reaction
      }
    })
    return result
  }, [messages])
  const [userReactions, setUserReactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(userReactionsKey) || '{}') } catch { return {} }
  })
  const [cloudSaved, setCloudSaved] = useState(false)
  const prevIsLoadingRef = useRef(false)

  // Cargar historial desde BD al montar (solo chars oficiales con sesión activa)
  useEffect(() => {
    if (!session || !characterId || isCustom) return
    fetch(`${API_URL}/db/chat-history/${characterId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(r => r.json())
      .then(dbMessages => {
        if (Array.isArray(dbMessages) && dbMessages.length > 0) {
          setMessages(dbMessages)
        }
        // BD es la fuente de verdad — limpiar posible localStorage stale
        try { localStorage.removeItem(storageKey) } catch { /* unavailable */ }
      })
      .catch(() => {})
  }, [session, characterId, isCustom, storageKey])

  // Persistir mensajes en localStorage solo para usuarios no logueados y personajes custom
  // Para usuarios logueados con chars oficiales, la BD es la única fuente de verdad
  useEffect(() => {
    if (session && !isCustom) return
    if (messages.length === 0) return
    try {
      const toSave = messages.filter(m => !m.isVerdict).slice(-MAX_STORED_MESSAGES)
      localStorage.setItem(storageKey, JSON.stringify(toSave))
    } catch { /* localStorage unavailable */ }
  }, [messages, storageKey, session, isCustom])

  // Persistir reacciones del usuario en localStorage
  useEffect(() => {
    try { localStorage.setItem(userReactionsKey, JSON.stringify(userReactions)) } catch { /* localStorage unavailable */ }
  }, [userReactions, userReactionsKey])

  // Al completarse una respuesta: reacciones, sonido, historial, cloud save, afinidad, logros
  useEffect(() => {
    if (prevIsLoadingRef.current && !isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant' && lastMsg.content && !lastMsg.isVerdict) {
        playNotificationSound(character?.notificationTone || 'default')
        updateHistoryMeta(characterId, messages.length)
        saveSession({
          characterId,
          characterName: character?.name || '',
          modeLabel: 'Chat 1 a 1',
          route: `/chat/${characterId}`,
          lastMessage: lastMsg.content?.slice(0, 120) || '',
        })
        if (session && !isCustom) {
          const toSave = messages.slice(-MAX_STORED_MESSAGES)
          fetch(`${API_URL}/db/chat-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ characterId, messages: toSave })
          }).then(() => {
            setCloudSaved(true)
            setTimeout(() => setCloudSaved(false), 2500)
          }).catch(() => {})
          fetch(`${API_URL}/db/affinity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ characterId, messageCount: messages.length })
          }).catch(() => {})
          checkAndUnlock({ totalMessages: messages.length })
        }
      }
    }
    prevIsLoadingRef.current = isLoading
  }, [isLoading, messages, character, characterId, session, checkAndUnlock, isCustom])

  const handleUserReact = useCallback((msgIndex, emoji) => {
    setUserReactions(prev => {
      if (prev[msgIndex] === emoji) {
        const next = { ...prev }
        delete next[msgIndex]
        return next
      }
      return { ...prev, [msgIndex]: emoji }
    })
  }, [])

  // Limpia mensajes, reacciones y persistencia (el confirm queda en quien llama)
  const clearMessages = useCallback(() => {
    setMessages([])
    setUserReactions({})
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(userReactionsKey)
    } catch { /* localStorage unavailable */ }
    if (session && !isCustom) {
      fetch(`${API_URL}/db/chat-history/${characterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).catch(() => {})
    }
  }, [storageKey, userReactionsKey, session, isCustom, characterId])

  return { messages, setMessages, reactions, userReactions, cloudSaved, handleUserReact, clearMessages }
}
