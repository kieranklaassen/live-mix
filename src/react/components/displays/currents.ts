// The display of Currents: every band as a stream running past a mark that
// stands for now, drawn from the waves the device computes and kept in step
// with it by the place in its cycle that each wave reports. A stream's upper
// edge is the level a centred sound has on the left at that band's centre,
// its lower edge the level on the right, so a band that swells grows thick
// and one that drifts to a side leans that way. Beside the streams one cycle
// of a band is drawn large, where its depth and its shape can be taken hold of.

import { denormalizeParam } from '../../../core/params'
import {
  INK,
  clamp,
  clipped,
  dot,
  fillBetween,
  fillRect,
  ground,
  handle,
  label,
  rule,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The device's own numbers (cpp/devices/currents/currents.h) --------------

/** The constants of `currents.h`, by the names they have there. */
export const CURRENTS = {
  /** kMaxBands. */
  maxBands: 6,
  /** kPhaseWrap: a wave's place is reported in cycles and wraps here. */
  phaseWrap: 4096,
  /** kSpread: how much faster the highest band turns than the lowest at full Tide. */
  spread: 6.2831853,
  /** kSideRatio: a band's side wave against its level wave. */
  sideRatio: 0.618034,
  /** kTurn and kBreak: the share of a cycle the rise takes, at Shape 0 and what Shape 1 adds. */
  turn: 0.5,
  break: 0.42,
  /** kWander and kSkew: what Chance 1 does to a cycle's trough and crest, and to the crest's place. */
  wander: 0.6,
  skew: 0.2,
  /** kLeastTurn: the least share of a cycle a rise or a fall is given. */
  leastTurn: 0.06,
  /** kTrimDepth: the Depth past which a band's crest goes no higher. */
  trimDepth: 0.6,
  /** kLevelStart, kLevelStep, kSideStart, kSideStep: where the waves stand when the device starts. */
  levelStart: 0.35,
  levelStep: 0.618034,
  sideStart: 0.25,
  sideStep: 0.381966,
  /** kLevelSeed and kSideSeed, and what `seed_of` adds for each band. */
  levelSeed: 0x51c0ffee,
  sideSeed: 0x0dd5ea51,
  seedStep: 0x01000193,
} as const

/** `Currents::wander`: a number in [0, 1) for one cycle of one wave; `which` is the trough (0), the crest (1) or the crest's place (2). */
export function currentsWander(seed: number, cycle: number, which: number): number {
  let x = (seed ^ Math.imul(cycle, 0x9e3779b1) ^ Math.imul(which, 0x85ebca77)) >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return (x >>> 8) / 16777216
}

/** `Currents::seed_of`: the seed of a band's level wave, or of its side wave. */
export function currentsSeed(band: number, side: boolean): number {
  return (
    ((side ? CURRENTS.sideSeed : CURRENTS.levelSeed) + Math.imul(band, CURRENTS.seedStep)) >>> 0
  )
}

/** A place in cycles as the device keeps it: 0 up to `phaseWrap`. */
const wrapped = (phase: number): number =>
  phase - Math.floor(phase / CURRENTS.phaseWrap) * CURRENTS.phaseWrap

/**
 * `Currents::wave`: a wave at `phase` cycles, in −1..1. From this cycle's
 * trough up to its crest over `turn` of the cycle, then down to the next
 * cycle's trough, each way a half cosine; Chance moves the trough, the crest
 * and the crest's place, differently in every cycle.
 */
export function currentsWave(phase: number, turn: number, chance: number, seed: number): number {
  const p = wrapped(phase)
  const cycle = Math.min(CURRENTS.phaseWrap - 1, Math.floor(p))
  const at = p - cycle
  const reach = chance * CURRENTS.wander
  const trough = -1 + reach * currentsWander(seed, cycle, 0)
  const crest = 1 - reach * currentsWander(seed, cycle, 1)
  const rise = clamp(
    turn + chance * CURRENTS.skew * (2 * currentsWander(seed, cycle, 2) - 1),
    CURRENTS.leastTurn,
    1 - CURRENTS.leastTurn,
  )
  let from: number
  let to: number
  let t: number
  if (at < rise) {
    from = trough
    to = crest
    t = at / rise
  } else {
    from = crest
    to = -1 + reach * currentsWander(seed, (cycle + 1) & (CURRENTS.phaseWrap - 1), 0)
    t = (at - rise) / (1 - rise)
  }
  return from + (to - from) * (0.5 - 0.5 * Math.cos(Math.PI * t))
}

/** The share of a cycle the rise takes at a Shape (`kTurn + kBreak · Shape`). */
export const currentsTurn = (shape: number): number => CURRENTS.turn + CURRENTS.break * shape

/**
 * `Currents::level_trim`: what keeps a band's power over a cycle at the
 * input's, up to `kTrimDepth`; past it the crest stays where it stands there.
 */
export function currentsTrim(depth: number): number {
  const d = Math.min(depth, CURRENTS.trimDepth)
  const rest = 1 - 0.5 * d
  return 1 / Math.sqrt(rest * rest + 0.125 * d * d)
}

/**
 * Where a wave can be at `at` of a cycle (0..1), over every cycle there is:
 * the lowest and the highest of `Currents::wave` for any trough, crest and
 * place of the crest that Chance allows. Without Chance both are the plain
 * wave. The crest may stand anywhere from `turn − kSkew·Chance` to `turn +
 * kSkew·Chance` of the cycle, a trough as high as `−1 + kWander·Chance` and
 * a crest as low as `1 − kWander·Chance`.
 */
export function currentsReach(at: number, turn: number, chance: number): [number, number] {
  const ease = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1))
  const reach = chance * CURRENTS.wander
  const early = clamp(turn - chance * CURRENTS.skew, CURRENTS.leastTurn, 1 - CURRENTS.leastTurn)
  const late = clamp(turn + chance * CURRENTS.skew, CURRENTS.leastTurn, 1 - CURRENTS.leastTurn)
  const troughMost = -1 + reach
  const crestLeast = 1 - reach
  // The highest: the highest trough and a full crest, reached as early as may be and left as late.
  let high: number
  if (at < early) high = troughMost + (1 - troughMost) * ease(at / early)
  else if (at <= late) high = 1
  else high = 1 + (troughMost - 1) * ease((at - late) / (1 - late))
  // The lowest: from a full trough to the lowest crest, rising as late as may be or fallen as early.
  let low = Infinity
  if (at < late) low = Math.min(low, -1 + (crestLeast + 1) * ease(at / late))
  if (at >= early)
    low = Math.min(low, crestLeast - (1 + crestLeast) * ease((at - early) / (1 - early)))
  return [low, high]
}

