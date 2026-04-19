import OpenAI from 'openai'

export const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: 'https://api.mistral.ai/v1'
})

export function initSseResponse(res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
}

export function sendSseError(res, message) {
  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
}

export async function streamMistral(res, systemPrompt, messages, maxTokens = 512) {
  const cleanMessages = messages.map(({ role, content }) => ({ role, content }))
  const stream = await mistral.chat.completions.create({
    model: 'mistral-small-latest',
    messages: [{ role: 'system', content: systemPrompt }, ...cleanMessages],
    stream: true,
    max_tokens: maxTokens
  })
  for await (const chunk of stream) {
    if (res.writableEnded) break
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`)
  }
  if (!res.writableEnded) {
    res.write('data: [DONE]\n\n')
    res.end()
  }
}
