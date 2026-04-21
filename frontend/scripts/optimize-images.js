/**
 * optimize-images.js
 *
 * Convierte las imágenes más pesadas a WebP para reducir el tiempo de carga en mobile.
 * Uso: node frontend/scripts/optimize-images.js
 *
 * Requiere sharp: npm install --save-dev sharp
 */

import sharp from 'sharp'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const imagesDir = join(__dirname, '..', 'public', 'images')

const targets = [
  { input: 'adivinaelpersonaje.png',           output: 'adivinaelpersonaje.webp' },
  { input: 'ipmanstevenseagal.png',             output: 'ipmanstevenseagal.webp' },
  { input: 'ragnarchat1a1.png',                 output: 'ragnarchat1a1.webp' },
  { input: 'jaxtellersupermanchatenvivo.png',   output: 'jaxtellersupermanchatenvivo.webp' },
  { input: 'wolverine.jpg',                     output: 'wolverine.webp' },
  { input: 'jaxteller.jfif',                    output: 'jaxteller.webp' },
  { input: 'wiliamwallace.webp',                output: 'wiliamwallace-opt.webp', resize: 800 },
]

let totalSaved = 0

for (const { input, output, resize } of targets) {
  const inputPath  = join(imagesDir, input)
  const outputPath = join(imagesDir, output)

  if (!existsSync(inputPath)) {
    console.log(`⚠  No encontrado: ${input}`)
    continue
  }

  const beforeKB = Math.round((await import('fs')).statSync(inputPath).size / 1024)

  let pipeline = sharp(inputPath)
  if (resize) pipeline = pipeline.resize({ width: resize, withoutEnlargement: true })
  await pipeline.webp({ quality: 82 }).toFile(outputPath)

  const afterKB = Math.round((await import('fs')).statSync(outputPath).size / 1024)
  const saved = beforeKB - afterKB
  totalSaved += saved
  console.log(`✓  ${input} → ${output}  (${beforeKB}KB → ${afterKB}KB, -${saved}KB)`)
}

console.log(`\nTotal ahorrado: ~${Math.round(totalSaved / 1024)}MB`)
console.log('\nPróximo paso: actualizar las referencias en src/data/characters.js y JSX afectados.')
