// The law of Deep Roots as its display draws it: which roots the held keys ask
// for, where they go and how strong each is. It is the device's own
// (`cpp/devices/deep-roots/law.h`, `leaf_and_soil.h`), names and all, and looked
// at anew from the keys on every frame.

import { clamp } from '../display-kit'

export const DEEP_LEAVES = ['Sine', 'Reed', 'Glass', 'Breath', 'Pluck'] as const
/** `Leaf::life`: how long a struck leaf feeds its roots, in seconds; 0 is for ever. */
export const DEEP_LIFE: readonly number[] = [0, 0, 12, 0, 7]

export interface DeepSoil {
  name: string
  ratio: readonly number[]
  level: readonly number[]
  /** `Body`: the pitch, the width as a share of it and the gain of three humps. */
  body: readonly (readonly [hz: number, width: number, gain: number])[]
  rise: number
  quick: number
  release: number
}

/** `kSoilTable`. */
export const DEEP_SOILS: readonly DeepSoil[] = [
  {
    name: 'Clay',
    ratio: [1, 2, 3, 4, 5, 6, 7, 8],
    level: [1, 0.68, 0.44, 0.27, 0.16, 0.1, 0.06, 0.035],
    body: [
      [190, 0.5, 0.8],
      [520, 0.5, 0.5],
    ],
    rise: 1,
    quick: 0.014,
    release: 1,
  },
  {
    name: 'Sand',
    ratio: [1, 2, 3, 6, 14, 30, 54, 88],
    level: [0.46, 0.28, 0.22, 0.14, 0.28, 0.44, 0.36, 0.2],
    body: [
      [700, 0.5, 0.3],
      [1700, 0.5, 0.9],
      [3600, 0.5, 1.2],
    ],
    rise: 0.9,
    quick: 0.01,
    release: 0.6,
  },
  {
    name: 'Peat',
    ratio: [1, 1, 2, 2, 3, 3, 4, 5],
    level: [0.85, 0.65, 0.2, 0.15, 0.2, 0.15, 0.012, 0.005],
    body: [
      [75, 0.4, 1.8],
      [130, 0.4, 0.8],
      [330, 0.4, 0.6],
    ],
    rise: 4,
    quick: 0.06,
    release: 2,
  },
  {
    name: 'Chalk',
    ratio: [1, 2, 4, 5.404, 8.933, 13.34, 18.64, 31.87],
    level: [0.7, 0.4, 0.75, 0.5, 0.6, 0.54, 0.52, 0.42],
    body: [
      [700, 0.5, 1],
      [1700, 0.5, 0.5],
      [3600, 0.5, 0.4],
    ],
    rise: 0.1,
    quick: 0.0015,
    release: 1.2,
  },
  {
    name: 'Stone',
    ratio: [1, 2, 3, 5, 8, 12, 16, 20],
    level: [0.26, 0.2, 0.56, 0.86, 0.9, 0.8, 0.4, 0.16],
    body: [
      [480, 0.2, 1.8],
      [1100, 0.16, 3],
      [2000, 0.18, 2.4],
    ],
    rise: 2.2,
    quick: 0.04,
    release: 1.1,
  },
]

/** `shape_root`: how loud the partials of a root at `hz` are against each other, the loudest at 1. */
export function deepPartials(soil: DeepSoil, hz: number, tone: number, velocity: number) {
  const tilt = (0.5 - tone) * (tone < 0.5 ? 3.8 : 3) + (0.7 - velocity) * 1.1
  const levels = soil.ratio.map((ratio, k) => {
    const f = hz * ratio
    const octaves = Math.log2(ratio)
    const steep = octaves / (1 + 0.11 * octaves)
    const body = soil.body.reduce(
      (sum, [at, width, gain]) => sum + gain / (1 + ((f - at) / (at * width)) ** 2),
      1,
    )
    const felt = f < 60 ? 0.45 + 0.55 * clamp((f - 24) / 36, 0, 1) : 1
    return soil.level[k] * Math.pow(2, -tilt * steep) * body * felt
  })
  const most = Math.max(...levels, 1e-9)
  return levels.map((level) => level / most)
}

// --- The law -------------------------------------------------------------------

const STEMS = 5
const THIRDS = 8
const SOUNDING = 36
const FIFTH = 1.485
const MUD_HZ = 100
const CLOSE_HZ = 230
const LOW_OCTAVE = 6.9
const MOST_THIRDS = 40
/** `kBears`: how well a bass carries a key so many semitones over it. */
const BEARS = [1, 0, 0.15, 0.2, 0.35, 0, 0, 0.5, 0, 0.1, 0.2, 0]
/** `kDivision`, and `kFamily`: 0 is twos, 1 twos and threes, 2 the rest. */
const DIVISION = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const FAMILY = [0, 1, 0, 2, 1, 2, 0, 2, 2, 2, 1]

