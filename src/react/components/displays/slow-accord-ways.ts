// The arithmetic of Slow Accord as its display uses it: the metal of a key, the
// tones its overtones agree with, whose turn it is, and the way there. It is
// the device's own (`cpp/devices/slow-accord`, named beside each part), worked
// out from the notes that were sent. One thing is taken at its mean: how long
// an overtone rests before it may leave again.

import { clamp } from '../display-kit'

/** `body`: overtones over the note in the order they are taken, how loud each is struck, and the body's figures. */
interface Body {
  name: string
  ratios: readonly number[]
  levels: readonly number[]
  slope: number
  ring: number
  colour: number
  reach: number
  /** The note itself, of a full strike and at rest. */
  note: number
  root: number
}
const body = (
  name: string,
  ratios: readonly number[],
  levels: readonly number[],
  [slope, ring, colour, reach, note, root]: readonly number[],
): Body => ({ name, ratios, levels, slope, ring, colour, reach, note, root })
// prettier-ignore
export const ACCORD_BODIES: readonly Body[] = [
  body('Bar', [2.756, 5.404, 8.933, 3.64, 13.34, 1.73, 7.12, 4.55, 10.9, 2.09, 6.31, 12.1, 3.13, 9.71, 14.7, 5.93, 1.46, 11.6, 8.13],
    [1, 0.8, 0.55, 0.3, 0.4, 0.22, 0.3, 0.25, 0.25, 0.18, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.15, 0.2, 0.2], [-0.5, 0.35, -1.4, 1.7, 1, 2.1]),
  body('Plate', [2.46, 4.11, 5.17, 6.38, 1.53, 8.71, 3.37, 10.4, 7.41, 12.2, 5.83, 1.94, 9.23, 13.3, 3.02, 14.9, 11.3, 7.93, 16.4],
    [0.8, 1, 0.9, 1, 0.6, 1, 0.8, 1, 0.9, 1, 0.8, 0.6, 0.9, 1, 0.7, 1, 0.9, 0.8, 0.9], [0.15, 1.6, -0.6, 2, 0.2, 0.35]),
  body('Bell', [2.03, 1.19, 0.5, 2.66, 1.52, 4.16, 3.04, 5.43, 6.79, 2.45, 8.21, 3.62, 9.7, 4.7, 1.83, 11.2, 7.4, 12.9, 6.1],
    [1, 0.85, 0.5, 0.55, 0.5, 0.6, 0.5, 0.5, 0.4, 0.35, 0.35, 0.3, 0.3, 0.3, 0.25, 0.25, 0.25, 0.22, 0.25], [0, 1, -0.05, 2.8, 0.75, 1.1]),
  body('Stretched', [2.3, 3.74, 5.28, 6.9, 8.59, 10.33, 12.13, 13.97, 15.85, 17.77, 19.73, 3, 4.5, 6.08, 7.74, 9.45, 1.62, 11.2, 13],
    [1, 0.9, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.5, 0.5, 0.5, 0.45, 0.45, 0.35, 0.4, 0.4], [0.1, 0.42, 0.75, 3.6, 0.8, 1]),
  body('Squeezed', [1.47, 0.71, 1.83, 1.21, 2.14, 0.84, 2.43, 1.66, 2.68, 0.59, 1.99, 2.92, 1.34, 2.29, 3.14, 2.56, 3.35, 2.8, 3.55],
    [1, 0.65, 1, 0.8, 1, 0.4, 0.95, 0.8, 0.95, 0.4, 0.8, 0.9, 0.6, 0.8, 0.9, 0.75, 0.85, 0.7, 0.8], [-0.3, 1.1, -2.2, 1, 0.2, 0.2]),
  body('Scattered', [],
    [0.9, 1, 0.7, 0.9, 0.6, 1, 0.8, 0.7, 0.9, 0.6, 0.8, 0.7, 0.8, 0.6, 0.8, 0.7, 0.7, 0.6, 0.7], [0.25, 1.5, 0.45, 4.3, 0.12, 0.15]),
]
export const ACCORD_GOALS = ['chord', 'its own', 'octaves', 'the bass']
const READS = [
  'material',
  'overtones',
  'bend',
  'goal',
  'travel',
  'order',
  'manner',
  'swing',
] as const
const READS_TOO = ['again', 'rest', 'glow', 'attack', 'ring', 'touch'] as const
export type AccordSettings = Record<(typeof READS)[number] | (typeof READS_TOO)[number], number>
export const ACCORD_PARAMS = [...READS, ...READS_TOO] as const
export const accordSettings = (value: (name: string) => number): AccordSettings =>
  Object.fromEntries(ACCORD_PARAMS.map((name) => [name, value(name)])) as AccordSettings

