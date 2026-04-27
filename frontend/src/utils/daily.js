export function getDailySeed() {
  return Math.floor(Date.now() / 86_400_000)
}

export function pickByDay(items, offset = 0) {
  if (!items?.length) return null
  return items[(getDailySeed() + offset) % items.length]
}

export function shuffleByDay(items) {
  const arr = [...items]
  let s = getDailySeed()
  function rand() {
    s = (Math.imul(s, 1664525) + 1013904223) & 0xffffffff
    return (s >>> 0) / 4294967296
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
