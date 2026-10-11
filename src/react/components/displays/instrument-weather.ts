// The displays of the invented instruments: weather.
//
// Three instruments whose sound is something that happens to a place: rain on
// a surface, a crack crossing a frozen lake, a far station coming through the
// night air. Each display is that happening as the knobs set it, with the keys
// lit where they act. Much of what these instruments do is drawn from seeded
// generators nobody outside can follow, so a display draws the shape, the rate
// and the spread of such a thing still, in the ink, and lights only what a key
// certainly does: when it lands, how long it rings, where it settles.

import {
  INK,
  clamp,
  dot,
  fillRect,
  gainToDb,
  ground,
  handle,
  label,
  lerp,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayLevel,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { pitchName, xOfPitch } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

// --- What the three share ----------------------------------------------------

/** Under this share of its light a thing that rang is done. */
const DONE = 0.02
/** A level as a share of a scale of 60 dB under full. */
const shareOfDb = (db: number): number => clamp(1 + db / 60, 0, 1)

/**
 * The display's own draws, 0..1, the same on every frame: for the still
 * picture of a thing the device makes at random. They are not the device's
 * numbers, which cannot be read from outside; they only have their spread.
 */
const DRAWS: Float32Array = (() => {
  const draws = new Float32Array(512)
  let seed = 0x2f6e2b1
  for (let i = 0; i < draws.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    draws[i] = seed / 4294967296
  }
  return draws
})()
const draw = (index: number, stream: number): number => DRAWS[(index * 7 + stream * 131) % 512]

/** How loud one side is, as a share of a scale from -60 dB up to full scale. */
function sideShare(level: DisplayLevel | null | undefined): number {
  if (!level) return 0
  const db = gainToDb(level.rms)
  return Number.isFinite(db) ? shareOfDb(db) : 0
}

/**
 * The level foot with a side for each speaker: the left half fills from the
 * middle with the left speaker's level and the right half with the right's.
 * `marks` are places between the speakers, -1 to 1, that the knobs set (how
 * far the rain scatters, where the echoes come from): a tick under each.
 */
function sidesFoot(
  frame: Paint & Pick<DisplayFrame, 'signal' | 'powered'>,
  box: Box,
  marks: readonly number[],
): void {
  const { ctx, colours } = frame
  const signal = frame.powered ? frame.signal : null
  const left = sideShare(signal?.left ?? signal?.output)
  const right = sideShare(signal?.right ?? signal?.output)
  const mid = box.x + box.w / 2
  fillRect(ctx, box, colours.ink, INK.fill)
  fillRect(
    ctx,
    { x: mid - (left * box.w) / 2, y: box.y, w: (left * box.w) / 2, h: box.h },
    colours.accent,
  )
  fillRect(ctx, { x: mid, y: box.y, w: (right * box.w) / 2, h: box.h }, colours.accent)
  ctx.globalAlpha = INK.rule
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1)
  ctx.globalAlpha = 1
  for (const place of marks) {
    const x = Math.round(mid + (clamp(place, -1, 1) * (box.w - 2)) / 2)
    fillRect(ctx, { x: x - 0.5, y: box.y - 2, w: 1, h: box.h + 3 }, colours.ink)
  }
}

/**
 * The share a thing must have to be among the `most` loudest of `shares`, 0
 * while there are no more than that: a device with so many voices gives the
 * quietest to a new sound, so the faintest beyond them are not lit.
 */
function loudestKept(shares: readonly number[], sorted: number[], most: number): number {
  sorted.length = 0
  for (const share of shares) if (share > 0) sorted.push(share)
  if (sorted.length <= most) return 0
  sorted.sort((a, b) => b - a)
  return sorted[most - 1]
}

/** What a display keeps of one key from the frame it first sees it on: whose it is, and when it was last seen. */
interface Kept {
  id: number
  /** When the key went down, as that first frame had it (`frame.now` less its age). */
  went: number
  seen: number
}

/**
 * How near two readings of the moment a key went down must be to be one key.
 * `frame.now` is the frame's own time and a note's age is read from the clock
 * while the frame is drawn, some milliseconds later and never by the same
 * amount, so that moment wavers from frame to frame and is no name for a key.
 */
const KEY_NEAR = 0.1

/** What was kept for a note, the nearest in time of its id; undefined for a key not seen before. */
function keptOf<T extends Kept>(kept: readonly T[], note: DisplayNote, now: number): T | undefined {
  const went = now - note.age
  let found: T | undefined
  for (const entry of kept) {
    if (entry.id !== note.id || Math.abs(entry.went - went) >= KEY_NEAR) continue
    if (!found || Math.abs(entry.went - went) < Math.abs(found.went - went)) found = entry
  }
  return found
}

/** Lets go of what was kept for the keys this frame did not have. */
function dropUnseen<T extends Kept>(kept: T[], now: number): void {
  let count = 0
  for (const entry of kept) if (entry.seen === now) kept[count++] = entry
  kept.length = count
}

// --- Droplets ----------------------------------------------------------------

/**
 * `droplets.h`, `kSurfaces`: what the drops land on. `seconds` is the ring of
 * the fundamental to -60 dB at 440 Hz with Ring 1 and Size in the middle, and
 * the ring goes as (440 / f)^`exponent`.
 */
const DROPLET_SURFACES = [
  { name: 'Glass', seconds: 1.6, exponent: 0.5 },
  { name: 'Wood', seconds: 0.4, exponent: 0.8 },
  { name: 'Metal', seconds: 5, exponent: 0.4 },
  { name: 'Water', seconds: 0.25, exponent: 0.3 },
  { name: 'Felt', seconds: 0.6, exponent: 0.6 },
] as const
/** `droplets.h`: `kTopDropHz`, `kReferenceHz`, the ring law's limits and the ring's own. */
const DROPLET_TOP_HZ = 5000
const DROPLET_REFERENCE_HZ = 440
const DROPLET_LAW = [0.125, 6] as const
const DROPLET_RING = [0.02, 20] as const
/** `droplets.h`: `kLongestWait`, `kSoftOctaves`, `kTrailFloor`, `kFlurryPace`, `kFlurryDrops`, `kMaxDrops`. */
const DROPLET_LONGEST_WAIT = 8
const DROPLET_SOFT_OCTAVES = 4
const DROPLET_TRAIL_FLOOR = 0.4
const DROPLET_FLURRY_PACE = 4
const DROPLET_FLURRY_DROPS = 6
const DROPLET_VOICES = 32

const dropletSurface = (material: number) =>
  DROPLET_SURFACES[clamp(Math.round(material), 0, DROPLET_SURFACES.length - 1)]

/** `Droplets::fall`: the pitch a drop on a key at `hz` lands at, `octave` octaves up; an octave that would pass the top is not taken. */
export function dropletsHz(hz: number, octave: number): number {
  let landed = hz
  for (let o = Math.round(octave); o > 0; o--) if (landed * 2 <= DROPLET_TOP_HZ) landed *= 2
  return landed
}

/** `Droplets::fall`, `seconds`: how long a drop at `hz` rings to -60 dB. */
export function dropletsRingSeconds(
  material: number,
  hz: number,
  ring: number,
  size: number,
): number {
  const surface = dropletSurface(material)
  const law = clamp(
    Math.pow(DROPLET_REFERENCE_HZ / Math.max(hz, 1), surface.exponent),
    DROPLET_LAW[0],
    DROPLET_LAW[1],
  )
  return clamp(
    surface.seconds * ring * 0.5 * Math.pow(2, 2 * size) * law,
    DROPLET_RING[0],
    DROPLET_RING[1],
  )
}

/** `Droplets::gap`: the wait before the next drop in mean gaps, from a draw `u` in 0..1: exactly one at Loose 0, a random arrival's at Loose 1. */
export function dropletsWait(loose: number, u: number): number {
  const wait = Math.min(-Math.log(1 - Math.min(u, 0.999999)), DROPLET_LONGEST_WAIT)
  return 1 - loose + loose * wait
}

/** `Droplets::rain_drop`: the octave of a drop of the pulse on its `round` of the keys, and of a random drop from a draw `u`. */
export function dropletsPulseOctave(spread: number, round: number): number {
  return round % (1 + Math.floor(spread + 0.5))
}
export function dropletsRandomOctave(spread: number, u: number): number {
  return clamp(Math.floor(u * (spread + 1)), 0, Math.floor(spread) + 1)
}

/** `Droplets::rain_drop`, `loudness`: how loud a drop falls against its key, from a draw `u`: most near it, a few far under. */
export function dropletsLoudness(soft: number, u: number): number {
  return Math.pow(2, -DROPLET_SOFT_OCTAVES * soft * u * u)
}

/** `Droplets::fall`, `amp`: how hard a key's own drop lands for a key played at `gain`, 1 a full one. */
export function dropletsStrikeLevel(gain: number): number {
  const hard = clamp(gain, 0, 1)
  return hard * (0.4 + 0.6 * hard)
}

/** `Droplets::note_off` and `control`: a key's share of the rain, `released` seconds after it was let go (null while held). */
export function dropletsWeight(released: number | null, trail: number): number {
  if (released === null) return 1
  return trail > 0 ? clamp(1 - released / trail, 0, 1) : 0
}

/** `Droplets::fall`: the level of a trailing key's drops against a held key's. */
export function dropletsTrailLevel(weight: number): number {
  return DROPLET_TRAIL_FLOOR + (1 - DROPLET_TRAIL_FLOOR) * clamp(weight, 0, 1)
}

/** `Droplets::control`, `pace`: how fast the rain's clock runs in a flurry and in a lull. */
export function dropletsPace(bursts: number, flurry: boolean): number {
  return flurry ? 1 + (DROPLET_FLURRY_PACE - 1) * bursts : 1 - bursts
}

/** `Droplets::flurry_seconds`: the middle length of a flurry; a lull is three times as long. */
export function dropletsFlurrySeconds(rain: number): number {
  return clamp(DROPLET_FLURRY_DROPS / (DROPLET_FLURRY_PACE * rain), 0.15, 3)
}

/**
 * When the rain has let `drops` fall, in seconds, with the flurries and lulls
 * of Bursts at their middle lengths and a flurry first, as `begin_rain` starts
 * it. A cycle of a flurry and a lull holds as many drops as the same time of
 * even rain, so the count over time stays Rain.
 */
export function dropletsSecondsOf(drops: number, rain: number, bursts: number): number {
  const on = dropletsFlurrySeconds(rain)
  const cycle = DROPLET_FLURRY_PACE * on
  const whole = Math.floor(drops / (cycle * rain))
  const left = drops - whole * cycle * rain
  const inFlurry = on * dropletsPace(bursts, true) * rain
  if (left <= inFlurry) return whole * cycle + left / (dropletsPace(bursts, true) * rain)
  return whole * cycle + on + (left - inFlurry) / (dropletsPace(bursts, false) * rain)
}

/** A key in the rain as the display works it out from the notes; times are seconds ago. */
export interface RainKey {
  hz: number
  gain: number
  began: number
  released: number | null
  /**
   * When the same key went down again while this one was still in the rain,
   * in seconds ago: the device keeps its one entry for the new key, so this
   * one is out of the rain from then. A time that never comes for a key that
   * was not played again.
   */
  taken: number
}

/** `droplets.h`, `kMinHz` and `kMaxHz`: the keys the device takes. */
const DROPLET_KEYS_HZ = [16, 8000] as const

/** `Droplets::control`: a key's share of the rain `tau` seconds ago (a time to come when negative, were nothing to change). */
function rainWeight(key: RainKey, tau: number, trail: number): number {
  if (key.began < tau) return 0
  if (key.released === null || key.released < tau) return 1
  return tau <= key.taken ? 0 : dropletsWeight(key.released - tau, trail)
}

/**
 * `Droplets::note_on` and `note_off`: the keys of the rain that falls now,
 * oldest first in `into`, and when it began, in seconds ago (-1 for no rain).
 * The rain begins afresh with a key that goes down when none is left in it,
 * and a key let go stays in it for Trail seconds.
 */
export function dropletsRain(
  notes: readonly DisplayNote[],
  trail: number,
  into: RainKey[],
): { began: number; count: number } {
  let began = -1
  // When the last key so far leaves the rain, in seconds ago: negative while that is still to come.
  let leaves = Infinity
  let count = 0
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    // `Droplets::take_key`: a key played again while it is in the rain (struck again as it is held, which
    // the notes show as let go in that instant, or within its trail) is the same entry, held anew.
    let taken = -Infinity
    for (let later = i + 1; later < notes.length && note.released !== null; later++) {
      if (notes[later].id !== note.id) continue
      const down = notes[later].age
      if (down > note.released - trail || Math.abs(down - note.released) < 0.002) taken = down
      break
    }
    const out = note.released === null ? -Infinity : Math.max(note.released - trail, taken)
    if (began < 0 || leaves > note.age) {
      began = note.age
      leaves = out
      count = 0
    } else leaves = Math.min(leaves, out)
    const key = (into[count] ??= { hz: 0, gain: 0, began: 0, released: null, taken: -Infinity })
    key.hz = clamp(note.frequency, DROPLET_KEYS_HZ[0], DROPLET_KEYS_HZ[1])
    key.gain = clamp(note.gain, 0, 1)
    key.began = note.age
    key.released = note.released
    key.taken = taken
    count++
  }
  return leaves > 0 ? { began: -1, count: 0 } : { began, count }
}

