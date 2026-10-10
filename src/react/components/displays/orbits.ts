// The display of Orbits: the loops as rings, and where each one is in its turn.
//
// A ring is a loop, the innermost the first and shortest; its size follows
// Length and the gap between rings follows Offset, each on its knob's own
// taper. The dot on a ring is that loop's head, where the device reports it,
// and it goes round once a period: the angles between the dots are how far
// the loops have slid against each other. The band on a ring is what the loop
// holds, laid where the head was when the device reported having written it,
// as loud as Mix lets it out. The upright line is where every loop started.
// Where the display is too low for rings the loops lie as lanes, a lane's
// length what a ring's size is; where it is wide enough they lie beside the
// rings as well, each with its period in words.

import { denormalizeParam } from '../../../core/params'
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
  let ratio = 1 + offsetPercent * 0.01
  if (loops > 1) ratio = Math.min(ratio, Math.pow(Math.max(1, most / first), 1 / (loops - 1)))
  return Math.max(8, Math.min(most, Math.floor(first * Math.pow(ratio, k) + 0.5)))
}

/** What Mix lets out of the loops: the sine of a quarter turn of it (equal power). */
export const orbitsWet = (mix: number): number => Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)

// --- Where things stand ------------------------------------------------------

/** The least height at which the loops are drawn as rings. */
const RINGS_FROM = 72
/** The least room beside the rings for the lanes, and the room a period in words takes there. */
const LANES_FROM = 84
const PERIOD_WORDS = 38
/** The least room in a corner, clear of the outermost ring, for Length or Offset in words. */
const CORNER_FROM = 36
/** The most a lane takes of the height, and the height a line of words under the lanes takes. */
const LANE_PITCH_MOST = 24
const WORD_LINE = 12

/** The first ring's radius as a share of the reach: from the shortest Length to the longest. */
const FIRST_LEAST = 0.22
const FIRST_MOST = 0.5
/** How far out the outermost ring may stand, and the widest a gap gets, as shares of the reach. */
const RING_MOST = 0.98
const GAP_WIDEST = 0.26
/** The gap at the least Offset as a share of the gap at the most. */
const GAP_LEAST = 0.4
/** The first lane's length as a share of the room, and what each next lane adds. */
const LANE_LEAST = 0.3
const LANE_MOST = 0.7
const STEP_LEAST = 0.02
const STEP_MOST = 0.075

export interface OrbitsLay {
  /** The rings: their middle and how far out the outermost can reach. Null where the display is too low. */
  rings: { cx: number; cy: number; reach: number } | null
  /**
   * The lanes: where they start, how long the longest can be, the middle of
   * the first and the step to the next, and the room for a period in words
   * at each lane's right. `even` where every lane is one whole turn of its
   * loop, all as long: beside the rings, which carry Length and Offset.
   * Null beside rings with no room.
   */
  lanes: { x: number; long: number; y: number; pitch: number; words: number; even: boolean } | null
  /** The two ends and the two baselines of Length, Offset and Hold in words; null where there is no room for them. */
  words: { left: number; right: number; top: number; foot: number } | null
}

/** Where things stand in a display of this size while `count` loops turn. */
export function orbitsLay(size: Size, count: number): OrbitsLay {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const right = box.x + box.w
  const words = { left: box.x + 1, right: right - 1, top: box.y + 8, foot: box.y + box.h - 1 }
  if (size.height >= RINGS_FROM) {
    const reach = Math.max(8, Math.min(box.h / 2 - 3, (box.w - 6) / 2))
    const cy = box.y + box.h / 2
    const beside = box.w - 2 * reach - 10
    if (beside >= LANES_FROM) {
      // The rings to the left; a row for each loop that turns, over a line of words.
      const cx = box.x + reach + 3
      const pitch = Math.min(LANE_PITCH_MOST, (box.h - WORD_LINE) / count)
      const x = cx + reach + 10
      return {
        rings: { cx, cy, reach },
        lanes: {
          x,
          long: right - PERIOD_WORDS - 5 - x,
          y: box.y + pitch / 2,
          pitch,
          words: PERIOD_WORDS,
          even: true,
        },
        words: { ...words, left: x },
      }
    }
    // The rings in the middle, the words in the corners the outermost ring leaves free.
    const corner = box.w / 2 - Math.sqrt(Math.max(0, 10 * reach - 25))
    return {
      rings: { cx: box.x + box.w / 2, cy, reach },
      lanes: null,
      words: corner >= CORNER_FROM ? words : null,
    }
  }
  const wide = box.w >= 120 ? 34 : 0
  const pitch = Math.min(LANE_PITCH_MOST, box.h / count)
  return {
    rings: null,
    lanes: {
      x: box.x + 1,
      long: box.w - wide - 6,
      y: box.y + pitch / 2,
      pitch,
      words: 0,
      even: false,
    },
    words: wide > 0 ? words : null,
  }
}