/** `Currents::level_gain`: a band's gain for a level wave at `m`. */
export const currentsGain = (depth: number, m: number): number =>
  currentsTrim(depth) * (1 - 0.5 * depth * (1 - m))

/** How many times faster band `band` of `bands` turns than the lowest (`speeds` in `currents.h`). */
export function currentsRatio(tide: number, bands: number, band: number): number {
  const slot = Math.min(band, bands - 1)
  return Math.pow(CURRENTS.spread, (tide * slot) / (bands - 1))
}

/**
 * What a centred sound at a band's centre comes out as on each side, for a
 * level wave at `m` and a side wave at `s`: the band's gain placed with an
 * equal power law at Sway·s (`control` in `currents.h`), and Mix of the way
 * from the sound as it came (1 on both sides) to that.
 */
export function currentsHeard(
  depth: number,
  sway: number,
  mix: number,
  m: number,
  s: number,
): { left: number; right: number } {
  const gain = currentsGain(depth, m)
  const angle = (sway * s + 1) * (Math.PI / 4)
  return {
    left: 1 + mix * (gain * Math.SQRT2 * Math.cos(angle) - 1),
    right: 1 + mix * (gain * Math.SQRT2 * Math.sin(angle) - 1),
  }
}

// --- Where things stand -------------------------------------------------------

/** Where now stands across the streams: the past at its left, what comes at its right. */
const NOW_AT = 0.7
/**
 * How long one cycle of the lowest band is drawn, as a share of the past: at
 * the slowest Rate and at the fastest, and evenly along the knob between, so
 * the Rate ring travels as far for one part of the knob as for another.
 */
const CYCLE_SLOW = 0.9
const CYCLE_FAST = 0.3
/** The gain the top of the large cycle stands for: a little over the highest crest there is (`currentsTrim` past `kTrimDepth`). */
export const CYCLE_TOP = 1.5
/** The gain a stream's edge reaches its lane's edge at: a crest at Depth 1 gone all the way to one side. */
const LANE_TOP = currentsTrim(1) * Math.SQRT2

