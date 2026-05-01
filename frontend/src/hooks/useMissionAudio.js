import { useState, useRef, useEffect } from 'react'

const MISSION_TRACKS = [
  '/sounds/ArcSound - Dark Suspense Cinematic.mp3',
  '/sounds/ArcSound - Cinema Cinematic Trailer.mp3',
]
let trackIndex = 0

export function useMissionAudio(phase) {
  const [muted, setMuted] = useState(false)
  const audioRef = useRef(null)
  const mutedRef = useRef(false)

  useEffect(() => {
    mutedRef.current = muted
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  useEffect(() => {
    if (phase !== 'playing') return

    const track = MISSION_TRACKS[trackIndex % MISSION_TRACKS.length]
    trackIndex++
    const audio = new Audio(track)
    audio.loop = true
    audio.volume = 0
    audio.muted = mutedRef.current
    audio.play().catch(() => {})
    audioRef.current = audio

    let v = 0
    const fadeIn = setInterval(() => {
      v = Math.min(v + 0.02, 0.35)
      audio.volume = v
      if (v >= 0.35) clearInterval(fadeIn)
    }, 80)

    return () => {
      clearInterval(fadeIn)
      let vol = audio.volume
      const fadeOut = setInterval(() => {
        vol = Math.max(vol - 0.04, 0)
        audio.volume = vol
        if (vol <= 0) {
          clearInterval(fadeOut)
          audio.pause()
          audio.src = ''
        }
      }, 50)
    }
  }, [phase])

  return { muted, setMuted }
}
