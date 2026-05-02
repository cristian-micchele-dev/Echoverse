import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { characters } from '../data/characters.js'
import { BASE_PROMPT } from '../data/prompts.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { streamMistralGenerator } from '../utils/mistral.js'

const router = Router()

// Rastreo en memoria de cuándo se adquirió el lock de is_ai_responding por sala.
// Permite detectar locks stale sin cambio de schema en la BD.
const respondingSince = new Map() // roomId → timestamp
const RESPONDING_TIMEOUT_MS = 90_000 // 90s — tiempo máximo razonable para una respuesta

// Convierte 'john-wick' → 'John Wick' para usarlo como username del personaje
function charIdToName(id) {
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const MAX_CONTEXT_MESSAGES = 20
const MAX_ROOM_TOKENS = 550

function buildRoomSystemPrompt(character, participants = []) {
  const names = participants.length
    ? `Los participantes actuales son: ${participants.join(', ')}.`
    : 'Hay varios participantes en la sala.'

  return `${BASE_PROMPT}

${character.systemPrompt}

CONTEXTO GRUPAL: Estás en una sala de chat en vivo con múltiples usuarios simultáneos. ${names}
- Cada mensaje lleva el nombre del usuario entre corchetes. Usá esos nombres para dirigirte a ellos.
- Seguí el hilo de la conversación: retomá puntos anteriores, recordá lo que dijo cada usuario y construí sobre eso. No repitas ideas que ya desarrollaste.
- Creá dinámicas entre participantes: señalá contradicciones, confrontá a uno con lo que dijo otro, hacé preguntas dirigidas a alguien específico.
- Si alguien cambió de tema, podés notarlo en personaje antes de responder.
- Respondés en español, completamente en personaje, sin romper el rol. Desarrollá la respuesta lo necesario para que sea coherente con el hilo, sin ser redundante.
- Cuando recibas un mensaje con el prefijo "⚡ EVENTO DRAMÁTICO:", reaccioná con intensidad narrativa total como si fuera real, en primera persona, dirigiéndote a todos los presentes.`
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
  const { content, type = 'message', participants = [] } = req.body
  const username = req.user.user_metadata?.username || req.user.email?.split('@')[0] || 'Usuario'

  if (!content?.trim()) return res.status(400).json({ error: 'content requerido' })
  if (content.length > 500) return res.status(400).json({ error: 'Mensaje demasiado largo (máx. 500 caracteres)' })

  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('is_active', true)
    .single()

  if (roomErr || !room) return res.status(404).json({ error: 'Sala no encontrada o inactiva' })

  if (room.is_ai_responding) {
    const since = respondingSince.get(roomId)
    const isStale = !since || Date.now() - since > RESPONDING_TIMEOUT_MS
    if (isStale) {
      // Lock stale (proceso murió o bug en cleanup) — auto-liberar
      await supabase.from('rooms').update({ is_ai_responding: false }).eq('id', roomId)
      respondingSince.delete(roomId)
    } else {
      return res.status(429).json({ error: 'El personaje ya está respondiendo, esperá un momento' })
    }
  }

  const character = characters[room.character_id]
  if (!character) return res.status(500).json({ error: 'Personaje de la sala no encontrado' })

  // Insertar mensaje del usuario con type
  await supabase.from('room_messages').insert({
    room_id: roomId,
    user_id: req.user.id,
    username,
    role: 'user',
    content: content.trim(),
    type
  })

  // Marcar que la IA está respondiendo y registrar el timestamp en memoria
  await supabase.from('rooms').update({ is_ai_responding: true }).eq('id', roomId)
  respondingSince.set(roomId, Date.now())

  // Responder al cliente inmediatamente — el streaming ocurre en background
  res.json({ ok: true })

  // Para eventos, prefijamos el contenido para que la IA reaccione con intensidad
  const aiContent = type === 'event'
    ? `⚡ EVENTO DRAMÁTICO: ${content.trim()}`
    : content.trim()

  streamToRoom(roomId, character, aiContent, participants).catch(err => {
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

// ─── DELETE /api/rooms/:roomId (admin) ────────────────────────────────────────

router.delete('/rooms/:roomId', requireAuth, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', req.params.roomId)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ─── Background: Mistral → broadcast → persistir ─────────────────────────────

async function streamToRoom(roomId, character, latestContent = '', participants = []) {
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

  const systemPrompt = buildRoomSystemPrompt(character, participants)

  // Suscribir canal de broadcast para esta sala
  const channel = supabase.channel(`room-broadcast:${roomId}`, {
    config: { broadcast: { self: false, ack: false } }
  })
  await new Promise(resolve => {
    channel.subscribe(status => { if (status === 'SUBSCRIBED') resolve() })
  })

  let fullContent = ''

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000)

  try {
    for await (const text of streamMistralGenerator(systemPrompt, context, MAX_ROOM_TOKENS, controller.signal)) {
      fullContent += text
      channel.send({
        type: 'broadcast',
        event: 'ai_chunk',
        payload: { content: text }
      })
    }
  } finally {
    clearTimeout(timeoutId)
    // Persistir respuesta completa
    await supabase.from('room_messages').insert({
      room_id: roomId,
      role: 'assistant',
      username: character.name || charIdToName(character.id),
      content: fullContent.trim() || '...'
    })

    channel.send({ type: 'broadcast', event: 'ai_done', payload: {} })
    await supabase.removeChannel(channel)
    await supabase.from('rooms').update({ is_ai_responding: false }).eq('id', roomId)
    respondingSince.delete(roomId)
  }
}

export default router
