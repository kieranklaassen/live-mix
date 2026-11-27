// The arithmetic of the Setting Glass display, the device's own
// (`cpp/devices/setting-glass`): the constants carry its names. What the device
// does by chance (the pace of a key, the size of a blow) stands at its middle.
// After it the scales of the map, and the key the map follows.

import { clamp, type Box } from '../display-kit'
import { type DisplayFrame, type DisplayNote, type DisplayView } from '../plate-display'
import { type HeardLevel } from './instrument-parts'

export const GLASS_HOTTEST = 1.15
export const GLASS_REST_MOST = 0.88
const PAIRS = 8
/** `kWarms`: what a full strike of each kind does to hot glass. */
const WARMS = [0.13, -0.34, 0, 0]
export const GLASS_STRIKES = ['Drop', 'Rod', 'Tap', 'Pour']
const POUR = 3
/** The note the map shows at rest, where a key is neither thinner nor thicker than another. */
export const GLASS_REST_HZ = 2 ** 7.8
const list = (words: string): number[] => words.split(' ').map(Number)

/** `kStuff`: what the picture needs of each matter. */
interface Matter {
  name: string
  ratio: number[]
  roll: number
  ring: number
  slope: number
  scatter: number
  border: number
  sing: number
  root: number
  speaks?: boolean
}
const matter = (name: string, ratio: string, numbers: string, speaks = false): Matter => {
  const [roll, ring, slope, scatter, border, sing, root] = list(numbers)
  return { name, ratio: list(ratio), roll, ring, slope, scatter, border, sing, root, speaks }
}
const ROW = '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16'
const ODD = '1 3 5 7 9 11 13 15 17 19 21 23 25 27 29 31 33 35 37 39 41 43 45 47'
const FIFTHS = '1 2 3 4 5 6 8 9 10 12 15 16 18 20 24 27 30 32 36 40 45 48 54 60'
const TWELFTHS = '1 2 4 3 8 6 16 12 24 32 48 64 5 10 20 40 18 36 80 96 9 72 28 56'
const BELL = '1 .5 1.2 1.5 2 2.4 3 4 2.5 5 6 8 10 12 4.8 16 20 24 7.2 9.6 32 40 48 64'
export const GLASS_MATTERS: readonly Matter[] = [
  matter('Glass', FIFTHS, '.95 1 .3 70 1 1 1'),
  matter('Crystal', TWELFTHS, '.48 2.2 .06 45 .6 1.2 1'),
  matter('Salt', ODD, '.7 .22 .15 110 .8 .5 .5'),
  matter('Sugar', `${ROW} 18 20 22 24 26 28 30 32`, '.5 .1 .3 90 .5 .15 1'),
  matter('Obsidian', `${ROW} 17 18 19 20 21 22 .5 1.5`, '1.45 .8 .6 60 2.2 1.4 1', true),
  matter('Bronze', BELL, '.8 1.7 .75 80 1.2 .7 1'),
]

export type GlassValue = (name: string) => number

/** `scattered`: a steady number in -1..1 for a matter's partial. */
function scattered(of: number, p: number): number {
  let s = (0x51a55 + 7919 * (of * 64 + p)) >>> 0
  for (let i = 0; i < 3; i++) {
    s = (s ^ (s << 13)) >>> 0
    s = (s ^ (s >>> 17)) >>> 0
    s = (s ^ (s << 5)) >>> 0
  }
  return ((s >>> 8) / 16777216) * 2 - 1
}

export const glassMatter = (value: GlassValue): number => clamp(Math.round(value('matter')), 0, 5)
export const glassBorder = (value: GlassValue): number =>
  0.12 * 2 ** (4.8 * value('edge')) * GLASS_MATTERS[glassMatter(value)].border

/** `place_front`: the setting front in octaves over 1 Hz, for a heat. */
export function glassFront(value: GlassValue, hz: number, heat: number): number {
  const border = glassBorder(value)
  const cold = 0.4 * Math.log2(hz) + 0.6 * 6.78 - 1.2 - border
  return cold + heat * (13.6 + 0.5 * border - cold)
}

/** `setness`: 0 soft, 1 set. */
export function glassSet(place: number, front: number, border: number): number {
  const x = clamp(0.5 + (0.5 * (place - front)) / border, 0, 1)
  return x * x * (3 - 2 * x)
}

export interface GlassTone {
  /** Its pitch in octaves over 1 Hz; its level against the loudest; seconds to -60 dB once set. */
  place: number
  level: number
  seconds: number
}

