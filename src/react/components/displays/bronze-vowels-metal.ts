// What the display of Bronze Vowels knows of the metals and the mallets: the
// partials of a bell, and what a strike gives each of them. The arithmetic is
// the device's own (`make_metal`, `tune` and `shares`).

import { clamp } from '../display-kit'

export const BRONZE_PARAMS = [
  ...['metal', 'stray', 'mallet', 'hardness', 'point', 'swell', 'word', 'speak'],
  ...['clarity', 'tract', 'contagion', 'stagger', 'ring', 'wear', 'hum', 'sing'],
] as const
export type BronzeSettings = Record<
  | ('metal' | 'stray' | 'mallet' | 'hardness' | 'point' | 'swell' | 'word' | 'speak' | 'clarity')
  | ('tract' | 'contagion' | 'stagger' | 'ring' | 'wear' | 'hum' | 'sing'),
  number
>
export const bronzeSettings = (value: (name: string) => number): BronzeSettings =>
  Object.fromEntries(BRONZE_PARAMS.map((name) => [name, value(name)])) as BronzeSettings

interface Metal {
  ratio: number[]
  level: number[]
  slope: number
  ring: number
  feed: number
  bloom: number
}
export const BRONZE_PARTIALS = 44

/** `make_metal`: the 44 partials of a metal in the order of their pitch; 0 is the hum, 1 the prime. */
function metalOf(index: number): Metal {
  const rows: [number, number][] = []
  let [slope, ring, feed, prime, bloom] = [0.3, 1, 1, 1, 0]
  const upTo = (n: number, of: (n: number) => [number, number], from = 1): void => {
    for (let i = from; i <= n; i++) rows.push(of(i))
  }
  if (index === 0) {
    upTo(43, (n) => [n, n % 2 ? 1.15 : 0.8], 2)
    ;[slope, ring, feed, prime] = [0.2, 0.75, 1, 0.6]
  } else if (index === 1) {
    for (const r of [3.984, 9.45, 15.9, 23.8, 33.1, 43.8]) rows.push([r, 0.8 * Math.pow(r, -0.4)])
    upTo(26, (n) => [1.735 * n, n === 1 ? 0.03 : 0.12])
    upTo(11, (n) => [0.93 * (n + 0.55) ** 2, n === 1 ? 0.06 : 0.1])
    ;[slope, ring, feed, prime] = [0.45, 0.4, 0.5, 1.3]
  } else if (index === 2) {
    rows.push([1.51, 0.5])
    for (let m = 1; m <= 9; m++)
      upTo(11, (n) => {
        const r = (m * m + 0.57 * n * n) / 1.57
        return [m * n === 1 ? 1e6 : r, 0.5 * Math.pow(r, 0.1)]
      })
    ;[slope, ring, feed, prime, bloom] = [0.6, 1.1, 1.25, 0.3, 2.8]
  } else if (index === 3) {
    rows.push([1.2, 0.62], [1.5, 0.32], [2, 1], [2.51, 0.34], [2.67, 0.3], [3.01, 0.75])
    rows.push([3.36, 0.25], [4.03, 0.6], [4.22, 0.22], [5.11, 0.42], [5.38, 0.26], [6.26, 0.36])
    rows.push([6.6, 0.22], [7.48, 0.3], [8.06, 0.2])
    upTo(26, (n) => [8.75 + 0.82 * n + 0.018 * n * n, 0.3], 0)
    ;[slope, ring, feed, prime] = [0.34, 0.85, 1, 1.15]
  } else {
    upTo(12, (n) => [0.62 * n * n - 0.14 * n + 0.12, 0.14], 2)
    upTo(34, (n) => [n * (1 + 0.0011 * n), 0.02], 2)
    ;[slope, ring, feed, prime, bloom] = [0.1, 2.4, 1.2, 2.8, 0.8]
  }
  rows.sort((a, b) => a[0] - b[0])
  const all: [number, number][] = [[0.5, 1], [1, prime], ...rows.slice(0, BRONZE_PARTIALS - 2)]
  return { ratio: all.map(([r]) => r), level: all.map(([, l]) => l), slope, ring, feed, bloom }
}
const METALS = [0, 1, 2, 3, 4].map(metalOf)
export const bronzeMetal = (set: BronzeSettings): Metal =>
  METALS[clamp(Math.floor(set.metal + 0.5), 0, 4)]

