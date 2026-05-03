import { describe, test, expect } from 'vitest'
import { readSSEStream } from './sse.js'

function makeResponse(chunks) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return { body: stream }
}

describe('readSSEStream', () => {
  test('llama a onChunk con cada token de contenido', async () => {
    const response = makeResponse([
      'data: {"content":"Hola"}\n\ndata: {"content":" mundo"}\n\ndata: [DONE]\n\n',
    ])
    const received = []
    await readSSEStream(response, c => received.push(c))
    expect(received).toEqual(['Hola', ' mundo'])
  })

  test('se detiene al recibir [DONE] e ignora lo que sigue', async () => {
    const response = makeResponse([
      'data: {"content":"primero"}\n\ndata: [DONE]\n\ndata: {"content":"nunca"}\n\n',
    ])
    const received = []
    await readSSEStream(response, c => received.push(c))
    expect(received).toEqual(['primero'])
  })

  test('maneja chunks SSE partidos entre lecturas (bug del buffer)', async () => {
    // La línea SSE está dividida en dos reads
    const response = makeResponse([
      'data: {"cont',
      'ent":"hola"}\n\ndata: [DONE]\n\n',
    ])
    const received = []
    await readSSEStream(response, c => received.push(c))
    expect(received).toEqual(['hola'])
  })

  test('ignora líneas con JSON malformado', async () => {
    const response = makeResponse([
      'data: not-valid-json\n\ndata: {"content":"ok"}\n\ndata: [DONE]\n\n',
    ])
    const received = []
    await readSSEStream(response, c => received.push(c))
    expect(received).toEqual(['ok'])
  })

  test('lanza error si el servidor envía campo error en el stream', async () => {
    const response = makeResponse([
      'data: {"error":"Rate limit exceeded"}\n\n',
    ])
    await expect(readSSEStream(response, () => {})).rejects.toThrow('Rate limit exceeded')
  })

  test('resuelve normalmente cuando el stream termina sin [DONE]', async () => {
    const response = makeResponse(['data: {"content":"tok"}\n\n'])
    const received = []
    await readSSEStream(response, c => received.push(c))
    expect(received).toEqual(['tok'])
  })

  test('ignora líneas que no empiezan con data:', async () => {
    const response = makeResponse([
      'event: message\ndata: {"content":"ok"}\n\ndata: [DONE]\n\n',
    ])
    const received = []
    await readSSEStream(response, c => received.push(c))
    expect(received).toEqual(['ok'])
  })
})
