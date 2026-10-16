// The display of Band Pulse: an even pulse on the middle of a sound. Above,
// the pulse along a time axis as the level it gives the band, the left side
// over the middle line and the right side under it, the right as far behind
// as Offset puts it; the lanes are a few whole pulses long and the length of
// time they show is written under them. Below, a frequency axis: what a gap
// leaves of each frequency, so the band between Low and High is seen as a dip
// that is only as deep as the band is wide, with the depth at the band's
// middle written in decibels and a bar over the band that is pulsed.
//
// Nothing here moves. The device reports no readings, so the picture is drawn
// from the controls alone and stands still at every Rate: the pulse is a shape
// over time, never a light that goes on and off.
//
// Everything is the device's own arithmetic: the pulse and its depth are
// `cpp/kit/beat.h` (`pulse_shape`, `pulse_open`, `pulse_floor`, `pulse_gain`),
// the split is `cpp/kit/band.h` (`ThreeBand`) on the sections of
// `cpp/kit/filters.h` (`Svf`), put together as `cpp/devices/band-pulse/band_pulse.h`
// does: low + band x gain + high.

import {
  INK,
  clamp,
  dbText,
  fillRect,
  fillTo,
  freqGrid,
  gainToDb,
  ground,
  handle,
  hzOfX,
  rule,
  text,
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

const wrap = (cycles: number): number => (Number.isFinite(cycles) ? cycles - Math.floor(cycles) : 0)

// --- The device's numbers (`beat.h`, `band.h`, `filters.h`) --------------------

/** `kit::ThreeBand::kLeastHz`: the lowest the lower edge is held to. */
const LEAST_HZ = 20
/** `kit::ThreeBand::kMargin`: High is held at least half an octave over Low. */
export const BAND_PULSE_MARGIN = 1.41421356
/** `kit::ThreeBand::kMostOfRate`: both edges stay under this share of the sample rate. */
const MOST_OF_RATE = 0.45
/** `1 / kSqrtHalf`: the damping of every section of the split (Q 0.7071). */
const SECTION_K = Math.SQRT2
/** `Svf::set`: a section is tuned no lower than this, and no higher than 0.49 of the sample rate. */
const SECTION_LEAST_HZ = 5
/** `pulse_shape`: Duty is held between these, and an edge is never nothing. */
const DUTY_LEAST = 0.01
const DUTY_MOST = 0.99
const EDGE_LEAST = 1e-6

/** `kit::PulseShape`: how much of a period the pulse is on, and how much of it each edge takes. */
export interface BandPulseShape {
  duty: number
  edge: number
}

/**
 * `kit::pulse_shape`: the shape for a Rate in hertz, Duty and Edge in seconds.
 * The edge is held to half of the shorter of the on time and the gap.
 */
export function bandPulseShape(rate: number, duty: number, edgeSeconds: number): BandPulseShape {
  const d = clamp(duty, DUTY_LEAST, DUTY_MOST)
  const most = 0.5 * Math.min(d, 1 - d)
  const asked = edgeSeconds * rate
  return { duty: d, edge: asked > EDGE_LEAST ? Math.min(asked, most) : EDGE_LEAST }
}

/**
 * `kit::pulse_open`: how far open the pulse is at `phase` of its period, 0 in
 * the gap and 1 on the top. It begins to rise at phase 0 and to fall at Duty,
 * each over a half cosine an edge long.
 */
export function bandPulseOpen(phase: number, shape: BandPulseShape): number {
  if (!(phase > 0)) return 0
  if (phase < shape.edge) return 0.5 - 0.5 * Math.cos((Math.PI * phase) / shape.edge)
  if (phase < shape.duty) return 1
  const down = phase - shape.duty
  if (down < shape.edge) return 0.5 + 0.5 * Math.cos((Math.PI * down) / shape.edge)
  return 0
}

/** `kit::pulse_floor`: the level Depth leaves in the gap, (1 - Depth) squared. */
export function bandPulseFloor(depth: number): number {
  const d = clamp(depth, 0, 1)
  return (1 - d) * (1 - d)
}

/** `kit::pulse_gain`: the level the band is given, from the floor in the gap to 1 on the top. */
export const bandPulseGain = (open: number, floor: number): number => floor + (1 - floor) * open

/** `kit::ThreeBand::set`: where the two edges end up, High at least half an octave over Low. */
export function bandPulseEdges(
  low: number,
  high: number,
  sampleRate = 48000,
): { low: number; high: number } {
  const top = MOST_OF_RATE * sampleRate
  const held = clamp(low, LEAST_HZ, top / BAND_PULSE_MARGIN)
  return { low: held, high: clamp(high, held * BAND_PULSE_MARGIN, top) }
}

/** The device's knobs as it applies them. */
export interface BandPulseSettings {
  rate: number
  shape: BandPulseShape
  /** What is left of the band in a gap, as a gain. */
  floor: number
  /** How far the right side's pulse is behind the left's, in periods: `offset_turns_`. */
  behind: number
  /** The band's edges as the split holds them. */
  low: number
  high: number
}

export function bandPulseSettings(
  value: (name: string) => number,
  sampleRate = 48000,
): BandPulseSettings {
  const rate = value('rate')
  const edges = bandPulseEdges(value('low'), value('high'), sampleRate)
  return {
    rate,
    shape: bandPulseShape(rate, value('duty'), 0.001 * value('edge')),
    floor: bandPulseFloor(value('depth')),
    behind: value('offset') / 360,
    low: edges.low,
    high: edges.high,
  }
}

/** The level a side gives the band `periods` after the clock's start: the left side, or the right `behind` it. */
export function bandPulseLevelAt(periods: number, set: BandPulseSettings, right = false): number {
  const phase = wrap(periods - (right ? set.behind : 0))
  return bandPulseGain(bandPulseOpen(phase, set.shape), set.floor)
}

type Complex = readonly [number, number]

const times = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
]
const over = (a: Complex, b: Complex): Complex => {
  const size = b[0] * b[0] + b[1] * b[1]
  return [(a[0] * b[0] + a[1] * b[1]) / size, (a[1] * b[0] - a[0] * b[1]) / size]
}

