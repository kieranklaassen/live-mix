// The display of Reveal: the sound going in as a line, band by band as the
// device hears it, and what comes out as a filled shape on the same scale,
// so the valleys between the peaks are seen filling in. Both come from the
// device's own readings (`cpp/devices/reveal/reveal.h`); the dotted line is
// its formula for one quiet partial, with the points that set it. The scale
// is the device's own: dB under the loudest band of late, which is what its
// Floor is counted down from, so a quiet sound fills the picture as a loud
// one does and Floor's line stands where the knob says. A band with nothing
// in it lies under the foot of the scale and has no line: the line stops
// beside it and begins again after it, so a few clean notes are drawn as the
// few bands they are in and not as a row of boxes standing on the foot.

import {
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dbText,
  dbToGain,
  fillRect,
  follow,
  freqGrid,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  trace,
  xOfHz,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/**
 * The scale, in dB against the loudest band of late: that band a line of
 * words' room under the head, and Floor's lowest setting whole above the foot.
 */
export const REVEAL_TOP_DB = 12
export const REVEAL_FOOT_DB = -96

// --- The device's bands (`lay_out_bands` in reveal.h) ------------------------

/** The frame the device listens with (`Stft<2048, 512>`), and half of it plus one: its bins. */
const REVEAL_FRAME = 2048
const REVEAL_BINS = REVEAL_FRAME / 2 + 1
/** `kMaxBands`, `kFirstHz`, `kTopHz`, `kTopOfRange`, `kTwelfth`. */
export const REVEAL_MAX_BANDS = 88
const REVEAL_FIRST_HZ = 40
const REVEAL_TOP_HZ = 20000
const REVEAL_TOP_OF_RANGE = 0.45
const REVEAL_TWELFTH = 1.0594630943592953

export interface RevealBands {
  /** How many there are: 85 at 48 kHz. */
  count: number
  /** The middle of each, in Hz. */
  hz: Float32Array
  /** Where each begins and the last one ends, in Hz: a band is its bins, and a bin reaches half a bin either way. */
  edge: Float32Array
}

const laidOut = new Map<number, RevealBands>()

/**
 * The bands the device compares, as it lays them out for a sample rate:
 * single bins where a twelfth of an octave is narrower than a bin, a twelfth
 * of an octave each above that, from 40 Hz to 20 kHz.
 */
export function revealBands(sampleRate: number): RevealBands {
  const known = laidOut.get(sampleRate)
  if (known) return known
  const binHz = sampleRate / REVEAL_FRAME
  const topHz = Math.min(REVEAL_TOP_HZ, REVEAL_TOP_OF_RANGE * sampleRate)
  const topBin = clamp(Math.floor(topHz / binHz), 2, REVEAL_BINS - 2)
  const hz = new Float32Array(REVEAL_MAX_BANDS)
  const edge = new Float32Array(REVEAL_MAX_BANDS + 1)
  let count = 0
  let k = Math.max(1, Math.ceil(REVEAL_FIRST_HZ / binHz))
  while (k <= topBin && count < REVEAL_MAX_BANDS) {
    const next = Math.min(topBin + 1, Math.max(k + 1, Math.floor(k * REVEAL_TWELFTH + 0.5)))
    hz[count] = 0.5 * (k + next - 1) * binHz
    edge[count] = (k - 0.5) * binHz
    count += 1
    k = next
  }
  edge[count] = (k - 0.5) * binHz
  const bands = { count, hz, edge }
  laidOut.set(sampleRate, bands)
  return bands
}

// --- The device's readings (`meter` and the end of `compare`) ----------------

/** `kBandsPerReading`, `kReadings`, `kSteps`, `kLiftStepDb`, `kLevelStepDb`, `kLevelFootDb`. */
const REVEAL_PER_READING = 4
const REVEAL_READINGS = 22
const REVEAL_STEPS = 64
export const REVEAL_LIFT_STEP_DB = 0.5
export const REVEAL_LEVEL_STEP_DB = 1.5
export const REVEAL_LEVEL_FOOT_DB = -91.5
/** `kLowestFloorDb`: under this level, against a full-scale sine, nothing is lifted whatever Floor says. */
export const REVEAL_LOWEST_FLOOR_DB = -96
/** What a band that is not sounding is drawn at: under the foot of the scale. */
export const REVEAL_SILENT_DB = REVEAL_FOOT_DB - 6

const LIFT_READINGS: readonly string[] = Array.from(
  { length: REVEAL_READINGS },
  (_, r) => `lift${r + 1}`,
)
const LEVEL_READINGS: readonly string[] = Array.from(
  { length: REVEAL_READINGS },
  (_, r) => `level${r + 1}`,
)

/** Four bands out of one reading: six bits a band, the lowest band in the lowest bits. */
function unpack(packed: number, each: (index: number, steps: number) => void): void {
  let rest = Math.round(packed)
  if (!(rest > 0)) rest = 0
  for (let i = 0; i < REVEAL_PER_READING; i++) {
    const steps = rest % REVEAL_STEPS
    rest = (rest - steps) / REVEAL_STEPS
    each(i, steps)
  }
}

/**
 * Every band's lift (dB, 0 or more) and level (dB against the loudest band
 * of late, `REVEAL_SILENT_DB` for a band with nothing in it), out of the
 * device's forty-four readings.
 */
export function revealReadings(
  reading: (name: string) => number,
  lifts: Float32Array,
  levels: Float32Array,
): void {
  for (let r = 0; r < REVEAL_READINGS; r++) {
    unpack(reading(LIFT_READINGS[r]), (i, steps) => {
      const band = r * REVEAL_PER_READING + i
      if (band < lifts.length) lifts[band] = steps * REVEAL_LIFT_STEP_DB
    })
    unpack(reading(LEVEL_READINGS[r]), (i, steps) => {
      const band = r * REVEAL_PER_READING + i
      if (band < levels.length)
        levels[band] =
          steps > 0 ? REVEAL_LEVEL_FOOT_DB + steps * REVEAL_LEVEL_STEP_DB : REVEAL_SILENT_DB
    })
  }
}

// --- The device's formula (`compare` and `process`) --------------------------

/** `kKneeDb`, `kFocusFromHz`, `kFocusToHz`. */
const REVEAL_KNEE_DB = 6
const REVEAL_FOCUS_FROM_HZ = 60
const REVEAL_FOCUS_TO_HZ = 12000

/** How much of the lift Focus leaves at a frequency: all of it at 0, none at the far end when it is turned right over. */
export function revealFocus(focus: number, hz: number): number {
  const at = clamp(
    Math.log2(hz / REVEAL_FOCUS_FROM_HZ) / Math.log2(REVEAL_FOCUS_TO_HZ / REVEAL_FOCUS_FROM_HZ),
    0,
    1,
  )
  return focus >= 0 ? 1 - focus * (1 - at) : 1 + focus * at
}

/** How much of the lift a level keeps over Floor: none under it, all of it 6 dB over. */
export const revealOver = (levelDb: number, floorDb: number): number =>
  clamp((levelDb - floorDb) / REVEAL_KNEE_DB, 0, 1)

/**
 * What a band comes out at, as a gain on what it went in at, when the device
 * lifts it by `liftDb` and holds the level by `holdDb`: the last lines of
 * `process`. Mix crosses from the sound as it came to the lifted one, Output
 * trims the lifted one, and Listen leaves only what was added.
 */
export function revealHeard(view: DisplayView, liftDb: number, holdDb: number): number {
  const mix = clamp(view.value('mix'), 0, 1)
  const listen = view.value('listen') >= 0.5 ? 1 : 0
  const dry = (1 - mix) * (1 - listen)
  const wet = (mix + listen * (1 - mix)) * dbToGain(view.value('output'))
  return dry + wet * (dbToGain(liftDb) - listen) * dbToGain(holdDb)
}

// --- The example: one quiet partial -----------------------------------------

/** The dotted line is a partial at this level under the loudest band, this far under the loud sound around it. */
export const REVEAL_EXAMPLE_DB = -42
export const REVEAL_EXAMPLE_UNDER_DB = 30

/** The lift the device gives that partial at a frequency, in dB: Amount of how far under it is, no more than Range, as Focus and Floor leave it. */
export function revealExampleLift(view: DisplayView, hz: number): number {
  return (
    Math.min(view.value('amount') * REVEAL_EXAMPLE_UNDER_DB, view.value('range')) *
    revealFocus(view.value('focus'), hz) *
    revealOver(REVEAL_EXAMPLE_DB, view.value('floor'))
  )
}

/** Where that partial comes out, in dB, at a frequency. */
export function revealExampleDb(view: DisplayView, hz: number): number {
  return REVEAL_EXAMPLE_DB + gainToDb(Math.abs(revealHeard(view, revealExampleLift(view, hz), 0)))
}

// --- The picture ------------------------------------------------------------

const curveBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 4,
  y: 4,
  w: view.width - 8,
  h: view.height - 8,
})

