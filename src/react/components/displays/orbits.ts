// The display of Orbits: the loops as rings, where each one is in its turn,
// and the same loops laid straight as lanes.
//
// A ring is a loop, the innermost the first and shortest; its size follows
// Length and the gap between rings follows Offset, each on its knob's own
// taper. The dot on a ring is that loop's head, where the device reports it,
// and it goes round once a period: the angles between the dots are how far
// the loops have slid against each other. The band on a ring is what the loop
// holds, laid where the head was when the device reported having written it,
// as loud as Mix lets it out; a stretch the display has not watched yet is
// drawn fainter, at the most the device says the whole loop holds. The
// upright line is where every loop started.
//
// A lane is a loop laid straight, as long as its loop on the same tapers,
// with the same head and band. The first lane's end is Length and the last
// lane's end is Offset, and those two ends are the points to drag: a lane has
// the room across the display that a ring has not. Offset is drawn as the
// device uses it: where the longest loop would not fit its storage the loops
// are held closer than the knob says, and the picture and the words say so.

import { denormalizeParam, normalizeParam } from '../../../core/params'
import {
  INK,
  clamp,
  dot,
  gainToDb,
  ground,
  handle,
  lerp,
  rule,
  text,
  trackPhase,
  type Box,
  type PhaseTrack,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

type Size = Pick<DisplayView, 'width' | 'height'>

// --- The device's own numbers (cpp/devices/orbits/orbits.h) ------------------

/** `kMaxLoops`: the most loops there are. */
export const ORBITS_MOST = 5
/** `kRingFrames`: the samples one loop's ring holds. */
const RING_FRAMES = 1440000
/** `kDriftSeconds`: how far a play head wanders, which a ring keeps room for. */
const DRIFT_SECONDS = 0.012

/** `Orbits::longest`: the longest period a ring holds, in samples. */
export const orbitsLongest = (sampleRate: number): number =>
  Math.floor(RING_FRAMES - Math.fround(DRIFT_SECONDS) * sampleRate - 8)

/**
 * The ratio between one loop and the next as `Orbits::period` uses it:
 * 1 + Offset, brought down where the longest of `loops` would not fit its ring.
 */
export function orbitsRatio(
  loops: number,
  lengthSec: number,
  offsetPercent: number,
  sampleRate: number,
): number {
  const first = lengthSec * sampleRate
  const ratio = 1 + offsetPercent * 0.01
  if (loops <= 1) return ratio
  const most = orbitsLongest(sampleRate) / first
  return Math.min(ratio, Math.pow(Math.max(1, most), 1 / (loops - 1)))
}

/** The Offset the device uses, in percent: the knob's, or less where the longest loop would not fit. */
export const orbitsOffset = (
  loops: number,
  lengthSec: number,
  offsetPercent: number,
  sampleRate: number,
): number => (orbitsRatio(loops, lengthSec, offsetPercent, sampleRate) - 1) * 100

/**
 * `Orbits::period`: the period of loop `k` of `loops` in samples, for a
 * Length in seconds and an Offset in percent. Length x (1 + Offset)^k, with
 * the ratio brought down where the longest loop would not fit its ring.
 */
export function orbitsPeriod(
  k: number,
  loops: number,
  lengthSec: number,
  offsetPercent: number,
  sampleRate: number,
): number {
  const first = lengthSec * sampleRate
  const most = orbitsLongest(sampleRate)
  const ratio = orbitsRatio(loops, lengthSec, offsetPercent, sampleRate)
  return Math.max(8, Math.min(most, Math.floor(first * Math.pow(ratio, k) + 0.5)))
}

/** What Mix lets out of the loops: the sine of a quarter turn of it (equal power). */
export const orbitsWet = (mix: number): number => Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)

/**
 * The sample rate the engine runs at, as the last frame drawn had it. The
 * plate asks for the points without a frame, and where the longest loop fits
 * depends on the rate; there is one engine and one rate.
 */
let engineRate = 48000