/** `tan_prewarp`: the tangent as the kit works it out, a ratio of two polynomials up to 0.7 and the true one above. */
function tanPrewarp(x: number): number {
  if (x > 0.7) return Math.tan(x)
  const x2 = x * x
  return (x * (15 - x2)) / (15 - 6 * x2)
}

/** `Svf::set`: the section's `g` for a crossover, with the frequency held as the section holds it. */
const sectionG = (hz: number, sampleRate: number): number =>
  tanPrewarp((Math.PI * clamp(hz, SECTION_LEAST_HZ, 0.49 * sampleRate)) / sampleRate)

/**
 * `kit::ThreeBand::process` as a response: what the split makes of a tone at
 * `hz`, as three complex gains. Each crossover is two sections in a row, a
 * low pass 1 / D squared and a high pass w to the fourth over D squared with
 * D = 1 - w squared + j k w, where w is the tone against the crossover as the
 * sections warp it; the low part also passes the all-pass the upper pair sums
 * to, conj(D) / D.
 */
function bandPulseParts(
  hz: number,
  low: number,
  high: number,
  sampleRate = 48000,
): { low: Complex; band: Complex; high: Complex } {
  const tone = Math.tan((Math.PI * clamp(hz, 0, 0.499 * sampleRate)) / sampleRate)
  const wl = tone / sectionG(low, sampleRate)
  const wh = tone / sectionG(high, sampleRate)
  const dl: Complex = [1 - wl * wl, SECTION_K * wl]
  const dh: Complex = [1 - wh * wh, SECTION_K * wh]
  const dl2 = times(dl, dl)
  const dh2 = times(dh, dh)
  const lowPass = over([1, 0], dl2)
  const rest = over([wl * wl * wl * wl, 0], dl2)
  return {
    low: times(lowPass, over([dh[0], -dh[1]], dh)),
    band: over(rest, dh2),
    high: over(times(rest, [wh * wh * wh * wh, 0]), dh2),
  }
}

/**
 * What comes out of a tone at `hz` while the band is given `gain`, 1 being
 * the tone as it came: the size of low + band x gain + high. With the gain at
 * 1 it is 1 at every frequency.
 */
