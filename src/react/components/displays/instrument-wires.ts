// The displays of the invented instruments: wires.
//
// Three instruments made of piano and harp wire that nothing strikes in the
// usual way: magnets sing one, objects lie on another, the wind plays the
// third. Each display is the wire itself as its knobs set it: how it stands,
// what lies on it, what moves it. A key that sounds is lit on its own wire for
// as long as the device's own figures let it sound.

import {
  INK,
  clamp,
  dot,
  fillRect,
  gainToDb,
  ground,
  lerp,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayNote,
  type DisplaySignal,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, outShare, pitchName, xOfPitch } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>

const TAU = Math.PI * 2

// --- Partials read from the sound --------------------------------------------

/**
 * The analyser the plate reads the sound with weighs its 2048 samples with a
 * window of three cosine terms (0.42, 0.5, 0.08): a steady sine fills the
 * bins up to three either side of its own and next to nothing beyond.
 * `LOBE_DB` is what it shows of the sine on its own bin, half a bin off, one
 * bin off and so on to three, in dB.
 */
const LOBE_BINS = 3
const LOBE_DB = [0, -1.1, -4.5, -10.6, -20.4, -36.9, -60] as const

/** How far under a sine's own level the analyser shows it `bins` bins off, in dB. */
export function lobeDb(bins: number): number {
  const at = clamp(Math.abs(bins) * 2, 0, LOBE_DB.length - 1)
  const low = Math.floor(at)
  return lerp(LOBE_DB[low], LOBE_DB[Math.min(low + 1, LOBE_DB.length - 1)], at - low)
}

/**
 * The level of a partial at `hz` in the sound, in dB, where the partials next
 * to it stand `apart` hertz off; −Infinity where there is no bin for it. It
 * is read on its own bin, and on the two beside it only where no neighbour
 * reaches them: the strings of a note are tuned a little apart, which far up
 * moves a partial into the next bin, but the partials of a low string stand
 * so close that the bin beside one belongs as much to the next.
 */
export function partialDb(bins: Float32Array, binHz: number, hz: number, apart: number): number {
  const at = Math.round(hz / binHz)
  if (!(binHz > 0) || at < 1 || at > bins.length - 2) return -Infinity
  return apart >= 2 * LOBE_BINS * binHz ? Math.max(bins[at - 1], bins[at], bins[at + 1]) : bins[at]
}

// --- Magnet Piano ------------------------------------------------------------

/** `magnet_piano.h`, `kPartials`, `kFedPartials`, `kMaxVoices`: the partials of a string, the ones the magnets reach, the keys that sound at once. */
const MAGNET_PARTIALS = 12
const MAGNET_FED = 8
const MAGNET_VOICES = 12
/** `magnet_piano.h`, `kTopHz` and `kFedTopHz`: no partial above the one, none fed above the other. */
const MAGNET_TOP_HZ = 16000
const MAGNET_FED_TOP_HZ = 10000
/** `magnet_piano.h`, `kToHalfPower`: time constants in the time to come within 3 dB. */
const MAGNET_TO_HALF_POWER = 1.231
/** `magnet_piano.h`, `kSweepSpan`: partials either way at Sweep 1. */
const MAGNET_SWEEP_SPAN = 3.5
/** `magnet_piano.h`, `kRingShare`, `kRingRiseSeconds`: what a string takes up of a matching partial at Sympathy 1, and how soon. */
const MAGNET_RING_SHARE = 0.35
const MAGNET_RING_RISE = 0.15

/** `MagnetPiano::stiffness`: how stiff the string of a note is, 1e-4 at the bottom A and 2e-3 at the top C. */
export function magnetStiffness(hz: number): number {
  return 1e-4 * Math.pow(hz / 27.5, 0.596)
}

/** `MagnetPiano::partial_hz`: partial `n` of the string of a note, stretched sharp as a stiff string's is. */
export function magnetPartialHz(hz: number, n: number): number {
  const b = magnetStiffness(hz)
  return n * hz * Math.sqrt((1 + b * n * n) / (1 + b))
}

/** `MagnetPiano::start`, `fed`: the highest partial the magnets feed on a note: one of the first eight, under 10 kHz. */
export function magnetTop(hz: number): number {
  let top = 1
  for (let n = 2; n <= MAGNET_FED; n++) if (magnetPartialHz(hz, n) < MAGNET_FED_TOP_HZ) top = n
  return top
}

/** `MagnetPiano::start`, `count`: how many partials the string of a note has under 16 kHz. */
export function magnetCount(hz: number, sampleRate = 48000): number {
  const top = Math.min(MAGNET_TOP_HZ, 0.45 * sampleRate)
  let count = 0
  for (let n = 1; n <= MAGNET_PARTIALS; n++) if (magnetPartialHz(hz, n) < top) count = n
  return count
}

/** `MagnetPiano::apply`, `kBright`: half the width of the magnets' bell, in partials. */
export function magnetReach(bright: number): number {
  return 1 + 6 * bright * Math.sqrt(bright)
}

/**
 * `MagnetPiano::drive`: the partial the magnets stand over, from Harmonic and
 * from where Sweep's path (−1 to 1) has taken them. They cannot leave the
 * string: past either end of their reach they turn back.
 */
export function magnetCentre(harmonic: number, top: number, sweep = 0, path = 0): number {
  let centre = clamp(harmonic, 1, top) + MAGNET_SWEEP_SPAN * sweep * path
  if (centre < 1) centre = 2 - centre
  if (centre > top) centre = 2 * top - centre
  return clamp(centre, 1, top)
}

/** The lowest and the highest partial Sweep can take the magnets to, written into `into`. */
export function magnetSweepSpan(
  harmonic: number,
  top: number,
  sweep: number,
  into: [number, number],
): [number, number] {
  const home = clamp(harmonic, 1, top)
  const far = MAGNET_SWEEP_SPAN * sweep
  // What would lie past an end is folded back from it, as far as it went past.
  into[0] = Math.max(1, Math.min(home - far, 2 * top - (home + far)))
  into[1] = Math.min(top, Math.max(home + far, 2 - (home - far)))
  return into
}

/**
 * `MagnetPiano::drive`, `fed` and `magnets`: what the magnets give each of the
 * `count` partials of a string when they stand over `centre`, written into
 * `into` (partial 1 first). A raised-cosine bell, squared, at one power
 * whatever its width.
 */
export function magnetFed(
  centre: number,
  reach: number,
  count: number,
  into: Float32Array | number[],
): void {
  let power = 0
  for (let n = 1; n <= MAGNET_PARTIALS; n++) {
    const away = Math.abs(n - centre)
    const bell = n <= count && away < reach ? Math.cos((Math.PI / 2) * (away / reach)) : 0
    into[n - 1] = bell * bell
    power += into[n - 1] * into[n - 1]
  }
  const even = power > 0 ? 1 / Math.sqrt(power) : 0
  for (let n = 0; n < MAGNET_PARTIALS; n++) into[n] *= even
}

/**
 * `MagnetPiano::drive`, `pace`: how far the magnets have brought partial `n`
 * of a key held `seconds`, 0 to 1. The partial they stand over is within 3 dB
 * at Bloom; one `k` times as high gets there the square root of `k` sooner.
 */
export function magnetSwell(seconds: number, n: number, centre: number, bloom: number): number {
  return (
    1 - Math.exp((-MAGNET_TO_HALF_POWER * Math.max(0, seconds) * Math.sqrt(n / centre)) / bloom)
  )
}

/** `MagnetPiano::level_for`: how loud a key played as hard as `gain` swells. */
export function magnetVelocity(gain: number): number {
  return 0.25 + 0.75 * clamp(gain, 0, 1)
}

/** `MagnetPiano::begin`, `damper_coeff_`: what the damper leaves of a note let go `released` seconds ago: 60 dB down at Damper. */
export function magnetDamp(released: number | null, damper: number): number {
  return released === null ? 1 : Math.pow(10, (-3 * released) / damper)
}

/**
 * `MagnetPiano::restrike` and `begin`: one pitch is one set of strings, so a
 * key does not always swell from nothing. A key at the pitch of one that was
 * let go before it began (the same key pressed again is let go at that
 * instant) starts from what those strings still hold: the older key's swell
 * as it stood when it was let go, under what the damper has taken since, and
 * against the two keys' loudness. Written into `into`: how far the magnets
 * have brought each of the twelve partials of the key `notes[index]` by now,
 * 1 its own full swell. A key that began while the older one was still held
 * is a string set of its own and starts from nothing.
 */
export function magnetSwollen(
  notes: readonly DisplayNote[],
  index: number,
  centre: number,
  bloom: number,
  damper: number,
  into: Float32Array | number[],
): void {
  const hz = notes[index].frequency
  let before: DisplayNote | null = null
  for (let n = 0; n < MAGNET_PARTIALS; n++) into[n] = 0
  for (let i = 0; i <= index; i++) {
    const note = notes[i]
    if (note.frequency !== hz) continue
    // What is handed on: nothing from a key that was still down, or from no key at all.
    const gap = (before?.released ?? -Infinity) - note.age
    const carried =
      before !== null && gap >= 0
        ? (magnetDamp(gap, damper) * magnetVelocity(before.gain)) / magnetVelocity(note.gain)
        : 0
    // The magnets work for as long as the key is down; the swell stands still once it is let go.
    const held = note.age - (note.released ?? 0)
    for (let n = 1; n <= MAGNET_PARTIALS; n++)
      into[n - 1] = 1 - (1 - into[n - 1] * carried) * (1 - magnetSwell(held, n, centre, bloom))
    before = note
  }
}

/** `MagnetPiano::hit`, `blow`: the level the felt gives partial `n` of a string at rest. A harder key is louder and keeps more of its top. */
export function magnetBlow(hammer: number, gain: number, hz: number, n: number): number {
  const strength = 0.55 * hammer * gain * (0.3 + 0.7 * gain)
  const corner = (700 + 2300 * gain) * Math.sqrt(hz / 220)
  const over = magnetPartialHz(hz, n) / corner
  return strength / (Math.sqrt(n) * (1 + over * over))
}

/** `MagnetPiano::start`, `strike_decay`: seconds a struck partial takes to fall 60 dB while its key is held. */
export function magnetStruckSeconds(hz: number, n: number): number {
  return clamp(7 * Math.sqrt(220 / hz), 1, 14) * Math.pow(n, -0.8)
}

/** `MagnetPiano::hit`, `contact`: seconds the felt touches the string. */
export function magnetContactSeconds(hz: number): number {
  return clamp(0.0035 * Math.pow(220 / hz, 0.3), 0.0015, 0.008)
}

/** `MagnetPiano::drive`, `struck`: what is left of the strike on partial `n`, `seconds` after the key. */
export function magnetStruck(
  hammer: number,
  gain: number,
  hz: number,
  n: number,
  seconds: number,
): number {
  if (hammer <= 0 || seconds < 0) return 0
  const landed = Math.min(1, seconds / magnetContactSeconds(hz))
  return (
    landed *
    magnetBlow(hammer, gain, hz, n) *
    Math.pow(10, (-3 * seconds) / magnetStruckSeconds(hz, n))
  )
}

/** `MagnetPiano::spread`: the hertz the flat string's partial `n` is off the one in tune; the sharp one is off by 9/11 of that. */
export function magnetBeatHz(hz: number, n: number, shimmer: number): number {
  const apart = Math.pow(2, (6 * shimmer) / 1200) - 1
  // `kBeatCapHz`: a high note would flutter, so its flat string's fundamental is held within 2.5 Hz.
  return 1.1 * magnetPartialHz(hz, n) * Math.min(apart, 2.5 / (1.1 * hz))
}

/**
 * `MagnetPiano::control` and `voice_weights`: how large the three strings of
 * a note are together, 1 when all three are in step, after the flat one has
 * gone `turns` round against the one in tune. The outer two are 12 dB under
 * the middle one and Width sets them left and right; this is the two sides'
 * power together.
 */
export function magnetStrings(turns: number, width: number): number {
  const angle = (1 - clamp(width, 0, 1)) * (Math.PI / 4)
  const middle = 0.5 * 0.25 * (Math.cos(angle) + Math.sin(angle))
  const sides = 0.5 * 0.25 * 2 * (Math.cos(angle) - Math.sin(angle))
  const outer = middle + sides
  const inner = middle - sides
  const flat = -TAU * turns
  const sharp = TAU * turns * (0.9 / 1.1)
  const cf = Math.cos(flat)
  const sf = Math.sin(flat)
  const cs = Math.cos(sharp)
  const ss = Math.sin(sharp)
  const leftRe = outer * cf + Math.SQRT1_2 + inner * cs
  const leftIm = outer * sf + inner * ss
  const rightRe = inner * cf + Math.SQRT1_2 + outer * cs
  const rightIm = inner * sf + outer * ss
  const full = Math.SQRT1_2 + outer + inner
  const power = (leftRe * leftRe + leftIm * leftIm + rightRe * rightRe + rightIm * rightIm) / 2
  return Math.sqrt(power) / full
}

