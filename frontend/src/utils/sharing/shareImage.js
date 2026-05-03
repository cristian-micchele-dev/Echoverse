/**
 * Genera una card visual y la comparte/descarga como PNG.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const paragraphs = text.split('\n')
  const lines = []

  for (const para of paragraphs) {
    if (lines.length >= maxLines) break
    const words = para.split(' ')
    let current = ''
    for (const word of words) {
      if (lines.length >= maxLines) break
      const test = current ? current + ' ' + word : word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current && lines.length < maxLines) lines.push(current)
  }

  // Truncar la última línea si hay más contenido
  if (lines.length === maxLines && text.split(' ').length > lines.join(' ').split(' ').length) {
    let last = lines[maxLines - 1]
    while (ctx.measureText(last + '...').width > maxWidth && last.length > 0) {
      last = last.slice(0, -1)
    }
    lines[maxLines - 1] = last + '...'
  }

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight)
  })
}

async function generateShareCard(message, character) {
  const W = 680
  const H = 320
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Fondo oscuro base
  ctx.fillStyle = '#0d0d12'
  ctx.fillRect(0, 0, W, H)

  // Intentar cargar imagen del personaje (lado derecho con fade)
  if (character.image) {
    try {
      const img = await loadImage(character.image)
      const imgAspect = img.naturalWidth / img.naturalHeight
      const imgH = H
      const imgW = imgH * imgAspect
      const imgX = W - imgW

      ctx.drawImage(img, imgX, 0, imgW, imgH)

      // Fade de izquierda a derecha sobre la imagen
      const fadeGrad = ctx.createLinearGradient(imgX, 0, imgX + imgW * 0.55, 0)
      fadeGrad.addColorStop(0, '#0d0d12')
      fadeGrad.addColorStop(1, 'rgba(13,13,18,0)')
      ctx.fillStyle = fadeGrad
      ctx.fillRect(imgX, 0, imgW * 0.55, imgH)

      // Fade de arriba a abajo en la imagen
      const fadeBottom = ctx.createLinearGradient(0, H * 0.7, 0, H)
      fadeBottom.addColorStop(0, 'rgba(13,13,18,0)')
      fadeBottom.addColorStop(1, '#0d0d12')
      ctx.fillStyle = fadeBottom
      ctx.fillRect(imgX, H * 0.7, imgW, H * 0.3)
    } catch {
      // Sin imagen: overlay de color del personaje
      const colorGrad = ctx.createLinearGradient(W * 0.4, 0, W, 0)
      colorGrad.addColorStop(0, 'rgba(13,13,18,0)')
      colorGrad.addColorStop(1, character.themeColor + '33')
      ctx.fillStyle = colorGrad
      ctx.fillRect(0, 0, W, H)
    }
  }

  // Overlay de color del personaje (franja izquierda)
  const leftGrad = ctx.createLinearGradient(0, 0, W * 0.65, 0)
  leftGrad.addColorStop(0, character.themeColor + '22')
  leftGrad.addColorStop(1, 'rgba(13,13,18,0)')
  ctx.fillStyle = leftGrad
  ctx.fillRect(0, 0, W, H)

  // Barra de acento izquierda
  ctx.fillStyle = character.themeColor
  ctx.fillRect(0, 0, 3, H)

  // Nombre del personaje
  ctx.fillStyle = character.themeColor
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(character.name, 24, 52)

  // Universo
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '13px system-ui, -apple-system, sans-serif'
  ctx.fillText(character.universe, 24, 72)

  // Separador
  ctx.strokeStyle = character.themeColor + '55'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(24, 88)
  ctx.lineTo(380, 88)
  ctx.stroke()

  // Comilla de apertura
  ctx.fillStyle = character.themeColor + '66'
  ctx.font = 'bold 40px Georgia, serif'
  ctx.fillText('\u201C', 18, 128)

  // Texto del mensaje
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = '15px system-ui, -apple-system, sans-serif'
  wrapText(ctx, message.content, 48, 118, 390, 26, 5)

  // Logo EchoVerse
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.font = '11px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('echoverse.app', 24, H - 18)

  // Emoji del personaje (pequeño, esquina inferior derecha del área de texto)
  if (character.emoji) {
    ctx.font = '18px system-ui'
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText(character.emoji, 380, H - 18)
  }

  return canvas
}

export async function shareMessage(message, character) {
  const canvas = await generateShareCard(message, character)

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve('error'); return }

      const fileName = `${character.name.toLowerCase().replace(/\s+/g, '-')}-echoverse.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      // Intentar Web Share API (soportada en mobile / Chrome en desktop)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${character.name} — EchoVerse` })
          resolve('shared')
        } catch (e) {
          if (e?.name !== 'AbortError') downloadBlob(blob, fileName)
          resolve(e?.name === 'AbortError' ? 'cancelled' : 'downloaded')
        }
      } else {
        downloadBlob(blob, fileName)
        resolve('downloaded')
      }
    }, 'image/png')
  })
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
