// Chance that comes out the same every time: a row of numbers decided by a
// seed (mulberry32). A maker draws from one of its own, so what it writes is
// a function of its seed and of what it was played.

export class MakerRandom {
  private state: number

  constructor(seed: number) {
    this.state = (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0
  }

  /** The next number, 0 up to but not including 1. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** A whole number from 0 up to but not including `count`. */
  below(count: number): number {
    return Math.min(count - 1, Math.floor(this.next() * count))
  }

  /** A number from `min` to `max`. */
  between(min: number, max: number): number {
    return min + (max - min) * this.next()
  }

  /** One of the choices, each as likely as its weight; the last when every weight is 0. */
  weighted<T>(choices: readonly T[], weight: (choice: T) => number): T {
    const total = choices.reduce((sum, choice) => sum + Math.max(0, weight(choice)), 0)
    let at = this.next() * total
    for (const choice of choices) {
      at -= Math.max(0, weight(choice))
      if (at < 0) return choice
    }
    return choices[choices.length - 1]
  }
}