/** Where Offset stands on its knob's taper as the device uses it, 0 to 1. */
export function orbitsOffsetAt(view: DisplayView, count: number, sampleRate = engineRate): number {
  const spec = view.spec('offset')
  if (!spec) return 0
  return normalizeParam(
    spec,
    orbitsOffset(count, view.value('length'), view.value('offset'), sampleRate),
  )
}

// --- Where things stand ------------------------------------------------------

/** The least height at which the loops are drawn as rings with the lanes beside them. */
const RINGS_FROM = 72
/** The least room beside the rings for the lanes. */
const LANES_FROM = 84
/** The least height at which the rings stand over the lanes, and the height the lanes take there. */
const STACK_FROM = 90
const LANES_HIGH = 34
/** The least room beside the rings for Length and Offset in words. */
const WORDS_FROM = 36
/** The most a lane takes of the height (less under the rings), and the height a line of words takes. */
const LANE_PITCH_MOST = 24
const STACK_PITCH_MOST = 16
const WORD_LINE = 12

/** The first ring's radius as a share of the reach: from the shortest Length to the longest. */
const FIRST_LEAST = 0.22
const FIRST_MOST = 0.5
/** How far out the outermost ring may stand, and the widest a gap gets, as shares of the reach. */
const RING_MOST = 0.98
const GAP_WIDEST = 0.26
/** The gap at the least Offset as a share of the gap at the most. */
const GAP_LEAST = 0.4
/** The first lane's length as a share of the room: from the shortest Length to the longest. */
export const LANE_LEAST = 0.2
export const LANE_MOST = 0.6
/** How much longer the last lane is than the first, as a share of the room: from the least Offset to the most. */
export const EXTRA_LEAST = 0.03
export const EXTRA_MOST = 0.38

interface Spot {
  x: number
  y: number
  align: 'left' | 'right' | 'center'
}

export interface OrbitsLay {
  /** Lanes alone, the rings with the lanes beside them, or the rings over the lanes. */
  shape: 'strip' | 'beside' | 'stacked'
  /** The rings: their middle and how far out the outermost can reach. Null where the display is too low. */
  rings: { cx: number; cy: number; reach: number } | null
  /** The lanes: where they start, the room the longest can take, the middle of the first and the step to the next. */
  lanes: { x: number; long: number; y: number; pitch: number }
  /** Where Length, Offset and Hold stand in words; null where there is no room for them. */
  words: { length: Spot; offset: Spot; hold: Spot | null } | null
}

/** Where things stand in a display of this size while `count` loops turn. */
export function orbitsLay(size: Size, count: number): OrbitsLay {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const right = box.x + box.w
  const foot = box.y + box.h
  if (size.height >= RINGS_FROM) {
    const reach = Math.max(8, Math.min(box.h / 2 - 3, (box.w - 6) / 2))
    if (box.w - 2 * reach - 10 >= LANES_FROM) {
      // The rings to the left; a lane for each loop that turns, over a line of words.
      const cx = box.x + reach + 3
      const x = cx + reach + 10
      const pitch = Math.min(LANE_PITCH_MOST, (box.h - WORD_LINE) / count)
      return {
        shape: 'beside',
        rings: { cx, cy: box.y + box.h / 2, reach },
        lanes: { x, long: right - 3 - x, y: box.y + pitch / 2, pitch },
        words: {
          length: { x, y: foot - 1, align: 'left' },
          offset: { x: right - 1, y: foot - 1, align: 'right' },
          hold: { x: (x + right) / 2, y: foot - 1, align: 'center' },
        },
      }
    }
    if (size.height >= STACK_FROM) {
      // The rings above with the words beside them; the lanes underneath, across the display.
      const high = box.h - LANES_HIGH
      const small = Math.max(8, Math.min(high / 2 - 2, (box.w - 6) / 2))
      const cx = box.x + small + 3
      const cy = box.y + high / 2
      const pitch = Math.min(STACK_PITCH_MOST, (LANES_HIGH - 2) / count)
      return {
        shape: 'stacked',
        rings: { cx, cy, reach: small },
        lanes: { x: box.x + 1, long: box.w - 6, y: box.y + high + 2 + pitch / 2, pitch },
        words:
          right - (cx + small + 6) >= WORDS_FROM
            ? {
                length: { x: right - 1, y: cy - 7, align: 'right' },
                offset: { x: right - 1, y: cy + 5, align: 'right' },
                hold: { x: right - 1, y: cy + 17, align: 'right' },
              }
            : null,
      }
    }
  }
  const wide = box.w >= 120 ? 34 : 0
  const pitch = Math.min(LANE_PITCH_MOST, box.h / count)
  return {
    shape: 'strip',
    rings: null,
    lanes: { x: box.x + 1, long: box.w - wide - 6, y: box.y + pitch / 2, pitch },
    words:
      wide > 0
        ? {
            length: { x: right - 1, y: box.y + 8, align: 'right' },
            offset: { x: right - 1, y: foot - 1, align: 'right' },
            hold:
              size.height >= 44
                ? { x: right - 1, y: (box.y + 8 + foot - 1) / 2 + 3, align: 'right' }
                : null,
          }
        : null,
  }
}

