import { Router } from 'express'
import OpenAI from 'openai'
import { supabase } from '../config/supabase.js'
import { characters } from '../data/characters.js'
import { BASE_PROMPT } from '../data/prompts.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: 'https://api.mistral.ai/v1'
})

const MAX_CONTEXT_MESSAGES = 10
const MAX_ROOM_TOKENS = 350

function buildRoomSystemPrompt(character) {
  return `${BASE_PROMPT}

${character.systemPrompt}

CONTEXTO: Estás en una sala de chat grupal donde varios usuarios reales conversan contigo al mismo tiempo. Cada mensaje lleva el nombre del usuario entre corchetes. Respondé de forma natural y en carácter. Podés dirigirte al usuario por su nombre si es natural en la conversación. Respondé en 2-3 oraciones máximo. SIEMPRE en español.`
}

// ─── GET /api/rooms ───────────────────────────────────────────────────────────

router.get('/rooms', async (req, res) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, character_id, name, created_at, is_ai_responding')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// ─── POST /api/rooms ──────────────────────────────────────────────────────────

router.post('/rooms', requireAuth, async (req, res) => {
  const { characterId, name } = req.body
  if (!characterId) return res.status(400).json({ error: 'characterId requerido' })
  if (!characters[characterId]) return res.status(404).json({ error: 'Personaje no encontrado' })

  const { data, error } = await supabase
    .from('rooms')
    .insert({ character_id: characterId, name: name?.trim() || null, created_by: req.user.id })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// ─── GET /api/rooms/:roomId ───────────────────────────────────────────────────

router.get('/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params

  const [roomResult, messagesResult] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', roomId).single(),
    supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(40)
  ])

  if (roomResult.error || !roomResult.data) {
    return res.status(404).json({ error: 'Sala no encontrada' })
  }

  res.json({ room: roomResult.data, messages: messagesResult.data ?? [] })
})

// ─── POST /api/rooms/:roomId/messages ─────────────────────────────────────────

router.post('/rooms/:roomId/messages', requireAuth, async (req, res) => {
  const { roomId } = req.params
  const { content } = req.body
  const username = req.user.user_metadata?.username || req.user.email?.split('@')[0] || 'Usuario'

  if (!content?.trim()) return res.status(400).json({ error: 'content requerido' })

  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('is_active', true)
    .single()

  if (roomErr || !room) return res.status(404).json({ error: 'Sala no encontrada o inactiva' })
  if (room.is_ai_responding) return res.status(429).json({ error: 'El personaje ya está respondiendo, esperá un momento' })

  const character = characters[room.character_id]
  if (!character) return res.status(500).json({ error: 'Personaje de la sala no encontrado' })

  // Insertar mensaje del usuario
  await supabase.from('room_messages').insert({
    room_id: roomId,
    user_id: req.user.id,
    username,
    role: 'user',
    content: content.trim()
  })

  // Marcar que la IA está respondiendo
  await supabase.from('rooms').update({ is_ai_responding: true }).eq('id', roomId)

  // Responder al cliente inmediatamente — el streaming ocurre en background
  res.json({ ok: true })

  streamToRoom(roomId, character).catch(err => {
    console.error(`[rooms] Error streaming en sala ${roomId}:`, err.message)
    supabase.from('rooms').update({ is_ai_responding: false }).eq('id', roomId)
  })
})

// ─── PATCH /api/rooms/:roomId/close ───────────────────────────────────────────

router.patch('/rooms/:roomId/close', requireAuth, async (req, res) => {
  const { data: room } = await supabase
    .from('rooms')
    .select('created_by')
    .eq('id', req.params.roomId)
    .single()

  if (!room) return res.status(404).json({ error: 'Sala no encontrada' })
  if (room.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Solo el creador puede cerrar la sala' })
  }

  await supabase.from('rooms').update({ is_active: false }).eq('id', req.params.roomId)
  res.json({ ok: true })
})

// ─── Background: Mistral → broadcast → persistir ─────────────────────────────

async function streamToRoom(roomId, character) {
  // Obtener contexto reciente
  const { data: recentMsgs } = await supabase
    .from('room_messages')
    .select('role, content, username')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(MAX_CONTEXT_MESSAGES)

  const context = (recentMsgs ?? []).reverse().map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.role === 'user' ? `[${m.username}]: ${m.content}` : m.content
  }))

  const systemPrompt = buildRoomSystemPrompt(character)

  // Suscribir canal de broadcast para esta sala
  const channel = supabase.channel(`room-broadcast:${roomId}`, {
    config: { broadcast: { self: false, ack: false } }
  })
  await new Promise(resolve => {
    channel.subscribe(status => { if (status === 'SUBSCRIBED') resolve() })
  })

  let fullContent = ''

  try {
    const stream = await mistral.chat.completions.create({
      model: 'mistral-small-latest',
      messages: [{ role: 'system', content: systemPrompt }, ...context],
      stream: true,
      max_tokens: MAX_ROOM_TOKENS
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || ''
      if (text) {
        fullContent += text
        channel.send({
          type: 'broadcast',
          event: 'ai_chunk',
          payload: { content: text }
        })
      }
    }
  } finally {
    // Persistir respuesta completa
    await supabase.from('room_messages').insert({
      room_id: roomId,
      role: 'assistant',
      username: character.name,
      content: fullContent.trim() || '...'
    })

    channel.send({ type: 'broadcast', event: 'ai_done', payload: {} })
    await supabase.removeChannel(channel)
    await supabase.from('rooms').update({ is_ai_responding: false }).eq('id', roomId)
  }
}

export default router
