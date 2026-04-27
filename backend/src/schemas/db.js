import { z } from 'zod'

export const chatHistorySchema = z.object({
  characterId: z.string().min(1).max(64),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(8000)
  })).max(100)
})

export const affinitySchema = z.object({
  characterId: z.string().min(1).max(64),
  messageCount: z.number().int().min(0).max(10000)
})

export const dilemaSeenSchema = z.object({
  dilemaIds: z.array(z.string().max(64)).max(200)
})

export const missionProgressSchema = z.object({
  highestUnlocked: z.number().int().min(1).max(31),
  completedLevels: z.record(z.string(), z.unknown())
})
