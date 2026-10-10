// Displays of the instruments whose strings are plucked.
//
// Each is the instrument seen from the front: its strings from low to high,
// standing on the level that comes out. What the knobs set is in the strings
// themselves (how long each is, where the finger meets it), and a string that
// is played lights and moves for as long as the device's own figures say it
// rings.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  fillTo,
  gainToDb,
  ground,
  handle,
  label,
  lerp,
  rule,
  text,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { hzOfKey, levelFoot, outShare, pitchName, pxOfCents, xOfPitch } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>

// --- Harp --------------------------------------------------------------------

/**
 * `harp.h`, `kTypes`: the fundamental rings `seconds` at `hz` and
 * (hz / f)^slope of that at f, kept between `least` and `most`.
 */
const HARP_TYPES = [
  { name: 'Harp', seconds: 12, hz: 32.7, slope: 0.72, least: 0.3, most: 14 },
  { name: 'Koto', seconds: 2.2, hz: 261.63, slope: 0.5, least: 0.3, most: 8 },
  { name: 'Guzheng', seconds: 4.5, hz: 261.63, slope: 0.5, least: 0.5, most: 14 },
] as const
/** `harp.h`: when the bend's press starts after the pluck and how long it takes; what a full Damp leaves of a ring. */
const HARP_BEND_DELAY = 0.08
const HARP_BEND_SECONDS = 0.22
const HARP_DAMPED_SECONDS = 0.1

/** `Harp::ring_seconds` times Decay: seconds the fundamental of a string at `hz` takes to fall 60 dB. */
export function harpRingSeconds(type: number, hz: number, decay: number): number {
  const t = HARP_TYPES[clamp(Math.round(type), 0, HARP_TYPES.length - 1)]
  return clamp(t.seconds * Math.pow(t.hz / Math.max(hz, 1), t.slope), t.least, t.most) * decay
}

/** `Harp::bend_cents` without the pluck's own sharpness: the cents a string plucked `seconds` ago stands above its pitch. */
export function harpBendCents(seconds: number, bend: number): number {
  const x = clamp((seconds - HARP_BEND_DELAY) / HARP_BEND_SECONDS, 0, 1)
  return bend * x * x * (3 - 2 * x)
}

/** `Harp::release`: the ring time a hand on the string leaves it at key up. */
export function harpDampedSeconds(ring: number, damp: number): number {
  if (damp <= 0) return ring
  return Math.min(
    ring,
    ring * Math.pow(HARP_DAMPED_SECONDS / Math.max(ring, HARP_DAMPED_SECONDS), damp),
  )
}

/** `Harp::strike`, `amplitude`: how far a key played as hard as `gain` pulls its string, 1 a full pluck. The softest key still plucks. */
export function harpPluckLevel(gain: number): number {
  const hard = clamp(gain, 0, 1)
  return 0.15 + 0.85 * hard * Math.sqrt(hard)
}

/**
 * How far a string has fallen, in dB under a full pluck: it was plucked
 * `since` seconds ago as hard as `gain`, and let go `released` seconds ago
 * (null while it is held). A key let go before its pluck came (a rolled chord)
 * is damped from the pluck on: `Harp::strike` lets such a string go at once.
 */
export function harpStringDb(
  since: number,
  gain: number,
  released: number | null,
  ring: number,
  damp: number,
): number {
  const after = released === null ? 0 : Math.min(released, since)
  const held = since - after
  return gainToDb(harpPluckLevel(gain)) - 60 * (held / ring + after / harpDampedSeconds(ring, damp))
}

/** The frames the engine hands the device at a time, and the strings the device has. */
const BLOCK_FRAMES = 128
const HARP_STRINGS_MOST = 32

/**
 * `Harp::schedule`: when each note of a chord rolled from its lowest to its
 * highest over `sweep` seconds is plucked, in seconds after it was sent, one
 * figure per note written into `into`. The device rolls only the keys that
 * reach it in one block of sound, under 3 ms, so a chord played by hand is
 * plucked as it is played and only keys sent in one instant are rolled: here
 * the ones sent within `together` seconds of the first of them.
 */
export function harpRolled(
  notes: readonly DisplayNote[],
  sweep: number,
  together: number,
  into: number[],
): number[] {
  into.length = notes.length
  into.fill(0)
  if (sweep <= 0) return into
  // `frame.notes` is oldest first, so a chord is a run of neighbours.
  let from = 0
  while (from < notes.length) {
    let to = from + 1
    while (to < notes.length && notes[from].age - notes[to].age <= together) to++
    for (let i = from; to - from > 1 && i < to; i++) {
      // Its place among the chord's notes by pitch: how many of them lie below it.
      let below = 0
      for (let j = from; j < to; j++) {
        const lower =
          notes[j].frequency < notes[i].frequency ||
          (notes[j].frequency === notes[i].frequency && j < i)
        if (lower) below++
      }
      into[i] = (below * sweep) / (to - from - 1)
    }
    from = to
  }
  return into
}

/** The strings a harp shows at rest: the white keys from C1 to G7, forty-seven of them. */
const HARP_LOW_HZ = 32.7
const HARP_HIGH_HZ = 3136
const HARP_STRINGS: readonly { hz: number; c: boolean }[] = (() => {
  const strings: { hz: number; c: boolean }[] = []
  for (let key = 24; key <= 103; key++) {
    const step = key % 12
    if ([0, 2, 4, 5, 7, 9, 11].includes(step))
      strings.push({ hz: 440 * Math.pow(2, (key - 69) / 12), c: step === 0 })
  }
  return strings
})()
/** The ring times a string's length spans, foot to top, on a scale of ratios. */
const HARP_SHORT_SEC = 0.2
const HARP_LONG_SEC = 30
/** The pitches the two handles stand on. */
const HARP_DECAY_HZ = 261.63
const HARP_PLUCK_HZ = 65.41
/** Under this share of its light a string is done. */
const HARP_DONE = 0.02

interface HarpParts {
  /** Where the strings stand: from `x` to `x + w`, their feet at `y + h`, the longest reaching `y`. */
  strings: Box
  /** The level that comes out, under the strings' feet. */
  foot: Box
}

function harpParts(view: Size, body: number): HarpParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const footRoom = 8
  return {
    strings: { x: all.x + 4, y: all.y + 11, w: all.w - 8, h: all.h - 11 - footRoom },
    // Body is the soundboard: the bar the strings stand on is as thick as there is of it.
    foot: {
      x: all.x,
      y: all.y + all.h - footRoom + 1,
      w: all.w,
      h: 2 + Math.round(clamp(body, 0, 1) * 5),
    },
  }
}

/** A string's length as a share of the tallest, from the seconds it rings. */
const harpLength = (ring: number): number =>
  clamp(Math.log(ring / HARP_SHORT_SEC) / Math.log(HARP_LONG_SEC / HARP_SHORT_SEC), 0.04, 1)
const harpSeconds = (length: number): number =>
  HARP_SHORT_SEC * Math.pow(HARP_LONG_SEC / HARP_SHORT_SEC, length)

/**
 * A plucked string's shape along its length, 0 at both ends and 1 where the
 * finger was: `u` runs from the foot, `pluck` is the finger's place. A hard
 * touch leaves the corner an ideal pluck has; a soft one rounds it.
 */
function harpShape(u: number, pluck: number, touch: number): number {
  const corner = u < pluck ? u / pluck : (1 - u) / (1 - pluck)
  return lerp(Math.sin((corner * Math.PI) / 2), corner, touch)
}

interface HarpState {
  /** Seconds after it was sent that each note of `frame.notes` is plucked, and how much of its light each has (0 for none). */
  delays: number[]
  shares: number[]
  sorted: number[]
  /** The lit strings of this frame, three numbers each: x, the y its light reaches, its share. */
  lit: Float32Array
  order: number[]
}

/**
 * The share a string must have to be among the `most` loudest of `shares`, 0
 * while there are no more than that: an instrument with so many strings gives
 * the quietest of them to a new pitch, so the faintest beyond them are not lit.
 */
function loudestKept(shares: readonly number[], sorted: number[], most: number): number {
  sorted.length = 0
  for (const share of shares) if (share > 0) sorted.push(share)
  if (sorted.length <= most) return 0
  sorted.sort((a, b) => b - a)
  return sorted[most - 1]
}

/** The first note after `index` on the same string that has been plucked: it took the string over. */
function harpTakenOver(
  notes: readonly DisplayNote[],
  delays: readonly number[],
  index: number,
): boolean {
  const hz = notes[index].frequency
  for (let later = index + 1; later < notes.length; later++) {
    // `harp.h`, `kSameStringRatio`: two keys within a quarter tone share a string.
    const ratio = notes[later].frequency / hz
    if (ratio < 1.0293 && ratio > 1 / 1.0293 && notes[later].age - delays[later] >= 0) return true
  }
  return false
}