/** `tune`: the tones of a note. The two halves of a pair are one. */
export function glassTones(value: GlassValue, hz: number, gain = 0.6): GlassTone[] {
  const of = glassMatter(value)
  const it = GLASS_MATTERS[of]
  const loose = 1 - value('order')
  const scatter = 7 * it.scatter * loose ** 2.5
  const missing = 6 * loose ** 1.5
  const bright = value('bright') + 0.3 * (gain - 0.6)
  const steep = (bright > 0.5 ? 0.85 : 2) * (bright - 0.5) - it.roll
  const bend = (-0.08 - steep) / 0.1
  const tilt = -0.08 - 0.1 * (bend > 12 ? bend : Math.log1p(Math.exp(bend)))
  const tones = it.ratio.map((partial, p): GlassTone => {
    let ratio = partial
    if (p > 0) {
      const plain = partial === 2 || partial === 0.5 ? 0.35 * loose : 1
      const apart = 1 + 0.25 * value('stretch')
      ratio = 2 ** (Math.log2(partial) * apart + (plain * scatter * scattered(of, p)) / 1200)
    }
    const at = hz * ratio
    const octaves = Math.log2(ratio)
    const edge = at < 24 ? 0 : clamp((13000 - at) / 10000, 0, 1) ** 2
    let level = edge * 2 ** (tilt * (ratio < 1 ? -0.7 * octaves : octaves))
    if (p > 0) level *= 2 ** (-missing * Math.max(scattered(of, p + 64), 0))
    else level *= it.root
    if (p < PAIRS) level *= Math.hypot(0.62, 0.5)
    const place = Math.log2(Math.max(at, 1))
    if (it.speaks) {
      const peak = (gain: number, at: number, wide: number): number =>
        gain / (1 + ((Math.max(place, Math.log2(20)) - at) * wide) ** 4)
      level *= 0.12 + peak(1.6, 9, 2.2) + peak(3.4, 10.15, 3.2) + peak(6, 11.4, 3.6)
    }
    const ring = clamp(value('ring') * it.ring * 2 ** ((7.64 - place) * it.slope), 0.04, 60)
    return { place, level, seconds: Math.min(0.05 + 80 * edge, ring) }
  })
  const most = Math.max(...tones.map((tone) => tone.level), 1e-6)
  return tones.map((tone) => ({ ...tone, level: tone.level / most }))
}

/** What one strike leaves of a heat (`strike`): hot drops bring some, an iron rod takes some. */
function struck(value: GlassValue, heat: number, amount: number): number {
  const full = amount * (0.56 + 0.44 * Math.min(heat, 1))
  const warms = WARMS[clamp(Math.round(value('strike')), 0, POUR)]
  return clamp(heat + warms * Math.min(full, 1) * Math.min(heat, 1), 0, GLASS_HOTTEST)
}

/** The heat of a key just struck. */
export function glassStart(value: GlassValue): number {
  return struck(
    value,
    GLASS_HOTTEST * value('heat'),
    [1, 0.12, 0, 1][Math.round(value('when'))] ?? 1,
  )
}
export const glassRest = (value: GlassValue): number =>
  GLASS_HOTTEST * GLASS_REST_MOST * value('rest')

/** How many of its own times the glass takes from a heat to its rest: a point for it stands no nearer than 0.2. */
export const glassSpans = (from: number, rest: number): number =>
  Math.max(
    from > rest ? Math.log(1 + (from - rest) / 0.35) : Math.log(1 + (rest - from) / 0.2),
    0.2,
  )

/** When glass that cools alone comes to stand, in seconds, for a lone key at the note the map rests on (`cool`). */
export const glassStands = (value: GlassValue): number =>
  (glassSpans(glassStart(value), glassRest(value)) * value('cooling')) / 1.45

/** One step of `cool` with no fire: `pull` is how much of its own time goes by. */
function cooled(heat: number, rest: number, pull: number): number {
  const over = heat - rest
  return over > 0
    ? heat - Math.min(over, pull * (0.35 + over))
    : heat - Math.max(over, -pull * (0.2 - over))
}

/**
 * The heat of a lone held key at each of `times` (seconds, rising), each the
 * mean since the time before it. With `alone`, no fire and no blows.
 */