/** How many loops turn: Loops, as the device rounds it. */
export const orbitsCount = (view: DisplayView): number =>
  clamp(Math.floor(view.value('loops') + 0.5), 2, ORBITS_MOST)

/** The widest gap between two of `count` rings: what lets them all stand at the longest Length. */
export const ringGapMost = (reach: number, count: number): number =>
  reach * Math.min(GAP_WIDEST, (RING_MOST - FIRST_MOST) / Math.max(1, count - 1))

/** The radius of ring `k` of `count`. */
export function ringRadius(view: DisplayView, reach: number, count: number, k: number): number {
  return (
    reach * lerp(FIRST_LEAST, FIRST_MOST, view.at('length')) +
    k * ringGapMost(reach, count) * lerp(GAP_LEAST, 1, view.at('offset'))
  )
}

/** The length of lane `k`: by Length and Offset as a ring's size is, or the whole room where the lanes are `even`. */
export function laneLength(
  view: DisplayView,
  lanes: Pick<NonNullable<OrbitsLay['lanes']>, 'long' | 'even'>,
  k: number,
): number {
  if (lanes.even) return lanes.long
  return (
    lanes.long * lerp(LANE_LEAST, LANE_MOST, view.at('length')) +
    k * lanes.long * lerp(STEP_LEAST, STEP_MOST, view.at('offset'))
  )
}

/** A length as it is said: "250 ms", "2.0 s", "12 s". */
export function orbitsTimeText(seconds: number): string {
  if (seconds < 0.9995) return `${Math.round(seconds * 1000)} ms`
  return `${seconds >= 9.95 ? Math.round(seconds) : seconds.toFixed(1)} s`
}

/** A period as it is said, to the millisecond, so two loops a hair apart read apart: "2.030 s". */
export function orbitsPeriodText(seconds: number): string {
  if (seconds < 0.9995) return `${(seconds * 1000).toFixed(1)} ms`
  return `${seconds.toFixed(seconds >= 9.9995 ? 2 : 3)} s`
}

/** Offset as it is said: each loop that much longer than the last. */
export function orbitsOffsetText(percent: number): string {
  return `+${percent >= 9.95 ? Math.round(percent) : percent.toFixed(1)} %`
}

// --- What a loop holds ------------------------------------------------------

/** How many stretches a loop's turn is kept in. */
export const ORBITS_BINS = 72

/** `kCeiling`: the level the device holds what a loop records to; a band is full there. */
export const ORBITS_FULL = 0.45
/**
 * A level as a share of a band's width: full at the level the device holds a
 * loop to, nothing this many dB under it.
 */
export const ORBITS_RANGE_DB = 42
export const bandShare = (level: number): number =>
  clamp(1 + gainToDb(level / ORBITS_FULL) / ORBITS_RANGE_DB, 0, 1)

/** How strongly the band of what a loop holds is laid, and the track under it. */
export const ORBITS_BAND = 0.62
const TRACK = INK.rule

interface OrbitsState {
  /** Each loop's head, carried between two readings. */
  tracks: (PhaseTrack | null)[]
  /** The level each loop reported having written, by where its head was. */
  held: Float32Array[]
  /** Where each loop's head was at the frame before; -1 for nowhere yet. */
  last: Float64Array
  /** The display's clock at the frame before, to know a stretch nobody watched. */
  seen: number | null
}

const blank = (state: OrbitsState, k: number): void => {
  state.tracks[k] = null
  state.last[k] = -1
  state.held[k].fill(0)
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
 * before. A loop the device reports as off or at rest holds nothing.
 */
function follow(frame: DisplayFrame<OrbitsState>, count: number): boolean {
  const { state } = frame
  const reading = frame.powered && frame.hasMeter('phase1')
  // More than a second nobody watched: what was written then is not known.
  if (state.seen !== null && frame.now - state.seen > 1) {
    for (let k = 0; k < ORBITS_MOST; k++) blank(state, k)
  }
  state.seen = frame.now
  let turning = false
  const length = frame.value('length')
  const offset = frame.value('offset')
  for (let k = 0; k < ORBITS_MOST; k++) {
    // orbits.h `meter`: a head's place in its turn, -1 for a loop that is off or at rest.
    const place = reading && k < count ? frame.meter(`phase${k + 1}`) : -1
    if (!(place >= 0)) {
      blank(state, k)
      continue
    }
    turning = true
    const read = place - Math.floor(place)
    const seconds = orbitsPeriod(k, count, length, offset, frame.sampleRate) / frame.sampleRate
    const track = state.tracks[k]
    state.tracks[k] =
      frame.dt > 0 || !track ? trackPhase(track, read, 1 / seconds, frame.dt) : track
    const now = state.tracks[k]?.phase ?? read
    const level = frame.meter(`level${k + 1}`)
    const written = Number.isFinite(level) && level > 0 ? level : 0
    const held = state.held[k]
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
      }
    }
    held[to] = before < 0 || went > 0 ? written : Math.max(held[to], written)
    state.last[k] = now
  }
  return turning
}