export interface CurrentsLayout {
  /** The large cycle: a phase of 0..1 across it, a gain of 0..CYCLE_TOP up it. */
  cycle: Box
  /** The streams. */
  lanes: Box
  nowX: number
  /** How many streams, and how high a lane is. */
  bands: number
  laneHeight: number
  /** How long one cycle of the lowest band is, in pixels. */
  periodPx: number
}

const bandsOf = (view: DisplayView): number =>
  clamp(Math.round(view.value('bands')), 3, CURRENTS.maxBands)

/** How long one cycle of the lowest band is drawn at a Rate (its place on the knob, 0..1), as a share of the past. */
const cycleShare = (at: number): number => CYCLE_SLOW + (CYCLE_FAST - CYCLE_SLOW) * clamp(at, 0, 1)

export function currentsLayout(view: DisplayView): CurrentsLayout {
  // The large cycle is given room enough for the Shape ring to travel: 0.42 of its width.
  const wide = clamp(Math.round(view.width * 0.3), 48, 72)
  const cycle: Box = { x: 4, y: 6, w: wide, h: view.height - 12 }
  const lanes: Box = { x: 4 + wide + 6, y: 3, w: view.width - 14 - wide, h: view.height - 6 }
  const bands = bandsOf(view)
  const past = lanes.w * NOW_AT
  return {
    cycle,
    lanes,
    nowX: lanes.x + past,
    bands,
    laneHeight: lanes.h / bands,
    periodPx: past * cycleShare(view.at('rate')),
  }
}

/** The middle of band `band`'s lane: the lowest band at the foot. */
export const currentsLaneY = (lay: CurrentsLayout, band: number): number =>
  lay.lanes.y + lay.lanes.h - (band + 0.5) * lay.laneHeight

/** Where a phase (0..1) and a gain stand in the large cycle. */
const cycleX = (lay: CurrentsLayout, phase: number): number =>
  lay.cycle.x + 5 + phase * (lay.cycle.w - 10)
const cycleY = (lay: CurrentsLayout, gain: number): number =>
  lay.cycle.y + lay.cycle.h * (1 - clamp(gain, 0, CYCLE_TOP) / CYCLE_TOP)

/** A band's gain as it is heard through Mix, for a level wave at `m`. */
const heardGain = (depth: number, mix: number, m: number): number =>
  1 + mix * (currentsGain(depth, m) - 1)

/** How far the Depth ring travels: with the swing while Mix leaves it room, never less than half. */
const depthTravel = (view: DisplayView): number => Math.max(0.5, view.value('mix'))

/** The Depth at which a trough is heard at `gain` through a Mix of `travel`: the trough falls as Depth rises. */
function depthOfTrough(gain: number, travel: number): number {
  const wanted = clamp(1 + (gain - 1) / travel, 0, 1)
  let low = 0
  let high = 1
  for (let n = 0; n < 40; n++) {
    const middle = (low + high) / 2
    if (currentsGain(middle, -1) > wanted) low = middle
    else high = middle
  }
  return (low + high) / 2
}

/**
 * The three rings. Depth stands at the left end of the large cycle, on the
 * trough: up and down sets how far a band falls. Shape stands on the crest:
 * left and right sets how late in the cycle it comes. Rate stands on the
 * lowest stream one of its cycles before now: nearer to now is faster.
 */
function currentsHandles(view: DisplayView): DisplayHandle[] {
  const lay = currentsLayout(view)
  const depth = view.value('depth')
  const shape = view.value('shape')
  const rate = view.value('rate')
  const mix = view.value('mix')
  const travel = depthTravel(view)
  const depthSpec = view.spec('depth')
  const shapeSpec = view.spec('shape')
  const rateSpec = view.spec('rate')
  const troughY = cycleY(lay, heardGain(depth, travel, -1))
  const crestX = cycleX(lay, currentsTurn(shape))
  const rateX = lay.nowX - lay.periodPx
  const past = lay.nowX - lay.lanes.x
  return [
    {
      key: 'depth',
      name: 'Depth',
      x: cycleX(lay, 0),
      y: troughY,
      drag: (_x, toY) => ({
        depth:
          Math.abs(toY - troughY) < 1e-6
            ? depth
            : depthOfTrough(
                CYCLE_TOP * (1 - clamp((toY - lay.cycle.y) / lay.cycle.h, 0, 1)),
                travel,
              ),
      }),
      reset: () => ({ depth: depthSpec?.default ?? depth }),
    },
    {
      key: 'shape',
      name: 'Shape',
      x: crestX,
      y: cycleY(lay, heardGain(depth, mix, 1)),
      drag: (toX) => ({
        shape:
          Math.abs(toX - crestX) < 1e-6
            ? shape
            : clamp(
                ((toX - lay.cycle.x - 5) / (lay.cycle.w - 10) - CURRENTS.turn) / CURRENTS.break,
                0,
                1,
              ),
      }),
      reset: () => ({ shape: shapeSpec?.default ?? shape }),
    },
    {
      key: 'rate',
      name: 'Rate',
      x: rateX,
      y: currentsLaneY(lay, 0),
      drag: (toX) => {
        if (Math.abs(toX - rateX) < 1e-6 || !rateSpec) return { rate }
        const at = ((lay.nowX - toX) / past - CYCLE_SLOW) / (CYCLE_FAST - CYCLE_SLOW)
        return { rate: denormalizeParam(rateSpec, clamp(at, 0, 1)) }
      },
      reset: () => ({ rate: rateSpec?.default ?? rate }),
    },
  ]
}

