import { Router } from 'express'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

const router = Router()
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

const VOICES = {
  frodo:          { voiceId: 'ErXwobaYiN019PkySvjV', stability: 0.70, similarity_boost: 0.80 }, // Antoni — cálido
  'john-wick':    { voiceId: 'VR6AewLTigWG4xSOukaG', stability: 0.95, similarity_boost: 0.85 }, // Arnold — seco
  'walter-white': { voiceId: 'TxGEqnHWrfWFTfGW9XjX', stability: 0.80, similarity_boost: 0.82 }, // Josh — calculado
  'darth-vader':  { voiceId: 'pNInz6obpgDQGcFmaJgB', stability: 0.90, similarity_boost: 0.92 }, // Adam — grave
  'tony-stark':   { voiceId: 'yoZ06aMxZJJ28mfd3POQ', stability: 0.40, similarity_boost: 0.75 }, // Sam — energético
  sherlock:       { voiceId: 'ErXwobaYiN019PkySvjV', stability: 0.85, similarity_boost: 0.88 }, // Antoni — preciso
  'jack-sparrow': { voiceId: 'yoZ06aMxZJJ28mfd3POQ', stability: 0.20, similarity_boost: 0.60 }, // Sam — caótico
  gandalf:        { voiceId: 'pNInz6obpgDQGcFmaJgB', stability: 0.78, similarity_boost: 0.84 }, // Adam — sabio
}

router.post('/tts', async (req, res) => {
  const { text, characterId } = req.body
  if (!text || !characterId) return res.status(400).json({ error: 'Faltan parámetros' })

  const voice = VOICES[characterId] || VOICES.frodo

  try {
    const audio = await elevenlabs.textToSpeech.convert(voice.voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
      voiceSettings: {
        stability: voice.stability,
        similarityBoost: voice.similarity_boost
      }
    })

    res.setHeader('Content-Type', 'audio/mpeg')

    for await (const chunk of audio) {
      res.write(chunk)
    }
    res.end()
  } catch (error) {
    console.error('Error ElevenLabs:', error.message)
    res.status(500).json({ error: 'Error al generar voz' })
  }
})

export default router