const levelY = (db: number, box: Box): number => yOfDb(db, box, REVEAL_TOP_DB, REVEAL_FOOT_DB)
const levelAt = (y: number, box: Box): number => dbOfY(y, box, REVEAL_TOP_DB, REVEAL_FOOT_DB)

/** A parameter's range, or `fallback` for a name the device lacks. */
function rangeOf(view: DisplayView, param: string, fallback: [number, number]): [number, number] {
  const spec = view.spec(param)
  return spec ? [spec.min, spec.max] : fallback
}

const startOf = (view: DisplayView, param: string, fallback: number): number =>
  view.spec(param)?.default ?? fallback

/** Where the points stand across the display: Range, Amount, and Floor at the end of its line. */
const rangeX = (box: Box): number => box.x + 0.2 * box.w
const amountX = (box: Box): number => box.x + 0.5 * box.w
const floorX = (box: Box): number => box.x + box.w - 8

function revealHandles(view: DisplayView): DisplayHandle[] {
  const box = curveBox(view)
  const [amountMin, amountMax] = rangeOf(view, 'amount', [0, 1])
  const [rangeMin, rangeMax] = rangeOf(view, 'range', [0, 30])
  const [floorMin, floorMax] = rangeOf(view, 'floor', [-72, -24])
  return [
    {
      key: 'range',
      name: 'Range',
      // The most the example partial may be lifted, on the same scale as Amount's point.
      x: rangeX(box),
      y: levelY(REVEAL_EXAMPLE_DB + view.value('range'), box),
      drag: (_x, y) => ({
        range: clamp(levelAt(y, box) - REVEAL_EXAMPLE_DB, rangeMin, rangeMax),
      }),
      reset: () => ({ range: startOf(view, 'range', 12) }),
    },
    {
      key: 'amount',
      name: 'Amount',
      // Where Amount alone would bring the example partial: so much of the 30 dB it lies under.
      x: amountX(box),
      y: levelY(REVEAL_EXAMPLE_DB + view.value('amount') * REVEAL_EXAMPLE_UNDER_DB, box),
      drag: (_x, y) => ({
        amount: clamp(
          (levelAt(y, box) - REVEAL_EXAMPLE_DB) / REVEAL_EXAMPLE_UNDER_DB,
          amountMin,
          amountMax,
        ),
      }),
      reset: () => ({ amount: startOf(view, 'amount', 0.5) }),
    },
    {
      key: 'floor',
      name: 'Floor',
      x: floorX(box),
      y: levelY(view.value('floor'), box),
      drag: (_x, y) => ({ floor: clamp(levelAt(y, box), floorMin, floorMax) }),
      reset: () => ({ floor: startOf(view, 'floor', -48) }),
    },
  ]
}