const harp = plateDisplay<HarpState>({
  place: 'window',
  columns: 2,
  params: ['strings', 'pluck', 'touch', 'decay', 'damp', 'halo', 'sweep', 'bend', 'body'],
  live: { signal: true, notes: true },
  info: 'The strings from low to high, each as long as it rings, on a scale of seconds at the right. A plucked string lights and its light runs down as it dies. Drag the handle on the curve to set Decay, the one on the dashed line to set Pluck.',
  init: () => ({
    delays: [],
    shares: [],
    sorted: [],
    lit: new Float32Array(HARP_STRINGS_MOST * 3),
    order: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const type = frame.value('strings')
    const decay = frame.value('decay')
    const pluck = clamp(frame.value('pluck'), 0.02, 0.98)
    const touch = clamp(frame.value('touch'), 0, 1)
    const damp = frame.value('damp')
    const halo = clamp(frame.value('halo'), 0, 1)
    const bend = frame.value('bend')
    const { strings, foot } = harpParts(frame, frame.value('body'))
    const feet = strings.y + strings.h
    const topOf = (hz: number): number =>
      feet - harpLength(harpRingSeconds(type, hz, decay)) * strings.h

    // The scale: a second and ten seconds.
    for (const seconds of [1, 10]) {
      const y = feet - harpLength(seconds) * strings.h
      rule(ctx, strings.x - 2, y, strings.x + strings.w + 2, y, {
        colour: colours.ink,
        alpha: INK.grid,
      })
    }

    // The strings at rest, the C strings stronger as a harp's are coloured, and the curve their tops make.
    for (const strong of [false, true]) {
      ctx.beginPath()
      for (const string of HARP_STRINGS) {
        if (string.c !== strong) continue
        const x = Math.floor(xOfPitch(string.hz, strings, HARP_LOW_HZ, HARP_HIGH_HZ)) + 0.5
        ctx.moveTo(x, feet)
        ctx.lineTo(x, topOf(string.hz))
      }
      ctx.globalAlpha = strong ? INK.back : 0.28
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
    }
    for (const share of [1, pluck]) {
      ctx.beginPath()
      HARP_STRINGS.forEach((string, index) => {
        const x = xOfPitch(string.hz, strings, HARP_LOW_HZ, HARP_HIGH_HZ)
        const y = feet - (feet - topOf(string.hz)) * share
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      // The dashed line is where the finger meets every string.
      ctx.setLineDash(share === 1 ? [] : [2, 2])
      ctx.globalAlpha = share === 1 ? INK.text : INK.back
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])
    }
    ctx.globalAlpha = 1

    // The strings that are played.
    const notes = frame.notes
    // Keys nearer than half a block are more likely in one block than in two.
    const together = (0.5 * BLOCK_FRAMES) / frame.sampleRate
    const delays = harpRolled(notes, frame.value('sweep'), together, state.delays)
    state.shares.length = notes.length
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      const since = note.age - delays[index]
      const ring = harpRingSeconds(type, note.frequency, decay)
      const share = clamp(1 + harpStringDb(since, note.gain, note.released, ring, damp) / 60, 0, 1)
      const sounds = since >= 0 && share >= HARP_DONE && !harpTakenOver(notes, delays, index)
      state.shares[index] = sounds ? share : 0
    }
    // The device has 32 strings and gives the quietest to a new pitch: no more than that are lit.
    const least = loudestKept(state.shares, state.sorted, HARP_STRINGS_MOST)
    let lit = 0
    let said: DisplayNote | null = null
    for (let index = 0; index < notes.length && lit < HARP_STRINGS_MOST; index++) {
      const note = notes[index]
      const share = state.shares[index]
      if (share <= 0 || share < least) continue
      const since = note.age - delays[index]
      const ring = harpRingSeconds(type, note.frequency, decay)
      said = note
      const x =
        xOfPitch(note.frequency, strings, HARP_LOW_HZ, HARP_HIGH_HZ) +
        pxOfCents(harpBendCents(since, bend), strings, HARP_LOW_HZ, HARP_HIGH_HZ)
      const top = feet - harpLength(ring) * strings.h
      // It swings as wide as it is loud, each string at a pace of its own so a chord does not move as one.
      const swing =
        2.6 *
        Math.pow(share, 0.7) *
        Math.sin(frame.now * 2 * Math.PI * (5.5 + ((note.frequency * 0.37) % 3)) + note.frequency)
      const along = (u: number): number => x + swing * harpShape(u, pluck, touch)
      const yOf = (u: number): number => feet - u * (feet - top)
      for (const light of [false, true]) {
        const reach = light ? share : 1
        ctx.beginPath()
        ctx.moveTo(along(0), yOf(0))
        // The corner at the finger's place is a point of its own; the rest in eighths.
        let corner = pluck < reach
        for (let step = 1; step <= 8; step++) {
          const u = Math.min(reach, step / 8)
          if (corner && u > pluck) {
            ctx.lineTo(along(pluck), yOf(pluck))
            corner = false
          }
          ctx.lineTo(along(u), yOf(u))
          if (u >= reach) break
        }
        ctx.globalAlpha = light ? 1 : INK.text
        ctx.strokeStyle = light ? colours.accent : colours.ink
        ctx.lineWidth = light ? 1.75 : 1
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      // The finger, for a moment: larger for a harder touch.
      if (since < 0.14) {
        dot(ctx, along(pluck), yOf(pluck), 1.5 + touch * 1.5, colours.accent, {
          alpha: 1 - since / 0.14,
        })
      }
      state.lit[lit * 3] = x
      state.lit[lit * 3 + 1] = yOf(share)
      state.lit[lit * 3 + 2] = share
      lit++
    }

    // The halo: what ringing strings lend one another lies between them, as strong as the weaker of two.
    if (halo > 0 && lit > 1) {
      const order = state.order
      order.length = lit
      for (let i = 0; i < lit; i++) order[i] = i
      order.sort((a, b) => state.lit[a * 3] - state.lit[b * 3])
      ctx.fillStyle = colours.accent
      for (let i = 1; i < lit; i++) {
        const a = order[i - 1] * 3
        const b = order[i] * 3
        ctx.beginPath()
        ctx.moveTo(state.lit[a], feet)
        ctx.lineTo(state.lit[a], state.lit[a + 1])
        ctx.lineTo(state.lit[b], state.lit[b + 1])
        ctx.lineTo(state.lit[b], feet)
        ctx.closePath()
        ctx.globalAlpha = halo * 0.32 * Math.min(state.lit[a + 2], state.lit[b + 2])
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    levelFoot(frame, foot, outShare(frame))

    // The scale is said where the short strings leave room, over whatever of them reaches that far.
    for (const seconds of [1, 10]) {
      const y = feet - harpLength(seconds) * strings.h
      label(frame, `${seconds} s`, strings.x + strings.w + 2, y - 2, 'right')
    }

    // The words: which strings, and how long the last one played rings (middle C while none is).
    const top = strings.y - 4
    text(frame, HARP_TYPES[clamp(Math.round(type), 0, 2)].name, strings.x - 3, top)
    const hz = said ? said.frequency : HARP_DECAY_HZ
    text(
      frame,
      `${pitchName(hz)} ${secondsText(harpRingSeconds(type, hz, decay))}`,
      strings.x + strings.w + 3,
      top,
      { align: 'right' },
    )

    for (const point of harpHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: harpHandles,
})

function harpHandles(view: DisplayView): DisplayHandle[] {
  const type = view.value('strings')
  const decay = view.value('decay')
  const { strings } = harpParts(view, view.value('body'))
  const feet = strings.y + strings.h
  const lengthOf = (hz: number): number => harpLength(harpRingSeconds(type, hz, decay)) * strings.h
  const pluckLength = lengthOf(HARP_PLUCK_HZ)
  return [
    {
      key: 'decay',
      name: 'Decay',
      x: xOfPitch(HARP_DECAY_HZ, strings, HARP_LOW_HZ, HARP_HIGH_HZ),
      y: feet - lengthOf(HARP_DECAY_HZ),
      drag: (_x, toY) => ({
        decay:
          harpSeconds(clamp((feet - toY) / strings.h, 0, 1)) /
          harpRingSeconds(type, HARP_DECAY_HZ, 1),
      }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 1 }),
    },
    {
      key: 'pluck',
      name: 'Pluck',
      x: xOfPitch(HARP_PLUCK_HZ, strings, HARP_LOW_HZ, HARP_HIGH_HZ),
      y: feet - view.value('pluck') * pluckLength,
      drag: (_x, toY) => ({ pluck: clamp((feet - toY) / pluckLength, 0, 1) }),
      reset: () => ({ pluck: view.spec('pluck')?.default ?? 0.36 }),
    },
  ]
}

// --- Zither ------------------------------------------------------------------

/** `zither.h`, `kMinHz` and `kMaxStringHz`: the lowest and the highest string. */
const ZITHER_LOW_HZ = 27.5
const ZITHER_HIGH_HZ = 4500
/** `zither.h`, `kChordTones`: the open strings one key plays, in semitones above it. */
const ZITHER_CHORDS = [
  { name: 'Single', tones: [0] },
  { name: 'Octave', tones: [0, 12] },
  { name: 'Fifth', tones: [0, 7, 12, 19, 24] },
  { name: 'Major', tones: [0, 7, 12, 16, 19, 24] },
  { name: 'Minor', tones: [0, 7, 12, 15, 19, 24] },
  { name: 'Sus 2', tones: [0, 7, 12, 14, 19, 24] },
  { name: 'Sus 4', tones: [0, 7, 12, 17, 19, 24] },
  { name: 'Add 9', tones: [0, 7, 14, 16, 19, 24] },
] as const
/** `zither.h`, `kBodies`: where each soundbox rings and how strongly. */
const ZITHER_BODIES = [
  { name: 'Harp', hz: [165, 260, 440, 780], gain: [0.6, 0.5, 0.4, 0.3] },
  { name: 'Zither', hz: [210, 345, 590, 1150], gain: [0.4, 0.45, 0.4, 0.3] },
  { name: 'Dulcimer', hz: [185, 300, 520, 930], gain: [0.6, 0.6, 0.55, 0.45] },
  { name: 'Koto', hz: [140, 310, 620, 1350], gain: [0.2, 0.4, 0.8, 1.2] },
] as const
/** `zither.h`, `kSympatheticNote`: the twelve strings that are never damped, as keys. */
const ZITHER_SYMPATHETIC = [45, 58, 47, 60, 49, 62, 51, 64, 53, 66, 55, 68] as const
/** `zither.h`, `kOpenRelease`: from here up Release never damps. */
const ZITHER_OPEN_RELEASE = 19.5
/** `zither.h`, `kRollLevel` and `kMinRollHz`: a stroke of the roll against the first blow, and its slowest pace. */
const ZITHER_ROLL_LEVEL = 0.9
const ZITHER_ROLL_LEAST_HZ = 2

/** `Zither::start`, `key_scale`, times Decay: seconds a held string at `hz` takes to fall 60 dB. */
export function zitherRingSeconds(hz: number, decay: number): number {
  return decay * clamp(Math.pow(220 / Math.max(hz, 1), 0.3), 0.4, 1.6)
}

/** `Zither::ring_time`: the ring time of a string no key holds; Release at its top leaves it alone. */
export function zitherDampedSeconds(ring: number, release: number): number {
  return release < ZITHER_OPEN_RELEASE ? Math.min(ring, release) : ring
}

/**
 * `Zither::press`: the strings a key at `hz` plays, low to high, written into
 * `into` from `at`; how many there are comes back. A string off the top of the
 * instrument is played an octave lower, and no string twice.
 */
export function zitherChord(chord: number, hz: number, into: number[], at = 0): number {
  const { tones } = ZITHER_CHORDS[clamp(Math.round(chord), 0, ZITHER_CHORDS.length - 1)]
  const key = clamp(hz, ZITHER_LOW_HZ, ZITHER_HIGH_HZ)
  let count = 0
  for (const semitones of tones) {
    let tone = key * Math.pow(2, semitones / 12)
    while (tone > ZITHER_HIGH_HZ) tone *= 0.5
    let twice = false
    for (let u = 0; u < count; u++) twice ||= Math.abs(into[at + u] - tone) < 0.001 * tone
    if (!twice) into[at + count++] = tone
  }
  return count
}

/** `Zither::play_keys`: seconds after the key that the hand reaches string `index` of `count`, crossing them in Strum milliseconds. */
export function zitherStrikeSeconds(
  index: number,
  count: number,
  strum: number,
  down: boolean,
): number {
  if (count < 2) return 0
  return ((down ? count - 1 - index : index) * strum * 0.001) / (count - 1)
}

/** `Zither::strike_tone` and `set_strike`: how far a string moves under a key played as hard as `gain`, the hand's force shared by `count` strings; 1 is a full pluck. */
export function zitherBlowLevel(gain: number, count: number, roll = false): number {
  const share = Math.pow(Math.max(count, 1), roll ? -0.15 : -0.35)
  const level = clamp(gain * share * (roll ? ZITHER_ROLL_LEVEL : 1), 0, 1)
  return 0.08 + 0.92 * Math.pow(level, 1.5)
}

/** `Zither::course_beat`: the hertz the two strings of a course are tuned apart. */
export function zitherCourseBeat(hz: number, courses: number): number {
  return courses * (1.2 + 0.0035 * hz)
}

/** `Zither::set_sympathetic_ring`: seconds a sympathetic string at `hz` rings. */
export function zitherSympatheticSeconds(hz: number): number {
  return 9 * Math.pow(110 / hz, 0.25)
}

/**
 * How far a string has fallen, in dB under a full pluck: struck `since`
 * seconds ago to `level`, its key let go `released` seconds ago (null while it
 * is held). `Zither::ring_time`: it rings `ring` seconds while a key holds it
 * and `damped` from then on; a string struck after its key went up was never
 * held. With `rolled` (a level, 0 for no roll) the strokes of a roll, one on
 * this string every `every` seconds, keep a held string from falling under
 * their level less half of what it loses between two of them.
 */
export function zitherStringDb(
  since: number,
  level: number,
  released: number | null,
  ring: number,
  damped: number,
  rolled = 0,
  every = 0,
): number {
  const after = released === null ? 0 : Math.min(released, since)
  let db = gainToDb(level) - (60 * (since - after)) / ring
  if (rolled > 0 && since - after > 0) db = Math.max(db, gainToDb(rolled) - (30 * every) / ring)
  return db - (60 * after) / damped
}

/**
 * What a sympathetic string takes up of a played one: partial `m` of the
 * played string where it falls on its own partial `k`. Each row is the
 * octaves the played string lies above the sympathetic one, and the dB the
 * one rings under the other at Sympathy 1. The header gives no figure for
 * that, so these were measured on the device a second after a key: 7 dB
 * under where the two are one pitch, 4 dB more for each doubling of `m`
 * times `k`, and 3 dB more where they meet by a fifth, which the tempered
 * scale leaves 2 cents wide.
 */
const ZITHER_ANSWERS: readonly (readonly [number, number])[] = [
  [1, 1],
  [1, 2],
  [2, 1],
  [1, 3],
  [3, 1],
  [1, 4],
  [4, 1],
  [2, 3],
  [3, 2],
  [1, 6],
  [6, 1],
  [1, 8],
  [8, 1],
  [3, 4],
  [4, 3],
].map(([m, k]) => [
  Math.log2(k / m),
  -7 - 4 * Math.log2(m * k) - (m % 3 === 0 || k % 3 === 0 ? 3 : 0),
])
/** A string only takes up what falls this near one of its partials, in cents. */
const ZITHER_IN_TUNE = 5

/** The dB a sympathetic string at `string` Hz rings under a played one at `hz`, at Sympathy 1; −Infinity where none of its partials meets one of the other's. */
export function zitherAnswerDb(hz: number, string: number): number {
  const octaves = Math.log2(hz / string)
  let most = -Infinity
  for (const [apart, db] of ZITHER_ANSWERS)
    if (Math.abs(octaves - apart) * 1200 < ZITHER_IN_TUNE) most = Math.max(most, db)
  return most
}

/** The key whose chord lies on the strings at rest: the C under middle C. */
const ZITHER_REST_HZ = 130.81
/** The seconds the strings' length spans, by the cube root so a strum of a tenth of a second is still seen. */
const ZITHER_LONG_SEC = 34
const ZITHER_DONE = 0.02
/** `zither.h`, `kMaxVoices`: the strings that can ring at once. */
const ZITHER_STRINGS_MOST = 24
const ZITHER_TONES = 6

interface ZitherParts {
  /** The played strings: the bridge at `x`, the lowest string at `y + h`, the highest at `y`. */
  strings: Box
  /** The twelve sympathetic strings, beside the played ones on the same scale of pitch. */
  column: Box
  foot: Box
}

function zitherParts(view: Size): ZitherParts {
  const top = 7
  const high = view.height - 14 - top
  return {
    strings: { x: 13, y: top, w: view.width - 13 - 24, h: high },
    column: { x: view.width - 19, y: top, w: 13, h: high },
    foot: { x: 4, y: view.height - 10, w: view.width - 8, h: 6 },
  }
}

const ZITHER_OCTAVES = Math.log(ZITHER_HIGH_HZ / ZITHER_LOW_HZ)
const zitherY = (hz: number, strings: Box): number =>
  strings.y +
  strings.h * (1 - clamp(Math.log(Math.max(hz, 1) / ZITHER_LOW_HZ) / ZITHER_OCTAVES, 0, 1))
const zitherX = (seconds: number, strings: Box): number =>
  strings.x + Math.cbrt(clamp(seconds / ZITHER_LONG_SEC, 0, 1)) * strings.w
const zitherSeconds = (x: number, strings: Box): number =>
  ZITHER_LONG_SEC * Math.pow(clamp((x - strings.x) / strings.w, 0, 1), 3)

interface ZitherState {
  /** The strings of the chord at rest, and of every note of `frame.notes`, six places each. */
  rest: number[]
  tones: number[]
  counts: number[]
  /** How much of its light each of those strings has, 0 for none. */
  shares: number[]
  sorted: number[]
  /** The two times a string may be reached at. */
  span: [number, number]
  /** How far each sympathetic string rings, 0..1, and what drives it on this frame. */
  ringing: Float32Array
  driven: Float32Array
}

/** The twelve sympathetic strings' pitches. */
const ZITHER_SYMPATHETIC_HZ: readonly number[] = ZITHER_SYMPATHETIC.map(hzOfKey)

/**
 * `Zither::press` and `play_keys`: the seconds after the key between which
 * the hand reaches string `index` of `count`. Up and Down say when. Alternate
 * turns round on every key the device has had since it was made, which a
 * display that came later cannot count: all it knows is that the string is
 * reached one way or the other, so it gives both times, the sooner first.
 */
function zitherReached(
  index: number,
  count: number,
  strum: number,
  direction: number,
  into: [number, number],
): [number, number] {
  const up = zitherStrikeSeconds(index, count, strum, false)
  const down = zitherStrikeSeconds(index, count, strum, true)
  into[0] = direction === 0 ? up : direction === 1 ? down : Math.min(up, down)
  into[1] = direction === 0 ? up : direction === 1 ? down : Math.max(up, down)
  return into
}
/**
 * What sets a string going, where it meets it: a fingertip is round, a pick a
 * point, a hammer a block of felt on a stem. A brighter one is harder and
 * narrower, so it is drawn smaller.
 */
function zitherExciter(
  frame: Pick<DisplayFrame, 'ctx'>,
  exciter: number,
  x: number,
  y: number,
  brightness: number,
  colour: string,
  alpha: number,
): void {
  const { ctx } = frame
  const size = lerp(3.6, 1.8, clamp(brightness, 0, 1))
  if (exciter < 0.5) {
    dot(ctx, x, y, size, colour, { alpha })
    return
  }
  ctx.beginPath()
  if (exciter < 1.5) {
    ctx.moveTo(x, y)
    ctx.lineTo(x - size, y - size * 2.4)
    ctx.lineTo(x + size, y - size * 2.4)
  } else {
    ctx.rect(x - size, y - size - 1, size * 2, size + 1)
    ctx.rect(x - 0.5, y - size - 7, 1, 6)
  }
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

/** The box at rest: its strings, the chord one key plays, the hand that damps them, the box's own resonances. */
function zitherRest(frame: DisplayFrame<ZitherState>, parts: ZitherParts): void {
  const { ctx, colours, state } = frame
  const { strings, column } = parts
  const decay = frame.value('decay')
  const release = frame.value('release')
  const courses = clamp(frame.value('courses'), 0, 1)
  const direction = Math.round(frame.value('direction'))
  const strum = frame.value('strum')
  const foot = strings.y + strings.h
  const xOf = (seconds: number): number => zitherX(seconds, strings)

  // The scale of seconds.
  for (const seconds of [1, 10]) {
    const x = xOf(seconds)
    rule(ctx, x, strings.y, x, foot, { colour: colours.ink, alpha: INK.grid })
  }

  // The bed of strings, the C and G of every octave, each as long as it rings; their ends are the box's edge.
  ctx.beginPath()
  for (let key = 24; key <= 108; key++) {
    if (key % 12 !== 0 && key % 12 !== 7) continue
    const y = Math.floor(zitherY(hzOfKey(key), strings)) + 0.5
    ctx.moveTo(strings.x, y)
    ctx.lineTo(xOf(zitherRingSeconds(hzOfKey(key), decay)), y)
  }
  ctx.globalAlpha = 0.26
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(strings.x, strings.y)
  ctx.lineTo(strings.x, foot)
  for (let key = 21; key <= 110; key += 3) {
    const hz = Math.min(hzOfKey(key), ZITHER_HIGH_HZ)
    ctx.lineTo(xOf(zitherRingSeconds(hz, decay)), zitherY(hz, strings))
  }
  ctx.closePath()
  ctx.globalAlpha = INK.back
  ctx.stroke()

  // The body: a mark at each pitch the box rings at, as long as it is strong.
  const body = ZITHER_BODIES[clamp(Math.round(frame.value('body')), 0, ZITHER_BODIES.length - 1)]
  body.hz.forEach((hz, mode) => {
    const y = zitherY(hz, strings)
    rule(ctx, strings.x - 1 - 7 * Math.min(1, body.gain[mode]), y, strings.x - 1, y, {
      colour: colours.ink,
      width: 2,
    })
  })

  // The hand that damps: no string a key has left rings on past it. At the top of Release there is none.
  if (release < ZITHER_OPEN_RELEASE && release < decay * 1.6) {
    const reaches = clamp(220 * Math.pow(release / decay, -1 / 0.3), ZITHER_LOW_HZ, ZITHER_HIGH_HZ)
    const x = xOf(release)
    rule(ctx, x, zitherY(reaches, strings), x, foot, {
      colour: colours.ink,
      alpha: INK.text,
      dash: [2, 2],
    })
  }

  // The chord one key plays, on the C under middle C: each string begins where the hand reaches it.
  // Under Alternate that is one of two places, and the string is drawn from the nearer to the end of the further.
  const count = zitherChord(frame.value('chord'), ZITHER_REST_HZ, state.rest)
  const two = courses > 0.01
  const apart = two ? 0.5 + 0.7 * courses : 0
  ctx.beginPath()
  for (let index = 0; index < count; index++) {
    const hz = state.rest[index]
    const [soonest, latest] = zitherReached(index, count, strum, direction, state.span)
    const y = zitherY(hz, strings)
    // A course is two strings, further apart the further they are tuned apart.
    for (let side = two ? -1 : 0; side <= (two ? 1 : 0); side += 2) {
      ctx.moveTo(xOf(soonest), y + side * apart)
      ctx.lineTo(xOf(latest + zitherRingSeconds(hz, decay)), y + side * apart)
    }
  }
  ctx.globalAlpha = 1
  ctx.stroke()

  // The roll: the strokes that follow the strum, round the strings one after another from the
  // string the strum began on. Under Alternate that is either end, and both rounds are drawn.
  const roll = frame.value('roll')
  for (let end = 0; roll >= 0.5 && end < 2; end++) {
    const down = end === 1
    if (direction !== 2 && down !== (direction === 1)) continue
    let at = down ? count - 1 : 0
    let step = down ? -1 : 1
    for (let stroke = 1; stroke <= 6; stroke++) {
      const seconds =
        (count > 1 ? strum * 0.001 : 0) + stroke / Math.max(roll, ZITHER_ROLL_LEAST_HZ)
      // A tick across the string, so that it shows on a course drawn as two.
      const y = zitherY(state.rest[at], strings)
      rule(ctx, xOf(seconds), y - 3.5, xOf(seconds), y + 3.5, { colour: colours.ink, width: 1.5 })
      if (count < 2) continue
      // `Zither::play_keys`: Alternate goes to and fro, the others come round again.
      if (direction === 2 && (at + step < 0 || at + step >= count)) step = -step
      at = (at + step + count) % count
    }
    if (count < 2) break
  }

  // What plays it, on the string the hand comes to first (either end under Alternate), as far along it as Position.
  for (let end = 0; end < 2; end++) {
    if (end === 1 ? direction === 0 || count < 2 : direction === 1 && count > 1) continue
    const lead = state.rest[end === 1 ? count - 1 : 0]
    zitherExciter(
      frame,
      frame.value('exciter'),
      lerp(strings.x, xOf(zitherRingSeconds(lead, decay)), clamp(frame.value('position'), 0, 1)),
      zitherY(lead, strings),
      frame.value('brightness'),
      colours.ink,
      1,
    )
  }

  // The sympathetic strings, as strong as they are driven.
  const sympathy = clamp(frame.value('sympathy'), 0, 1)
  ctx.beginPath()
  for (const key of ZITHER_SYMPATHETIC) {
    const y = zitherY(hzOfKey(key), column)
    ctx.moveTo(column.x, y)
    ctx.lineTo(column.x + column.w, y)
  }
  ctx.globalAlpha = lerp(0.2, 1, sympathy)
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1

  // The scale is said at the foot, where the lowest strings are seldom played. The Release handle
  // rides along the foot: a word it would stand on is said a line higher.
  const hand = xOf(release)
  for (const seconds of [1, 10]) {
    const x = xOf(seconds)
    const under = hand > x - 5 && hand < x + 28
    label(frame, `${seconds} s`, x + 3, foot - (under ? 11 : 2))
  }
}

/** A later note has struck this pitch: a pluck stops the string first and a hammer lands on it, so the string is the later note's. */
function zitherTakenOver(
  notes: readonly DisplayNote[],
  state: ZitherState,
  index: number,
  hz: number,
  strum: number,
  direction: number,
): boolean {
  for (let later = index + 1; later < notes.length; later++) {
    const count = state.counts[later]
    for (let tone = 0; tone < count; tone++) {
      // `Zither::strike`: a blow within 0.0003 of a string's pitch is on that string.
      if (Math.abs(state.tones[later * ZITHER_TONES + tone] - hz) >= 0.0003 * hz) continue
      const latest = zitherReached(tone, count, strum, direction, state.span)[1]
      if (notes[later].age - latest >= 0) return true
    }
  }
  return false
}

/**
 * `Zither::strike_tone`, `holders`: a hammer lands on the moving string
 * without stopping it, so the string stays held for as long as any key that
 * struck it is down. For the string at `hz` that note `index` struck last:
 * the seconds since the last of its keys went up, null while one is down. An
 * earlier key counts if it was down when it struck and the string had not
 * rung out (twice its ring is 120 dB) before the next blow.
 */
function zitherHammerReleased(
  notes: readonly DisplayNote[],
  state: ZitherState,
  index: number,
  hz: number,
  strum: number,
  direction: number,
  ring: number,
): number | null {
  let released = notes[index].released
  let next = notes[index].age
  for (let earlier = index - 1; earlier >= 0 && released !== null; earlier--) {
    const count = state.counts[earlier]
    for (let tone = 0; tone < count; tone++) {
      if (Math.abs(state.tones[earlier * ZITHER_TONES + tone] - hz) >= 0.0003 * hz) continue
      const up = notes[earlier].released
      const struck =
        notes[earlier].age - zitherReached(tone, count, strum, direction, state.span)[1]
      if (struck < 0 || struck - next > 2 * ring) continue
      next = struck
      if (up === null) released = null
      else if (up <= struck && released !== null) released = Math.min(released, up)
    }
  }
  return released
}

/** The strings that sound, lit for the seconds each has left; the last note that sounds comes back. */
function zitherPlayed(frame: DisplayFrame<ZitherState>, parts: ZitherParts): DisplayNote | null {
  const { ctx, colours, state, notes } = frame
  const { strings, column } = parts
  const decay = frame.value('decay')
  const release = frame.value('release')
  const strum = frame.value('strum')
  const direction = Math.round(frame.value('direction'))
  const courses = clamp(frame.value('courses'), 0, 1)
  const roll = frame.value('roll')
  const hammer = frame.value('exciter') >= 1.5
  state.counts.length = notes.length
  for (let i = 0; i < notes.length; i++)
    state.counts[i] = zitherChord(
      frame.value('chord'),
      notes[i].frequency,
      state.tones,
      i * ZITHER_TONES,
    )

  // How much of its light every string of every key has.
  state.shares.length = notes.length * ZITHER_TONES
  state.shares.fill(0)
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    const count = state.counts[i]
    for (let tone = 0; tone < count; tone++) {
      const hz = state.tones[i * ZITHER_TONES + tone]
      const [soonest, latest] = zitherReached(tone, count, strum, direction, state.span)
      if (note.age < soonest || zitherTakenOver(notes, state, i, hz, strum, direction)) continue
      // Between the two times it may be reached at, the middle is as near as can be told.
      const since = Math.max(0, note.age - (soonest + latest) / 2)
      const ring = zitherRingSeconds(hz, decay)
      const released = hammer
        ? zitherHammerReleased(notes, state, i, hz, strum, direction, ring)
        : note.released
      const db = zitherStringDb(
        since,
        zitherBlowLevel(note.gain, count),
        released,
        ring,
        zitherDampedSeconds(ring, release),
        roll >= 0.5 ? zitherBlowLevel(note.gain, count, true) : 0,
        // `Zither::play_keys`: one stroke at a time, so each string has one in `count`.
        count / Math.max(roll, ZITHER_ROLL_LEAST_HZ),
      )
      const share = clamp(1 + db / 60, 0, 1)
      if (share >= ZITHER_DONE) state.shares[i * ZITHER_TONES + tone] = share
    }
  }
  // The device has 24 strings and gives the quietest to a new pitch: no more than that are lit.
  const least = loudestKept(state.shares, state.sorted, ZITHER_STRINGS_MOST)

  state.driven.fill(0)
  const sympathyDb = gainToDb(clamp(frame.value('sympathy'), 0, 1))
  let said: DisplayNote | null = null
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    const count = state.counts[i]
    for (let tone = 0; tone < count; tone++) {
      const share = state.shares[i * ZITHER_TONES + tone]
      if (share <= 0 || share < least) continue
      said = note
      const hz = state.tones[i * ZITHER_TONES + tone]
      const [soonest, latest] = zitherReached(tone, count, strum, direction, state.span)
      const sure = note.age >= latest
      const middle = (soonest + latest) / 2
      const since = Math.max(0, note.age - middle)
      const ring = zitherRingSeconds(hz, decay)
      const damped = zitherDampedSeconds(ring, release)
      const y = zitherY(hz, strings)
      const from = zitherX(soonest, strings)
      rule(ctx, from, y, zitherX(latest + ring, strings), y, {
        colour: colours.ink,
        alpha: INK.back,
      })
      // The two strings of a course beat: the light swells and thins at the pace they are tuned apart.
      const beat = Math.cos(2 * Math.PI * zitherCourseBeat(hz, courses) * since)
      const swell = courses > 0.01 ? Math.sqrt(1.49 + 1.4 * beat) / 1.7 : 0.6
      const held = hammer
        ? zitherHammerReleased(notes, state, i, hz, strum, direction, ring) === null
        : note.released === null
      const left = share * (held ? ring : damped)
      ctx.beginPath()
      ctx.moveTo(from, y)
      ctx.lineTo(Math.max(from + 1, zitherX(middle + left, strings)), y)
      ctx.strokeStyle = colours.accent
      // Until the hand has surely reached it the light is thin: it may not sound yet.
      ctx.lineWidth = sure ? 0.9 + 1.2 * swell : 0.75
      ctx.stroke()
      // What struck it, for a moment, where the moment is known.
      if (latest - soonest < 0.02 && since < 0.14) {
        const x = lerp(from, zitherX(latest + ring, strings), clamp(frame.value('position'), 0, 1))
        zitherExciter(
          frame,
          frame.value('exciter'),
          x,
          y,
          frame.value('brightness'),
          colours.accent,
          1 - since / 0.14,
        )
      }
      // A sympathetic string takes up what falls on its own partials, as strongly as Sympathy couples it.
      for (let string = 0; sure && string < ZITHER_SYMPATHETIC_HZ.length; string++) {
        const answer = zitherAnswerDb(hz, ZITHER_SYMPATHETIC_HZ[string]) + sympathyDb
        state.driven[string] = Math.max(state.driven[string], share + answer / 60)
      }
    }
  }

  // They are never damped: each rings on for its own time after what drove it has gone.
  for (let string = 0; string < ZITHER_SYMPATHETIC_HZ.length; string++) {
    const fall = frame.dt / zitherSympatheticSeconds(ZITHER_SYMPATHETIC_HZ[string])
    const level = Math.max(state.driven[string], state.ringing[string] - fall)
    state.ringing[string] = frame.powered ? level : 0
    if (state.ringing[string] < ZITHER_DONE) continue
    const y = zitherY(ZITHER_SYMPATHETIC_HZ[string], column)
    ctx.beginPath()
    ctx.moveTo(column.x, y)
    ctx.lineTo(column.x + column.w * state.ringing[string], y)
    ctx.strokeStyle = colours.accent
    ctx.lineWidth = 1.75
    ctx.stroke()
  }
  return said
}

const zither = plateDisplay<ZitherState>({
  place: 'window',
  columns: 2,
  params: [
    'exciter',
    'chord',
    'strum',
    'direction',
    'roll',
    'decay',
    'release',
    'brightness',
    'position',
    'courses',
    'sympathy',
    'body',
  ],
  live: { signal: true, notes: true },
  info: 'The box from above: low strings at the foot, each as long as it rings, on a scale of seconds from the bridge at the left. The strong strings are the chord one key plays and the dashed line is the damping hand. A struck string is lit for the time it has left.',
  init: () => ({
    rest: [],
    tones: [],
    counts: [],
    shares: [],
    sorted: [],
    span: [0, 0],
    ringing: new Float32Array(ZITHER_SYMPATHETIC.length),
    driven: new Float32Array(ZITHER_SYMPATHETIC.length),
  }),
  draw(frame) {
    ground(frame)
    const parts = zitherParts(frame)
    zitherRest(frame, parts)
    const said = zitherPlayed(frame, parts)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the box and the chord, and how long the last key's own string rings (the resting C while none is).
    const right = frame.width - 5
    const body = ZITHER_BODIES[clamp(Math.round(frame.value('body')), 0, ZITHER_BODIES.length - 1)]
    const chord =
      ZITHER_CHORDS[clamp(Math.round(frame.value('chord')), 0, ZITHER_CHORDS.length - 1)]
    label(frame, `${body.name}, ${chord.name}`, right, parts.strings.y + 7, 'right')
    const hz = clamp(said ? said.frequency : ZITHER_REST_HZ, ZITHER_LOW_HZ, ZITHER_HIGH_HZ)
    const ring = zitherRingSeconds(hz, frame.value('decay'))
    label(frame, `${pitchName(hz)} ${secondsText(ring)}`, right, parts.strings.y + 17, 'right')

    for (const point of zitherHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: zitherHandles,
})

function zitherHandles(view: DisplayView): DisplayHandle[] {
  const { strings } = zitherParts(view)
  const decay = view.value('decay')
  const scale = zitherRingSeconds(ZITHER_REST_HZ, 1)
  // The resting chord's own string ends a ring after the hand reaches it: last, when it is
  // strummed downwards, and drawn to there under Alternate, where it may be.
  const wait =
    Math.round(view.value('direction')) > 0 && Math.round(view.value('chord')) > 0
      ? view.value('strum') * 0.001
      : 0
  return [
    {
      key: 'decay',
      name: 'Decay',
      x: zitherX(wait + decay * scale, strings),
      y: zitherY(ZITHER_REST_HZ, strings),
      drag: (toX) => ({ decay: Math.max(0, zitherSeconds(toX, strings) - wait) / scale }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 6 }),
    },
    {
      key: 'release',
      name: 'Release',
      x: zitherX(view.value('release'), strings),
      y: strings.y + strings.h,
      drag: (toX) => ({ release: zitherSeconds(toX, strings) }),
      reset: () => ({ release: view.spec('release')?.default ?? 3 }),
    },
  ]
}

// --- Chord Harp --------------------------------------------------------------

/** `chord_harp.h`: the top edge of the plate, the most strings it holds, and how near two strings are one. */
const CHORD_HARP_TOP_HZ = 4300
const CHORD_HARP_STRINGS = 32
const CHORD_HARP_SAME = 1.0029
/** `chord_harp.h`, `kGatherSeconds` and `kSingleBelowMs`: keys this soon after a sweep starts join it; under this Strum a key is one pluck. */
const CHORD_HARP_GATHER = 0.03
const CHORD_HARP_SINGLE_MS = 0.5
/** `chord_harp.h`, `kMiddleHz`, `kMaxPan`, `kPadAttackSeconds`, `kPadReleaseSeconds`. */
const CHORD_HARP_MIDDLE_HZ = 261.626
const CHORD_HARP_PAN = 0.9
const CHORD_HARP_PAD_ATTACK = 0.08
const CHORD_HARP_PAD_RELEASE = 0.3
const CHORD_HARP_DIRECTIONS = ['Up', 'Down', 'Up Down', 'Random'] as const

/** `ChordHarp::note_on`: a key above the top edge is played octaves lower. */
export function chordHarpKeyHz(hz: number): number {
  let key = clamp(hz, 16, 20000)
  while (key > CHORD_HARP_TOP_HZ) key *= 0.5
  return key
}

/**
 * `ChordHarp::build_plate`: the strings of the plate for the `held` keys (Hz),
 * low to high, written into `into`; how many comes back. Every key's pitch
 * class in each of `octaves` octaves above the lowest key, and that key once
 * more on top.
 */
export function chordHarpPlate(
  held: readonly number[],
  octaves: number,
  into: number[],
  classes: number[] = [],
): number {
  if (held.length === 0) return 0
  const low = Math.min(...held)
  classes.length = 0
  classes.push(low)
  for (const key of held) {
    let hz = key
    while (hz >= 2 * low) hz *= 0.5
    // A hair under the octave is the lowest key's own class.
    if (hz * CHORD_HARP_SAME > 2 * low) hz *= 0.5
    if (classes.some((known) => known < hz * CHORD_HARP_SAME && hz < known * CHORD_HARP_SAME))
      continue
    classes.push(hz)
  }
  classes.sort((a, b) => a - b)
  let count = 0
  for (let octave = 0; octave <= octaves; octave++) {
    // The last pass adds only the lowest key's class, the top of the plate.
    const here = octave < octaves ? classes.length : 1
    for (let c = 0; c < here; c++) {
      const hz = classes[c] * 2 ** octave
      if (hz > CHORD_HARP_TOP_HZ || count === CHORD_HARP_STRINGS) return count
      into[count++] = hz
    }
  }
  return count
}

/** `ChordHarp::next_string`: how many plucks a sweep over `count` strings is; Up Down comes back from the top. */
export function chordHarpPlucks(direction: number, count: number): number {
  return direction === 2 ? Math.max(count, 2 * count - 1) : count
}

/** `ChordHarp::next_string`: the string pluck number `pluck` of a sweep falls on; −1 for Random, which nobody can tell. */
export function chordHarpString(direction: number, count: number, pluck: number): number {
  if (direction === 3) return -1
  if (direction === 1) return count - 1 - pluck
  return pluck < count ? pluck : 2 * (count - 1) - pluck
}

/** `ChordHarp::note_on`: how hard a key played at `gain` plucks. */
export const chordHarpVelocity = (gain: number): number => 0.25 + 0.75 * clamp(gain, 0, 1)

/** `ChordHarp::apply`, `decay_`: dB under a full pluck `since` seconds after it; 60 dB in the Sustain time, key down or not. */
export function chordHarpStringDb(since: number, velocity: number, sustain: number): number {
  return gainToDb(velocity) - (60 * since) / sustain
}

/** `ChordHarp::tune`: the corner of a string's low-pass; it follows the key a little and stays over the fundamental. */
export function chordHarpCornerHz(tone: number, hz: number): number {
  return Math.max(300 * Math.pow(50, tone) * Math.pow(hz / CHORD_HARP_MIDDLE_HZ, 0.3), 1.2 * hz)
}

/** `ChordHarp::pluck`: where a string lies between the speakers, −1 left to 1 right, from its `place` on the plate. */
export const chordHarpPan = (place: number, spread: number): number =>
  place * spread * CHORD_HARP_PAN

/** The pad under a key: it comes in over `kPadAttackSeconds` while the key is down and goes over `kPadReleaseSeconds` after. */
export function chordHarpPadShare(age: number, released: number | null): number {
  if (released === null) return clamp(age / CHORD_HARP_PAD_ATTACK, 0, 1)
  const reached = clamp((age - released) / CHORD_HARP_PAD_ATTACK, 0, 1)
  return reached * clamp(1 - released / CHORD_HARP_PAD_RELEASE, 0, 1)
}

/** The chord that lies on the plate at rest: C, E and G under middle C, the header's own example. */
const CHORD_HARP_REST = [130.81, 164.81, 196.0] as const
/** The seconds the envelope spans, and the sweeps the lane's height spans, shortest to longest by their ratio. */
const CHORD_HARP_LONG_SEC = 8.4
const CHORD_HARP_SWEEP_SHORT = 0.01
const CHORD_HARP_SWEEP_LONG = 10
const CHORD_HARP_DONE = 0.02
/** The plucks that are kept: Random plucks are not gathered by string, so more than there are strings. */
const CHORD_HARP_LIT_MOST = 64

interface ChordHarpParts {
  /** A pluck's life: seconds since it across, its level from full at the top down to 60 dB under. */
  life: Box
  /** The finger's way across the plate, the first pluck at the foot. */
  lane: Box
  /** The plate's strings as cells, low to high. */
  cells: Box
  pad: Box
  /** From each string to its place between the speakers. */
  fan: Box
  foot: Box
}

function chordHarpParts(view: Size): ChordHarpParts {
  const x = 6
  const w = view.width - 12
  const base = view.height
  return {
    life: { x, y: 19, w, h: base - 62 - 19 },
    lane: { x, y: base - 60, w, h: 9 },
    cells: { x, y: base - 50, w, h: 21 },
    pad: { x, y: base - 28, w, h: 4 },
    fan: { x, y: base - 23, w, h: 11 },
    foot: { x: 4, y: base - 10, w: view.width - 8, h: 6 },
  }
}

/**
 * Where a string stands across the plate, from its `place` (−1 the low end, 1
 * the high) on a plate of `count` strings: the strings lie evenly, each in the
 * middle of its cell. A key plucked alone (`count` 0) has no plate and stands
 * where it is heard.
 */
const chordHarpX = (place: number, count: number, cells: Box): number =>
  count > 0
    ? cells.x + (cells.w * (((place + 1) / 2) * (count - 1) + 0.5)) / count
    : cells.x + 4 + (cells.w - 8) * ((place + 1) / 2)
const chordHarpWide = (count: number, cells: Box): number =>
  count > 0 ? clamp(cells.w / count - 2, 2, 12) : 6
const chordHarpLifeX = (seconds: number, life: Box): number =>
  life.x + life.w * clamp(seconds / CHORD_HARP_LONG_SEC, 0, 1)
const chordHarpLifeY = (db: number, life: Box): number => life.y + life.h * clamp(-db / 60, 0, 1)
/** How high the finger's way climbs in its lane: as the sweep is long, from the shortest to the longest by their ratio. */
const chordHarpClimb = (seconds: number, lane: Box): number =>
  lane.h *
  clamp(
    Math.log(Math.max(seconds, 1e-6) / CHORD_HARP_SWEEP_SHORT) /
      Math.log(CHORD_HARP_SWEEP_LONG / CHORD_HARP_SWEEP_SHORT),
    0.12,
    1,
  )
/** A cell is as tall as its string is bright: the octaves between its pitch and its low-pass corner, seven and a bit at most. */
const chordHarpTall = (tone: number, hz: number, cells: Box): number =>
  cells.h * clamp(Math.log2(chordHarpCornerHz(tone, hz) / hz) / 7.3, 0.12, 1)
/** Where a string on the plate lies from its low end to its high: `ChordHarp::advance_sweep`, or by its pitch for a key plucked alone (`note_on`). */
const chordHarpPlace = (string: number, count: number): number =>
  count > 1 ? (2 * string) / (count - 1) - 1 : 0
const chordHarpAlonePlace = (hz: number): number =>
  clamp(Math.log2(hz / CHORD_HARP_MIDDLE_HZ) * 0.5, -1, 1)

interface ChordHarpState {
  /** The plate that is drawn: the last chord swept, or the resting chord; and how many strings it has. */
  plate: number[]
  strings: number
  held: number[]
  classes: number[]
  /**
   * The plucks, five numbers each: pitch, place on its plate, seconds since,
   * how hard, the strings of its plate. A Random pluck, whose string nobody
   * can tell, has a pitch under zero and no place.
   */
  lit: Float32Array
  count: number
  /** How much of its light each pluck has, 0 for none. */
  shares: number[]
  sorted: number[]
  /** The finger of the sweep that is on its way: the string under it, how far through it is and how many plucks it has; −1 for none. */
  finger: number
  through: number
  plucks: number
}

/** A pluck on a string that still rings plucks the same string again (`ChordHarp::pluck`): the later one is kept. */
function chordHarpPluck(
  state: ChordHarpState,
  hz: number,
  place: number,
  since: number,
  velocity: number,
  strings: number,
): void {
  let at = 0
  while (at < state.count) {
    const other = state.lit[at * 5]
    if (hz > 0 && other < hz * CHORD_HARP_SAME && hz < other * CHORD_HARP_SAME) break
    at++
  }
  if (at === CHORD_HARP_LIT_MOST) return
  if (at === state.count) state.count++
  state.lit[at * 5] = hz
  state.lit[at * 5 + 1] = place
  state.lit[at * 5 + 2] = since
  state.lit[at * 5 + 3] = velocity
  state.lit[at * 5 + 4] = strings
}

/** The plate at rest: the resting chord over Span octaves, or its three keys alone while Strum is at zero. */
function chordHarpRestPlate(view: DisplayView, into: number[]): number {
  if (view.value('strum') < CHORD_HARP_SINGLE_MS) {
    CHORD_HARP_REST.forEach((hz, key) => (into[key] = hz))
    return CHORD_HARP_REST.length
  }
  return chordHarpPlate(CHORD_HARP_REST, 1 + Math.round(view.value('span')), into)
}

/** The plate as its knobs set it, for the chord in `state.plate`: a pluck's life, the finger's way, the strings as cells, the pad and the fan to the speakers. */
function chordHarpRest(frame: DisplayFrame<ChordHarpState>, parts: ChordHarpParts): void {
  const { ctx, colours, state } = frame
  const { life, lane, cells, pad, fan } = parts
  const strum = frame.value('strum')
  const alone = strum < CHORD_HARP_SINGLE_MS
  const direction = Math.round(frame.value('direction'))
  const sustain = frame.value('sustain')
  const count = state.strings
  const placeOf = (string: number): number =>
    alone ? chordHarpAlonePlace(state.plate[string]) : chordHarpPlace(string, count)
  const xOf = (string: number): number => chordHarpX(placeOf(string), alone ? 0 : count, cells)

  // A pluck's life: 60 dB down in the Sustain time, a mark at every second. The dashed line is its chime, gone three times as fast.
  const floor = life.y + life.h
  rule(ctx, life.x, floor, life.x + life.w, floor, { colour: colours.ink, alpha: INK.rule })
  for (let seconds = 1; seconds < CHORD_HARP_LONG_SEC; seconds++) {
    const x = chordHarpLifeX(seconds, life)
    rule(ctx, x, floor - 2, x, floor + 1, { colour: colours.ink, alpha: INK.text })
  }
  const falls: Point[] = [
    [life.x, life.y],
    [chordHarpLifeX(sustain, life), floor],
  ]
  fillTo(ctx, falls, floor, colours.ink)
  trace(ctx, falls, { colour: colours.ink })
  trace(ctx, [falls[0], [chordHarpLifeX(sustain / 3, life), floor]], {
    colour: colours.ink,
    width: 1,
    alpha: INK.back,
    dash: [2, 2],
  })

  // The finger's way across the plate, pluck after pluck, climbing as high as the sweep is long. Random has none that can be told.
  const plucks = alone ? 0 : chordHarpPlucks(direction, count)
  if (plucks > 1 && direction !== 3) {
    const climb = chordHarpClimb((plucks - 1) * strum * 0.001, lane)
    ctx.beginPath()
    for (let pluck = 0; pluck < plucks; pluck++)
      ctx.lineTo(
        xOf(chordHarpString(direction, count, pluck)),
        lane.y + lane.h - (climb * pluck) / (plucks - 1),
      )
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
  } else if (plucks > 1) {
    const y = lane.y + lane.h - chordHarpClimb((plucks - 1) * strum * 0.001, lane) / 2
    rule(ctx, xOf(0), y, xOf(count - 1), y, { colour: colours.ink, dash: [1, 3] })
  }

  // The cells: a string of the lowest key's name is filled stronger, as a harp's C strings are coloured.
  const tone = frame.value('tone')
  const wide = chordHarpWide(alone ? 0 : count, cells)
  const foot = cells.y + cells.h
  for (let string = 0; string < count; string++) {
    const hz = state.plate[string]
    const tall = chordHarpTall(tone, hz, cells)
    const octaves = Math.log2(hz / state.plate[0])
    const root = Math.abs(octaves - Math.round(octaves)) < 0.01
    const box = { x: xOf(string) - wide / 2, y: foot - tall, w: wide, h: tall }
    fillRect(ctx, box, colours.ink, root ? INK.back : INK.fill)
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.strokeRect(box.x, box.y, box.w, box.h)
  }

  // The pad lies under the plate, as thick as it is loud.
  const thick = Math.max(1, clamp(frame.value('pad'), 0, 1) * pad.h)
  fillRect(ctx, { x: pad.x, y: pad.y + pad.h - thick, w: pad.w, h: thick }, colours.ink, INK.back)

  // The fan: each string to its place between the speakers. With Spread at zero they all meet in the middle.
  const spread = frame.value('spread')
  ctx.beginPath()
  for (let string = 0; string < count; string++) {
    ctx.moveTo(xOf(string), fan.y)
    ctx.lineTo(fan.x + (fan.w / 2) * (1 + chordHarpPan(placeOf(string), spread)), fan.y + fan.h)
  }
  ctx.globalAlpha = INK.back
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** `ChordHarp::render`, `chime_decay_`: the chime on a pluck dies twice as fast again as the string under it, and is cut off 60 dB down. */
export const chordHarpChimeShare = (since: number, sustain: number): number =>
  clamp(1 - (2 * since) / sustain, 0, 1)

/** `ChordHarp::find`: the next string of the plate beyond `cursor` Hz, upwards or downwards; −1 for none. */
function chordHarpFind(
  plate: readonly number[],
  count: number,
  cursor: number,
  heading: number,
): number {
  if (heading > 0) {
    for (let string = 0; string < count; string++)
      if (plate[string] > cursor * CHORD_HARP_SAME) return string
  } else {
    for (let string = count - 1; string >= 0; string--)
      if (plate[string] * CHORD_HARP_SAME < cursor) return string
  }
  return -1
}

/** `ChordHarp::build_plate`: the plate of the keys that were down when note `last` was pressed, left in `state.plate`. */
function chordHarpPlateAt(
  notes: readonly DisplayNote[],
  last: number,
  octaves: number,
  state: ChordHarpState,
): number {
  state.held.length = 0
  for (let key = 0; key <= last; key++) {
    const up = notes[key].released
    if (up === null || up < notes[last].age) state.held.push(chordHarpKeyHz(notes[key].frequency))
  }
  return chordHarpPlate(state.held, octaves, state.plate, state.classes)
}

/**
 * The sweeps that were played, worked out as `ChordHarp::note_on` and
 * `advance_sweep` do: a key press sweeps the chord then held from one end, a
 * key within 30 ms of the sweep's start joins it (the plate is laid again and
 * the finger goes on from the string it is on, so a lower key that comes late
 * is passed by on the way up), and a later key stops it where it was. A key
 * sent within half a block of the first is taken as there before the first
 * pluck. The plucks are written to `state.lit`, and the plate of the last
 * sweep is left in `state.plate`: the device keeps it too. With no sweep it
 * is the resting chord.
 */
function chordHarpSweeps(frame: DisplayFrame<ChordHarpState>): void {
  const { state, notes } = frame
  const strum = frame.value('strum')
  const gap = strum * 0.001
  const direction = Math.round(frame.value('direction'))
  const octaves = 1 + Math.round(frame.value('span'))
  const block = (0.5 * BLOCK_FRAMES) / frame.sampleRate
  state.count = 0
  state.strings = 0
  state.finger = -1
  let from = 0
  while (from < notes.length) {
    const first = notes[from]
    let velocity = chordHarpVelocity(first.gain)
    let next = from + 1
    if (strum < CHORD_HARP_SINGLE_MS) {
      const hz = chordHarpKeyHz(first.frequency)
      chordHarpPluck(state, hz, chordHarpAlonePlace(hz), first.age, velocity, 0)
      from = next
      continue
    }
    let count = chordHarpPlateAt(notes, from, octaves, state)
    let heading = direction === 1 ? -1 : 1
    let turn = direction === 2
    let cursor = heading > 0 ? 0 : Infinity
    let left = count
    let plucks = 0
    let heard = 0
    let string = -1
    let cut = false
    for (let running = count > 0; running;) {
      const wait = plucks * gap
      // The keys pressed before this pluck: each joins the sweep or starts the next.
      while (next < notes.length && first.age - notes[next].age <= (plucks === 0 ? block : wait)) {
        const before = count
        count = chordHarpPlateAt(notes, next, octaves, state)
        const more =
          direction === 3
            ? left > 0 && count > 0
            : chordHarpFind(state.plate, count, cursor, heading) >= 0 ||
              (turn && chordHarpFind(state.plate, count, cursor, -1) >= 0)
        cut = first.age - notes[next].age >= CHORD_HARP_GATHER || !more
        if (cut) break
        velocity = Math.max(velocity, chordHarpVelocity(notes[next].gain))
        left += Math.max(0, count - before)
        next++
      }
      if (cut) break
      // `ChordHarp::next_string`: Random plucks as many as the plate has; Up Down turns round at the top.
      let at = -1
      if (direction === 3) {
        if (left <= 0) break
        left--
      } else {
        at = chordHarpFind(state.plate, count, cursor, heading)
        if (at < 0 && turn) {
          heading = -1
          turn = false
          at = chordHarpFind(state.plate, count, cursor, heading)
        }
        if (at < 0) break
      }
      if (wait <= first.age) {
        // Random: that a pluck fell then is known, on which string is not.
        const hz = at < 0 ? -1 : state.plate[at]
        chordHarpPluck(state, hz, chordHarpPlace(at, count), first.age - wait, velocity, count)
        heard++
        string = at
      }
      plucks++
      if (at >= 0) cursor = state.plate[at]
      running =
        direction === 3
          ? left > 0
          : chordHarpFind(state.plate, count, cursor, heading) >= 0 ||
            (turn && chordHarpFind(state.plate, count, cursor, -1) >= 0)
    }
    state.strings = count
    // The finger, while it is on its way: over the string it plucked last.
    state.finger = !cut && heard > 0 && heard < plucks ? string : -1
    state.through = plucks > 1 ? first.age / ((plucks - 1) * gap) : 0
    state.plucks = plucks
    from = next
  }
  if (state.strings === 0) state.strings = chordHarpRestPlate(frame, state.plate)
}

/** The plucks that ring: each is a bead on its way down the life, and its cell is filled as far as it has yet to fall. The pitch plucked last comes back, 0 for none. */
function chordHarpPlayed(frame: DisplayFrame<ChordHarpState>, parts: ChordHarpParts): number {
  const { ctx, colours, state } = frame
  const { life, lane, cells, pad, fan } = parts
  const sustain = frame.value('sustain')
  const tone = frame.value('tone')
  const spread = frame.value('spread')
  const foot = cells.y + cells.h
  if (state.finger >= 0) {
    const climb = chordHarpClimb((state.plucks - 1) * frame.value('strum') * 0.001, lane)
    const x = chordHarpX(chordHarpPlace(state.finger, state.strings), state.strings, cells)
    dot(ctx, x, lane.y + lane.h - climb * clamp(state.through, 0, 1), 2.5, colours.accent)
  }
  state.shares.length = state.count
  for (let at = 0; at < state.count; at++) {
    const db = chordHarpStringDb(state.lit[at * 5 + 2], state.lit[at * 5 + 3], sustain)
    const share = clamp(1 + db / 60, 0, 1)
    state.shares[at] = share < CHORD_HARP_DONE ? 0 : share
  }
  // The device has 32 strings and gives the quietest to a new pitch: no more than that are lit.
  const least = loudestKept(state.shares, state.sorted, CHORD_HARP_STRINGS)
  let said = 0
  let newest = Infinity
  for (let at = 0; at < state.count; at++) {
    const hz = state.lit[at * 5]
    const place = state.lit[at * 5 + 1]
    const since = state.lit[at * 5 + 2]
    const strings = state.lit[at * 5 + 4]
    const db = chordHarpStringDb(since, state.lit[at * 5 + 3], sustain)
    const share = state.shares[at]
    if (share <= 0 || share < least) continue
    dot(ctx, chordHarpLifeX(since, life), chordHarpLifeY(db, life), 2, colours.accent)
    if (hz < 0) continue
    if (since < newest) {
      newest = since
      said = hz
    }
    // A string of the plate that is drawn stands in its cell there, whatever plate it was plucked on.
    let string = -1
    for (let s = 0; strings > 0 && s < state.strings && string < 0; s++)
      if (state.plate[s] < hz * CHORD_HARP_SAME && hz < state.plate[s] * CHORD_HARP_SAME) string = s
    const on = string < 0 ? strings : state.strings
    const x = chordHarpX(string < 0 ? place : chordHarpPlace(string, on), on, cells)
    const wide = chordHarpWide(on, cells)
    const tall = chordHarpTall(tone, hz, cells)
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.strokeRect(x - wide / 2, foot - tall, wide, tall)
    const high = tall * share
    fillRect(ctx, { x: x - wide / 2, y: foot - high, w: wide, h: high }, colours.accent)
    ctx.beginPath()
    ctx.moveTo(x, fan.y)
    ctx.lineTo(fan.x + (fan.w / 2) * (1 + chordHarpPan(place, spread)), fan.y + fan.h)
    ctx.globalAlpha = 1
    ctx.strokeStyle = colours.accent
    ctx.lineWidth = 0.75 + share
    ctx.stroke()
  }
  // The pad sounds under the plate for as long as a key is down: as much of it is lit as the loudest key gives.
  const level = clamp(frame.value('pad'), 0, 1)
  let sounds = 0
  for (const note of frame.notes) {
    // `ChordHarp::note_on`: a pad voice is as loud as 0.6 and 0.4 of how hard its key was played.
    const share = (0.6 + 0.4 * note.gain) * chordHarpPadShare(note.age, note.released)
    sounds = Math.max(sounds, share)
  }
  if (level * sounds >= CHORD_HARP_DONE) {
    const thick = Math.max(1, level * pad.h)
    const lit = pad.w * sounds
    fillRect(
      ctx,
      { x: pad.x + (pad.w - lit) / 2, y: pad.y + pad.h - thick, w: lit, h: thick },
      colours.accent,
    )
  }
  return said
}

const chordHarp = plateDisplay<ChordHarpState>({
  place: 'window',
  columns: 2,
  params: ['strum', 'direction', 'span', 'sustain', 'tone', 'pad', 'spread'],
  live: { signal: true, notes: true },
  info: 'The strum plate: a cell for each string of the chord, as tall as it is bright, under the finger’s way across them. A plucked cell fills and drains, its line below runs to its place between the speakers, and its bead slides down the slope at the top, 60 dB in the Sustain time.',
  init: () => ({
    plate: [],
    strings: 0,
    held: [],
    classes: [],
    lit: new Float32Array(CHORD_HARP_LIT_MOST * 5),
    count: 0,
    shares: [],
    sorted: [],
    finger: -1,
    through: 0,
    plucks: 0,
  }),
  draw(frame) {
    ground(frame)
    const parts = chordHarpParts(frame)
    chordHarpSweeps(frame)
    chordHarpRest(frame, parts)
    const said = chordHarpPlayed(frame, parts)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: how the plate is swept, and how long a string rings (with the pitch plucked last).
    const strum = frame.value('strum')
    const way = CHORD_HARP_DIRECTIONS[clamp(Math.round(frame.value('direction')), 0, 3)]
    const swept = strum < CHORD_HARP_SINGLE_MS ? 'Single' : `${way} ${Math.round(strum)} ms`
    label(frame, swept, 6, 13)
    const rings = secondsText(frame.value('sustain'))
    label(frame, said > 0 ? `${pitchName(said)} ${rings}` : rings, frame.width - 6, 13, 'right')

    for (const point of chordHarpHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: chordHarpHandles,
})

function chordHarpHandles(view: DisplayView): DisplayHandle[] {
  const { life } = chordHarpParts(view)
  return [
    {
      key: 'sustain',
      name: 'Sustain',
      x: chordHarpLifeX(view.value('sustain'), life),
      y: life.y + life.h,
      drag: (toX) => ({
        sustain: CHORD_HARP_LONG_SEC * clamp((toX - life.x) / life.w, 0, 1),
      }),
      reset: () => ({ sustain: view.spec('sustain')?.default ?? 3 }),
    },
  ]
}

// --- Tanpura -----------------------------------------------------------------

/** `tanpura.h`, `kFirstString`: the first string against the key, by Tuning, and what the four are called. */
const TANPURA_TUNINGS = [
  { name: 'Pa', ratio: 3 / 4 },
  { name: 'Ma', ratio: 2 / 3 },
  { name: 'Ni', ratio: 15 / 16 },
] as const
/** `tanpura.h`, `kPan`: where each string sits with Spread at 1. */
const TANPURA_PAN = [-0.35, 0.8, -0.8, 0.2] as const
/** `tanpura.h`: the finger rests this long before a pluck and the string under it rings this long; a string rings this long once the key is up. */
const TANPURA_FINGER = 0.03
const TANPURA_FINGER_RING = 0.05
const TANPURA_RELEASE = 3
/** `jawari_string.h`, `kGap` and `kReach`: how far the string must swing to touch the bridge, and the swing over which the contact closes; 1 is a full pluck. */
const TANPURA_GAP = 0.1
const TANPURA_REACH = 0.3
/** `jawari_string.h`: the bloom measured at full contact, in dB by the string's pitch. */
const TANPURA_BLOOM: readonly (readonly [number, number])[] = [
  [33, 3],
  [49, 10],
  [262, 10],
  [392, 6],
  [523, 6],
  [784, 0],
]

/** `Tanpura::pluck`, `ratios`: the pitch of string `string` (0 to 3) against the key; Detune parts the two middle ones, half each way. */
export function tanpuraRatio(string: number, tuning: number, detune: number): number {
  if (string === 0) return TANPURA_TUNINGS[clamp(Math.round(tuning), 0, 2)].ratio
  if (string === 3) return 0.5
  return Math.pow(2, ((string === 1 ? -0.5 : 0.5) * detune) / 1200)
}

/** `Tanpura::note_on`: how hard a key played at `gain` plucks. */
export const tanpuraAmp = (gain: number): number => 0.25 + 0.75 * clamp(gain, 0, 1)

/** `Tanpura::contact_for` and the junction of `JawariString::render`: how firmly the bridge holds a string that swings as far as `swing`. */
export function tanpuraContact(swing: number, jawari: number): number {
  const c = clamp((swing - TANPURA_GAP) / TANPURA_REACH, 0, 1)
  return jawari * Math.sqrt(jawari) * c * c * (3 - 2 * c)
}

/** `jawari_string.h`: how much the bridge does to a string at `hz`, as a share of its most (10 dB of bloom). */
export function tanpuraBloom(hz: number): number {
  const table = TANPURA_BLOOM
  if (hz <= table[0][0]) return table[0][1] / 10
  for (let i = 1; i < table.length; i++) {
    if (hz > table[i][0]) continue
    const along = Math.log(hz / table[i - 1][0]) / Math.log(table[i][0] / table[i - 1][0])
    return lerp(table[i - 1][1], table[i][1], along) / 10
  }
  return 0
}

/** `tanpura.h`, `kChunk` and `kTimeSpread`: the pluck clock is read every 16 samples, and each gap strays up to 3 % from the even one. */
const TANPURA_CHUNK = 16
const TANPURA_STRAY = 0.03

/** `Tanpura::control`: seconds from one pluck to the next: a quarter of Speed, and half a tick of the clock, since a pluck waits for the tick after it is due. */
export const tanpuraPluckSeconds = (speed: number, sampleRate: number): number =>
  speed / 4 + (0.5 * TANPURA_CHUNK) / sampleRate

/**
 * `Tanpura::pluck`, `pace`: how far the hand may be from an even hand's
 * place, in plucks, `plucks` plucks after the key. Each gap is the even one
 * give or take 3 %, any share of that as likely as another, and the display
 * cannot read which: the errors add up as the root of their number. This is
 * twice their standard deviation, which holds the hand nineteen times in
 * twenty: a third of a pluck after a minute at the fastest Speed, more than a
 * whole one after ten.
 */
export const tanpuraUnsure = (plucks: number): number =>
  ((2 * TANPURA_STRAY) / Math.sqrt(3)) * Math.sqrt(Math.max(plucks, 0))

/** The mean of the seconds since a pluck that comes every `round`, over the times from `unsure` before `since` to `unsure` after. */
function tanpuraSince(since: number, unsure: number, round: number): number {
  if (unsure <= 0) return since
  const before = unsure - since
  const beyond = since + unsure - round
  // The part of the span that lies before the pluck is the end of the round before, and the part past the next is its start.
  if (before > 0) return (before * (round - before / 2) + (since + unsure) ** 2 / 2) / (2 * unsure)
  if (beyond > 0)
    return (
      ((round - since + unsure) * ((since - unsure + round) / 2) + beyond ** 2 / 2) / (2 * unsure)
    )
  return since
}

/**
 * How far string `string` of a key has fallen, in dB under a full pluck; null
 * before its first pluck. `Tanpura::control`: the four are plucked in turn, a
 * quarter of `round` apart, round and round while the key is held, each
 * ringing Decay; the finger damps a string for a moment before its next
 * pluck, and once the key is up nothing is plucked and a string rings 3 s at
 * most. With `unsure`, the seconds the hand may be early or late, it is the
 * mean over the times the last pluck may have come at. `damped` is the seconds
 * since the strings were let go, where that was later than the last pluck's
 * round: a key struck again while it is held stops the round and damps nothing.
 */
export function tanpuraStringDb(
  string: number,
  age: number,
  released: number | null,
  amp: number,
  round: number,
  decay: number,
  unsure = 0,
  damped: number | null = released,
): number | null {
  const held = age - (released ?? 0)
  const first = (string * round) / 4
  if (held < first) return null
  const since = (held - first) % round
  // On its first round a string was not plucked before, and no span is wider than the round.
  const span = Math.min(unsure, round / 2, held - first)
  let db = gainToDb(amp) - (60 * tanpuraSince(since, span, round)) / decay
  if (released === null) {
    const fingered = since - (round - TANPURA_FINGER)
    // The finger's moment is drawn only while it is known to within itself.
    if (fingered > 0 && unsure < TANPURA_FINGER) db -= (60 * fingered) / TANPURA_FINGER_RING
    return db
  }
  const let_go = damped ?? 0
  return db - (60 * (released - let_go)) / decay - (60 * let_go) / Math.min(decay, TANPURA_RELEASE)
}

/** Where an even hand is in its round, 0 at the first string's pluck to 1 at its next. */
export const tanpuraRound = (age: number, round: number): number => (age % round) / round

const TANPURA_DONE = 0.02
const TANPURA_STRINGS = 4
/** `tanpura.h`, `kMinHz` and `kMaxHz`: the keys it takes. */
const TANPURA_LOW_HZ = 32.7
const TANPURA_HIGH_HZ = 2093

interface TanpuraState {
  /** Each string as the loudest key leaves it: how much of its light it has, how far it swings (1 a full pluck), its pitch. */
  shares: Float32Array
  swings: Float32Array
  pitches: Float32Array
}

interface TanpuraParts {
  /** The round: its middle and how far its four arms reach. */
  dial: { x: number; y: number; r: number }
  /** The strings: the nut at `x`, the tailpiece at `x + w`, the first string at `y` and the last at `y + h`. */
  strings: Box
  /** Where the bridge crosses them. */
  bridge: number
  /** Where each string sits between the speakers. */
  pans: Box
  foot: Box
}

function tanpuraParts(view: Size): TanpuraParts {
  const r = view.width < 160 ? 21 : 26
  const dial = { x: 8 + r, y: (19 + view.height - 21) / 2, r }
  const left = dial.x + r + 9
  const strings = { x: left, y: 28, w: view.width - 8 - left, h: view.height - 62 }
  return {
    dial,
    strings,
    bridge: strings.x + strings.w - 24,
    pans: { x: 8, y: view.height - 17, w: view.width - 16, h: 5 },
    foot: { x: 4, y: view.height - 10, w: view.width - 8, h: 6 },
  }
}

/** A lower string is a thicker one. */
const tanpuraThick = (ratio: number): number => clamp(1.1 * Math.pow(ratio, -1.2), 1, 2.6)
const tanpuraRow = (string: number, strings: Box): number =>
  strings.y + (string * strings.h) / (TANPURA_STRINGS - 1)
/** The arm of string `string` on the round: the first at the top, then clockwise as the hand goes. */
const tanpuraAngle = (turns: number): number => -Math.PI / 2 + turns * 2 * Math.PI

/** The tanpura at rest: the round of the plucking hand, and the four strings over their bridge on the gourd. */
function tanpuraRest(frame: DisplayFrame<TanpuraState>, parts: TanpuraParts): void {
  const { ctx, colours } = frame
  const { dial, strings, bridge, pans } = parts
  const tuning = frame.value('tuning')
  const detune = frame.value('detune')
  const jawari = clamp(frame.value('jawari'), 0, 1)
  const tail = strings.x + strings.w

  // The gourd under the bridge: the more Body, the more of it there is.
  clipped(ctx, { x: 1, y: 1, w: frame.width - 2, h: frame.height - 2 }, () => {
    ctx.beginPath()
    ctx.arc(bridge + 5, strings.y + strings.h / 2, strings.h / 2 + 12, 0, Math.PI * 2)
    ctx.globalAlpha = lerp(0.04, 0.42, clamp(frame.value('body'), 0, 1))
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = INK.rule
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
  })
  ctx.globalAlpha = 1

  // The strings from the nut to the tailpiece, each with its tuning bead beyond the bridge: Detune slides the middle two apart.
  rule(ctx, strings.x, strings.y - 4, strings.x, strings.y + strings.h + 4, {
    colour: colours.ink,
    width: 2,
  })
  for (let string = 0; string < TANPURA_STRINGS; string++) {
    const y = tanpuraRow(string, strings)
    rule(ctx, strings.x, y, tail, y, {
      colour: colours.ink,
      width: tanpuraThick(tanpuraRatio(string, tuning, 0)),
      alpha: INK.text,
    })
    const slid = string === 1 ? -detune : string === 2 ? detune : 0
    dot(ctx, bridge + 14 + slid * 0.85, y, 2.2, colours.ink)
  }
  // The bridge: a plain edge with Jawari at zero, wider the more of the string it holds.
  const wide = 2 + 9 * jawari * Math.sqrt(jawari)
  fillRect(ctx, { x: bridge - wide / 2, y: strings.y - 5, w: wide, h: strings.h + 10 }, colours.ink)

  // The round: an arm for each string, and across it the level the string has fallen to when the hand comes back to it.
  ctx.beginPath()
  ctx.arc(dial.x, dial.y, dial.r, 0, Math.PI * 2)
  ctx.globalAlpha = INK.rule
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
  const left = clamp(1 - frame.value('speed') / frame.value('decay'), 0, 1)
  for (let string = 0; string < TANPURA_STRINGS; string++) {
    const angle = tanpuraAngle(string / TANPURA_STRINGS)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    rule(ctx, dial.x + 3 * cos, dial.y + 3 * sin, dial.x + dial.r * cos, dial.y + dial.r * sin, {
      colour: colours.ink,
      width: tanpuraThick(tanpuraRatio(string, tuning, 0)),
      alpha: INK.back,
    })
    const x = dial.x + (3 + (dial.r - 3) * left) * cos
    const y = dial.y + (3 + (dial.r - 3) * left) * sin
    rule(ctx, x - 3.5 * sin, y + 3.5 * cos, x + 3.5 * sin, y - 3.5 * cos, {
      colour: colours.ink,
      width: 1.5,
    })
  }
  // Which way round: a head on the rim between the first string and the second.
  const head = tanpuraAngle(1 / 8)
  ctx.beginPath()
  ctx.moveTo(dial.x + dial.r * Math.cos(head + 0.16), dial.y + dial.r * Math.sin(head + 0.16))
  ctx.lineTo(
    dial.x + (dial.r + 3) * Math.cos(head - 0.1),
    dial.y + (dial.r + 3) * Math.sin(head - 0.1),
  )
  ctx.lineTo(
    dial.x + (dial.r - 3) * Math.cos(head - 0.1),
    dial.y + (dial.r - 3) * Math.sin(head - 0.1),
  )
  ctx.closePath()
  ctx.fillStyle = colours.ink
  ctx.fill()

  // Where each string sits between the speakers.
  const spread = clamp(frame.value('spread'), 0, 1)
  for (let string = 0; string < TANPURA_STRINGS; string++) {
    const thick = 1.3 * tanpuraThick(tanpuraRatio(string, tuning, 0))
    const x = pans.x + (pans.w / 2) * (1 + TANPURA_PAN[string] * spread)
    fillRect(
      ctx,
      { x: x - thick / 2, y: pans.y + 2, w: thick, h: pans.h - 2 },
      colours.ink,
      INK.text,
    )
  }
}

/** `Tanpura::note_on`: the later note of the same key that was struck at the moment this one was taken as let go, while it was held. */
function tanpuraStruckAgain(notes: readonly DisplayNote[], index: number): DisplayNote | null {
  const { id, released } = notes[index]
  if (released === null) return null
  for (let later = index + 1; later < notes.length; later++)
    if (notes[later].id === id && Math.abs(notes[later].age - released) < 0.002) return notes[later]
  return null
}

/** The strings that sound: each swings on its row and buzzes at the bridge, its arm of the round is lit as far as it has yet to fall, and the hand goes round the rim. The last key that sounds comes back. */
function tanpuraPlayed(frame: DisplayFrame<TanpuraState>, parts: TanpuraParts): DisplayNote | null {
  const { ctx, colours, state } = frame
  const { dial, strings, bridge, pans } = parts
  const speed = frame.value('speed')
  const decay = frame.value('decay')
  const tuning = frame.value('tuning')
  const detune = frame.value('detune')
  const jawari = clamp(frame.value('jawari'), 0, 1)
  state.shares.fill(0)
  const notes = frame.notes
  const pluck = tanpuraPluckSeconds(speed, frame.sampleRate)
  const round = TANPURA_STRINGS * pluck
  let said: DisplayNote | null = null
  for (let index = 0; index < notes.length; index++) {
    const note = notes[index]
    const amp = tanpuraAmp(note.gain)
    // How far the hand may have strayed by now, or by the time the key went up.
    const stray = tanpuraUnsure((note.age - (note.released ?? 0)) / pluck)
    // `Tanpura::note_on`: a key struck again while it is held keeps its tanpura and starts the round over.
    const again = tanpuraStruckAgain(notes, index)
    for (let string = 0; string < TANPURA_STRINGS; string++) {
      let let_go = note.released
      if (again) {
        // Its strings ring on undamped until the new round comes to them.
        if (tanpuraStringDb(string, again.age, again.released, 1, round, decay) !== null) continue
        let_go = again.released
      }
      const db = tanpuraStringDb(
        string,
        note.age,
        note.released,
        amp,
        round,
        decay,
        stray * pluck,
        let_go,
      )
      const share = db === null ? 0 : clamp(1 + db / 60, 0, 1)
      if (db === null || share < TANPURA_DONE) continue
      said = note
      if (share <= state.shares[string]) continue
      state.shares[string] = share
      state.swings[string] = Math.pow(10, db / 20)
      state.pitches[string] =
        clamp(note.frequency, TANPURA_LOW_HZ, TANPURA_HIGH_HZ) *
        tanpuraRatio(string, tuning, detune)
    }
    // The hand, for as long as the key is held: once round in four plucks. It is drawn over all the
    // rim it may be on, a point at the key and a longer and thinner arc as its unevenness adds up.
    if (note.released !== null) continue
    const angle = tanpuraAngle(tanpuraRound(note.age, round))
    const reach = clamp((stray / TANPURA_STRINGS) * 2 * Math.PI, 0.01, Math.PI)
    ctx.beginPath()
    ctx.arc(dial.x, dial.y, dial.r, angle - reach, angle + reach)
    ctx.strokeStyle = colours.accent
    ctx.lineWidth = lerp(5, 2, reach / Math.PI)
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.lineCap = 'butt'
  }

  const spread = clamp(frame.value('spread'), 0, 1)
  const long = bridge - strings.x
  const steps = Math.max(8, Math.round(long / 2.5))
  // The buzz is faster than a frame: its ripple turns over on every one.
  const turn = Math.floor(frame.now * 30) % 2 === 0 ? 1 : -1
  ctx.strokeStyle = colours.accent
  ctx.lineJoin = 'round'
  for (let string = 0; string < TANPURA_STRINGS; string++) {
    const share = state.shares[string]
    if (share < TANPURA_DONE) continue
    const thick = tanpuraThick(tanpuraRatio(string, tuning, 0))
    const angle = tanpuraAngle(string / TANPURA_STRINGS)
    ctx.beginPath()
    ctx.moveTo(dial.x + 3 * Math.cos(angle), dial.y + 3 * Math.sin(angle))
    ctx.lineTo(
      dial.x + (3 + (dial.r - 3) * share) * Math.cos(angle),
      dial.y + (3 + (dial.r - 3) * share) * Math.sin(angle),
    )
    ctx.lineWidth = thick + 1
    ctx.stroke()

    // The string: it swings as wide as it is loud, and near the bridge it buzzes as firmly as the bridge holds it.
    const swing = state.swings[string]
    const bow =
      4.5 *
      Math.sqrt(swing) *
      Math.sin(frame.now * 2 * Math.PI * (4.5 + string * 0.8) + string * 1.7)
    const buzz = 2.4 * tanpuraContact(swing, jawari) * tanpuraBloom(state.pitches[string])
    const y = tanpuraRow(string, strings)
    ctx.beginPath()
    for (let step = 0; step <= steps; step++) {
      const u = step / steps
      const near = step === steps ? 0 : clamp((u - 0.4) / 0.6, 0, 1)
      const ripple = buzz * near * (step % 2 === 0 ? turn : -turn)
      ctx.lineTo(strings.x + u * long, y + bow * Math.sin(Math.PI * u) + ripple)
    }
    ctx.lineWidth = thick + 0.5
    ctx.stroke()

    const x = pans.x + (pans.w / 2) * (1 + TANPURA_PAN[string] * spread)
    const high = pans.h * share
    fillRect(
      ctx,
      { x: x - thick, y: pans.y + pans.h - high, w: thick * 2, h: high },
      colours.accent,
    )
  }
  return said
}

const tanpura = plateDisplay<TanpuraState>({
  place: 'window',
  columns: 2,
  params: ['tuning', 'jawari', 'speed', 'decay', 'detune', 'body', 'spread'],
  live: { signal: true, notes: true },
  info: 'On the left the round the hand makes over the four strings, once in the Speed time: the lit arc on the rim is where the hand may be, longer the longer a key is held. On the right the strings over their bridge, as wide as Jawari, on the gourd. A plucked string swings and buzzes at the bridge.',
  init: () => ({
    shares: new Float32Array(TANPURA_STRINGS),
    swings: new Float32Array(TANPURA_STRINGS),
    pitches: new Float32Array(TANPURA_STRINGS),
  }),
  draw(frame) {
    ground(frame)
    const parts = tanpuraParts(frame)
    tanpuraRest(frame, parts)
    const said = tanpuraPlayed(frame, parts)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the four strings as they are sung, and the time of one round (with the key that sounds).
    const first = TANPURA_TUNINGS[clamp(Math.round(frame.value('tuning')), 0, 2)].name
    label(frame, `${first} Sa Sa Sa`, 6, 13)
    const round = secondsText(frame.value('speed'))
    const key = said ? clamp(said.frequency, TANPURA_LOW_HZ, TANPURA_HIGH_HZ) : 0
    label(frame, said ? `${pitchName(key)} ${round}` : round, frame.width - 6, 13, 'right')
  },
})

export const STRING_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  harp: { display: harp, face: ['strings', 'decay', 'pluck', 'touch'] },
  zither: {
    display: zither,
    face: ['exciter', 'chord', 'strum', 'decay'],
    sections: [
      ['exciter', 'chord', 'strum', 'direction', 'roll'],
      ['decay', 'release', 'brightness', 'position', 'courses'],
      ['sympathy', 'body', 'volume'],
    ],
  },
  'chord-harp': { display: chordHarp, face: ['strum', 'span', 'sustain', 'tone'] },
  tanpura: { display: tanpura, face: ['tuning', 'jawari', 'speed', 'decay'] },
}