export interface DeepLaw {
  series: number
  reach: number
  branching: number
  growth: number
  meeting: number
  fit: number
  tolerance: number
  floor: number
}

/** A key that is held. */
export interface DeepKey {
  hz: number
  gain: number
  /** When its roots may set out, on any clock. */
  from: number
}

/** A root the law asks for. */
export interface DeepAsk {
  /** The key it hangs from; -1 is a tone that a meeting makes. */
  key: number
  /** Every key that feeds it: its own, those whose roots met it, the pairs whose difference it is. */
  parents: number[]
  num: number
  den: number
  hz: number
  goalHz: number
  octave: number
  goal: number
  power: number
  asked: number
  met: number
  best: number
  strength: number
  depth: number
  velocity: number
  from: number
  fast: boolean
}

export interface DeepPlan {
  roots: DeepAsk[]
  /** How far the chord has met, 0..1. */
  meeting: number
}

const pow2 = (octaves: number): number => Math.pow(2, octaves)

/** `series_share`. */
function seriesShare(i: number, series: number): number {
  const at = series * 3
  let share = 1
  if (FAMILY[i] === 1) share = clamp(at, 0, 1)
  if (FAMILY[i] === 2) share = clamp(at - 1, 0, 1)
  return DIVISION[i] % 2 === 0 ? share * clamp(3 - at, 0, 1) : share
}

function within(cents: number, tolerance: number): number {
  const u = cents / tolerance
  return u > 3 ? 0 : Math.exp(-u * u)
}

/** Closer than a fifth, below 100 Hz. */
export function deepCrowds(a: number, b: number): boolean {
  const low = Math.min(a, b)
  return low < MUD_HZ && Math.max(a, b) < FIFTH * low
}

function beside(a: number, b: number): number {
  const low = Math.min(a, b)
  if (low < MUD_HZ || low >= CLOSE_HZ) return 1
  const need = ((FIFTH - 1) * (CLOSE_HZ - low)) / (CLOSE_HZ - MUD_HZ)
  const have = Math.max(a, b) / low - 1
  if (have >= need || have < 0.006) return 1
  return 0.15 + 0.85 * (have / need) ** 2
}