/** How many loops turn: Loops, as the device rounds it. */
export const orbitsCount = (view: DisplayView): number =>
  clamp(Math.floor(view.value('loops') + 0.5), 2, ORBITS_MOST)

/** The widest gap between two of `count` rings: what lets them all stand at the longest Length. */
export const ringGapMost = (reach: number, count: number): number =>
  reach * Math.min(GAP_WIDEST, (RING_MOST - FIRST_MOST) / Math.max(1, count - 1))

/** The radius of ring `k` of `count`: by Length, and by Offset as the device uses it. */
export function ringRadius(
  view: DisplayView,
  reach: number,
  count: number,
  k: number,
  sampleRate = engineRate,
): number {
  return (
    reach * lerp(FIRST_LEAST, FIRST_MOST, view.at('length')) +
    k * ringGapMost(reach, count) * lerp(GAP_LEAST, 1, orbitsOffsetAt(view, count, sampleRate))
  )
}

/** How much longer the last lane is than the first, for an Offset at `at` of its knob's taper. */
const laneExtra = (long: number, at: number): number => long * lerp(EXTRA_LEAST, EXTRA_MOST, at)

/**
 * The length of lane `k` of `count`: the first by Length, the last longer by
 * Offset as the device uses it, the ones between evenly between.
 */
export function laneLength(
  view: DisplayView,
  lanes: Pick<OrbitsLay['lanes'], 'long'>,
  count: number,
  k: number,
  sampleRate = engineRate,
): number {
  return (
    lanes.long * lerp(LANE_LEAST, LANE_MOST, view.at('length')) +
    (k / Math.max(1, count - 1)) * laneExtra(lanes.long, orbitsOffsetAt(view, count, sampleRate))
  )
}

/** A length as it is said: "250 ms", "2.0 s", "12 s". */
export function orbitsTimeText(seconds: number): string {
  if (seconds < 0.9995) return `${Math.round(seconds * 1000)} ms`
  return `${seconds >= 9.95 ? Math.round(seconds) : seconds.toFixed(1)} s`
}

/** Offset as it is said: each loop that much longer than the last. */
export function orbitsOffsetText(percent: number): string {
  return `+${percent >= 9.95 ? Math.round(percent) : percent.toFixed(1)} %`
}

// --- What a loop holds ------------------------------------------------------

/** How many stretches a loop's turn is kept in. */
export const ORBITS_BINS = 72

/** `kKnee`: full scale, where the device's record limiter starts; a band is full there. */
export const ORBITS_FULL = 1
/** A level as a share of a band's width: full at full scale, nothing this many dB under it. */
export const ORBITS_RANGE_DB = 48
export const bandShare = (level: number): number =>
  clamp(1 + gainToDb(level / ORBITS_FULL) / ORBITS_RANGE_DB, 0, 1)

/**
 * How strongly the band of what a loop holds is laid where the display
 * watched it being written, how strongly where it has only the device's word
 * for the whole loop, and the track under it.
 */
export const ORBITS_BAND = 0.62
export const ORBITS_UNSEEN = 0.3
const TRACK = INK.rule

