// The truth of the Scale Filter's display: its clock against the device's own
// mask, worked out here a second time from the header, its handles against the
// parameters they set, and its bars against the readings the device sends.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SCALE_FILTER_FACES,
  SCALE_FILTER_RANGE_DB,
  SCALE_FILTER_SCALES,
  scaleFilterBar,
  scaleFilterLayout,
  scaleFilterNotes,
  scaleFilterRange,
  scaleFilterReading,
  scaleFilterY,
} from '../components/displays/scale-filter'
import { type DisplayHandle } from '../components/plate-display'
import {
  drawDisplay,
  metersOf,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('scale-filter')
const params = descriptor?.params ?? {}
const { display } = SCALE_FILTER_FACES['scale-filter']

// --- The device's own figures, from cpp/devices/scale-filter/scale_filter.h ---

/** `kScales`: bit s is semitone s over Root, in the order of the Scale choices. */
const K_SCALES = [
  0b101010110101, 0b010110101101, 0b100110101101, 0b011010101101, 0b010110101011, 0b101011010101,
  0b011010110101, 0b001010010101, 0b010010101001, 0b010101010101, 0b111111111111,
]
/** `kBellSpan`: the bell is nothing past this many widths. */
const K_BELL_SPAN = 3
/** The bell's table is exp(-1.3862944 x²): 2 ln 2, so it is 3.01 dB down at half a width. */
const K_BELL = 1.3862944

/** `chord_notes`. */
function deviceNotes(scale: number, chord: number): number {
  const all = K_SCALES[scale]
  const has = (s: number): boolean => (all & (1 << s)) !== 0
  if (chord === 0) return all
  const third = has(4) ? 4 : 3
  const fifth = has(7) ? 7 : has(8) ? 8 : 6
  if (chord === 1) return 1 | (1 << third) | (1 << fifth)
  if (chord === 2) return 1 | (1 << fifth)
  return 1
}

interface Settings {
  root: number
  scale: number
  chord: number
  width: number
  depth: number
  tune: number
  mix: number
}

const DEFAULTS: Settings = { root: 0, scale: 0, chord: 0, width: 30, depth: 30, tune: 0, mix: 1 }

/** `mask_at` for a pitch inside Low and High, at a pitch class counted from C. */
function deviceMask(pitchClass: number, now: Settings): number {
  const notes = deviceNotes(now.scale, now.chord)
  const position = (((pitchClass - now.tune * 0.01) % 12) + 12) % 12
  let distance = 12
  for (let s = 0; s < 12; s++) {
    if (!(notes & (1 << s))) continue
    const apart = Math.abs(position - ((now.root + s) % 12))
    distance = Math.min(distance, apart, 12 - apart)
  }
  const off = distance * (100 / now.width)
  const bell = off < K_BELL_SPAN ? Math.exp(-K_BELL * off * off) : 0
  const floor = Math.pow(10, -now.depth / 20)
  return floor + (1 - floor) * bell
}

/** What `process` lets out of a pitch: the dry sound and the masked one, a straight crossfade by Mix. */
function deviceHeard(pitchClass: number, now: Settings): number {
  return 1 - now.mix + now.mix * deviceMask(pitchClass, now)
}

// --- Reading what was drawn --------------------------------------------------

interface Stroke {
  points: [number, number][]
  width: number
  colour: string
  alpha: number
  dashed: boolean
}

/** Every line stroked, with what it was stroked in. */
function strokes(drawn: RecordingContext): Stroke[] {
  const found: Stroke[] = []
  let points: [number, number][] = []
  let width = 1
  let colour = ''
  let alpha = 1
  let dashed = false
  for (const call of drawn.calls) {
    const args = call.args as number[]
    if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo') points.push([args[0], args[1]])
    else if (call.name === 'set lineWidth') width = args[0]
    else if (call.name === 'set strokeStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = args[0]
    else if (call.name === 'setLineDash') dashed = (call.args[0] as number[]).length > 0
    else if (call.name === 'stroke') found.push({ points, width, colour, alpha, dashed })
  }
  return found
}

const SIZES: readonly [number, number][] = [
  [128, 100],
  [204, 100],
]

/** Where a gain at a pitch class should stand on the clock of a display so large. */
function expected(
  pitchClass: number,
  gain: number,
  size: readonly [number, number],
): [number, number] {
  const { cx, cy, foot, rim } = scaleFilterLayout({ width: size[0], height: size[1] })
  const db = 20 * Math.log10(Math.max(gain, 1e-9))
  const radius = foot + (rim - foot) * Math.min(1, Math.max(0, 1 + db / 48))
  const angle = ((-90 + 30 * pitchClass) * Math.PI) / 180
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
}

function curves(now: Settings, size: readonly [number, number]): { heard: Stroke; mask?: Stroke } {
  const drawn = drawDisplay(display, params, {
    values: { ...now },
    width: size[0],
    height: size[1],
  })
  const round = strokes(drawn).filter((stroke) => stroke.points.length === 481)
  const heard = round.find((stroke) => stroke.width === 1.5)
  if (!heard) throw new Error('no curve was drawn')
  return { heard, mask: round.find((stroke) => stroke.dashed) }
}

/** The worst distance in pixels between a curve drawn round the clock and a gain worked out here. */
function worst(
  stroke: Stroke,
  now: Settings,
  size: readonly [number, number],
  gain: (pitchClass: number, now: Settings) => number,
): number {
  let most = 0
  stroke.points.forEach(([x, y], i) => {
    const pitchClass = now.root + now.tune / 100 + (i * 12) / 480
    const [ex, ey] = expected(pitchClass, gain(pitchClass, now), size)
    most = Math.max(most, Math.hypot(x - ex, y - ey))
  })
  return most
}

const SETTINGS: readonly Settings[] = [
  DEFAULTS,
  { root: 9, scale: 1, chord: 1, width: 24, depth: 36, tune: 0, mix: 1 },
  { root: 5, scale: 7, chord: 0, width: 120, depth: 18, tune: -35, mix: 1 },
  { root: 11, scale: 10, chord: 0, width: 200, depth: 48, tune: 50, mix: 1 },
  { root: 2, scale: 9, chord: 2, width: 5, depth: 12, tune: 20, mix: 0.5 },
  { root: 7, scale: 2, chord: 3, width: 60, depth: 40, tune: 0, mix: 0.25 },
]

describe('the scale filter display: the mask', () => {
  it('has the scales and chords of the device', () => {
    expect([...SCALE_FILTER_SCALES]).toEqual(K_SCALES)
    for (let scale = 0; scale < K_SCALES.length; scale++)
      for (let chord = 0; chord < 4; chord++)
        expect(scaleFilterNotes(scale, chord), `scale ${scale} chord ${chord}`).toBe(
          deviceNotes(scale, chord),
        )
    // A major triad, a minor one, the whole-tone scale's augmented one, and the root alone.
    expect(scaleFilterNotes(0, 1)).toBe(0b10010001)
    expect(scaleFilterNotes(1, 1)).toBe(0b10001001)
    expect(scaleFilterNotes(9, 1)).toBe(0b100010001)
    expect(scaleFilterNotes(4, 2)).toBe(0b10000001)
    expect(scaleFilterNotes(10, 3)).toBe(1)
    expect(SCALE_FILTER_RANGE_DB).toBe(params.depth.max)
  })

  it('draws what is heard of every pitch, by the formula of the device', () => {
    for (const size of SIZES)
      for (const now of SETTINGS) {
        const { heard, mask } = curves(now, size)
        expect(worst(heard, now, size, deviceHeard), JSON.stringify(now)).toBeLessThan(1e-6)
        expect(heard.colour).toBe(PLAIN_COLOURS.ink)
        // The device's own mask stands beside it only where Mix lets less than all of it out.
        expect(mask !== undefined, `the mask alone at mix ${now.mix}`).toBe(now.mix < 1)
        if (mask) expect(worst(mask, now, size, deviceMask)).toBeLessThan(1e-6)
      }
  })

  it('stands at the rim on a note let through, 3 dB in at half a Width, and Depth down between', () => {
    const size = SIZES[0]
    const { foot, rim, cx, cy } = scaleFilterLayout({ width: size[0], height: size[1] })
    const now: Settings = { ...DEFAULTS, root: 9, chord: 3, width: 40, depth: 36 }
    const { heard } = curves(now, size)
    const radius = (i: number): number =>
      Math.hypot(heard.points[i][0] - cx, heard.points[i][1] - cy)
    // Forty points to a semitone: the root, 20 cents from it, and the far side of the octave.
    expect(radius(0)).toBeCloseTo(rim, 6)
    const floor = Math.pow(10, -36 / 20)
    const half = floor + (1 - floor) * Math.exp(-K_BELL * 0.25)
    expect(20 * Math.log10(half)).toBeCloseTo(-2.95, 2)
    expect(radius(8)).toBeCloseTo(rim + ((rim - foot) * 20 * Math.log10(half)) / 48, 6)
    expect(radius(240)).toBeCloseTo(foot + (rim - foot) * (1 - 36 / 48), 6)
    // The top of the root's opening points at A, nine semitones round from the top: at nine o'clock.
    expect(heard.points[0][0]).toBeCloseTo(cx - rim, 6)
    expect(heard.points[0][1]).toBeCloseTo(cy, 6)
  })

  it('still reads the device when Mix is 0, and draws nothing of it as heard', () => {
    const now: Settings = { ...DEFAULTS, mix: 0 }
    const { heard, mask } = curves(now, SIZES[0])
    const { cx, cy, rim } = scaleFilterLayout({ width: 128, height: 100 })
    for (const [x, y] of heard.points) expect(Math.hypot(x - cx, y - cy)).toBeCloseTo(rim, 6)
    expect(mask).toBeDefined()
    if (mask) expect(worst(mask, now, SIZES[0], deviceMask)).toBeLessThan(1e-6)
  })

  it('marks the root and how far its opening reaches before it is 48 dB down', () => {
    // exp(-1.3862944 x²) at two widths is 1/256.
    expect(20 * Math.log10(Math.exp(-K_BELL * 4))).toBeCloseTo(-48.16, 1)
    for (const size of SIZES) {
      const { cx, cy, rim } = scaleFilterLayout({ width: size[0], height: size[1] })
      const now: Settings = { ...DEFAULTS, root: 4, width: 45, tune: 25 }
      const drawn = drawDisplay(display, params, {
        values: { ...now },
        width: size[0],
        height: size[1],
      })
      const all = strokes(drawn)
      const degrees = ([x, y]: [number, number]): number =>
        (Math.atan2(y - cy, x - cx) * 180) / Math.PI
      const at = -90 + 30 * (now.root + now.tune / 100)
      const mark = all.find(
        (stroke) => stroke.colour === PLAIN_COLOURS.accent && stroke.width === 2,
      )
      expect(mark, 'the root is marked in the accent').toBeDefined()
      if (mark) expect(degrees(mark.points[0])).toBeCloseTo(at, 6)
      const reach = all.find((stroke) => stroke.points.length === 49)
      expect(reach, 'the reach of the root is drawn').toBeDefined()
      if (!reach) continue
      for (const [x, y] of reach.points)
        expect(Math.hypot(x - cx, y - cy)).toBeCloseTo(rim + 2.5, 6)
      // Two Widths either side: 90 cents is 27 degrees.
      expect(degrees(reach.points[0])).toBeCloseTo(at - 27, 6)
      expect(degrees(reach.points[48])).toBeCloseTo(at + 27, 6)
    }
  })
})

// --- Handles -----------------------------------------------------------------

function handleOf(
  key: string,
  values: Readonly<Record<string, number>>,
  size: readonly [number, number],
): DisplayHandle {
  const view = viewOf(display, params, { values, width: size[0], height: size[1] })
  const found = display.handles?.(view).find((handle) => handle.key === key)
  if (!found) throw new Error(`no handle ${key}`)
  return found
}

describe('the scale filter display: the handles', () => {
  // Each handle, the values it is tried at, and settings around it that move where it stands.
  const cases: [string, number[], Record<string, number>[]][] = [
    ['width', [5, 12, 30, 80, 200], [{}, { root: 7, tune: -40 }, { scale: 10, depth: 0 }]],
    ['depth', [0, 6, 18, 30, 48], [{}, { root: 3, scale: 8, tune: 30 }, { scale: 10, width: 100 }]],
    ['low', [20, 40, 180, 900, 2000], [{}, { high: 300 }]],
    ['high', [200, 440, 3000, 12000, 20000], [{}, { low: 2000 }]],
  ]

  it.each(cases)(
    '%s: dragged to where a value stands, it sets that value',
    (key, tried, around) => {
      for (const size of SIZES)
        for (const others of around)
          for (const value of tried) {
            const there = handleOf(key, { ...others, [key]: value }, size)
            expect(there.x).toBeGreaterThanOrEqual(0)
            expect(there.x).toBeLessThanOrEqual(size[0])
            expect(there.y).toBeGreaterThanOrEqual(0)
            expect(there.y).toBeLessThanOrEqual(size[1])
            // Taken from any other setting and carried there.
            for (const from of tried) {
              const set = handleOf(key, { ...others, [key]: from }, size).drag(there.x, there.y)
              expect(Object.keys(set)).toEqual([key])
              expect(set[key], `${key} from ${from} to ${value}`).toBeCloseTo(value, 6)
            }
          }
    },
  )

  it.each(cases)('%s: has room to be set by hand', (key) => {
    const spec = params[key]
    for (const size of SIZES) {
      const low = handleOf(key, { [key]: spec.min }, size)
      const high = handleOf(key, { [key]: spec.max }, size)
      expect(Math.hypot(high.x - low.x, high.y - low.y), `${key} at ${size[0]}`).toBeGreaterThan(26)
      expect(low.reset?.()).toEqual({ [key]: spec.default })
    }
  })

  it('width: stands two Widths round from the root, where its opening alone is 48 dB down', () => {
    for (const size of SIZES) {
      const { cx, cy, rim } = scaleFilterLayout({ width: size[0], height: size[1] })
      const handle = handleOf('width', { root: 9, tune: 15, width: 60 }, size)
      expect(Math.hypot(handle.x - cx, handle.y - cy)).toBeCloseTo(rim + 2.5, 6)
      const degrees = (Math.atan2(handle.y - cy, handle.x - cx) * 180) / Math.PI
      // The root at 9.15 semitones, and 120 cents on: 310.5 degrees round from the top.
      expect(degrees).toBeCloseTo(-90 + 30 * (9.15 + 1.2) - 360, 6)
      // The other way round from the root it sets the same, and the wheel moves it a tenth.
      const mirrored = (2 * (-90 + 30 * 9.15) - degrees) * (Math.PI / 180)
      const other = handle.drag(cx + 20 * Math.cos(mirrored), cy + 20 * Math.sin(mirrored))
      expect(other.width).toBeCloseTo(60, 6)
      expect(handle.wheel?.(1).width).toBeCloseTo(66, 6)
      expect(handle.wheel?.(-40).width).toBe(params.width.min)
    }
  })

  it('depth: stands on the mask of the device in the widest gap, whatever Mix is', () => {
    for (const size of SIZES) {
      // A minor pentatonic on D: D F G A C, its last widest gap from A to C, the middle a
      // semitone and a half over A, and Tune ten cents on.
      const now: Settings = { ...DEFAULTS, root: 2, scale: 8, width: 70, depth: 22, tune: 10 }
      const middle = 10.5 + 0.1
      const [ex, ey] = expected(middle, deviceMask(middle, now), size)
      for (const mix of [1, 0.4, 0]) {
        const handle = handleOf('depth', { ...now, mix }, size)
        expect(handle.x).toBeCloseTo(ex, 6)
        expect(handle.y).toBeCloseTo(ey, 6)
      }
      // Where the openings run into each other the mask cannot go as low: the drag is solved with that.
      const wide: Settings = { ...DEFAULTS, scale: 10, width: 150, depth: 40 }
      const handle = handleOf('depth', { ...wide }, size)
      const [wx, wy] = expected(11.5, deviceMask(11.5, wide), size)
      expect(handle.x).toBeCloseTo(wx, 6)
      expect(handle.y).toBeCloseTo(wy, 6)
      expect(handle.drag(handle.x, handle.y).depth).toBeCloseTo(40, 6)
      const { cx, cy } = scaleFilterLayout({ width: size[0], height: size[1] })
      expect(handle.drag(cx, cy).depth).toBe(params.depth.max)
    }
  })

  it('low and high: stand on their lines up the side, an octave every tenth of it', () => {
    for (const size of SIZES) {
      const { strip } = scaleFilterLayout({ width: size[0], height: size[1] })
      expect(strip.x + strip.w).toBeLessThanOrEqual(size[0] - 3)
      const y = (hz: number): number => strip.y + strip.h * (1 - Math.log(hz / 20) / Math.log(1000))
      for (const hz of [20, 55, 440, 2000]) {
        expect(handleOf('low', { low: hz }, size).y).toBeCloseTo(y(hz), 6)
        expect(scaleFilterY(hz, strip)).toBeCloseTo(y(hz), 9)
      }
      expect(handleOf('high', { high: 12000 }, size).y).toBeCloseTo(y(12000), 6)
      const values = { low: 110, high: 3520 }
      const drawn = drawDisplay(display, params, { values, width: size[0], height: size[1] })
      const level = strokes(drawn).filter(
        ({ points }) =>
          points.length === 2 &&
          points[0][1] === points[1][1] &&
          Math.abs(points[1][0] - points[0][0] - strip.w) < 1e-6,
      )
      // Lines one pixel wide lie on the middle of their row of pixels.
      expect(level.map(({ points }) => points[0][1])).toEqual([
        Math.floor(y(110)) + 0.5,
        Math.floor(y(3520)) + 0.5,
      ])
    }
  })
})

// --- What moves --------------------------------------------------------------

/** A reading as the device packs it: `steps(in) + 64 * steps(out)` in `frame`. */
const packed = (into: number, out: number): number => into + 64 * out

describe('the scale filter display: the notes and the range', () => {
  it('reads a note going in and coming out as the device packs them', () => {
    expect(scaleFilterReading(packed(60, 40))).toEqual({ in: 60, out: 40 })
    expect(scaleFilterReading(packed(0, 63))).toEqual({ in: 0, out: 63 })
    expect(scaleFilterReading(packed(63, 63))).toEqual({ in: 63, out: 63 })
    expect(scaleFilterReading(0)).toEqual({ in: 0, out: 0 })
    expect(scaleFilterReading(Number.NaN)).toEqual({ in: 0, out: 0 })
  })

  it('draws each note as two bars on the scale of the clock, a dB a step', () => {
    for (const size of SIZES) {
      const layout = scaleFilterLayout({ width: size[0], height: size[1] })
      const { cx, cy, foot, rim } = layout
      // A comes in loudest and goes out whole; C# comes in 12 dB under it and goes out 30 dB down;
      // F is only a tail: nothing comes in, and it rings 6 dB under the loudest.
      const meters = {
        ...metersOf(descriptor?.meters),
        note10: packed(58, 58),
        note2: packed(46, 16),
        note6: packed(0, 52),
      }
      const drawn = drawDisplay(display, params, { meters, width: size[0], height: size[1] })
      const bars = strokes(drawn).filter((stroke) => stroke.width === 3)
      const bar = (note: number, colour: string): number | undefined => {
        const angle = ((-90 + 30 * note) * Math.PI) / 180
        const found = bars.find(
          ({ points, colour: drawnIn }) =>
            drawnIn === colour &&
            Math.abs(points[0][0] - (cx + foot * Math.cos(angle))) < 1e-6 &&
            Math.abs(points[0][1] - (cy + foot * Math.sin(angle))) < 1e-6,
        )
        if (!found) return undefined
        const [x, y] = found.points[1]
        // Along the note's own line from the centre.
        expect(Math.atan2(y - cy, x - cx)).toBeCloseTo(
          Math.atan2(Math.sin(angle), Math.cos(angle)),
          6,
        )
        return Math.hypot(x - cx, y - cy)
      }
      const down = (db: number): number => rim - ((rim - foot) * db) / 48
      expect(bars.length).toBe(5)
      expect(bar(9, PLAIN_COLOURS.ink)).toBeCloseTo(rim, 6)
      expect(bar(9, PLAIN_COLOURS.accent)).toBeCloseTo(rim, 6)
      expect(bar(1, PLAIN_COLOURS.ink)).toBeCloseTo(down(12), 6)
      expect(bar(1, PLAIN_COLOURS.accent)).toBeCloseTo(down(42), 6)
      expect(bar(5, PLAIN_COLOURS.ink)).toBeUndefined()
      expect(bar(5, PLAIN_COLOURS.accent)).toBeCloseTo(down(6), 6)
      expect(scaleFilterBar(46, 58, layout)).toBeCloseTo(down(12), 9)
      // Switched off it shows the mask and no notes.
      const off = drawDisplay(display, params, { meters, powered: false })
      expect(strokes(off).filter((stroke) => stroke.width === 3)).toEqual([])
    }
  })

  it('reads the bars against the loudest note of late: up at once, down slowly, held in silence', () => {
    const { foot, rim, cx, cy } = scaleFilterLayout({ width: 128, height: 100 })
    const state = display.init?.()
    const quiet = metersOf(descriptor?.meters)
    const longest = (meters: Record<string, number>, seconds: number): number => {
      const drawn = runDisplay(display, params, seconds, { meters, state })
      const reach = strokes(drawn)
        .filter((stroke) => stroke.width === 3)
        .map(({ points }) => Math.hypot(points[1][0] - cx, points[1][1] - cy))
      return reach.length ? Math.max(...reach) : 0
    }
    expect(longest({ ...quiet, note1: packed(40, 40) }, 0.1)).toBeCloseTo(rim, 6)
    // A note 15 dB louder is at the rim on its first frame.
    expect(longest({ ...quiet, note1: packed(55, 55) }, 1 / 30)).toBeCloseTo(rim, 6)
    // Ten seconds of nothing, and a note 24 dB under still stands 24 dB in: the scale was held.
    expect(longest(quiet, 10)).toBe(0)
    const after = longest({ ...quiet, note1: packed(31, 31) }, 1 / 30)
    expect(after).toBeCloseTo(rim - (rim - foot) * 0.5, 6)
    // Left there, the scale comes down to it.
    expect(longest({ ...quiet, note1: packed(31, 31) }, 30)).toBeGreaterThan(rim - 0.1)
  })

  it('shades what lies outside Low and High from where the range of the device is half open', () => {
    // `mask_at`: smooth_step(pitch - low + 1) * smooth_step(high + 1 - pitch), x²(3 - 2x).
    const range = { root: 0, notes: 1, width: 30, depth: 30, tune: 0, mix: 1, low: 110, high: 3520 }
    const semitones = (n: number): number => Math.pow(2, n / 12)
    expect(scaleFilterRange(110, range)).toBe(1)
    expect(scaleFilterRange(3520, range)).toBeCloseTo(1, 9)
    expect(scaleFilterRange(110 * semitones(-0.5), range)).toBeCloseTo(0.5, 9)
    expect(scaleFilterRange(3520 * semitones(0.5), range)).toBeCloseTo(0.5, 9)
    expect(scaleFilterRange(110 * semitones(-0.25), range)).toBeCloseTo(0.75 * 0.75 * 1.5, 9)
    expect(scaleFilterRange(110 * semitones(-1), range)).toBeCloseTo(0, 9)
    expect(scaleFilterRange(3520 * semitones(1), range)).toBeCloseTo(0, 9)
    for (const size of SIZES) {
      const { strip } = scaleFilterLayout({ width: size[0], height: size[1] })
      const shades = (
        values: Record<string, number>,
      ): { y: number; h: number; alpha: number }[] => {
        const drawn = drawDisplay(display, params, { values, width: size[0], height: size[1] })
        const found: { y: number; h: number; alpha: number }[] = []
        let alpha = 1
        for (const call of drawn.calls) {
          const args = call.args as number[]
          if (call.name === 'set globalAlpha') alpha = args[0]
          if (call.name === 'fillRect' && args[0] === strip.x && args[2] === strip.w)
            found.push({ y: args[1], h: args[3], alpha })
        }
        return found
      }
      const [under, over] = shades({ low: 110, high: 3520 })
      expect(under.y).toBeCloseTo(scaleFilterY(110 * semitones(-0.5), strip), 9)
      expect(under.y + under.h).toBeCloseTo(strip.y + strip.h, 9)
      expect(over.y).toBeCloseTo(strip.y, 9)
      expect(over.y + over.h).toBeCloseTo(scaleFilterY(3520 * semitones(0.5), strip), 9)
      // As strong as what is lost there: nothing at Depth 0 or with Mix at 0.
      expect(shades({ low: 110, high: 3520, depth: 0 })).toEqual([])
      expect(shades({ low: 110, high: 3520, mix: 0 })).toEqual([])
      expect(shades({ low: 110, high: 3520, mix: 0.5 })[0].alpha).toBeCloseTo(under.alpha / 2, 9)
      // Low over High: nothing is open, and the whole of it is shaded once.
      expect(shades({ low: 2000, high: 200 })).toEqual([
        { y: strip.y, h: strip.h, alpha: under.alpha },
      ])
    }
  })

  it('shows the spectrum of what comes out, and says the root or the value in hand', () => {
    const meters = metersOf(descriptor?.meters)
    const still = drawDisplay(display, params, { meters })
    const running = drawDisplay(display, params, { meters, signal: testSignal() })
    expect(running.marks()).toBe(still.marks() + 2)
    expect(still.words()).toEqual(['C'])
    expect(drawDisplay(display, params, { values: { root: 10 } }).words()).toEqual(['A#'])
    const said = (hot: string, values: Record<string, number> = {}): string[] =>
      drawDisplay(display, params, { values, hot }).words()
    expect(said('width')).toEqual(['30 ct'])
    expect(said('depth', { depth: 41.6 })).toEqual(['42 dB'])
    expect(said('low')).toEqual(['40 Hz'])
    expect(said('high')).toEqual(['12 kHz'])
  })
})
