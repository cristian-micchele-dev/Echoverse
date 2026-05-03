import { useState } from 'react'
import { readSSEStream } from '../utils/api/sse'

/**
 * Encapsula la lógica de consumo de SSE streaming.
 *
 * Devuelve:
 *  - isTyping: true mientras llega el primer token (indicador de "escribiendo...")
 *  - isLoading: true durante toda la duración del stream
 *  - streamChat: función que inicia el stream y llama callbacks por token
 */
export function useStreaming() {
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * @param {string} url - Endpoint a llamar
   * @param {object} payload - Body del POST
   * @param {(content: string, isFirst: boolean) => void} onChunk - Callback por token
   * @param {{ delay?: number, headers?: object }} options
   * @returns {Promise<void>}
   */
  async function streamChat(url, payload, onChunk, options = {}) {
    const { delay = 0, headers: extraHeaders = {} } = options
    setIsLoading(true)
    setIsTyping(true)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...extraHeaders },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        const err = new Error('HTTP error')
        err.status = response.status
        throw err
      }

      let firstChunk = true
      await readSSEStream(response, async content => {
        const isFirst = firstChunk
        if (firstChunk) {
          setIsTyping(false)
          firstChunk = false
        }
        if (delay > 0) await new Promise(r => setTimeout(r, delay))
        onChunk(content, isFirst)
      })
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  return { isTyping, isLoading, streamChat }
}