/** The same over a whole round of the beating, as the root of the mean power: for a partial that beats faster than can be shown. */
export function magnetStringsMean(width: number): number {
  const angle = (1 - clamp(width, 0, 1)) * (Math.PI / 4)
  const middle = 0.5 * 0.25 * (Math.cos(angle) + Math.sin(angle))
  const sides = 0.5 * 0.25 * 2 * (Math.cos(angle) - Math.sin(angle))
  const outer = middle + sides
  const inner = middle - sides
  return Math.sqrt(0.5 + outer * outer + inner * inner) / (Math.SQRT1_2 + outer + inner)
}

/** `MagnetPiano::start`, `place`: where a frequency lies on the sympathy bus, in bins a quarter of a semitone wide. */
export function magnetBusPlace(hz: number): number {
  return clamp(232 + 48 * Math.log2(hz / 440), 0, 486)
}

/** `MagnetPiano::drive` and `voice_weights`: the share of a partial written at bus place `other` that a partial listening at `own` hears. */
export function magnetHeard(own: number, other: number): number {
  const bin = Math.floor(own)
  const far = own - bin
  const theirs = Math.floor(other)
  const theirFar = other - theirs
  if (theirs === bin) return (1 - far) * (1 - theirFar) + far * theirFar
  if (theirs === bin + 1) return far * (1 - theirFar)
  if (theirs === bin - 1) return (1 - far) * theirFar
  return 0
}

/** `MagnetPiano::wood_gain` and `voice_weights`, `board`: what the soundboard does to a frequency, as a gain. */
export function magnetBoard(hz: number, body: number): number {
  const octave = Math.log2(hz)
  let db = -2
  const centre = [6.78, 8.18, 9.68]
  const octaves = [0.9, 0.6, 0.5]
  const lift = [5, 4, 3]
  for (let k = 0; k < 3; k++) {
    const away = (octave - centre[k]) / octaves[k]
    db += lift[k] * Math.exp(-0.5 * away * away)
  }
  const wood = Math.pow(10, db / 20) / Math.sqrt(1 + (hz / 1400) * (hz / 1400))
  const air = 1 / Math.sqrt(1 + (hz / 6000) * (hz / 6000))
  return air * (1 + clamp(body, 0, 1) * (wood - 1))
}

/** The key whose string stands on the display while none is played: the A under middle C, which the header's figures are given for. */
const MAGNET_REST_HZ = 220
/** The pitches the soundboard spans, left to right. */
const MAGNET_BOARD_LOW_HZ = 27.5
const MAGNET_BOARD_HIGH_HZ = 10000
/** The ages the string is drawn at inside its full swing: a quarter of a second, one and four after the key. */
const MAGNET_AGES = [0.25, 1, 4] as const
/** Under this share of a full swing a partial is not marked on the board. */
const MAGNET_FAINT = 0.03

interface MagnetParts {
  /** The string: its bridges at `x` and `x + w`, at rest along `y`, swinging `swing` either way at most. */
  x: number
  w: number
  y: number
  swing: number
  /** The rail the magnets hang from. */
  rail: number
  /** The soundboard: pitch runs along it, its foot at `y + h`. */
  board: Box
  foot: Box
}

function magnetParts(view: Size): MagnetParts {
  const foot: Box = { x: 4, y: view.height - 10, w: view.width - 8, h: 6 }
  const board: Box = { x: 5, y: foot.y - 12, w: view.width - 10, h: 7 }
  const rail = 18
  // The magnets' teeth hang 9 px under the rail; the string swings in what is left above the board.
  const top = rail + 10
  const x = 9
  return {
    x,
    // Past the far bridge the three strings of the note run on to their pins.
    w: Math.max(40, view.width - x - 24),
    y: (top + board.y - 1) / 2,
    swing: Math.max(6, (board.y - 1 - top) / 2),
    rail,
    board,
    foot,
  }
}

interface MagnetState {
  /** How far every partial swings at `points` places along the string, 0 to 1, partial by partial. */
  loops: Float32Array
  points: number
  /** What the magnets give each partial at rest, and one string's partials while they are worked out: what they are given and how far they have swollen. */
  fed: Float32Array
  mix: Float32Array
  swollen: Float32Array
  /** The partials of every key that sounds: their levels, what each puts on the sympathy bus, and where. */
  levels: Float32Array
  drives: Float32Array
  places: Float32Array
  /** Which of `frame.notes` each of those keys is. */
  index: Int16Array
  /** The two ends of Sweep's reach, and the two strongest partials of the string in hand. */
  span: [number, number]
  pair: [number, number]
}

/** The table of loops for a string drawn `w` px long: a point every pixel and a half. */
function magnetLoops(state: MagnetState, w: number): void {
  const points = Math.max(8, Math.floor(w / 1.5) + 1)
  if (state.points === points) return
  state.points = points
  state.loops = new Float32Array(MAGNET_PARTIALS * points)
  for (let n = 1; n <= MAGNET_PARTIALS; n++)
    for (let k = 0; k < points; k++)
      state.loops[(n - 1) * points + k] = Math.abs(Math.sin((Math.PI * n * k) / (points - 1)))
}

/**
 * The outline of the string standing in the `n` loops of its partial `n`,
 * swinging `swing` px either way: over the top from bridge to bridge and
 * back underneath.
 */
function magnetLens(
  frame: Pick<DisplayFrame<MagnetState>, 'ctx' | 'state'>,
  parts: MagnetParts,
  n: number,
  swing: number,
): void {
  const { ctx, state } = frame
  const { loops, points } = state
  const from = (n - 1) * points
  ctx.beginPath()
  ctx.moveTo(parts.x, parts.y)
  for (let k = 1; k < points; k++)
    ctx.lineTo(parts.x + (parts.w * k) / (points - 1), parts.y - loops[from + k] * swing)
  for (let k = points - 2; k >= 0; k--)
    ctx.lineTo(parts.x + (parts.w * k) / (points - 1), parts.y + loops[from + k] * swing)
  ctx.closePath()
}

/** The strongest of a string's twelve partials from `at` on, and the next; −1 for one that is not there. */
function magnetStrongest(levels: Float32Array, at: number, into: [number, number]): void {
  into[0] = into[1] = -1
  for (let n = 0; n < MAGNET_PARTIALS; n++) {
    const level = levels[at + n]
    if (!(level > 0)) continue
    if (into[0] < 0 || level > levels[at + into[0]]) {
      into[1] = into[0]
      into[0] = n
    } else if (into[1] < 0 || level > levels[at + into[1]]) into[1] = n
  }
}

/** Where the magnet over partial `n` hangs along the rail (and any place between two of them). */
const magnetToothX = (parts: MagnetParts, n: number): number =>
  parts.x + ((n - 0.5) / MAGNET_FED) * parts.w

/** How thick the soundboard is drawn at a pitch: thicker where it gives more. */
const magnetBoardThick = (hz: number, body: number): number =>
  2 + 5 * clamp((gainToDb(magnetBoard(hz, body)) + 12) / 18, 0, 1)

/** The soundboard and the pitches the string of `hz` answers on it. */
function magnetSoundboard(frame: DisplayFrame<MagnetState>, parts: MagnetParts, hz: number): void {
  const { ctx, colours } = frame
  const { board } = parts
  const body = frame.value('body')
  const floor = board.y + board.h
  const hzAt = (x: number): number =>
    MAGNET_BOARD_LOW_HZ *
    Math.pow(MAGNET_BOARD_HIGH_HZ / MAGNET_BOARD_LOW_HZ, (x - board.x) / board.w)
  // Its top edge follows what it gives each pitch: three wooden swells and a softer top as Body rises.
  ctx.beginPath()
  ctx.moveTo(board.x, floor)
  for (let x = board.x; x <= board.x + board.w; x += 3)
    ctx.lineTo(x, floor - magnetBoardThick(hzAt(x), body))
  ctx.lineTo(board.x + board.w, floor)
  ctx.closePath()
  ctx.globalAlpha = 0.3
  ctx.fillStyle = colours.ink
  ctx.fill()
  ctx.globalAlpha = INK.back
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
  // Where this string listens for the other keys: at each of its own partials, as keenly as Sympathy.
  const sympathy = clamp(frame.value('sympathy'), 0, 1)
  const count = magnetCount(hz, frame.sampleRate)
  for (let n = 1; sympathy > 0 && n <= count; n++) {
    const partial = magnetPartialHz(hz, n)
    const x = xOfPitch(partial, board, MAGNET_BOARD_LOW_HZ, MAGNET_BOARD_HIGH_HZ)
    rule(ctx, x, floor - magnetBoardThick(partial, body) - 3, x, floor, {
      colour: colours.ink,
      alpha: sympathy * 0.9,
    })
  }
}

/** The rail of magnets: a tooth over each partial, as long as the magnets feed it, and the stretch Sweep rides. */
function magnetRail(frame: DisplayFrame<MagnetState>, parts: MagnetParts, hz: number): void {
  const { ctx, colours, state } = frame
  const top = magnetTop(hz)
  const centre = magnetCentre(frame.value('harmonic'), top)
  const wide = parts.w >= 150 ? 5 : 4
  rule(ctx, parts.x, parts.rail, parts.x + parts.w, parts.rail, {
    colour: colours.ink,
    alpha: INK.back,
  })
  for (let n = 1; n <= MAGNET_FED; n++) {
    // A magnet over a partial that lies past 10 kHz on this string feeds nothing: a stub.
    const long = n <= top ? 2 + 7 * state.fed[n - 1] : 1
    fillRect(
      ctx,
      { x: magnetToothX(parts, n) - wide / 2, y: parts.rail, w: wide, h: long },
      colours.ink,
      n <= top ? INK.text : INK.back,
    )
  }
  const [low, high] = magnetSweepSpan(
    frame.value('harmonic'),
    top,
    frame.value('sweep'),
    state.span,
  )
  if (high - low > 0.02)
    rule(ctx, magnetToothX(parts, low), parts.rail - 2, magnetToothX(parts, high), parts.rail - 2, {
      colour: colours.ink,
      width: 2.5,
      alpha: INK.text,
    })
  // The pointer: the partial the Harmonic knob sets.
  const x = magnetToothX(parts, centre)
  ctx.beginPath()
  ctx.moveTo(x - 3, parts.rail - 5.5)
  ctx.lineTo(x + 3, parts.rail - 5.5)
  ctx.lineTo(x, parts.rail - 0.5)
  ctx.closePath()
  ctx.fillStyle = colours.ink
  ctx.fill()
}

/** Under this share of a full swing a partial's loops are not drawn. */
const MAGNET_SEEN = 0.04

/**
 * The string as the knobs leave it: standing in the loops of the partial the
 * magnets feed most, as far as the hardest key swells it, and fainter in the
 * loops of every other partial they feed, each as far as it stands to the
 * strongest. Inside are the swing a quarter of a second, one and four
 * seconds after the key, so a slow Bloom leaves most of it empty. Dashed,
 * what the hardest strike of the hammer leaves of the note itself.
 */
