// The display of Size: the body of a sound and the notes it is played in,
// apart.
//
// Behind is the spectrum of what comes out: the notes, each partial an
// upright mark. Over it lie two outlines of the body. The dashed one is the
// body as the sound comes in, which the device reports at twenty-four
// frequencies. The solid one is the body as it goes out, worked out here the
// way `size.h` works out its gain: the outline read where Size has slid it
// to, no more than 18 dB above and 24 dB below the one that stands there,
// with the Tone tilt and the level the device makes up. Two points slide the
// two things the effect keeps apart: the upper one the body, the lower one
// the notes, both along the picture's own frequency scale.
//
// While nothing sounds the outlines are a worked example, a body with two
// hills, moved by the same sum.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  freqGrid,
  ground,
  handle,
  hzOfX,
  lerp,
  rule,
  spectrum,
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

/** `size.h`: Size at 1 is so many octaves of the body, Wander adds so many at the most, Width sets each side so far from the middle, and together they come to no more than the last. */
export const SIZE_OCTAVES = 1
export const SIZE_WANDER_OCTAVES = 0.75
export const SIZE_WIDTH_OCTAVES = 0.25
export const SIZE_MOST_OCTAVES = 1.5
/** `size.h`: the gain a bin may be given (`kMostLift`, `kLeastLift`), in dB. */
export const SIZE_MOST_GAIN_DB = 18
export const SIZE_LEAST_GAIN_DB = -24
/** `size.h`: Tone at 1 tilts by so many dB an octave about the pivot, by no more than the last. */
export const SIZE_TILT_DB_PER_OCTAVE = 4.5
export const SIZE_TILT_MOST_DB = 18
export const SIZE_TILT_PIVOT_HZ = 1000
/** `size.h`: the outline is reported at so many frequencies, from the first, so many octaves apart. */
export const SIZE_BODY_POINTS = 24
export const SIZE_BODY_FIRST_HZ = 40
export const SIZE_BODY_STEP_OCTAVES = 0.375
/** `size.h`: what a reading of the outline says when there is nothing (`kMeterFloorDb`). */
export const SIZE_METER_FLOOR_DB = -120

/** The picture's frequency scale: six and a half octaves, and the middle of it, where both points stand at nothing. */
export const SIZE_MIN_HZ = 80
export const SIZE_MAX_HZ = 7240
export const SIZE_MIDDLE_HZ = Math.sqrt(SIZE_MIN_HZ * SIZE_MAX_HZ)
/** Its level scale. */
export const SIZE_TOP_DB = -6
export const SIZE_FOOT_DB = -84
/** The height of the row each point slides in, above and below the picture. */
const SIZE_ROW = 10
/** Under this nothing of the resized sound is heard, as for the plate that draws the display. */
const QUIET = 1e-4

const SIZE_BODY_METERS: readonly string[] = Array.from(
  { length: SIZE_BODY_POINTS },
  (_, point) => `body${point + 1}`,
)

/** The frequency the outline's reading number `point` is taken at. */
export const sizeBodyHz = (point: number): number =>
  SIZE_BODY_FIRST_HZ * Math.pow(2, SIZE_BODY_STEP_OCTAVES * point)

/** The outline between its readings, in dB: straight from one to the next over octaves; past either end, the end. */
export function sizeBodyDb(body: ArrayLike<number>, hz: number): number {
  const at = clamp(
    Math.log2(Math.max(hz, 1e-3) / SIZE_BODY_FIRST_HZ) / SIZE_BODY_STEP_OCTAVES,
    0,
    SIZE_BODY_POINTS - 1,
  )
  const below = Math.min(SIZE_BODY_POINTS - 2, Math.floor(at))
  return lerp(body[below], body[below + 1], at - below)
}

/** Tone at a frequency, in dB: `update_tilt()`. */
export function sizeTiltDb(hz: number, tone: number): number {
  return clamp(
    tone * SIZE_TILT_DB_PER_OCTAVE * Math.log2(hz / SIZE_TILT_PIVOT_HZ),
    -SIZE_TILT_MOST_DB,
    SIZE_TILT_MOST_DB,
  )
}

