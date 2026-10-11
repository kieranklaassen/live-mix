// The truth of the Scale Filter's display: its octave against the device's own
// mask, worked out here a second time from the header, its keys against the
// notes the device lets through, its handles against the parameters they set,
// and its bars against the readings the device sends.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SCALE_FILTER_FACES,
  SCALE_FILTER_RANGE_DB,
  SCALE_FILTER_SCALES,
  scaleFilterBar,
  scaleFilterLayout,
  scaleFilterLevel,
  scaleFilterNotes,
  scaleFilterPlace,
  scaleFilterRange,
  scaleFilterReading,
  scaleFilterX,
  type ScaleFilterLayout,
} from '../components/displays/scale-filter'
import { type DisplayHandle } from '../components/plate-display'
import {
  drawDisplay,
  metersOf,
  patchUnder,
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

/** The window beside four knobs, and the upright plate's. */
const SIZES: readonly [number, number][] = [
  [128, 100],
  [204, 100],
]
/** A strip, should the display ever be handed one: too low for three rows. */
const LOW: readonly [number, number] = [224, 48]

const layoutOf = (size: readonly [number, number]): ScaleFilterLayout =>
  scaleFilterLayout({ width: size[0], height: size[1] })

/** Where a pitch class should stand across an octave so wide: twelve semitones from half a semitone under C. */
function acrossOf(pitchClass: number, layout: ScaleFilterLayout): number {
  const place = ((((pitchClass + 0.5) % 12) + 12) % 12) - 0.5
  return layout.comb.x + ((place + 0.5) * layout.comb.w) / 12
}

/** The pitch class that stands at an x. */
function pitchAt(x: number, layout: ScaleFilterLayout): number {
  return ((x - layout.comb.x) / layout.comb.w) * 12 - 0.5
}

/** Where a gain should stand down the octave: 0 dB at its top, -48 dB at its foot. */
function downOf(gain: number, layout: ScaleFilterLayout): number {
  const db = 20 * Math.log10(Math.max(gain, 1e-9))
  return layout.comb.y + layout.comb.h * Math.min(1, Math.max(0, -db / 48))
}

function curves(now: Settings, size: readonly [number, number]): { heard: Stroke; mask?: Stroke } {
  const drawn = drawDisplay(display, params, {
    values: { ...now },
    width: size[0],
    height: size[1],
  })
  const long = strokes(drawn).filter((stroke) => stroke.points.length > 400)
  const heard = long.find((stroke) => stroke.width === 1.5 && !stroke.dashed)
  if (!heard) throw new Error('no curve was drawn')
  return { heard, mask: long.find((stroke) => stroke.dashed) }
}

/** The worst distance in pixels between a curve drawn across the octave and a gain worked out here. */
function worst(
  stroke: Stroke,
  now: Settings,
  size: readonly [number, number],
  gain: (pitchClass: number, now: Settings) => number,
): number {
  const layout = layoutOf(size)
  let most = 0
  for (const [x, y] of stroke.points) {
    // The pitch is read back from the x, and falls a hair to either side of the one that was drawn:
    // where a point stands just on the bell's cut-off (three Openings out, a step of 4e-6 in the gain)
    // either side of it is right.
    const pitch = pitchAt(x, layout)
    const apart = [pitch - 1e-7, pitch, pitch + 1e-7].map((at) =>
      Math.abs(y - downOf(gain(at, now), layout)),
    )
    most = Math.max(most, Math.min(...apart))
  }
  return most
}

/** The point of a curve that stands at a pitch class. */
function pointAt(stroke: Stroke, pitchClass: number, layout: ScaleFilterLayout): [number, number] {
  const x = acrossOf(pitchClass, layout)
  const found = stroke.points.find((point) => Math.abs(point[0] - x) < 1e-9)
  if (!found) throw new Error(`no point of the curve stands at ${pitchClass}`)
  return found
}

const SETTINGS: readonly Settings[] = [
  DEFAULTS,
  { root: 9, scale: 1, chord: 1, width: 24, depth: 36, tune: 0, mix: 1 },
  { root: 5, scale: 7, chord: 0, width: 120, depth: 18, tune: -35, mix: 1 },
  { root: 11, scale: 10, chord: 0, width: 200, depth: 48, tune: 50, mix: 1 },
  { root: 2, scale: 9, chord: 2, width: 5, depth: 12, tune: 20, mix: 0.5 },
  { root: 7, scale: 2, chord: 3, width: 60, depth: 40, tune: 0, mix: 0.25 },
]

describe('the scale filter display: where things stand', () => {
  it('stacks the octave, its keys and the range inside the canvas, a key at least ten pixels wide', () => {
    for (const size of SIZES) {
      const { comb, keys, strip } = layoutOf(size)
      expect(comb.x).toBe(4)
      expect(comb.x + comb.w).toBe(size[0] - 4)
      expect(comb.w / 12).toBeGreaterThanOrEqual(10)
      // Room over the octave for the root's reach and its handle, and no row over the next.
      expect(comb.y).toBeGreaterThanOrEqual(4 + 7)
      expect(comb.h).toBeGreaterThanOrEqual(48)
      expect(keys.y).toBeGreaterThanOrEqual(comb.y + comb.h + 2)
      expect(keys.h).toBe(10)
      expect([keys.x, keys.w]).toEqual([comb.x, comb.w])
      expect(strip.y).toBeGreaterThanOrEqual(keys.y + keys.h + 3)
      expect(strip.y + strip.h).toBe(size[1] - 4)
      expect([strip.x, strip.w]).toEqual([comb.x, comb.w])
    }
  })

  it('at the height of a strip puts the range beside the octave, and still letters the keys', () => {
    const { comb, keys, strip } = layoutOf(LOW)
    expect(comb.h).toBeGreaterThanOrEqual(20)
    expect(comb.w / 12).toBeGreaterThanOrEqual(10)
    expect(keys.y + keys.h).toBeLessThanOrEqual(LOW[1] - 4)
    expect(strip.x).toBeGreaterThanOrEqual(comb.x + comb.w + 6)
    expect(strip.x + strip.w).toBe(LOW[0] - 4)
    expect(strip.y + strip.h).toBe(LOW[1] - 4)
    const drawn = drawDisplay(display, params, { width: LOW[0], height: LOW[1] })
    expect(drawn.words()).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    const view = viewOf(display, params, { width: LOW[0], height: LOW[1] })
    for (const handle of display.handles?.(view) ?? []) {
      expect(handle.x).toBeGreaterThanOrEqual(4)
      expect(handle.x).toBeLessThanOrEqual(LOW[0] - 4)
      expect(handle.y).toBeGreaterThanOrEqual(4)
      expect(handle.y).toBeLessThanOrEqual(LOW[1] - 4)
    }
  })

  it('places a pitch class in the octave it draws, and a gain down it by its dB', () => {
    const layout = layoutOf(SIZES[0])
    for (const pitchClass of [0, 0.3, 11, 11.49, 11.5, 12, 14.25, -0.5, -0.51, -3]) {
      expect(scaleFilterX(scaleFilterPlace(pitchClass), layout.comb)).toBeCloseTo(
        acrossOf(pitchClass, layout),
        9,
      )
      expect(scaleFilterPlace(pitchClass)).toBeGreaterThanOrEqual(-0.5)
      expect(scaleFilterPlace(pitchClass)).toBeLessThan(11.5)
    }
    // C in the middle of the first key, B in the middle of the last.
    expect(scaleFilterX(0, layout.comb)).toBeCloseTo(4 + 5, 9)
    expect(scaleFilterX(11, layout.comb)).toBeCloseTo(4 + 115, 9)
    for (const gain of [1, 0.5, 0.1, Math.pow(10, -48 / 20), 0.001, 0])
      expect(scaleFilterLevel(gain, layout.comb)).toBeCloseTo(downOf(gain, layout), 9)
  })
})

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
    for (const size of [...SIZES, LOW])
      for (const now of SETTINGS) {
        const layout = layoutOf(size)
        const { heard, mask } = curves(now, size)
        expect(worst(heard, now, size, deviceHeard), JSON.stringify(now)).toBeLessThan(1e-6)
        expect(heard.colour).toBe(PLAIN_COLOURS.ink)
        // From one edge of the octave to the other, left to right.
        expect(heard.points[0][0]).toBeCloseTo(layout.comb.x, 9)
        expect(heard.points[heard.points.length - 1][0]).toBeCloseTo(
          layout.comb.x + layout.comb.w,
          9,
        )
        for (let i = 1; i < heard.points.length; i++)
          expect(heard.points[i][0]).toBeGreaterThanOrEqual(heard.points[i - 1][0])
        // Every opening's top is a point of it, however narrow: none is stepped over.
        const notes = deviceNotes(now.scale, now.chord)
        for (let s = 0; s < 12; s++)
          if (notes & (1 << s))
            expect(pointAt(heard, now.root + s + now.tune / 100, layout)[1]).toBeCloseTo(
              layout.comb.y,
              6,
            )
        // The device's own mask stands beside it only where Mix lets less than all of it out.
        expect(mask !== undefined, `the mask alone at mix ${now.mix}`).toBe(now.mix < 1)
        if (mask) expect(worst(mask, now, size, deviceMask)).toBeLessThan(1e-6)
      }
  })

  it('stands at the top on a note let through, 3 dB down at half an Opening, and Depth down between', () => {
    const layout = layoutOf(SIZES[0])
    const { comb } = layout
    const now: Settings = { ...DEFAULTS, root: 9, chord: 3, width: 40, depth: 36 }
    const { heard } = curves(now, SIZES[0])
    // A is the tenth key of twelve, ten pixels each.
    const [x, y] = pointAt(heard, 9, layout)
    expect(x).toBeCloseTo(4 + 95, 9)
    expect(y).toBeCloseTo(comb.y, 9)
    const floor = Math.pow(10, -36 / 20)
    const half = floor + (1 - floor) * Math.exp(-K_BELL * 0.25)
    expect(20 * Math.log10(half)).toBeCloseTo(-2.95, 2)
    for (const cents of [-20, 20])
      expect(pointAt(heard, 9 + cents / 100, layout)[1]).toBeCloseTo(
        comb.y - (comb.h * 20 * Math.log10(half)) / 48,
        6,
      )
    // Six semitones off, on D#, only the floor is left.
    expect(pointAt(heard, 3, layout)[1]).toBeCloseTo(comb.y + (comb.h * 36) / 48, 6)
  })

  it('still reads the device when Mix is 0, and draws nothing of it as heard', () => {
    const now: Settings = { ...DEFAULTS, mix: 0 }
    const { heard, mask } = curves(now, SIZES[0])
    const { comb } = layoutOf(SIZES[0])
    for (const [, y] of heard.points) expect(y).toBeCloseTo(comb.y, 6)
    expect(mask).toBeDefined()
    if (mask) expect(worst(mask, now, SIZES[0], deviceMask)).toBeLessThan(1e-6)
  })

  it('marks the root and how far its opening reaches before it is 48 dB down', () => {
    // exp(-1.3862944 x²) at two widths is 1/256.
    expect(20 * Math.log10(Math.exp(-K_BELL * 4))).toBeCloseTo(-48.16, 1)
    for (const size of SIZES) {
      const layout = layoutOf(size)
      const { comb } = layout
      const marks = (now: Settings): { root?: Stroke; reach?: Stroke } => {
        const all = strokes(
          drawDisplay(display, params, { values: { ...now }, width: size[0], height: size[1] }),
        )
        return {
          root: all.find((stroke) => stroke.colour === PLAIN_COLOURS.accent && stroke.width === 2),
          reach: all.find(
            ({ points }) =>
              points.length === 2 && points[0][1] === comb.y - 2.5 && points[1][1] === comb.y - 2.5,
          ),
        }
      }
      const now: Settings = { ...DEFAULTS, root: 4, width: 45, tune: 25 }
      const at = acrossOf(4.25, layout)
      const semitone = comb.w / 12
      const { root, reach } = marks(now)
      expect(root, 'the root is marked in the accent').toBeDefined()
      // Over the octave's top, where its opening stands.
      expect(root?.points).toEqual([
        [at, comb.y - 5],
        [at, comb.y],
      ])
      expect(reach, 'the reach of the root is drawn').toBeDefined()
      // Two Openings either side: 90 cents.
      expect(reach?.points[0][0]).toBeCloseTo(at - 0.9 * semitone, 9)
      expect(reach?.points[1][0]).toBeCloseTo(at + 0.9 * semitone, 9)
      // On B at the widest it runs to the octave's edge and no further.
      const wide = marks({ ...DEFAULTS, root: 11, width: 200 }).reach
      expect(wide?.points[0][0]).toBeCloseTo(acrossOf(11, layout) - 4 * semitone, 9)
      expect(wide?.points[1][0]).toBeCloseTo(comb.x + comb.w, 9)
    }
  })
})