/** `kit::Rng`. */
function rngOf(seed: number): () => number {
  let state = seed >>> 0 || 0x2545f491
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 8) / 16777216
  }
}

/** A note as the plan takes it: when it began and when it was let go, on one clock. */
export interface AccordNote {
  id: number
  hz: number
  gain: number
  on: number
  off: number
}
/** One way of one overtone: places in octaves over the note. */
export interface AccordLeg {
  start: number
  span: number
  from: number
  to: number
  home: boolean
}
export interface AccordKey extends AccordNote {
  octave: number
  /** By partial; 0 is the note, the overtones follow in the order of the metal. */
  metal: number[]
  level: number[]
  chance: number[]
  restless: number[]
  aim: number[]
  /** Where each was first sent under the chord as it is now: its line on the staff. */
  line: number[]
  goal: number[]
  strayed: boolean[]
  legs: AccordLeg[][]
  turns: number
  begun: boolean
  /** How many keys were down when its goals were last set. */
  held: number
}

/** `SlowAccord::start`: the metal of a key, put in order. */
function struck(set: AccordSettings, note: AccordNote): AccordKey {
  const { ratios, levels } = ACCORD_BODIES[set.material]
  const count = Math.round(set.overtones)
  const rng = rngOf(0xacc0d1e + Math.imul(Math.floor(Math.fround(note.hz) * 16), 2654435761))
  for (let i = 0; i < 4; i++) rng()
  const tones = Array.from({ length: count }, (_, n) => ({
    octaves: ratios.length ? Math.log2(ratios[n]) : 1.5 + (2.5 * (n + 0.1 + 0.8 * rng())) / count,
    level: levels[n],
  })).sort((a, b) => a.octaves - b.octaves)
  const key: AccordKey = {
    ...note,
    octave: Math.log2(note.hz),
    metal: [0, ...tones.map((tone) => tone.octaves)],
    level: [ACCORD_BODIES[set.material].note, ...tones.map((tone) => tone.level)],
    chance: [],
    restless: [],
    aim: [],
    line: [],
    goal: [],
    strayed: [],
    legs: Array.from({ length: count + 1 }, () => []),
    turns: 0,
    begun: false,
    held: 1,
  }
  for (let k = 0; k <= count; k++) {
    key.aim[k] = key.line[k] = key.goal[k] = key.metal[k]
    if (k > 0) rng()
    key.chance.push(rng())
    key.restless.push(rng())
    rng()
  }
  return key
}

/** `under`: the tone under the lowest key, an octave down where that can be heard. */
const under = (lowest: number): number => (lowest > Math.log2(60) ? lowest - 1 : lowest)
const lowestOf = (held: readonly AccordKey[]): number => Math.min(...held.map((key) => key.octave))

/** `tones_for`: the tones a key's overtones may go to, in octaves over it, rising. */
export function accordTones(set: AccordSettings, key: AccordKey, held: readonly AccordKey[]) {
  const reach = set.goal === 0 ? ACCORD_BODIES[set.material].reach : set.goal === 3 ? 2.6 : 4.35
  const most = Math.min(reach, Math.log2(8000 / key.hz))
  const tones: number[] = []
  const add = (octaves: number): void => {
    if (octaves < 0.08 || octaves > most || tones.length >= 64) return
    if (tones.every((tone) => Math.abs(tone - octaves) >= 0.02)) tones.push(octaves)
  }
  if (set.goal === 1) for (let n = 2; n <= 20; n++) add(Math.log2(n))
  else if (set.goal === 2) for (let n = 1; n <= 4; n++) add(n)
  else if (set.goal === 3)
    for (let n = 1; n <= 64; n++) add(under(lowestOf(held)) - key.octave + Math.log2(n))
  else {
    const seen: number[] = []
    for (const other of held) {
      const within = other.octave - key.octave - Math.floor(other.octave - key.octave)
      const near = (tone: number) =>
        Math.abs(tone - within) < 0.02 || Math.abs(tone - within) > 0.98
      if (!seen.some(near)) seen.push(within)
      for (let octave = -1; octave <= 5; octave++) add(within + octave)
    }
    if (seen.length < 3)
      for (const tone of seen) for (let o = -2; o <= 4; o++) add(tone + 1.5849625 + o)
  }
  if (tones.length === 0) tones.push(most >= 1 ? 1 : 0)
  return tones.sort((a, b) => a - b)
}

