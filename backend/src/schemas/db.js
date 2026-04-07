import { z } from 'zod'

export const chatHistorySchema = z.object({
  characterId: z.string().min(1),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  }))
})

export const affinitySchema = z.object({
  characterId: z.string().min(1),
  messageCount: z.number().int().min(0)
})

export const dilemaSeenSchema = z.object({
  dilemaIds: z.array(z.string())
})

export const missionProgressSchema = z.object({
  highestUnlocked: z.number().int().min(1),
  completedLevels: z.any()
})
