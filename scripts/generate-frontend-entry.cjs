const fs = require('fs')
const path = require('path')

const BACKEND_FILE = path.resolve(__dirname, '../backend/src/data/characters.js')
const FRONTEND_FILE = path.resolve(__dirname, '../frontend/src/data/characters.js')

function extractCharacters(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  // Extrae bloques básicos: id, name, especialidad, systemPrompt
  const entries = []
  const idMatches = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)]

  for (const match of idMatches) {
    const id = match[1]
    const startIdx = match.index
    // Busca el bloque que sigue hasta la siguiente entrada o el cierre
    let endIdx = content.length
    const nextId = content.indexOf("id: '", startIdx + 1)
    if (nextId !== -1) {
      // Retrocede para encontrar el inicio de la siguiente línea con id:
      endIdx = nextId - 2
    }
    const block = content.slice(startIdx, endIdx)

    const nameMatch = block.match(/name:\s*['"]([^'"]+)['"]/)
    const espMatch = block.match(/especialidad:\s*['"]([^'"]+)['"]/)

    entries.push({
      id,
      name: nameMatch ? nameMatch[1] : id,
      especialidad: espMatch ? espMatch[1] : '',
    })
  }

  return entries
}

function generateFrontendEntry(char) {
  const safeId = char.id
  const safeName = char.name
  // Genera un color pseudo-aleatorio pero estable basado en el nombre
  let hash = 0
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  const themeColor = `hsl(${hue}, 60%, 50%)`
  const themeColorDim = `hsla(${hue}, 60%, 50%, 0.18)`
  const darkHue = (hue + 180) % 360

  return `  {
    id: '${safeId}',
    name: '${safeName}',
    universe: 'TODO',
    description: '${char.especialidad || 'TODO'}',
    emoji: '⭐',
    themeColor: '${themeColor}',
    themeColorDim: '${themeColorDim}',
    gradient: 'linear-gradient(160deg, #050508 0%, #0d0d1a 45%, #1a1a30 100%)',
    image: '/images/${safeId}.webp',
    welcomeMessage: 'Hola. Soy ${safeName}. ¿De qué querés hablar?',
    suggestedQuestions: ['¿Quién sos?', '¿De dónde venís?', '¿Qué te motiva?'],
    typingStyle: 'default',
    bgEffect: 'particles',
    notificationTone: 'default',
    uiTheme: 'cold',
  },`
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log('Uso: node generate-frontend-entry.cjs <character-id>')
    console.log('')
    console.log(' IDs disponibles solo en backend:')
    const backend = extractCharacters(BACKEND_FILE)
    const frontendIds = [...fs.readFileSync(FRONTEND_FILE, 'utf8').matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1])
    const missing = backend.filter(b => !frontendIds.includes(b.id))
    if (missing.length === 0) {
      console.log('   (ninguno — todo sincronizado)')
    } else {
      missing.forEach(c => console.log(`   - ${c.id} (${c.name})`))
    }
    process.exit(0)
  }

  const targetId = args[0]
  const backend = extractCharacters(BACKEND_FILE)
  const char = backend.find(c => c.id === targetId)

  if (!char) {
    console.error(`❌ No se encontró "${targetId}" en backend/src/data/characters.js`)
    process.exit(1)
  }

  console.log('/* Pegar esto en frontend/src/data/characters.js */')
  console.log('')
  console.log(generateFrontendEntry(char))
}

main()
