import { z } from 'zod'

// ─── Reusables ───────────────────────────────────────────────────────────────

export const CharacterIdSchema = z.string().min(1).max(50)

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(1000),
})

// ─── Chat Base ─────────────────────────────────────────────────────────────────

export const ChatBodySchema = z.object({
  characterId: CharacterIdSchema,
  messages: z.array(MessageSchema).max(50).default([]),
  duoMode: z.object({
    role: z.enum(['A', 'B', 'A2']),
    charName: z.string(),
    otherCharName: z.string(),
    responseA: z.string().optional(),
    responseB: z.string().optional(),
  }).optional(),
  battleMode: z.boolean().optional(),
  confesionarioMode: z.boolean().optional(),
  ultimaCenaMode: z.object({
    role: z.string(),
    otherChars: z.array(z.object({ name: z.string() })).optional(),
    tema: z.string().optional(),
    evento: z.string().optional(),
    previousResponse: z.string().optional(),
  }).optional(),
  affinityLevel: z.number().int().min(0).max(8).optional(),
})

// ─── Story ─────────────────────────────────────────────────────────────────────

export const StoryBodySchema = z.object({
  characterId: CharacterIdSchema,
  scenarioPrompt: z.string().min(1).max(500),
  history: z.array(z.object({
    choice: z.string(),
    narrative: z.string(),
  })).default([]),
})

// ─── Mission ───────────────────────────────────────────────────────────────────

export const MissionBodySchema = z.object({
  characterId: CharacterIdSchema,
  history: z.array(z.object({
    choice: z.string(),
    narrative: z.string(),
  })).default([]),
  playerName: z.string().max(50).optional(),
  difficulty: z.enum(['easy', 'normal', 'hard']).default('normal'),
  missionType: z.enum(['combate', 'infiltracion', 'rescate', 'investigacion']).default('combate'),
  stats: z.object({
    vida: z.number().int().optional(),
    riesgo: z.number().int().optional(),
    sigilo: z.number().int().optional(),
  }).optional(),
  finalResult: z.enum(['win', 'lose']).optional(),
  isCampaign: z.boolean().optional(),
})

// ─── Battle ────────────────────────────────────────────────────────────────────

export const BattleVerdictBodySchema = z.object({
  topic: z.string().min(1).max(200),
  charA: z.object({ name: z.string() }),
  charB: z.object({ name: z.string() }),
  battleLog: z.array(z.object({
    charName: z.string(),
    content: z.string(),
  })),
})

// ─── Confesionario ─────────────────────────────────────────────────────────────

export const ConfesionarioVerdictBodySchema = z.object({
  characterId: CharacterIdSchema,
  exchanges: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).min(1),
})

// ─── Chat Verdict ──────────────────────────────────────────────────────────────

export const ChatVerdictBodySchema = z.object({
  characterId: CharacterIdSchema,
  messages: z.array(MessageSchema).min(1),
})

// ─── Fight ─────────────────────────────────────────────────────────────────────

export const FightRoundBodySchema = z.object({
  playerCharId: CharacterIdSchema,
  enemyCharId: CharacterIdSchema,
  playerHP: z.number().int().min(0),
  enemyHP: z.number().int().min(0),
  round: z.number().int().min(1),
  totalRounds: z.number().int().min(1),
  history: z.array(z.object({
    action: z.string(),
  })).default([]),
  action: z.string().optional(),
})

// ─── Guess ─────────────────────────────────────────────────────────────────────

export const GuessCluesBodySchema = z.object({
  characterId: CharacterIdSchema,
})

export const GuessFeedbackBodySchema = z.object({
  characterId: CharacterIdSchema,
  correct: z.boolean(),
  guessedName: z.string(),
})

// ─── Swipe ─────────────────────────────────────────────────────────────────────

export const SwipeCardsBodySchema = z.object({
  characterId: CharacterIdSchema,
})

export const SwipeResultBodySchema = z.object({
  characterId: CharacterIdSchema,
  score: z.number().int().min(0),
  total: z.number().int().min(1),
})

// ─── Dilema ────────────────────────────────────────────────────────────────────

export const DilemaBodySchema = z.object({
  characterId: CharacterIdSchema,
  dilemmaQuestion: z.string().min(1).max(300),
  choiceLabel: z.string(),
  choiceKey: z.enum(['A', 'B', 'C']),
  choiceHistory: z.array(z.object({
    dilemmaQuestion: z.string(),
    choiceLabel: z.string(),
  })).default([]),
  affinityLevel: z.number().int().min(0).max(8).optional(),
})

// ─── Este o Ese ────────────────────────────────────────────────────────────────

export const EsteOEseQuestionsBodySchema = z.object({
  characterId: CharacterIdSchema,
})

export const EsteOEseResultBodySchema = z.object({
  characterId: CharacterIdSchema,
  answers: z.record(z.string()),
})

// ─── Última Cena ───────────────────────────────────────────────────────────────

export const UltimaCenaSceneBodySchema = z.object({
  chars: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
  })).min(3).max(4),
  trigger: z.string().min(1),
  tema: z.string().optional(),
  sceneFlow: z.string().optional(),
  dialogueRules: z.string().optional(),
  isEvento: z.boolean().optional(),
})

// ─── Custom ────────────────────────────────────────────────────────────────────

export const CustomChatBodySchema = z.object({
  systemPrompt: z.string().min(1).max(2000),
  messages: z.array(MessageSchema).max(50).default([]),
})

// ─── Mission Image Prompts ─────────────────────────────────────────────────────

export const MissionImagePromptBodySchema = z.object({
  characterId: CharacterIdSchema,
  difficulty: z.enum(['easy', 'normal', 'hard']).optional(),
  missionType: z.string().optional(),
})

export const MissionSceneImagePromptBodySchema = z.object({
  narrative: z.string().min(1),
  characterId: z.string().optional(),
  title: z.string().optional(),
  difficulty: z.string().optional(),
  missionType: z.string().optional(),
})