function magnetString(frame: DisplayFrame<MagnetState>, parts: MagnetParts, hz: number): void {
  const { ctx, colours, state } = frame
  const centre = magnetCentre(frame.value('harmonic'), magnetTop(hz))
  const bloom = frame.value('bloom')
  const hammer = frame.value('hammer')
  const { fed } = state
  magnetStrongest(fed, 0, state.pair)
  const strongest = Math.max(0, state.pair[0])
  ctx.fillStyle = colours.ink
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  magnetLens(frame, parts, strongest + 1, parts.swing)
  ctx.globalAlpha = 0.1
  ctx.fill()
  for (const age of MAGNET_AGES) {
    const swollen = magnetSwell(age, strongest + 1, centre, bloom)
    magnetLens(frame, parts, strongest + 1, parts.swing * swollen)
    ctx.globalAlpha = 0.12
    ctx.fill()
  }
  for (let n = 0; n < MAGNET_PARTIALS; n++) {
    if (fed[n] < MAGNET_SEEN) continue
    const share = fed[n] / fed[strongest]
    magnetLens(frame, parts, n + 1, parts.swing * share)
    ctx.globalAlpha = n === strongest ? 1 : 0.15 + 0.4 * share
    ctx.stroke()
  }
  if (hammer > 0) {
    magnetLens(frame, parts, 1, parts.swing * magnetBlow(hammer, 1, hz, 1))
    ctx.globalAlpha = INK.text
    ctx.setLineDash([2, 2])
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.globalAlpha = 1
}

/** How long the felt is shown against the string after a strike. */
const MAGNET_STRIKE_SHOWN = 0.14

/**
 * What stands round the string: its two bridges, the three strings of the
 * note running on to their pins, the felt hammer underneath and the damper
 * overhead. `struck` is the seconds since the newest key was struck (negative
 * for none), `damped` whether the newest key that sounds has been let go.
 */
function magnetFittings(
  frame: DisplayFrame<MagnetState>,
  parts: MagnetParts,
  struck: number,
  damped: boolean,
): void {
  const { ctx, colours } = frame
  const { x, w, y } = parts
  const end = x + w
  rule(ctx, x, y, end, y, { colour: colours.ink, alpha: INK.rule })
  for (const bridge of [x, end])
    rule(ctx, bridge, y - 4, bridge, y + 4, { colour: colours.ink, width: 2 })

  // The three strings: the flat one a little longer and to one side, the sharp one shorter and
  // to the other. Shimmer tunes them apart and Width sets them apart.
  const shimmer = clamp(frame.value('shimmer'), 0, 1)
  const apart = 8 * clamp(frame.value('width'), 0, 1)
  const pins: readonly [number, number, number][] = [
    [end + 11 + 4.4 * shimmer, y - apart, INK.back],
    [end + 11 - 3.6 * shimmer, y + apart, INK.back],
    [end + 11, y, 1],
  ]
  for (const [px, py, alpha] of pins) {
    rule(ctx, end, y, px, py, { colour: colours.ink, alpha })
    dot(ctx, px, py, 1.3, colours.ink)
  }

  // The hammer: a head of felt as large as Hammer, an eighth of the way along. At zero there is none.
  const hammer = clamp(frame.value('hammer'), 0, 1)
  if (hammer > 0) {
    const hx = x + w / 8
    const high = 3 + 4 * hammer
    const strikes = struck >= 0 && struck < MAGNET_STRIKE_SHOWN
    // At rest it hangs under the string; a strike throws it up against it for a moment.
    const head = strikes ? y + 1 : y + 5
    const colour = strikes ? colours.accent : colours.ink
    rule(ctx, hx, head + high, hx, parts.board.y, { colour, alpha: INK.text })
    ctx.beginPath()
    ctx.moveTo(hx - 3.5, head + high)
    ctx.lineTo(hx - 3.5, head + 1.5)
    ctx.quadraticCurveTo(hx, head - 1.5, hx + 3.5, head + 1.5)
    ctx.lineTo(hx + 3.5, head + high)
    ctx.closePath()
    ctx.globalAlpha = strikes ? 1 - 0.6 * (struck / MAGNET_STRIKE_SHOWN) : INK.text
    ctx.fillStyle = colour
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // The damper: held the higher over the string the longer Damper lets a note ring, and down
  // on it while the newest key that sounds has been let go.
  const dx = x + (7 / 8) * w
  const lift = damped ? 0 : 2 + 10 * frame.at('damper')
  const colour = damped ? colours.accent : colours.ink
  rule(ctx, dx, parts.rail, dx, y - 5 - lift, { colour, alpha: INK.back })
  fillRect(ctx, { x: dx - 3.5, y: y - 5 - lift, w: 7, h: 4 }, colour, damped ? 1 : INK.text)
}

/**
 * Sweep takes the magnets of every key along a path of its own, drawn from a
 * seed no display can know. Where they stand is read from the sound instead:
 * how strongly each partial the magnets can feed comes out, with the
 * soundboard's share taken off, brought to one power as the device holds the
 * bell. False while there is no sound to read.
 */
function magnetHeardMix(
  signal: DisplaySignal | null,
  hz: number,
  top: number,
  body: number,
  into: Float32Array,
): boolean {
  const bins = signal?.spectrum
  const binHz = signal?.binHz ?? 0
  if (!bins || binHz <= 0) return false
  let power = 0
  into.fill(0)
  for (let n = 1; n <= top; n++) {
    const partial = magnetPartialHz(hz, n)
    const db = partialDb(bins, binHz, partial, hz)
    if (!Number.isFinite(db)) continue
    into[n - 1] = Math.pow(10, db / 20) / magnetBoard(partial, body)
    power += into[n - 1] * into[n - 1]
  }
  if (!(power > 1e-16)) return false
  const even = 1 / Math.sqrt(power)
  for (let n = 0; n < top; n++) into[n] *= even
  return true
}

/** `MagnetPiano::begin`: a key at the pitch of one let go before it began takes that one's strings over, and the older note ends. */
export function magnetTakenOver(notes: readonly DisplayNote[], index: number): boolean {
  const note = notes[index]
  if (note.released === null) return false
  for (let later = index + 1; later < notes.length; later++)
    if (notes[later].frequency === note.frequency && note.released >= notes[later].age) return true
  return false
}

/** Above this many beats a second the frames cannot show a partial's beating: it is drawn at its mean size. */
const MAGNET_BEAT_SEEN_HZ = 6

/**
 * The keys that sound, the newest first, and the size of every partial of
 * each as the device works it out: what the magnets have swollen, what the
 * hammer left, what it takes up from the other keys, under the damper, as
 * the three strings beat. How many keys there are comes back.
 */
function magnetSounding(frame: DisplayFrame<MagnetState>): number {
  const { notes, state } = frame
  const { levels, drives, places, index, mix } = state
  const bloom = frame.value('bloom')
  const damper = frame.value('damper')
  const hammer = frame.value('hammer')
  const sweep = frame.value('sweep')
  const reach = magnetReach(frame.value('bright'))
  const body = frame.value('body')
  let count = 0
  for (let i = notes.length - 1; i >= 0 && count < MAGNET_VOICES; i--) {
    const note = notes[i]
    // The damper takes 60 dB off in its time: after that the note is over.
    if (note.released !== null && note.released >= damper) continue
    if (magnetTakenOver(notes, i)) continue
    const hz = note.frequency
    const top = magnetTop(hz)
    const partials = magnetCount(hz, frame.sampleRate)
    const centre = magnetCentre(frame.value('harmonic'), top)
    if (!(sweep > 0 && magnetHeardMix(frame.signal, hz, top, body, mix)))
      magnetFed(centre, reach, partials, mix)
    magnetSwollen(notes, i, centre, bloom, damper, state.swollen)
    const damp = magnetDamp(note.released, damper)
    const velocity = magnetVelocity(note.gain)
    for (let n = 1; n <= MAGNET_PARTIALS; n++) {
      const at = count * MAGNET_PARTIALS + n - 1
      const swollen = velocity * mix[n - 1] * state.swollen[n - 1]
      const struck = n <= partials ? magnetStruck(hammer, note.gain, hz, n, note.age) : 0
      drives[at] = damp * (swollen + struck)
      places[at] = magnetBusPlace(magnetPartialHz(hz, n))
    }
    index[count++] = i
  }

  // What each string takes up from the others, and the three strings' beating over all of it.
  const sympathy = MAGNET_RING_SHARE * clamp(frame.value('sympathy'), 0, 1)
  const shimmer = frame.value('shimmer')
  const width = frame.value('width')
  const mean = magnetStringsMean(width)
  for (let v = 0; v < count; v++) {
    const note = notes[index[v]]
    const damp = magnetDamp(note.released, damper)
    for (let n = 0; n < MAGNET_PARTIALS; n++) {
      const at = v * MAGNET_PARTIALS + n
      let others = 0
      for (let u = 0; sympathy > 0 && u < count; u++) {
        if (u === v) continue
        // `kRingRiseSeconds`: it comes up in a fraction of a second after the two sound together.
        const together = Math.min(note.age, notes[index[u]].age)
        const risen = 1 - Math.exp(-together / MAGNET_RING_RISE)
        for (let m = 0; m < MAGNET_PARTIALS; m++) {
          const theirs = u * MAGNET_PARTIALS + m
          if (drives[theirs] > 0)
            others += risen * drives[theirs] * magnetHeard(places[at], places[theirs])
        }
      }
      const beat = magnetBeatHz(note.frequency, n + 1, shimmer)
      const strings = beat > MAGNET_BEAT_SEEN_HZ ? mean : magnetStrings(beat * note.age, width)
      levels[at] = (drives[at] + damp * sympathy * others) * strings
    }
  }
  return count
}

/** The least a string that sounds is drawn to swing, in px: a note the damper has all but stopped is still seen. */
const MAGNET_LEAST_SWING = 0.9
/** A second partial is drawn beside the strongest from this share of it up: the magnets stand between the two. */
const MAGNET_SECOND = 0.7

/**
 * The keys that sound, the oldest first so the newest lies on top: each as
 * its string stands, in the loops of its strongest partial as far as the
 * whole string swings (and of the next where the two are near equal), and
 * all its partials as pitches on the board.
 */
function magnetPlayed(frame: DisplayFrame<MagnetState>, parts: MagnetParts, count: number): void {
  const { ctx, colours, state, notes } = frame
  const { board } = parts
  const body = frame.value('body')
  const floor = board.y + board.h
  for (let v = count - 1; v >= 0; v--) {
    const note = notes[state.index[v]]
    const at = v * MAGNET_PARTIALS
    magnetStrongest(state.levels, at, state.pair)
    const [first, second] = state.pair
    if (first < 0) continue
    // What it takes up from the other keys glows inside it.
    let own = 0
    let whole = 0
    for (let n = 0; n < MAGNET_PARTIALS; n++) {
      own += state.drives[at + n] * state.drives[at + n]
      whole += state.levels[at + n] * state.levels[at + n]
    }
    const most = state.levels[at + first]
    const swing = Math.max(parts.swing * Math.min(1, Math.sqrt(whole)), MAGNET_LEAST_SWING)
    magnetLens(frame, parts, first + 1, swing)
    ctx.globalAlpha = 0.1 + 0.5 * clamp(1 - own / Math.max(whole, 1e-12), 0, 1)
    ctx.fillStyle = colours.accent
    ctx.fill()
    // The newest key is drawn strongest, so it is told from the ones that ring on under it.
    ctx.globalAlpha = v === 0 ? 1 : 0.8
    ctx.strokeStyle = colours.accent
    ctx.lineWidth = v === 0 ? 1.75 : 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    if (second >= 0 && state.levels[at + second] >= MAGNET_SECOND * most) {
      magnetLens(frame, parts, second + 1, (swing * state.levels[at + second]) / most)
      ctx.lineWidth = 1
      ctx.stroke()
    }
    // The pitches that sound of it, on the soundboard.
    for (let n = 1; n <= MAGNET_PARTIALS; n++) {
      const level = state.levels[at + n - 1]
      if (level < MAGNET_FAINT) continue
      const partial = magnetPartialHz(note.frequency, n)
      const x = xOfPitch(partial, board, MAGNET_BOARD_LOW_HZ, MAGNET_BOARD_HIGH_HZ)
      rule(ctx, x, floor - magnetBoardThick(partial, body) - 3, x, floor, {
        colour: colours.accent,
        width: 1.5,
        alpha: clamp(Math.sqrt(level), 0.3, 1),
      })
    }
  }
}

/** The magnets at work on the newest key: each tooth lit as far as the magnets have brought its partial. */
function magnetTeeth(
  frame: DisplayFrame<MagnetState>,
  parts: MagnetParts,
  note: DisplayNote,
): void {
  const { ctx, colours, state } = frame
  const top = magnetTop(note.frequency)
  const damp = magnetDamp(note.released, frame.value('damper'))
  const wide = parts.w >= 150 ? 5 : 4
  // `state.drives` holds the newest key first; without the strike, what is left is the magnets' own.
  for (let n = 1; n <= top; n++) {
    const struck = magnetStruck(frame.value('hammer'), note.gain, note.frequency, n, note.age)
    const fed = (state.drives[n - 1] - damp * struck) / magnetVelocity(note.gain)
    const long = 7 * clamp(fed, 0, 1)
    if (long < 0.3) continue
    fillRect(
      ctx,
      { x: magnetToothX(parts, n) - wide / 2, y: parts.rail + 2, w: wide, h: long },
      colours.accent,
    )
  }
}

const magnetPiano = plateDisplay<MagnetState>({
  place: 'window',
  columns: 2,
  params: [
    'bloom',
    'harmonic',
    'bright',
    'hammer',
    'shimmer',
    'sweep',
    'sweepRate',
    'sympathy',
    'damper',
    'body',
    'width',
  ],
  live: { signal: true, notes: true, spectrum: true },
  info: 'One string from the side, standing in the loops the magnets on the rail feed; the shades inside are its swing a quarter of a second, one and four seconds after a key. A key that sounds swells in the accent and marks its pitches on the soundboard underneath.',
  init: () => ({
    loops: new Float32Array(0),
    points: 0,
    fed: new Float32Array(MAGNET_PARTIALS),
    mix: new Float32Array(MAGNET_PARTIALS),
    swollen: new Float32Array(MAGNET_PARTIALS),
    levels: new Float32Array(MAGNET_VOICES * MAGNET_PARTIALS),
    drives: new Float32Array(MAGNET_VOICES * MAGNET_PARTIALS),
    places: new Float32Array(MAGNET_VOICES * MAGNET_PARTIALS),
    index: new Int16Array(MAGNET_VOICES),
    span: [1, 1],
    pair: [-1, -1],
  }),
  draw(frame) {
    const { ctx, state } = frame
    ground(frame)
    const parts = magnetParts(frame)
    magnetLoops(state, parts.w)
    const count = magnetSounding(frame)
    const said = count > 0 ? frame.notes[state.index[0]] : null
    // The string at rest is the newest key's, or the A under middle C while none sounds.
    const hz = said ? said.frequency : MAGNET_REST_HZ
    const top = magnetTop(hz)
    const centre = magnetCentre(frame.value('harmonic'), top)
    magnetFed(
      centre,
      magnetReach(frame.value('bright')),
      magnetCount(hz, frame.sampleRate),
      state.fed,
    )

    magnetSoundboard(frame, parts, hz)
    magnetRail(frame, parts, hz)
    magnetString(frame, parts, hz)
    magnetPlayed(frame, parts, count)
    if (said) magnetTeeth(frame, parts, said)
    const struck = said && frame.value('hammer') > 0 ? said.age : -1
    magnetFittings(frame, parts, struck, said !== null && said.released !== null)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the partial the magnets feed (and how far and how fast Sweep takes them),
    // and the newest key with the time it takes to swell.
    const harmonic = `${Number(centre.toFixed(1))}`
    const sweep = frame.value('sweep')
    const rate = frame.value('sweepRate')
    const left =
      sweep > 0
        ? `${harmonic} ±${(MAGNET_SWEEP_SPAN * sweep).toFixed(1)} at ${rate.toFixed(rate < 1 ? 2 : 1)} Hz`
        : `Harmonic ${harmonic}`
    const bloom = secondsText(frame.value('bloom'))
    const right = `${pitchName(hz)} ${bloom}`
    text(frame, left, 5, 10)
    // On the narrow plate the two do not both fit beside a long Sweep: the key gives way.
    ctx.font = `8px ${frame.fontFamily}`
    const room = frame.width - 16 - ctx.measureText(left).width
    text(frame, ctx.measureText(right).width <= room ? right : bloom, frame.width - 5, 10, {
      align: 'right',
    })
  },
})

// --- Prepared Piano ----------------------------------------------------------

const PREP_NAMES = ['Mixed', 'Bolts', 'Rubber', 'Felt', 'Paper'] as const
const PREP_ONE = ['', 'Bolt', 'Rubber', 'Felt', 'Paper'] as const
const PREP_BOLT = 1
const PREP_RUBBER = 2
const PREP_FELT = 3
const PREP_PAPER = 4

/**
 * `prepared_piano.h`, `object`: what each object does to the strings at
 * Amount 1. `load` is its mass on the prepared string, `moving` and `still`
 * the seconds a partial rings that moves or is still where it sits, `reach`
 * how much of that damping the free string gets, `under` the free string's
 * level under the prepared one, `soften` how much longer the hammer's
 * contact gets, `buzz` and `rattle` the buzz from Amount alone and what the
 * Rattle knob adds. The first row is Mixed, which is never an object.
 */
const PREP_OBJECTS = [
  { load: 0, moving: 4, still: 4, reach: 0, under: 1, soften: 0, buzz: 0, rattle: 0 },
  { load: 0.6, moving: 10, still: 20, reach: 0, under: 0.3, soften: 0, buzz: 0, rattle: 1 },
  { load: 0.04, moving: 0.1, still: 0.4, reach: 1, under: 1, soften: 0.3, buzz: 0, rattle: 0.15 },
  { load: 0, moving: 0.9, still: 2.2, reach: 1, under: 1, soften: 3, buzz: 0, rattle: 0.12 },
  { load: 0, moving: 3, still: 9, reach: 1, under: 1, soften: 0, buzz: 0.6, rattle: 0.4 },
] as const

/** `prepared_piano.h`, `mixed`: the object on each of nineteen keys, its share of Amount and how far from Position it sits. */
const PREP_MIXED: readonly (readonly [number, number, number])[] = [
  [PREP_BOLT, 1, 0],
  [PREP_RUBBER, 0.9, 0.06],
  [PREP_PAPER, 0.8, -0.04],
  [PREP_BOLT, 0.6, 0.1],
  [PREP_FELT, 0.9, 0],
  [PREP_RUBBER, 1, -0.06],
  [PREP_BOLT, 0.85, -0.08],
  [PREP_PAPER, 1, 0.05],
  [PREP_FELT, 1, 0.12],
  [PREP_BOLT, 0.45, 0.04],
  [PREP_RUBBER, 0.7, 0.14],
  [PREP_BOLT, 1, 0.13],
  [PREP_PAPER, 0.6, 0.1],
  [PREP_FELT, 1, -0.05],
  [PREP_BOLT, 0.75, -0.12],
  [PREP_RUBBER, 0.85, 0],
  [PREP_BOLT, 0.55, 0.08],
  [PREP_FELT, 0.9, 0.06],
  [PREP_RUBBER, 0.6, -0.1],
]
const PREP_ROWS = PREP_MIXED.length
/** `prepared_piano.h`, `kC4`, `kReleaseSeconds`, `kReleasePower`, `kChokeSeconds`, `kFree`, `kSide`, `kGap`, `kGapClose`. */
const PREP_C4 = 261.6256
const PREP_RELEASE_SECONDS = 0.7
const PREP_RELEASE_POWER = 1.5
const PREP_CHOKE_SECONDS = 0.1
const PREP_FREE_PARTIALS = 24
const PREP_SWING_PARTIALS = 4
const PREP_GAP = 0.35
const PREP_GAP_CLOSE = 0.8
/** `prepared_piano.h`, `kLoadedLevel`: the prepared string against the free one. */
const PREP_LOADED_LEVEL = 0.7

/** `PreparedPiano::key_of`: the key a frequency belongs to, 0 to 127. */
export function prepKey(hz: number): number {
  return clamp(Math.floor(69 + 12 * Math.log2(Math.max(hz, 1e-3) / 440) + 0.5), 0, 127)
}

/** The row of the Mixed table a key reads: the table comes round every nineteen keys. */
export const prepRow = (key: number): number => ((key % PREP_ROWS) + PREP_ROWS) % PREP_ROWS

/** What lies on the strings of a key: which object, how far it bites and where it sits. */
export interface PrepPlaced {
  kind: number
  amount: number
  position: number
}

/**
 * `PreparedPiano::start`: the object on a key, written into `into`. Under
 * Mixed the table gives the key its own object, its share of Amount and its
 * place near Position.
 */
export function prepPlaced(
  key: number,
  preparation: number,
  amount: number,
  position: number,
  into: PrepPlaced = { kind: 0, amount: 0, position: 0 },
): PrepPlaced {
  into.kind = clamp(Math.round(preparation), 0, PREP_OBJECTS.length - 1)
  into.amount = amount
  into.position = position
  if (into.kind === 0) {
    const [kind, share, offset] = PREP_MIXED[prepRow(key)]
    into.kind = kind
    into.amount = amount * share
    into.position = clamp(position + offset, 0.04, 0.5)
  }
  return into
}

/** `PreparedPiano::start`, `ring`: seconds the fundamental of the bare string on a key rings at Decay 1: 7 at middle C, 4.5 % less with every key up. */
export function prepRingSeconds(key: number): number {
  return clamp(7 * Math.exp(-0.045 * (key - 60)), 0.5, 16)
}

/** `PreparedPiano::moves`: how much partial `n` moves where the object sits, 1 at an antinode and 0 at a node. */
export function prepMoves(n: number, position: number): number {
  const s = Math.sin(Math.PI * n * position)
  return s * s
}

/**
 * `PreparedPiano::start` and `ring_out`: seconds partial `n` of one of a
 * key's two strings (0 the free one, 1 the prepared one) takes to fall
 * 60 dB. The bare string's own time, shortened by the object as far as the
 * partial moves where it sits, and no longer than the damper leaves a key
 * let go (`state` 1) or the hammer leaves one struck again (`state` 2).
 */
export function prepPartialSeconds(
  n: number,
  string: number,
  key: number,
  placed: PrepPlaced,
  decay: number,
  state = 0,
): number {
  const object = PREP_OBJECTS[placed.kind]
  const bare = Math.pow(n, 0.9) / (prepRingSeconds(key) * decay)
  const seconds = lerp(object.still, object.moving, prepMoves(n, placed.position))
  const laid = ((string === 0 ? object.reach : 1) * placed.amount * placed.amount) / seconds
  let rate = bare + laid
  if (state === 2) rate = Math.max(rate, 1 / PREP_CHOKE_SECONDS)
  else if (state === 1)
    rate = Math.max(rate, 1 / (PREP_RELEASE_SECONDS * Math.pow(decay, PREP_RELEASE_POWER)))
  return 1 / rate
}

/** `PreparedPiano::strength`: how hard a key played at `gain` strikes, 1 at the hardest. */
export function prepStrength(gain: number): number {
  const hard = clamp(gain, 0, 1)
  return hard * (0.3 + 0.7 * hard)
}

/** `PreparedPiano::start`, `level`: the free string's share of the strike; the prepared one has the rest. */
export function prepFreeShare(placed: PrepPlaced): number {
  const free = lerp(1, PREP_OBJECTS[placed.kind].under, placed.amount)
  return free / (free + PREP_LOADED_LEVEL)
}

/** `PreparedPiano::tune`: the hertz the two strings of a note beat at, 14 cents apart at Detune 1. */
export function prepBeatHz(hz: number, detune: number): number {
  const cents = 14 * detune * detune
  return hz * (Math.pow(2, cents / 2400) - Math.pow(2, -cents / 2400))
}

/** `PreparedPiano::stiffness`: how stiff the string on a key is: nearly level through the bass, rising with every key above middle C. */
export function prepStiffness(key: number): number {
  if (key >= 60) return 3.1e-4 * Math.exp(0.075 * (key - 60))
  return Math.max(2e-4, 2.6e-4 + (0.5e-4 * (key - 21)) / 39)
}

/** `PreparedPiano::stretched`: partial `n` of the bare string as a multiple of its fundamental. */
export function prepStretched(n: number, b: number): number {
  return n * Math.sqrt((1 + b * n * n) / (1 + b))
}

/** `PreparedPiano::start`, `corner`: the hertz above which the hammer's strike falls away: higher for a harder hammer, a higher key and a harder blow, lower through felt and rubber. */
export function prepCornerHz(hz: number, hammer: number, gain: number, placed: PrepPlaced): number {
  const soften = PREP_OBJECTS[placed.kind].soften
  return (
    (2.2 * Math.sqrt(hz * PREP_C4) * Math.pow(12, hammer - 0.5) * (0.5 + gain)) /
    (1 + soften * placed.amount)
  )
}

/** `PreparedPiano::hammer`: how strongly the hammer lights partial `n` at `hz`: 1/sqrt(n), the comb of a strike an eighth of the way along, and the corner. */
export function prepHammer(n: number, hz: number, corner: number): number {
  const comb = 0.35 + 0.65 * Math.abs(Math.sin(Math.PI * n * 0.125))
  const over = hz / corner
  return (Math.pow(n, -0.5) * comb) / (1 + over * over)
}

/** `PreparedPiano::start`, `depth`: how loose the object lies, 0 to 1: what Amount gives it and what Rattle adds. */
export function prepBuzzDepth(placed: PrepPlaced, rattle: number): number {
  const object = PREP_OBJECTS[placed.kind]
  return clamp(Math.sqrt(placed.amount) * (object.buzz + object.rattle * rattle), 0, 1)
}

/** `PreparedPiano::control` and `render_voice`: the gap to an object as loose as `depth`, as a share of a full strike. */
export function prepGap(depth: number): number {
  return PREP_GAP * (1 - PREP_GAP_CLOSE * depth)
}

/**
 * `PreparedPiano::control`, `reach`: how far the strings of a key can swing
 * `age` seconds after the hammer, as a share of a full strike: the first
 * four partials of both strings laid end to end, each as the hammer lit it
 * and as far as it has died. The object buzzes while this is wider than the
 * gap to it. `released` is the seconds since the key went up, null while it
 * is held.
 */
export function prepSwing(
  hz: number,
  gain: number,
  hammer: number,
  placed: PrepPlaced,
  decay: number,
  age: number,
  released: number | null,
  sampleRate = 48000,
): number {
  const key = prepKey(hz)
  const b = prepStiffness(key)
  const corner = prepCornerHz(hz, hammer, gain, placed)
  const top = Math.min(16000, 0.45 * sampleRate)
  // The whole strike is brought to one power: a harder hammer is brighter, not louder.
  let power = 0
  for (let n = 1; n <= PREP_FREE_PARTIALS; n++) {
    const partial = hz * prepStretched(n, b)
    if (partial < top) power += prepHammer(n, partial, corner) ** 2
  }
  if (!(power > 0)) return 0
  const free = prepFreeShare(placed)
  const after = released === null ? 0 : Math.min(released, age)
  const held = age - after
  let swing = 0
  for (let n = 1; n <= PREP_SWING_PARTIALS; n++) {
    const partial = hz * prepStretched(n, b)
    if (partial >= top) continue
    const lit = prepHammer(n, partial, corner) / Math.sqrt(power)
    for (let string = 0; string < 2; string++) {
      const fall =
        held / prepPartialSeconds(n, string, key, placed, decay) +
        after / prepPartialSeconds(n, string, key, placed, decay, 1)
      swing += (string === 0 ? free : 1 - free) * lit * Math.pow(10, -3 * fall)
    }
  }
  return prepStrength(gain) * swing
}

/**
 * How far one string of a key has fallen, in dB under the hardest strike:
 * struck `age` seconds ago as hard as `gain`, its key let go `released`
 * seconds ago (null while held). It rings `ring` seconds while the key is
 * down and `damped` from then on.
 */
export function prepStringDb(
  age: number,
  gain: number,
  released: number | null,
  ring: number,
  damped: number,
): number {
  const after = released === null ? 0 : Math.min(released, age)
  return gainToDb(prepStrength(gain)) - 60 * ((age - after) / ring + after / damped)
}

/** `prepared_piano.h`, `kToneLowHz`, `kToneHighHz`, `kStageCentre`, `kStageSpan`, `kStageEdge`. */
const PREP_TONE_LOW_HZ = 500
const PREP_TONE_HIGH_HZ = 18000
const PREP_STAGE_CENTRE = 60
const PREP_STAGE_SPAN = 36
const PREP_STAGE_EDGE = 0.55

/** `PreparedPiano::set_tone`: the corner of the low-pass over the whole instrument: 500 Hz at Tone 0, 18 kHz at Tone 1. */
export function prepToneHz(tone: number): number {
  return PREP_TONE_LOW_HZ * Math.pow(PREP_TONE_HIGH_HZ / PREP_TONE_LOW_HZ, clamp(tone, 0, 1))
}

/** The same filter at a frequency, in dB: two poles without a peak, so 3 dB down on the corner and 12 dB an octave above it. */
export function prepToneDb(hz: number, tone: number): number {
  const over = hz / prepToneHz(tone)
  return -10 * Math.log10(1 + over * over * over * over)
}

/**
 * `PreparedPiano::start`, `place`, and `stage`: where a key stands between
 * the speakers, −1 the left one and 1 the right. Middle C is in the middle
 * and the keys three octaves either way stand 0.55 of the way out at Width 1.
 */
export function prepPlace(hz: number, width: number): number {
  const key = 69 + 12 * Math.log2(Math.max(hz, 1e-3) / 440)
  return (
    clamp((key - PREP_STAGE_CENTRE) / PREP_STAGE_SPAN, -1, 1) * PREP_STAGE_EDGE * clamp(width, 0, 1)
  )
}

/** The keys whose strings are shown: the A under middle C and the eighteen above it, one round of the Mixed table. */
const PREP_FIRST_KEY = 57
/** The key the words speak of while none is played: middle C. */
const PREP_REST_KEY = 60
/** The seconds a string's height spans, foot to far end, on a scale of ratios. */
const PREP_SHORT_SEC = 0.1
const PREP_LONG_SEC = 40
/** `prepared_piano.h`, `kHammerPoint`: the hammer meets the string an eighth of the way along. */
const PREP_HAMMER_POINT = 0.125
/** Under this share of its light a string is done; `kMaxVoices` keys sound at once. */
const PREP_DONE = 0.02
const PREP_VOICES = 12
/** How long the hammer and the knock of the frame are shown after a strike. */
const PREP_STRIKE_SHOWN = 0.12

interface PrepParts {
  /** The strings from above: their far ends at `y`, the hammers' end at `y + h`, nineteen courses across `w`. */
  bed: Box
  /** The width of one course. */
  pitch: number
  foot: Box
}

function prepParts(view: Size): PrepParts {
  const foot: Box = { x: 4, y: view.height - 10, w: view.width - 8, h: 6 }
  // The scale of seconds is said in the margin at the right.
  const bed: Box = { x: 6, y: 14, w: Math.max(38, view.width - 28), h: foot.y - 24 }
  return { bed, pitch: bed.w / PREP_ROWS, foot }
}

/** Where a time stands up a string: a tenth of a second at the foot, forty at the far end. */
const prepY = (seconds: number, bed: Box): number =>
  bed.y +
  bed.h *
    (1 -
      clamp(
        Math.log(Math.max(seconds, 1e-6) / PREP_SHORT_SEC) /
          Math.log(PREP_LONG_SEC / PREP_SHORT_SEC),
        0,
        1,
      ))

/** The pitches Tone's curve is drawn across, and the dB from its top to its foot. */
const PREP_CURVE_LOW_HZ = 250
const PREP_CURVE_HIGH_HZ = 20000
const PREP_CURVE_DB = 24

/**
 * The margin under the scale's "1 s": Tone's curve in its upper 9 px and the
 * stage along its foot. Null where a display is too small to have one.
 */
function prepMargin(view: Size, parts: PrepParts): Box | null {
  const { bed } = parts
  const x = bed.x + bed.w + 4
  const box: Box = { x, y: bed.y + bed.h - 17, w: view.width - 5 - x, h: 15 }
  return box.w >= 10 && box.y >= prepY(1, bed) + 5 ? box : null
}

/** Where a place between the speakers stands along the stage: its two ends are as far out as the outermost keys get at Width 1. */
const prepStageX = (place: number, margin: Box): number =>
  margin.x + (margin.w / 2) * (1 + place / PREP_STAGE_EDGE)

/**
 * What is done to the whole instrument after the strings, in the margin:
 * the low-pass of Tone as its curve, flat as far as its corner, and the
 * stage, a bar as wide as Width spreads the keyboard between the speakers
 * (a point when it is mono).
 */
function prepAfter(frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'value'>, margin: Box): void {
  const { ctx, colours } = frame
  const tone = frame.value('tone')
  ctx.beginPath()
  for (let x = 0; x <= margin.w; x++) {
    const hz = PREP_CURVE_LOW_HZ * Math.pow(PREP_CURVE_HIGH_HZ / PREP_CURVE_LOW_HZ, x / margin.w)
    const y = margin.y + 9 * clamp(-prepToneDb(hz, tone) / PREP_CURVE_DB, 0, 1)
    if (x === 0) ctx.moveTo(margin.x, y)
    else ctx.lineTo(margin.x + x, y)
  }
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
  const y = margin.y + margin.h
  const reach = PREP_STAGE_EDGE * clamp(frame.value('width'), 0, 1)
  rule(ctx, margin.x, y, margin.x + margin.w, y, { colour: colours.ink, alpha: INK.back })
  rule(ctx, prepStageX(-reach, margin), y, prepStageX(reach, margin), y, {
    colour: colours.ink,
    width: 2.5,
    alpha: INK.text,
  })
  dot(ctx, prepStageX(0, margin), y, 1.25, colours.ink)
}

/** The middle of the course a key plays: keys beyond the nineteen shown play the course that carries their object. */
const prepCourseX = (key: number, parts: PrepParts): number =>
  parts.bed.x + (prepRow(key - PREP_FIRST_KEY) + 0.5) * parts.pitch

/** How far apart the two strings of a course are drawn: further the further Detune tunes them. */
const prepApart = (detune: number, pitch: number): number =>
  lerp(Math.min(1.5, pitch - 3), clamp(pitch - 3.5, 1.5, 5), clamp(detune, 0, 1))

/**
 * An object as what it is, seen from above: a bolt is a round head with its
 * slot, rubber a wedge driven between the strings, felt a soft strip woven
 * across them, paper a slip lying on them. `amount` is how far it bites, and
 * so how large it is; `half` is half its width where it lies across (a
 * course, or the whole bed when every key has the same).
 */
function prepGlyph(
  frame: Pick<DisplayFrame, 'ctx' | 'colours'>,
  kind: number,
  x: number,
  y: number,
  amount: number,
  pitch: number,
  half: number,
  colour: string,
  strength: number,
): void {
  const { ctx, colours } = frame
  const most = clamp(pitch / 2 - 0.8, 1.2, 3.6)
  ctx.globalAlpha = strength
  ctx.fillStyle = colour
  ctx.strokeStyle = colour
  ctx.lineWidth = 1
  if (kind === PREP_BOLT) {
    const radius = lerp(1.2, most, amount)
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, TAU)
    ctx.fill()
    if (radius >= 2.4 && strength >= 0.9)
      rule(ctx, x - radius + 0.8, y, x + radius - 0.8, y, { colour: colours.plate })
  } else if (kind === PREP_RUBBER) {
    const wide = lerp(1.2, most, amount)
    const high = 3 + 5 * amount
    ctx.beginPath()
    ctx.moveTo(x - wide, y - high / 2)
    ctx.lineTo(x + wide, y - high / 2)
    ctx.lineTo(x, y + high / 2)
    ctx.closePath()
    ctx.fill()
  } else if (kind === PREP_FELT) {
    const high = 2 + 4 * amount
    ctx.globalAlpha = strength * 0.6
    ctx.fillRect(x - half, y - high / 2, 2 * half, high)
  } else {
    const high = 3 + 6 * amount
    // The slip hides the strings it lies on.
    ctx.fillStyle = colours.plate
    ctx.globalAlpha = strength * 0.75
    ctx.fillRect(x - half, y - high / 2, 2 * half, high)
    ctx.globalAlpha = strength
    ctx.strokeRect(x - half + 0.5, y - high / 2 + 0.5, 2 * half - 1, high - 1)
  }
  ctx.globalAlpha = 1
}

/** An object and how loose it lies: a fainter one either way it can shake, further the looser. */
function prepObjectAt(
  frame: Pick<DisplayFrame, 'ctx' | 'colours'>,
  placed: PrepPlaced,
  x: number,
  y: number,
  pitch: number,
  half: number,
  depth: number,
): void {
  const { colours } = frame
  if (placed.amount <= 0) return
  if (depth > 0.05) {
    const far = 0.8 + 2.2 * depth
    // A bolt or a wedge shakes across the strings, a strip along them.
    const across = placed.kind === PREP_BOLT || placed.kind === PREP_RUBBER
    for (const side of [-1, 1])
      prepGlyph(
        frame,
        placed.kind,
        x + (across ? side * far : 0),
        y + (across ? 0 : side * far),
        placed.amount,
        pitch,
        half,
        colours.ink,
        0.3,
      )
  }
  prepGlyph(frame, placed.kind, x, y, placed.amount, pitch, half, colours.ink, 1)
}

interface PrepState {
  placed: PrepPlaced
  /** The keys that sound, the newest first: which of `frame.notes` each is. */
  index: Int16Array
}

/** Where the object of a key lies up its strings. The header places it by a share of the string without saying from which end, and a partial moves alike from either, so it is drawn from the far end, clear of the hammers. */
const prepObjectY = (placed: PrepPlaced, bed: Box): number => bed.y + placed.position * bed.h

/** The bed at rest: every course as long as it rings, the object on each, the hammers, the damper's line and the frame. */
function prepRest(frame: DisplayFrame<PrepState>, parts: PrepParts): void {
  const { ctx, colours, state } = frame
  const { bed, pitch } = parts
  const preparation = frame.value('preparation')
  const amount = frame.value('amount')
  const position = frame.value('position')
  const decay = frame.value('decay')
  const rattle = frame.value('rattle')
  const apart = prepApart(frame.value('detune'), pitch)
  const floor = bed.y + bed.h
  const right = bed.x + bed.w

  // The scale: a second and ten seconds.
  for (const seconds of [1, 10]) {
    const y = prepY(seconds, bed)
    rule(ctx, bed.x, y, right + 2, y, { colour: colours.ink, alpha: INK.grid })
    text(frame, `${seconds} s`, frame.width - 5, y + 3, { align: 'right' })
  }
  rule(ctx, bed.x, bed.y, right, bed.y, { colour: colours.ink, alpha: INK.back })

  // Each course is two strings: faint for their whole length, strong as far up the scale as each rings.
  for (const strong of [false, true]) {
    ctx.beginPath()
    for (let row = 0; row < PREP_ROWS; row++) {
      const key = PREP_FIRST_KEY + row
      const placed = prepPlaced(key, preparation, amount, position, state.placed)
      const x = prepCourseX(key, parts)
      for (let string = 0; string < 2; string++) {
        const at = Math.floor(x + (string - 0.5) * apart) + 0.5
        ctx.moveTo(at, floor)
        ctx.lineTo(
          at,
          strong ? prepY(prepPartialSeconds(1, string, key, placed, decay), bed) : bed.y,
        )
      }
    }
    ctx.globalAlpha = strong ? INK.text : 0.25
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // The damper, half down: no string of a key that has been let go rings on past this line.
  const damped = prepY(PREP_RELEASE_SECONDS * Math.pow(decay, PREP_RELEASE_POWER), bed)
  rule(ctx, bed.x, damped, right, damped, { colour: colours.ink, alpha: INK.text, dash: [2, 2] })

  // The hammers, an eighth of the way along: a soft one is a thick head of felt, a hard one thin.
  const high = lerp(6, 2, clamp(frame.value('hammer'), 0, 1))
  const wide = clamp(pitch - 2.5, 2.5, 6)
  const line = floor - PREP_HAMMER_POINT * bed.h
  for (let row = 0; row < PREP_ROWS; row++)
    fillRect(
      ctx,
      { x: bed.x + (row + 0.5) * pitch - wide / 2, y: line - high / 2, w: wide, h: high },
      colours.ink,
      INK.back,
    )

  // The objects. Where every key has the same strip of felt or paper it is one strip across the bed.
  const kind = clamp(Math.round(preparation), 0, PREP_OBJECTS.length - 1)
  if (kind === PREP_FELT || kind === PREP_PAPER) {
    const placed = prepPlaced(PREP_REST_KEY, kind, amount, position, state.placed)
    const depth = prepBuzzDepth(placed, rattle)
    prepObjectAt(
      frame,
      placed,
      bed.x + bed.w / 2,
      prepObjectY(placed, bed),
      pitch,
      bed.w / 2,
      depth,
    )
  } else {
    for (let row = 0; row < PREP_ROWS; row++) {
      const key = PREP_FIRST_KEY + row
      const placed = prepPlaced(key, preparation, amount, position, state.placed)
      const depth = prepBuzzDepth(placed, rattle)
      prepObjectAt(
        frame,
        placed,
        prepCourseX(key, parts),
        prepObjectY(placed, bed),
        pitch,
        pitch / 2,
        depth,
      )
    }
  }

  // The frame the keys knock on: as thick as Thud.
  fillRect(
    ctx,
    { x: bed.x - 2, y: floor, w: bed.w + 4, h: 1.5 + 4 * clamp(frame.value('thud'), 0, 1) },
    colours.ink,
    INK.back,
  )
  const margin = prepMargin(frame, parts)
  if (margin) prepAfter(frame, margin)
}

/** `PreparedPiano::note_on`: a key struck again stops its old note, whatever the two are called: one key is one pair of strings. */
export function prepStruckAgain(notes: readonly DisplayNote[], index: number): boolean {
  const key = prepKey(notes[index].frequency)
  for (let later = index + 1; later < notes.length; later++)
    if (prepKey(notes[later].frequency) === key) return true
  return false
}

/** `PreparedPiano::note_on`: the pitches a key may have. */
const prepHz = (note: DisplayNote): number => clamp(note.frequency, 20, 8000)

/**
 * The keys that sound, each on its own course: both strings lit as far up
 * the scale as each has time left, swelling as the two beat; the hammer and
 * the frame for a moment after the strike; and the object shaking in the
 * accent for as long as the strings swing wider than the gap to it. The
 * newest key that sounds comes back.
 */
function prepPlayed(frame: DisplayFrame<PrepState>, parts: PrepParts): DisplayNote | null {
  const { ctx, colours, state, notes } = frame
  const { bed, pitch } = parts
  const decay = frame.value('decay')
  const detune = frame.value('detune')
  const hammer = clamp(frame.value('hammer'), 0, 1)
  const thud = clamp(frame.value('thud'), 0, 1)
  const apart = prepApart(detune, pitch)
  const floor = bed.y + bed.h
  const uniform = Math.round(frame.value('preparation')) !== 0
  const width = frame.value('width')
  const margin = prepMargin(frame, parts)
  let count = 0
  for (let i = notes.length - 1; i >= 0 && count < PREP_VOICES; i--)
    if (!prepStruckAgain(notes, i)) state.index[count++] = i

  let said: DisplayNote | null = null
  for (let v = count - 1; v >= 0; v--) {
    const note = notes[state.index[v]]
    const hz = prepHz(note)
    const key = prepKey(hz)
    const placed = prepPlaced(
      key,
      frame.value('preparation'),
      frame.value('amount'),
      frame.value('position'),
      state.placed,
    )
    const x = prepCourseX(key, parts)
    // The two beat as far as Detune tunes them apart: their light swells and thins together.
    const beat = 0.5 + 0.5 * Math.cos(TAU * prepBeatHz(hz, detune) * note.age)
    let sounds = false
    for (let string = 0; string < 2; string++) {
      const ring = prepPartialSeconds(1, string, key, placed, decay)
      const damped = prepPartialSeconds(1, string, key, placed, decay, 1)
      const db = prepStringDb(note.age, note.gain, note.released, ring, damped)
      const share = clamp(1 + db / 60, 0, 1)
      if (share < PREP_DONE) continue
      sounds = true
      const left = share * (note.released === null ? ring : damped)
      const at = x + (string - 0.5) * apart
      ctx.beginPath()
      ctx.moveTo(at, floor)
      ctx.lineTo(at, Math.min(floor - 1.5, prepY(left, bed)))
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.2 + beat
      ctx.stroke()
    }
    if (!sounds) continue
    said = note
    // Where the key stands on the stage.
    if (margin)
      dot(ctx, prepStageX(prepPlace(hz, width), margin), margin.y + margin.h, 1.5, colours.accent)

    // The object buzzes while the strings swing past the gap to it.
    const depth = prepBuzzDepth(placed, frame.value('rattle'))
    const swing = prepSwing(hz, note.gain, hammer, placed, decay, note.age, note.released)
    if (placed.amount > 0 && depth > 0 && swing > prepGap(depth)) {
      const shake = (0.6 + 1.6 * depth) * Math.sin(frame.now * TAU * 19 + key)
      const across = placed.kind === PREP_BOLT || placed.kind === PREP_RUBBER
      const strip = uniform && !across
      prepGlyph(
        frame,
        placed.kind,
        (strip ? bed.x + bed.w / 2 : x) + (across ? shake : 0),
        prepObjectY(placed, bed) + (across ? 0 : shake),
        placed.amount,
        pitch,
        strip ? bed.w / 2 : pitch / 2,
        colours.accent,
        1,
      )
    }

    // The hammer and the knock of the frame, for a moment: stronger for a harder key.
    if (note.age < PREP_STRIKE_SHOWN) {
      const fresh = 1 - note.age / PREP_STRIKE_SHOWN
      const high = lerp(6, 2, hammer)
      const wide = clamp(pitch - 2.5, 2.5, 6)
      fillRect(
        ctx,
        { x: x - wide / 2, y: floor - PREP_HAMMER_POINT * bed.h - high / 2, w: wide, h: high },
        colours.accent,
        fresh,
      )
      if (thud > 0)
        fillRect(
          ctx,
          { x: x - pitch / 2, y: floor, w: pitch, h: 1.5 + 4 * thud },
          colours.accent,
          fresh * clamp(0.3 + prepStrength(note.gain), 0, 1),
        )
    }
  }
  return said
}

const preparedPiano = plateDisplay<PrepState>({
  place: 'window',
  columns: 2,
  params: [
    'preparation',
    'amount',
    'position',
    'rattle',
    'hammer',
    'decay',
    'detune',
    'thud',
    'tone',
    'width',
  ],
  live: { signal: true, notes: true },
  info: 'Nineteen keys of strings from above, hammers at the foot, each with its object where Position puts it, as large as Amount. A string is strong as far up the seconds as it rings; the dashed line is the damper. A struck key lights for the time it has left. Beside them, Tone is a curve and Width a bar.',
  init: () => ({
    placed: { kind: 0, amount: 0, position: 0 },
    index: new Int16Array(PREP_VOICES),
  }),
  draw(frame) {
    const { state } = frame
    ground(frame)
    const parts = prepParts(frame)
    prepRest(frame, parts)
    const said = prepPlayed(frame, parts)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: what lies on the strings (under Mixed, on the newest key), and how long that key rings.
    const hz = said ? prepHz(said) : PREP_C4
    const key = prepKey(hz)
    const preparation = clamp(Math.round(frame.value('preparation')), 0, PREP_NAMES.length - 1)
    const placed = prepPlaced(
      key,
      preparation,
      frame.value('amount'),
      frame.value('position'),
      state.placed,
    )
    const mixed = preparation === 0 && said ? `, ${PREP_ONE[placed.kind]}` : ''
    text(frame, `${PREP_NAMES[preparation]}${mixed}`, 5, 10)
    const decay = frame.value('decay')
    const ring = Math.max(
      prepPartialSeconds(1, 0, key, placed, decay),
      prepPartialSeconds(1, 1, key, placed, decay),
    )
    text(frame, `${pitchName(hz)} ${secondsText(ring)}`, frame.width - 5, 10, { align: 'right' })
  },
})

// --- Wind Harp ---------------------------------------------------------------

/** `wind_harp.h`, `kPartials`, `kMaxStrings`, `kMaxVoices`: the harmonics of a string, the strings of a course, the keys that sound at once. */
const WIND_PARTIALS = 16
const WIND_STRINGS = 4
const WIND_VOICES = 12
/** `wind_harp.h`, `kWindOctaves`, `kGustOctaves`, `kLullOctaves`: Wind 0 to 1 in octaves above a string's own note, and how far gusts and lulls move it. */
const WIND_OCTAVES = 3.6
const WIND_GUST_OCTAVES = 2
const WIND_LULL_OCTAVES = 1.2
/** `wind_harp.h`, `kBell`, `kTaper`, `kGlintOctaves`: half the foot of the bell, what still lights above Glint's ceiling, and the ceiling at Glint 1, in octaves. */
const WIND_BELL = 0.75
const WIND_TAPER = 0.5
const WIND_GLINT_OCTAVES = 4
/** `wind_harp.h`, `kHumGain`, `kPluckGain`, `kBandLimit`. */
const WIND_HUM_GAIN = 0.6
const WIND_PLUCK_GAIN = 2
const WIND_BAND_LIMIT = 0.42
/** `wind_harp.h`, `kLullRate`, `kLullShortest`, `kLullSpread`: lulls a second of wind at Lull 1, and how long one lasts. */
const WIND_LULL_RATE = 0.3
const WIND_LULL_SHORTEST = 1
const WIND_LULL_SPREAD = 3.5
/** `wind_harp.h`, `kSwayHz`: the pace of the gusts' three slow sines. */
const WIND_SWAY_HZ = 0.12
/** `wind_harp.h`, `kPan` and `kHear`: where each string of a course of one to four sits between the speakers at full Width, and the octaves by which it hears the wind above or below the others. */
const WIND_PAN = [
  [0, 0, 0, 0],
  [-0.6, 0.6, 0, 0],
  [0, -0.8, 0.8, 0],
  [-0.3, 0.3, -0.9, 0.9],
] as const
const WIND_HEAR = [
  [0, 0, 0, 0],
  [-0.25, 0.25, 0, 0],
  [0, 0.4, -0.4, 0],
  [-0.2, 0.2, 0.55, -0.55],
] as const

/** `WindHarp::string_count`: the strings of a course. */
export const windStrings = (strings: number): number =>
  clamp(Math.floor(strings + 0.5), 1, WIND_STRINGS)

/** `WindHarp::begin`, `lean`: octaves the wind sits higher on a key: half an octave for each octave under the A below middle C, as one wind across long and short strings. */
export function windLean(hz: number): number {
  return clamp(-0.5 * Math.log2(hz / 220), -1.5, 1.5)
}

/** `WindHarp::begin`, `available`: the harmonics of a string that lie in the band. */
export function windAvailable(hz: number, sampleRate = 48000): number {
  return clamp(Math.floor((WIND_BAND_LIMIT * sampleRate) / hz), 1, WIND_PARTIALS)
}

/** `Wind::advance`, `speed`: the octaves above a string's own note at which the wind sheds, from Wind, from where the gusts stand (−1 to 1) and from how far a lull has let it drop (0 to 1). */
export function windSpeed(wind: number, gust = 0, gusts = 0, gap = 0): number {
  return WIND_OCTAVES * wind + WIND_GUST_OCTAVES * gust * gusts - WIND_LULL_OCTAVES * gap
}

/** `WindHarp::steer`, `at`: where the wind's bell stands on one string of a course, in octaves above its note: under Glint's ceiling and the string's last harmonic. */
export function windAt(
  speed: number,
  hz: number,
  strings: number,
  index: number,
  glint: number,
  sampleRate = 48000,
): number {
  const top = Math.log2(windAvailable(hz, sampleRate))
  const heard = speed + windLean(hz) + WIND_HEAR[windStrings(strings) - 1][index]
  return clamp(heard, 0, Math.min(top, WIND_GLINT_OCTAVES * glint))
}

/**
 * `WindHarp::steer`, `weight` and `drive`: what a wind of strength 1 standing
 * at `at` gives each harmonic of a string, written into `into` (the
 * fundamental first). A bell an octave and a half wide at its foot, cut off
 * half an octave above Glint's ceiling, held at one power and tilted so the
 * higher harmonics are softer.
 */
export function windDrive(
  at: number,
  glint: number,
  available: number,
  into: Float32Array | number[],
): void {
  const ceiling = WIND_GLINT_OCTAVES * glint
  let power = 0
  for (let k = 0; k < WIND_PARTIALS; k++) {
    const octave = Math.log2(k + 1)
    const from = (octave - at) / WIND_BELL
    const over = (octave - ceiling) / WIND_TAPER
    let w = 0
    if (k < available && from > -1 && from < 1 && over < 1) {
      w = (1 - from * from) ** 2
      if (over > 0) w *= (1 - over * over) ** 2
    }
    into[k] = w
    power += w * w
  }
  const scale = 1 / Math.sqrt(Math.max(power, 1e-12))
  for (let k = 0; k < WIND_PARTIALS; k++) into[k] *= scale / Math.sqrt(k + 1)
}

/** `WindHarp::control`, `hum_`: the level of a string's own note that is always there. */
export const windHum = (hum: number): number => WIND_HUM_GAIN * hum

/** `WindHarp::control`, `fall_keep_`: seconds harmonic `n` sings on after the wind has moved off it, to 60 dB down. */
export function windRingSeconds(ring: number, n: number): number {
  return ring / (1 + 0.08 * (n - 1))
}

/** `WindHarp::control`, `rise_step_`: the time constant a harmonic wakes with. */
export function windWakeSeconds(ring: number): number {
  return 0.05 + 0.04 * ring
}

/** `Wind::advance`, `until`: seconds the wind blows between two lulls, on average; never at Lull 0. */
export function windBetweenLulls(lull: number): number {
  return lull > 0 ? 1 / (lull * lull * WIND_LULL_RATE) : Infinity
}

/** `WindHarp::begin`, `pluck`, and `init`, `pluck_`: the level Touch gives harmonic `n` when a key goes down. */
export function windPluck(touch: number, gain: number, n: number): number {
  let power = 0
  for (let k = 1; k <= WIND_PARTIALS; k++) power += 1 / (k * k * k)
  return (touch * WIND_PLUCK_GAIN * (0.4 + 0.6 * gain)) / (n * Math.sqrt(n) * Math.sqrt(power))
}

/** `WindHarp::begin`, `gain`: how loud a key played as hard as `gain` is; the softest still sounds. */
export const windKeyLevel = (gain: number): number => 0.2 + 0.8 * clamp(gain, 0, 1)

/**
 * `kit/lfo.h`, `Drift`: the shape of the gusts' three slow sines, `seconds`
 * into a weather that began with them at rest. Each weather draws its own
 * three phases from a seed that counts the phrases since the device was
 * made, which no display can know: this is one such path, to show the pace
 * and the reach of the gusts, and not where the wind is.
 */
export function windSway(seconds: number): number {
  const turns = WIND_SWAY_HZ * seconds
  return (
    0.5 * Math.sin(TAU * turns) +
    0.3 * Math.sin(TAU * (0.33 + 0.618034 * turns)) +
    0.2 * Math.sin(TAU * (0.71 + 1.7320508 * turns))
  )
}

/** The pitches the strings stand across, left to right, and the key the words speak of while none is held. */
const WIND_LOW_HZ = 55
const WIND_HIGH_HZ = 1760
const WIND_REST_HZ = 220
/** The strings that stand at rest, as keys: the E and A of every octave where there is room, the E alone where there is not. */
const WIND_REST_WIDE = [40, 45, 52, 57, 64, 69, 76, 81, 88] as const
const WIND_REST_NARROW = [40, 52, 64, 76, 88] as const
/** The seconds of weather the ribbon of wind shows from the left edge to the right, and where in them its first lull begins. */
const WIND_WINDOW_SEC = 60
const WIND_FIRST_LULL_SEC = 18
/** The octaves a string's height spans: sixteen harmonics. */
const WIND_HIGH_OCTAVES = 4
/** Under this level a harmonic is not marked, and under this share of its light a key is done. */
const WIND_SEEN = 0.08
const WIND_DONE = 0.02
/** How far under the loudest harmonic heard a harmonic is still lit, in dB, and how fast that mark comes down when the sound does, in dB a second. */
const WIND_LIT_DB = 30
const WIND_REF_FALL = 12
/** Under this a harmonic is not heard at all, in dB: what is left in a lull is not lit as if it were the wind. */
const WIND_QUIET_DB = -90
/** A harmonic is heard from this many dB over the air beside it, and, where a key's harmonics lie within one another's reach in the analyser, from this many over what a louder neighbour spills on it. */
const WIND_OVER_AIR_DB = 8
const WIND_OVER_SPILL_DB = 6
/** The level a bin with no sound in it at all is counted at, in dB. */
const WIND_SILENT_DB = -200
/** The stroke of a rung that is reckoned from a steady wind, and of one that is heard. */
const WIND_RECKONED: number[] = [1, 1.5]
const WIND_SOLID: number[] = []

/**
 * How loud harmonic `n` of a key at `hz` is heard in the sound, in dB;
 * −Infinity for one that cannot be told from what lies round it. Air is
 * noise in every bin and a harmonic is a peak, so a harmonic must stand over
 * the bins between it and the next harmonic either way that no harmonic of
 * the key reaches. It is held against the middle one of them by level:
 * another key's harmonic may lie among them, which their mean would count
 * as air, and among many bins of noise there is always a dip, which the
 * quietest of them would be. Under about 70 Hz a key's harmonics stand less
 * than three bins apart and each spills on the next: there one is heard
 * only if it is more than a louder neighbour leaves on its bin.
 */
export function windHeardDb(bins: Float32Array, binHz: number, hz: number, n: number): number {
  const db = partialDb(bins, binHz, n * hz, hz)
  if (db === -Infinity) return db
  const apart = hz / binHz
  if (apart < LOBE_BINS) {
    const above = Math.round((n + 1) * apart)
    const beside = Math.max(
      n > 1 ? bins[Math.round((n - 1) * apart)] : -Infinity,
      above < bins.length ? bins[above] : -Infinity,
    )
    return db >= beside + lobeDb(apart - 0.5) + WIND_OVER_SPILL_DB ? db : -Infinity
  }
  const at = Math.round(n * apart)
  const first = Math.max(0, Math.round((n - 1) * apart) + LOBE_BINS)
  const last = Math.min(bins.length - 1, Math.round((n + 1) * apart) - LOBE_BINS)
  // The levels those bins span. A bin of no sound at all is −Infinity, which cannot be halved.
  let low = Infinity
  let air = -Infinity
  let count = 0
  for (let bin = first; bin <= last; bin++) {
    if (Math.abs(bin - at) < LOBE_BINS) continue
    low = Math.min(low, Math.max(bins[bin], WIND_SILENT_DB))
    air = Math.max(air, bins[bin], WIND_SILENT_DB)
    count++
  }
  // Between three and six bins apart there is no bin clear of both harmonics: nothing to hold it against.
  if (count === 0) return db
  // Their middle level, found by halving the span: the level half of them are at or under.
  for (let halving = 0; halving < 10; halving++) {
    const middle = (low + air) / 2
    let under = 0
    for (let bin = first; bin <= last; bin++)
      if (Math.abs(bin - at) >= LOBE_BINS && bins[bin] <= middle) under++
    if (2 * under >= count) air = middle
    else low = middle
  }
  return db - air >= WIND_OVER_AIR_DB ? db : -Infinity
}

/** The knobs that say what a steady wind lights on a key. */
interface WindKnobs {
  wind: number
  strings: number
  glint: number
  hum: number
  touch: number
  ring: number
}

interface WindParts {
  /** The strings: their feet at `y + h`, the sixteenth harmonic at `y`, pitch across `w`. */
  field: Box
  foot: Box
}

function windParts(view: Size): WindParts {
  const foot: Box = { x: 4, y: view.height - 10, w: view.width - 8, h: 6 }
  // The harmonics are numbered in the margin at the right; the picks of Touch hang under the feet.
  return { field: { x: 6, y: 15, w: Math.max(40, view.width - 24), h: foot.y - 27 }, foot }
}

/** Where a number of octaves above a string's own note stands up it. */
const windY = (octaves: number, field: Box): number =>
  field.y + field.h * (1 - clamp(octaves / WIND_HIGH_OCTAVES, 0, 1))

/** How far the strings of a course stand from its middle, in px at full Width: mono still shows how many there are. */
const windSpread = (field: Box, width: number): number =>
  (field.w >= 150 ? 4 : 2.6) * (0.35 + 0.65 * clamp(width, 0, 1))

interface WindState {
  /** The sample weather: the wind's speed at every second pixel across, and whether it blows there. */
  speed: Float32Array
  blowing: Uint8Array
  columns: number
  /** The lowest and the highest the wind stood in the Ring seconds before each of them. */
  low: Float32Array
  high: Float32Array
  /** One string's harmonics while they are worked out. */
  drive: Float32Array
  /** The keys that sound, the newest first, and what is heard of each of their harmonics, in dB. */
  index: Int16Array
  heard: Float32Array
  /** The loudest harmonic heard of late, in dB: what the others are lit against. */
  ref: number
  /** The knobs a steady wind is reckoned from, where the sound cannot be read. */
  knobs: WindKnobs
}

/** The weather the ribbon shows: gusts as wide as Gust at their own pace, and lulls as often as Lull, each of the mean length. */
function windWeather(frame: DisplayFrame<WindState>, field: Box): number {
  const { state } = frame
  const columns = Math.max(4, Math.floor(field.w / 2) + 1)
  if (state.columns !== columns) {
    state.columns = columns
    state.speed = new Float32Array(columns)
    state.blowing = new Uint8Array(columns)
    state.low = new Float32Array(columns)
    state.high = new Float32Array(columns)
  }
  const wind = frame.value('wind')
  const gust = frame.value('gust')
  const lull = frame.value('lull')
  const long = WIND_LULL_SHORTEST + WIND_LULL_SPREAD / 2
  const round = windBetweenLulls(lull) + long
  for (let i = 0; i < columns; i++) {
    const seconds = (i / (columns - 1)) * WIND_WINDOW_SEC
    state.speed[i] = windSpeed(wind, gust, windSway(seconds))
    const into = seconds - WIND_FIRST_LULL_SEC
    const calm = Number.isFinite(round) && into - Math.floor(into / round) * round < long
    state.blowing[i] = calm ? 0 : 1
  }
  return columns
}

/** The middle of the ribbon at a column: the wind as the string that would stand there hears it, under Glint's ceiling. */
function windRibbon(frame: DisplayFrame<WindState>, column: number): number {
  const { state } = frame
  const hz =
    WIND_LOW_HZ * Math.pow(WIND_HIGH_HZ / WIND_LOW_HZ, column / Math.max(1, state.columns - 1))
  return clamp(
    state.speed[column] + windLean(hz),
    0,
    Math.min(WIND_HIGH_OCTAVES, WIND_GLINT_OCTAVES * frame.value('glint')),
  )
}

/** The wind: a glow where its harmonics still ring, and its streaks, more of them the more Air there is, broken where it drops away. */
function windStreaks(frame: DisplayFrame<WindState>, field: Box, columns: number): void {
  const { ctx, colours, state } = frame
  const xOf = (column: number): number => field.x + (field.w * column) / (columns - 1)
  // A harmonic sings on for Ring after the wind has left it: the glow at a place is all the
  // wind lit there in the Ring seconds before, so a long Ring blurs the gusts into one band.
  const back = Math.round((frame.value('ring') / WIND_WINDOW_SEC) * (columns - 1))
  for (let i = 0; i < columns; i++) {
    let low = Infinity
    let high = -Infinity
    for (let j = Math.max(0, i - back); j <= i; j++) {
      if (!state.blowing[j]) continue
      const middle = windRibbon(frame, j)
      low = Math.min(low, middle)
      high = Math.max(high, middle)
    }
    state.low[i] = low
    state.high[i] = high
  }
  ctx.fillStyle = colours.ink
  ctx.globalAlpha = 0.12
  for (let from = 0; from < columns; from++) {
    if (state.low[from] > state.high[from]) continue
    let to = from
    while (to + 1 < columns && state.low[to + 1] <= state.high[to + 1]) to++
    ctx.beginPath()
    for (let i = from; i <= to; i++) ctx.lineTo(xOf(i), windY(state.high[i] + WIND_BELL, field))
    for (let i = to; i >= from; i--) ctx.lineTo(xOf(i), windY(state.low[i] - WIND_BELL, field))
    ctx.closePath()
    ctx.fill()
    from = to
  }
  const lines = 3 + 2 * Math.round(3 * clamp(frame.value('air'), 0, 1))
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  for (let line = 0; line < lines; line++) {
    const from = ((line / (lines - 1)) * 2 - 1) * 0.9
    ctx.beginPath()
    let drawing = false
    for (let i = 0; i < columns; i++) {
      if (!state.blowing[i]) {
        drawing = false
        continue
      }
      const y = windY(windRibbon(frame, i) + from * WIND_BELL, field)
      if (drawing) ctx.lineTo(xOf(i), y)
      else ctx.moveTo(xOf(i), y)
      drawing = true
    }
    // The bell: strongest in the middle of the wind.
    ctx.globalAlpha = 0.2 + 0.8 * (1 - from * from) ** 2
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** Where string `index` of a course of `count` stands beside the course's middle at `x`. */
const windStringX = (x: number, count: number, index: number, spread: number): number =>
  x + WIND_PAN[count - 1][index] * spread

/** A pick under the foot of a course, as large as Touch plucks. */
function windPick(
  frame: Pick<DisplayFrame, 'ctx'>,
  x: number,
  y: number,
  size: number,
  colour: string,
  alpha: number,
): void {
  const { ctx } = frame
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - size * 0.7, y + size)
  ctx.lineTo(x + size * 0.7, y + size)
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

/** The harp at rest: the scale of harmonics, Glint's ceiling, the wind, and strings standing in it with the harmonics it lights on each. */
function windRest(frame: DisplayFrame<WindState>, parts: WindParts): void {
  const { ctx, colours, state } = frame
  const { field } = parts
  const floor = field.y + field.h
  const right = field.x + field.w
  const glint = frame.value('glint')
  const count = windStrings(frame.value('strings'))
  const spread = windSpread(field, frame.value('width'))
  const hum = windHum(frame.value('hum'))
  const touch = clamp(frame.value('touch'), 0, 1)
  const columns = windWeather(frame, field)

  // The scale: the harmonics an octave apart, numbered in the margin.
  for (let octave = 1; octave <= WIND_HIGH_OCTAVES; octave++) {
    const y = windY(octave, field)
    rule(ctx, field.x, y, right + 2, y, { colour: colours.ink, alpha: INK.grid })
    text(frame, `${2 ** octave}`, frame.width - 5, y + (octave === WIND_HIGH_OCTAVES ? 7 : 3), {
      align: 'right',
    })
  }
  rule(ctx, field.x - 2, floor, right + 2, floor, { colour: colours.ink, alpha: INK.back })
  // Glint's ceiling: nothing lights more than half an octave above it.
  if (glint < 1) {
    const y = windY(WIND_GLINT_OCTAVES * glint, field)
    rule(ctx, field.x, y, right, y, { colour: colours.ink, alpha: INK.text, dash: [2, 2] })
  }
  windStreaks(frame, field, columns)

  const keys = field.w >= 150 ? WIND_REST_WIDE : WIND_REST_NARROW
  for (const key of keys) {
    const hz = 440 * Math.pow(2, (key - 69) / 12)
    const x = xOfPitch(hz, field, WIND_LOW_HZ, WIND_HIGH_HZ)
    const column = clamp(Math.round(((x - field.x) / field.w) * (columns - 1)), 0, columns - 1)
    const available = windAvailable(hz, frame.sampleRate)
    for (let index = 0; index < count; index++) {
      const at = Math.floor(windStringX(x, count, index, spread)) + 0.5
      rule(ctx, at, floor, at, windY(Math.log2(available), field), {
        colour: colours.ink,
        alpha: 0.35,
      })
      // What the wind lights on this string where it stands: each string of a course hears it at its own offset.
      state.drive.fill(0)
      if (state.blowing[column])
        windDrive(
          windAt(state.speed[column], hz, count, index, glint, frame.sampleRate),
          glint,
          available,
          state.drive,
        )
      state.drive[0] += hum
      for (let k = 0; k < WIND_PARTIALS; k++) {
        const level = state.drive[k]
        if (level < WIND_SEEN) continue
        dot(ctx, at, windY(Math.log2(k + 1), field), 0.6 + 1.4 * Math.min(1, level), colours.ink)
      }
    }
    if (touch > 0) windPick(frame, x, floor + 2, 1.5 + 3 * touch, colours.ink, INK.text)
  }
}

/** `WindHarp::note_on`: the pitches a key may have. */
const windHz = (note: DisplayNote, sampleRate: number): number =>
  clamp(note.frequency, 8, Math.min(12000, WIND_BAND_LIMIT * sampleRate))

/** `kit/env.h`, `Adsr`, as the device sets it: how much of a key is left, 1 while it is held and down the 60 dB of Release as one straight fall after. */
export function windKeyLight(released: number | null, release: number): number {
  return released === null ? 1 : Math.max(0, 1 - released / release)
}

/**
 * How strongly harmonic `n` of a key is lit, 0 to 1, where the sound cannot
 * be read: what a steady wind gives it on the string of the course that
 * hears it best, the hum under it, and what is left of the pluck. The gusts
 * of a weather come in over its first second, so this is what a phrase
 * begins on.
 */
export function windSteady(
  n: number,
  hz: number,
  note: Pick<DisplayNote, 'gain' | 'age'>,
  knobs: WindKnobs,
  scratch: Float32Array | number[] = [],
  sampleRate = 48000,
): number {
  const count = windStrings(knobs.strings)
  const available = windAvailable(hz, sampleRate)
  let most = 0
  for (let index = 0; index < count; index++) {
    windDrive(
      windAt(windSpeed(knobs.wind), hz, count, index, knobs.glint, sampleRate),
      knobs.glint,
      available,
      scratch,
    )
    most = Math.max(most, scratch[n - 1])
  }
  if (n === 1) most += windHum(knobs.hum)
  const plucked =
    n <= available
      ? windPluck(knobs.touch, note.gain, n) *
        Math.pow(10, (-3 * note.age) / windRingSeconds(knobs.ring, n))
      : 0
  return clamp(Math.max(most, plucked), 0, 1)
}

/**
 * The keys that are held, each a course of strings at its pitch, lit as far
 * as the key is down or has faded. The wind's course is drawn from a seed the
 * display cannot know, so the harmonics it lights now are read from the
 * sound: a rung across the course at each harmonic that is heard, thicker the
 * louder. Where there is no sound to read, the rungs are what a steady wind
 * would light, and are dotted to say so. The newest key that sounds comes back.
 */
function windPlayed(frame: DisplayFrame<WindState>, parts: WindParts): DisplayNote | null {
  const { ctx, colours, state, notes, signal } = frame
  const { field } = parts
  const floor = field.y + field.h
  const count = windStrings(frame.value('strings'))
  const spread = windSpread(field, frame.value('width'))
  const release = frame.value('release')
  const touch = clamp(frame.value('touch'), 0, 1)
  const { knobs } = state
  knobs.wind = frame.value('wind')
  knobs.strings = count
  knobs.glint = frame.value('glint')
  knobs.hum = frame.value('hum')
  knobs.touch = touch
  knobs.ring = frame.value('ring')
  const bins = signal?.spectrum ?? null
  const binHz = signal?.binHz ?? 0
  const read = bins !== null && binHz > 0

  let sounding = 0
  let loudest = -Infinity
  for (let i = notes.length - 1; i >= 0 && sounding < WIND_VOICES; i--) {
    if (windKeyLight(notes[i].released, release) < WIND_DONE) continue
    const hz = windHz(notes[i], frame.sampleRate)
    const available = windAvailable(hz, frame.sampleRate)
    for (let n = 1; n <= WIND_PARTIALS; n++) {
      const db = read && n <= available ? windHeardDb(bins, binHz, hz, n) : -Infinity
      state.heard[sounding * WIND_PARTIALS + n - 1] = db
      if (db > loudest) loudest = db
    }
    state.index[sounding++] = i
  }
  // The harmonics are lit against the loudest heard of late, so a lull shows as one.
  state.ref =
    sounding > 0
      ? Math.max(loudest, state.ref - WIND_REF_FALL * frame.dt, WIND_QUIET_DB + WIND_LIT_DB)
      : -Infinity

  for (let v = sounding - 1; v >= 0; v--) {
    const note = notes[state.index[v]]
    const hz = windHz(note, frame.sampleRate)
    const light = windKeyLevel(note.gain) * windKeyLight(note.released, release)
    const x = xOfPitch(hz, field, WIND_LOW_HZ, WIND_HIGH_HZ)
    const top = windY(Math.log2(windAvailable(hz, frame.sampleRate)), field)
    ctx.beginPath()
    for (let index = 0; index < count; index++) {
      const at = windStringX(x, count, index, spread)
      ctx.moveTo(at, floor)
      ctx.lineTo(at, top)
    }
    ctx.globalAlpha = 0.35 + 0.65 * light
    ctx.strokeStyle = colours.accent
    ctx.lineWidth = 1.25
    ctx.stroke()
    // A rung reaches from the first string of the course to the last, so a course is a ladder.
    const half = Math.max(1.5, WIND_PAN[count - 1][count - 1] * spread + 1)
    // Where the sound cannot be read the rungs are a reckoning, not a hearing: they are dotted.
    if (!read) ctx.setLineDash(WIND_RECKONED)
    for (let n = 1; n <= WIND_PARTIALS; n++) {
      const db = state.heard[v * WIND_PARTIALS + n - 1]
      const share = read
        ? clamp(1 - (state.ref - db) / WIND_LIT_DB, 0, 1)
        : Math.sqrt(windSteady(n, hz, note, knobs, state.drive, frame.sampleRate))
      if (!(share >= 0.12)) continue
      const y = windY(Math.log2(n), field)
      ctx.beginPath()
      ctx.moveTo(x - half, y)
      ctx.lineTo(x + half, y)
      ctx.globalAlpha = (0.3 + 0.7 * share) * (0.4 + 0.6 * light)
      ctx.lineWidth = 1 + 1.5 * share
      ctx.stroke()
    }
    ctx.setLineDash(WIND_SOLID)
    ctx.globalAlpha = 1
    // The pluck of Touch, for a moment after the key.
    if (touch > 0 && note.age < 0.14)
      windPick(frame, x, floor + 2, 1.5 + 3 * touch, colours.accent, 1 - note.age / 0.14)
  }
  return sounding > 0 ? notes[state.index[0]] : null
}

const windHarp = plateDisplay<WindState>({
  place: 'window',
  columns: 2,
  params: [
    'wind',
    'gust',
    'lull',
    'strings',
    'glint',
    'ring',
    'hum',
    'air',
    'touch',
    'release',
    'width',
  ],
  live: { signal: true, notes: true, spectrum: true },
  info: 'Strings in the wind, their harmonics counted up each at the right. The ribbon is a sample minute of wind, not the wind now: as high as Wind, as wavy as Gust, broken by Lull, glowing as long as Ring. A held key lights its strings, with a rung at each harmonic heard, dotted where it is only reckoned.',
  init: () => ({
    speed: new Float32Array(0),
    blowing: new Uint8Array(0),
    columns: 0,
    low: new Float32Array(0),
    high: new Float32Array(0),
    drive: new Float32Array(WIND_PARTIALS),
    index: new Int16Array(WIND_VOICES),
    heard: new Float32Array(WIND_VOICES * WIND_PARTIALS),
    ref: -Infinity,
    knobs: { wind: 0, strings: 1, glint: 0, hum: 0, touch: 0, ring: 1 },
  }),
  draw(frame) {
    ground(frame)
    const parts = windParts(frame)
    windRest(frame, parts)
    const said = windPlayed(frame, parts)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the harmonic a steady wind lights on the newest key (the A under middle C
    // while none is held), and how long a harmonic sings on.
    const hz = said ? windHz(said, frame.sampleRate) : WIND_REST_HZ
    const at = windAt(
      windSpeed(frame.value('wind')),
      hz,
      1,
      0,
      frame.value('glint'),
      frame.sampleRate,
    )
    text(frame, `Harmonic ${Math.round(2 ** at)}`, 5, 10)
    text(frame, `${pitchName(hz)} ${secondsText(frame.value('ring'))}`, frame.width - 5, 10, {
      align: 'right',
    })
  },
})

export const WIRE_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'magnet-piano': {
    display: magnetPiano,
    face: ['bloom', 'harmonic', 'bright', 'hammer'],
  },
  'prepared-piano': {
    display: preparedPiano,
    face: ['preparation', 'amount', 'position', 'rattle'],
    // Eleven letters do not fit a column, and what the knob picks is the object on the strings.
    labels: { preparation: 'Object' },
  },
  'wind-harp': { display: windHarp, face: ['wind', 'gust', 'glint', 'ring'] },
}