interface OrbitsState {
  /** Each loop's head, carried between two readings. */
  tracks: (PhaseTrack | null)[]
  /** The level each loop reported having written, by where its head was. */
  held: Float32Array[]
  /** Which stretches of each loop the head has been over while the display watched. */
  seenAt: Uint8Array[]
  /** Where each loop's head was at the frame before; -1 for nowhere yet. */
  last: Float64Array
  /** The period each loop had at the frame before, in samples. */
  period: Float64Array
  /** The display's clock at the frame before, to know a stretch nobody watched. */
  seen: number | null
}

/** What the display watched of a loop is no longer what the loop holds. */
const unwatch = (state: OrbitsState, k: number): void => {
  state.last[k] = -1
  state.held[k].fill(0)
  state.seenAt[k].fill(0)
}

const blank = (state: OrbitsState, k: number): void => {
  state.tracks[k] = null
  unwatch(state, k)
}

const SIN = new Float32Array(ORBITS_BINS + 1)
const COS = new Float32Array(ORBITS_BINS + 1)
for (let b = 0; b <= ORBITS_BINS; b++) {
  // From the top, clockwise: where a loop starts and the way its head goes.
  const angle = -Math.PI / 2 + (b / ORBITS_BINS) * Math.PI * 2
  SIN[b] = Math.sin(angle)
  COS[b] = Math.cos(angle)
}

/** Where on a ring of radius `r` a head at `phase` (0..1) stands. */
export function ringPoint(
  cx: number,
  cy: number,
  r: number,
  phase: number,
): readonly [number, number] {
  const angle = -Math.PI / 2 + phase * Math.PI * 2
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
}

/**
 * Take one frame's readings: carry each head on, and lay the level its loop
 * reports having written on the stretch the head went over since the frame
 * before. A loop the device reports as off or at rest holds nothing; one
 * whose period has changed holds something else than was watched.
 */
function follow(frame: DisplayFrame<OrbitsState>, count: number): void {
  const { state } = frame
  const reading = frame.powered && frame.hasMeter('phase1')
  // More than a second nobody watched: what was written then was not seen.
  if (state.seen !== null && frame.now - state.seen > 1) {
    for (let k = 0; k < ORBITS_MOST; k++) blank(state, k)
  }
  state.seen = frame.now
  const length = frame.value('length')
  const offset = frame.value('offset')
  for (let k = 0; k < ORBITS_MOST; k++) {
    // orbits.h `meter`: a head's place in its turn, -1 for a loop that is off or at rest.
    const place = reading && k < count ? frame.meter(`phase${k + 1}`) : -1
    if (!(place >= 0)) {
      blank(state, k)
      state.period[k] = 0
      continue
    }
    const period = orbitsPeriod(k, count, length, offset, frame.sampleRate)
    if (state.period[k] !== period) {
      // The loop was moved to another length: what it holds lies elsewhere on its turn now.
      if (state.period[k] !== 0) unwatch(state, k)
      state.period[k] = period
    }
    const read = place - Math.floor(place)
    const seconds = period / frame.sampleRate
    const track = state.tracks[k]
    state.tracks[k] =
      frame.dt > 0 || !track ? trackPhase(track, read, 1 / seconds, frame.dt) : track
    const now = state.tracks[k]?.phase ?? read
    const level = frame.meter(`level${k + 1}`)
    const written = Number.isFinite(level) && level > 0 ? level : 0
    const held = state.held[k]
    const seenAt = state.seenAt[k]
    const to = Math.min(ORBITS_BINS - 1, Math.floor(now * ORBITS_BINS))
    const before = state.last[k]
    // The way the head went, the short way round: forwards it wrote on every
    // stretch it crossed; set back by a reading, only where it stands.
    const went = before < 0 ? 0 : ((((now - before + 0.5) % 1) + 1) % 1) - 0.5
    if (went > 0) {
      let bin = Math.min(ORBITS_BINS - 1, Math.floor(before * ORBITS_BINS))
      for (let step = 0; step < ORBITS_BINS && bin !== to; step++) {
        bin = (bin + 1) % ORBITS_BINS
        held[bin] = written
        seenAt[bin] = 1
      }
    }
    held[to] = before < 0 || went > 0 || !seenAt[to] ? written : Math.max(held[to], written)
    seenAt[to] = 1
    state.last[k] = now
  }
}