// --- The keyboard ------------------------------------------------------------

interface Key {
  x: number
  w: number
  h: number
  colour: string
  alpha: number
}

/** The keys as they were filled, left to right, and each letter with the colour it was written in. */
function keysOf(
  values: Record<string, number>,
  size: readonly [number, number],
): { keys: Key[]; letters: [string, string, number][] } {
  const layout = layoutOf(size)
  const drawn = drawDisplay(display, params, { values, width: size[0], height: size[1] })
  const keys: Key[] = []
  const letters: [string, string, number][] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    const args = call.args as number[]
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = args[0]
    else if (call.name === 'fillRect' && args[1] === layout.keys.y && args[2] < layout.keys.w / 6)
      keys.push({ x: args[0], w: args[2], h: args[3], colour, alpha })
    else if (call.name === 'fillText') letters.push([String(call.args[0]), colour, args[1]])
  }
  return { keys, letters }
}

describe('the scale filter display: the keys', () => {
  const NATURAL = [true, false, true, false, true, true, false, true, false, true, false, true]

  it('draws an octave of keys from C under the octave, the sharps half as high', () => {
    for (const size of [...SIZES, LOW]) {
      const layout = layoutOf(size)
      const { keys } = keysOf({}, size)
      expect(keys.length).toBe(12)
      const wide = layout.keys.w / 12
      keys.forEach((key, n) => {
        // Under its own semitone of the octave above, a pixel between two keys.
        expect(key.x + key.w / 2).toBeCloseTo(acrossOf(n, layout), 9)
        expect(key.w).toBeCloseTo(wide - 1, 9)
        expect(key.h).toBe(NATURAL[n] ? 10 : 5)
      })
    }
  })

  it('lights the keys of the notes the device lets through, the root in the accent', () => {
    for (let scale = 0; scale < K_SCALES.length; scale++)
      for (let chord = 0; chord < 4; chord++)
        for (const root of [0, 1, 9, 11]) {
          const notes = deviceNotes(scale, chord)
          const { keys, letters } = keysOf({ root, scale, chord }, SIZES[0])
          const lettered: string[] = []
          keys.forEach((key, n) => {
            const open = (notes & (1 << ((n - root + 12) % 12))) !== 0
            const what = `scale ${scale} chord ${chord} on ${root}: key ${n}`
            if (open) {
              expect(key.alpha, what).toBe(1)
              expect(key.colour, what).toBe(n === root ? PLAIN_COLOURS.accent : PLAIN_COLOURS.ink)
            } else {
              // A key that is shut stands back, a sharp darker than a natural.
              expect(key.colour, what).toBe(PLAIN_COLOURS.ink)
              expect(key.alpha, what).toBe(NATURAL[n] ? 0.16 : 0.34)
            }
            // A natural has its letter: in the plate's colour on a lit key, in the ink on one that is not.
            if (NATURAL[n]) lettered.push(open ? PLAIN_COLOURS.plate : PLAIN_COLOURS.ink)
          })
          expect(letters.map(([letter]) => letter)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
          expect(letters.map(([, colour]) => colour)).toEqual(lettered)
        }
    // A minor pentatonic: A C D E G are lit, and of the naturals F and B are not.
    const { keys } = keysOf({ root: 9, scale: 8 }, SIZES[0])
    expect(keys.map((key) => key.alpha === 1)).toEqual(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [0, 2, 4, 7, 9].includes(n)),
    )
  })

  it('writes each letter in the middle of its key', () => {
    for (const size of SIZES) {
      const layout = layoutOf(size)
      const { letters } = keysOf({}, size)
      const naturals = [0, 2, 4, 5, 7, 9, 11]
      letters.forEach(([, , x], i) => expect(x).toBeCloseTo(acrossOf(naturals[i], layout), 9))
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
    [
      'width',
      [5, 12, 30, 80, 200],
      [{}, { root: 7, tune: -40 }, { root: 11, tune: 50 }, { scale: 10, depth: 0 }],
    ],
    ['depth', [0, 6, 18, 30, 48], [{}, { root: 3, scale: 8, tune: 30 }, { scale: 10, width: 100 }]],
    ['low', [20, 40, 180, 900, 2000], [{}, { high: 300 }]],
    ['high', [200, 440, 3000, 12000, 20000], [{}, { low: 2000 }]],
  ]

  it.each(cases)(
    '%s: dragged to where a value stands, it sets that value',
    (key, tried, around) => {
      for (const size of [...SIZES, LOW])
        for (const others of around)
          for (const value of tried) {
            const there = handleOf(key, { ...others, [key]: value }, size)
            expect(there.x).toBeGreaterThanOrEqual(4)
            expect(there.x).toBeLessThanOrEqual(size[0] - 4)
            expect(there.y).toBeGreaterThanOrEqual(4)
            expect(there.y).toBeLessThanOrEqual(size[1] - 4)
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
      expect(Math.hypot(high.x - low.x, high.y - low.y), `${key} at ${size[0]}`).toBeGreaterThan(36)
      expect(low.reset?.()).toEqual({ [key]: spec.default })
    }
  })

  it('width: stands two Openings from the root over the top, on the side with room for the widest', () => {
    for (const size of SIZES) {
      const layout = layoutOf(size)
      const semitone = layout.comb.w / 12
      // The root at 9.15 semitones: 120 cents under it, the left being the side with room.
      const handle = handleOf('width', { root: 9, tune: 15, width: 60 }, size)
      expect(handle.y).toBe(layout.comb.y - 2.5)
      expect(handle.x).toBeCloseTo(acrossOf(9.15, layout) - 1.2 * semitone, 9)
      // From D it stands over it, and from either side of the root a place sets the same.
      const other = handleOf('width', { root: 2, width: 60 }, size)
      expect(other.x).toBeCloseTo(acrossOf(2, layout) + 1.2 * semitone, 9)
      expect(other.drag(acrossOf(2, layout) - 1.2 * semitone, 50).width).toBeCloseTo(60, 6)
      expect(other.drag(acrossOf(2, layout), 0).width).toBe(params.width.min)
      expect(other.drag(size[0] + 300, 0).width).toBe(params.width.max)
      // The side does not change as Opening does, so a drag never throws the handle across the root.
      for (let root = 0; root < 12; root++)
        for (const tune of [-50, 0, 50]) {
          const sides = [5, 30, 200].map(
            (width) =>
              handleOf('width', { root, tune, width }, size).x >=
              acrossOf(root + tune / 100, layout),
          )
          expect(new Set(sides).size, `root ${root} tune ${tune}`).toBe(1)
          // And the widest still stands inside the octave, where its own setting lies.
          const widest = handleOf('width', { root, tune, width: 200 }, size)
          expect(Math.abs(widest.x - acrossOf(root + tune / 100, layout))).toBeCloseTo(
            4 * semitone,
            9,
          )
        }
      // The wheel moves it a tenth.
      expect(handle.wheel?.(1).width).toBeCloseTo(66, 6)
      expect(handle.wheel?.(-40).width).toBe(params.width.min)
    }
  })

  it('depth: stands on the mask of the device in the widest gap, whatever Mix is', () => {
    for (const size of SIZES) {
      const layout = layoutOf(size)
      // A minor pentatonic on D: D F G A C, its last widest gap from A to C, the middle a
      // semitone and a half over A, and Tune ten cents on.
      const now: Settings = { ...DEFAULTS, root: 2, scale: 8, width: 70, depth: 22, tune: 10 }
      const middle = 10.5 + 0.1
      for (const mix of [1, 0.4, 0]) {
        const handle = handleOf('depth', { ...now, mix }, size)
        expect(handle.x).toBeCloseTo(acrossOf(middle, layout), 6)
        expect(handle.y).toBeCloseTo(downOf(deviceMask(middle, now), layout), 6)
      }
      // Where the openings run into each other the mask cannot go as low: the drag is solved with that.
      const wide: Settings = { ...DEFAULTS, scale: 10, width: 150, depth: 40 }
      const handle = handleOf('depth', { ...wide }, size)
      expect(handle.x).toBeCloseTo(acrossOf(11.5, layout), 6)
      expect(handle.y).toBeCloseTo(downOf(deviceMask(11.5, wide), layout), 6)
      expect(handle.drag(handle.x, handle.y).depth).toBeCloseTo(40, 6)
      expect(handle.drag(handle.x, size[1] + 40).depth).toBe(params.depth.max)
      // With one note an octave the whole height is Depth's: 0 dB at the top, 48 at the foot.
      const alone: Settings = { ...DEFAULTS, chord: 3 }
      const { comb } = layout
      expect(handleOf('depth', { ...alone, depth: 0 }, size).y).toBeCloseTo(comb.y, 6)
      expect(handleOf('depth', { ...alone, depth: 24 }, size).y).toBeCloseTo(comb.y + comb.h / 2, 6)
      expect(handleOf('depth', { ...alone, depth: 48 }, size).y).toBeCloseTo(comb.y + comb.h, 6)
    }
  })

  it('low and high: stand on their lines across the range, an octave every tenth of it', () => {
    for (const size of [...SIZES, LOW]) {
      const { strip } = layoutOf(size)
      const x = (hz: number): number => strip.x + (strip.w * Math.log(hz / 20)) / Math.log(1000)
      for (const hz of [20, 55, 440, 2000]) {
        const handle = handleOf('low', { low: hz }, size)
        expect(handle.x).toBeCloseTo(x(hz), 6)
        expect(handle.y).toBeCloseTo(strip.y + strip.h * 0.7, 9)
      }
      const high = handleOf('high', { high: 12000 }, size)
      expect(high.x).toBeCloseTo(x(12000), 6)
      expect(high.y).toBeCloseTo(strip.y + strip.h * 0.3, 9)
      const values = { low: 110, high: 3520 }
      const drawn = drawDisplay(display, params, { values, width: size[0], height: size[1] })
      const upright = strokes(drawn).filter(
        ({ points }) =>
          points.length === 2 &&
          points[0][0] === points[1][0] &&
          points[0][1] === strip.y &&
          points[1][1] === strip.y + strip.h,
      )
      // Lines one pixel wide lie on the middle of their column of pixels.
      expect(upright.map(({ points }) => points[0][0])).toEqual([
        Math.floor(x(110)) + 0.5,
        Math.floor(x(3520)) + 0.5,
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

  it('draws each note as two bars up from the foot of the octave, a dB a step, under its opening', () => {
    for (const size of SIZES)
      for (const tune of [0, 30, -50]) {
        const layout = layoutOf(size)
        const { comb } = layout
        const foot = comb.y + comb.h
        // A comes in loudest and goes out whole; C# comes in 12 dB under it and goes out 30 dB down;
        // F is only a tail: nothing comes in, and it rings 6 dB under the loudest.
        const meters = {
          ...metersOf(descriptor?.meters),
          note10: packed(58, 58),
          note2: packed(46, 16),
          note6: packed(0, 52),
        }
        const drawn = drawDisplay(display, params, {
          meters,
          values: { tune },
          width: size[0],
          height: size[1],
        })
        const bars = strokes(drawn).filter((stroke) => stroke.width === 3)
        // The device reads a note where Tune has put it (`note_` in `update_mask`), and so does the bar.
        const bar = (note: number, colour: string): number | undefined => {
          const x = acrossOf(note + tune / 100, layout)
          const found = bars.find(
            ({ points, colour: drawnIn }) =>
              drawnIn === colour &&
              Math.abs(points[0][0] - x) < 1e-9 &&
              Math.abs(points[1][0] - x) < 1e-9 &&
              points[0][1] === foot,
          )
          return found?.points[1][1]
        }
        const down = (db: number): number => comb.y + (comb.h * db) / 48
        expect(bars.length).toBe(5)
        expect(bar(9, PLAIN_COLOURS.ink)).toBeCloseTo(comb.y, 6)
        expect(bar(9, PLAIN_COLOURS.accent)).toBeCloseTo(comb.y, 6)
        expect(bar(1, PLAIN_COLOURS.ink)).toBeCloseTo(down(12), 6)
        expect(bar(1, PLAIN_COLOURS.accent)).toBeCloseTo(down(42), 6)
        expect(bar(5, PLAIN_COLOURS.ink)).toBeUndefined()
        expect(bar(5, PLAIN_COLOURS.accent)).toBeCloseTo(down(6), 6)
        expect(scaleFilterBar(46, 58, comb)).toBeCloseTo(down(12), 9)
        // Switched off it shows the mask and no notes.
        const off = drawDisplay(display, params, { meters, powered: false })
        expect(strokes(off).filter((stroke) => stroke.width === 3)).toEqual([])
      }
  })

  it('reads the bars against the loudest note of late: up at once, down slowly, held in silence', () => {
    const { comb } = layoutOf(SIZES[0])
    const state = display.init?.()
    const quiet = metersOf(descriptor?.meters)
    /** The top of the tallest bar, or nothing when none is drawn. */
    const tallest = (meters: Record<string, number>, seconds: number): number | undefined => {
      const drawn = runDisplay(display, params, seconds, { meters, state })
      const tops = strokes(drawn)
        .filter((stroke) => stroke.width === 3)
        .map(({ points }) => points[1][1])
      return tops.length ? Math.min(...tops) : undefined
    }
    expect(tallest({ ...quiet, note1: packed(40, 40) }, 0.1)).toBeCloseTo(comb.y, 6)
    // A note 15 dB louder is at the top on its first frame.
    expect(tallest({ ...quiet, note1: packed(55, 55) }, 1 / 30)).toBeCloseTo(comb.y, 6)
    // Ten seconds of nothing, and a note 24 dB under still stands 24 dB down: the scale was held.
    expect(tallest(quiet, 10)).toBeUndefined()
    expect(tallest({ ...quiet, note1: packed(31, 31) }, 1 / 30)).toBeCloseTo(
      comb.y + comb.h * 0.5,
      6,
    )
    // Left there, the scale comes down to it.
    expect(tallest({ ...quiet, note1: packed(31, 31) }, 30)).toBeLessThan(comb.y + 0.1)
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
    for (const size of [...SIZES, LOW]) {
      const { strip } = layoutOf(size)
      const x = (hz: number): number => strip.x + (strip.w * Math.log(hz / 20)) / Math.log(1000)
      const shades = (
        values: Record<string, number>,
      ): { x: number; w: number; alpha: number }[] => {
        const drawn = drawDisplay(display, params, { values, width: size[0], height: size[1] })
        const found: { x: number; w: number; alpha: number }[] = []
        let alpha = 1
        for (const call of drawn.calls) {
          const args = call.args as number[]
          if (call.name === 'set globalAlpha') alpha = args[0]
          if (call.name === 'fillRect' && args[1] === strip.y && args[3] === strip.h)
            found.push({ x: args[0], w: args[2], alpha })
        }
        return found
      }
      const [under, over] = shades({ low: 110, high: 3520 })
      expect(under.x).toBe(strip.x)
      expect(under.x + under.w).toBeCloseTo(x(110 * semitones(-0.5)), 9)
      expect(over.x).toBeCloseTo(x(3520 * semitones(0.5)), 9)
      expect(over.x + over.w).toBeCloseTo(strip.x + strip.w, 9)
      // As strong as what is lost there: nothing at Depth 0 or with Mix at 0.
      expect(shades({ low: 110, high: 3520, depth: 0 })).toEqual([])
      expect(shades({ low: 110, high: 3520, mix: 0 })).toEqual([])
      expect(shades({ low: 110, high: 3520, mix: 0.5 })[0].alpha).toBeCloseTo(under.alpha / 2, 9)
      // Low over High: nothing is open, and the whole of it is shaded once.
      expect(shades({ low: 2000, high: 200 })).toEqual([
        { x: strip.x, w: strip.w, alpha: under.alpha },
      ])
    }
  })

  it('shows the spectrum of what comes out, and says the value in hand on a patch', () => {
    const meters = metersOf(descriptor?.meters)
    const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const still = drawDisplay(display, params, { meters })
    const running = drawDisplay(display, params, { meters, signal: testSignal() })
    expect(running.marks()).toBe(still.marks() + 1)
    // Switched off the spectrum is not drawn.
    const off = drawDisplay(display, params, { meters, signal: testSignal(), powered: false })
    expect(off.marks()).toBe(still.marks())
    expect(still.words()).toEqual(letters)
    const said = (hot: string, values: Record<string, number> = {}): string => {
      const drawn = drawDisplay(display, params, { values, hot })
      const words = drawn.words()
      expect(words.slice(0, 7)).toEqual(letters)
      expect(words.length).toBe(8)
      // Over the curve and the bars, so on a patch of the plate.
      expect(patchUnder(drawn, words[7], PLAIN_COLOURS.plate)).not.toBeNull()
      return words[7]
    }
    expect(said('width')).toBe('30 ct')
    expect(said('depth', { depth: 41.6 })).toBe('42 dB')
    expect(said('low')).toBe('40 Hz')
    expect(said('high')).toBe('12 kHz')
  })
})