/**
 * The body of what comes out at a frequency, in dB, as `frame()` makes it. The
 * notes, moved by `semitones`, carry the body with them, so under them stands
 * the outline of `hz / ratio`; wanted is the outline of a body `octaves`
 * larger, which has at `hz` what the body had at `hz × 2^octaves`. The gain
 * is the one less the other, kept between its two ends, then the tilt and
 * the level the device makes up.
 */
export function sizeMovedDb(
  body: ArrayLike<number>,
  hz: number,
  octaves: number,
  semitones: number,
  tone: number,
  levelDb: number,
): number {
  const stands = sizeBodyDb(body, hz / Math.pow(2, semitones / 12))
  const wants = sizeBodyDb(body, hz * Math.pow(2, octaves))
  return (
    stands +
    clamp(wants - stands, SIZE_LEAST_GAIN_DB, SIZE_MOST_GAIN_DB) +
    sizeTiltDb(hz, tone) +
    levelDb
  )
}

/** The size of one side (0 left, 1 right) with no drift, in octaves: `size_of()`. */
export function sizeSideOctaves(size: number, width: number, side: 0 | 1): number {
  return clamp(
    size * SIZE_OCTAVES + (side === 1 ? 1 : -1) * width * SIZE_WIDTH_OCTAVES,
    -SIZE_MOST_OCTAVES,
    SIZE_MOST_OCTAVES,
  )
}

/** The worked example: a body that falls 5 dB an octave with a hill at 700 Hz and a smaller one at 3 kHz. */
export function sizeExampleDb(hz: number): number {
  const first = Math.log2(hz / 700) / 0.4
  const second = Math.log2(hz / 3000) / 0.3
  return (
    -26 -
    5 * Math.log2(Math.max(hz, 150) / 150) -
    14 * Math.max(0, Math.log2(150 / hz)) +
    16 * Math.exp(-0.5 * first * first) +
    10 * Math.exp(-0.5 * second * second)
  )
}

const SIZE_EXAMPLE = Float32Array.from({ length: SIZE_BODY_POINTS }, (_, point) =>
  sizeExampleDb(sizeBodyHz(point)),
)

interface SizeLayout {
  /** The spectrum and the outlines. */
  plot: Box
  /** The rows the two points slide in. */
  bodyY: number
  notesY: number
}

export function sizeLayout(view: Pick<DisplayView, 'width' | 'height'>): SizeLayout {
  const plot = {
    x: 4,
    y: 3 + SIZE_ROW,
    w: Math.max(8, view.width - 8),
    h: Math.max(8, view.height - 6 - 2 * SIZE_ROW),
  }
  return { plot, bodyY: 3 + SIZE_ROW / 2, notesY: plot.y + plot.h + SIZE_ROW / 2 }
}

/** Where a frequency so many octaves from the middle of the scale stands across the picture. */
export const sizeX = (octaves: number, plot: Box): number =>
  xOfHz(SIZE_MIDDLE_HZ * Math.pow(2, octaves), plot, SIZE_MIN_HZ, SIZE_MAX_HZ)

/** And back: how many octaves from the middle a place across the picture is. */
export const sizeOctavesAt = (x: number, plot: Box): number =>
  Math.log2(hzOfX(x, plot, SIZE_MIN_HZ, SIZE_MAX_HZ) / SIZE_MIDDLE_HZ)

function sizeHandles(view: DisplayView): DisplayHandle[] {
  const { plot, bodyY, notesY } = sizeLayout(view)
  const sizeSpec = view.spec('size')
  const pitchSpec = view.spec('pitch')
  const fine = view.value('fine') / 100
  return [
    {
      // A body `size` octaves larger lies that far down the scale.
      key: 'size',
      name: 'Body',
      x: sizeX(-view.value('size') * SIZE_OCTAVES, plot),
      y: bodyY,
      drag: (x) => ({
        size: clamp(
          -sizeOctavesAt(x, plot) / SIZE_OCTAVES,
          sizeSpec?.min ?? -1,
          sizeSpec?.max ?? 1,
        ),
      }),
      reset: () => ({ size: sizeSpec?.default ?? 0 }),
    },
    {
      // The notes stand where Pitch and Fine together put them; the point sets the whole semitones.
      key: 'pitch',
      name: 'Notes',
      x: sizeX((view.value('pitch') + fine) / 12, plot),
      y: notesY,
      drag: (x) => ({
        pitch: clamp(
          Math.round(12 * sizeOctavesAt(x, plot) - fine),
          pitchSpec?.min ?? -12,
          pitchSpec?.max ?? 12,
        ),
      }),
      reset: () => ({ pitch: pitchSpec?.default ?? 0 }),
    },
  ]
}