/** The roots of `keys`. `age` says how long a root has sounded already; null for one that does not. */
export function deepPlan(
  law: DeepLaw,
  keys: readonly DeepKey[],
  age: (ask: DeepAsk) => number | null = () => null,
): DeepPlan {
  const { meeting, fit, tolerance, floor } = law
  const octaves = keys.map((key) => Math.log2(key.hz))
  const asks: DeepAsk[] = []
  const nearest = (octave: number): { place: number; off: number } => {
    let [off, place] = [1e9, octave]
    for (const key of octaves) {
      const away = octave - key - Math.floor(octave - key + 0.5)
      if (Math.abs(away) < off) [off, place] = [Math.abs(away), octave - away]
    }
    return { place, off: off * 1200 }
  }
  const bears = (octave: number): number =>
    octaves.reduce((sum, key) => {
      const d = key - octave
      return sum + BEARS[Math.floor((d - Math.floor(d)) * 12 + 0.5) % 12]
    }, 0)
  const bearing = Math.max(0.5, ...octaves.map(bears))
  const ask = (key: number, num: number, den: number, hz: number, power: number): DeepAsk => {
    const octave = Math.log2(hz)
    const one = { key, parents: key < 0 ? [] : [key], num, den, hz, goalHz: hz, octave, power }
    const rest = { goal: octave, asked: 0, met: 0, best: 0, strength: 1, depth: 1, velocity: 0.7 }
    const made: DeepAsk = { ...one, ...rest, from: 0, fast: false }
    asks.push(made)
    return made
  }

  /** `list_stems`: the divisions one key grows. */
  const listStems = (index: number): void => {
    const key = keys[index]
    const { series } = law
    const w = DIVISION.map((den, i) => {
      const u = clamp((law.reach - Math.log2(den)) * 3 + 0.5, 0, 1)
      return u * u * (3 - 2 * u) * seriesShare(i, series)
    })
    let total = w.reduce((sum, each) => sum + each, 0)
    if (total < 1) {
      const odd = clamp(series * 3 - 2, 0, 1)
      w[0] += (1 - total) * (1 - odd)
      w[1] += (1 - total) * odd
      total = 1
    }
    const room = law.branching * Math.min(total - 1, STEMS - 1)
    let shallower = 0
    const first = asks.length
    DIVISION.forEach((division, i) => {
      if (w[i] < 0.001) return
      const share = Math.min(1, w[i])
      let deepest = share
      for (let j = i + 1; j < DIVISION.length; j++) deepest *= 1 - Math.min(1, w[j])
      const rank = (1 - deepest) * (1 + shallower)
      shallower += w[i]
      const power = share * clamp(1 + room - rank, 0, 1)
      if (power < 0.001 && !(meeting < 0 && w[i] > 0.05)) return
      let [num, den, hz] = [1, division, key.hz / division]
      while (hz < floor && num * 2 <= den) [num, hz] = [num * 2, hz * 2]
      while (num % 2 === 0 && den % 2 === 0) [num, den] = [num / 2, den / 2]
      const same = asks.slice(first).find((each) => each.num === num && each.den === den)
      if (same) {
        same.power = Math.min(1, same.power + power)
        same.asked = Math.max(same.asked, share)
        return
      }
      const made = ask(index, num, den, hz, power)
      made.asked = share
      made.from = key.from
      made.depth = Math.max(0.4, Math.log2(den / num))
      made.velocity = key.gain
    })
  }

  /** `third`: one tone that a meeting makes. */
  let thirdsFrom = 0
  const third = (hz: number, weight: number, top: number, from: number, pair: DeepPair): void => {
    if (!(hz > 4)) return
    const deepest = pow2(top - law.reach - 0.3)
    while (hz < floor || hz < deepest) hz *= 2
    if (hz > 1400) return
    const octave = Math.log2(hz)
    const { place, off } = nearest(octave)
    const carries = clamp((2.2 * bears(place)) / bearing - 1.15, 0.08, 1)
    weight *= 1 + (within(off, tolerance) * carries - 1) * fit
    weight /= 1 + (hz / 190) * Math.sqrt(hz / 190)
    if (weight < 0.004) return
    const goal = octave + (place - octave) * fit
    const same = asks.slice(thirdsFrom).find((each) => Math.abs(each.goal - goal) < 0.01)
    if (same) {
      same.best = Math.max(same.best, weight)
      same.power += weight
      same.velocity = Math.max(same.velocity, pair.velocity)
      for (const key of pair.keys) if (!same.parents.includes(key)) same.parents.push(key)
      return
    }
    if (asks.length - thirdsFrom >= MOST_THIRDS) return
    const made = ask(-1, 1, 1, hz, weight)
    made.parents = [...pair.keys]
    made.goal = goal
    made.goalHz = pow2(goal)
    made.best = weight
    made.from = from
    made.depth = 1.4 + 0.8 * Math.max(0, top - goal)
    made.velocity = pair.velocity
  }

  /** `list_thirds` and `thin_thirds`. */
  const listThirds = (): void => {
    thirdsFrom = asks.length
    const at = law.series * 3
    const plain = clamp(3 - at, 0, 1)
    const under = 0.7 * clamp(at, 0, 1)
    const twice = 0.7 * clamp(at - 1, 0, 1)
    if (keys.length === 1) {
      const [{ hz, gain, from }] = keys
      const lone: DeepPair = { keys: [0], velocity: gain }
      const shares = [
        [0.5, 0.8],
        [0.25, 0.6],
        [0.75, 0.7 * under],
        [0.125, 0.9 * twice],
      ]
      for (const [share, weight] of shares) third(hz * share, weight, octaves[0], from, lone)
    } else
      for (let a = 0; a < keys.length; a++)
        for (let b = a + 1; b < keys.length; b++) {
          const [low, high] = keys[a].hz < keys[b].hz ? [a, b] : [b, a]
          const velocity = Math.sqrt(keys[a].gain * keys[b].gain)
          const from = Math.max(keys[a].from, keys[b].from)
          const lowHz = keys[low].hz
          const d = keys[high].hz - lowHz
          if (d < 0.02 * lowHz) continue
          const pair: DeepPair = { keys: [low, high], velocity }
          third(d, plain * velocity, octaves[low], from, pair)
          third(lowHz - d, under * velocity, octaves[low], from, pair)
          third(Math.abs(lowHz - 2 * d), twice * velocity, octaves[low], from, pair)
        }
    const room = law.branching * 7
    const thirds = asks.slice(thirdsFrom)
    const weighed = thirds.map((each) => each.power * (each.goalHz < MUD_HZ ? 2 : 1))
    thirds.forEach((each, i) => {
      const before = weighed.filter((w, j) => w > weighed[i] || (w === weighed[i] && j < i)).length
      each.power *= clamp(1 + room - before, 0, 1)
    })
  }

  /** `meet_stems`: divisions of different keys that land together. */
  const meetStems = (pull: number): number => {
    const near = (a: DeepAsk, b: DeepAsk): number => {
      const cents = Math.abs(a.octave - b.octave) * 1200
      return b.key === a.key || cents >= 3 * tolerance ? 0 : within(cents, tolerance) * b.asked
    }
    let most = 0
    for (const a of asks) {
      a.met = asks.reduce((sum, b) => sum + near(a, b), 0)
      most = Math.max(most, a.met * a.asked)
    }
    const whole = Math.min(1, most)
    for (const a of asks) {
      const met = Math.min(1, a.met)
      const { place, off } = nearest(a.octave)
      const draw = Math.min(1, 2 * pull) * met
      if (off < tolerance)
        a.goalHz = pow2(a.octave + (place - a.octave) * Math.max(draw, off < 4 ? 1 : 0) * fit)
      else if (met > 0) {
        let [sum, middle] = [a.asked, a.asked * a.octave]
        for (const b of asks) [sum, middle] = [sum + near(a, b), middle + near(a, b) * b.octave]
        a.goalHz = pow2(a.octave + (middle / sum - a.octave) * draw)
      }
      const thin = pull * whole * (1 - met) * 0.97
      a.power = Math.max(a.power, Math.min(1, 1.5 * pull) * met * a.asked)
      a.power *=
        (1 - thin) *
        (1 + pull * 0.9 * Math.min(2, a.met)) *
        (1 - 0.8 * pull * whole * clamp(a.octave - LOW_OCTAVE, 0, 1))
    }
    return whole
  }

  keys.forEach((_, index) => listStems(index))
  let whole = 0
  if (meeting < 0) whole = meetStems(-meeting)
  else if (meeting > 0 && keys.length > 0) {
    const stems = [...asks]
    listThirds()
    let most = 0
    for (const each of asks.slice(stems.length)) {
      const s = Math.min(1.6, Math.sqrt(each.power * 1.8))
      each.power = Math.sqrt(meeting) * s * 1.4
      most = Math.max(most, s)
    }
    whole = Math.min(1, most)
    for (const each of stems) {
      const { place, off } = nearest(each.octave)
      const stay = within(off, tolerance)
      if (off < tolerance) each.goalHz = pow2(each.octave + (place - each.octave) * fit)
      each.power *= 1 - meeting * meeting * whole * (0.97 - 0.4 * stay * (1 - meeting * 0.7))
    }
  }
  for (const each of asks) each.goal = Math.log2(each.goalHz)

  // `space`: who keeps its place. Nothing closer than a fifth below 100 Hz, two at one pitch become one.
  for (const each of asks) {
    const carry = 1 + (bears(each.goal) / bearing - 0.85) * fit
    each.strength =
      each.power *
      (age(each) === null ? 1 : 1.3) *
      (each.key < 0 ? 1.15 : 1) *
      (1 + 0.5 * clamp(1.4 - each.goalHz * 0.01, 0, 1)) *
      carry *
      carry
  }
  asks.sort((a, b) => b.strength - a.strength)
  const kept: DeepAsk[] = []
  for (const each of asks) {
    if (each.power < 0.02) {
      each.power = 0
      continue
    }
    let room = kept.length < SOUNDING
    let thinned = 1
    for (let h = 0; h < keys.length && room; h++) {
      if (deepCrowds(each.goalHz, keys[h].hz) && Math.abs(each.goal - octaves[h]) > 0.004)
        room = !(each.fast = true)
      else thinned = Math.min(thinned, beside(each.goalHz, keys[h].hz))
    }
    for (let k = 0; k < kept.length && room; k++) {
      const other = kept[k]
      if (Math.abs(other.goal - each.goal) < 0.011) {
        other.power = Math.min(1.7, Math.hypot(other.power, each.power))
        for (const key of each.parents) if (!other.parents.includes(key)) other.parents.push(key)
        const young = meeting < 0 && each.key >= 0 && each.goalHz > MUD_HZ
        const heard = young && (age(each) ?? 0) < 1 + law.growth
        each.power = heard && Math.abs(each.octave - each.goal) > 0.001 ? each.power * 0.7 : 0
        room = false
        break
      }
      if (deepCrowds(each.goalHz, other.goalHz)) room = !(each.fast = true)
      else thinned = Math.min(thinned, beside(each.goalHz, other.goalHz))
    }
    if (room) {
      each.power *= thinned
      kept.push(each)
    } else if (each.fast || kept.length >= SOUNDING) each.power = 0
  }
  // `settle`: a key has room for five roots, a meeting for eight tones.
  const taken = new Map<number, number>()
  const roots = asks.filter((each) => {
    if (each.power <= 0) return false
    const count = (taken.get(each.key) ?? 0) + 1
    taken.set(each.key, count)
    return count <= (each.key < 0 ? THIRDS : STEMS)
  })
  return { roots, meeting: whole }
}

interface DeepPair {
  keys: readonly number[]
  velocity: number
}