/** The most drops of a pulse the display follows from the rain's beginning; a longer rain is not followed. */
const DROPLET_PULSE_MOST = 30000

/**
 * `Droplets::process`, `gap`, `control` and `next_key` at Loose 0 without
 * Bursts, where nothing is drawn at random: the drops of the pulse since the
 * rain began `began` seconds ago, one for every whole count of Rain times the
 * heaviest key's share, climbing the keys in order of pitch and an octave
 * further each time round. Those that fell in the last `past` seconds and
 * those that fall in the next `ahead` (were no key to change) are written to
 * `into`, three numbers each: seconds ago, the key's index in `keys` (-1 once
 * a trailing key came up, which the device passes over by a throw of its
 * dice, so the order is lost) and the octave. How many comes back, or -1 for
 * a rain too long to follow.
 */
export function dropletsPulse(
  keys: readonly RainKey[],
  count: number,
  began: number,
  rain: number,
  trail: number,
  spread: number,
  past: number,
  ahead: number,
  into: Float32Array,
  edges: number[],
): number {
  if (rain * began > DROPLET_PULSE_MOST) return -1
  // The moments at which the heaviest share changes its course: a key down, a key up, a trail run out.
  edges.length = 0
  edges.push(began, -ahead)
  for (let k = 0; k < count; k++) {
    const key = keys[k]
    for (const edge of [key.began, key.released ?? began, (key.released ?? began) - trail])
      if (edge < began && edge > -ahead) edges.push(edge)
  }
  edges.sort((a, b) => b - a)
  const most = (tau: number): number => {
    let share = 0
    for (let k = 0; k < count; k++) share = Math.max(share, rainWeight(keys[k], tau, trail))
    return share
  }
  let written = 0
  let cursor = -1
  let slot = -1
  let round = 0
  let lost = false
  // What is left of the wait for the next drop, in drops: `begin_rain` starts it at one gap.
  let until = 1
  for (let e = 1; e < edges.length; e++) {
    const from = edges[e - 1]
    const long = from - edges[e]
    if (long <= 0) continue
    // Between two edges the share runs straight: read it a quarter in from each end.
    const a = most(from - long * 0.25)
    const b = most(from - long * 0.75)
    const first = a + (a - b) * 0.5
    const fall = (a - b) * 2
    const gained = (at: number): number => rain * (first * at - (fall * at * at) / (2 * long))
    let done = 0
    while (gained(long) - done >= until) {
      // Where in this stretch the count is full: the root of a parabola, or of a line when the share holds.
      const need = (done + until) / rain
      const bend = fall / (2 * long)
      const at =
        bend > 1e-9
          ? (first - Math.sqrt(Math.max(0, first * first - 4 * bend * need))) / (2 * bend)
          : need / Math.max(first, 1e-9)
      const tau = from - at
      done += until
      until = 1
      // `next_key`: the next key up by pitch from the last one played, round again from the lowest.
      let next = -1
      let lowest = -1
      for (let k = 0; k < count; k++) {
        if (rainWeight(keys[k], tau, trail) <= 0) continue
        if (lowest < 0 || keys[k].hz < keys[lowest].hz) lowest = k
        const after = keys[k].hz > cursor || (keys[k].hz === cursor && k > slot)
        if (after && (next < 0 || keys[k].hz < keys[next].hz)) next = k
      }
      if (lowest < 0) continue
      if (next < 0) {
        next = lowest
        round++
      }
      cursor = keys[next].hz
      slot = next
      lost ||= rainWeight(keys[next], tau, trail) < 1
      if (tau <= past && written * 3 + 2 < into.length) {
        into[written * 3] = tau
        into[written * 3 + 1] = lost ? -1 : next
        into[written * 3 + 2] = dropletsPulseOctave(spread, round)
        written++
      }
    }
    until -= gained(long) - done
  }
  return written
}

/** The pitches the surface spans, left to right: no drop lands above the top. */
const DROPLET_LOW_HZ = 41.2
const DROPLET_HIGH_HZ = DROPLET_TOP_HZ
/** The chord the rain is drawn on while no key is in it: a C chord laid wide, so its drops fall along the whole surface. */
const DROPLET_REST_HZ = [82.41, 196, 523.25] as const
/** The seconds of rain that stand over the surface, foot to top, and the most drops drawn in them. */
const DROPLET_SPAN_SEC = 3
const DROPLET_MARKS_MOST = 90
/** A struck key's crown stands this long. */
const DROPLET_CROWN_SEC = 0.14

interface DropletParts {
  /** The air over the surface: drops fall through it, the lowest lands first. */
  rain: Box
  /** The surface: drops land on its top edge, and their rings spread under it. */
  surface: Box
  foot: Box
}

function dropletParts(view: Size): DropletParts {
  const land = Math.max(30, view.height - 31)
  return {
    rain: { x: 6, y: 15, w: view.width - 12, h: land - 15 },
    surface: { x: 6, y: land, w: view.width - 12, h: 20 },
    foot: { x: 4, y: view.height - 10, w: view.width - 8, h: 6 },
  }
}

const dropletX = (hz: number, box: Box): number =>
  xOfPitch(hz, box, DROPLET_LOW_HZ, DROPLET_HIGH_HZ)

/** How far a ring spreads under the surface, in px, for the seconds it lasts: a scale of ratios from the shortest ring to the longest. */
function rippleReach(seconds: number, surface: Box): number {
  const share = Math.log(seconds / DROPLET_RING[0]) / Math.log(DROPLET_RING[1] / DROPLET_RING[0])
  return lerp(3, Math.min(48, surface.h / 0.42), clamp(share, 0, 1))
}