/** How wide the band is at each stretch, as shares of its most: what was watched, and what was not. */
const WATCHED = new Float32Array(ORBITS_BINS)
const UNSEEN = new Float32Array(ORBITS_BINS)

/**
 * Work out both bands of loop `k`: each stretch the display watched at the
 * level written there, every other stretch at the most the device says the
 * loop holds anywhere (orbits.h `meter`, 10 to 14). True where there is
 * anything to draw.
 */
function layBands(frame: DisplayFrame<OrbitsState>, k: number, wet: number): [boolean, boolean] {
  const { state } = frame
  const most = frame.meter(`held${k + 1}`)
  const whole =
    state.tracks[k] !== null && Number.isFinite(most) && most > 0 ? bandShare(most * wet) : 0
  let watched = false
  let unseen = false
  for (let b = 0; b < ORBITS_BINS; b++) {
    const known = state.seenAt[k][b] === 1
    WATCHED[b] = known && wet > 0 ? bandShare(state.held[k][b] * wet) : 0
    UNSEEN[b] = known || !(wet > 0) ? 0 : whole
    if (WATCHED[b] > 0) watched = true
    if (UNSEEN[b] > 0) unseen = true
  }
  return [watched, unseen]
}

// --- Drawing ----------------------------------------------------------------

/** A band about ring `r`: as wide at each stretch as `shares` says, of `most`. */
function ringBand(
  frame: DisplayFrame<OrbitsState>,
  cx: number,
  cy: number,
  r: number,
  most: number,
  shares: Float32Array,
  alpha: number,
): void {
  const { ctx } = frame
  ctx.beginPath()
  for (let b = 0; b <= ORBITS_BINS; b++) {
    const out = r + shares[b % ORBITS_BINS] * most
    if (b === 0) ctx.moveTo(cx + out * COS[b], cy + out * SIN[b])
    else ctx.lineTo(cx + out * COS[b], cy + out * SIN[b])
  }
  for (let b = ORBITS_BINS; b >= 0; b--) {
    const inner = r - shares[b % ORBITS_BINS] * most
    ctx.lineTo(cx + inner * COS[b], cy + inner * SIN[b])
  }
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = frame.colours.ink
  ctx.fill()
  ctx.globalAlpha = 1
}

/** The same along a lane from `x` for `long`. */
function laneBand(
  frame: DisplayFrame<OrbitsState>,
  x: number,
  y: number,
  long: number,
  most: number,
  shares: Float32Array,
  alpha: number,
): void {
  const { ctx } = frame
  ctx.beginPath()
  for (let b = 0; b < ORBITS_BINS; b++) {
    const at = x + ((b + 0.5) / ORBITS_BINS) * long
    const up = y - shares[b] * most
    if (b === 0) ctx.moveTo(at, up)
    else ctx.lineTo(at, up)
  }
  for (let b = ORBITS_BINS - 1; b >= 0; b--) {
    ctx.lineTo(x + ((b + 0.5) / ORBITS_BINS) * long, y + shares[b] * most)
  }
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = frame.colours.ink
  ctx.fill()
  ctx.globalAlpha = 1
}

/** A loop's head: in the accent while the loop turns and is heard, a ghost in the ink otherwise. */
function head(frame: DisplayFrame<OrbitsState>, x: number, y: number, heard: boolean): void {
  const { ctx, colours } = frame
  if (heard) {
    dot(ctx, x, y, 2.4, colours.accent, { ring: colours.plate })
    return
  }
  ctx.beginPath()
  ctx.arc(x, y, 2, 0, Math.PI * 2)
  ctx.fillStyle = colours.plate
  ctx.fill()
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
}

