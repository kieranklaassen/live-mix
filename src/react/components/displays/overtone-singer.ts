// The display of the Overtone Singer: the harmonics of its root as a ladder,
// the spectrum of what comes out behind it, and the curve of the resonance
// standing on the harmonic the device says it is on now. Across is frequency
// in harmonics of the root, evenly spaced, so the resonance (which is a share
// of the root wide wherever it stands) keeps its shape as it moves; up is
// what it does to a frequency, in dB. Every number here is the device's own
// (`cpp/devices/overtone-singer/overtone_singer.h`).

import {
  FLOOR_DB,
  INK,
  clamp,
  clipped,
  dbOfY,
  dot,
  fillRect,
  fillTo,
  ground,
  handle,
  label,
  lerp,
  rule,
  text,
  trace,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/** The resonance's width in roots at Focus 0 and at Focus 1 (`kWidthWide`, `kWidthNarrow`). */
export const SINGER_WIDTH_WIDE = 2
export const SINGER_WIDTH_NARROW = 0.05
/** The lift on the resonance's centre is this over the square root of its width (`kLift`). */
export const SINGER_LIFT = 14.142136
/** Each of the two stages is the width over this, so the two in series are the width (`kStageShare`). */
export const SINGER_STAGE_SHARE = 0.6435943

/** From over the lift at the highest Focus (36 dB) down to what a Drone of 0.16 leaves around the resonance. */
export const SINGER_TOP_DB = 38
export const SINGER_FOOT_DB = -32
/**
 * The harmonics at the left and the right edge: the root stands just inside,
 * and right of the 16th there is room for its point, its number and the Drone point.
 */
export const SINGER_FROM = 0.5
export const SINGER_TO = 17.5
/** The spectrum behind runs from full scale at the top down to this at the foot. */
const SPECTRUM_FOOT_DB = -84
/** How far under the foot a Drone of nothing is taken to lie, in dB of the scale, for a hand that takes it there. */
const DRONE_UNDER_DB = 6
/** How far inside the right edge the Drone point stands, so its ring is whole. */
const DRONE_INSET = 2
/** What a notch of the wheel over Low or High moves Focus by: the lift's line is a fifth of the plot high, so a hand on it sets Focus in twentieths. */
const FOCUS_NOTCH = 0.02
/** The harmonics the melody can visit (`low` and `high`). */
const HARMONIC_LEAST = 2
const HARMONIC_MOST = 16
/** The pattern choices that are drawn apart: Down starts at the top, Hold does not travel. */
const PATTERN_DOWN = 2
const PATTERN_HOLD = 5

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

/** The resonance's width at a Focus, in roots: from wide to narrow on a scale of equal ratios (`width_of`). */
export const singerWidth = (focus: number): number =>
  SINGER_WIDTH_WIDE * Math.pow(SINGER_WIDTH_NARROW / SINGER_WIDTH_WIDE, clamp(focus, 0, 1))

/** The lift on the resonance's centre at a Focus, in dB: 20 at Focus 0, 36 at Focus 1, a straight line between. */
export const singerLiftDb = (focus: number): number =>
  20 * Math.log10(SINGER_LIFT / Math.sqrt(singerWidth(focus)))

/** The root note in Hz (`root_hz`): note 0 is C, and octave 4 holds middle C. */
export const singerRootHz = (root: number, octave: number): number =>
  440 * Math.pow(2, (12 * (Math.round(octave) + 1) + Math.round(root) - 69) / 12)

/**
 * What the bilinear transform leaves of a band-pass's width on `turn` radians
 * a sample (`width_kept`): sin(turn) / turn, as the device's own series. Each
 * stage's Q is multiplied by it, so the width is what Focus says at any rate.
 */
export function singerWidthKept(turn: number): number {
  const t2 = turn * turn
  return 1 - (t2 / 6) * (1 - (t2 / 20) * (1 - t2 / 42))
}

/** `kit::tan_prewarp`: the tangent the device's filters are set with. */
function tanPrewarp(x: number): number {
  if (x > 0.7) return Math.tan(x)
  const x2 = x * x
  return (x * (15 - x2)) / (15 - 6 * x2)
}

export interface SingerSetting {
  focus: number
  drone: number
  mix: number
  /** What the ceiling leaves of the lift over the drone on the centre, as a gain (the `ceiling` reading): 1 when it holds nothing. */
  held?: number
}

/**
 * What the Overtone Singer does to a frequency while its resonance stands on
 * `position` (a harmonic of `rootHz`, a fraction while it glides), in dB.
 * Ported from `OvertoneSinger::process`: wet = (a + ρ·H)²(x), two peaks in
 * series, where a is Drone, H one state-variable band-pass (the analog one at
 * the frequency the tangent warps to, its Q set for the width the transform
 * leaves) standing on root × position, and ρ the reach of each peak: √lift − a
 * when the ceiling holds nothing, and less when it does, so that the lift over
 * the drone on the centre, (a + ρ)² − a², is `held` of lift − a². Mix
 * crossfades with the dry sound. It is kept as a complex number because the
 * parts add with their phases.
 */
export function singerDb(
  setting: SingerSetting,
  rootHz: number,
  position: number,
  sampleRate: number,
): (hz: number) => number {
  const width = singerWidth(setting.focus)
  const centre = clamp(rootHz * position, 5, 0.49 * sampleRate)
  const g = tanPrewarp((Math.PI * centre) / sampleRate)
  const q =
    ((SINGER_STAGE_SHARE * position) / width) * singerWidthKept((2 * Math.PI * centre) / sampleRate)
  const k = 1 / Math.max(q, 0.1)
  const { drone, mix } = setting
  const through = drone * drone
  const lift = SINGER_LIFT / Math.sqrt(width)
  const reach = Math.sqrt(through + (setting.held ?? 1) * (lift - through)) - drone
  return (hz) => {
    const w = Math.tan((Math.PI * clamp(hz, 0, 0.499 * sampleRate)) / sampleRate) / g
    // One stage is j·k·w / (1 − w² + j·k·w), and one peak the drone and the reach of it.
    const denRe = 1 - w * w
    const denIm = k * w
    const den = denRe * denRe + denIm * denIm
    const peakRe = drone + (reach * k * w * denIm) / den
    const peakIm = (reach * k * w * denRe) / den
    const outRe = 1 - mix + mix * (peakRe * peakRe - peakIm * peakIm)
    const outIm = mix * 2 * peakRe * peakIm
    const power = outRe * outRe + outIm * outIm
    return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
  }
}

/** The part of the display the curve is drawn in: all of it but a line of numbers at the foot. */
export function singerPlot(view: Pick<DisplayView, 'width' | 'height'>): Box {
  const h = view.height - 8
  return { x: 4, y: 4, w: view.width - 8, h: h >= 60 ? h - 10 : h }
}

export const xOfHarmonic = (harmonic: number, plot: Box): number =>
  plot.x + ((harmonic - SINGER_FROM) / (SINGER_TO - SINGER_FROM)) * plot.w

export const harmonicOfX = (x: number, plot: Box): number =>
  SINGER_FROM + ((x - plot.x) / plot.w) * (SINGER_TO - SINGER_FROM)

/** The Drone that leaves the sound around the resonance at the foot of the scale. */
const DRONE_AT_FOOT = Math.pow(10, SINGER_FOOT_DB / 40)

/**
 * Where a Drone stands on the scale: the level it leaves around the
 * resonance, its square, in dB. That has no end as Drone goes to nothing, so
 * under the foot, where nothing is drawn, the scale runs straight on to
 * `DRONE_UNDER_DB` below it at a Drone of 0: a hand that takes the point from
 * the edge has a finite way to bring it back.
 */
export function droneScaleDb(drone: number): number {
  if (drone >= DRONE_AT_FOOT) return 40 * Math.log10(Math.min(drone, 1))
  return SINGER_FOOT_DB - DRONE_UNDER_DB * (1 - Math.max(drone, 0) / DRONE_AT_FOOT)
}

export function droneOfScaleDb(db: number): number {
  if (db >= SINGER_FOOT_DB) return Math.min(1, Math.pow(10, db / 40))
  return DRONE_AT_FOOT * clamp(1 - (SINGER_FOOT_DB - db) / DRONE_UNDER_DB, 0, 1)
}

/** A parameter's range, or `fallback` for a name the device lacks. */
function rangeOf(view: DisplayView, param: string, fallback: [number, number]): [number, number] {
  const spec = view.spec(param)
  return spec ? [spec.min, spec.max] : fallback
}

const startOf = (view: DisplayView, param: string, fallback: number): number =>
  view.spec(param)?.default ?? fallback

function singerHandles(view: DisplayView): DisplayHandle[] {
  const plot = singerPlot(view)
  const low = view.value('low')
  const high = view.value('high')
  const drone = view.value('drone')
  const [least, most] = rangeOf(view, 'low', [HARMONIC_LEAST, HARMONIC_MOST])
  const [droneMin, droneMax] = rangeOf(view, 'drone', [0, 1])
  const [focusMin, focusMax] = rangeOf(view, 'focus', [0, 1])
  // The wheel over either end of the range is Focus alone, a fiftieth a notch.
  const focusWheel = (steps: number): Record<string, number> => ({
    focus: clamp(
      Math.round((view.value('focus') + steps * FOCUS_NOTCH) * 100) / 100,
      focusMin,
      focusMax,
    ),
  })
  // The lift is a straight line in Focus, so a height is one Focus.
  const none = singerLiftDb(0)
  const all = singerLiftDb(1)
  const liftY = yOfDb(singerLiftDb(view.value('focus')), plot, SINGER_TOP_DB, SINGER_FOOT_DB)
  const focusAt = (y: number): number =>
    clamp((dbOfY(y, plot, SINGER_TOP_DB, SINGER_FOOT_DB) - none) / (all - none), 0, 1)
  const harmonicAt = (x: number, from: number, to: number): number =>
    clamp(Math.round(harmonicOfX(x, plot)), from, to)
  const droneDb = droneScaleDb(drone)
  const droneShown = Math.max(droneDb, SINGER_FOOT_DB)
  // An end stops at the other, so Low stays the low one. With the two ends on
  // one harmonic there is one point, and the hand that takes it cannot say
  // which end it wants: the way it pulls says. The harmonic they stood on is
  // kept for as long as the hand holds, and the range runs from it to the hand.
  const endDrag =
    (end: 'low' | 'high') =>
    (x: number, y: number, hold?: DisplayHold): Record<string, number> => {
      const kept = hold ?? {}
      kept.joined ??= low === high ? low : 0
      const focus = focusAt(y)
      if (kept.joined > 0) {
        const at = harmonicAt(x, least, most)
        return { low: Math.min(at, kept.joined), high: Math.max(at, kept.joined), focus }
      }
      return end === 'low'
        ? { low: harmonicAt(x, least, Math.max(low, high)), focus }
        : { high: harmonicAt(x, Math.min(low, high), most), focus }
    }
  return [
    {
      key: 'low',
      name: 'Low',
      // The two ends of the melody's range stand at the height Focus lifts the
      // resonance to: across is the harmonic, up and down is Focus.
      x: xOfHarmonic(low, plot),
      y: liftY,
      drag: endDrag('low'),
      wheel: focusWheel,
      reset: () => ({ low: startOf(view, 'low', 6), focus: startOf(view, 'focus', 0.6) }),
    },
    {
      key: 'high',
      name: 'High',
      x: xOfHarmonic(high, plot),
      y: liftY,
      drag: endDrag('high'),
      wheel: focusWheel,
      reset: () => ({ high: startOf(view, 'high', 12), focus: startOf(view, 'focus', 0.6) }),
    },
    {
      key: 'drone',
      name: 'Drone',
      // At the right edge, on the level Drone leaves around the resonance. A
      // Drone that leaves less than the foot of the scale waits at the foot,
      // and is moved from where it lies under it.
      x: plot.x + plot.w - DRONE_INSET,
      y: yOfDb(droneShown, plot, SINGER_TOP_DB, SINGER_FOOT_DB),
      drag: (_x: number, y: number, hold?: DisplayHold) => {
        const kept = hold ?? {}
        kept.past ??= droneDb - droneShown
        const to = dbOfY(y, plot, SINGER_TOP_DB, SINGER_FOOT_DB) + kept.past
        return { drone: clamp(droneOfScaleDb(to), droneMin, droneMax) }
      },
      reset: () => ({ drone: startOf(view, 'drone', 1) }),
    },
  ]
}

/**
 * A response across the plot: a point at every pixel and at each of
 * `through` (harmonics), so a resonance narrower than a pixel is drawn to its
 * top. The points run past the plot where the curve does; clip when drawing.
 */
function curvePoints(
  plot: Box,
  db: (harmonic: number) => number,
  through: readonly number[],
): Point[] {
  const at: number[] = []
  for (let x = 0; x <= plot.w; x += 1) at.push(harmonicOfX(plot.x + x, plot))
  for (const harmonic of through)
    if (harmonic > SINGER_FROM && harmonic < SINGER_TO) at.push(harmonic)
  at.sort((a, b) => a - b)
  return at.map((harmonic): Point => [
    xOfHarmonic(harmonic, plot),
    yOfDb(
      clamp(db(harmonic), SINGER_FOOT_DB - 24, SINGER_TOP_DB + 24),
      plot,
      SINGER_TOP_DB,
      SINGER_FOOT_DB,
    ),
  ])
}

/** The harmonics a curve must pass through around a resonance on `position`: its top and its two flanks. */
function around(position: number, width: number): number[] {
  const out = [position]
  for (const share of [0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.5, 2, 3, 4])
    out.push(position - share * width, position + share * width)
  return out
}

/** The spectrum of what comes out, on the display's own axis: a fill from the foot up to each column's level. */
function spectrumBehind(
  frame: Paint & Pick<DisplayFrame, 'signal'>,
  plot: Box,
  rootHz: number,
): void {
  const bins = frame.signal?.spectrum
  const binHz = frame.signal?.binHz ?? 0
  if (!bins || binHz <= 0) return
  const foot = plot.y + plot.h
  const columns = Math.max(2, Math.floor(plot.w / 2))
  const hzAt = (column: number): number =>
    rootHz * harmonicOfX(plot.x + (column / columns) * plot.w, plot)
  const points: Point[] = []
  let any = false
  for (let c = 0; c <= columns; c++) {
    const from = hzAt(c - 0.5)
    const to = hzAt(c + 0.5)
    let db = -Infinity
    if (to - from < binHz) {
      // A bin is wider than a column: read between two bins.
      const bin = clamp((from + to) / 2 / binHz, 1, bins.length - 1)
      const below = Math.floor(bin)
      const above = Math.min(bins.length - 1, below + 1)
      db = lerp(bins[below], bins[above], bin - below)
    } else {
      // The loudest bin of the column, so a narrow peak is kept.
      const first = clamp(Math.ceil(from / binHz), 1, bins.length - 1)
      const last = clamp(Math.floor(to / binHz), first, bins.length - 1)
      for (let i = first; i <= last; i++) if (bins[i] > db) db = bins[i]
    }
    if (!Number.isFinite(db)) db = SPECTRUM_FOOT_DB
    if (db > SPECTRUM_FOOT_DB) any = true
    points.push([
      plot.x + (c / columns) * plot.w,
      clamp(yOfDb(db, plot, 0, SPECTRUM_FOOT_DB), plot.y, foot),
    ])
  }
  if (any) fillTo(frame.ctx, points, foot, frame.colours.ink, 0.5)
}

/**
 * Words at a corner of the plot with none of `points` under them: the head's
 * left, the head's right, then the foot's two corners.
 */
function caption(
  frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>,
  plot: Box,
  points: readonly { x: number; y: number }[],
  words: string,
): void {
  frame.ctx.font = `8px ${frame.fontFamily}`
  const width = frame.ctx.measureText(words).width
  const corners = [
    { left: true, head: true },
    { left: false, head: true },
    { left: true, head: false },
    { left: false, head: false },
  ]
  const free = corners.find(({ left, head }) => {
    const from = left ? plot.x + 2 : plot.x + plot.w - 2 - width
    return points.every((point) => {
      // A point in hand is 5 px to its rim.
      const across = point.x > from - 5 && point.x < from + width + 5
      const inside = head ? point.y < plot.y + 17 : point.y > plot.y + plot.h - 17
      return !(across && inside)
    })
  })
  const { left, head } = free ?? corners[0]
  label(
    frame,
    words,
    left ? plot.x + 2 : plot.x + plot.w - 2,
    head ? plot.y + 8 : plot.y + plot.h - 3,
    left ? 'left' : 'right',
  )
}

const overtoneSinger = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['root', 'octave', 'low', 'high', 'pattern', 'focus', 'drone', 'mix'],
  live: { meters: true, spectrum: true },
  info: 'The harmonics of the root as a ladder, with the curve of the resonance over the spectrum of what comes out; the mark at the foot is the harmonic it moves to. The two points on the dashed line set Low and High across and Focus by height, or finely by the wheel; the point at the right sets Drone.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const plot = singerPlot(frame)
    const foot = plot.y + plot.h
    const zero = yOfDb(0, plot, SINGER_TOP_DB, SINGER_FOOT_DB)
    const low = Math.min(frame.value('low'), frame.value('high'))
    const high = Math.max(frame.value('low'), frame.value('high'))
    const pattern = Math.round(frame.value('pattern'))
    const rootHz = singerRootHz(frame.value('root'), frame.value('octave'))
    const focus = frame.value('focus')
    const width = singerWidth(focus)

    // Where the two resonances stand is the device's to say. Until it has
    // said, and while it is switched off, they stand where the melody starts:
    // the low end, or the high one for Down.
    const start = pattern === PATTERN_DOWN ? high : low
    const running = frame.powered && frame.signal !== null
    const standing = (name: string): number | null => {
      const reading = frame.meter(name)
      return running && reading >= 1 ? clamp(reading, 1, HARMONIC_MOST) : null
    }
    const left = standing('harmonic')
    const right = standing('harmonicRight')
    const target = standing('target')
    const position = left ?? start
    const held = running ? Math.pow(10, Math.min(0, frame.meter('ceiling')) / 20) : 1
    const setting: SingerSetting = {
      focus,
      drone: frame.value('drone'),
      mix: frame.value('mix'),
      held,
    }
    const response = (stands: number): ((harmonic: number) => number) => {
      const db = singerDb(setting, rootHz, stands, frame.sampleRate)
      return (harmonic) => db(rootHz * harmonic)
    }
    const yOf = (db: number): number =>
      clamp(yOfDb(db, plot, SINGER_TOP_DB, SINGER_FOOT_DB), plot.y, foot)

    // The ladder: a rung on every harmonic, and the span the melody travels.
    if (pattern !== PATTERN_HOLD && high > low) {
      const from = xOfHarmonic(low, plot)
      fillRect(
        ctx,
        { x: from, y: plot.y, w: xOfHarmonic(high, plot) - from, h: plot.h },
        colours.ink,
        INK.fill * 0.75,
      )
    }
    for (let n = 1; n <= HARMONIC_MOST; n++) {
      const x = xOfHarmonic(n, plot)
      rule(ctx, x, plot.y, x, foot, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, plot.x, zero, plot.x + plot.w, zero, { colour: colours.ink, alpha: INK.rule })

    clipped(ctx, plot, () => {
      spectrumBehind(frame, plot, rootHz)
      if (right !== null && Math.abs(right - position) > 0.01) {
        // The right side, a note behind: the same curve where it stands.
        trace(ctx, curvePoints(plot, response(right), around(right, width)), {
          colour: colours.ink,
          width: 1,
          alpha: INK.back,
        })
      }
      const points = curvePoints(plot, response(position), around(position, width))
      fillTo(ctx, points, zero, colours.ink, INK.fill)
      trace(ctx, points, { colour: colours.ink })
    })

    // The numbers of the harmonics, under the plot.
    const numbered = plot.h < frame.height - 8
    const each = plot.w / (SINGER_TO - SINGER_FROM)
    const step = each >= 13 ? 1 : each >= 9 ? 2 : 4
    for (let n = 1; n <= HARMONIC_MOST; n++) {
      const x = xOfHarmonic(n, plot)
      const named = numbered && n % step === 0
      rule(ctx, x, foot - (named ? 5 : 3), x, foot, { colour: colours.ink, alpha: INK.back })
      if (named) text(frame, String(n), x, foot + 9, { align: 'center', alpha: INK.text })
    }
    if (target !== null) {
      // The harmonic the melody is on its way to.
      const x = xOfHarmonic(target, plot)
      rule(ctx, x, foot - 7, x, foot, { colour: colours.accent, width: 2 })
    }

    // Where the knobs have it: the range and the lift between its two ends, and the drone's level.
    const points = singerHandles(frame)
    const [lowPoint, highPoint] = points
    rule(ctx, lowPoint.x, lowPoint.y, highPoint.x, highPoint.y, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [2, 2],
    })
    for (const point of points) handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    const marks: { x: number; y: number }[] = [...points]
    if (left !== null) {
      // The resonance now, riding its curve; the right side's is the smaller.
      if (right !== null && Math.abs(right - left) > 0.01) {
        const at = { x: xOfHarmonic(right, plot), y: yOf(response(right)(right)) }
        dot(ctx, at.x, at.y, 1.75, colours.accent, { ring: colours.ink })
        marks.push(at)
      }
      const at = { x: xOfHarmonic(left, plot), y: yOf(response(left)(left)) }
      dot(ctx, at.x, at.y, 2.5, colours.accent, { ring: colours.ink })
      marks.push(at)
    }

    const hot = points.find((point) => point.key === frame.hot)
    const root = `${NOTES[clamp(Math.round(frame.value('root')), 0, 11)]}${Math.round(frame.value('octave'))}`
    const words =
      hot?.key === 'drone'
        ? `Drone ${frame.value('drone').toFixed(2)}`
        : hot
          ? `${hot.name} ${Math.round(frame.value(hot.key))}  Focus ${focus.toFixed(2)}`
          : root
    caption(frame, plot, marks, words)
  },
  handles: singerHandles,
})

export const OVERTONE_SINGER_FACES: Readonly<Record<string, PlateFace>> = {
  'overtone-singer': {
    display: overtoneSinger,
    face: ['root', 'pattern', 'pace', 'glide'],
  },
}