export const bronzeMallet = (set: BronzeSettings): number =>
  clamp(Math.floor(set.mallet + 0.5), 0, 3)

/** The harmonic a partial goes to when the metal is tuned, or 0 for one that fits none. */
function harmonicOf(ratio: number): number {
  const whole = ratio < 1.8 ? Math.floor(2 * ratio + 0.5) / 2 : Math.floor(ratio + 0.5)
  return (12 * Math.log2(whole / ratio)) ** 2 < 0.4 ? whole : 0
}

/** `tune`: the pitch of every partial of a bell at `hz`, between the halves of its pair. */
export function bronzePartials(set: BronzeSettings, hz: number): number[] {
  const pulled = Math.min(2 * set.stray, 1)
  const stretched = 1 + 0.4 * Math.max(2 * set.stray - 1, 0)
  return bronzeMetal(set).ratio.map((ratio, p) => {
    if (p < 2) return p === 0 ? 0.5 * hz : hz
    const tuned = Math.log2(harmonicOf(ratio) || ratio)
    return hz * Math.pow(2, stretched * (tuned + pulled * (Math.log2(ratio) - tuned)))
  })
}

/** `shares`: what the strike gives each partial, as a root of power 1 together; `plain` is the mallet alone. */
export function bronzeShares(
  set: BronzeSettings,
  hz: number,
  gain: number,
  plain: boolean,
): number[] {
  const metal = bronzeMetal(set)
  const mallet = bronzeMallet(set)
  const hard = plain ? 0.45 + 0.4 * (set.hardness - 0.45) : set.hardness
  const tuned = Math.max(1 - 2 * set.stray, 0)
  const raw = Math.max(2 * set.stray - 1, 0)
  const soft = [330, 1500, 1900, 500]
  const ends = [3000, 7000, 5500, 4000]
  const of = (m: number): number => soft[m] * Math.pow(ends[m] / soft[m], hard)
  let cut = plain ? of(0) * Math.pow(of(mallet) / of(0), 0.25) : of(mallet)
  cut *= Math.pow(hz / 220, 0.33) * Math.pow(2, 2.8 * (gain - 0.8))
  const thin = mallet === 2 && !plain ? 2 * hz + 350 : 0
  const point = 0.02 * Math.pow(24, set.point)
  const out = bronzePartials(set, hz).map((at, p) => {
    const ratio = metal.ratio[p]
    const x = at / cut
    let level = plain ? 1 : metal.level[p]
    level *= mallet === 0 ? 1 / (1 + x * x) : 1 / Math.sqrt(1 + x * x * (1 + 0.25 * x * x))
    if (thin > 0) level *= 0.15 + (0.85 * at * at) / (at * at + thin * thin)
    if (!plain) {
      const wave = Math.abs(Math.sin(Math.PI * point * Math.max(ratio, 1)))
      level *= p < 2 ? 0.5 + 0.5 * wave : 0.04 + 1.15 * wave
      if (p > 1) level *= harmonicOf(ratio) ? 1 + 0.8 * tuned - 0.55 * raw : (1 - tuned) * (1 + raw)
    }
    const low = (at / 48) ** 2
    const edge = clamp((15000 - at) / 4000, 0, 1)
    return ((level / (1 + (at / 5000) ** 2)) * low * edge) / (1 + low)
  })
  const scale = 1 / Math.sqrt(out.reduce((sum, each, p) => sum + (p > 0 ? each * each : 0), 1e-6))
  const scaled = out.map((each) => each * scale)
  scaled[0] /= Math.sqrt(1 + scaled[0] ** 2)
  return scaled
}
