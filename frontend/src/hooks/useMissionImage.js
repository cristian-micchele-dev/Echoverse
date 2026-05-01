import { useState, useRef, useEffect } from 'react'
import { API_URL } from '../config/api.js'

export function useMissionImage() {
  const [sceneImage, setSceneImage] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [sceneKey, setSceneKey] = useState(0)
  const objectUrlRef = useRef(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (sceneImage) setImageError(false)
  }, [sceneImage])

  const bumpSceneKey = () => setSceneKey(k => k + 1)

  const resetImageState = () => {
    setSceneImage(null)
    setImageError(false)
    setImageLoading(false)
  }

  const fetchMissionImage = async (char, currentDifficulty, currentMissionType, narrative = '', title = '') => {
    setImageError(false)
    setImageLoading(true)

    try {
      const promptRes = await fetch(`${API_URL}/mission/scene-image-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narrative,
          characterId: char.id,
          title,
          difficulty: currentDifficulty,
          missionType: currentMissionType,
        })
      })
      const data = await promptRes.json()
      const imagePrompt = data.imagePrompt || ''

      if (!imagePrompt) return

      const seed = [char.id, currentMissionType, currentDifficulty, narrative.slice(0, 60)]
        .join('|')
        .split('')
        .reduce((a, b) => (a * 31 + b.charCodeAt(0)) & 0xfffff, 0)

      const proxyUrl = `${API_URL}/mission/image-proxy?prompt=${encodeURIComponent(imagePrompt)}&width=768&height=432&seed=${seed}&nologo=true`
      let res
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch(proxyUrl)
        if (res.ok) break
        if (attempt < 2) await new Promise(r => setTimeout(r, (attempt + 1) * 4000))
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      const objectUrl = URL.createObjectURL(blob)
      objectUrlRef.current = objectUrl
      setSceneImage(objectUrl)
    } catch {
      setImageError(true)
    } finally {
      setImageLoading(false)
    }
  }

  return {
    sceneImage,
    imageError, setImageError,
    imageLoading,
    sceneKey,
    bumpSceneKey,
    resetImageState,
    fetchMissionImage,
  }
}