/**
 * Where the device's floor stands on the display's scale, in dB under the
 * loudest band of late, when that band is at `loudestDb` against a full-scale
 * sine: Floor as it is set, or the lowest floor there is where that lies
 * higher (`floor_db` in `compare`).
 */
export const revealFloorDb = (view: DisplayView, loudestDb: number): number =>
  Math.max(view.value('floor'), REVEAL_LOWEST_FLOOR_DB - loudestDb)

/** How much of the plate lies over the display under Floor, where nothing is lifted. */
const REVEAL_VEIL = 0.45
/** A band counts as lifted in the picture from this much. */
const REVEAL_SEEN_DB = 0.2

interface RevealState {
  /** The device's readings as they last came, and as they are drawn: the steps eased. */
  readLifts: Float32Array
  readLevels: Float32Array
  lifts: Float32Array
  levels: Float32Array
  hold: number
  /** True until the first readings of a run have been taken as they are. */
  fresh: boolean
}

/** What a band comes out at, in dB, from what it went in at, its lift and the level hold. */
export function revealAfterDb(
  view: DisplayView,
  levelDb: number,
  liftDb: number,
  holdDb: number,
): number {
  if (levelDb <= REVEAL_SILENT_DB) return REVEAL_SILENT_DB
  return Math.max(REVEAL_SILENT_DB, levelDb + gainToDb(Math.abs(revealHeard(view, liftDb, holdDb))))
}