export function bandPulseHeard(
  hz: number,
  gain: number,
  low: number,
  high: number,
  sampleRate = 48000,
): number {
  const parts = bandPulseParts(hz, low, high, sampleRate)
  return Math.hypot(
    parts.low[0] + gain * parts.band[0] + parts.high[0],
    parts.low[1] + gain * parts.band[1] + parts.high[1],
  )
}

// --- The time axis --------------------------------------------------------------

/** The lengths of time the lanes may show, in seconds. */
const SPANS = [0.05, 0.1, 0.2, 0.5, 1, 2, 4] as const
/** The lanes show at least this many whole pulses. */
const SHOWN_PULSES = 2

/** How long a time the lanes show: the shortest of the round ones that holds two pulses, so two to five stand across. */
export function bandPulseSpan(rate: number): number {
  for (const span of SPANS) if (span * rate >= SHOWN_PULSES - 1e-9) return span
  return SPANS[SPANS.length - 1]
}

/** A span as it is written: "50 ms", "500 ms", "2 s". */
export const bandPulseSpanText = (seconds: number): string =>
  seconds < 1 ? `${Math.round(seconds * 1000)} ms` : `${Math.round(seconds)} s`

/**
 * Where along its period a pulse is read so that a line through the readings
 * is the pulse: at its four corners and, up the rise and down the fall, about
 * every pixel and a half (`wide` is a period in pixels) and in two parts or
 * more. Between them it is level.
 */
export function bandPulseBreaks(shape: BandPulseShape, wide: number): number[] {
  const parts = clamp(Math.ceil((shape.edge * wide) / 1.5), 2, 24)
  const breaks: number[] = []
  for (let i = 0; i <= parts; i++) breaks.push((shape.edge * i) / parts)
  for (let i = 0; i <= parts; i++) breaks.push(shape.duty + (shape.edge * i) / parts)
  return breaks
}

// --- Where things stand -------------------------------------------------------

/** The frequency axis: equal octaves from 30 Hz to 12 kHz, an octave under the lowest Low and over the highest High and more. */
export const BAND_PULSE_MIN_HZ = 30
export const BAND_PULSE_MAX_HZ = 12000
/** The foot of the level axis; its top is the sound as it came, 0 dB. */
export const BAND_PULSE_FOOT_DB = -48

export interface BandPulseLayout {
  /** Both lanes; `mid` is the line they grow from and `lane` how high each stands when the band is whole. */
  lanes: Box
  mid: number
  lane: number
  /** The line the words between the two pictures are written on, and their two ends. */
  base: number
  left: number
  right: number
  /** Where the bar over the pulsed band lies. */
  bar: number
  /** The frequency axis: its top is 0 dB and its foot `BAND_PULSE_FOOT_DB`. */
  plot: Box
}

/** Laid out from the size it is given: the lanes above, a line of words, the frequency axis below. */
export function bandPulseLayout(view: Pick<DisplayView, 'width' | 'height'>): BandPulseLayout {
  const { width, height } = view
  const tall = Math.max(16, Math.round(height * 0.36))
  const plot: Box = { x: 6, y: height - 6 - tall, w: Math.max(8, width - 12), h: tall }
  const top = 7
  // Between the lanes and the axis stand a line of words (8 px) and the bar over the band.
  const lane = Math.max(4, Math.floor((plot.y - 16 - top - 1) / 2))
  const left = 15
  const right = width - 6
  return {
    lanes: { x: left, y: top, w: Math.max(8, right - left), h: 2 * lane + 1 },
    mid: top + lane + 0.5,
    lane,
    base: plot.y - 7,
    left: 6,
    right,
    bar: plot.y - 4,
    plot,
  }
}

