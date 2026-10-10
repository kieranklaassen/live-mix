// The display of the Scale Filter: the octave as a clock, with an opening at
// every note the filter lets through, drawn from the device's own mask, and at
// the side the range of notes it is open in over the spectrum of what comes
// out.

import {
  INK,
  clamp,
  dbToGain,
  fillBetween,
  fillRect,
  follow,
  gainToDb,
  ground,
  handle,
  hzText,
  label,
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
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/**
 * The scales as the semitones over Root that are in them, bit s for semitone
 * s, in the order of the Scale choices (`kScales` in `scale_filter.h`).
 */
export const SCALE_FILTER_SCALES: readonly number[] = [
  0b101010110101, 0b010110101101, 0b100110101101, 0b011010101101, 0b010110101011, 0b101011010101,
  0b011010110101, 0b001010010101, 0b010010101001, 0b010101010101, 0b111111111111,
]

/** The deepest Depth goes, and so the foot of the clock's scale, in dB. */
export const SCALE_FILTER_RANGE_DB = 48
/** The bell is kept out to three widths, and is nothing past that (`kBellSpan`). */
const BELL_SPAN = 3
/** The ends of the side panel's scale. */
const STRIP_LOW_HZ = 20
const STRIP_HIGH_HZ = 20000
/** The spectrum at the side runs from full scale down to this. */
const STRIP_FOOT_DB = -84

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/**
 * The semitones over Root that a Scale and a Chord choice let through, as
 * bits (`chord_notes` in `scale_filter.h`): the whole scale; its root, third
 * (major where the scale has one, else minor) and fifth (perfect where it has
 * one, else the augmented or the diminished one it has); the root and that
 * fifth; the root alone.
 */
export function scaleFilterNotes(scale: number, chord: number): number {
  const all = SCALE_FILTER_SCALES[clamp(Math.round(scale), 0, SCALE_FILTER_SCALES.length - 1)]
  if (chord <= 0) return all
  const third = all & (1 << 4) ? 1 << 4 : 1 << 3
  const fifth = all & (1 << 7) ? 1 << 7 : all & (1 << 8) ? 1 << 8 : 1 << 6
  if (chord === 1) return 1 | third | fifth
  if (chord === 2) return 1 | fifth
  return 1
}

/** What the knobs say, as the mask needs it. */
export interface ScaleFilterSettings {
  /** The root's pitch class, 0 for C. */
  root: number
  /** The semitones over the root that are let through, as bits. */
  notes: number
  /** Cents between an opening's two -3 dB points. */
  width: number
  /** dB. */
  depth: number
  /** Cents every opening is moved by. */
  tune: number
  mix: number
  low: number
  high: number
}

export function scaleFilterSettings(view: DisplayView): ScaleFilterSettings {
  return {
    root: clamp(Math.round(view.value('root')), 0, 11),
    notes: scaleFilterNotes(Math.round(view.value('scale')), Math.round(view.value('chord'))),
    width: Math.max(1, view.value('width')),
    depth: Math.max(0, view.value('depth')),
    tune: view.value('tune'),
    mix: clamp(view.value('mix'), 0, 1),
    low: view.value('low'),
    high: view.value('high'),
  }
}

/** The distance from a pitch class (0 to 12 from C, not a whole number) to the nearest note let through, in semitones. */
export function scaleFilterDistance(pitchClass: number, now: ScaleFilterSettings): number {
  const at = (((pitchClass - now.tune / 100) % 12) + 12) % 12
  let nearest = 12
  for (let s = 0; s < 12; s++) {
    if (!(now.notes & (1 << s))) continue
    let apart = Math.abs(at - ((now.root + s) % 12))
    if (apart > 6) apart = 12 - apart
    if (apart < nearest) nearest = apart
  }
  return nearest
}

/** The opening at a distance in semitones: 3 dB down at half a Width, nothing past three (`bell_`). */
export function scaleFilterBell(distance: number, width: number): number {
  const off = (Math.abs(distance) * 100) / width
  return off < BELL_SPAN ? Math.exp(-2 * Math.LN2 * off * off) : 0
}

/**
 * The mask at a pitch class, as a gain (`mask_at` in `scale_filter.h`, for a
 * note inside Low and High): the floor Depth sets, and over it the opening of
 * the nearest note.
 */
export function scaleFilterGain(pitchClass: number, now: ScaleFilterSettings): number {
  const floor = dbToGain(-now.depth)
  return floor + (1 - floor) * scaleFilterBell(scaleFilterDistance(pitchClass, now), now.width)
}

/** What is heard of a pitch class: the dry sound and the masked one by Mix, a linear crossfade (`process`). */
export function scaleFilterHeard(pitchClass: number, now: ScaleFilterSettings): number {
  return 1 - now.mix + now.mix * scaleFilterGain(pitchClass, now)
}

/**
 * How open the range is at a frequency (the `range` of `mask_at`): fully from
 * Low to High, shut a semitone outside either, a smooth step between.
 */
export function scaleFilterRange(hz: number, now: ScaleFilterSettings): number {
  const step = (x: number): number => {
    const t = clamp(x, 0, 1)
    return t * t * (3 - 2 * t)
  }
  const pitch = 12 * Math.log2(hz / 440)
  const low = 12 * Math.log2(now.low / 440)
  const high = 12 * Math.log2(now.high / 440)
  return step(pitch - low + 1) * step(high + 1 - pitch)
}

/**
 * The widest stretch between two notes let through, the last such one going up
 * from the root: its middle as a pitch class (Tune taken in) and half its
 * length in semitones. Depth's handle stands there, where the mask is lowest.
 */
export function scaleFilterGap(now: ScaleFilterSettings): { middle: number; half: number } {
  let from = 0
  let widest = 0
  let last = 0
  for (let s = 1; s <= 12; s++) {
    if (s < 12 && !(now.notes & (1 << s))) continue
    if (s - last >= widest) {
      widest = s - last
      from = last
    }
    last = s
  }
  return { middle: now.root + from + widest / 2 + now.tune / 100, half: widest / 2 }
}

// --- Where things stand -----------------------------------------------------

/** The clock (its centre, the radius of its foot at -48 dB and of its rim at 0 dB) and the panel at its side. */
export interface ScaleFilterLayout {
  cx: number
  cy: number
  foot: number
  rim: number
  strip: Box
}

/** The pixels a handle and the mark of the root's reach need outside the rim. */
const RIM_ROOM = 7
/** How far outside the rim the reach of the root's opening is drawn. */
const REACH_OUT = 2.5
const GAP = 4

export function scaleFilterLayout(view: Pick<DisplayView, 'width' | 'height'>): ScaleFilterLayout {
  // The box `ground` hands back: three pixels inside the canvas.
  const box: Box = { x: 3, y: 3, w: view.width - 6, h: view.height - 6 }
  const stripWide = clamp(box.w - box.h - GAP, 22, box.w * 0.45)
  const room = box.w - stripWide - GAP
  const rim = Math.max(10, Math.min(room, box.h) / 2 - RIM_ROOM)
  return {
    cx: box.x + room / 2,
    cy: box.y + box.h / 2,
    foot: Math.round(rim * 0.32),
    rim,
    strip: { x: box.x + room + GAP, y: box.y + 5, w: stripWide, h: box.h - 10 },
  }
}

/** The angle of a pitch class on the clock: C at the top, a semitone every 30 degrees clockwise. */
export function scaleFilterAngle(pitchClass: number): number {
  return -Math.PI / 2 + (pitchClass / 12) * 2 * Math.PI
}

/** How far from the centre a gain stands: the foot at -48 dB and under, the rim at 0 dB, even in dB between. */
export function scaleFilterRadius(gain: number, layout: ScaleFilterLayout): number {
  const along = clamp(1 + gainToDb(gain) / SCALE_FILTER_RANGE_DB, 0, 1)
  return layout.foot + (layout.rim - layout.foot) * along
}

function pointAt(layout: ScaleFilterLayout, pitchClass: number, radius: number): Point {
  const angle = scaleFilterAngle(pitchClass)
  return [layout.cx + radius * Math.cos(angle), layout.cy + radius * Math.sin(angle)]
}

/** Where a frequency stands up the side panel: 20 Hz at its foot, 20 kHz at its top, equal octaves. */
export function scaleFilterY(hz: number, strip: Box): number {
  const along =
    Math.log(clamp(hz, STRIP_LOW_HZ, STRIP_HIGH_HZ) / STRIP_LOW_HZ) /
    Math.log(STRIP_HIGH_HZ / STRIP_LOW_HZ)
  return strip.y + strip.h * (1 - along)
}

function hzOfY(y: number, strip: Box): number {
  const along = clamp((strip.y + strip.h - y) / strip.h, 0, 1)
  return STRIP_LOW_HZ * Math.pow(STRIP_HIGH_HZ / STRIP_LOW_HZ, along)
}

/** How many widths from its note an opening has fallen 48 dB, to the clock's foot: exp(-2 ln2 x²) is 1/256 at 2. */
export const SCALE_FILTER_REACH = 2

// --- Handles ----------------------------------------------------------------

function rangeOf(view: DisplayView, name: string, low: number, high: number): [number, number] {
  const spec = view.spec(name)
  return [spec?.min ?? low, spec?.max ?? high]
}

function handlesOf(view: DisplayView): DisplayHandle[] {
  const now = scaleFilterSettings(view)
  const layout = scaleFilterLayout(view)
  const { cx, cy, foot, rim, strip } = layout
  const reset = (name: string) => (): Record<string, number> => ({
    [name]: view.spec(name)?.default ?? view.value(name),
  })

  // Width: the end of the root's reach, two Widths clockwise of the root.
  const [widthMin, widthMax] = rangeOf(view, 'width', 5, 200)
  const rootAt = now.root + now.tune / 100
  const [widthX, widthY] = pointAt(
    layout,
    rootAt + (SCALE_FILTER_REACH * now.width) / 100,
    rim + REACH_OUT,
  )
  const width: DisplayHandle = {
    key: 'width',
    name: 'Width',
    x: widthX,
    y: widthY,
    drag: (x, y) => {
      let turn = Math.atan2(y - cy, x - cx) - scaleFilterAngle(rootAt)
      turn -= 2 * Math.PI * Math.round(turn / (2 * Math.PI))
      const cents = (Math.abs(turn) / (2 * Math.PI)) * 1200
      return { width: clamp(cents / SCALE_FILTER_REACH, widthMin, widthMax) }
    },
    wheel: (steps) => ({ width: clamp(now.width * Math.pow(1.1, steps), widthMin, widthMax) }),
    reset: reset('width'),
  }

  // Depth: on the device's own mask in the middle of the widest gap, where it is lowest.
  const [depthMin, depthMax] = rangeOf(view, 'depth', 0, SCALE_FILTER_RANGE_DB)
  const gap = scaleFilterGap(now)
  const bell = scaleFilterBell(gap.half, now.width)
  const floor = dbToGain(-now.depth)
  const [depthX, depthY] = pointAt(
    layout,
    gap.middle,
    scaleFilterRadius(floor + (1 - floor) * bell, layout),
  )
  const gapAngle = scaleFilterAngle(gap.middle)
  const depth: DisplayHandle = {
    key: 'depth',
    name: 'Depth',
    x: depthX,
    y: depthY,
    drag: (x, y) => {
      // How far out along the gap's own line the hand is, as the gain that stands there.
      const out = (x - cx) * Math.cos(gapAngle) + (y - cy) * Math.sin(gapAngle)
      const along = clamp((out - foot) / (rim - foot), 0, 1)
      const gain = dbToGain(-SCALE_FILTER_RANGE_DB * (1 - along))
      // The floor that puts the mask there: gain = floor + (1 - floor) * bell.
      const under = (gain - bell) / (1 - bell)
      return { depth: under > 0 ? clamp(-gainToDb(under), depthMin, depthMax) : depthMax }
    },
    reset: reset('depth'),
  }

  // Low and High: on their lines across the side panel.
  const end = (name: 'low' | 'high', title: string, across: number): DisplayHandle => {
    const [min, max] = rangeOf(view, name, STRIP_LOW_HZ, STRIP_HIGH_HZ)
    return {
      key: name,
      name: title,
      x: strip.x + strip.w * across,
      y: scaleFilterY(now[name], strip),
      drag: (_x, y) => ({ [name]: clamp(hzOfY(y, strip), min, max) }),
      reset: reset(name),
    }
  }
  return [width, depth, end('low', 'Low', 0.3), end('high', 'High', 0.7)]
}

// --- Drawing ----------------------------------------------------------------

/** Points of a curve around the clock; a multiple of twelve, so every note lies on one. */
const CURVE_POINTS = 480

interface ScaleFilterState {
  /** The level the bars are read against, in the meters' steps: the loudest note of late. */
  level: number
  /** False until a note has come in. */
  heard: boolean
}

/** A gain all round the clock as points, starting at the root so its opening's top is one of them. */
function around(
  layout: ScaleFilterLayout,
  now: ScaleFilterSettings,
  gain: ((pitchClass: number) => number) | number,
): Point[] {
  const start = now.root + now.tune / 100
  const points: Point[] = []
  for (let i = 0; i <= CURVE_POINTS; i++) {
    const pitchClass = start + (i * 12) / CURVE_POINTS
    const radius = typeof gain === 'number' ? gain : scaleFilterRadius(gain(pitchClass), layout)
    points.push(pointAt(layout, pitchClass, radius))
  }
  return points
}

/** A device reading as its two levels: what came in under a note and what went out, each 0 (nothing) to 63. */
export function scaleFilterReading(value: number): { in: number; out: number } {
  const whole = clamp(Math.round(Number.isFinite(value) ? value : 0), 0, 4095)
  return { in: whole % 64, out: Math.floor(whole / 64) }
}

/** The radius a note's level stands at: `level` steps (dB) at the rim, 48 under it at the foot. */
export function scaleFilterBar(steps: number, level: number, layout: ScaleFilterLayout): number {
  const along = clamp(1 + (steps - level) / SCALE_FILTER_RANGE_DB, 0, 1)
  return layout.foot + (layout.rim - layout.foot) * along
}

function drawBars(frame: DisplayFrame<ScaleFilterState>, layout: ScaleFilterLayout): void {
  const { ctx, colours, state } = frame
  const readings = NOTE_NAMES.map((_, n) => scaleFilterReading(frame.meter(`note${n + 1}`)))
  const loudest = Math.max(...readings.map((reading) => Math.max(reading.in, reading.out)))
  if (loudest > 0) {
    // Up at once with a louder note, down slowly, and held while nothing comes.
    state.level = state.heard ? follow(state.level, loudest, frame.dt, 0, 4) : loudest
    state.heard = true
  }
  if (!state.heard) return
  readings.forEach((reading, n) => {
    const [x0, y0] = pointAt(layout, n, layout.foot)
    const bar = (steps: number, colour: string, alpha: number): void => {
      if (steps <= 0) return
      const [x, y] = pointAt(layout, n, scaleFilterBar(steps, state.level, layout))
      rule(ctx, x0, y0, x, y, { colour, alpha, width: 3 })
    }
    bar(reading.in, colours.ink, INK.rule)
    bar(reading.out, colours.accent, 1)
  })
}

function drawClock(
  frame: DisplayFrame<ScaleFilterState>,
  now: ScaleFilterSettings,
  layout: ScaleFilterLayout,
): void {
  const { ctx, colours } = frame
  const { rim, foot } = layout
  const inner = around(layout, now, foot)
  // The scale: the rim at 0 dB with a tick at every semitone of concert pitch, the foot at -48 dB.
  trace(ctx, around(layout, now, rim), { colour: colours.ink, width: 1, alpha: INK.grid })
  trace(ctx, inner, { colour: colours.ink, width: 1, alpha: INK.rule })
  for (let n = 0; n < 12; n++) {
    const [x1, y1] = pointAt(layout, n, rim - 1.5)
    const [x2, y2] = pointAt(layout, n, rim + 1)
    rule(ctx, x1, y1, x2, y2, { colour: colours.ink, alpha: INK.rule })
  }
  // What is heard of each pitch, and under it the notes going in and coming out.
  const heard = around(layout, now, (pitchClass) => scaleFilterHeard(pitchClass, now))
  fillBetween(ctx, heard, inner, colours.ink, INK.fill)
  trace(ctx, heard, { colour: colours.ink })
  // Over the curve, so a note is seen in an opening no wider than its bar.
  if (frame.powered) drawBars(frame, layout)
  // The device's own mask, where Mix lets less than all of it be heard.
  if (now.mix < 0.999)
    trace(
      ctx,
      around(layout, now, (pitchClass) => scaleFilterGain(pitchClass, now)),
      { colour: colours.ink, width: 1, alpha: INK.back, dash: [2, 2] },
    )
  // The root, and how far its opening reaches before it is 48 dB down: two Widths either side.
  const rootAt = now.root + now.tune / 100
  const reach = Math.min(6, (SCALE_FILTER_REACH * now.width) / 100)
  const arc: Point[] = []
  for (let i = -24; i <= 24; i++)
    arc.push(pointAt(layout, rootAt + (reach * i) / 24, rim + REACH_OUT))
  trace(ctx, arc, { colour: colours.ink, width: 1, alpha: INK.back })
  const [rx1, ry1] = pointAt(layout, rootAt, rim)
  const [rx2, ry2] = pointAt(layout, rootAt, rim + 5)
  rule(ctx, rx1, ry1, rx2, ry2, { colour: colours.accent, width: 2 })
}

function drawStrip(
  frame: DisplayFrame<ScaleFilterState>,
  now: ScaleFilterSettings,
  layout: ScaleFilterLayout,
): void {
  const { ctx, colours } = frame
  const { strip } = layout
  const top = strip.y
  const bottom = strip.y + strip.h
  // What comes out, low notes at the foot and loud to the right.
  const bins = frame.powered ? frame.signal?.spectrum : null
  const binHz = frame.signal?.binHz ?? 0
  if (bins && binHz > 0) {
    const rows = Math.max(2, Math.floor(strip.h / 2))
    const points: Point[] = []
    for (let r = 0; r <= rows; r++) {
      const y = bottom - (r / rows) * strip.h
      const from = hzOfY(y + strip.h / rows / 2, strip)
      const to = hzOfY(y - strip.h / rows / 2, strip)
      let db = -Infinity
      if (to - from < binHz) {
        // Low down a bin is taller than a row: read between two bins.
        const at = clamp((from + to) / 2 / binHz, 1, bins.length - 1)
        const below = Math.floor(at)
        const above = Math.min(bins.length - 1, below + 1)
        db = bins[below] + (bins[above] - bins[below]) * (at - below)
      } else {
        const first = clamp(Math.ceil(from / binHz), 1, bins.length - 1)
        const last = clamp(Math.floor(to / binHz), first, bins.length - 1)
        for (let i = first; i <= last; i++) if (bins[i] > db) db = bins[i]
      }
      const along = Number.isFinite(db) ? clamp(1 - db / STRIP_FOOT_DB, 0, 1) : 0
      points.push([strip.x + strip.w * along, y])
    }
    fillBetween(
      ctx,
      points,
      [
        [strip.x, bottom],
        [strip.x, top],
      ],
      colours.ink,
      INK.fill,
    )
    trace(ctx, points, { colour: colours.ink, width: 1, alpha: INK.back })
  }
  // The scale: a line up the side with a tick at 100 Hz, 1 kHz and 10 kHz.
  rule(ctx, strip.x, top, strip.x, bottom, { colour: colours.ink, alpha: INK.rule })
  for (const hz of [100, 1000, 10000]) {
    const y = scaleFilterY(hz, strip)
    rule(ctx, strip.x, y, strip.x + 3, y, { colour: colours.ink, alpha: INK.rule })
  }
  // Outside Low and High the mask is shut: shaded by how much less is heard there,
  // from half a semitone outside either, where the range is half open.
  const floor = dbToGain(-now.depth)
  const shade = 0.34 * now.mix * (1 - floor)
  const lowY = scaleFilterY(now.low * Math.pow(2, -0.5 / 12), strip)
  const highY = scaleFilterY(now.high * Math.pow(2, 0.5 / 12), strip)
  if (shade <= 0) {
    // Nothing is lost there, and nothing is shaded.
  } else if (highY < lowY) {
    fillRect(ctx, { x: strip.x, y: lowY, w: strip.w, h: bottom - lowY }, colours.ink, shade)
    fillRect(ctx, { x: strip.x, y: top, w: strip.w, h: highY - top }, colours.ink, shade)
  } else fillRect(ctx, strip, colours.ink, shade)
  for (const hz of [now.low, now.high]) {
    const y = scaleFilterY(hz, strip)
    rule(ctx, strip.x, y, strip.x + strip.w, y, { colour: colours.ink, alpha: INK.back })
  }
}

const display = plateDisplay<ScaleFilterState>({
  place: 'window',
  columns: 2,
  params: ['root', 'scale', 'chord', 'width', 'depth', 'low', 'high', 'tune', 'mix'],
  live: { meters: true, spectrum: true },
  info: 'The octave as a clock, C at the top: an opening at each note let through, as wide as Width and as deep between as Depth, with bars for each note going in and coming out. At the side, Low and High over the spectrum.',
  init: () => ({ level: 0, heard: false }),
  draw(frame) {
    ground(frame)
    const now = scaleFilterSettings(frame)
    const layout = scaleFilterLayout(frame)
    drawStrip(frame, now, layout)
    drawClock(frame, now, layout)
    for (const point of handlesOf(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    // In the middle: the root, or what the handle in hand is set to.
    const said: Record<string, string> = {
      width: `${Math.round(now.width)} ct`,
      depth: `${Math.round(now.depth)} dB`,
      low: hzText(now.low),
      high: hzText(now.high),
    }
    const word = frame.hot ? said[frame.hot] : undefined
    if (word) {
      frame.ctx.font = `8px ${frame.fontFamily}`
      const wide = frame.ctx.measureText(word).width
      label(frame, word, layout.cx - wide / 2, layout.cy + 3)
    } else
      text(frame, NOTE_NAMES[now.root], layout.cx, layout.cy + 4, { align: 'center', size: 10 })
  },
  handles: handlesOf,
})

export const SCALE_FILTER_FACES: Readonly<Record<string, PlateFace>> = {
  'scale-filter': { display, face: ['root', 'scale', 'chord', 'ring'] },
}