interface SizeState {
  /** The outline's readings, in dB. */
  body: Float32Array
  /** The outlines' points, written again on every frame. */
  stands: Point[]
  left: Point[]
  right: Point[]
}

/** `count` points to write into. */
function points(kept: Point[], count: number): Point[] {
  if (kept.length === count) return kept
  return Array.from({ length: count }, (): [number, number] => [0, 0])
}

const sizeY = (db: number, plot: Box): number =>
  clamp(yOfDb(db, plot, SIZE_TOP_DB, SIZE_FOOT_DB), plot.y, plot.y + plot.h)

/** A number of semitones as it is said: "+7 st", "−5 st", "+0.12 st". */
function semitoneText(semitones: number): string {
  const whole = Math.abs(semitones - Math.round(semitones)) < 0.005
  const size = whole ? String(Math.abs(Math.round(semitones))) : Math.abs(semitones).toFixed(2)
  const sign = Math.round(semitones * 100) > 0 ? '+' : Math.round(semitones * 100) < 0 ? '−' : ''
  return `${sign}${size} st`
}

const size = plateDisplay<SizeState>({
  place: 'window',
  columns: 2,
  params: ['size', 'pitch', 'fine', 'wander', 'width', 'tone', 'mix'],
  live: { meters: true, spectrum: true },
  info: 'The spectrum of what comes out, and over it the body of the sound: dashed as it comes in, solid where Size has slid it to. The upper point slides the body down the scale for a larger thing and up for a smaller one. The lower point moves the notes.',
  init: () => ({
    body: new Float32Array(SIZE_BODY_POINTS).fill(SIZE_METER_FLOOR_DB),
    stands: [],
    left: [],
    right: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { plot, bodyY, notesY } = sizeLayout(frame)
    const knob = frame.value('size')
    const width = clamp(frame.value('width'), 0, 1)
    const wander = clamp(frame.value('wander'), 0, 1)
    const semitones = frame.value('pitch') + frame.value('fine') / 100
    const tone = frame.value('tone')
    const heard = frame.value('mix') > QUIET
    const live = frame.powered && frame.dt > 0 && frame.hasMeter('sizeLeft')

    // The device is read whether or not its work is heard.
    let sounding = false
    if (live) {
      for (let point = 0; point < SIZE_BODY_POINTS; point++) {
        const reading = frame.meter(SIZE_BODY_METERS[point])
        state.body[point] = Number.isFinite(reading) ? reading : SIZE_METER_FLOOR_DB
        if (reading > SIZE_METER_FLOOR_DB + 1) sounding = true
      }
    }
    const body = sounding ? state.body : SIZE_EXAMPLE
    const sides: [number, number] = live
      ? [
          clamp(frame.meter('sizeLeft'), -SIZE_MOST_OCTAVES, SIZE_MOST_OCTAVES),
          clamp(frame.meter('sizeRight'), -SIZE_MOST_OCTAVES, SIZE_MOST_OCTAVES),
        ]
      : [sizeSideOctaves(knob, width, 0), sizeSideOctaves(knob, width, 1)]
    const level = sounding ? clamp(frame.meter('level'), -24, 24) : 0

    freqGrid(frame, plot, SIZE_MIN_HZ, SIZE_MAX_HZ)

    // The outlines: a point every second pixel.
    const count = Math.floor(plot.w / 2) + 1
    state.stands = points(state.stands, count)
    state.left = points(state.left, count)
    state.right = points(state.right, count)
    for (let n = 0; n < count; n++) {
      const x = plot.x + Math.min(plot.w, n * 2)
      const hz = hzOfX(x, plot, SIZE_MIN_HZ, SIZE_MAX_HZ)
      state.stands[n][0] = x
      state.stands[n][1] = sizeY(sizeBodyDb(body, hz), plot)
      state.left[n][0] = x
      state.left[n][1] = sizeY(sizeMovedDb(body, hz, sides[0], semitones, tone, level), plot)
      state.right[n][0] = x
      state.right[n][1] = sizeY(sizeMovedDb(body, hz, sides[1], semitones, tone, level), plot)
    }
    const apart = Math.abs(sides[0] - sides[1]) > 0.01
    clipped(ctx, plot, () => {
      // The notes: what comes out.
      spectrum(frame, plot, {
        topDb: SIZE_TOP_DB,
        bottomDb: SIZE_FOOT_DB,
        minHz: SIZE_MIN_HZ,
        maxHz: SIZE_MAX_HZ,
        alpha: INK.fill * 1.5,
      })
      // The body as it comes in, and as it goes out: in the second colour while it is the sound's own.
      trace(ctx, state.stands, { colour: colours.ink, width: 1, alpha: INK.back, dash: [2, 2] })
      if (heard) {
        const colour = sounding ? colours.accent : colours.ink
        if (apart) trace(ctx, state.right, { colour, width: 1, alpha: 0.75 })
        trace(ctx, state.left, { colour, width: 1.5 })
      }
    })

    // The body's row: how far Size reaches, where nothing is moved, how far
    // the drift carries it from where the knob stands, and where Width sets
    // the two sides.
    const [bodyPoint, notesPoint] = sizeHandles(frame)
    rule(ctx, sizeX(-SIZE_OCTAVES, plot), bodyY, sizeX(SIZE_OCTAVES, plot), bodyY, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    const middle = sizeX(0, plot)
    rule(ctx, middle, bodyY - 3, middle, bodyY + 3, { colour: colours.ink, alpha: INK.rule })
    if (wander > 0) {
      const reach = wander * SIZE_WANDER_OCTAVES
      const from = sizeX(
        clamp(-knob * SIZE_OCTAVES - reach, -SIZE_MOST_OCTAVES, SIZE_MOST_OCTAVES),
        plot,
      )
      const to = sizeX(
        clamp(-knob * SIZE_OCTAVES + reach, -SIZE_MOST_OCTAVES, SIZE_MOST_OCTAVES),
        plot,
      )
      fillRect(ctx, { x: from, y: bodyY - 1.5, w: to - from, h: 3 }, colours.ink, INK.back)
    }
    if (width > 0) {
      for (const side of [0, 1] as const) {
        const x = sizeX(-sizeSideOctaves(knob, width, side), plot)
        rule(ctx, x, bodyY - 3, x, bodyY + 3, { colour: colours.ink })
      }
    }
    // Where each side's body stands now.
    if (live && heard) {
      for (const side of apart ? [1, 0] : [0]) {
        dot(ctx, sizeX(-sides[side], plot), bodyY, 2, colours.accent, {
          alpha: side === 1 ? 0.75 : 1,
        })
      }
    }
    handle(frame, bodyPoint.x, bodyPoint.y, { hot: frame.hot === bodyPoint.key })

    // The notes' row: an octave either way, and where they are.
    rule(ctx, sizeX(-1, plot), notesY, sizeX(1, plot), notesY, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    for (const octave of [-1, 0, 1]) {
      const x = sizeX(octave, plot)
      rule(ctx, x, notesY - 3, x, notesY + 3, { colour: colours.ink, alpha: INK.rule })
    }
    handle(frame, notesPoint.x, notesPoint.y, { hot: frame.hot === notesPoint.key })

    // In words: how many times as large the body is, and how far the notes have moved.
    const times = Math.pow(2, (sides[0] + sides[1]) / 2)
    text(frame, 'BODY', plot.x, bodyY + 3)
    text(frame, `×${times.toFixed(2)}`, plot.x + plot.w, bodyY + 3, { align: 'right' })
    text(frame, 'NOTES', plot.x, notesY + 3)
    text(frame, semitoneText(semitones), plot.x + plot.w, notesY + 3, { align: 'right' })
  },
  handles: sizeHandles,
})

export const SIZE_FACES: Readonly<Record<string, PlateFace>> = {
  size: {
    display: size,
    face: ['size', 'pitch', 'wander', 'mix'],
  },
}