/** A side's lane as a line: the level the band is given over the time the lanes show, read wherever the pulse turns. */
function bandPulseLanePoints(
  set: BandPulseSettings,
  layout: BandPulseLayout,
  right = false,
): Point[] {
  const { lanes, mid, lane } = layout
  const periods = bandPulseSpan(set.rate) * set.rate
  const behind = right ? set.behind : 0
  const reads: number[] = [0, periods]
  const breaks = bandPulseBreaks(set.shape, lanes.w / periods)
  for (let pulse = -1; pulse <= Math.ceil(periods); pulse++) {
    for (const along of breaks) {
      const at = pulse + along + behind
      if (at > 0 && at < periods) reads.push(at)
    }
  }
  reads.sort((a, b) => a - b)
  return reads.map((at): Point => {
    const level = bandPulseLevelAt(at, set, right)
    return [
      lanes.x + (at / periods) * lanes.w,
      right ? mid + 0.5 + level * lane : mid - 0.5 - level * lane,
    ]
  })
}

/** How high a level stands on the frequency axis, held to its foot. */
function bandPulseLevelY(heard: number, plot: Box): number {
  return yOfDb(Math.max(BAND_PULSE_FOOT_DB, gainToDb(heard)), plot, 0, BAND_PULSE_FOOT_DB)
}

/** What a gap leaves of each frequency, as a line across the frequency axis. */
function bandPulseCurvePoints(
  set: BandPulseSettings,
  layout: BandPulseLayout,
  sampleRate = 48000,
): Point[] {
  const { plot } = layout
  const count = Math.max(2, Math.ceil(plot.w / 1.5))
  const points: Point[] = []
  for (let i = 0; i <= count; i++) {
    const x = plot.x + (i / count) * plot.w
    const hz = hzOfX(x, plot, BAND_PULSE_MIN_HZ, BAND_PULSE_MAX_HZ)
    points.push([
      x,
      bandPulseLevelY(bandPulseHeard(hz, set.floor, set.low, set.high, sampleRate), plot),
    ])
  }
  return points
}

/** What a gap leaves of a tone at the middle of the band, in decibels: how deep the pulse is where it is deepest. */
export function bandPulseDepthDb(set: BandPulseSettings, sampleRate = 48000): number {
  const middle = Math.sqrt(set.low * set.high)
  return gainToDb(bandPulseHeard(middle, set.floor, set.low, set.high, sampleRate))
}

// --- The points ---------------------------------------------------------------

/** The sample rate a frame knows; a view that is no frame is read at 48 kHz. */
const rateOf = (view: DisplayView): number => {
  const rate = (view as { sampleRate?: number }).sampleRate
  return typeof rate === 'number' && rate > 0 ? rate : 48000
}

/**
 * Three points. Offset is the ring on the right side's lane where its first
 * pulse begins to rise: to the right is later. Low and High are the rings on
 * the line of the frequency axis at the two edges of the band, each moved
 * across. High stands where the split holds it, half an octave over Low at
 * the least.
 */
function bandPulseHandles(view: DisplayView): DisplayHandle[] {
  const layout = bandPulseLayout(view)
  const sampleRate = rateOf(view)
  const set = bandPulseSettings((name) => view.value(name), sampleRate)
  const { lanes, mid, lane, plot } = layout
  const periods = bandPulseSpan(set.rate) * set.rate
  const offset = view.value('offset')
  const offsetSpec = view.spec('offset')
  const offsetX = lanes.x + (set.behind / periods) * lanes.w
  const edge = (key: 'low' | 'high', name: string, held: number): DisplayHandle => {
    const spec = view.spec(key)
    const value = view.value(key)
    const x = xOfHz(held, plot, BAND_PULSE_MIN_HZ, BAND_PULSE_MAX_HZ)
    return {
      key,
      name,
      x,
      y: bandPulseLevelY(bandPulseHeard(held, set.floor, set.low, set.high, sampleRate), plot),
      drag: (toX) => ({
        [key]:
          Math.abs(toX - x) < 1e-6
            ? value
            : clamp(
                hzOfX(toX, plot, BAND_PULSE_MIN_HZ, BAND_PULSE_MAX_HZ),
                spec?.min ?? held,
                spec?.max ?? held,
              ),
      }),
      reset: () => ({ [key]: spec?.default ?? value }),
    }
  }
  return [
    {
      key: 'offset',
      name: 'Offset',
      x: offsetX,
      y: mid + 0.5 + set.floor * lane,
      drag: (toX) => ({
        offset:
          Math.abs(toX - offsetX) < 1e-6
            ? offset
            : clamp(
                ((toX - lanes.x) / lanes.w) * periods * 360,
                offsetSpec?.min ?? 0,
                offsetSpec?.max ?? 180,
              ),
      }),
      reset: () => ({ offset: offsetSpec?.default ?? 0 }),
    },
    edge('low', 'Low', set.low),
    edge('high', 'High', set.high),
  ]
}

