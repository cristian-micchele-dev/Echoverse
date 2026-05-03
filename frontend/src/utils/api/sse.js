/**
 * Reads a server-sent events (SSE) response stream.
 * Calls onChunk(content) for each content token received.
 * Resolves when [DONE] is received or the stream ends.
 * Re-throws server-side errors sent via the `error` field.
 */
export async function readSSEStream(response, onChunk) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder(undefined, { fatal: false })
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return

      let parsed
      try {
        parsed = JSON.parse(data)
      } catch {
        continue // línea incompleta o malformada, ignorar
      }

      const { content, error } = parsed
      if (error) throw new Error(error)
      if (content) await onChunk(content)
    }
  }
}