export function glassHeats(
  value: GlassValue,
  hz: number,
  times: readonly number[],
  alone = false,
): number[] {
  const rest = glassRest(value)
  const thin = 2 ** ((Math.log2(hz) - 7.8) * 0.18)
  const [every, remelt, turn, when] = ['every', 'remelt', 'turn', 'when'].map(value)
  const lasts = Math.min(0.3 * every, 0.9)
  const pours = Math.round(value('strike')) === POUR && (when === 0 || when === 3)
  let [heat, t, fireIn, fire, blowIn] = [glassStart(value), 0, 0.45 * every, 0, 0.675 / turn]
  return times.map((until) => {
    let [sum, count] = [0, 0]
    while (t < until) {
      const dt = Math.min(0.02, lasts / 3, until - t)
      t += dt
      const out = fire > 0 ? Math.max(1 - 3 * remelt, 0) : 1
      heat = cooled(heat, rest, ((out * 1.45 * thin) / value('cooling')) * dt)
      if (!alone) {
        if (pours) heat += dt * Math.max(1 - t / 2, 0) * Math.min(heat, 1)
        if ((fireIn -= dt) <= 0) {
          fireIn += every
          fire = lasts
        }
        if (fire > 0) heat += ((remelt * 1.05 * dt) / lasts) * Math.max(GLASS_HOTTEST - heat, 0)
        fire -= dt
        if ((blowIn -= dt) <= 0) {
          blowIn += 1 / turn
          const set = 0.85 + 0.15 * Math.min(heat, 1)
          if (when === 0 || when === 3) heat = struck(value, heat, value('blows') * set)
        }
        heat = Math.min(heat, GLASS_HOTTEST)
      }
      sum += heat
      count++
    }
    return count > 0 ? sum / count : heat
  })
}

/** What the breath keeps of a set tone, against the ping it sets with (`kSing`, `kPing`), and that ping. */
export function glassKept(value: GlassValue): { kept: number; ping: number } {
  const breath = value('breath')
  const ping = 0.16 * (0.4 + 0.8 * value('ticks')) * (1 - 0.55 * value('edge'))
  const sings = (0.108 * GLASS_MATTERS[glassMatter(value)].sing * breath) / (0.45 + breath)
  return { kept: clamp(sings / ping, 0, 1), ping }
}

// --- The map ---

type Size = Pick<DisplayView, 'width' | 'height'>

/** The map's scale of pitch, in octaves over 1 Hz, and of time, in seconds: even near the press, then drawn together. */
export const GLASS_LOW = 5.3
export const GLASS_HIGH = 14.2
export const GLASS_LONGEST = 40
const BEND_SEC = 0.5

export const glassMap = (size: Size): Box => ({
  x: 5,
  y: 16,
  w: size.width - 10,
  h: size.height - 35,
})
export const glassY = (place: number, map: Box): number =>
  map.y + map.h * (1 - clamp((place - GLASS_LOW) / (GLASS_HIGH - GLASS_LOW), 0, 1))
export const glassShare = (seconds: number): number =>
  Math.log1p(clamp(seconds, 0, GLASS_LONGEST) / BEND_SEC) / Math.log1p(GLASS_LONGEST / BEND_SEC)
export const glassSeconds = (share: number): number =>
  BEND_SEC * Math.expm1(clamp(share, 0, 1) * Math.log1p(GLASS_LONGEST / BEND_SEC))
export const glassX = (seconds: number, map: Box): number => map.x + glassShare(seconds) * map.w

/** What the device reports is kept for so many places along the time. */
export const GLASS_PLACES = 160
/** A key is followed for at least this long, so fast playing does not shake the map. */
export const GLASS_FOLLOWS = 0.5

export interface GlassState extends HeardLevel {
  note: DisplayNote | null
  taken: number
  /** The reported front, in octaves over 1 Hz, at each place along the time; 0 where none was. */
  trail: Float32Array
  said: { words: string; at: number }
}

/** The key the map is of: the newest one, taken up once the one before has been followed a while. */
export function glassFollowed(frame: DisplayFrame<GlassState>): DisplayNote | null {
  const { state, now } = frame
  if (!frame.powered || !frame.signal) return (state.note = null)
  const newest = frame.notes.reduce<DisplayNote | null>(
    (best, note) => (!best || note.age <= best.age ? note : best),
    null,
  )
  const was = state.note
  const again = was !== null && newest !== null && newest.id === was.id && newest.age >= was.age
  const free = was === null || now - state.taken >= GLASS_FOLLOWS
  if (newest && !again && free) {
    state.trail.fill(0)
    state.taken = now
  }
  if (again || free) state.note = newest
  else if (was) state.note = { ...was, age: was.age + frame.dt }
  const note = state.note
  // Rung out, it leaves the map to rest.
  if (note?.released != null && frame.meter('note') <= 0) return (state.note = null)
  const hz = frame.meter('front')
  if (note && hz > 1 && Math.abs(frame.meter('note') / note.frequency - 1) < 0.01) {
    const at = Math.floor(glassShare(note.age) * (GLASS_PLACES - 1))
    state.trail[at] = Math.log2(hz)
    for (let i = at - 1; i >= 0 && state.trail[i] === 0; i--) state.trail[i] = state.trail[at]
  }
  return note
}
