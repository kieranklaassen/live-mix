// A seeded source of chance for the bench: the same pack, palette and seed
// draw the same chains on any machine.

export type Random = () => number

/** mulberry32: 32 bits of state, good enough to draw from a list. */
export function seeded(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A seed from words, so a pack's id can be one. */
export function seedOf(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))]
}

/** One of `items` with the chance its weight gives it; undefined when no weight is above zero. */
export function weighted<T>(
  random: Random,
  items: readonly T[],
  weight: (item: T) => number,
): T | undefined {
  const weights = items.map((item) => Math.max(0, weight(item)))
  const total = weights.reduce((sum, value) => sum + value, 0)
  if (!(total > 0)) return undefined
  let at = random() * total
  for (let i = 0; i < items.length; i += 1) {
    at -= weights[i]
    if (at < 0) return items[i]
  }
  // A sum of many weights can round a hair under the draw: the last item that has any weight then.
  for (let i = items.length - 1; i >= 0; i -= 1) if (weights[i] > 0) return items[i]
  return undefined
}