// --- Drawing ----------------------------------------------------------------

/** The band of what ring `k` holds: as wide at each stretch as its level, about the ring. */
function ringBand(
  frame: DisplayFrame<OrbitsState>,
  cx: number,
  cy: number,
  r: number,
  most: number,
  held: Float32Array,
  wet: number,
): void {
  const { ctx } = frame
  let any = false
  for (let b = 0; b < ORBITS_BINS; b++) if (held[b] * wet > 0) any = true
  if (!any) return
  ctx.beginPath()
  for (let b = 0; b <= ORBITS_BINS; b++) {
    const out = r + bandShare(held[b % ORBITS_BINS] * wet) * most
    if (b === 0) ctx.moveTo(cx + out * COS[b], cy + out * SIN[b])
    else ctx.lineTo(cx + out * COS[b], cy + out * SIN[b])
  }
  for (let b = ORBITS_BINS; b >= 0; b--) {
    const inner = r - bandShare(held[b % ORBITS_BINS] * wet) * most
    ctx.lineTo(cx + inner * COS[b], cy + inner * SIN[b])
  }
  ctx.closePath()
  ctx.globalAlpha = ORBITS_BAND
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
  held: Float32Array,
  wet: number,
): void {
  const { ctx } = frame
  let any = false
  for (let b = 0; b < ORBITS_BINS; b++) if (held[b] * wet > 0) any = true
  if (!any) return
  ctx.beginPath()
  for (let b = 0; b < ORBITS_BINS; b++) {
    const at = x + ((b + 0.5) / ORBITS_BINS) * long
    const up = y - bandShare(held[b] * wet) * most
    if (b === 0) ctx.moveTo(at, up)
    else ctx.lineTo(at, up)
  }
  for (let b = ORBITS_BINS - 1; b >= 0; b--) {
    ctx.lineTo(x + ((b + 0.5) / ORBITS_BINS) * long, y + bandShare(held[b] * wet) * most)
  }
  ctx.closePath()
  ctx.globalAlpha = ORBITS_BAND
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
  const first = ringRadius(frame, reach, count, 0)
  const last = ringRadius(frame, reach, count, count - 1)
  const gap = ringRadius(frame, reach, count, 1) - first
  // Where every loop started: heads all on this line are the loops as they began.
  rule(ctx, cx, cy - first + 2, cx, cy - last - 2.5, { colour: colours.ink, alpha: INK.back })
  for (let k = 0; k < count; k++) {
    const r = ringRadius(frame, reach, count, k)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.globalAlpha = TRACK
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
    ringBand(frame, cx, cy, r, Math.max(0.8, gap / 2 - 0.5), state.held[k], wet)
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
    const [x, y] = ringPoint(cx, cy, ringRadius(frame, reach, count, k), track ? track.phase : 0)
    head(frame, x, y, track !== null && wet > 0)
  }
}

