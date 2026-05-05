const fs = require('fs')
const path = require('path')

const BACKEND_FILE = path.resolve(__dirname, '../backend/src/data/characters.js')
const FRONTEND_FILE = path.resolve(__dirname, '../frontend/src/data/characters.js')

function extractIds(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const matches = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)]
  return matches.map(m => m[1])
}

function main() {
  const backendIds = extractIds(BACKEND_FILE)
  const frontendIds = extractIds(FRONTEND_FILE)

  const onlyBackend = backendIds.filter(id => !frontendIds.includes(id))
  const onlyFrontend = frontendIds.filter(id => !backendIds.includes(id))

  console.log(`Backend: ${backendIds.length} personajes`)
  console.log(`Frontend: ${frontendIds.length} personajes`)

  let exitCode = 0

  if (onlyBackend.length > 0) {
    console.error('\n❌ Personajes SOLO en backend (faltan en frontend):')
    onlyBackend.forEach(id => console.error(`   - ${id}`))
    exitCode = 1
  }

  if (onlyFrontend.length > 0) {
    console.error('\n❌ Personajes SOLO en frontend (faltan en backend):')
    onlyFrontend.forEach(id => console.error(`   - ${id}`))
    exitCode = 1
  }

  if (exitCode === 0) {
    console.log('\n✅ Backend y frontend están perfectamente sincronizados.')
  } else {
    console.error('\n⚠️  Agregá los personajes faltantes antes de commitear.')
  }

  process.exit(exitCode)
}

main()