const nearest = (tones: readonly number[], to: number): number =>
  tones.reduce((best, tone, i) => (Math.abs(tone - to) < Math.abs(tones[best] - to) ? i : best), 0)
const send = (set: AccordSettings, key: AccordKey, k: number, aim: number): void => {
  key.aim[k] = aim
  key.goal[k] = set.bend >= 1 ? aim : key.metal[k] + (aim - key.metal[k]) * set.bend
}

/** `regoal`: a goal for every overtone, in the order of the metal, none shared before all are taken. */
function regoal(set: AccordSettings, key: AccordKey, held: readonly AccordKey[]): void {
  const tones = accordTones(set, key, held)
  key.held = held.length
  const total = tones.length
  const count = key.metal.length
  let first = 1
  while (first < count && key.metal[first] < 0) first++
  const root = under(lowestOf(held))
  const low = Math.max(root - key.octave, -5)
  const sends = set.goal === 3 && root > Math.log2(30) && count > 2
  const each = Math.max(1, Math.ceil((count - first - (sends ? 1 : 0)) / total))
  let at = 0
  let taken = 0
  for (let k = 1; k < count; k++) {
    const rank = (k - first) % (total + 1)
    let aim: number
    if (k < first) aim = sends ? low : -1
    else if (sends && first === 1 && k === 1) aim = low
    else if (set.goal === 1) aim = tones[Math.min(k - first, total - 1)]
    else if (set.goal === 2) aim = rank === 1 ? -1 : tones[rank === 0 ? 0 : rank - 1]
    else {
      const last = total - 1 - Math.floor((count - k - 1) / each)
      const far = (tone: number) => Math.abs(tones[tone] - key.metal[k])
      if (taken >= each && at < total - 1) [at, taken] = [at + 1, 0]
      while (at < last && at < total - 1 && far(at + 1) < far(at)) [at, taken] = [at + 1, 0]
      aim = tones[at]
      taken++
    }
    key.line[k] = aim
    if (set.again <= 0) key.strayed[k] = false
    else if (key.strayed[k] && k >= first) aim = tones[nearest(tones, key.aim[k])]
    send(set, key, k, aim)
  }
}

/** How far through the plan's loop may go: more than three places can fill in the time it is drawn for. */
const MOST_TURNS = 24000
/** `kAgreed`: this near is there, in octaves. */
const AGREED = 0.0004