/**
 * A line of steps, two points to a band, with nothing drawn at a band that
 * is `silent` (under the foot of the scale): the pen is lifted over such a
 * band, where a line through every point would fall to the foot and stand
 * back up beside it.
 */
function stepped(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  silent: readonly boolean[],
  colour: string,
  alpha: number,
): void {
  ctx.beginPath()
  let down = false
  for (let b = 0; b < silent.length; b++) {
    const [left, right] = [points[2 * b], points[2 * b + 1]]
    if (silent[b]) {
      ctx.moveTo(left[0], left[1])
      ctx.moveTo(right[0], right[1])
      down = false
      continue
    }
    if (down) ctx.lineTo(left[0], left[1])
    else ctx.moveTo(left[0], left[1])
    ctx.lineTo(right[0], right[1])
    down = true
  }
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.setLineDash([])
  ctx.stroke()
  ctx.globalAlpha = 1
}

const reveal = plateDisplay<RevealState>({
  place: 'window',
  columns: 1,
  params: ['amount', 'range', 'floor', 'focus', 'output', 'mix', 'listen'],
  live: { meters: true, signal: true },
  info: 'The thin line is the sound going in, band by band, under its loudest of late. The shape is what comes out, its second colour the lift, the number the most of it. The dotted line is one partial 30 dB under the loud around it. Drag its points for Range and Amount, the one on the level line for Floor.',
  init: () => ({
    readLifts: new Float32Array(REVEAL_MAX_BANDS),
    readLevels: new Float32Array(REVEAL_MAX_BANDS).fill(REVEAL_SILENT_DB),
    lifts: new Float32Array(REVEAL_MAX_BANDS),
    levels: new Float32Array(REVEAL_MAX_BANDS).fill(REVEAL_SILENT_DB),
    hold: 0,
    fresh: true,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = curveBox(frame)
    const foot = box.y + box.h
    const bands = revealBands(frame.sampleRate)
    const running = frame.signal !== null && frame.powered

    // The device's bands as it reports them, the half-dB steps eased.
    if (running) {
      revealReadings((name) => frame.meter(name), state.readLifts, state.readLevels)
      const hold = Math.min(0, frame.meter('hold'))
      for (let b = 0; b < bands.count; b++) {
        state.lifts[b] = state.fresh
          ? state.readLifts[b]
          : follow(state.lifts[b], state.readLifts[b], frame.dt, 0.06, 0.06)
        state.levels[b] = state.fresh
          ? state.readLevels[b]
          : follow(state.levels[b], state.readLevels[b], frame.dt, 0.03, 0.12)
      }
      state.hold = state.fresh ? hold : follow(state.hold, hold, frame.dt, 0.06, 0.06)
      state.fresh = false
    } else {
      state.lifts.fill(0)
      state.levels.fill(REVEAL_SILENT_DB)
      state.hold = 0
      state.fresh = true
    }

    freqGrid(frame, box)
    dbGrid(frame, box, REVEAL_TOP_DB, REVEAL_FOOT_DB, 24)

    // Each band is flat over its own bins: the line going in and the shape
    // coming out are steps, as wide as the bands are.
    const before: Point[] = []
    const lower: Point[] = []
    const beforeSilent: boolean[] = []
    const lowerSilent: boolean[] = []
    let most = 0
    let mostDb = 0
    clipped(ctx, box, () => {
      const lifted: Box[] = []
      for (let b = 0; b < bands.count; b++) {
        const left = xOfHz(bands.edge[b], box)
        const right = xOfHz(bands.edge[b + 1], box)
        const went = state.levels[b]
        const comes = revealAfterDb(frame, went, state.lifts[b], state.hold)
        const wentY = levelY(went, box)
        const comesY = levelY(comes, box)
        before.push([left, wentY], [right, wentY])
        // What comes out is the line going in and, over it, what was lifted;
        // where a band comes out under what it went in at, a line of its own.
        lower.push([left, Math.max(wentY, comesY)], [right, Math.max(wentY, comesY)])
        // Under the foot of the scale there is nothing to draw: a band with
        // nothing in it, and one easing down to nothing or up from it.
        beforeSilent.push(went < REVEAL_FOOT_DB)
        lowerSilent.push(Math.min(went, comes) < REVEAL_FOOT_DB)
        if (comes - went > REVEAL_SEEN_DB)
          lifted.push({ x: left, y: comesY, w: right - left, h: wentY - comesY })
        if (went > REVEAL_SILENT_DB && state.lifts[b] > most) {
          most = state.lifts[b]
          mostDb = comes - went
        }
      }
      if (running) {
        // What comes out, filled to the foot; over it, in the second colour, what was lifted.
        ctx.beginPath()
        ctx.moveTo(lower[0][0], foot)
        for (const [x, y] of lower) ctx.lineTo(x, Math.min(y, foot))
        ctx.lineTo(lower[lower.length - 1][0], foot)
        ctx.closePath()
        ctx.globalAlpha = INK.fill
        ctx.fillStyle = colours.ink
        ctx.fill()
        ctx.globalAlpha = 1
        for (const patch of lifted) fillRect(ctx, patch, colours.accent, 1)
        stepped(ctx, lower, lowerSilent, colours.ink, INK.back)
        stepped(ctx, before, beforeSilent, colours.ink, 1)
      }
    })

    // Under Floor nothing is lifted: the plate is laid back over it, up to a
    // line. Where the device's lowest floor lies higher than the knob says
    // (a sound so quiet that Floor would reach under -96 dB), up to there.
    const handles = revealHandles(frame)
    const [range, amount, floor] = handles
    const veil = Math.min(
      floor.y,
      levelY(revealFloorDb(frame, running ? frame.meter('loudest') : 0), box),
    )
    fillRect(ctx, { x: box.x, y: veil, w: box.w, h: foot - veil }, colours.plate, REVEAL_VEIL)
    rule(ctx, box.x, floor.y, box.x + box.w, floor.y, { colour: colours.ink, alpha: INK.back })

    // One quiet partial as the settings have it come out, across the
    // spectrum; a point that stands off the line is tied to it.
    const example: Point[] = []
    const from = xOfHz(bands.edge[0], box)
    const steps = Math.max(8, Math.round((box.x + box.w - from) / 4))
    for (let i = 0; i <= steps; i++) {
      const x = from + ((box.x + box.w - from) * i) / steps
      // The frequency under a pixel, on the kit's scale of 20 Hz to 20 kHz.
      const hz = 20 * Math.pow(1000, clamp((x - box.x) / box.w, 0, 1))
      example.push([x, levelY(revealExampleDb(frame, hz), box)])
    }
    clipped(ctx, box, () => {
      trace(ctx, example, { colour: colours.ink, width: 1, alpha: INK.text, dash: [1, 3] })
      for (const point of [range, amount]) {
        const hz = 20 * Math.pow(1000, clamp((point.x - box.x) / box.w, 0, 1))
        const on = levelY(revealExampleDb(frame, hz), box)
        if (Math.abs(on - point.y) > 5)
          rule(ctx, point.x, point.y, point.x, on, { colour: colours.ink, alpha: INK.rule })
      }
    })

    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    // The most that is lifted now, as it is heard: the one figure it is watched by.
    label(frame, dbText(mostDb), box.x + box.w - 2, box.y + 9, 'right', 9)
    const hot = handles.find((point) => point.key === frame.hot)
    const words = hot
      ? `${hot.name}  ${
          hot.key === 'amount'
            ? `${Math.round(frame.value('amount') * 100)} %`
            : dbText(frame.value(hot.key))
        }`
      : frame.value('listen') >= 0.5
        ? 'Listen'
        : null
    if (words) label(frame, words, box.x + 2, box.y + 8, 'left')
  },
  handles: revealHandles,
})

export const REVEAL_FACES: Readonly<Record<string, PlateFace>> = {
  reveal: {
    display: reveal,
    face: ['amount', 'rise'],
  },
}