/** Half a ring under the landing place at `x`: `reach` px wide each way, seen from above the surface at a slant. */
function ripple(ctx: CanvasRenderingContext2D, x: number, y: number, reach: number): void {
  ctx.beginPath()
  for (let step = 0; step <= 14; step++) {
    const angle = (step / 14) * Math.PI
    const px = x - Math.cos(angle) * reach
    const py = y + Math.sin(angle) * reach * 0.42
    if (step === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
}

/** A drop in the air, its round end down, on the thread of its fall. */
function dropMark(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI)
  ctx.lineTo(x + 0.4, y - radius * 2.6)
  ctx.lineTo(x + 0.4, y - radius * 2.6 - 5)
  ctx.lineTo(x - 0.4, y - radius * 2.6 - 5)
  ctx.lineTo(x - 0.4, y - radius * 2.6)
  ctx.closePath()
}

/** The crown a drop throws up where it lands: three strokes, as tall as Splash. */
function crown(ctx: CanvasRenderingContext2D, x: number, y: number, tall: number): void {
  ctx.beginPath()
  for (const lean of [-0.7, 0, 0.7]) {
    ctx.moveTo(x + lean * 2, y - 1.5)
    ctx.lineTo(x + lean * (2 + tall * 0.6), y - 1.5 - tall * (lean === 0 ? 1 : 0.75))
  }
}

/**
 * The surface in its material's own way, under the edge the drops land on: a
 * pane with its glints, planks with their joints, a sheet with its rivets,
 * water in waves, felt as a nap of dots.
 */
function dropletSurfaceBody(frame: Paint, material: number, box: Box): void {
  const { ctx, colours } = frame
  const { x, y, w, h } = box
  const right = x + w
  const kind = clamp(Math.round(material), 0, DROPLET_SURFACES.length - 1)
  const ink = { colour: colours.ink }
  if (kind === 3) {
    // Water has no edge: three lines of waves, the top one where the drops go in.
    for (let row = 0; row < 3; row++) {
      ctx.beginPath()
      for (let px = 0; px <= w; px += 2) {
        const py = y + row * (h * 0.42) + 1.2 * Math.sin((px + row * 5) * 0.5)
        if (px === 0) ctx.moveTo(x + px, py)
        else ctx.lineTo(x + px, py)
      }
      ctx.globalAlpha = row === 0 ? INK.text : INK.rule
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    return
  }
  if (kind === 4) {
    // Felt: a soft thick edge and a nap of dots under it.
    fillRect(ctx, { x, y: y - 1, w, h: 3 }, colours.ink, INK.back)
    ctx.globalAlpha = INK.rule
    ctx.fillStyle = colours.ink
    for (let row = 0; row * 4 + 5 < h; row++)
      for (let px = row % 2 === 0 ? 2 : 5; px < w; px += 6)
        ctx.fillRect(x + px, y + 5 + row * 4, 1, 1)
    ctx.globalAlpha = 1
    return
  }
  rule(ctx, x, y, right, y, { ...ink, alpha: INK.text, width: kind === 2 ? 2 : 1 })
  rule(ctx, x, y + h - 1, right, y + h - 1, { ...ink, alpha: INK.rule })
  if (kind === 0) {
    // Glass: the light across the pane, in three pairs of slanted strokes.
    for (const at of [0.16, 0.52, 0.84])
      for (const shift of [0, 4])
        rule(ctx, x + at * w + shift + 5, y + 4, x + at * w + shift - 3, y + h - 5, {
          ...ink,
          alpha: INK.grid * (shift === 0 ? 2 : 1.3),
        })
  } else if (kind === 1) {
    // Wood: two courses of planks, the joints of one between those of the other.
    const middle = y + Math.round(h / 2)
    rule(ctx, x, middle, right, middle, { ...ink, alpha: INK.rule })
    for (let px = 14; px < w; px += 44) {
      rule(ctx, x + px, y, x + px, middle, { ...ink, alpha: INK.rule })
      if (px + 22 < w)
        rule(ctx, x + px + 22, middle, x + px + 22, y + h - 1, { ...ink, alpha: INK.rule })
    }
  } else {
    // Metal: a sheet held down by two rows of rivets.
    for (let px = 5; px < w; px += 13) {
      dot(ctx, x + px, y + 4.5, 1, colours.ink, { alpha: INK.back })
      dot(ctx, x + px, y + h - 5.5, 1, colours.ink, { alpha: INK.back })
    }
  }
}

interface DropletState {
  keys: RainKey[]
  /** The keys the rain falls on now, low to high, and each one's share of it. */
  placeHz: number[]
  placeWeight: number[]
  /** The drops of an even pulse (`dropletsPulse`), and the edges it is worked out between. */
  pulse: Float32Array
  edges: number[]
  /** What rings on this frame, four numbers each: pitch, seconds since it landed, the seconds it rings, its share. */
  lit: number[]
  shares: number[]
  sorted: number[]
  /** The ring each key's own drop got when it fell. */
  settled: (Kept & { ring: number })[]
  /** The knobs that time the rain as last seen, and when one of them last moved (`frame.now`). */
  timing: number[]
  moved: number
  /** The rain as the last frame saw it: when it began and when that frame was (`frame.now`), and its keys so far. */
  start: number
  last: number
  count: number
}

/** The keys the rain falls on, low to high, into the state; the resting chord while there is no rain. */
function dropletPlaces(state: DropletState, count: number, trail: number): number {
  const { placeHz, placeWeight, keys } = state
  placeHz.length = 0
  placeWeight.length = 0
  for (let k = 0; k < count; k++) {
    const weight = rainWeight(keys[k], 0, trail)
    if (weight <= 0) continue
    // Put in by pitch: the pulse climbs them in that order.
    let at = placeHz.length
    while (at > 0 && placeHz[at - 1] > keys[k].hz) at--
    placeHz.splice(at, 0, keys[k].hz)
    placeWeight.splice(at, 0, weight)
  }
  if (placeHz.length > 0) return placeHz.length
  for (const hz of DROPLET_REST_HZ) {
    placeHz.push(hz)
    placeWeight.push(1)
  }
  return 0
}

/**
 * The rain as Rain, Loose, Bursts, Spread, Soft and Size set it, standing
 * still: the next three seconds of it, cut from the middle of a gap. The waits
 * are the device's own law on the display's draws, so the spacing, the
 * evenness and the scatter are the rain's; the instants are not, and nothing
 * here moves.
 */
function dropletStill(frame: DisplayFrame<DropletState>, parts: DropletParts): void {
  const { ctx, colours, state } = frame
  const { rain, surface } = parts
  const pace = frame.value('rain')
  const loose = clamp(frame.value('loose'), 0, 1)
  const spread = frame.value('spread')
  const bursts = clamp(frame.value('bursts'), 0, 1)
  const soft = clamp(frame.value('soft'), 0, 1)
  const radius = 1.2 + 1.8 * clamp(frame.value('size'), 0, 1)
  const places = state.placeHz.length
  let total = 0
  for (const weight of state.placeWeight) total += weight
  let fallen = -0.5
  let cursor = -1
  let round = 0
  ctx.fillStyle = colours.ink
  for (let i = 0; i < DROPLET_MARKS_MOST; i++) {
    fallen += dropletsWait(loose, draw(i, 0))
    let key = 0
    let octave = 0
    if (draw(i, 1) < loose) {
      // `any_key`: any key in the rain, a trailing one less often as it goes.
      let at = draw(i, 2) * total
      for (key = 0; key < places - 1; key++) {
        at -= state.placeWeight[key]
        if (at < 0) break
      }
      octave = dropletsRandomOctave(spread, draw(i, 3))
    } else {
      cursor++
      if (cursor >= places) {
        cursor = 0
        round++
      }
      key = cursor
      octave = dropletsPulseOctave(spread, round)
    }
    if (fallen < 0) continue
    const seconds = dropletsSecondsOf(fallen, pace, bursts)
    if (!(seconds < DROPLET_SPAN_SEC)) break
    const x = dropletX(dropletsHz(state.placeHz[key], octave), rain)
    const y = surface.y - 2 - (seconds / DROPLET_SPAN_SEC) * (rain.h - 4)
    dropMark(ctx, x, y, radius)
    // A soft drop is a faint one.
    ctx.globalAlpha = lerp(0.3, 0.85, dropletsLoudness(soft, draw(i, 4)))
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** The drops of an even pulse still in the air, where each will land; one whose key is not known is a dashed line over all the keys. */
function dropletFalling(
  frame: DisplayFrame<DropletState>,
  parts: DropletParts,
  drops: number,
): void {
  const { ctx, colours, state } = frame
  const { rain, surface } = parts
  const radius = 1.2 + 1.8 * clamp(frame.value('size'), 0, 1)
  const spread = frame.value('spread')
  for (let d = 0; d < drops; d++) {
    const tau = state.pulse[d * 3]
    if (tau >= 0) continue
    const y = surface.y - 2 - (-tau / DROPLET_SPAN_SEC) * (rain.h - 4)
    const key = state.pulse[d * 3 + 1]
    if (key >= 0) {
      dropMark(
        ctx,
        dropletX(dropletsHz(state.keys[key].hz, state.pulse[d * 3 + 2]), rain),
        y,
        radius,
      )
      ctx.fillStyle = colours.ink
      ctx.fill()
      continue
    }
    const low = dropletX(state.placeHz[0], rain)
    const high = dropletX(
      dropletsHz(state.placeHz[state.placeHz.length - 1], Math.floor(spread + 0.5)),
      rain,
    )
    rule(ctx, low - 2, y, high + 2, y, { colour: colours.ink, alpha: INK.text, dash: [2, 2] })
  }
}

/** What rings now, into `state.lit`: every key's own drop, and the drops of a pulse that have landed. */
function dropletRinging(frame: DisplayFrame<DropletState>, drops: number): void {
  const { state, notes } = frame
  const material = frame.value('material')
  const size = clamp(frame.value('size'), 0, 1)
  const ring = frame.value('ring')
  const trail = frame.value('trail')
  const soft = clamp(frame.value('soft'), 0, 1)
  const { lit, shares, settled } = state
  lit.length = 0
  shares.length = 0
  const add = (hz: number, since: number, seconds: number, level: number): void => {
    const share = shareOfDb(gainToDb(level) - (60 * since) / seconds)
    if (share < DONE) return
    lit.push(hz, since, seconds, share)
    shares.push(share)
  }
  // `Droplets::note_on`: a key going down sounds one drop on it at once, as loud as it was played.
  for (const note of notes) {
    const hz = clamp(note.frequency, DROPLET_KEYS_HZ[0], DROPLET_KEYS_HZ[1])
    // A drop keeps the ring it fell with, so it is settled when its key is first seen.
    let fell = keptOf(settled, note, frame.now)
    if (!fell) {
      const seconds = dropletsRingSeconds(material, hz, ring, size)
      fell = { id: note.id, went: frame.now - note.age, seen: 0, ring: seconds }
      settled.push(fell)
    }
    fell.seen = frame.now
    add(hz, note.age, fell.ring, dropletsStrikeLevel(note.gain))
  }
  if (settled.length > notes.length) dropUnseen(settled, frame.now)
  for (let d = 0; d < drops; d++) {
    const tau = state.pulse[d * 3]
    const key = state.pulse[d * 3 + 1]
    if (tau < 0 || key < 0) continue
    const on = state.keys[key]
    const hz = dropletsHz(on.hz, state.pulse[d * 3 + 2])
    // How loud each drop of the rain falls is the device's throw (Soft): it is lit at the middle one.
    const level =
      dropletsStrikeLevel(on.gain) *
      dropletsLoudness(soft, 0.5) *
      dropletsTrailLevel(rainWeight(on, tau, trail))
    add(hz, tau, dropletsRingSeconds(material, hz, ring, size), level)
  }
}

const droplets = plateDisplay<DropletState>({
  place: 'window',
  columns: 2,
  params: [
    'rain',
    'material',
    'loose',
    'size',
    'spread',
    'ring',
    'soft',
    'splash',
    'bursts',
    'trail',
    'width',
  ],
  live: { signal: true, notes: true, stereo: true },
  info: 'Rain over the surface it lands on, low keys at the left: three seconds of drops, spaced as Rain and Loose set them, over the keys in the rain. A struck key throws a ring that spreads to its line as it dies. Only an even pulse is shown falling in time; loose rain stands still.',
  init: () => ({
    keys: [],
    placeHz: [],
    placeWeight: [],
    pulse: new Float32Array(3 * 640),
    edges: [],
    lit: [],
    shares: [],
    sorted: [],
    settled: [],
    timing: [],
    moved: -Infinity,
    start: NaN,
    last: -Infinity,
    count: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = dropletParts(frame)
    const { rain, surface, foot } = parts
    const material = frame.value('material')
    const size = clamp(frame.value('size'), 0, 1)
    const ring = frame.value('ring')
    const trail = frame.value('trail')
    const spread = frame.value('spread')
    const splash = clamp(frame.value('splash'), 0, 1)
    const pace = frame.value('rain')
    const loose = frame.value('loose')
    const bursts = frame.value('bursts')
    const land = surface.y

    // The knobs that time the rain: after one of them moves, the pulse's place in time is not known until the rain begins again.
    const seen = state.timing
    if (
      seen.length > 0 &&
      (seen[0] !== pace || seen[1] !== loose || seen[2] !== bursts || seen[3] !== trail)
    )
      state.moved = frame.now
    seen[0] = pace
    seen[1] = loose
    seen[2] = bursts
    seen[3] = trail

    const fell = dropletsRain(frame.notes, trail, state.keys)
    const raining = dropletPlaces(state, fell.count, trail) > 0
    // The notes are forgotten a minute after they are let go. When that takes a key out of a rain that
    // still falls, the pulse cannot be counted from its beginning any more. It shows as a rain whose
    // first key was down already at the last frame (so it is the same rain), and which now seems to
    // begin later than it did, or to have had fewer keys than it had.
    const start = raining ? frame.now - fell.began : NaN
    const same = fell.began > frame.now - state.last + KEY_NEAR / 2
    const forgot = same && (start > state.start + KEY_NEAR / 2 || fell.count < state.count)
    if (forgot) state.moved = frame.now
    // The notes' clock is read a little after the frame's own time and never before it, so of the
    // beginnings one rain was seen to have, the latest is the nearest.
    state.start = same && !forgot && state.start >= start ? state.start : start
    state.last = frame.now
    state.count = fell.count
    const even = raining && loose <= 0 && bursts <= 0 && frame.now - fell.began > state.moved
    const longest = dropletsRingSeconds(material, DROPLET_KEYS_HZ[0], ring, size)
    const drops = even
      ? dropletsPulse(
          state.keys,
          fell.count,
          fell.began,
          pace,
          trail,
          spread,
          longest,
          DROPLET_SPAN_SEC,
          state.pulse,
          state.edges,
        )
      : -1

    // The scale of the air: a second and two seconds before a drop lands.
    for (const seconds of [1, 2]) {
      const y = land - 2 - (seconds / DROPLET_SPAN_SEC) * (rain.h - 4)
      rule(ctx, rain.x, y, rain.x + rain.w, y, { colour: colours.ink, alpha: INK.grid })
    }
    dropletSurfaceBody(frame, material, surface)

    // Where the drops land: a tick for each key in the rain and a shorter one for each octave
    // Spread lets its drops go up, the line its ring spreads to, and the crown Splash throws.
    const octaves = Math.ceil(spread)
    ctx.save()
    ctx.beginPath()
    ctx.rect(surface.x - 4, land, surface.w + 8, surface.h)
    ctx.clip()
    for (const hz of state.placeHz) {
      ripple(
        ctx,
        dropletX(hz, rain),
        land,
        rippleReach(dropletsRingSeconds(material, hz, ring, size), surface),
      )
      ctx.globalAlpha = INK.back
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.restore()
    ctx.globalAlpha = 1
    for (const hz of state.placeHz) {
      for (let octave = 0; octave <= octaves; octave++) {
        const x = Math.round(dropletX(dropletsHz(hz, octave), rain))
        fillRect(ctx, { x: x - 0.5, y: land, w: 1, h: octave === 0 ? 5 : 2.5 }, colours.ink)
      }
      if (splash > 0) {
        crown(ctx, dropletX(hz, rain), land, 1 + 5 * splash)
        ctx.globalAlpha = INK.back
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    if (drops >= 0) dropletFalling(frame, parts, drops)
    else dropletStill(frame, parts)

    // The keys in the rain, lit on the edge they rain on: a trailing one narrows as it leaves.
    for (let place = 0; raining && place < state.placeHz.length; place++) {
      const wide = 2 + 5 * state.placeWeight[place]
      const x = dropletX(state.placeHz[place], rain)
      fillRect(ctx, { x: x - wide / 2, y: land - 1.5, w: wide, h: 3 }, colours.accent)
    }

    // What rings: each ring spreads from where the drop landed to its line, thinner as it dies.
    dropletRinging(frame, Math.max(0, drops))
    const least = loudestKept(state.shares, state.sorted, DROPLET_VOICES)
    let said = -1
    ctx.save()
    ctx.beginPath()
    ctx.rect(surface.x - 4, land - 12, surface.w + 8, surface.h + 12)
    ctx.clip()
    for (let at = 0; at < state.lit.length; at += 4) {
      const share = state.lit[at + 3]
      if (share < least) continue
      const x = dropletX(state.lit[at], rain)
      const since = state.lit[at + 1]
      said = at
      ripple(ctx, x, land, Math.max(1.5, rippleReach(state.lit[at + 2], surface) * (1 - share)))
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 0.9 + 1.4 * share
      ctx.stroke()
      if (since < DROPLET_CROWN_SEC && splash > 0) {
        crown(ctx, x, land, 2 + 7 * splash)
        ctx.globalAlpha = 1 - since / DROPLET_CROWN_SEC
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }
    ctx.restore()

    // The foot, with how far to each side the rain scatters.
    const width = clamp(frame.value('width'), 0, 1)
    sidesFoot(frame, foot, [-width, width])

    label(frame, '1 s', rain.x + rain.w, land - 4 - (rain.h - 4) / DROPLET_SPAN_SEC, 'right')
    // The words: the surface and the rain, and how long the last drop rings (the resting C while none does).
    const hz = said >= 0 ? state.lit[said] : DROPLET_REST_HZ[0]
    const seconds = said >= 0 ? state.lit[said + 2] : dropletsRingSeconds(material, hz, ring, size)
    const perSecond = pace < 9.95 ? pace.toFixed(1).replace(/\.0$/, '') : String(Math.round(pace))
    text(frame, `${dropletSurface(material).name}, ${perSecond}/s`, rain.x - 1, 11)
    text(frame, `${pitchName(hz)} ${secondsText(seconds)}`, rain.x + rain.w + 1, 11, {
      align: 'right',
    })
  },
})

// --- Ice ---------------------------------------------------------------------

/** `ice.h`: `kModes` (0 the body, 1 the note, 2 to 5 overtones), `kEchoes`, `kMaxVoices`. */
const ICE_MODES = 6
const ICE_ECHOES = 3
const ICE_VOICES = 12
/** `ice.h`, the chirp: `kFarT0`, `kLand`, `kMaxFlight`, `kLowTop`, `kTopSpan`, `kStart`, `kStrikeAttack`. */
const ICE_FAR_T0 = 0.06
const ICE_LAND = 16
const ICE_FLIGHT_MOST = 1.6
const ICE_LOW_TOP = 1500
const ICE_TOP_SPAN = 8
const ICE_START = [0.66, 0.72, 0.79, 0.84, 0.93, 1] as const
const ICE_STRIKE_ATTACK = 0.0006
/** `ice.h`, the ring: `kStiffness`, `kDamping`, `kBodyRing`, `kShortestRing`, `kThinTilt`, `kThickTilt`, `kThinNote`, `kBody`, `kVelocityTilt`, `kLean`. */
const ICE_STIFFNESS = 0.12
const ICE_DAMPING = 0.7
const ICE_BODY_RING = 0.4
const ICE_SHORTEST_RING = 0.05
const ICE_THIN_TILT = 0.5
const ICE_THICK_TILT = -1.5
const ICE_THIN_NOTE = 0.7
const ICE_BODY = 0.8
const ICE_VELOCITY_TILT = 0.5
const ICE_LEAN = 0.3
/** `ice.h`: `kMinHz`, `kMaxHz`, `kLowestBodyHz`, `kTopOfBand`. */
const ICE_KEYS_HZ = [16, 8400] as const
const ICE_LOWEST_BODY_HZ = 20
const ICE_TOP_OF_BAND = 0.45
/** `ice.h`, the shore: `kEchoSeconds`, `kEchoLevel`, `kEchoTop`, `kEchoStretch`, `kEchoExtraT0`, `kEchoPlace`, `kEchoModes`. */
const ICE_ECHO_SECONDS = [0.31, 0.73, 1.27] as const
const ICE_ECHO_LEVEL = [0.6, 0.42, 0.3] as const
const ICE_ECHO_TOP = [0.8, 0.65, 0.5] as const
const ICE_ECHO_STRETCH = [1.5, 2.1, 2.8] as const
const ICE_ECHO_EXTRA_T0 = 0.006
const ICE_ECHO_PLACE = [-0.7, 0.8, -0.5] as const
const ICE_ECHO_MODES = 3
/** `ice.h`, the lake: `kMaxRate`, `kSelfLevel`, `kRoamDistance`, `kRoamQuiet`, `kOctaveChance`, `kOctaveTopHz`. */
const ICE_CRACKS_MOST = 4
const ICE_SELF_LEVEL = 0.5
const ICE_ROAM_DISTANCE = 0.6
const ICE_ROAM_QUIET = 0.75
const ICE_OCTAVE_CHANCE = 0.25
const ICE_OCTAVE_TOP_HZ = 5000
/** `ice.h`, the snap: `kSnapLowHz`, `kSnapFar`. */
const ICE_SNAP_LOW_HZ = 3000
const ICE_SNAP_FAR = 0.6

/** `Ice::strike`, `t0`: the time the chirp's law is counted in, in seconds: nothing at Distance 0. */
export function iceT0(distance: number): number {
  return ICE_FAR_T0 * distance * distance
}

/**
 * `Ice::launch`, `land`: seconds a chirp with that `t0` is in flight before it
 * is on its note. One whose `t0` is under a sample is a plain ping, in its
 * ring as soon as it has come up.
 */
export function iceFlightSeconds(t0: number, sampleRate: number): number {
  if (t0 * sampleRate < 1) return ICE_STRIKE_ATTACK
  return Math.max(Math.min(ICE_LAND * t0, ICE_FLIGHT_MOST), ICE_STRIKE_ATTACK)
}

/** `Ice::strike`, `top`: where the highest partial of the chirp starts, in Hz. */
export function iceTopHz(bright: number, sampleRate: number): number {
  return Math.min(ICE_LOW_TOP * Math.pow(ICE_TOP_SPAN, bright), 0.42 * sampleRate)
}

/**
 * `Ice::launch`, `sweeps`: whether any partial of a strike on a key at `hz`
 * starts above its place, the chirp's top at `top` Hz. A key so high that
 * none does is a plain ping, however far off it is struck.
 */
export function iceSweeps(
  hz: number,
  levels: readonly number[],
  top: number,
  stretch: number,
): boolean {
  for (let k = 0; k < ICE_MODES; k++)
    if (levels[k] > 0 && top * ICE_START[k] > hz * iceRatio(k, stretch)) return true
  return false
}

/** `Ice::fall`: how much of its fall a chirp still has before it, `seconds` after it began: 1 at the start, 0 from the landing. */
export function iceFall(seconds: number, t0: number, flight: number): number {
  if (seconds >= flight || t0 <= 0) return 0
  const taper = 1 - (seconds / flight) * (seconds / flight)
  const law = 1 + seconds / t0
  return (taper * taper) / (law * law)
}

/** `Ice::ratio`: mode `k` as a multiple of the note: the body an octave under, the overtones pulled sharp by Stretch. */
export function iceRatio(k: number, stretch: number): number {
  if (k === 0) return 0.5
  const stiffness = ICE_STIFFNESS * stretch * stretch
  return k * Math.sqrt((1 + stiffness * k * k) / (1 + stiffness))
}

/** `Ice::tune`, `seconds`: how long mode `k` rings to -60 dB: the overtones and the body die sooner than the note. */
export function iceRingSeconds(k: number, ring: number, stretch: number): number {
  const share = k === 0 ? ICE_BODY_RING : Math.pow(iceRatio(k, stretch), -ICE_DAMPING)
  return Math.max(ring * share, ICE_SHORTEST_RING)
}

/** `Ice::strength_of` over `kStrikeGain`: how hard a key played at `gain` strikes, 1 a full strike. */
export function iceStrength(gain: number): number {
  const hard = clamp(gain, 0, 1)
  return hard * (0.35 + 0.65 * hard)
}

/**
 * `Ice::levels`: what a strike on a key at `hz` puts into each mode, written
 * to `into`: Thick leans the overtones against the note and adds the body, a
 * harder strike is a brighter one, and the six together are as loud whatever
 * the lean. A mode that does not exist at this pitch gets nothing.
 */
export function iceLevels(
  hz: number,
  thick: number,
  gain: number,
  stretch: number,
  sampleRate: number,
  into: number[],
): number[] {
  const tilt = lerp(ICE_THIN_TILT, ICE_THICK_TILT, thick) + ICE_VELOCITY_TILT * (gain - 0.7)
  let power = 0
  for (let k = 0; k < ICE_MODES; k++) {
    const at = hz * iceRatio(k, stretch)
    const exists = at < ICE_TOP_OF_BAND * sampleRate && (k > 0 || at >= ICE_LOWEST_BODY_HZ)
    into[k] = !exists
      ? 0
      : k === 0
        ? ICE_BODY * thick * thick
        : k === 1
          ? lerp(ICE_THIN_NOTE, 1, thick)
          : Math.pow(k, tilt)
    power += into[k] * into[k]
  }
  const even = power > 0 ? 1 / Math.sqrt(power) : 0
  for (let k = 0; k < ICE_MODES; k++) into[k] *= even
  return into
}

/** `Ice::flight_level`: how loud a partial in flight is against what it lands with, at `now` Hz on its way to `place`: 4.5 dB softer for each octave it is still above. */
export function iceFlightLevel(place: number, now: number): number {
  return now <= place ? 1 : Math.pow(place / now, 0.75)
}

/** `Ice::control`, `rate`: the cracks a second the lake makes by itself while a key is held. */
export function iceCrackRate(cracks: number): number {
  return ICE_CRACKS_MOST * cracks * cracks * cracks
}

/** `Ice::strike`: the `t0` and the top of shore echo `echo` (0 to 2), from the strike's. */
export function iceEchoT0(t0: number, echo: number): number {
  return (t0 + ICE_ECHO_EXTRA_T0) * ICE_ECHO_STRETCH[echo]
}

/** `Ice::strike`, `dark`: mode `k` of shore echo `echo` against the same mode of the strike, at Shore 1: each echo is quieter and has lost more of its overtones. */
export function iceEchoLevel(echo: number, k: number): number {
  if (k < 1 || k > ICE_ECHO_MODES) return 0
  return ICE_ECHO_LEVEL[echo] * Math.pow(Math.pow(0.7, echo + 1), k - 1)
}

/** `Ice::start`, `place`: keys go to alternate sides going up the keyboard. */
export function icePlace(hz: number): number {
  const key = Math.floor(69 + 12 * Math.log2(Math.max(hz, 1) / 440) + 0.5)
  return (((key % 2) + 2) % 2 === 1 ? 1 : -1) * ICE_LEAN
}

/** The seconds the picture spans, by the cube root so the chirp's first second has a third of it. */
const ICE_LONG_SEC = 32
/** The pitches it spans, foot to top: under the lowest bodies to over the highest chirp. */
const ICE_LOW_HZ = 40
const ICE_HIGH_HZ = 13000
/** The key the strike is drawn on until one is played: the A under middle C. */
const ICE_REST_HZ = 220
/** The snap is a few thousandths of a second; its mark stands this long so that it is seen. */
const ICE_SNAP_SHOWN = 0.1

interface IceParts {
  /** Frequency against time: the strike at the left edge, high at the top. */
  field: Box
  foot: Box
}

function iceParts(view: Size): IceParts {
  return {
    field: { x: 7, y: 15, w: view.width - 14, h: Math.max(20, view.height - 30) },
    foot: { x: 4, y: view.height - 10, w: view.width - 8, h: 6 },
  }
}

const iceX = (seconds: number, field: Box): number =>
  field.x + Math.cbrt(clamp(seconds / ICE_LONG_SEC, 0, 1)) * field.w
const iceSecondsOf = (x: number, field: Box): number =>
  ICE_LONG_SEC * Math.pow(clamp((x - field.x) / field.w, 0, 1), 3)
const ICE_OCTAVES = Math.log(ICE_HIGH_HZ / ICE_LOW_HZ)
const iceY = (hz: number, field: Box): number =>
  field.y + field.h * (1 - clamp(Math.log(Math.max(hz, 1) / ICE_LOW_HZ) / ICE_OCTAVES, 0, 1))
const iceHzOf = (y: number, field: Box): number =>
  ICE_LOW_HZ * Math.exp(ICE_OCTAVES * (1 - clamp((y - field.y) / field.h, 0, 1)))

/** How strongly a part of a chirp is drawn for its level in flight, in three steps. */
const iceBand = (level: number): number => (level < 0.3 ? 0.3 : level < 0.6 ? 0.6 : 1)

/**
 * One partial of one arrival, from `from` seconds after the key: what is left
 * of its fall from `start` Hz onto `place`, and its line from the landing to
 * `end`. The fall begins `wait` seconds after the key and follows `Ice::fall`;
 * it is drawn fainter the further above its place the partial still is, as it
 * sounds (`Ice::flight_level`).
 */
function iceTrack(
  frame: Paint,
  field: Box,
  place: number,
  start: number,
  wait: number,
  t0: number,
  flight: number,
  from: number,
  end: number,
  lit: boolean,
  strength: number,
): void {
  const { ctx, colours } = frame
  const landing = wait + flight
  const begin = Math.max(from, wait)
  if (begin >= end) return
  const above = Math.max(start - place, 0)
  // Lit, the note itself is the strong line and the rest stand back, or a chord is a blot.
  const full = lit ? (strength >= 1 ? 1 : 0.35 + 0.5 * strength) : lerp(0.3, 1, strength)
  ctx.strokeStyle = lit ? colours.accent : colours.ink
  ctx.lineWidth = lit && strength >= 1 ? 1.8 : 1
  ctx.lineJoin = 'round'
  const y = iceY(place, field)
  let band = 1
  ctx.beginPath()
  if (begin < landing) {
    const left = iceX(begin, field)
    const right = iceX(landing, field)
    const steps = clamp(Math.ceil((right - left) / 2.5), 1, 28)
    for (let step = 0; step <= steps; step++) {
      const x = lerp(left, right, step / steps)
      const seconds = step === steps ? flight : iceSecondsOf(x, field) - wait
      const hz = place + above * iceFall(Math.max(seconds, 0), t0, flight)
      const now = iceBand(iceFlightLevel(place, hz))
      const py = iceY(hz, field)
      if (step === 0) {
        ctx.moveTo(x, py)
        band = now
        continue
      }
      ctx.lineTo(x, py)
      if (now !== band) {
        // The level steps here: what was drawn so far is laid at its own strength.
        ctx.globalAlpha = full * band
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, py)
        band = now
      }
    }
  } else ctx.moveTo(iceX(begin, field), y)
  if (end > landing) ctx.lineTo(Math.max(iceX(end, field), iceX(landing, field) + 1), y)
  ctx.globalAlpha = full * band
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** What a strike was given when it was struck: Distance, Bright, Thick and Shore are heard from the next strike. */
interface IceStrike extends Kept {
  distance: number
  bright: number
  thick: number
  shore: number
}

interface IceState {
  levels: number[]
  /** The key the strike is drawn on: the last one played. */
  key: number
  /** Each sounding key's strike as it was struck. */
  struck: IceStrike[]
  rest: IceStrike
  marks: number[]
  shares: number[]
  sorted: number[]
}

/**
 * A strike on a key at `hz` from `from` seconds after it: every partial's
 * fall and ring, and the three shore echoes' falls on to the same lines. In
 * the ink it is the picture of the instrument (`from` 0, a full strike); lit,
 * it is what a played key still has before it. How much of the note's own
 * light is left comes back, 0 when it has rung out.
 */
function iceStrike(
  frame: DisplayFrame<IceState>,
  field: Box,
  hz: number,
  gain: number,
  strike: IceStrike,
  from: number,
  lit: boolean,
): number {
  const ring = frame.value('ring')
  const stretch = clamp(frame.value('stretch'), 0, 1)
  const rate = frame.sampleRate
  const levels = iceLevels(hz, strike.thick, gain, stretch, rate, frame.state.levels)
  const strength = iceStrength(gain)
  const top = iceTopHz(strike.bright, rate)
  const sweeps = iceT0(strike.distance) * rate >= 1 && iceSweeps(hz, levels, top, stretch)
  const t0 = sweeps ? iceT0(strike.distance) : 0
  const flight = iceFlightSeconds(t0, rate)
  const echoes = strike.shore > 0.001
  let left = 0
  for (let k = 0; k < ICE_MODES; k++) {
    if (levels[k] <= 0) continue
    const place = hz * iceRatio(k, stretch)
    const seconds = iceRingSeconds(k, ring, stretch)
    const share = shareOfDb(gainToDb(levels[k] * strength))
    // It rings from the landing, and each echo that lands on it sets it ringing again.
    let end = flight + seconds * share
    for (let echo = 0; echoes && echo < ICE_ECHOES; echo++) {
      const level = levels[k] * strength * strike.shore * iceEchoLevel(echo, k)
      if (level <= 0) continue
      const lands =
        ICE_ECHO_SECONDS[echo] + iceFlightSeconds(iceEchoT0(iceT0(strike.distance), echo), rate)
      end = Math.max(end, lands + seconds * shareOfDb(gainToDb(level)))
    }
    if (k === 1 && end > from) left = share * clamp(1 - (from - flight) / (end - flight), 0, 1)
    const weight = lit ? (k === 1 ? 1 : share * 0.6) : share
    // Lit, an overtone is followed down its fall and no further: after the landing the note's own line says how long the key rings.
    const until = lit && k !== 1 ? flight : end
    iceTrack(frame, field, place, top * ICE_START[k], 0, t0, flight, from, until, lit, weight)
    if (lit && k === 1 && from < end) {
      const now = place + Math.max(top * ICE_START[k] - place, 0) * iceFall(from, t0, flight)
      dot(frame.ctx, iceX(from, field), iceY(now, field), 1.2 + 1.3 * share, frame.colours.accent)
    }
  }
  for (let echo = 0; echoes && echo < ICE_ECHOES; echo++) {
    const wait = ICE_ECHO_SECONDS[echo]
    const echoT0 = iceEchoT0(iceT0(strike.distance), echo)
    const echoFlight = iceFlightSeconds(echoT0, rate)
    for (let k = 1; k <= ICE_ECHO_MODES; k++) {
      const level = levels[k] * strength * strike.shore * iceEchoLevel(echo, k)
      if (level <= 0) continue
      const place = hz * iceRatio(k, stretch)
      const start = top * ICE_ECHO_TOP[echo] * ICE_START[k]
      const share = shareOfDb(gainToDb(level))
      iceTrack(
        frame,
        field,
        place,
        start,
        wait,
        echoT0,
        echoFlight,
        from,
        wait + echoFlight,
        lit,
        share * 0.6,
      )
    }
  }
  return left
}

/** How much of its light the note of a played key still has, `from` seconds after the key: what `iceStrike` gives back, without drawing. */
function iceNoteLight(
  frame: DisplayFrame<IceState>,
  hz: number,
  gain: number,
  strike: IceStrike,
  from: number,
): number {
  const stretch = clamp(frame.value('stretch'), 0, 1)
  const rate = frame.sampleRate
  const levels = iceLevels(hz, strike.thick, gain, stretch, rate, frame.state.levels)
  const level = levels[1]
  const strength = iceStrength(gain)
  const sweeps = iceSweeps(hz, levels, iceTopHz(strike.bright, rate), stretch)
  const flight = iceFlightSeconds(sweeps ? iceT0(strike.distance) : 0, rate)
  const seconds = iceRingSeconds(1, frame.value('ring'), stretch)
  const share = shareOfDb(gainToDb(level * strength))
  let end = flight + seconds * share
  for (let echo = 0; strike.shore > 0.001 && echo < ICE_ECHOES; echo++) {
    const lands =
      ICE_ECHO_SECONDS[echo] + iceFlightSeconds(iceEchoT0(iceT0(strike.distance), echo), rate)
    const after = shareOfDb(gainToDb(level * strength * strike.shore * iceEchoLevel(echo, 1)))
    end = Math.max(end, lands + seconds * after)
  }
  return end > from ? share * clamp(1 - (from - flight) / (end - flight), 0, 1) : 0
}

/**
 * The lake's own cracks on a held key at `hz`: a hook for each, one mean gap
 * after another (`Ice::control` draws each gap between 0.4 and 1.6 of that),
 * taller for a louder one and longer for a farther one as Roam spreads them
 * (`Ice::crack`), a quarter of them on the octave above. They stand still:
 * when the lake cracks is the device's own throw.
 */
function iceLake(frame: Paint & DisplayView, field: Box, hz: number): void {
  const { ctx, colours } = frame
  const rate = iceCrackRate(clamp(frame.value('cracks'), 0, 1))
  if (rate <= 0) return
  const roam = clamp(frame.value('roam'), 0, 1)
  const distance = clamp(frame.value('distance'), 0, 1)
  let last = -Infinity
  ctx.beginPath()
  for (let i = 1; i / rate < ICE_LONG_SEC; i++) {
    const x = iceX(i / rate, field)
    // Far along the cube root of time they stand closer than can be drawn: every one that has room.
    if (x - last < 3) continue
    last = x
    const loud = ICE_SELF_LEVEL * (1 - ICE_ROAM_QUIET * roam * draw(i, 5))
    const far = clamp(distance + ICE_ROAM_DISTANCE * roam * (2 * draw(i, 6) - 1), 0, 1)
    const up = draw(i, 7) < ICE_OCTAVE_CHANCE && hz * 2 <= ICE_OCTAVE_TOP_HZ
    const y = iceY(up ? hz * 2 : hz, field)
    const tall = 2 + 14 * loud
    const long = 1 + 5 * far
    ctx.moveTo(x - long, y - tall)
    ctx.lineTo(x - long * 0.35, y - tall * 0.3)
    ctx.lineTo(x, y)
  }
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

const ice = plateDisplay<IceState>({
  place: 'window',
  columns: 2,
  params: [
    'distance',
    'bright',
    'ring',
    'thick',
    'crack',
    'stretch',
    'shore',
    'cracks',
    'roam',
    'width',
  ],
  live: { signal: true, notes: true, stereo: true },
  info: 'A strike as pitch against time: its partials fall from a faint cluster on to their lines and ring there, the shore echoes follow, and the hooks are the cracks the lake makes by itself. A played key runs down its own curve. The handles set Bright, Distance and Ring.',
  init: () => ({
    levels: [0, 0, 0, 0, 0, 0],
    key: ICE_REST_HZ,
    struck: [],
    rest: { id: -1, went: 0, seen: 0, distance: 0, bright: 0, thick: 0, shore: 0 },
    marks: [],
    shares: [],
    sorted: [],
  }),
  draw(frame) {
    const { ctx, colours, state, notes } = frame
    ground(frame)
    const { field, foot } = iceParts(frame)
    const distance = clamp(frame.value('distance'), 0, 1)
    const rest = state.rest
    rest.distance = distance
    rest.bright = clamp(frame.value('bright'), 0, 1)
    rest.thick = clamp(frame.value('thick'), 0, 1)
    rest.shore = clamp(frame.value('shore'), 0, 1)
    const ring = frame.value('ring')
    const sweeps = iceT0(distance) * frame.sampleRate >= 1
    const flight = iceFlightSeconds(iceT0(distance), frame.sampleRate)
    const base = field.y + field.h

    // The scales: a second and ten seconds, and the hundreds of hertz.
    for (const seconds of [1, 10]) {
      const x = iceX(seconds, field)
      rule(ctx, x, field.y, x, base, { colour: colours.ink, alpha: INK.grid })
    }
    for (const hz of [100, 1000, 10000]) {
      const y = iceY(hz, field)
      rule(ctx, field.x, y, field.x + field.w, y, { colour: colours.ink, alpha: INK.grid })
    }

    // Which keys still ring, and what each was struck with. The device has twelve rings: no more are lit.
    state.shares.length = notes.length
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      let strike = keptOf(state.struck, note, frame.now)
      if (!strike) {
        strike = { ...rest, id: note.id, went: frame.now - note.age }
        state.struck.push(strike)
      }
      strike.seen = frame.now
      const hz = clamp(note.frequency, ICE_KEYS_HZ[0], ICE_KEYS_HZ[1])
      const light = iceNoteLight(frame, hz, note.gain, strike, note.age)
      state.shares[index] = light >= DONE ? light : 0
      if (light >= DONE) state.key = hz
    }
    if (state.struck.length > notes.length) dropUnseen(state.struck, frame.now)
    const least = loudestKept(state.shares, state.sorted, ICE_VOICES)

    // The instrument: a full strike on the last key played, the snap at its start, where it lands.
    const snap = clamp(frame.value('crack'), 0, 1) * (1 - ICE_SNAP_FAR * distance)
    const snapTop = iceY(ICE_SNAP_LOW_HZ, field)
    if (snap > 0)
      rule(ctx, field.x - 3, snapTop, field.x - 3, field.y, {
        colour: colours.ink,
        width: 1 + 2 * snap,
        alpha: INK.text,
      })
    const lands = iceX(flight, field)
    rule(ctx, lands, field.y, lands, base, { colour: colours.ink, alpha: INK.back, dash: [2, 2] })
    iceStrike(frame, field, state.key, 1, rest, 0, false)
    iceLake(frame, field, state.key)

    // The keys that sound: each runs down its own curves and along its lines, for as long as it rings.
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      const share = state.shares[index]
      const hz = clamp(note.frequency, ICE_KEYS_HZ[0], ICE_KEYS_HZ[1])
      if (note.released === null) {
        // A held key is one the lake cracks on, rung out or not: a mark at its pitch for as long as it is down.
        const y = iceY(hz, field)
        ctx.beginPath()
        ctx.moveTo(field.x - 6, y - 3)
        ctx.lineTo(field.x - 1, y)
        ctx.lineTo(field.x - 6, y + 3)
        ctx.closePath()
        ctx.fillStyle = colours.accent
        ctx.fill()
      }
      if (share <= 0 || share < least) continue
      const strike = keptOf(state.struck, note, frame.now) ?? rest
      iceStrike(frame, field, hz, note.gain, strike, note.age, true)
      if (note.age < ICE_SNAP_SHOWN && snap > 0)
        rule(ctx, field.x - 3, snapTop, field.x - 3, field.y, {
          colour: colours.accent,
          width: 1 + 2 * snap,
          alpha: 1 - note.age / ICE_SNAP_SHOWN,
        })
    }

    // The foot, with where the strike and its three echoes sit between the speakers.
    const width = clamp(frame.value('width'), 0, 1)
    const side = icePlace(state.key)
    state.marks.length = 0
    state.marks.push(side * width)
    for (let echo = 0; rest.shore > 0.001 && echo < ICE_ECHOES; echo++)
      state.marks.push(Math.sign(side) * ICE_ECHO_PLACE[echo] * width)
    sidesFoot(frame, foot, state.marks)

    for (const seconds of [1, 10])
      label(frame, `${seconds} s`, iceX(seconds, field) + 3, field.y + 7)
    label(frame, '1k', field.x + field.w, iceY(1000, field) - 2, 'right')
    // The words: how long the chirp falls, and the key and how long its note rings.
    text(frame, sweeps ? `Chirp ${secondsText(flight)}` : 'Ping', field.x - 2, 11)
    text(frame, `${pitchName(state.key)} ${secondsText(ring)}`, field.x + field.w + 2, 11, {
      align: 'right',
    })

    for (const point of iceHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: iceHandles,
})

function iceHandles(view: DisplayView): DisplayHandle[] {
  const { field } = iceParts(view)
  const base = field.y + field.h
  // Where a chirp lands, by the law alone: `kLand` times its `t0`.
  const lands = ICE_LAND * iceT0(clamp(view.value('distance'), 0, 1))
  const ring = view.spec('ring')
  return [
    {
      key: 'bright',
      name: 'Bright',
      x: field.x + 1,
      y: iceY(ICE_LOW_TOP * Math.pow(ICE_TOP_SPAN, clamp(view.value('bright'), 0, 1)), field),
      drag: (_x, toY) => ({
        bright: clamp(Math.log(iceHzOf(toY, field) / ICE_LOW_TOP) / Math.log(ICE_TOP_SPAN), 0, 1),
      }),
      reset: () => ({ bright: view.spec('bright')?.default ?? 0.6 }),
    },
    {
      key: 'distance',
      name: 'Distance',
      x: iceX(lands, field),
      y: base,
      drag: (toX) => ({
        distance: clamp(Math.sqrt(iceSecondsOf(toX, field) / (ICE_LAND * ICE_FAR_T0)), 0, 1),
      }),
      reset: () => ({ distance: view.spec('distance')?.default ?? 0.45 }),
    },
    {
      key: 'ring',
      name: 'Ring',
      // The note of a full strike has rung out a Ring after it landed.
      x: iceX(lands + view.value('ring'), field),
      y: base,
      drag: (toX) => ({
        ring: clamp(iceSecondsOf(toX, field) - lands, ring?.min ?? 0.3, ring?.max ?? 30),
      }),
      reset: () => ({ ring: ring?.default ?? 5 }),
    },
  ]
}

// --- Shortwave ---------------------------------------------------------------

const SHORTWAVE_SIGNALS = ['Whistle', 'Warble', 'Pips', 'Voices'] as const
const WARBLE = 1
const PIPS = 2
const VOICES = 3
/** `shortwave.h`: `kTuneCents`, `kTuneSeconds`, `kDriftCents`, `kBeatLowHz`, `kBeatSpan`, `kBeatLevel`, `kFadeDb`, `kFadeLift`, `kPipSeconds`, `kPipDuty`. */
const SHORTWAVE_TUNE_CENTS = 500
const SHORTWAVE_TUNE_SECONDS = 3
const SHORTWAVE_DRIFT_CENTS = 50
const SHORTWAVE_BEAT_LOW_HZ = 0.5
const SHORTWAVE_BEAT_SPAN = 16
const SHORTWAVE_BEAT_LEVEL = 0.45
const SHORTWAVE_FADE_DB = 18
const SHORTWAVE_FADE_LIFT = 4
const SHORTWAVE_PIP_SECONDS = 0.3
const SHORTWAVE_PIP_DUTY = 0.45
/** `shortwave.h`: `kEdgeSeconds`, `kPipEdgeSeconds`, `kSlideHeadroom`, `kVelocityFloor`, `kCrowd`, `kCrowdSlope`, `kHarmonics`, `kMaxVoices`. */
const SHORTWAVE_EDGE_SECONDS = 0.008
const SHORTWAVE_PIP_EDGE_SECONDS = 0.012
const SHORTWAVE_SLIDE_HEADROOM = 1.38
const SHORTWAVE_VELOCITY_FLOOR = 0.25
const SHORTWAVE_CROWD = 4
const SHORTWAVE_CROWD_SLOPE = 0.6
const SHORTWAVE_HARMONICS = 5
const SHORTWAVE_VOICES = 10
/** `shortwave.h`: `kHiss`, `kCracklesLow`, `kCracklesHigh`, and the band's corners `kLowCutHz`, `kLowCutSpan`, `kHighCutHz`, `kHighCutSpan`. */
const SHORTWAVE_HISS = 0.6
const SHORTWAVE_CRACKLES = [0.5, 11] as const
const SHORTWAVE_LOW_CUT = [20, 25] as const
const SHORTWAVE_HIGH_CUT = [18000, 0.14] as const
/** `env.h`, `Adsr`: the attack runs for a target this far over full, a release falls 60 dB in its time and is over 100 dB down. */
const ADSR_ATTACK_TARGET = 1.3
const ADSR_IDLE = 1e-5
/** `shortwave_parts::Mouth`: the level between two syllables, and a syllable's middle length in counts of Rate (0.6 + a draw squared). */
const SHORTWAVE_MOUTH_SHUT = 0.25
const SHORTWAVE_SYLLABLE = 0.6 + 1 / 3

const ease = (x: number): number => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}

/** `Shortwave::slide_seconds`: how long a note takes to arrive: a little Tune in is a quick chirp, a lot a slow turn of the dial. */
export function shortwaveSlideSeconds(tuneIn: number): number {
  return SHORTWAVE_TUNE_SECONDS * tuneIn * Math.sqrt(tuneIn)
}

/**
 * `Shortwave::start` and `steer`: how many cents off its note a station is
 * `seconds` after the key. Which way is the device's throw, and so is how far
 * it starts, between 0.8 and 1 of the knob (`reach`).
 */
export function shortwaveSlideCents(tuneIn: number, seconds: number, reach = 1): number {
  const long = shortwaveSlideSeconds(tuneIn)
  if (seconds >= long) return 0
  const left = 1 - seconds / long
  return reach * SHORTWAVE_TUNE_CENTS * tuneIn * left * left * left
}

/** `Shortwave::knobs`, `drift_cents_`: the widest a station wanders either way of its note. */
export function shortwaveDriftCents(drift: number): number {
  return SHORTWAVE_DRIFT_CENTS * drift * Math.sqrt(drift)
}

/** `Shortwave::beat_hz` and `apply`: how far above the note the second station lies, in Hz, and its level against the first. */
export function shortwaveBeatHz(beat: number): number {
  return SHORTWAVE_BEAT_LOW_HZ * Math.pow(SHORTWAVE_BEAT_SPAN, beat)
}
export function shortwaveBeatLevel(beat: number): number {
  return SHORTWAVE_BEAT_LEVEL * ease(beat * 5)
}

/** `Shortwave::steer`, `flat`: the dB a station stands over its unfaded level at its best, and under it at its worst. */
export function shortwaveFadeBestDb(fading: number): number {
  return SHORTWAVE_FADE_LIFT * fading
}
export function shortwaveFadeWorstDb(fading: number): number {
  return (SHORTWAVE_FADE_LIFT - SHORTWAVE_FADE_DB) * fading
}

/** `Shortwave::start`, `velocity`: how loud a key played at `gain` is; the softest still sounds. */
export function shortwaveVelocity(gain: number): number {
  return SHORTWAVE_VELOCITY_FLOOR + (1 - SHORTWAVE_VELOCITY_FLOOR) * clamp(gain, 0, 1)
}

/** `Shortwave::control`, `crowd_`: past four stations at full level, each more turns all of them down. */
export function shortwaveCrowd(held: number): number {
  return held > SHORTWAVE_CROWD ? Math.pow(SHORTWAVE_CROWD / held, SHORTWAVE_CROWD_SLOPE) : 1
}

/**
 * `kit::Adsr` as `Shortwave::start` sets it (no decay, full sustain): a
 * station's level `age` seconds after the key, let go `released` seconds ago
 * (null while it is held). It is full after Attack and falls 60 dB in Release.
 */
export function shortwaveLevel(
  age: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  const held = age - (released ?? 0)
  const up = Math.min(
    1,
    ADSR_ATTACK_TARGET *
      (1 - Math.pow(1 - 1 / ADSR_ATTACK_TARGET, Math.max(held, 0) / Math.max(attack, 1e-4))),
  )
  if (released === null) return up
  const level = up * Math.exp((-Math.log(1000) * released) / Math.max(release, 1e-4))
  return level < ADSR_IDLE ? 0 : level
}

/** `Shortwave::warble_wanted`: whether Warble sounds its Shift tone after `count` changes of tone: the note for one count, the Shift for the next, each change begun an edge early. */
export function shortwaveOnShift(count: number, rate: number): boolean {
  const lead = Math.min(SHORTWAVE_EDGE_SECONDS * rate, 0.25)
  const key = count - 2 * Math.floor(count / 2)
  return key >= 1 - lead && key < 2 - lead
}

/** `Shortwave::knobs` and `pip_wanted`: the share of each count a pip is open for, and whether one is open `count` pips after the key. */
export function shortwavePipDuty(rate: number): number {
  const counts = Math.min(SHORTWAVE_PIP_DUTY, SHORTWAVE_PIP_SECONDS * rate)
  return counts - Math.min(SHORTWAVE_PIP_EDGE_SECONDS * rate, 0.5 * counts)
}
export function shortwavePipOpen(count: number, rate: number): boolean {
  return count - Math.floor(count) < shortwavePipDuty(rate)
}

/** `Shortwave::apply` and `start`: the second tone of Warble as a multiple of the note: the Shift, or the widest one under it that stays in the band for this note. */
export function shortwaveShiftRatio(shift: number, hz: number, sampleRate: number): number {
  let highest = 4
  while (highest > 1 && hz * highest * SHORTWAVE_SLIDE_HEADROOM > 0.49 * sampleRate) highest *= 0.5
  return Math.min([0.5, 2, 4][clamp(Math.round(shift), 0, 2)], highest)
}

/** `Shortwave::start`, `harmonics`: how many of the five harmonics Voices breathes on fit under the top of the band. */
export function shortwaveHarmonics(hz: number, sampleRate: number): number {
  let count = 0
  while (
    count < SHORTWAVE_HARMONICS &&
    (count + 1) * hz * SHORTWAVE_SLIDE_HEADROOM < 0.45 * sampleRate
  )
    count++
  return count
}

/** `Shortwave::control`: the hiss against one key at full level, and the crackles a second, at that Static. */
export function shortwaveHiss(amount: number): number {
  return SHORTWAVE_HISS * amount * Math.sqrt(amount)
}
export function shortwaveCrackles(amount: number): number {
  return amount > 0 ? SHORTWAVE_CRACKLES[0] + SHORTWAVE_CRACKLES[1] * amount * amount : 0
}

/** `Shortwave::control`: the two corners of the receiver's band, and how sharp the upper one is. */
export function shortwaveBandHz(band: number, sampleRate: number): [number, number, number] {
  return [
    SHORTWAVE_LOW_CUT[0] * Math.pow(SHORTWAVE_LOW_CUT[1], band),
    Math.min(SHORTWAVE_HIGH_CUT[0] * Math.pow(SHORTWAVE_HIGH_CUT[1], band), 0.45 * sampleRate),
    0.6 + 0.5 * band,
  ]
}

/** What that band leaves of a tone at `hz`, in dB: a first-order low cut and a second-order high cut. */
export function shortwaveBandDb(band: number, hz: number, sampleRate: number): number {
  const [low, high, q] = shortwaveBandHz(band, sampleRate)
  const under = low / Math.max(hz, 1)
  const x = hz / high
  const over = (1 - x * x) * (1 - x * x) + (x * x) / (q * q)
  return -10 * Math.log10(1 + under * under) - 10 * Math.log10(over)
}

/** The dial's two ends, and the station the picture is drawn on until a key is played. */
const SHORTWAVE_LOW_HZ = 40
const SHORTWAVE_HIGH_HZ = 16000
const SHORTWAVE_REST_HZ = 440
/** The seconds after the key the station's life spans, by the square root: the slide and the attack have most of it. */
const SHORTWAVE_LONG_SEC = 8
/**
 * The cents either side of the note its window spans, by the square root, so
 * a few cents of drift show beside a slide of a fourth: wide enough for the
 * slide where one tone is sent, for two octaves where there are more.
 */
const SHORTWAVE_NEAR_CENTS = 700
const SHORTWAVE_FAR_CENTS = 2800
/** The dB the scope over the dial spans under one key at full level. */
const SHORTWAVE_SCOPE_DB = 50
/** The part of its reach a slide is drawn at: the device starts it between 0.8 and 1 of the knob. */
const SHORTWAVE_REACH = 0.9
/** How long the key of the picture is held before it is let go, so Release has its part of it. */
const SHORTWAVE_HELD_SEC = 4
/** `env.h`, `Adsr`: a release has fallen 60 dB at its time; a station under that is gone. */
const SHORTWAVE_GONE = 0.001

interface ShortwaveParts {
  /** One station's life: cents off the note across, the seconds since the key downward. */
  station: Box
  /** The band now: the dial across its foot, levels upward. */
  scope: Box
  foot: Box
}

function shortwaveParts(view: Size): ShortwaveParts {
  const dial = view.height - 24
  return {
    station: { x: 6, y: 15, w: view.width - 12, h: Math.max(8, dial - 36) },
    scope: { x: 6, y: dial - 19, w: view.width - 12, h: 19 },
    foot: { x: 4, y: view.height - 10, w: view.width - 8, h: 6 },
  }
}

/**
 * The multiples of the note the window spans on Voices, where it is laid out
 * by the hertz from none at its left edge so the harmonics stand evenly: the
 * five of them, and the slide of the fifth.
 */
const SHORTWAVE_COMB = 6.6
/** The harmonic whose arm the Tune in handle stands on there: far enough from the edge to be dragged. */
const SHORTWAVE_COMB_HANDLE = 3

/** Where a tone `cents` off the note lies in the window; a `span` of none is the layout of Voices. */
const centsX = (cents: number, box: Box, span: number): number =>
  span <= 0
    ? box.x + box.w * clamp(Math.pow(2, cents / 1200) / SHORTWAVE_COMB, 0, 1)
    : box.x +
      box.w / 2 +
      Math.sign(cents) * Math.sqrt(Math.min(Math.abs(cents), span) / span) * (box.w / 2 - 3)
const SHORTWAVE_TICKS = [-2400, -1200, -500, -100, 100, 500, 1200, 2400] as const
const windowSpan = (signal: number): number =>
  signal === VOICES ? 0 : signal === WARBLE ? SHORTWAVE_FAR_CENTS : SHORTWAVE_NEAR_CENTS
/** The seconds after the key at a share of the window's height, and the share of it at those seconds. */
const stationSeconds = (share: number): number => SHORTWAVE_LONG_SEC * share * share
const stationShare = (seconds: number): number =>
  Math.sqrt(clamp(seconds / SHORTWAVE_LONG_SEC, 0, 1))
const dialX = (hz: number, box: Box): number =>
  xOfPitch(hz, box, SHORTWAVE_LOW_HZ, SHORTWAVE_HIGH_HZ)
const scopeShare = (db: number): number => clamp(1 + db / SHORTWAVE_SCOPE_DB, 0, 1)

/** What the keying, the slide and the level make of a station at one moment: read by its track and by its mark on the dial. */
interface ShortwaveKnobs {
  signal: number
  /** The cents the window spans either side of the note. */
  span: number
  /** The hiss against the station at full level. */
  hiss: number
  rate: number
  ratio: number
  harmonics: number
  fading: number
  beat: number
  attack: number
  release: number
}

/**
 * One station's life in its window, row by row from the key down to `until`
 * seconds after it: two thin arms while it slides in (it may come from either
 * side), then the tone itself, as wide as it is loud. Warble goes over to its
 * Shift and back, Pips are cut into pulses, Voices is a breath on each
 * harmonic. Fading is a thin core inside a wide faint line (the least and the
 * most the air leaves of it), Beat a second line a few hertz up. In the ink
 * it is the instrument; lit, the last key's life so far. `count` is how often
 * the key has changed tone or pipped by `until`.
 */
function shortwaveTrack(
  frame: Paint,
  box: Box,
  hz: number,
  velocity: number,
  knobs: ShortwaveKnobs,
  tuneIn: number,
  until: number,
  released: number | null,
  count: number,
  lit: boolean,
): void {
  const { ctx, colours } = frame
  const { signal, rate, fading, beat } = knobs
  const core = Math.pow(10, shortwaveFadeWorstDb(fading) / 20)
  const halo = Math.pow(10, shortwaveFadeBestDb(fading) / 20)
  const second = shortwaveBeatLevel(beat)
  const beatHz = shortwaveBeatHz(beat)
  const tones = signal === VOICES ? knobs.harmonics : signal === WARBLE ? 2 : 1
  const letGo = released === null ? Infinity : until - released
  ctx.fillStyle = lit ? colours.accent : colours.ink
  // The ink stands back a little, so the part of it a key has lived through reads over it.
  const weight = lit ? 1 : INK.text
  const mark = (cents: number, y: number, wide: number, alpha: number): void => {
    if (wide <= 0 || alpha <= 0) return
    ctx.globalAlpha = alpha * weight
    ctx.fillRect(centsX(cents, box, knobs.span) - wide / 2, y, wide, 1)
  }
  for (let row = 0; row < box.h; row++) {
    const seconds = stationSeconds((row + 0.5) / box.h)
    if (seconds > until) break
    const next = stationSeconds((row + 1.5) / box.h)
    const y = box.y + row
    const level =
      velocity *
      shortwaveLevel(seconds, seconds > letGo ? seconds - letGo : null, knobs.attack, knobs.release)
    if (level < SHORTWAVE_GONE) continue
    // The static around it: as thick as the station is loud, so it comes and goes with the key. Where each
    // speck lies says nothing: the same places every time.
    const specks = Math.floor((knobs.hiss * level * box.w) / 2.5 + draw(row, 9))
    ctx.globalAlpha = lit ? 0.85 : 0.5
    for (let speck = 0; speck < specks; speck++)
      ctx.fillRect(box.x + Math.floor(draw(row * 37 + speck, 10) * (box.w - 1)), y, 1.5, 1)
    const wide = 1 + (box.w / 17) * clamp(1 + gainToDb(level) / 40, 0, 1)
    const off = shortwaveSlideCents(tuneIn, seconds, SHORTWAVE_REACH)
    // Further down a row holds more time than a change of tone takes: both tones then, each at its share.
    const at = count - rate * (until - seconds)
    const blurred = rate * (next - seconds) > 0.5
    let open = 1
    if (signal === PIPS)
      open = blurred ? shortwavePipDuty(rate) : shortwavePipOpen(at, rate) ? 1 : 0
    const onShift = signal !== WARBLE ? 0 : blurred ? 0.5 : shortwaveOnShift(at, rate) ? 1 : 0
    for (let tone = 0; tone < tones; tone++) {
      let cents = 0
      let share = open
      if (signal === WARBLE) {
        cents = tone === 0 ? 0 : 1200 * Math.log2(knobs.ratio)
        share = tone === 0 ? 1 - onShift : onShift
      } else if (signal === VOICES) {
        cents = 1200 * Math.log2(tone + 1)
        // `Mouth`: a key begins in the middle of a syllable; the ones after it are of the device's own lengths,
        // so only the ink says them, at their middle length, and a lit breath is every other row.
        const counts = rate * seconds
        const through = counts < 0.5 ? 0.5 + counts : 1 + (counts - 0.5) / SHORTWAVE_SYLLABLE
        const sine = Math.sin(Math.PI * (through - Math.floor(through)))
        const shut = 1 - sine * sine
        const mouth = SHORTWAVE_MOUTH_SHUT + (1 - SHORTWAVE_MOUTH_SHUT) * (1 - shut * shut)
        const known = !lit || counts < 0.5
        share = (known && !blurred ? mouth : 0.7) * (!known && row % 2 === 1 ? 0 : 1)
      }
      if (share <= 0) continue
      if (off > 0) {
        // Near the key a row is a moment and the slide is fast: each arm is drawn through to where the next row finds it.
        const then = shortwaveSlideCents(tuneIn, next, SHORTWAVE_REACH)
        ctx.globalAlpha = 0.9 * share * weight
        for (let side = -1; side <= 1; side += 2) {
          const from = centsX(cents + side * off, box, knobs.span)
          const to = centsX(cents + side * then, box, knobs.span)
          ctx.fillRect(Math.min(from, to), y, Math.max(1, Math.abs(to - from)), 1)
        }
        continue
      }
      if (halo > core) mark(cents, y, wide * halo, 0.3 * share)
      mark(cents, y, Math.max(0.6, wide * core), share)
      if (second <= 0 || (signal === VOICES && tone > 0)) continue
      // The second station, a few hertz up: at its place by the note's own pitch.
      const above = cents + 1200 * Math.log2((hz + beatHz) / hz)
      mark(above, y, 1, lerp(0.35, 0.8, second / SHORTWAVE_BEAT_LEVEL) * share)
      // A rung where the two have come round once more against each other. When that is, is not known of a played key.
      if (!lit && Math.floor(beatHz * seconds) !== Math.floor(beatHz * next)) {
        const from = centsX(cents, box, knobs.span)
        ctx.globalAlpha = 0.8 * share
        ctx.fillRect(from, y, centsX(above, box, knobs.span) - from, 1)
      }
    }
  }
  ctx.globalAlpha = 1
}

const dialHz = (x: number, box: Box): number =>
  SHORTWAVE_LOW_HZ *
  Math.pow(SHORTWAVE_HIGH_HZ / SHORTWAVE_LOW_HZ, clamp((x - box.x) / Math.max(box.w, 1), 0, 1))

/** The path of a sound that is as loud at every pitch (`gain` against one key at full level), as the receiver's band leaves it over the dial. */
function shortwaveOver(
  ctx: CanvasRenderingContext2D,
  scope: Box,
  band: number,
  sampleRate: number,
  gain: number,
  closed: boolean,
): void {
  const base = scope.y + scope.h
  const steps = Math.max(2, Math.ceil(scope.w / 2))
  ctx.beginPath()
  for (let step = 0; step <= steps; step++) {
    const x = scope.x + (scope.w * step) / steps
    const db = gainToDb(gain) + shortwaveBandDb(band, dialHz(x, scope), sampleRate)
    const y = base - scope.h * scopeShare(db)
    if (step === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  if (!closed) return
  ctx.lineTo(scope.x + scope.w, base)
  ctx.lineTo(scope.x, base)
  ctx.closePath()
}

/** One tone on the dial: a line from it up to its level, `db` against one key at full level before the band. */
function shortwaveSpike(
  frame: Paint & Pick<DisplayFrame, 'sampleRate'>,
  scope: Box,
  band: number,
  hz: number,
  db: number,
  style: { lit: boolean; width?: number; alpha?: number },
): void {
  if (hz < SHORTWAVE_LOW_HZ || hz > SHORTWAVE_HIGH_HZ) return
  const share = scopeShare(db + shortwaveBandDb(band, hz, frame.sampleRate))
  if (share <= 0) return
  const x = dialX(hz, scope)
  const base = scope.y + scope.h
  rule(frame.ctx, x, base, x, base - scope.h * share, {
    colour: style.lit ? frame.colours.accent : frame.colours.ink,
    width: style.width ?? 1,
    alpha: style.alpha ?? 1,
  })
}

/** What a key was started with, and how far its keying has run: the device throws the slide's way, the knob sets its size, once. */
interface ShortwaveTuned extends Kept {
  tuneIn: number
  /** Changes of tone, or pips, since the key: Rate may move while it is held. */
  count: number
  age: number
}

interface ShortwaveState {
  /** The station the picture is drawn on: the last key that sounded. */
  key: number
  tuned: ShortwaveTuned[]
  knobs: ShortwaveKnobs
  /** Each note's level now, 0 once it is gone, and the room to sort them in. */
  shares: number[]
  sorted: number[]
}

/** The tones one station sends on the dial at this moment, lit: its note, or its Shift, or its harmonics, each as high as it is loud. */
function shortwaveStation(
  frame: DisplayFrame<ShortwaveState>,
  scope: Box,
  band: number,
  hz: number,
  level: number,
  tuned: ShortwaveTuned,
): void {
  const { signal, rate, fading } = frame.state.knobs
  const db = gainToDb(level)
  const base = scope.y + scope.h
  // Where the station is, whatever it sends at this moment: a mark on the dial.
  const x = dialX(hz, scope)
  const { ctx, colours } = frame
  fillRect(ctx, { x: x - 1.5, y: base - 1, w: 3, h: 3 }, colours.accent)
  const tone = (at: number, alpha: number, width: number): void => {
    // The air leaves a faded station between its worst and its best: sure to the first, at most to the second.
    if (fading > 0)
      shortwaveSpike(frame, scope, band, at, db + shortwaveFadeBestDb(fading), {
        lit: true,
        width,
        alpha: 0.4 * alpha,
      })
    shortwaveSpike(frame, scope, band, at, db + shortwaveFadeWorstDb(fading), {
      lit: true,
      width,
      alpha,
    })
  }
  // The keying runs from the key down, through the slide as after it: a shut pip sends nothing.
  if (signal === PIPS && !shortwavePipOpen(tuned.count, rate)) return
  const shifted = signal === WARBLE && shortwaveOnShift(tuned.count, rate)
  const sent = shifted ? hz * shortwaveShiftRatio(frame.value('shift'), hz, frame.sampleRate) : hz
  // Still sliding in: every tone it sends is this far off its place, to one side or the other.
  const off = shortwaveSlideCents(tuned.tuneIn, tuned.age, SHORTWAVE_REACH)
  const bend = Math.pow(2, off / 1200)
  // Voices is breath on each harmonic that fits: a band of noise, not a line, and how loud each is the mouth's to say.
  const count = signal === VOICES ? shortwaveHarmonics(hz, frame.sampleRate) : 1
  for (let n = 1; n <= count; n++) {
    const strength = signal !== VOICES ? 1 : n === 1 ? 0.9 : 0.55
    if (off > 0) {
      tone(sent * n * bend, 0.6 * strength, 1)
      tone((sent * n) / bend, 0.6 * strength, 1)
    } else tone(sent * n, strength, signal === VOICES ? 2 : 1.6)
  }
}

const shortwave = plateDisplay<ShortwaveState>({
  place: 'window',
  columns: 2,
  params: [
    'signal',
    'tuneIn',
    'drift',
    'rate',
    'shift',
    'fading',
    'beat',
    'static',
    'band',
    'attack',
    'release',
  ],
  live: { signal: true, notes: true, stereo: true },
  info: 'Above, one station from its key downward: it slides in from either side, comes up in its static, is keyed, fades between a thin core and a wide line, and sinks when the key is let go. Below, the dial: the band, the static and each station that sounds. The handles set Tune in and Static.',
  init: () => ({
    key: SHORTWAVE_REST_HZ,
    tuned: [],
    knobs: {
      signal: 0,
      span: SHORTWAVE_NEAR_CENTS,
      hiss: 0,
      rate: 2,
      ratio: 2,
      harmonics: 5,
      fading: 0,
      beat: 0,
      attack: 0.1,
      release: 1,
    },
    shares: [],
    sorted: [],
  }),
  draw(frame) {
    const { ctx, colours, state, notes } = frame
    ground(frame)
    const { station, scope, foot } = shortwaveParts(frame)
    const knobs = state.knobs
    knobs.signal = clamp(Math.round(frame.value('signal')), 0, SHORTWAVE_SIGNALS.length - 1)
    knobs.rate = Math.max(frame.value('rate'), 0.01)
    knobs.fading = clamp(frame.value('fading'), 0, 1)
    knobs.beat = clamp(frame.value('beat'), 0, 1)
    knobs.attack = frame.value('attack')
    knobs.release = frame.value('release')
    const tuneIn = clamp(frame.value('tuneIn'), 0, 1)
    const band = clamp(frame.value('band'), 0, 1)
    const hiss = shortwaveHiss(clamp(frame.value('static'), 0, 1))
    const keyed = knobs.signal !== 0
    knobs.hiss = hiss
    knobs.span = windowSpan(knobs.signal)

    // Which stations still sound, how loud each is, and how far each one's keying has run.
    let loudest = 0
    let last = -1
    state.shares.length = notes.length
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      let tuned = keptOf(state.tuned, note, frame.now)
      if (!tuned) {
        const went = frame.now - note.age
        tuned = { id: note.id, went, seen: 0, tuneIn, count: knobs.rate * note.age, age: note.age }
        state.tuned.push(tuned)
      }
      tuned.seen = frame.now
      tuned.count += knobs.rate * Math.max(0, note.age - tuned.age)
      tuned.age = note.age
      const level =
        shortwaveVelocity(note.gain) *
        shortwaveLevel(note.age, note.released, knobs.attack, knobs.release)
      const sounds = level >= SHORTWAVE_GONE
      state.shares[index] = sounds ? level : 0
      if (!sounds) continue
      loudest = Math.max(loudest, level)
      last = index
    }
    if (state.tuned.length > notes.length) dropUnseen(state.tuned, frame.now)
    const least = loudestKept(state.shares, state.sorted, SHORTWAVE_VOICES)
    // `Shortwave::control`, `held`: the stations' envelopes added up, the ten that have a voice.
    let held = 0
    for (let index = 0; index < notes.length; index++)
      if (state.shares[index] > 0 && state.shares[index] >= least)
        held += state.shares[index] / shortwaveVelocity(notes[index].gain)
    const crowd = shortwaveCrowd(held)
    // `Shortwave::note_on`: the keys the device takes, with room above for the slide and the Shift.
    const highest = Math.min(12000, 0.3 * frame.sampleRate)
    if (last >= 0) state.key = clamp(notes[last].frequency, 16, highest)
    knobs.ratio = shortwaveShiftRatio(frame.value('shift'), state.key, frame.sampleRate)
    knobs.harmonics = shortwaveHarmonics(state.key, frame.sampleRate)

    // The station's window: the note in the middle, a semitone, a fourth, an octave and two either side;
    // on Voices the note's multiples.
    const floor = station.y + station.h
    for (let tick = 0; tick < SHORTWAVE_TICKS.length; tick++) {
      const cents = knobs.span > 0 ? SHORTWAVE_TICKS[tick] : 1200 * Math.log2(tick + 1)
      if (Math.abs(cents) > knobs.span && knobs.span > 0) continue
      if (knobs.span <= 0 && tick >= SHORTWAVE_COMB) continue
      const x = centsX(cents, station, knobs.span)
      rule(ctx, x, floor, x, floor - (Math.abs(cents) >= 1200 ? 4 : 2), {
        colour: colours.ink,
        alpha: INK.rule,
      })
    }
    const second = station.y + station.h * stationShare(1)
    rule(ctx, station.x, second, station.x + station.w, second, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    // Drift: how far either side of its note the station wanders, once it has arrived.
    const wander = shortwaveDriftCents(clamp(frame.value('drift'), 0, 1))
    const arrived = station.y + station.h * stationShare(shortwaveSlideSeconds(tuneIn))
    const gone = station.y + station.h * stationShare(SHORTWAVE_HELD_SEC + knobs.release)
    if (wander > 0)
      fillRect(
        ctx,
        {
          x: centsX(-wander, station, knobs.span),
          y: arrived,
          w: centsX(wander, station, knobs.span) - centsX(-wander, station, knobs.span),
          h: gone - arrived,
        },
        colours.ink,
        INK.fill,
      )
    shortwaveTrack(
      frame,
      station,
      state.key,
      1,
      knobs,
      tuneIn,
      SHORTWAVE_LONG_SEC,
      SHORTWAVE_LONG_SEC - SHORTWAVE_HELD_SEC,
      knobs.rate * SHORTWAVE_LONG_SEC,
      false,
    )
    // The last key played, as far as it has come: the same life, lit.
    if (last >= 0 && state.shares[last] >= least) {
      const note = notes[last]
      const tuned = keptOf(state.tuned, note, frame.now)
      if (tuned)
        shortwaveTrack(
          frame,
          station,
          state.key,
          shortwaveVelocity(note.gain),
          knobs,
          tuned.tuneIn,
          note.age,
          note.released,
          tuned.count,
          true,
        )
      // Where in that life it is now: a line across, until the window ends.
      if (note.age < SHORTWAVE_LONG_SEC) {
        const y = station.y + station.h * stationShare(note.age)
        rule(ctx, station.x, y, station.x + station.w, y, { colour: colours.accent, alpha: 0.6 })
      }
    }

    // The dial: what the band lets through of one key at full level, and the static under such a key.
    const base = scope.y + scope.h
    shortwaveOver(ctx, scope, band, frame.sampleRate, 1, false)
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.globalAlpha = INK.rule
    ctx.stroke()
    if (hiss > 0) {
      shortwaveOver(ctx, scope, band, frame.sampleRate, hiss, true)
      ctx.fillStyle = colours.ink
      ctx.globalAlpha = INK.fill
      ctx.fill()
      ctx.globalAlpha = 1
      // Its crackles: as many specks as there are in a second, at places that say nothing of when.
      const crackles = Math.round(shortwaveCrackles(clamp(frame.value('static'), 0, 1)))
      for (let speck = 0; speck < crackles; speck++) {
        const x = scope.x + 3 + draw(speck, 5) * (scope.w - 6)
        const top =
          base -
          scope.h *
            scopeShare(gainToDb(hiss) + shortwaveBandDb(band, dialHz(x, scope), frame.sampleRate))
        dot(ctx, x, Math.max(scope.y + 1, top - 2 - 3 * draw(speck, 6)), 0.8, colours.ink, {
          alpha: INK.text,
        })
      }
    }
    ctx.globalAlpha = 1
    rule(ctx, scope.x, base, scope.x + scope.w, base, { colour: colours.ink, alpha: INK.back })
    for (const hz of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
      const x = dialX(hz, scope)
      const decade = hz === 100 || hz === 1000 || hz === 10000
      rule(ctx, x, base, x, base + (decade ? 4 : 2), { colour: colours.ink, alpha: INK.back })
    }
    // The station of the picture, at rest: its tones as a key at full level would send them.
    const tones = knobs.signal === VOICES ? knobs.harmonics : knobs.signal === WARBLE ? 2 : 1
    for (let tone = 0; tone < tones; tone++)
      shortwaveSpike(
        frame,
        scope,
        band,
        state.key * (knobs.signal === WARBLE && tone === 1 ? knobs.ratio : tone + 1),
        0,
        { lit: false, alpha: tone === 0 ? INK.text : INK.back },
      )

    // What sounds: the static as loud as the loudest key makes it, and every station at its level.
    if (loudest > 0 && hiss > 0) {
      shortwaveOver(ctx, scope, band, frame.sampleRate, hiss * loudest, true)
      ctx.fillStyle = colours.accent
      ctx.globalAlpha = 0.45
      ctx.fill()
      ctx.globalAlpha = 1
    }
    for (let index = 0; index < notes.length; index++) {
      const level = state.shares[index]
      if (level <= 0 || level < least) continue
      const note = notes[index]
      const tuned = keptOf(state.tuned, note, frame.now)
      if (tuned)
        shortwaveStation(
          frame,
          scope,
          band,
          clamp(note.frequency, 16, highest),
          level * crowd,
          tuned,
        )
    }

    sidesFoot(frame, foot, [])
    label(frame, '1 s', station.x + 1, second - 2)
    for (const [hz, name] of [
      [100, '100'],
      [1000, '1k'],
      [10000, '10k'],
    ] as const)
      // A name that would run off the right edge stands on the other side of its tick.
      if (dialX(hz, scope) + 16 > scope.x + scope.w)
        text(frame, name, dialX(hz, scope) - 3, base + 10, { alpha: INK.text, align: 'right' })
      else text(frame, name, dialX(hz, scope) + 3, base + 10, { alpha: INK.text })
    // The words: what the stations send and how often it is keyed, and the key and how long it takes to come in.
    const sends = SHORTWAVE_SIGNALS[knobs.signal]
    text(frame, keyed ? `${sends} ${knobs.rate.toFixed(1)} Hz` : sends, station.x - 2, 11)
    text(
      frame,
      tuneIn > 0
        ? `${pitchName(state.key)} ${secondsText(shortwaveSlideSeconds(tuneIn))}`
        : pitchName(state.key),
      station.x + station.w + 2,
      11,
      { align: 'right' },
    )

    for (const point of shortwaveHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: shortwaveHandles,
})

/**
 * The pitch on the dial the Static handle stands at: in the band at every
 * setting of it, and far under the top of it at any rate a device runs at, so
 * the handle needs no rate of its own.
 */
const SHORTWAVE_HANDLE_HZ = 1200
const SHORTWAVE_HANDLE_RATE = 48000

function shortwaveHandles(view: DisplayView): DisplayHandle[] {
  const { station, scope } = shortwaveParts(view)
  const signal = Math.round(view.value('signal'))
  const span = windowSpan(signal)
  const reach = SHORTWAVE_REACH * SHORTWAVE_TUNE_CENTS
  // On Voices every harmonic has the arms; the handle is on one that is wide enough to drag.
  const from = span > 0 ? 0 : 1200 * Math.log2(SHORTWAVE_COMB_HANDLE)
  const base = scope.y + scope.h
  const band = clamp(view.value('band'), 0, 1)
  const cut = shortwaveBandDb(band, SHORTWAVE_HANDLE_HZ, SHORTWAVE_HANDLE_RATE)
  const hiss = shortwaveHiss(clamp(view.value('static'), 0, 1))
  return [
    {
      key: 'tuneIn',
      name: 'Tune in',
      // Where the slide starts, on the arm above the note.
      x: centsX(from + reach * clamp(view.value('tuneIn'), 0, 1), station, span),
      y: station.y + 1,
      drag: (toX) => {
        if (span <= 0) {
          const multiple = (SHORTWAVE_COMB * (toX - station.x)) / station.w
          const cents = 1200 * Math.log2(Math.max(multiple, 1) / SHORTWAVE_COMB_HANDLE)
          return { tuneIn: clamp(cents / reach, 0, 1) }
        }
        const share = clamp((toX - station.x - station.w / 2) / (station.w / 2 - 3), 0, 1)
        return { tuneIn: clamp((span * share * share) / reach, 0, 1) }
      },
      reset: () => ({ tuneIn: view.spec('tuneIn')?.default ?? 0.25 }),
    },
    {
      key: 'static',
      name: 'Static',
      x: dialX(SHORTWAVE_HANDLE_HZ, scope),
      y: base - scope.h * scopeShare(gainToDb(hiss) + cut),
      drag: (_x, toY) => {
        const share = clamp((base - toY) / scope.h, 0, 1)
        if (share <= 0) return { static: 0 }
        const gain = Math.pow(10, ((share - 1) * SHORTWAVE_SCOPE_DB - cut) / 20)
        return { static: clamp(Math.pow(gain / SHORTWAVE_HISS, 2 / 3), 0, 1) }
      },
      reset: () => ({ static: view.spec('static')?.default ?? 0.3 }),
    },
  ]
}

export const WEATHER_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  shortwave: { display: shortwave, face: ['signal', 'tuneIn', 'fading', 'static'] },
  ice: { display: ice, face: ['distance', 'bright', 'ring', 'thick'] },
  droplets: { display: droplets, face: ['rain', 'material', 'loose', 'size'] },
}
