export function getDailySeed() {
  return Math.floor(Date.now() / 86_400_000)
}

export function pickByDay(items, offset = 0) {
  if (!items?.length) return null
  return items[(getDailySeed() + offset) % items.length]
}

export function shuffleByDay(items) {
  const seed = getDailySeed()
  return [...items].sort((a, b) => {
    const ia = items.indexOf(a)
    const ib = items.indexOf(b)
    const ha = (((ia + 1) * 2654435761) ^ seed) >>> 0
    const hb = (((ib + 1) * 2654435761) ^ seed) >>> 0
    return ha - hb
  })
}
