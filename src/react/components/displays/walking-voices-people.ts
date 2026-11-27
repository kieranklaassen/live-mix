// Who the crowd of Walking Voices is made of, and how it is dealt out: what
// each manner and each body does, the seats of the held notes and the places
// on them, and the 36 people with all that is theirs for life. The device's
// own figures (`crowd.h`, `singer.h`); `walking-voices-crowd.ts` walks them.

import { clamp } from '../display-kit'

export const CROWD_SINGERS = 36
export const COVER = 2
export const CROWD_PATHS = ['Slide', 'Steps', 'Turn', 'Leap', 'Late'] as const
export const CROWD_BODIES = ['Open', 'Hum', 'Hollow', 'Whistle', 'Reed', 'Strings'] as const
export const [STEPS, TURN, LEAP, LATE] = [1, 2, 3, 4]
/** `kManners` and `kBodyManners`: attack, release, spread. */
export const MANNERS = [
  [1, 1, 1],
  [0.3, 0.36, 1.8],
  [1.6, 3.2, 1.35],
  [0.25, 0.2, 0.4],
  [2.6, 2.4, 0.9],
] as const
export const BODY_MANNERS = [
  [1, 1, 1],
  [1.3, 1.6, 0.42],
  [0.45, 0.3, 0.4],
  [0.6, 0.6, 1.6],
  [0.5, 0.6, 0.65],
  [2, 2.8, 1.2],
] as const
/** `pure_offset`: how far a tempered interval is from the pure one, semitones. */
export const PURE = [
  0, 0.1173, 0.0391, 0.1564, -0.1369, -0.0196, -0.0978, 0.0196, 0.1369, -0.1564, -0.0391, -0.1173,
]

/** The parameters the crowd is walked by. */
export const CROWD_PARAMS = [
  'people',
  'body',
  'path',
  'lag',
  'reach',
  'stubborn',
  'agreement',
  'wander',
  'leader',
  'lowShare',
  'breath',
  'fade',
  'attack',
  'release',
  'spread',
] as const
export type CrowdSettings = Record<(typeof CROWD_PARAMS)[number], number>

export const crowdSettings = (value: (name: string) => number): CrowdSettings =>
  Object.fromEntries(CROWD_PARAMS.map((name) => [name, value(name)])) as CrowdSettings

/** How wide the crowd stands in the room, 0..1 (`voice`). */
export const crowdStand = (set: CrowdSettings): number =>
  Math.min(1, set.spread * MANNERS[set.path][2] * BODY_MANNERS[set.body][2])

/** `eased`: what a manner does to a time, less of it the longer the time asked for. */
export const eased = (factor: number, length: number): number => 1 + (factor - 1) / (1 + length)
export const smooth = (t: number): number => {
  const at = clamp(t, 0, 1)
  return at * at * (3 - 2 * at)
}
/** `turn_wave`: over the note, under it and home again. */
export const turnWave = (t: number): number =>
  Math.sin(2 * Math.PI * t) * (0.35 + 2.6 * t * (1 - t)) * (t < 0.5 ? 1.1 : 0.75)
/** `laid`: a value evenly laid over the crowd in a shuffled order, -1 .. 1. */
const laid = (i: number, stride: number, offset: number): number =>
  (2 * ((i * stride + offset) % CROWD_SINGERS) + 1) / CROWD_SINGERS - 1

export interface CrowdSeat {
  pitch: number
  weight: number
  note: number
  own: boolean
  quota: number
}