/** `dispatch` and `depart`: every way of every overtone, three on their way at once over all keys. */
export function accordPlan(
  set: AccordSettings,
  notes: readonly AccordNote[],
  until: number,
): AccordKey[] {
  const keys = notes.map((note) => struck(set, note))
  const rng = rngOf(0x51a0acc0)
  const begins = clamp(0.2 * set.travel + 0.25 * set.attack, 0.03, 0.9)
  const lean = Math.abs(1 - 2 * set.order)
  let t = Math.min(...keys.map((key) => key.on))
  let flying: number[] = [] // when those on their way arrive
  let nextAt = t
  let heldNow = ''
  let againAt = t
  let oldFirst = 0
  for (let turn = 0; turn < MOST_TURNS && t < until; turn++) {
    const held = keys.filter((key) => key.on <= t && t < key.off)
    const ids = held.map((key) => `${key.id}@${key.on}`).join()
    if (ids !== heldNow) {
      heldNow = ids
      for (const key of held) {
        const least = Math.min(...held.filter((other) => other.begun).map((other) => other.turns))
        if (!key.begun && Number.isFinite(least)) key.turns = Math.max(0, least - 2)
        key.begun = true
        regoal(set, key, held)
      }
    }
    if (t < nextAt) {
      const changes = keys.flatMap((key) => [key.on, key.off]).filter((at) => at > t)
      t = Math.min(nextAt, ...changes)
      continue
    }
    flying = flying.filter((end) => end > t)
    if (flying.length >= 3) {
      nextAt = Math.min(...flying) + 1e-6
      continue
    }
    let chosen: { key: AccordKey; k: number; score: number; leaves: boolean; from: number } | null
    chosen = null
    for (const key of held) {
      if (t - key.on < begins - 1e-9) continue
      for (let k = 1; k < key.metal.length; k++) {
        const leg = key.legs[k].at(-1)
        if (leg && leg.start + leg.span > t) continue
        const from = leg ? leg.to : key.metal[k]
        const rested = leg !== undefined && t >= leg.start + leg.span + 0.3 * set.rest
        const far = Math.abs(key.goal[k] - from) > AGREED
        const sent = t >= againAt && key.restless[k] < Math.abs(set.again)
        const due = rested && !leg.home && sent
        if (leg && (leg.home ? !rested : !far && !due)) continue
        // `eagerness`
        const rank = k / key.metal.length
        const by = set.order < 0.5 ? rank : 1 - rank
        const score = lean * by + (1 - lean) * key.chance[k] + 4 * key.turns
        const later = (leg === undefined) === oldFirst >= 1 ? 1 : 0
        if (!chosen || score + later < chosen.score)
          chosen = { key, k, score: score + later, leaves: due && !far, from }
      }
    }
    if (!chosen) {
      nextAt = t + 1 / 60
      continue
    }
    const { key, k, leaves, from } = chosen
    const amount = Math.abs(set.again)
    if (leaves) againAt = t + set.rest * (0.6 + 0.8 * rng()) * (1.5 - amount)
    const home = leaves && set.again < 0
    if (leaves && !home && key.metal[k] > 0) {
      const tones = accordTones(set, key, held)
      const at = nearest(tones, key.aim[k])
      const by = 2 + Math.floor(rng() * 3)
      let next = rng() < 0.5 ? at - by : at + by
      if (next < 0) next = at + by
      if (next >= tones.length) next = at - by
      key.strayed[k] = true
      send(set, key, k, tones[clamp(next, 0, tones.length - 1)])
    }
    const span = Math.max(set.travel * (0.72 + 0.56 * key.chance[k]), 0.03)
    key.legs[k].push({ start: t, span, from, to: home ? key.metal[k] : key.goal[k], home })
    flying.push(t + span)
    key.turns++
    oldFirst = (oldFirst >= 1 ? oldFirst - 1 : oldFirst) + 0.8 * amount
    nextAt = t + set.travel / 3
  }
  return keys
}

const ease = (t: number): number => t * t * (3 - 2 * t)

/** `path_at`: where an overtone is when `t` (0 to 1) of its way is done. */
export function accordPath(set: AccordSettings, leg: AccordLeg, t: number): number {
  const { manner, swing } = set
  const early = Math.min(t / (1 - 0.5 * swing), 1)
  const apart = leg.from - leg.to
  const u = 1 - ease(early)
  let left: number
  if (manner > 0) {
    const hops = clamp(Math.trunc(leg.span / 0.11), 1, 5)
    const hop = clamp(Math.trunc(t * hops), 0, hops - 1)
    const within = Math.max(t * hops - hop - (hop === 0 ? 0.08 : 0), 0)
    const hopped = (hop + ease(Math.min(within / (0.03 + 0.97 * (1 - manner)), 1))) / hops
    left = (1 - manner) * u * u + manner * (1 - hopped)
  } else left = (1 + manner) * u * u - manner * (1 - ease(clamp((early - 0.4) * 25, 0, 1)))
  const reach = swing * clamp(0.7 * Math.abs(apart), 0.06, 0.28) * (apart < 0 ? -1 : 1)
  const back = reach * Math.sin(2 * Math.PI * 1.75 * t * t) * (1 - t) * (1 - t) * 2.2
  return leg.to + apart * left - back
}

/** Where overtone `k` is at a time on the plan's clock. */
export function accordPlace(set: AccordSettings, key: AccordKey, k: number, at: number): number {
  let place = key.metal[k]
  for (const leg of key.legs[k]) {
    if (at < leg.start) break
    place = at < leg.start + leg.span ? accordPath(set, leg, (at - leg.start) / leg.span) : leg.to
  }
  return place
}