/** How long a cycle lasts, as it is said: "2.5 s", "10 s", "200 s". */
export function cycleText(seconds: number): string {
  return seconds < 9.95 ? `${seconds.toFixed(1)} s` : `${Math.round(seconds)} s`
}

/** Where every wave stands, in cycles: the level wave and the side wave of each band. */
export interface CurrentsPhases {
  level: number[]
  side: number[]
}

/** Where the waves stand when the device starts (`init` in `currents.h`). */
export function currentsStart(): CurrentsPhases {
  const level: number[] = []
  const side: number[] = []
  for (let band = 0; band < CURRENTS.maxBands; band++) {
    const l = CURRENTS.levelStart + band * CURRENTS.levelStep
    const d = CURRENTS.sideStart + band * CURRENTS.sideStep
    level.push(l - Math.floor(l))
    side.push(d - Math.floor(d))
  }
  return { level, side }
}

/**
 * Where the waves stand now: the device's own readings. Before the first of
 * them arrives every reading is 0, which no running device reports (its waves
 * start apart and turn at different speeds), and the picture then stands
 * where the device starts.
 */
export function currentsPhases(frame: Pick<DisplayFrame, 'meter'>): CurrentsPhases {
  const level: number[] = []
  const side: number[] = []
  let any = false
  for (let band = 0; band < CURRENTS.maxBands; band++) {
    level.push(frame.meter(`level${band + 1}`))
    side.push(frame.meter(`side${band + 1}`))
    if (level[band] !== 0 || side[band] !== 0) any = true
  }
  return any ? { level, side } : currentsStart()
}