/** `lay`: the seats of the held notes, with an octave beside the last of them as Low share asks. */
export function crowdSeats(pitches: readonly number[], low: number): CrowdSeat[] {
  const last = pitches.length - 1
  const seats = pitches.map((pitch, note): CrowdSeat => {
    const rank = last > 0 ? note / last - 0.5 : 0
    return { pitch, weight: Math.pow(2, -5 * low * rank), note, own: true, quota: 0 }
  })
  const all = seats.reduce((sum, seat) => sum + seat.weight, 0)
  const beside = (note: number, pitch: number): void => {
    seats.push({ pitch, weight: all * Math.abs(low) * 0.9, note, own: false, quota: 0 })
  }
  if (low > 0.05 && pitches[0] > 38) beside(0, pitches[0] - 12)
  if (low < -0.05 && pitches[last] < 92) beside(last, pitches[last] + 12)
  return seats.sort((a, b) => a.pitch - b.pitch)
}

/** `deal`: two places to each note's own seat, the rest by weight, the largest remainders first. */
export function crowdDeal(seats: CrowdSeat[], people: number): void {
  const whole = seats.reduce((sum, seat) => sum + seat.weight, 0)
  for (const seat of seats) seat.quota = seat.own ? COVER : 0
  const left = people - seats.reduce((sum, seat) => sum + seat.quota, 0)
  if (left <= 0) return
  const due = seats.map((seat) => Math.max(0, (seat.weight / whole) * people - seat.quota))
  const scale =
    left /
    Math.max(
      1e-6,
      due.reduce((sum, each) => sum + each, 0),
    )
  let given = 0
  seats.forEach((seat, s) => {
    const places = Math.floor(due[s] * scale + 1e-4)
    seat.quota += places
    due[s] = due[s] * scale - places
    given += places
  })
  for (; given < left; given++) {
    let best = 0
    for (let s = 1; s < seats.length; s++) if (due[s] > due[best] + 1e-5) best = s
    due[best] -= 1
    seats[best].quota++
  }
}

export type Random = () => number
/** `kit::Rng`, from the seed `seed_for` gives a stream. */
export function random(stream: number): Random {
  let x = Math.imul(stream + 1, 0x9e3779b9)
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b)
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
  x ^= x >>> 16
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return (x >>> 8) / 16777216
  }
}

export interface Note {
  id: number
  pitch: number
  serial: number
  fresh: boolean
}

/** Somebody of the crowd: who they are for life, and where they are (`Singer`). */
export interface Walker {
  pace: number
  will: number
  ear: number
  mouth: number
  spot: number
  depth: number
  side: number
  priority: number
  chance: Random
  place: number
  from: number
  goal: number
  home: number
  state: 'home' | 'wait' | 'move'
  u: number
  seconds: number
  wait: number
  manner: number
  steps: number
  turning: number
  turnSeconds: number
  born: boolean
  gate: boolean
  own: boolean
  away: boolean
  lead: boolean
  prompt: boolean
  serial: number
  hush: number
  stay: number
  pure: number
  /** Its square is the gain. */
  level: number
  sung: number
  sinking: number
  risen: boolean
  phrase: number
  gap: number
  beat: number
  /** Turns true when they are somewhere else without having walked there. */
  cut: boolean
}

export function makeWalker(i: number): Walker {
  return {
    pace: Math.pow(2, 0.9 * laid(i, 13, 5)),
    will: 0.5 + 0.5 * laid(i, 25, 11),
    ear: laid(i, 11, 17),
    mouth: laid(i, 5, 23),
    spot: laid(i, 19, 3),
    depth: 0.5 + 0.5 * laid(i, 29, 8),
    side: ((i * 7) % 5) & 1 ? 1 : -1,
    priority: (i * 7 + 18) % CROWD_SINGERS,
    chance: random(i),
    ...{ place: 60, from: 60, goal: 60, home: 60, state: 'home' as const, u: 0, seconds: 1 },
    ...{ wait: 0, manner: 0, steps: 1, turning: 0, turnSeconds: 1, born: false, gate: false },
    ...{ own: true, away: false, lead: false, prompt: false, serial: 0, hush: 0, stay: 0, pure: 0 },
    ...{ level: 0, sung: 0, sinking: 0, risen: false, phrase: 6, gap: 0, beat: 0, cut: true },
  }
}