// --- The display --------------------------------------------------------------

const bandPulse = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['rate', 'depth', 'duty', 'edge', 'offset', 'low', 'high'],
  info: 'Above, the pulse over the time written under it, as the level it gives the band: the left side over the line, the right side under it, and the ring sets Offset. Below, what a gap leaves of each frequency, with its depth at the middle of the band in decibels: the two rings set Low and High.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const layout = bandPulseLayout(frame)
    const set = bandPulseSettings((name) => frame.value(name), frame.sampleRate)
    const { lanes, mid, lane, plot } = layout
    const span = bandPulseSpan(set.rate)
    const periods = span * set.rate

    // --- The pulse over time, a lane for each side ---
    for (const y of [mid - 0.5 - lane, mid + 0.5 + lane])
      rule(ctx, lanes.x, y, lanes.x + lanes.w, y, { colour: colours.ink, alpha: INK.grid })
    const upper = bandPulseLanePoints(set, layout)
    const lower = bandPulseLanePoints(set, layout, true)
    fillTo(ctx, upper, mid - 0.5, colours.ink)
    fillTo(ctx, lower, mid + 0.5, colours.ink)
    rule(ctx, lanes.x, mid, lanes.x + lanes.w, mid, { colour: colours.ink, alpha: INK.rule })
    // A tick where each period of the left side's pulse begins.
    for (let pulse = 0; pulse <= periods + 1e-9; pulse++) {
      const x = lanes.x + (pulse / periods) * lanes.w
      rule(ctx, x, mid - 2.5, x, mid + 2.5, { colour: colours.ink, alpha: INK.rule })
    }
    trace(ctx, upper, { colour: colours.ink, width: 1.25 })
    trace(ctx, lower, { colour: colours.ink, width: 1.25 })
    text(frame, 'L', layout.left, mid - 0.5 - lane / 2 + 3, { alpha: INK.text })
    text(frame, 'R', layout.left, mid + 0.5 + lane / 2 + 3, { alpha: INK.text })

    // --- Between the two: how deep the gap is at the band's middle, and how long the lanes are ---
    text(frame, dbText(bandPulseDepthDb(set, frame.sampleRate)), layout.left, layout.base, {
      alpha: INK.text,
    })
    text(frame, bandPulseSpanText(span), layout.right, layout.base, {
      align: 'right',
      alpha: INK.text,
    })

    // --- What a gap leaves of each frequency ---
    freqGrid(frame, plot, BAND_PULSE_MIN_HZ, BAND_PULSE_MAX_HZ)
    rule(ctx, plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    const curve = bandPulseCurvePoints(set, layout, frame.sampleRate)
    // Between the line and the level the sound came in at is what the gaps take away.
    fillTo(ctx, curve, plot.y, colours.ink)
    rule(ctx, plot.x, plot.y, plot.x + plot.w, plot.y, { colour: colours.ink, alpha: INK.rule })
    trace(ctx, curve, { colour: colours.ink, width: 1.5 })
    // The band that is pulsed, from Low to High as the split holds them.
    const from = xOfHz(set.low, plot, BAND_PULSE_MIN_HZ, BAND_PULSE_MAX_HZ)
    const to = xOfHz(set.high, plot, BAND_PULSE_MIN_HZ, BAND_PULSE_MAX_HZ)
    fillRect(ctx, { x: from, y: layout.bar, w: to - from, h: 2 }, colours.accent)

    for (const point of bandPulseHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: bandPulseHandles,
})

export const BAND_PULSE_FACES: Readonly<Record<string, PlateFace>> = {
  // Offset, Low and High are the points on the display.
  'band-pulse': {
    display: bandPulse,
    face: ['rate', 'depth', 'duty', 'edge'],
  },
}