const currents = plateDisplay({
  place: 'strip',
  params: ['depth', 'sway', 'rate', 'tide', 'bands', 'shape', 'chance', 'mix'],
  live: { meters: true },
  info: 'Each band is a stream running to the left, the lowest at the foot: its upper edge is its level on the left, its lower edge its level on the right, and the bar is now. The wave is one cycle of a band, shaded where Chance can take it. Rings set Depth, Shape and, on the lowest stream, Rate.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const lay = currentsLayout(frame)
    const depth = frame.value('depth')
    const sway = frame.value('sway')
    const tide = frame.value('tide')
    const chance = frame.value('chance')
    const mix = frame.value('mix')
    const turn = currentsTurn(frame.value('shape'))

    // --- One cycle, large ---
    const unityY = cycleY(lay, 1)
    rule(ctx, lay.cycle.x, unityY, lay.cycle.x + lay.cycle.w, unityY, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    const [depthRing, shapeRing, rateRing] = currentsHandles(frame)
    // The line the trough lies on: the one Depth is taken by.
    rule(ctx, lay.cycle.x, depthRing.y, lay.cycle.x + lay.cycle.w, depthRing.y, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    const plain: Point[] = []
    const highest: Point[] = []
    const lowest: Point[] = []
    const steps = Math.max(8, Math.round(lay.cycle.w - 10))
    for (let n = 0; n <= steps; n++) {
      const phase = n / steps
      const t = phase < turn ? phase / turn : (phase - turn) / (1 - turn)
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * t)
      // The plain cycle, and how far from it Chance can take any one cycle: up and down, early and late.
      const m = phase < turn ? -1 + 2 * ease : 1 - 2 * ease
      const [low, high] = currentsReach(phase, turn, chance)
      const x = cycleX(lay, phase)
      plain.push([x, cycleY(lay, heardGain(depth, mix, m))])
      highest.push([x, cycleY(lay, heardGain(depth, mix, high))])
      lowest.push([x, cycleY(lay, heardGain(depth, mix, low))])
    }
    if (chance > 0) fillBetween(ctx, highest, lowest, colours.ink, INK.fill)
    // How long one cycle of the lowest band takes: in the corner of the large
    // cycle that a rising wave leaves free, over the Depth ring's highest
    // place, where it covers no stream. Under the wave and its dot, which an
    // early crest carries through that corner.
    label(frame, cycleText(1 / frame.value('rate')), lay.cycle.x + 2, lay.cycle.y + 6)
    trace(ctx, plain, { colour: colours.ink, width: 1.5 })
    // Where the lowest band is in its cycle, and how high: its own cycle, which Chance has moved.
    const phases = currentsPhases(frame)
    const lowestAt = wrapped(phases.level[0])
    dot(
      ctx,
      cycleX(lay, lowestAt - Math.floor(lowestAt)),
      cycleY(
        lay,
        heardGain(depth, mix, currentsWave(phases.level[0], turn, chance, currentsSeed(0, false))),
      ),
      2.5,
      colours.accent,
      { ring: colours.ink },
    )

    // --- The streams ---
    const unit = lay.laneHeight / 2 / LANE_TOP
    const right = lay.lanes.x + lay.lanes.w
    rule(ctx, lay.nowX, lay.lanes.y, lay.nowX, lay.lanes.y + lay.lanes.h, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    clipped(ctx, lay.lanes, () => {
      for (let band = 0; band < lay.bands; band++) {
        const middle = currentsLaneY(lay, band)
        const ratio = currentsRatio(tide, lay.bands, band)
        const level = phases.level[band]
        const side = phases.side[band]
        const levelSeed = currentsSeed(band, false)
        const sideSeed = currentsSeed(band, true)
        /** The stream's two edges at so many cycles of the lowest band from now. */
        const edges = (cycles: number): [number, number] => {
          const heard = currentsHeard(
            depth,
            sway,
            mix,
            currentsWave(level + cycles * ratio, turn, chance, levelSeed),
            currentsWave(
              side + cycles * ratio * CURRENTS.sideRatio,
              CURRENTS.turn,
              chance,
              sideSeed,
            ),
          )
          return [
            middle - Math.min(LANE_TOP, heard.left) * unit,
            middle + Math.min(LANE_TOP, heard.right) * unit,
          ]
        }
        rule(ctx, lay.lanes.x, middle, right, middle, { colour: colours.ink, alpha: INK.grid })
        const pastUpper: Point[] = []
        const pastLower: Point[] = []
        const nextUpper: Point[] = []
        const nextLower: Point[] = []
        const add = (x: number): void => {
          const [upper, lower] = edges((x - lay.nowX) / lay.periodPx)
          if (x <= lay.nowX) {
            pastUpper.push([x, upper])
            pastLower.push([x, lower])
          }
          if (x >= lay.nowX) {
            nextUpper.push([x, upper])
            nextLower.push([x, lower])
          }
        }
        for (let x = lay.lanes.x; x < lay.nowX; x += 1) add(x)
        add(lay.nowX)
        for (let x = lay.nowX + 1; x < right; x += 1) add(x)
        add(right)
        fillBetween(ctx, pastUpper, pastLower, colours.ink, INK.text)
        fillBetween(ctx, nextUpper, nextLower, colours.ink, INK.fill * 1.5)
        // Now: from the level on the left up to the level on the right, never less than a mark.
        const [upper, lower] = edges(0)
        const tall = Math.max(1.5, lower - upper)
        fillRect(
          ctx,
          { x: lay.nowX - 1, y: (upper + lower) / 2 - tall / 2, w: 2, h: tall },
          colours.accent,
        )
      }
    })
    handle(frame, rateRing.x, rateRing.y, { hot: frame.hot === rateRing.key })
    handle(frame, shapeRing.x, shapeRing.y, { hot: frame.hot === shapeRing.key })
    handle(frame, depthRing.x, depthRing.y, { hot: frame.hot === depthRing.key })
  },
  handles: currentsHandles,
})

export const CURRENTS_FACES: Readonly<Record<string, PlateFace>> = {
  currents: {
    display: currents,
    face: ['depth', 'sway', 'rate', 'tide'],
  },
}
