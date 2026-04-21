import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import ShareCard from '../ShareCard/ShareCard'
import './ShareModal.css'

export default function ShareModal({ character, messages, onClose }) {
  const cardRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  const lastMessages = messages.filter(m => m.content).slice(-4)

  async function captureCard() {
    // Doble captura: la primera carga fuentes/imágenes, la segunda es limpia
    await toPng(cardRef.current, { pixelRatio: 2 })
    return toPng(cardRef.current, { pixelRatio: 2 })
  }

  async function handleDownload() {
    if (!cardRef.current) return
    setLoading(true)
    try {
      const dataUrl = await captureCard()
      const link = document.createElement('a')
      link.download = `echoverse-${character.id}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error al generar imagen:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    if (!cardRef.current) return
    setLoading(true)
    try {
      const dataUrl = await captureCard()
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `echoverse-${character.id}.png`, { type: 'image/png' })
      await navigator.share({
        files: [file],
        title: `Chat con ${character.name} — EchoVerse`,
      })
    } catch (err) {
      if (err?.name !== 'AbortError') console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="share-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Compartir conversación"
    >
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-modal__preview">
          <ShareCard ref={cardRef} character={character} messages={lastMessages} />
        </div>

        <div className="share-modal__actions">
          <button
            className="share-modal__btn share-modal__btn--download"
            style={{ background: character.themeColor }}
            onClick={handleDownload}
            disabled={loading}
          >
            {loading ? 'Generando…' : '↓ Descargar imagen'}
          </button>

          {canShare && (
            <button
              className="share-modal__btn share-modal__btn--share"
              onClick={handleShare}
              disabled={loading}
            >
              Compartir
            </button>
          )}

          <button
            className="share-modal__btn share-modal__btn--cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
