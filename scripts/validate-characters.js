// Validates that frontend and backend characters.js are in sync.
// Checks: same IDs, same names, no orphans on either side.
// Usage: node scripts/validate-characters.js
// Add to CI or pre-commit hook.

import { readFileSync } from 'fs'

function extractField(src, field) {
  const map = {}
  const idRe   = new RegExp(`id:\\s*'([^']+)'`, 'g')
  const fieldRe = new RegExp(`${field}:\\s*'([^']+)'`, 'g')

  let idMatch
  while ((idMatch = idRe.exec(src)) !== null) {
    fieldRe.lastIndex = idMatch.index
    const fMatch = fieldRe.exec(src)
    if (fMatch && fMatch.index < idMatch.index + 300) {
      map[idMatch[1]] = fMatch[1]
    }
  }
  return map
}

const frontendSrc = readFileSync('./frontend/src/data/characters.js', 'utf8')
const backendSrc  = readFileSync('./backend/src/data/characters.js',  'utf8')

const frontendNames = extractField(frontendSrc, 'name')
const backendNames  = extractField(backendSrc,  'name')

const frontendIds = new Set(Object.keys(frontendNames))
const backendIds  = new Set(Object.keys(backendNames))

let errors = 0

// IDs only in frontend
for (const id of frontendIds) {
  if (!backendIds.has(id)) {
    console.error(`  MISSING in backend:  ${id}`)
    errors++
  }
}

// IDs only in backend
for (const id of backendIds) {
  if (!frontendIds.has(id)) {
    console.error(`  MISSING in frontend: ${id}`)
    errors++
  }
}

// Name mismatches
for (const id of frontendIds) {
  if (backendIds.has(id) && frontendNames[id] !== backendNames[id]) {
    console.error(`  NAME MISMATCH for '${id}': frontend='${frontendNames[id]}' backend='${backendNames[id]}'`)
    errors++
  }
}

if (errors === 0) {
  console.log(`characters.js in sync — ${frontendIds.size} characters, names match.`)
  process.exit(0)
} else {
  console.error(`\n${errors} sync error(s) found. Fix before deploying.`)
  process.exit(1)
}
