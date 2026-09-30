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

/** The waveform columns of a stroke, left to right. */
export function strokeLevels({
  width,
  height,
  peaks,
  repeats = 1,
  fadeIn = 0,
  fadeOut = 0,
  gain = 1,
  reversed = false,
  normalize = true,
}: StrokeLevelsOptions): StrokeLevel[] {
  const columns = Math.max(0, Math.floor(width / STROKE_COLUMN_PX))
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
  const levels: StrokeLevel[] = []
  for (let column = 0; column < columns; column += 1) {
    const x = column * STROKE_COLUMN_PX + STROKE_COLUMN_PX / 2
    const t = x / width
    let value = 0
    if (peaks && count > 0) {
      let position = (t * passes) % 1
      if (reversed) position = 1 - position
      const index = Math.min(count - 1, Math.max(0, Math.floor(position * count)))
      value = Math.max(Math.abs(peaks.min[index]), Math.abs(peaks.max[index])) / loudest
    }
    const limit = Math.max(0, room - capInset(x, width, height))
    const amp = clamp01(value * gain) * fadeGainAt(t, fadeIn, fadeOut) * room
    levels.push([x, Math.max(0.5, Math.min(limit, amp))])
  }
  return levels
}

const fixed = (value: number): string => value.toFixed(1)

/** One vertical bar per column: the fine detail drawn over the filled shape. */
export function levelsBarsPath(levels: readonly StrokeLevel[], mid: number): string {
  return levels.map(([x, amp]) => `M${x} ${fixed(mid - amp)}V${fixed(mid + amp)}`).join('')
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
  if (levels.length === 0) return ''
  const smooth = levels.map(([x], index) => {
    let total = 0
    let samples = 0
    for (let offset = -window; offset <= window; offset += 1) {
      const neighbour = levels[index + offset]
      if (neighbour) {
        total += neighbour[1]
        samples += 1
      }
    }
    return [x, Math.min(mid, (total / samples) * scale)] as const
  })
  const top = smooth.map(([x, amp]) => `L${x} ${fixed(mid - amp)}`).join('')
  const bottom = [...smooth]
    .reverse()
    .map(([x, amp]) => `L${x} ${fixed(mid + amp)}`)
    .join('')
  return `M0 ${mid}${top}L${width} ${mid}${bottom}Z`
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
  const at = (x: number): string => fixed(fromEnd ? width - x : x)
  const points: (readonly [number, number])[] = []
  for (let x = 0; x < length; x += 3) points.push([x, fadeEase(x / length) * reach])
  points.push([length, reach])
  const top = points.map(([x, amp]) => `L${at(x)} ${fixed(mid - amp)}`).join('')
  const bottom = points.map(([x, amp]) => `L${at(x)} ${fixed(mid + amp)}`).join('')
  return {
    curve: `M${at(0)} ${mid}${top}M${at(0)} ${mid}${bottom}`,
    shade: `M${at(0)} 0L${at(0)} ${mid}${top}L${at(length)} 0ZM${at(0)} ${height}L${at(0)} ${mid}${bottom}L${at(length)} ${height}Z`,
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

/** Where each repeat after the first starts, in px. */
export function repeatSeams(repeats: number, width: number): number[] {
  if (!(repeats > 1)) return []
  const pass = width / repeats
  const seams: number[] = []
  for (let index = 1; index * pass < width - 0.5; index += 1) seams.push(Math.round(index * pass))
  return seams
}

/** Px positions of the hits of every pass; `hits` are fractions of one pass. */
export function hitPositions(
  hits: readonly number[],
  repeats: number,
  width: number,
  reversed = false,
): number[] {
  const passes = Math.max(repeats, 1e-6)
  const pass = width / passes
  const positions: number[] = []
  for (let index = 0; index < Math.ceil(passes - 1e-6); index += 1) {
    for (const hit of hits) {
      const x = Math.round((index + (reversed ? 1 - hit : hit)) * pass)
      if (x >= 0 && x <= width) positions.push(x)
    }
  }
  return positions.sort((a, b) => a - b)
}
