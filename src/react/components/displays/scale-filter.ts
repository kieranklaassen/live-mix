// The display of the Scale Filter: one octave from C to B with an opening at
// every note the filter lets through, drawn from the device's own mask, over a
// keyboard whose keys are lit where a note passes; and at the foot the range
// of notes it is open in, over the spectrum of what comes out.

import {
  INK,
  clamp,
  dbToGain,
  fillRect,
  fillTo,
  follow,
  gainToDb,
  ground,
  handle,
  hzOfX,
  hzText,
  label,
  rule,
  spectrum,
  text,
  trace,
  xOfHz,
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

/** The deepest Depth goes, and so the foot of the octave's scale, in dB. */
export const SCALE_FILTER_RANGE_DB = 48
/** The bell is kept out to three widths, and is nothing past that (`kBellSpan`). */
const BELL_SPAN = 3
/** The spectrum at the foot runs from full scale down to this. */
const STRIP_FOOT_DB = -84

/** The keys of an octave from C: a letter for a natural, nothing for a sharp. */
const KEY_NAMES = ['C', '', 'D', '', 'E', 'F', '', 'G', '', 'A', '', 'B']

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

/**
 * The octave (twelve semitones across, 0 dB at its top and -48 dB at its
 * foot), the keyboard under it, and the range from 20 Hz to 20 kHz: at the
 * foot, or beside the octave where the display is too low for three rows.
 */
export interface ScaleFilterLayout {
  comb: Box
  keys: Box
  strip: Box
}

/** The room over the octave for the mark of the root's reach and its handle. */
const HEAD = 7
/** How far over the octave's top the reach of the root's opening is drawn. */
const REACH_UP = 2.5
/** A key's height: a letter of 8 px type and a pixel over and under. */
const KEYS_HIGH = 10
/** Between the octave's foot and the keys: the round ends of the bars. */
const UNDER = 2
const GAP = 3

export function scaleFilterLayout(view: Pick<DisplayView, 'width' | 'height'>): ScaleFilterLayout {
  // The box `ground` hands back: three pixels inside its line.
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  if (box.h < 64) {
    // A low strip: the range stands beside the octave.
    const beside = Math.round(box.w * 0.36)
    const wide = box.w - beside - 2 * GAP
    const high = Math.max(8, box.h - HEAD - UNDER - KEYS_HIGH)
    return {
      comb: { x: box.x, y: box.y + HEAD, w: wide, h: high },
      keys: { x: box.x, y: box.y + HEAD + high + UNDER, w: wide, h: KEYS_HIGH },
      strip: { x: box.x + wide + 2 * GAP, y: box.y + HEAD, w: beside, h: box.h - HEAD },
    }
  }
  const foot = clamp(Math.round(box.h * 0.2), 10, 18)
  const high = box.h - HEAD - UNDER - KEYS_HIGH - GAP - foot
  return {
    comb: { x: box.x, y: box.y + HEAD, w: box.w, h: high },
    keys: { x: box.x, y: box.y + HEAD + high + UNDER, w: box.w, h: KEYS_HIGH },
    strip: { x: box.x, y: box.y + box.h - foot, w: box.w, h: foot },
  }
}

/**
 * A pitch class brought into the octave as it is drawn: from half a semitone
 * under C (-0.5, the left edge) to half a semitone over B (11.5, the right).
 */
export function scaleFilterPlace(pitchClass: number): number {
  return ((((pitchClass + 0.5) % 12) + 12) % 12) - 0.5
}

/** Where a place in the octave stands across it: C in the middle of the first of twelve keys. */
export function scaleFilterX(place: number, comb: Box): number {
  return comb.x + ((place + 0.5) / 12) * comb.w
}

/** How far down the octave a gain stands: 0 dB at its top, -48 dB and under at its foot, even in dB between. */
export function scaleFilterLevel(gain: number, comb: Box): number {
  return comb.y + comb.h * clamp(-gainToDb(gain) / SCALE_FILTER_RANGE_DB, 0, 1)
}

/** How many widths from its note an opening has fallen 48 dB, to the octave's foot: exp(-2 ln2 x²) is 1/256 at 2. */
export const SCALE_FILTER_REACH = 2

/** Where the root stands, and the side of it its reach is marked and held on: the side with room for the widest. */
function rootOf(now: ScaleFilterSettings): { at: number; side: 1 | -1 } {
  const at = scaleFilterPlace(now.root + now.tune / 100)
  return { at, side: at <= 5.5 ? 1 : -1 }
}

// --- Handles ----------------------------------------------------------------

function rangeOf(view: DisplayView, name: string, low: number, high: number): [number, number] {
  const spec = view.spec(name)
  return [spec?.min ?? low, spec?.max ?? high]
}

function handlesOf(view: DisplayView): DisplayHandle[] {
  const now = scaleFilterSettings(view)
  const { comb, strip } = scaleFilterLayout(view)
  const semitone = comb.w / 12
  const reset = (name: string) => (): Record<string, number> => ({
    [name]: view.spec(name)?.default ?? view.value(name),
  })

  // Width: the end of the root's reach, two Widths from the root, over the octave's top.
  const [widthMin, widthMax] = rangeOf(view, 'width', 5, 200)
  const root = rootOf(now)
  const rootX = scaleFilterX(root.at, comb)
  const width: DisplayHandle = {
    key: 'width',
    name: 'Width',
    x: clamp(
      rootX + (root.side * semitone * SCALE_FILTER_REACH * now.width) / 100,
      comb.x,
      comb.x + comb.w,
    ),
    y: comb.y - REACH_UP,
    drag: (x) => ({
      width: clamp(
        ((Math.abs(x - rootX) / semitone) * 100) / SCALE_FILTER_REACH,
        widthMin,
        widthMax,
      ),
    }),
    wheel: (steps) => ({ width: clamp(now.width * Math.pow(1.1, steps), widthMin, widthMax) }),
    reset: reset('width'),
  }

  // Depth: on the device's own mask in the middle of the widest gap, where it is lowest.
  const [depthMin, depthMax] = rangeOf(view, 'depth', 0, SCALE_FILTER_RANGE_DB)
  const gap = scaleFilterGap(now)
  const bell = scaleFilterBell(gap.half, now.width)
  const floor = dbToGain(-now.depth)
  const depth: DisplayHandle = {
    key: 'depth',
    name: 'Depth',
    x: scaleFilterX(scaleFilterPlace(gap.middle), comb),
    y: scaleFilterLevel(floor + (1 - floor) * bell, comb),
    drag: (_x, y) => {
      // The gain that stands at the hand's height, and the floor that puts the mask there:
      // gain = floor + (1 - floor) * bell.
      const gain = dbToGain(-SCALE_FILTER_RANGE_DB * clamp((y - comb.y) / comb.h, 0, 1))
      const under = (gain - bell) / (1 - bell)
      return { depth: under > 0 ? clamp(-gainToDb(under), depthMin, depthMax) : depthMax }
    },
    reset: reset('depth'),
  }

  // Low and High: on their lines across the range, High the upper of the two.
  const end = (name: 'low' | 'high', title: string, down: number): DisplayHandle => {
    const [min, max] = rangeOf(view, name, 20, 20000)
    return {
      key: name,
      name: title,
      x: xOfHz(now[name], strip),
      y: strip.y + strip.h * down,
      drag: (x) => ({ [name]: clamp(hzOfX(x, strip), min, max) }),
      reset: reset(name),
    }
  }
  return [width, depth, end('low', 'Low', 0.7), end('high', 'High', 0.3)]
}

// --- Drawing ----------------------------------------------------------------

/** Points of a curve to a semitone; counted from the notes, so every opening's top is one of them. */
const CURVE_POINTS = 40

interface ScaleFilterState {
  /** The level the bars are read against, in the meters' steps: the loudest note of late. */
  level: number
  /** False until a note has come in. */
  heard: boolean
}

/** A gain across the octave as points, from its left edge to its right. */
function across(
  comb: Box,
  now: ScaleFilterSettings,
  gain: (pitchClass: number) => number,
): Point[] {
  const tuned = now.tune / 100
  const points: Point[] = []
  const put = (place: number): void => {
    points.push([scaleFilterX(place, comb), scaleFilterLevel(gain(place), comb)])
  }
  put(-0.5)
  const first = Math.ceil((-0.5 - tuned) * CURVE_POINTS)
  const last = Math.floor((11.5 - tuned) * CURVE_POINTS)
  for (let i = first; i <= last; i++) put(tuned + i / CURVE_POINTS)
  put(11.5)
  return points
}

/** A device reading as its two levels: what came in under a note and what went out, each 0 (nothing) to 63. */
export function scaleFilterReading(value: number): { in: number; out: number } {
  const whole = clamp(Math.round(Number.isFinite(value) ? value : 0), 0, 4095)
  return { in: whole % 64, out: Math.floor(whole / 64) }
}

/** The height a note's level stands at: `level` steps (dB) at the octave's top, 48 under it at the foot. */
export function scaleFilterBar(steps: number, level: number, comb: Box): number {
  return comb.y + comb.h * clamp((level - steps) / SCALE_FILTER_RANGE_DB, 0, 1)
}

function drawBars(
  frame: DisplayFrame<ScaleFilterState>,
  now: ScaleFilterSettings,
  comb: Box,
): void {
  const { ctx, colours, state } = frame
  const readings = KEY_NAMES.map((_, n) => scaleFilterReading(frame.meter(`note${n + 1}`)))
  const loudest = Math.max(...readings.map((reading) => Math.max(reading.in, reading.out)))
  if (loudest > 0) {
    // Up at once with a louder note, down slowly, and held while nothing comes.
    state.level = state.heard ? follow(state.level, loudest, frame.dt, 0, 4) : loudest
    state.heard = true
  }
  if (!state.heard) return
  const foot = comb.y + comb.h
  readings.forEach((reading, n) => {
    // The device reads a note where Tune has put it, and so its bar stands under its opening.
    const x = scaleFilterX(scaleFilterPlace(n + now.tune / 100), comb)
    const bar = (steps: number, colour: string, alpha: number): void => {
      if (steps <= 0) return
      rule(ctx, x, foot, x, scaleFilterBar(steps, state.level, comb), { colour, alpha, width: 3 })
    }
    bar(reading.in, colours.ink, INK.rule)
    bar(reading.out, colours.accent, 1)
  })
}

function drawComb(
  frame: DisplayFrame<ScaleFilterState>,
  now: ScaleFilterSettings,
  comb: Box,
): void {
  const { ctx, colours } = frame
  const right = comb.x + comb.w
  const foot = comb.y + comb.h
  // The scale: 0 dB along the top, -48 dB along the foot.
  rule(ctx, comb.x, comb.y, right, comb.y, { colour: colours.ink, alpha: INK.grid })
  rule(ctx, comb.x, foot, right, foot, { colour: colours.ink, alpha: INK.rule })
  // What is heard of each pitch, and over it the notes going in and coming out.
  const heard = across(comb, now, (pitchClass) => scaleFilterHeard(pitchClass, now))
  fillTo(ctx, heard, foot, colours.ink, INK.fill)
  trace(ctx, heard, { colour: colours.ink })
  // Over the curve, so a note is seen in an opening no wider than its bar.
  if (frame.powered) drawBars(frame, now, comb)
  // The device's own mask, where Mix lets less than all of it be heard.
  if (now.mix < 0.999)
    trace(
      ctx,
      across(comb, now, (pitchClass) => scaleFilterGain(pitchClass, now)),
      { colour: colours.ink, width: 1, alpha: INK.back, dash: [2, 2] },
    )
  // The root, and how far its opening reaches before it is 48 dB down: two Widths either side.
  const rootX = scaleFilterX(rootOf(now).at, comb)
  const reach = (((SCALE_FILTER_REACH * now.width) / 100) * comb.w) / 12
  rule(
    ctx,
    Math.max(comb.x, rootX - reach),
    comb.y - REACH_UP,
    Math.min(right, rootX + reach),
    comb.y - REACH_UP,
    { colour: colours.ink, alpha: INK.back },
  )
  rule(ctx, rootX, comb.y - 5, rootX, comb.y, { colour: colours.accent, width: 2 })
}

/**
 * The keyboard: a key for each semitone from C, the naturals with their
 * letters and the sharps half as high. A key is lit where its note is let
 * through (the root's in the accent), and stands back where it is not.
 */
function drawKeys(
  frame: DisplayFrame<ScaleFilterState>,
  now: ScaleFilterSettings,
  keys: Box,
): void {
  const { ctx, colours } = frame
  const wide = keys.w / 12
  KEY_NAMES.forEach((name, n) => {
    const open = (now.notes & (1 << ((n - now.root + 12) % 12))) !== 0
    const natural = name !== ''
    const key: Box = {
      x: keys.x + n * wide + 0.5,
      y: keys.y,
      w: wide - 1,
      h: natural ? keys.h : Math.round(keys.h / 2),
    }
    if (open) fillRect(ctx, key, n === now.root ? colours.accent : colours.ink)
    else fillRect(ctx, key, colours.ink, natural ? INK.grid : INK.rule)
    if (natural)
      text(frame, name, key.x + key.w / 2, keys.y + keys.h - 2, {
        align: 'center',
        colour: open ? colours.plate : colours.ink,
      })
  })
}

function drawStrip(
  frame: DisplayFrame<ScaleFilterState>,
  now: ScaleFilterSettings,
  strip: Box,
): void {
  const { ctx, colours } = frame
  const right = strip.x + strip.w
  const foot = strip.y + strip.h
  // What comes out, low notes at the left.
  if (frame.powered) spectrum(frame, strip, { topDb: 0, bottomDb: STRIP_FOOT_DB })
  // The scale: a line along the foot with a tick at 100 Hz, 1 kHz and 10 kHz.
  rule(ctx, strip.x, foot, right, foot, { colour: colours.ink, alpha: INK.rule })
  for (const hz of [100, 1000, 10000]) {
    const x = xOfHz(hz, strip)
    rule(ctx, x, foot - 3, x, foot, { colour: colours.ink, alpha: INK.rule })
  }
  // Outside Low and High the mask is shut: shaded by how much less is heard there,
  // from half a semitone outside either, where the range is half open.
  const floor = dbToGain(-now.depth)
  const shade = 0.34 * now.mix * (1 - floor)
  const lowX = xOfHz(now.low * Math.pow(2, -0.5 / 12), strip)
  const highX = xOfHz(now.high * Math.pow(2, 0.5 / 12), strip)
  if (shade <= 0) {
    // Nothing is lost there, and nothing is shaded.
  } else if (lowX < highX) {
    fillRect(ctx, { x: strip.x, y: strip.y, w: lowX - strip.x, h: strip.h }, colours.ink, shade)
    fillRect(ctx, { x: highX, y: strip.y, w: right - highX, h: strip.h }, colours.ink, shade)
  } else fillRect(ctx, strip, colours.ink, shade)
  for (const hz of [now.low, now.high]) {
    const x = xOfHz(hz, strip)
    rule(ctx, x, strip.y, x, foot, { colour: colours.ink, alpha: INK.back })
  }
}

const display = plateDisplay<ScaleFilterState>({
  place: 'window',
  columns: 2,
  params: ['root', 'scale', 'chord', 'width', 'depth', 'low', 'high', 'tune', 'mix'],
  live: { meters: true, spectrum: true },
  info: 'One octave from C to B: an opening at each note let through, as wide as Width and as deep between as Depth, with bars for each note going in and coming out. The keys under it are lit where a note passes. At the foot, Low and High over the spectrum.',
  init: () => ({ level: 0, heard: false }),
  draw(frame) {
    ground(frame)
    const now = scaleFilterSettings(frame)
    const { comb, keys, strip } = scaleFilterLayout(frame)
    drawStrip(frame, now, strip)
    drawComb(frame, now, comb)
    drawKeys(frame, now, keys)
    const handles = handlesOf(frame)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    // What the handle in hand is set to, in the corner of the octave away from it.
    const said: Record<string, string> = {
      width: `${Math.round(now.width)} ct`,
      depth: `${Math.round(now.depth)} dB`,
      low: hzText(now.low),
      high: hzText(now.high),
    }
    const held = handles.find((point) => point.key === frame.hot)
    if (held && said[held.key]) {
      const left = held.x >= comb.x + comb.w / 2
      label(
        frame,
        said[held.key],
        left ? comb.x + 3 : comb.x + comb.w - 3,
        comb.y + 11,
        left ? 'left' : 'right',
      )
    }
  },
  handles: handlesOf,
})

export const SCALE_FILTER_FACES: Readonly<Record<string, PlateFace>> = {
  'scale-filter': { display, face: ['root', 'scale', 'chord', 'ring'] },
}