function drawRings(
  frame: DisplayFrame<OrbitsState>,
  rings: NonNullable<OrbitsLay['rings']>,
  count: number,
  wet: number,
  holding: boolean,
): void {
  const { ctx, colours, state } = frame
  const { cx, cy, reach } = rings
  const first = ringRadius(frame, reach, count, 0, frame.sampleRate)
  const last = ringRadius(frame, reach, count, count - 1, frame.sampleRate)
  const gap = ringRadius(frame, reach, count, 1, frame.sampleRate) - first
  // Where every loop started: heads all on this line are the loops as they began.
  rule(ctx, cx, cy - first + 2, cx, cy - last - 2.5, { colour: colours.ink, alpha: INK.back })
  for (let k = 0; k < count; k++) {
    const r = ringRadius(frame, reach, count, k, frame.sampleRate)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.globalAlpha = TRACK
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
    const most = Math.max(0.8, gap / 2 - 0.5)
    const [watched, unseen] = layBands(frame, k, wet)
    if (unseen) ringBand(frame, cx, cy, r, most, UNSEEN, ORBITS_UNSEEN)
    if (watched) ringBand(frame, cx, cy, r, most, WATCHED, ORBITS_BAND)
  }
  // The middle is what the loops listen to: filled while they do, open with Hold on.
  ctx.beginPath()
  ctx.arc(cx, cy, 2, 0, Math.PI * 2)
  if (holding) {
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
  } else {
    ctx.globalAlpha = INK.text
    ctx.fillStyle = colours.ink
    ctx.fill()
  }
  ctx.globalAlpha = 1
  for (let k = 0; k < count; k++) {
    const track = state.tracks[k]
    const r = ringRadius(frame, reach, count, k, frame.sampleRate)
    const [x, y] = ringPoint(cx, cy, r, track ? track.phase : 0)
    head(frame, x, y, track !== null && wet > 0)
  }
}

function drawLanes(
  frame: DisplayFrame<OrbitsState>,
  lanes: OrbitsLay['lanes'],
  count: number,
  wet: number,
): void {
  const { ctx, colours, state } = frame
  const most = Math.max(1, lanes.pitch / 2 - 1.5)
  for (let k = 0; k < count; k++) {
    const y = lanes.y + k * lanes.pitch
    const long = laneLength(frame, lanes, count, k, frame.sampleRate)
    rule(ctx, lanes.x, y, lanes.x + long, y, { colour: colours.ink, alpha: TRACK })
    rule(ctx, lanes.x + long, y - 2, lanes.x + long, y + 2, {
      colour: colours.ink,
      alpha: INK.back,
    })
    const [watched, unseen] = layBands(frame, k, wet)
    if (unseen) laneBand(frame, lanes.x, y, long, most, UNSEEN, ORBITS_UNSEEN)
    if (watched) laneBand(frame, lanes.x, y, long, most, WATCHED, ORBITS_BAND)
  }
  // Where every loop started.
  rule(ctx, lanes.x, lanes.y - most, lanes.x, lanes.y + (count - 1) * lanes.pitch + most, {
    colour: colours.ink,
    alpha: INK.back,
  })
  for (let k = 0; k < count; k++) {
    const track = state.tracks[k]
    const long = laneLength(frame, lanes, count, k, frame.sampleRate)
    const x = lanes.x + (track ? track.phase : 0) * long
    head(frame, x, lanes.y + k * lanes.pitch, track !== null && wet > 0)
  }
}

/** A notch of the wheel over a point: this much of its knob's whole turn, where a drag is coarse. */
export const ORBITS_NOTCH = 0.01

function nudge(
  view: DisplayView,
  name: 'length' | 'offset',
  steps: number,
): Record<string, number> {
  const spec = view.spec(name)
  if (!spec) return {}
  return { [name]: denormalizeParam(spec, clamp(view.at(name) + steps * ORBITS_NOTCH, 0, 1)) }
}