// --- How loud -------------------------------------------------------------------

/** How hard the metal is struck, 0 to 1: Touch and the key. */
const hardness = (set: AccordSettings, gain: number): number =>
  clamp(0.8 * set.touch + 0.55 * (gain - 0.55), 0, 1)
/** `glowing`: how strongly what has arrived sounds on. */
export const accordGlow = (glow: number): number => 1.05 * glow * Math.sqrt(glow)
const ofLoudest = (levels: number[]): number[] => {
  const most = Math.max(...levels, 1e-9)
  return levels.map((level) => level / most)
}

/** `start`: how loud each partial is struck, against the loudest. */
export function accordStruck(set: AccordSettings, key: AccordKey): number[] {
  const hard = hardness(set, key.gain)
  const slope = ACCORD_BODIES[set.material].slope - 3 * (1 - hard) * (1 - hard) + hard
  const soft = Math.max(1900 * Math.pow(set.attack / 0.01, -0.85), 1.6 * key.hz)
  return ofLoudest(
    key.metal.map((octaves, k) => {
      const wakes = octaves > 0 ? Math.pow(2, slope * octaves) : 0.45 + 0.55 * hard
      return (key.level[k] * wakes) / (1 + Math.pow((key.hz * Math.pow(2, octaves)) / soft, 1.5))
    }),
  )
}

/** `rest_level`: how loud an overtone rests, by the octaves its goal is over the note. */
function restLevel(goal: number, octaves: number): number {
  if (goal === 1) return Math.pow(2, 0.5 * octaves)
  if (goal === 2) return octaves < 0 ? 1.1 : Math.pow(2, 1.1 * octaves)
  if (goal === 3) return octaves < 0 ? 4.2 : Math.pow(2, -3 * Math.min(octaves, 1.2))
  return octaves < 0 ? 0.5 : Math.pow(2, -0.45 * octaves)
}

/** `weigh`: how loud each partial rests once it has agreed, against the loudest, as far as Glow holds it. */
export function accordRests(set: AccordSettings, key: AccordKey): number[] {
  const { colour, root } = ACCORD_BODIES[set.material]
  const tint = colour + 1.4 * (hardness(set, key.gain) - 0.55)
  const sub = (0.25 + 0.75 * Math.min(root, 1)) / key.held
  const levels = key.goal.map((goal, k) => {
    if (k === 0) return [0.95, 0.35, 1.4, 0.2][set.goal] * root
    const sharing = key.goal.filter((other, j) => j > 0 && Math.abs(other - goal) < AGREED).length
    const over = goal > 0 ? goal : set.goal === 3 ? 0 : -0.45
    const low = set.goal === 3 && goal < 0 ? sub : 1
    return ((restLevel(set.goal, goal) * low) / Math.sqrt(sharing)) * Math.pow(2, tint * over)
  })
  return ofLoudest(levels).map((level) => level * Math.min(accordGlow(set.glow), 1))
}

/** `start` and `step`: what rings as metal so many seconds after the strike, of a full strike. */
export function accordMetal(set: AccordSettings, t: number): number {
  const { attack, glow } = set
  const share = Math.min(t / attack, 1)
  // While the key still swells its metal dies by the square of how far up it is.
  const died = t < attack ? (t * share * share) / 3 : t - (2 / 3) * attack
  const sung = (1 - 0.6 * glow * glow) * (1 - Math.min(2 * glow, 1) * (attack / (attack + 0.12)))
  const rings = set.ring * ACCORD_BODIES[set.material].ring
  return ease(share) * sung * Math.exp((-6.907755 * died) / rings)
}

/** The two parts of a key: what rings as metal, and what has arrived and sounds on. */
export function accordEnvelope(
  set: AccordSettings,
  key: AccordKey,
  t: number,
): { metal: number; accord: number } {
  const ways = key.legs.slice(1)
  const there = ways.filter((legs) => legs[0] && legs[0].start + legs[0].span - key.on <= t)
  const rise = ease(Math.min(t / set.attack, 1))
  const glow = Math.min(accordGlow(set.glow), 1)
  return { metal: accordMetal(set, t), accord: (rise * glow * there.length) / ways.length }
}
