// The stroke geometry is rewritten for speed and must not move a pixel. Below
// the imports stands the implementation as it was before that, copied
// verbatim, and every function is held against it: the same arrays, number
// for number, and the same strings, character for character, over a few
// hundred seeded-random strokes and the edges the code has.
import { describe, expect, it } from 'vitest'

import { type WaveformPeaks } from '../../core/clips/peaks'
import {
  capInset,
  fadeEase,
  fadeGainAt,
  fadePaths,
  levelsBarsPath,
  levelsOutlinePath,
  strokeLevels,
  strokeWavePaths,
  type FadePaths,
  type StrokeLevel,
  type StrokeLevelsOptions,
} from '../components/stroke-math'

// --- The reference: `stroke-math.ts` as it was -------------------------------

const reference = (() => {
  /** Horizontal pitch of the waveform columns, in px. */
  const STROKE_COLUMN_PX = 2
  /** Clear space between the waveform and the ring, in px. */
  const STROKE_INSET_PX = 3

  function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value))
  }

  /** The gain of a fade `progress` of the way through it: an equal-power rise. */
  function fadeEase(progress: number): number {
    return Math.sin((Math.PI / 2) * clamp01(progress)) ** 2
  }

  /** Gain from the fades at fraction `t` of the stroke. */
  function fadeGainAt(t: number, fadeIn = 0, fadeOut = 0): number {
    const rise = fadeIn > 0 ? fadeEase(t / fadeIn) : 1
    const fall = fadeOut > 0 ? fadeEase((1 - t) / fadeOut) : 1
    return Math.min(rise, fall)
  }

  /** How far the pill's rounded end is from its flat edge at `x`, in px (0 in the straight part). */
  function capInset(x: number, width: number, height: number): number {
    const radius = height / 2
    const fromEnd = Math.min(x, width - x)
    if (fromEnd >= radius) return 0
    return radius - Math.sqrt(Math.max(0, radius * radius - (radius - fromEnd) ** 2))
  }

  /** The waveform columns of a stroke, left to right. */
  function strokeLevels({
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
  function levelsBarsPath(levels: readonly StrokeLevel[], mid: number): string {
    return levels.map(([x, amp]) => `M${x} ${fixed(mid - amp)}V${fixed(mid + amp)}`).join('')
  }

  /**
   * The filled, mirrored outline of the levels. `window` columns either side are
   * averaged (0 keeps every transient sharp); `scale` swells it for the halo.
   */
  function levelsOutlinePath(
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

  /** Paths of a fade `fraction` of the width long, from the left or (`fromEnd`) the right. */
  function fadePaths(fraction: number, width: number, height: number, fromEnd = false): FadePaths {
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

  return {
    fixed,
    fadeEase,
    fadeGainAt,
    capInset,
    strokeLevels,
    levelsBarsPath,
    levelsOutlinePath,
    fadePaths,
  }
})()

// --- Inputs -------------------------------------------------------------------

/** A small seeded generator (mulberry32): the same strokes on every run. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function randomPeaks(random: () => number): WaveformPeaks | null | undefined {
  const kind = Math.floor(random() * 8)
  if (kind === 0) return random() < 0.5 ? null : undefined
  const buckets = [1, 2, 7, 64, 512, 2000, 4096][Math.floor(random() * 7)]
  const min = new Float32Array(buckets)
  const max = new Float32Array(buckets)
  // Silence, a quiet source, a hot one, and noise shaped by a slow swell.
  const level = kind === 1 ? 0 : kind === 2 ? 0.02 : kind === 3 ? 1.6 : 1
  for (let index = 0; index < buckets; index += 1) {
    const swell = 0.5 + 0.5 * Math.sin((index / buckets) * Math.PI * (1 + kind))
    max[index] = random() * level * swell
    min[index] = -random() * level * swell
  }
  // The two arrays need not be the same length; the shorter one counts.
  if (kind === 7 && buckets > 2) return { min: min.subarray(0, buckets - 2), max }
  return { min, max }
}

function randomOptions(random: () => number): StrokeLevelsOptions {
  const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]
  const size = random()
  const width =
    size < 0.2
      ? 1 + Math.floor(random() * 60)
      : size < 0.6
        ? 1 + Math.floor(random() * 1200)
        : size < 0.9
          ? 1 + Math.floor(random() * 6000)
          : 1 + random() * 5999
  const height = random() < 0.8 ? 8 + Math.floor(random() * 193) : 8 + random() * 192
  const options: StrokeLevelsOptions = { width, height, peaks: randomPeaks(random) }
  if (random() < 0.7) options.repeats = random() < 0.4 ? 1 : 1 + random() * 4.5
  if (random() < 0.5) options.fadeIn = pick([0, 0.01, 0.1, 0.25, 0.5, 1, random()])
  if (random() < 0.5) options.fadeOut = pick([0, 0.01, 0.1, 0.25, 0.5, 1, random()])
  if (random() < 0.6) options.gain = pick([0, 0.25, 0.5, 1, 1.5, 2, random() * 2])
  if (random() < 0.4) options.reversed = random() < 0.7
  if (random() < 0.2) options.normalize = random() < 0.5
  return options
}

/** The three paths of a stroke as `Stroke` put them together from the reference. */
function referenceWavePaths(options: StrokeLevelsOptions, window: number) {
  const mid = options.height / 2
  const levels = reference.strokeLevels(options)
  return {
    halo: reference.levelsOutlinePath(levels, mid, options.width, 1.4, window + 1),
    wave: reference.levelsOutlinePath(levels, mid, options.width, 1, window),
    bars: reference.levelsBarsPath(
      levels.filter((_, index) => index % 2 === 0),
      mid,
    ),
  }
}

/** The same numbers in the same places: no tolerance, and −0 is not 0. */
function sameLevels(actual: readonly StrokeLevel[], expected: readonly StrokeLevel[]): boolean {
  if (actual.length !== expected.length) return false
  for (let index = 0; index < expected.length; index += 1) {
    const [x, amp] = actual[index]
    if (actual[index].length !== 2) return false
    if (!Object.is(x, expected[index][0]) || !Object.is(amp, expected[index][1])) return false
  }
  return true
}

/** Where two strings part, for a failure that can be read. */
function firstDifference(actual: string, expected: string): string | null {
  if (actual === expected) return null
  let index = 0
  while (index < expected.length && actual[index] === expected[index]) index += 1
  return `at ${index}: …${actual.slice(Math.max(0, index - 20), index + 20)}… for …${expected.slice(Math.max(0, index - 20), index + 20)}…`
}

const describeOptions = (options: StrokeLevelsOptions): string =>
  JSON.stringify({ ...options, peaks: options.peaks ? options.peaks.max.length : options.peaks })

// --- The comparison -----------------------------------------------------------

describe('stroke math against the implementation it replaces', () => {
  const STROKES = 400

  it(`lays out the same columns for ${STROKES} random strokes`, () => {
    const random = seeded(0x51a7e)
    for (let index = 0; index < STROKES; index += 1) {
      const options = randomOptions(random)
      const expected = reference.strokeLevels(options)
      expect(sameLevels(strokeLevels(options), expected), describeOptions(options)).toBe(true)
    }
  })

  it(`draws the same outlines and bars for ${STROKES} random strokes`, () => {
    const random = seeded(0xb0a7)
    let columns = 0
    for (let index = 0; index < STROKES; index += 1) {
      const options = randomOptions(random)
      const levels = reference.strokeLevels(options)
      columns += levels.length
      const mid = random() < 0.9 ? options.height / 2 : random() * options.height
      const said = describeOptions(options)
      // The two smoothing windows a stroke uses, with and without hits, for the wave and the halo.
      for (const window of [0, 2]) {
        expect(
          firstDifference(
            levelsOutlinePath(levels, mid, options.width, 1, window),
            reference.levelsOutlinePath(levels, mid, options.width, 1, window),
          ),
          `wave, window ${window}: ${said}`,
        ).toBeNull()
        expect(
          firstDifference(
            levelsOutlinePath(levels, mid, options.width, 1.4, window + 1),
            reference.levelsOutlinePath(levels, mid, options.width, 1.4, window + 1),
          ),
          `halo, window ${window + 1}: ${said}`,
        ).toBeNull()
      }
      // The defaults, when the scale and the window are left out.
      expect(
        firstDifference(
          levelsOutlinePath(levels, mid, options.width),
          reference.levelsOutlinePath(levels, mid, options.width),
        ),
        `default outline: ${said}`,
      ).toBeNull()
      const everyOther = levels.filter((_, column) => column % 2 === 0)
      for (const drawn of [levels, everyOther]) {
        expect(
          firstDifference(levelsBarsPath(drawn, mid), reference.levelsBarsPath(drawn, mid)),
          `bars: ${said}`,
        ).toBeNull()
      }
    }
    // The strokes were not all short ones.
    expect(columns).toBeGreaterThan(STROKES * 400)
  })

  it(`draws the three paths of a stroke in one go, the same for ${STROKES} random strokes`, () => {
    const random = seeded(0x3a7e5)
    for (let index = 0; index < STROKES; index += 1) {
      const options = randomOptions(random)
      const said = describeOptions(options)
      // With hits the transients stay sharp; without, the wave is smoothed.
      for (const window of [0, 2]) {
        const actual = strokeWavePaths(options, window)
        const expected = referenceWavePaths(options, window)
        expect(Object.keys(actual).sort()).toEqual(['bars', 'halo', 'wave'])
        for (const name of ['halo', 'wave', 'bars'] as const) {
          expect(
            firstDifference(actual[name], expected[name]),
            `${name}, window ${window}: ${said}`,
          ).toBeNull()
        }
      }
    }
    const plain = { width: 300, height: 48 }
    expect(strokeWavePaths(plain)).toEqual(referenceWavePaths(plain, 2))
  })

  it('draws a stroke wider than any it keeps texts for, and a narrow one after it', () => {
    const peaks = noise
    const wide = { width: 40_000, height: 64, peaks, repeats: 3.5, fadeOut: 0.3 }
    expect(strokeWavePaths(wide, 2)).toEqual(referenceWavePaths(wide, 2))
    const narrow = { ...wide, width: 500 }
    expect(strokeWavePaths(narrow, 0)).toEqual(referenceWavePaths(narrow, 0))
    // A coordinate past the kept ones is printed the same: a tall stroke, a far fade.
    const tall = { width: 300, height: 2400, peaks }
    expect(strokeWavePaths(tall, 2)).toEqual(referenceWavePaths(tall, 2))
    expect(fadePaths(0.5, 40_000, 2400, true)).toEqual(reference.fadePaths(0.5, 40_000, 2400, true))
  })

  it(`draws the same fades for ${STROKES} random strokes`, () => {
    const random = seeded(0xfade)
    for (let index = 0; index < STROKES; index += 1) {
      const width = random() < 0.8 ? 1 + Math.floor(random() * 6000) : 1 + random() * 5999
      const height = random() < 0.8 ? 8 + Math.floor(random() * 193) : 8 + random() * 192
      const fraction = random() < 0.2 ? [0, 1, 1.5, -0.2, 0.5][index % 5] : random()
      for (const fromEnd of [false, true]) {
        const actual = fadePaths(fraction, width, height, fromEnd)
        const expected = reference.fadePaths(fraction, width, height, fromEnd)
        const said = JSON.stringify({ fraction, width, height, fromEnd })
        expect(firstDifference(actual.curve, expected.curve), `curve: ${said}`).toBeNull()
        expect(firstDifference(actual.shade, expected.shade), `shade: ${said}`).toBeNull()
        expect(Object.is(actual.handle[0], expected.handle[0]), `handle: ${said}`).toBe(true)
        expect(actual.handle).toHaveLength(2)
        expect(actual.handle[1]).toBe(3.5)
      }
      // Without the last argument a fade is from the left.
      expect(fadePaths(fraction, width, height)).toEqual(
        reference.fadePaths(fraction, width, height),
      )
    }
  })

  it('agrees on the gains and the round ends', () => {
    const random = seeded(0xca9)
    for (let index = 0; index < 2000; index += 1) {
      const t = random() * 1.2 - 0.1
      const fadeIn = random() < 0.3 ? 0 : random()
      const fadeOut = random() < 0.3 ? 0 : random()
      expect(Object.is(fadeEase(t), reference.fadeEase(t))).toBe(true)
      expect(
        Object.is(fadeGainAt(t, fadeIn, fadeOut), reference.fadeGainAt(t, fadeIn, fadeOut)),
      ).toBe(true)
      const width = 1 + random() * 6000
      const height = 8 + random() * 192
      const x = random() * width
      expect(Object.is(capInset(x, width, height), reference.capInset(x, width, height))).toBe(true)
    }
    expect(fadeGainAt(0.5)).toBe(reference.fadeGainAt(0.5))
  })

  const flat = (buckets: number, level: number): WaveformPeaks => ({
    min: new Float32Array(buckets).fill(-level),
    max: new Float32Array(buckets).fill(level),
  })
  const noise = ((): WaveformPeaks => {
    const random = seeded(7)
    const max = Float32Array.from({ length: 300 }, () => random())
    return { min: max.map((value) => -value * random()), max }
  })()

  // What the code does at its edges: nothing to draw, nothing to read, and
  // numbers that are not numbers. None of it is guarded, so all of it is kept.
  const EDGES: readonly (readonly [string, StrokeLevelsOptions])[] = [
    ['no width', { width: 0, height: 40, peaks: noise }],
    ['one pixel, under a column', { width: 1, height: 40, peaks: noise }],
    ['one column', { width: 2, height: 40, peaks: noise }],
    ['an odd width', { width: 3, height: 40, peaks: noise }],
    ['a negative width', { width: -40, height: 40, peaks: noise }],
    ['a width that is not a number', { width: Number.NaN, height: 40, peaks: noise }],
    ['no height', { width: 200, height: 0, peaks: noise }],
    ['a height under the inset', { width: 200, height: 4, peaks: noise }],
    ['a negative height', { width: 200, height: -20, peaks: noise }],
    ['a height that is not a number', { width: 200, height: Number.NaN, peaks: noise }],
    ['a stroke narrower than it is tall', { width: 30, height: 200, peaks: noise }],
    ['no peaks', { width: 200, height: 40 }],
    ['null peaks', { width: 200, height: 40, peaks: null }],
    ['empty peaks', { width: 200, height: 40, peaks: flat(0, 1) }],
    [
      'one empty side',
      { width: 200, height: 40, peaks: { min: new Float32Array(0), max: noise.max } },
    ],
    ['silent peaks', { width: 200, height: 40, peaks: flat(64, 0) }],
    [
      'silent peaks, not normalised',
      { width: 200, height: 40, peaks: flat(64, 0), normalize: false },
    ],
    ['one bucket', { width: 200, height: 40, peaks: flat(1, 0.3) }],
    [
      'peaks over full scale, as they are',
      { width: 200, height: 40, peaks: flat(8, 3), normalize: false },
    ],
    [
      'peaks that are not numbers',
      {
        width: 200,
        height: 40,
        peaks: { min: flat(8, 1).min, max: new Float32Array(8).fill(Number.NaN) },
      },
    ],
    [
      'endless peaks',
      {
        width: 200,
        height: 40,
        peaks: { min: flat(8, 1).min, max: new Float32Array(8).fill(Infinity) },
      },
    ],
    ['no repeats', { width: 200, height: 40, peaks: noise, repeats: 0 }],
    ['negative repeats', { width: 200, height: 40, peaks: noise, repeats: -2 }],
    ['half a pass', { width: 200, height: 40, peaks: noise, repeats: 0.5 }],
    ['whole passes', { width: 600, height: 40, peaks: noise, repeats: 3 }],
    ['five and a half passes', { width: 600, height: 40, peaks: noise, repeats: 5.5 }],
    [
      'a column right on the seam of two passes',
      { width: 30, height: 12, peaks: noise, repeats: 2 },
    ],
    ['columns right on the seams of four', { width: 12, height: 12, peaks: noise, repeats: 4 }],
    ['a pass that ends on the last column', { width: 3, height: 12, peaks: noise, repeats: 3 }],
    [
      'repeats that are not a number',
      { width: 200, height: 40, peaks: noise, repeats: Number.NaN },
    ],
    ['endless repeats', { width: 200, height: 40, peaks: noise, repeats: Infinity }],
    ['reversed', { width: 200, height: 40, peaks: noise, reversed: true }],
    ['reversed passes', { width: 600, height: 40, peaks: noise, repeats: 2.5, reversed: true }],
    ['no gain', { width: 200, height: 40, peaks: noise, gain: 0 }],
    ['negative gain', { width: 200, height: 40, peaks: noise, gain: -1 }],
    ['a gain that is not a number', { width: 200, height: 40, peaks: noise, gain: Number.NaN }],
    ['an endless gain', { width: 200, height: 40, peaks: noise, gain: Infinity }],
    ['an endless gain on silence', { width: 200, height: 40, peaks: flat(8, 0), gain: Infinity }],
    [
      'fades over the whole stroke',
      { width: 400, height: 40, peaks: noise, fadeIn: 1, fadeOut: 1 },
    ],
    [
      'fades longer than the stroke',
      { width: 400, height: 40, peaks: noise, fadeIn: 2, fadeOut: 3 },
    ],
    ['fades that cross', { width: 400, height: 40, peaks: noise, fadeIn: 0.8, fadeOut: 0.7 }],
    ['negative fades', { width: 400, height: 40, peaks: noise, fadeIn: -0.5, fadeOut: -1 }],
    ['a tiny fade', { width: 400, height: 40, peaks: noise, fadeIn: 1e-9, fadeOut: 1e-12 }],
    [
      'fades that are not numbers',
      { width: 400, height: 40, peaks: noise, fadeIn: Number.NaN, fadeOut: Number.NaN },
    ],
    [
      'endless fades',
      { width: 400, height: 40, peaks: noise, fadeIn: Infinity, fadeOut: Infinity },
    ],
    ['a fade without peaks', { width: 400, height: 40, fadeIn: 0.5, fadeOut: 0.25 }],
  ]

  it.each(EDGES)('keeps the edge: %s', (_name, options) => {
    const expected = reference.strokeLevels(options)
    const levels = strokeLevels(options)
    expect(sameLevels(levels, expected)).toBe(true)
    for (const mid of [options.height / 2, 10, 0, Number.NaN]) {
      for (const [scale, window] of [
        [1, 0],
        [1.4, 1],
        [1, 2],
        [1.4, 3],
        [0, 2],
        [Number.NaN, 2],
        [1, 1.5],
        [1, -1],
        [1, 50],
      ]) {
        expect(levelsOutlinePath(levels, mid, options.width, scale, window)).toBe(
          reference.levelsOutlinePath(expected, mid, options.width, scale, window),
        )
      }
      expect(levelsBarsPath(levels, mid)).toBe(reference.levelsBarsPath(expected, mid))
    }
    for (const window of [0, 2, 1.5, -1, Number.NaN]) {
      expect(strokeWavePaths(options, window)).toEqual(referenceWavePaths(options, window))
    }
  })

  it('keeps the edges of a path: no levels, levels that are no columns, sparse ones', () => {
    expect(levelsOutlinePath([], 10, 40)).toBe(reference.levelsOutlinePath([], 10, 40))
    expect(levelsBarsPath([], 10)).toBe(reference.levelsBarsPath([], 10))
    // Levels a host made itself: any x, any amplitude, in any order.
    const own: StrokeLevel[] = [
      [0, 0],
      [0.5, 3.25],
      [-4, 2.05],
      [7.125, 100],
      [1e21, 0.05],
      [12, -3],
      [13, Number.NaN],
      [Number.NaN, 4],
      [15, Infinity],
      [-0, 0.25],
      [17, 1e-7],
      [18, 0.35],
      [19, 1.005],
    ]
    for (const mid of [10, 0, -5, 0.05, 2.5, 1e9, 1e21, Number.NaN, Infinity]) {
      for (const window of [0, 1, 2, 3]) {
        for (const scale of [1, 1.4, -1]) {
          expect(levelsOutlinePath(own, mid, 40, scale, window)).toBe(
            reference.levelsOutlinePath(own, mid, 40, scale, window),
          )
        }
      }
      expect(levelsBarsPath(own, mid)).toBe(reference.levelsBarsPath(own, mid))
    }
    // A hole in the array is no bar, and an outline cannot be drawn through one.
    const sparse: StrokeLevel[] = []
    sparse[0] = [1, 2]
    sparse[2] = [5, 4]
    sparse.length = 4
    expect(levelsBarsPath(sparse, 10)).toBe(reference.levelsBarsPath(sparse, 10))
    expect(() => reference.levelsOutlinePath(sparse, 10, 8)).toThrow(TypeError)
    expect(() => levelsOutlinePath(sparse, 10, 8)).toThrow(TypeError)
  })

  it('keeps the edges of a fade', () => {
    const cases: readonly (readonly [number, number, number])[] = [
      [0, 200, 40],
      [1, 200, 40],
      [2, 200, 40],
      [-1, 200, 40],
      [0.5, 0, 40],
      [0.5, -200, 40],
      [0.5, 200, 0],
      [0.5, 200, -40],
      [1e-9, 200, 40],
      [0.5, 3, 40],
      [0.5, 6, 40],
      [1 / 3, 9, 40],
      [0.25, 200.5, 37.5],
      [Number.NaN, 200, 40],
      [0.5, Number.NaN, 40],
      [0.5, 200, Number.NaN],
      [0.5, 200, Infinity],
      [0.5, 1e5, 40],
    ]
    for (const [fraction, width, height] of cases) {
      for (const fromEnd of [false, true]) {
        expect(fadePaths(fraction, width, height, fromEnd)).toEqual(
          reference.fadePaths(fraction, width, height, fromEnd),
        )
      }
    }
  })

  it('prints a number to one decimal as `toFixed` does, wherever a path does it', () => {
    // A level whose bar ends at `value` and one that starts there: each prints
    // it once. Ties, near ties, the places where a product rounds the wrong
    // way, negatives, and sizes past every fast path.
    const values = [
      0,
      -0,
      0.05,
      0.15,
      0.25,
      0.35,
      0.45,
      0.55,
      0.65,
      0.75,
      0.85,
      0.95,
      1.005,
      1.05,
      1.15,
      2.5,
      8.345,
      8.35,
      8.45,
      9.95,
      9.949999999999999,
      9.950000000000001,
      10.05,
      99.95,
      99.99,
      100.05,
      409.55,
      409.6,
      409.65,
      999.95,
      1000.05,
      4095.95,
      4096.05,
      65535.95,
      123456.75,
      1e9 - 0.05,
      1e9,
      1e9 + 0.25,
      1e15 + 0.5,
      1e21,
      1.5e21,
      1e-7,
      4.9e-324,
      0.04999999999999999,
      0.05000000000000001,
      0.049999999999999996,
      -0.04,
      -0.05,
      -0.06,
      -1.25,
      -2.5,
      -1e21,
      Number.NaN,
      Infinity,
      -Infinity,
      Number.MAX_VALUE,
      2 ** 31,
      2 ** 31 + 0.25,
      2 ** 32 - 0.05,
    ]
    const random = seeded(0xf17ed)
    for (let index = 0; index < 4000; index += 1) {
      const whole = Math.floor(random() * [10, 200, 5000, 1e6][index % 4])
      // Half of them on a tie or a hair to either side of one.
      const tie = whole + 0.05 + Math.floor(random() * 10) / 10
      values.push(index % 2 ? tie * (1 + (random() - 0.5) * 1e-15) : random() * whole)
    }
    for (const value of values) {
      const text = reference.fixed(value)
      expect(levelsBarsPath([[3, 0]], value), String(value)).toBe(`M3 ${text}V${text}`)
      expect(levelsOutlinePath([[3, 0]], value, 6, 1, 0), String(value)).toBe(
        reference.levelsOutlinePath([[3, 0]], value, 6, 1, 0),
      )
      // A fade of no length from the far end starts at the width, printed the same way.
      expect(fadePaths(0, value, 20, true), String(value)).toEqual(
        reference.fadePaths(0, value, 20, true),
      )
    }
  })
})
