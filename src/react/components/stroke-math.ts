// Geometry of a painted stroke (`Stroke.tsx`), kept pure so the drawing and
// anything a host derives from it (hit testing, tests) agree. A stroke is a
// pill `width` × `height` px; the waveform inside is mirrored about the
// centre line, one column every `STROKE_COLUMN_PX`, and never crosses the
// rounded ends. Positions along the stroke are fractions of its width.

import { type WaveformPeaks } from '../../core/clips/peaks'

/** Horizontal pitch of the waveform columns, in px. */
export const STROKE_COLUMN_PX = 2
/** Clear space between the waveform and the ring, in px. */
export const STROKE_INSET_PX = 3

/** One waveform column: its x and its half-height, both in px. */
export type StrokeLevel = readonly [x: number, amp: number]

export interface StrokeLevelsOptions {
  width: number
  height: number
  /** One pass of the source; without it the stroke draws a flat line. */
  peaks?: WaveformPeaks | null
  /** Passes of the source across the stroke (1 = once; 2.5 = two and a half). */
  repeats?: number
  /**
   * How far into a pass the stroke begins, as a fraction of one (0 up to 1):
   * a stroke cut from a longer one, which goes on from where the cut fell and
   * comes round to the top of the pass after it. Default 0, the top.
   */
  phase?: number
  /** Fade lengths as fractions of the width. */
  fadeIn?: number
  fadeOut?: number
  /** Linear gain applied to the drawn amplitude. */
  gain?: number
  reversed?: boolean
  /** Scale the loudest column to the full height (default true). */
  normalize?: boolean
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** The gain of a fade `progress` of the way through it: an equal-power rise. */
export function fadeEase(progress: number): number {
  return Math.sin((Math.PI / 2) * clamp01(progress)) ** 2
}

/** Gain from the fades at fraction `t` of the stroke. */
export function fadeGainAt(t: number, fadeIn = 0, fadeOut = 0): number {
  const rise = fadeIn > 0 ? fadeEase(t / fadeIn) : 1
  const fall = fadeOut > 0 ? fadeEase((1 - t) / fadeOut) : 1
  return Math.min(rise, fall)
}

/** How far the pill's rounded end is from its flat edge at `x`, in px (0 in the straight part). */
export function capInset(x: number, width: number, height: number): number {
  const radius = height / 2
  const fromEnd = Math.min(x, width - x)
  if (fromEnd >= radius) return 0
  return radius - Math.sqrt(Math.max(0, radius * radius - (radius - fromEnd) ** 2))
}

/** The gain of a whole fade: what `fadeEase` gives everywhere past its end. */
const FULL_EASE = fadeEase(1)

// What a stroke is worked out in, kept from one stroke to the next: its
// columns, their averages, and the pieces of the path being written. A stroke
// is worked out in one go and nothing else runs meanwhile. Made anew for each
// stroke, the columns are memory outside the heap that the page has to account
// for and free, and a path put together piece by piece stays a chain of
// thousands of pieces until the page reads it: a zoom step of a field of
// strokes left the browser three times the memory to collect.
let AMPS: Float64Array = new Float64Array(1024)
let SMOOTH: Float64Array = new Float64Array(1024)
const PIECES: string[] = []

/** Room for `count` columns in a kept array: the same one while it is long enough. */
function roomFor(kept: Float64Array, count: number): Float64Array {
  return kept.length >= count ? kept : new Float64Array(Math.max(count, kept.length * 2))
}

/** The first `count` pieces as one text, flat: what `Array.prototype.join` makes. */
function joined(count: number): string {
  PIECES.length = count
  return PIECES.join('')
}

/**
 * The half-heights of a stroke's columns, left to right, written to `AMPS`;
 * answers with how many there are. Column `c` stands at
 * `c * STROKE_COLUMN_PX + STROKE_COLUMN_PX / 2`. Every figure is worked out
 * with the same operations in the same order as it always was, so the result
 * is the same to the last bit; what is left out is work whose result is known.
 */
function columnAmps({
  width,
  height,
  peaks,
  repeats = 1,
  phase = 0,
  fadeIn = 0,
  fadeOut = 0,
  gain = 1,
  reversed = false,
  normalize = true,
}: StrokeLevelsOptions): number {
  // (A width that is not a number has no columns.)
  const columns = Math.max(0, Math.floor(width / STROKE_COLUMN_PX)) || 0
  const radius = height / 2
  const room = Math.max(0, radius - STROKE_INSET_PX)
  const count = peaks ? Math.min(peaks.min.length, peaks.max.length) : 0
  let loudest = 1
  if (peaks && count > 0 && normalize) {
    loudest = 0
    for (let index = 0; index < count; index += 1) {
      loudest = Math.max(loudest, Math.abs(peaks.min[index]), Math.abs(peaks.max[index]))
    }
    if (loudest <= 0) loudest = 1
  }
  const passes = Math.max(repeats, 1e-6)
  const into = passPhase(phase)
  const source = peaks && count > 0 ? peaks : null
  // Between the round ends nothing is taken off the room, and without a fade the gain is 1.
  const straight = Math.max(0, room - 0)
  const rises = fadeIn > 0
  const falls = fadeOut > 0
  AMPS = roomFor(AMPS, columns)
  const amps = AMPS
  for (let column = 0; column < columns; column += 1) {
    const x = column * STROKE_COLUMN_PX + STROKE_COLUMN_PX / 2
    const t = x / width
    let value = 0
    if (source) {
      // Below one pass the remainder is the number itself. (A stroke that begins at the top adds nothing.)
      const along = into > 0 ? t * passes + into : t * passes
      let position = along < 1 ? along : along % 1
      if (reversed) position = 1 - position
      const index = Math.min(count - 1, Math.max(0, Math.floor(position * count)))
      value = Math.max(Math.abs(source.min[index]), Math.abs(source.max[index])) / loudest
    }
    const limit =
      Math.min(x, width - x) >= radius ? straight : Math.max(0, room - capInset(x, width, height))
    let amp = clamp01(value * gain)
    if (rises || falls) {
      // Past the end of a fade its gain is that of the whole fade, with no sine to take.
      const rise = rises ? (t / fadeIn >= 1 ? FULL_EASE : fadeEase(t / fadeIn)) : 1
      const fall = falls ? ((1 - t) / fadeOut >= 1 ? FULL_EASE : fadeEase((1 - t) / fadeOut)) : 1
      amp *= Math.min(rise, fall)
    }
    amps[column] = Math.max(0.5, Math.min(limit, amp * room))
  }
  return columns
}

/** The waveform columns of a stroke, left to right. */
export function strokeLevels(options: StrokeLevelsOptions): StrokeLevel[] {
  const count = columnAmps(options)
  const levels: StrokeLevel[] = []
  for (let column = 0; column < count; column += 1) {
    levels.push([column * STROKE_COLUMN_PX + STROKE_COLUMN_PX / 2, AMPS[column]])
  }
  return levels
}

/** How many tenths have their text kept: every coordinate of a stroke up to 819 px. */
const TENTHS_KEPT = 8192
const TENTHS = new Array<string | undefined>(TENTHS_KEPT)

/** A whole number of tenths as `toFixed(1)` prints it: 315 is `31.5`. */
function tenthsText(tenths: number): string {
  const digit = tenths % 10
  return `${(tenths - digit) / 10}.${digit}`
}

/**
 * `value.toFixed(1)`, which every coordinate of a path is printed with, at a
 * fraction of its cost. `toFixed(1)` gives the whole number of tenths nearest
 * to the exact value of `value × 10`, the larger one on a tie. `scaled` is
 * that product as a double, and below 1e10 it is off by less than a millionth.
 * So wherever `scaled` stands a ten-thousandth or more clear of a tie, the
 * exact product rounds to the same whole number, and its text is that number
 * with a point before its last digit. Anything else goes to `toFixed` itself:
 * a tie or a number right next to one, a negative, a huge one, not a number.
 */
function fixed(value: number): string {
  if (value >= 0 && value < 1e9) {
    const scaled = value * 10
    const tenths = Math.round(scaled)
    const off = scaled - tenths
    if (off > -0.4999 && off < 0.4999) {
      if (tenths >= TENTHS_KEPT) return tenthsText(tenths)
      return (TENTHS[tenths] ??= tenthsText(tenths))
    }
  }
  return value.toFixed(1)
}

/** One vertical bar per column: the fine detail drawn over the filled shape. */
export function levelsBarsPath(levels: readonly StrokeLevel[], mid: number): string {
  let pieces = 0
  for (let index = 0; index < levels.length; index += 1) {
    const level = levels[index]
    // A hole in the array is no bar.
    if (level === undefined && !(index in levels)) continue
    PIECES[pieces++] = `M${level[0]} `
    PIECES[pieces++] = fixed(mid - level[1])
    PIECES[pieces++] = 'V'
    PIECES[pieces++] = fixed(mid + level[1])
  }
  return joined(pieces)
}

/**
 * The outline of the first `count` columns of `AMPS`: `moves[c]` is the
 * `L{x} ` that leads to column `c`, shared by the upper and the lower edge.
 */
function outlinePath(
  moves: readonly string[],
  count: number,
  mid: number,
  width: number,
  scale: number,
  window: number,
): string {
  if (count === 0) return ''
  // Only a whole window reaches a neighbour; any other averages nothing.
  const reach = Number.isInteger(window) && window >= 0 ? window : -1
  const amps = AMPS
  SMOOTH = roomFor(SMOOTH, count)
  const smooth = SMOOTH
  for (let index = 0; index < count; index += 1) {
    const first = Math.max(0, index - reach)
    const last = Math.min(count - 1, index + reach)
    // Summed from the left, as the average always was: the order is part of the result.
    let total = 0
    for (let near = first; near <= last; near += 1) total += amps[near]
    const samples = last >= first ? last - first + 1 : 0
    smooth[index] = Math.min(mid, (total / samples) * scale)
  }
  // Each piece is a text that is kept (a column's move, a figure in tenths) or
  // one of the three made here: nothing is made per column but the path.
  let pieces = 0
  PIECES[pieces++] = `M0 ${mid}`
  for (let index = 0; index < count; index += 1) {
    PIECES[pieces++] = moves[index]
    PIECES[pieces++] = fixed(mid - smooth[index])
  }
  PIECES[pieces++] = `L${width} ${mid}`
  for (let index = count - 1; index >= 0; index -= 1) {
    PIECES[pieces++] = moves[index]
    PIECES[pieces++] = fixed(mid + smooth[index])
  }
  PIECES[pieces++] = 'Z'
  return joined(pieces)
}

/**
 * The filled, mirrored outline of the levels. `window` columns either side are
 * averaged (0 keeps every transient sharp); `scale` swells it for the halo.
 */
export function levelsOutlinePath(
  levels: readonly StrokeLevel[],
  mid: number,
  width: number,
  scale = 1,
  window = 2,
): string {
  const count = levels.length
  const moves: string[] = []
  AMPS = roomFor(AMPS, count)
  for (let index = 0; index < count; index += 1) {
    const level = levels[index]
    moves.push(`L${level[0]} `)
    AMPS[index] = level[1]
  }
  return outlinePath(moves, count, mid, width, scale, window)
}

/** How much taller than the wave its halo is drawn. */
const HALO_SCALE = 1.4

/** How many columns have their `L{x} ` kept between strokes: a stroke up to 32768 px wide. */
const MOVES_KEPT = 16384
const COLUMN_MOVES: string[] = []

const BAR_MOVES: string[] = []

/**
 * The `L{x} ` that leads to each of the first `count` columns, or the `M{x} `
 * a bar starts with. A column always stands at the same x, so the text is
 * made once and every stroke reads it.
 */
function columnMoves(count: number, letter: 'L' | 'M' = 'L'): readonly string[] {
  const moves = count > MOVES_KEPT ? [] : letter === 'L' ? COLUMN_MOVES : BAR_MOVES
  for (let column = moves.length; column < count; column += 1) {
    moves.push(`${letter}${column * STROKE_COLUMN_PX + STROKE_COLUMN_PX / 2} `)
  }
  return moves
}

/**
 * The filled outline of a stroke alone: the `wave` of `strokeWavePaths`, for a
 * host that draws a second shape of the same stroke and wants no halo or bars.
 */
export function strokeOutlinePath(options: StrokeLevelsOptions, window = 2): string {
  const count = columnAmps(options)
  return outlinePath(columnMoves(count), count, options.height / 2, options.width, 1, window)
}

/** The waveform of a stroke as the three paths it is drawn with. */
export interface StrokeWavePaths {
  /** The soft shape behind the wave: swollen, and averaged one column wider. */
  halo: string
  /** The filled outline. */
  wave: string
  /** A fine bar on every other column. */
  bars: string
}

/**
 * The halo, the wave and the bars of a stroke in one go. The strings are those
 * of `levelsOutlinePath(levels, mid, width, 1.4, window + 1)`,
 * `levelsOutlinePath(levels, mid, width, 1, window)` and `levelsBarsPath` of
 * every other level, for `levels = strokeLevels(options)` and the centre line
 * `mid = height / 2`, without the columns being laid out, read and printed
 * once for each. `window` is 2 for a sustained sound and 0 for one with hits.
 */
export function strokeWavePaths(options: StrokeLevelsOptions, window = 2): StrokeWavePaths {
  const mid = options.height / 2
  const count = columnAmps(options)
  const moves = columnMoves(count)
  const starts = columnMoves(count, 'M')
  let pieces = 0
  for (let column = 0; column < count; column += 2) {
    PIECES[pieces++] = starts[column]
    PIECES[pieces++] = fixed(mid - AMPS[column])
    PIECES[pieces++] = 'V'
    PIECES[pieces++] = fixed(mid + AMPS[column])
  }
  const bars = joined(pieces)
  return {
    halo: outlinePath(moves, count, mid, options.width, HALO_SCALE, window + 1),
    wave: outlinePath(moves, count, mid, options.width, 1, window),
    bars,
  }
}

export interface FadePaths {
  /** The two curves closing toward the centre line. */
  curve: string
  /** The area outside the curves, shaded to show what the fade removes. */
  shade: string
  /** Where the fade ends on the top edge: the handle. */
  handle: readonly [x: number, y: number]
}

/** Paths of a fade `fraction` of the width long, from the left or (`fromEnd`) the right. */
export function fadePaths(
  fraction: number,
  width: number,
  height: number,
  fromEnd = false,
): FadePaths {
  const mid = height / 2
  const reach = mid - 1
  const length = clamp01(fraction) * width
  // A point every 3 px along the fade, each printed once for the two curves it is on.
  let top = ''
  let bottom = ''
  for (let x = 0; x < length; x += 3) {
    const amp = fadeEase(x / length) * reach
    const move = `L${fixed(fromEnd ? width - x : x)} `
    top += move + fixed(mid - amp)
    bottom += move + fixed(mid + amp)
  }
  const start = fixed(fromEnd ? width - 0 : 0)
  const end = fixed(fromEnd ? width - length : length)
  top += `L${end} ${fixed(mid - reach)}`
  bottom += `L${end} ${fixed(mid + reach)}`
  return {
    curve: `M${start} ${mid}${top}M${start} ${mid}${bottom}`,
    shade: `M${start} 0L${start} ${mid}${top}L${end} 0ZM${start} ${height}L${start} ${mid}${bottom}L${end} ${height}Z`,
    handle: [fromEnd ? width - length : length, 3.5],
  }
}

/**
 * Automation breakpoints (`[t, value]`, both 0..1) as px positions inside the
 * stroke. Near the rounded ends a point is pulled toward the centre line so
 * its node stays inside the ring.
 */
export function automationPositions(
  points: readonly (readonly [number, number])[],
  width: number,
  height: number,
): (readonly [number, number])[] {
  const pad = Math.min(width / 2, Math.max(4, Math.round(height * 0.15)))
  return points.map(([t, value]) => {
    const x = Math.round(pad + clamp01(t) * (width - pad * 2))
    const edge = Math.min(height / 2, capInset(x, width, height) + 5)
    const y = 5 + (1 - clamp01(value)) * (height - 10)
    return [x, Math.round(Math.min(height - edge, Math.max(edge, y)))] as const
  })
}

/** A stroke's `phase` as a fraction of a pass, 0 up to 1; anything else is the top. */
export function passPhase(phase: number | undefined): number {
  return phase !== undefined && phase > 0 && phase < 1 ? phase : 0
}

/** Whether a stroke comes round to the top of its sound: it is longer than what is left of its first pass. */
export function strokeRepeats(repeats: number, phase = 0): boolean {
  return repeats + passPhase(phase) > 1 + 1e-6
}

/** Where each repeat after the first starts, in px. A stroke that begins `phase` into a pass comes to them that much sooner. */
export function repeatSeams(repeats: number, width: number, phase = 0): number[] {
  const into = passPhase(phase)
  if (into > 0) {
    if (!strokeRepeats(repeats, into)) return []
    const pass = width / repeats
    const seams: number[] = []
    for (let index = 1; (index - into) * pass < width - 0.5; index += 1) {
      seams.push(Math.round((index - into) * pass))
    }
    return seams
  }
  if (!(repeats > 1)) return []
  const pass = width / repeats
  const seams: number[] = []
  for (let index = 1; index * pass < width - 0.5; index += 1) seams.push(Math.round(index * pass))
  return seams
}

/** Px positions of the hits of every pass; `hits` are fractions of one pass, and `phase` how far into one the stroke begins. */
export function hitPositions(
  hits: readonly number[],
  repeats: number,
  width: number,
  reversed = false,
  phase = 0,
): number[] {
  const passes = Math.max(repeats, 1e-6)
  const pass = width / passes
  const into = passPhase(phase)
  const positions: number[] = []
  for (let index = 0; index < Math.ceil(passes + into - 1e-6); index += 1) {
    for (const hit of hits) {
      const at = index + (reversed ? 1 - hit : hit)
      const x = Math.round((into > 0 ? at - into : at) * pass)
      if (x >= 0 && x <= width) positions.push(x)
    }
  }
  return positions.sort((a, b) => a - b)
}

/** The most pips a stroke draws, however many different passes it has. */
export const STROKE_PIPS_MAX = 8

/** A pip's width and the gap to the next, in px: the first that fits is drawn. */
const PIP_SIZES: readonly (readonly [width: number, gap: number])[] = [
  [4, 2],
  [3, 2],
  [2, 1],
]
const PIP_HEIGHT = 3
/** The lowest stroke that draws pips, and the lowest that does beside its name's tag. */
const PIPS_MIN_HEIGHT = 14
const PIPS_MIN_HEIGHT_NAMED = 20

/** One pip of a stroke: a bar on its lower edge, in px, lit when it is the pass that sounds. */
export interface StrokePip {
  x: number
  y: number
  width: number
  height: number
  lit: boolean
}

/**
 * The pips of a stroke `width` × `height` px that has `turns` different
 * passes and is on pass `turn` of them (from 0): one bar a pass on the lower
 * edge, from the left end, the first 3 px past where the round end is 2 px
 * above the edge. Bars are 4 px wide, then 3, then 2 as the stroke gets
 * short, and a stroke shows them all or none: none when even the smallest do
 * not fit between its round ends, when it is under 14 px high, or under 20
 * where it shows its name (`named`), whose tag would lie over them. More than
 * `STROKE_PIPS_MAX` passes are that many pips, lit at the pass's share of them.
 */
export function strokePips(
  turns: number,
  turn: number,
  width: number,
  height: number,
  named = false,
): StrokePip[] {
  const passes = Number.isFinite(turns) ? Math.floor(turns) : 0
  if (passes < 1 || !(height >= (named ? PIPS_MIN_HEIGHT_NAMED : PIPS_MIN_HEIGHT))) return []
  const count = Math.min(STROKE_PIPS_MAX, passes)
  const on = Number.isFinite(turn) ? ((Math.floor(turn) % passes) + passes) % passes : 0
  const lit = passes > count ? Math.floor((on * count) / passes) : on
  // A half circle is as far in at a depth as it is down that far along.
  const left = Math.ceil(capInset(2, height, height)) + 3
  const room = width - 2 * left
  const size = PIP_SIZES.find(([wide, gap]) => count * wide + (count - 1) * gap <= room)
  if (!size) return []
  const [wide, gap] = size
  return Array.from({ length: count }, (_, index) => ({
    x: left + index * (wide + gap),
    y: height - PIP_HEIGHT,
    width: wide,
    height: PIP_HEIGHT,
    lit: index === lit,
  }))
}