function drawLanes(
  frame: DisplayFrame<OrbitsState>,
  lanes: NonNullable<OrbitsLay['lanes']>,
  count: number,
  wet: number,
  periods: readonly number[] | null,
): void {
  const { ctx, colours, state } = frame
  const most = Math.max(1, lanes.pitch / 2 - 1.5)
  for (let k = 0; k < count; k++) {
    const y = lanes.y + k * lanes.pitch
    const long = laneLength(frame, lanes, k)
    rule(ctx, lanes.x, y, lanes.x + long, y, { colour: colours.ink, alpha: TRACK })
    rule(ctx, lanes.x + long, y - 2, lanes.x + long, y + 2, {
      colour: colours.ink,
      alpha: INK.back,
    })
    laneBand(frame, lanes.x, y, long, most, state.held[k], wet)
    if (periods) {
      text(frame, orbitsPeriodText(periods[k]), lanes.x + lanes.long + 5 + lanes.words, y + 3, {
        align: 'right',
      })
    }
  }
  // Where every loop started.
  rule(ctx, lanes.x, lanes.y - most, lanes.x, lanes.y + (count - 1) * lanes.pitch + most, {
    colour: colours.ink,
    alpha: INK.back,
  })
  for (let k = 0; k < count; k++) {
    const track = state.tracks[k]
    const long = laneLength(frame, lanes, k)
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
  const lay = orbitsLay(view, count)
  const length = view.spec('length')
  const offset = view.spec('offset')
  if (lay.rings) {
    const { cx, cy, reach } = lay.rings
    const first = ringRadius(view, reach, count, 0)
    const widest = ringGapMost(reach, count)
    return [
      {
        key: 'length',
        name: 'Length',
        // Under the middle, on the first ring: pulled out is longer.
        x: cx,
        y: cy + first,
        drag: (_x: number, y: number) => ({
          length: length
            ? denormalizeParam(
                length,
                clamp(((y - cy) / reach - FIRST_LEAST) / (FIRST_MOST - FIRST_LEAST), 0, 1),
              )
            : 0,
        }),
        wheel: (steps: number) => nudge(view, 'length', steps),
        reset: () => ({ length: length?.default ?? 2 }),
      },
      {
        key: 'offset',
        name: 'Offset',
        // On the outermost ring: pulled out, every ring stands further from the last.
        x: cx + ringRadius(view, reach, count, count - 1),
        y: cy,
        drag: (x: number) => ({
          offset: offset
            ? denormalizeParam(
                offset,
                clamp(
                  ((x - cx - first) / ((count - 1) * widest) - GAP_LEAST) / (1 - GAP_LEAST),
                  0,
                  1,
                ),
              )
            : 0,
        }),
        wheel: (steps: number) => nudge(view, 'offset', steps),
        reset: () => ({ offset: offset?.default ?? 1.5 }),
      },
    ]
  }
  const lanes = lay.lanes
  if (!lanes) return []
  const first = laneLength(view, lanes, 0)
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
      // The end of the last lane: how much longer it is than the first, shared among the steps.
      x: lanes.x + laneLength(view, lanes, count - 1),
      y: lanes.y + (count - 1) * lanes.pitch,
      drag: (x: number) => ({
        offset: offset
          ? denormalizeParam(
              offset,
              clamp(
                ((x - lanes.x - first) / ((count - 1) * lanes.long) - STEP_LEAST) /
                  (STEP_MOST - STEP_LEAST),
                0,
                1,
              ),
            )
          : 0,
      }),
      wheel: (steps: number) => nudge(view, 'offset', steps),
      reset: () => ({ offset: offset?.default ?? 1.5 }),
    },
  ]
}

const orbits = plateDisplay<OrbitsState>({
  place: 'window',
  columns: 2,
  params: ['loops', 'length', 'offset', 'hold', 'mix'],
  // A long loop is silent between two passes of a short note for most of its turn.
  live: { meters: true, settle: 32 },
  info: 'Each ring is one loop, the innermost the shortest, and its dot is where that loop plays now. The band on a ring is what it holds. Dots all on the upright line are the loops as they started. Drag the inner point for Length and the outer for Offset. The wheel over a point moves it finely.',
  init: () => ({
    tracks: Array.from({ length: ORBITS_MOST }, () => null),
    held: Array.from({ length: ORBITS_MOST }, () => new Float32Array(ORBITS_BINS)),
    last: new Float64Array(ORBITS_MOST).fill(-1),
    seen: null,
  }),
  draw(frame) {
    ground(frame)
    const count = orbitsCount(frame)
    const lay = orbitsLay(frame, count)
    const wet = orbitsWet(frame.value('mix'))
    const holding = Math.round(frame.value('hold')) === 1
    follow(frame, count)
    const length = frame.value('length')
    const offset = frame.value('offset')
    if (lay.rings) drawRings(frame, lay.rings, count, wet, holding)
    if (lay.lanes) {
      const periods = lay.rings
        ? Array.from(
            { length: count },
            (_, k) => orbitsPeriod(k, count, length, offset, frame.sampleRate) / frame.sampleRate,
          )
        : null
      drawLanes(frame, lay.lanes, count, wet, periods)
    }
    if (lay.words) {
      // Beside the rings each lane says its own period, the first of them Length.
      if (!lay.lanes?.even) {
        text(frame, orbitsTimeText(length), lay.words.right, lay.words.top, { align: 'right' })
      }
      text(frame, orbitsOffsetText(offset), lay.words.right, lay.words.foot, { align: 'right' })
      if (holding && lay.rings) text(frame, 'Hold', lay.words.left, lay.words.foot)
      else if (holding && frame.height >= 44) {
        text(frame, 'Hold', lay.words.right, (lay.words.top + lay.words.foot) / 2 + 3, {
          align: 'right',
        })
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