const orbitsHandles = (view: DisplayView): DisplayHandle[] => {
  const count = orbitsCount(view)
  const { lanes } = orbitsLay(view, count)
  const length = view.spec('length')
  const offset = view.spec('offset')
  const first = laneLength(view, lanes, count, 0)
  return [
    {
      key: 'length',
      name: 'Length',
      // The end of the first lane.
      x: lanes.x + first,
      y: lanes.y,
      drag: (x: number) => ({
        length: length
          ? denormalizeParam(
              length,
              clamp(((x - lanes.x) / lanes.long - LANE_LEAST) / (LANE_MOST - LANE_LEAST), 0, 1),
            )
          : 0,
      }),
      wheel: (steps: number) => nudge(view, 'length', steps),
      reset: () => ({ length: length?.default ?? 2 }),
    },
    {
      key: 'offset',
      name: 'Offset',
      // The end of the last lane: how much longer it is than the first.
      x: lanes.x + laneLength(view, lanes, count, count - 1),
      y: lanes.y + (count - 1) * lanes.pitch,
      drag: (x: number, _y: number, hold?: DisplayHold) => {
        if (!offset) return { offset: 0 }
        // Where the longest loop would not fit, the lane ends short of where
        // the knob's Offset lies: the point is taken there and moves from
        // where the setting lies, as far past the lane's end as it lay at
        // the press.
        const kept = hold ?? {}
        kept.past ??=
          laneExtra(lanes.long, view.at('offset')) -
          laneExtra(lanes.long, orbitsOffsetAt(view, count))
        const extra = x + kept.past - lanes.x - first
        return {
          offset: denormalizeParam(
            offset,
            clamp((extra / lanes.long - EXTRA_LEAST) / (EXTRA_MOST - EXTRA_LEAST), 0, 1),
          ),
        }
      },
      wheel: (steps: number) => nudge(view, 'offset', steps),
      reset: () => ({ offset: offset?.default ?? 0.5 }),
    },
  ]
}

const orbits = plateDisplay<OrbitsState>({
  place: 'window',
  columns: 2,
  params: ['loops', 'length', 'offset', 'hold', 'mix'],
  // A long loop is silent between two passes of a short note for most of its turn.
  live: { meters: true, settle: 32 },
  info: 'Each ring is a loop, its dot where it plays now. The lanes are the same loops laid straight, each a step longer as Offset goes up. The band is what a loop holds as Mix lets it out, fainter where unwatched. Drag the end of the first lane for Length, of the last for Offset. The wheel moves finely.',
  init: () => ({
    tracks: Array.from({ length: ORBITS_MOST }, () => null),
    held: Array.from({ length: ORBITS_MOST }, () => new Float32Array(ORBITS_BINS)),
    seenAt: Array.from({ length: ORBITS_MOST }, () => new Uint8Array(ORBITS_BINS)),
    last: new Float64Array(ORBITS_MOST).fill(-1),
    period: new Float64Array(ORBITS_MOST),
    seen: null,
  }),
  draw(frame) {
    ground(frame)
    engineRate = frame.sampleRate
    const count = orbitsCount(frame)
    const lay = orbitsLay(frame, count)
    const wet = orbitsWet(frame.value('mix'))
    const holding = Math.round(frame.value('hold')) === 1
    follow(frame, count)
    const length = frame.value('length')
    if (lay.rings) drawRings(frame, lay.rings, count, wet, holding)
    drawLanes(frame, lay.lanes, count, wet)
    if (lay.words) {
      const { words } = lay
      text(frame, orbitsTimeText(length), words.length.x, words.length.y, {
        align: words.length.align,
      })
      // Offset as the device uses it, which is the knob's unless the longest loop would not fit.
      const used = orbitsOffset(count, length, frame.value('offset'), frame.sampleRate)
      text(frame, orbitsOffsetText(used), words.offset.x, words.offset.y, {
        align: words.offset.align,
      })
      if (holding && words.hold) {
        text(frame, 'Hold', words.hold.x, words.hold.y, { align: words.hold.align })
      }
    }
    for (const point of orbitsHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 3 })
    }
  },
  handles: orbitsHandles,
})

export const ORBITS_FACES: Readonly<Record<string, PlateFace>> = {
  // Length and Offset are the two points on the display.
  orbits: {
    display: orbits,
    face: ['loops', 'feedback', 'hold', 'mix'],
  },
}
