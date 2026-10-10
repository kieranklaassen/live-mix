// The Glints display against the device it shows: every band, row and point
// the display draws is checked here against the number the device's own code
// gives (`cpp/devices/glints/glints.h`), each ring against the parameter it
// sets, and what is drawn from the device's readings against the reading.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  GLINTS_FACES,
  GLINTS_FAINTEST,
  GLINTS_POINT,
  GLINTS_POINT_OPEN,
  GLINTS_SPAN_SEC,
  glintsChance,
  glintsCrowd,
  glintsEdge,
  glintsLate,
  glintsLateAt,
  glintsLayout,
  glintsLeast,
  glintsPace,
  glintsPaceY,
  glintsReach,
  glintsRoom,
  glintsRowOf,
  glintsRows,
  glintsSpark,
  glintsWindow,
  glintsX,
  glintsY,
} from '../components/displays/glints'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import {
  drawDisplay,
  metersOf,
  runDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('glints')
if (!descriptor) throw new Error('glints is not a stock device')
const { display } = GLINTS_FACES.glints
const params = descriptor.params
const meters = metersOf(descriptor.meters)
const ACCENT = PLAIN_COLOURS.accent
const INK = PLAIN_COLOURS.ink

// --- `glints.h`, copied: what the display has to agree with -------------------

/** `kChance`: for each Pitch choice, the chance a spark takes each speed from x2 to x8, summed along the row. */
const K_CHANCE = [
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1],
  [0.45, 0.7, 1, 1, 1, 1, 1],
  [0.24, 0.43, 0.59, 0.72, 0.83, 0.92, 1],
]
/** `kRingOf`, `kLag`, `kHeadRoom`: the decimated copy a speed reads, how late that copy is, the samples of it kept clear of the write head. */
const K_RING_OF = [1, 2, 2, 3, 3, 3, 3]
const K_LAG = [0, 31, 93, 217]
const K_HEAD_ROOM = 12
/** `kSoftEdgeSeconds`, `kSharpEdgeSeconds`, `kMostEdge`. */
const K_SOFT_EDGE = 0.006
const K_SHARP_EDGE = 0.0003
const K_MOST_EDGE = 0.3
/** `kMaxFeedback`. */
const K_MAX_FEEDBACK = 0.85
const RATE = 48000

/** `throw_spark()`: the least a spark of a row starts behind the playing, in seconds. */
function deviceLeast(row: number, sizeMs: number): number {
  const speed = row + 2
  const ring = K_RING_OF[row]
  const room = K_LAG[ring] + K_HEAD_ROOM * (1 << ring)
  return ((speed - 1) * Math.max(16, sizeMs * 0.001 * RATE) + room) / RATE
}

/** `throw_spark()`: what the device packs into one reading for a spark. */
function deviceCode(row: number, pan: number, lateSec: number, loudDb: number): number {
  const step = (value: number, most: number): number =>
    Math.floor(Math.min(most, Math.max(0, value)))
  const panStep = step((pan + 1) * 31.5 + 0.5, 63)
  const lateStep = step(lateSec * 500 + 0.5, 4095)
  const loudStep = step((loudDb + 42) / 6 + 0.5, 7)
  return row | (panStep << 3) | (lateStep << 9) | (loudStep << 21)
}

/** `render()`: a spark's window at `phase` of its life. */
function deviceWindow(phase: number, edge: number): number {
  if (phase < edge) {
    const t = phase / edge
    return t * t * (3 - 2 * t)
  }
  const fall = 1 - (phase - edge) / (1 - edge)
  return fall * fall
}

// --- Reading a drawing ---------------------------------------------------------

interface Mark {
  kind: 'fill' | 'stroke' | 'rect' | 'words'
  colour: string
  alpha: number
  dashed: boolean
  points: [number, number][]
  words?: string
}

/** Everything a drawing put down, each mark with its colour and where it lies. */
function marksOf(drawn: RecordingContext): Mark[] {
  const marks: Mark[] = []
  let fill = ''
  let stroke = ''
  let alpha = 1
  let dashed = false
  let path: [number, number][] = []
  for (const { name, args } of drawn.calls) {
    const n = args as number[]
    if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set globalAlpha') alpha = Number(args[0])
    else if (name === 'setLineDash') dashed = (args[0] as number[]).length > 0
    else if (name === 'beginPath') path = []
    else if (name === 'moveTo' || name === 'lineTo' || name === 'arc') path.push([n[0], n[1]])
    else if (name === 'fill')
      marks.push({ kind: 'fill', colour: fill, alpha, dashed, points: path })
    else if (name === 'stroke')
      marks.push({ kind: 'stroke', colour: stroke, alpha, dashed, points: path })
    else if (name === 'fillRect')
      marks.push({
        kind: 'rect',
        colour: fill,
        alpha,
        dashed,
        points: [
          [n[0], n[1]],
          [n[0] + n[2], n[1] + n[3]],
        ],
      })
    else if (name === 'fillText')
      marks.push({
        kind: 'words',
        colour: fill,
        alpha,
        dashed,
        points: [[n[1], n[2]]],
        words: String(args[0]),
      })
  }
  return marks
}

const left = (mark: Mark): number => Math.min(...mark.points.map(([x]) => x))
const right = (mark: Mark): number => Math.max(...mark.points.map(([x]) => x))
const top = (mark: Mark): number => Math.min(...mark.points.map(([, y]) => y))
const foot = (mark: Mark): number => Math.max(...mark.points.map(([, y]) => y))
const middle = (mark: Mark): number => (top(mark) + foot(mark)) / 2

/** The flights: the thin bars a pixel high that a spark leaves from where it began to where it reads. */
const flights = (drawn: RecordingContext, colour: string): Mark[] =>
  marksOf(drawn).filter(
    (mark) =>
      mark.kind === 'rect' && mark.colour === colour && Math.abs(foot(mark) - top(mark) - 1) < 1e-6,
  )
/** The points of light: a cross of two strokes. */
const lights = (drawn: RecordingContext, colour: string): Mark[] =>
  marksOf(drawn).filter(
    (mark) => mark.kind === 'stroke' && mark.colour === colour && mark.points.length === 4,
  )
/** The bands: the fills higher than a flight, right of the gauge. */
const bands = (drawn: RecordingContext, values: Record<string, number> = {}): Mark[] => {
  const layout = glintsLayout(viewOf(display, params, { values }))
  return marksOf(drawn).filter(
    (mark) =>
      mark.kind === 'rect' &&
      mark.colour === INK &&
      left(mark) >= layout.field.x &&
      foot(mark) - top(mark) >= 2 &&
      right(mark) - left(mark) < layout.field.w,
  )
}

function handleOf(key: string, values: Record<string, number> = {}): DisplayHandle {
  const found = display.handles?.(viewOf(display, params, { values })).find((h) => h.key === key)
  if (!found) throw new Error(`glints has no handle ${key}`)
  return found
}

const layoutOf = (options: FrameOptions = {}) => glintsLayout(viewOf(display, params, options))

/**
 * The display run as the plate runs it, with the device throwing the sparks
 * given: each at its time in seconds, as the reading the device would report.
 */
function runWith(
  sparks: readonly { at: number; code: number }[],
  seconds: number,
  options: FrameOptions = {},
  pace = 3,
): RecordingContext {
  return runDisplay(display, params, seconds, { ...options, meters }, (time) => {
    const thrown = sparks.filter((spark) => spark.at <= time)
    const newest = (back: number): number => thrown[thrown.length - 1 - back]?.code ?? 0
    return {
      meters: {
        sparks: thrown.length,
        pace,
        spark1: newest(0),
        spark2: newest(1),
        spark3: newest(2),
        spark4: newest(3),
      },
    }
  })
}

/** The time a spark is thrown so that frame `frame` (30 a second, from 0) is the first to see it, and how long to run so that frame `last` is the one looked at. */
const thrownAt = (frame: number): number => (frame - 0.5) / 30
const until = (last: number): number => (last + 1.25) / 30

const closeTo = (found: number[], wanted: number[]): void => {
  expect(found.length).toBe(wanted.length)
  const sorted = [...found].sort((a, b) => a - b)
  ;[...wanted].sort((a, b) => a - b).forEach((value, i) => expect(sorted[i]).toBeCloseTo(value, 6))
}

describe('the Glints display: what it copies from the device', () => {
  it('throws on the rows the device throws on, as often', () => {
    for (let set = 0; set < K_CHANCE.length; set++) {
      const thrown = K_CHANCE[set]
        .map((sum, row) => sum - (row > 0 ? K_CHANCE[set][row - 1] : 0))
        .map((chance, row) => ({ chance, row }))
        .filter(({ chance }) => chance > 1e-9)
      expect(glintsRows(set)).toEqual(thrown.map(({ row }) => row))
      for (const { chance, row } of thrown) expect(glintsChance(set, row)).toBeCloseTo(chance, 9)
      // A draw of the dice lands where `throw_spark()` puts it: the first row whose sum it is under.
      for (const pick of [0, 0.2, 0.44, 0.46, 0.69, 0.71, 0.93, 0.999]) {
        let row = 0
        while (row < 6 && pick >= K_CHANCE[set][row]) row += 1
        expect(glintsRowOf(set, pick), `choice ${set}, draw ${pick}`).toBe(row)
      }
    }
  })

  it('starts a spark as far back as the device does', () => {
    for (let row = 0; row < 7; row++) {
      for (const size of [8, 70, 300]) {
        expect(glintsLeast(row, size), `x${row + 2} at ${size} ms`).toBeCloseTo(
          deviceLeast(row, size),
          9,
        )
        // Scatter on top by the square of the draw, as `late` is made.
        expect(glintsLate(row, size, 800, 0.5)).toBeCloseTo(deviceLeast(row, size) + 0.8 * 0.25, 9)
      }
      const ring = K_RING_OF[row]
      expect(glintsRoom(row)).toBeCloseTo((K_LAG[ring] + K_HEAD_ROOM * (1 << ring)) / RATE, 12)
    }
    // The picture is wide enough for the furthest start there is.
    expect(deviceLeast(6, 300) + 2).toBeLessThan(GLINTS_SPAN_SEC)
  })

  it("opens and closes a spark's window as the device does", () => {
    for (const sparkle of [0, 0.5, 1]) {
      for (const length of [0.008, 0.07, 0.3]) {
        const seconds = K_SOFT_EDGE * Math.exp(sparkle * Math.log(K_SHARP_EDGE / K_SOFT_EDGE))
        const edge = Math.min(K_MOST_EDGE, seconds / length)
        expect(glintsEdge(sparkle, length)).toBeCloseTo(edge, 9)
        for (const phase of [0, edge / 2, edge, 0.4, 0.75, 0.999])
          expect(glintsWindow(phase, edge), `phase ${phase}`).toBeCloseTo(
            deviceWindow(phase, edge),
            9,
          )
      }
    }
    expect(glintsWindow(0.02, 0.02)).toBeCloseTo(1, 9)
    expect(glintsWindow(1, 0.02)).toBe(0)
    expect(glintsWindow(-0.1, 0.02)).toBe(0)
  })

  it('paces and turns down a crowd as the device does', () => {
    // `control()`: Density, less what Follow takes while the playing is not at full.
    expect(glintsPace(10, 0, 0.2)).toBeCloseTo(10, 9)
    expect(glintsPace(10, 1, 0.25)).toBeCloseTo(2.5, 9)
    expect(glintsPace(10, 0.6, 0)).toBeCloseTo(4, 9)
    expect(glintsPace(10, 0.6, 1)).toBeCloseTo(10, 9)
    // `throw_spark()`: one over the square root of the sparks sounding at once, and never up.
    expect(glintsCrowd(40, 0.3)).toBeCloseTo(1 / Math.sqrt(12), 9)
    expect(glintsCrowd(3, 0.07)).toBe(1)
  })

  it('reads a spark out of the number the device packs it into', () => {
    const spark = glintsSpark(deviceCode(2, -0.5, 0.35, -12))
    expect(spark?.row).toBe(2)
    expect(spark?.pan).toBeCloseTo(-0.5, 1)
    expect(spark?.late).toBeCloseTo(0.35, 2)
    expect(spark?.loud).toBe(5)
    const far = glintsSpark(deviceCode(6, 1, 4.1, 0))
    expect(far).toMatchObject({ row: 6, loud: 7 })
    expect(far?.pan).toBeCloseTo(1, 5)
    expect(far?.late).toBeCloseTo(4.1, 2)
    // What is not a spark is not read as one.
    for (const reading of [-6, Number.NaN, Number.POSITIVE_INFINITY, 7, 2 ** 24])
      expect(glintsSpark(reading), `${reading}`).toBeNull()
  })
})

describe('the Glints display at rest', () => {
  it('sets the rows by their speed: equal steps for equal intervals', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
    ]) {
      const layout = layoutOf({ width, height })
      // Up to two octaves the scale is one octave; a fifth above the octave stands at log2(3/2) of it.
      const octave = glintsY(0, 3, layout) - glintsY(2, 3, layout)
      expect(octave).toBeGreaterThan(height * 0.5)
      expect((glintsY(0, 3, layout) - glintsY(1, 3, layout)) / octave).toBeCloseTo(
        Math.log2(1.5),
        9,
      )
      // Overtones run over two octaves, x4 half way.
      const two = glintsY(0, 4, layout) - glintsY(6, 4, layout)
      expect(two).toBeCloseTo(octave, 9)
      expect((glintsY(0, 4, layout) - glintsY(2, 4, layout)) / two).toBeCloseTo(0.5, 9)
      expect((glintsY(0, 4, layout) - glintsY(5, 4, layout)) / two).toBeCloseTo(
        Math.log2(3.5) / 2,
        9,
      )
    }
  })

  it('names the speeds the Pitch choice throws, and only those', () => {
    const named = (values: Record<string, number>, height = 48): string[] =>
      drawDisplay(display, params, { values, meters, height })
        .words()
        .filter((word) => word.startsWith('×'))
        .sort()
    expect(named({ pitch: 0 })).toEqual(['×2'])
    expect(named({ pitch: 1 })).toEqual(['×3'])
    expect(named({ pitch: 2 })).toEqual(['×4'])
    expect(named({ pitch: 3 })).toEqual(['×2', '×3', '×4'])
    // Seven rows do not all fit a name in a strip: the octaves are named, and more where there is room.
    expect(named({ pitch: 4 })).toEqual(['×2', '×4', '×8'])
    expect(named({ pitch: 4 }, 100)).toEqual(['×2', '×3', '×4', '×6', '×8'])
  })

  it('lays a band over where the sparks of each row start, from the least to Scatter past it', () => {
    for (const values of [
      {},
      { pitch: 0, size: 8, scatter: 0 },
      { pitch: 1, size: 300, scatter: 2000 },
      { pitch: 4, size: 120, scatter: 900 },
    ] as Record<string, number>[]) {
      const view = viewOf(display, params, { values })
      const layout = glintsLayout(view)
      const set = view.value('pitch')
      const found = bands(drawDisplay(display, params, { values, meters }), values)
      const rows = glintsRows(set)
      expect(found.length, JSON.stringify(values)).toBe(rows.length)
      for (const row of rows) {
        const y = glintsY(row, set, layout)
        const band = found.find((mark) => Math.abs(middle(mark) - y) < 0.01)
        expect(band, `x${row + 2} has a band`).toBeDefined()
        if (!band) continue
        const least = deviceLeast(row, view.value('size'))
        expect(left(band)).toBeCloseTo(glintsX(least, layout), 6)
        const wide = glintsX(least + view.value('scatter') * 0.001, layout) - glintsX(least, layout)
        // With no Scatter it is still there to see.
        expect(right(band) - left(band)).toBeCloseTo(Math.max(1.5, wide), 6)
        // As high as Spread throws the sparks to the two sides.
        expect((foot(band) - top(band)) / 2).toBeCloseTo(
          1 + view.value('spread') * glintsReach(set, layout),
          6,
        )
      }
    }
  })

  it('lays the band stronger on the row more sparks land on', () => {
    const view = viewOf(display, params)
    const layout = glintsLayout(view)
    const found = bands(drawDisplay(display, params, { meters }))
    const alphaOf = (row: number): number =>
      found.find((mark) => Math.abs(middle(mark) - glintsY(row, 3, layout)) < 0.01)?.alpha ?? 0
    // Mixed: 45 in a hundred at x2, 25 at x3, 30 at x4.
    expect(alphaOf(0)).toBeGreaterThan(alphaOf(2))
    expect(alphaOf(2)).toBeGreaterThan(alphaOf(1))
    expect(alphaOf(1)).toBeGreaterThan(0)
  })

  it('makes each band as high as Spread, flat with none', () => {
    const heightOf = (spread: number): number => {
      const [band] = bands(drawDisplay(display, params, { values: { spread, pitch: 0 }, meters }))
      return foot(band) - top(band)
    }
    expect(heightOf(0)).toBeCloseTo(2, 6)
    expect(heightOf(1)).toBeGreaterThan(heightOf(0.5))
  })

  it('throws a worked example in the ink, the same whenever it is drawn, and nothing as happening', () => {
    const one = drawDisplay(display, params, { meters, now: 10 })
    const other = drawDisplay(display, params, { meters, now: 73.4 })
    expect(other.print()).toBe(one.print())
    expect(lights(one, INK).length).toBeGreaterThan(0)
    expect(lights(one, ACCENT)).toEqual([])
    expect(flights(one, ACCENT)).toEqual([])
    expect(marksOf(one).filter((mark) => mark.colour === ACCENT)).toEqual([])
  })

  it('starts every example spark where the device could start one', () => {
    for (const values of [
      {},
      { pitch: 4, density: 40, size: 20, scatter: 1200, trail: 0 },
      { pitch: 2, density: 12, size: 150, scatter: 0, trail: 0 },
    ] as Record<string, number>[]) {
      const view = viewOf(display, params, { values })
      const layout = glintsLayout(view)
      const set = view.value('pitch')
      const drawn = drawDisplay(display, params, { values: { trail: 0, ...values }, meters })
      const marks = flights(drawn, INK)
      expect(marks.length, JSON.stringify(values)).toBeGreaterThan(0)
      for (const mark of marks) {
        // Which row it is on: the nearest, for Spread moves it up or down in its row.
        const row = glintsRows(set).reduce((best, candidate) =>
          Math.abs(glintsY(candidate, set, layout) - middle(mark)) <
          Math.abs(glintsY(best, set, layout) - middle(mark))
            ? candidate
            : best,
        )
        const least = deviceLeast(row, view.value('size'))
        const began = glintsLateAt(right(mark), layout)
        expect(began).toBeGreaterThan(least - 0.004)
        expect(began).toBeLessThan(least + view.value('scatter') * 0.001 + 0.004)
        expect(Math.abs(middle(mark) - glintsY(row, set, layout))).toBeLessThanOrEqual(
          view.value('spread') * glintsReach(set, layout) + 1e-6,
        )
      }
    }
  })

  it('shows more sparks for a higher Density, and fainter where the device turns a crowd down', () => {
    const count = (density: number): number =>
      flights(drawDisplay(display, params, { values: { density, trail: 0 }, meters }), INK).length
    expect(count(40)).toBeGreaterThan(count(10))
    expect(count(10)).toBeGreaterThan(count(3))
    expect(count(0.2)).toBeGreaterThan(0)
    const strongest = (values: Record<string, number>): number =>
      Math.max(...lights(drawDisplay(display, params, { values, meters }), INK).map((m) => m.alpha))
    const sparse = strongest({ density: 3, size: 300, mix: 1, trail: 0 })
    const crowd = strongest({ density: 40, size: 300, mix: 1, trail: 0 })
    // Forty a second of 300 ms: twelve at once, turned down to 1 / sqrt(12), drawn no fainter than 0.4.
    expect(sparse).toBeCloseTo(1, 6)
    expect(crowd).toBeCloseTo(Math.max(0.4, glintsCrowd(40, 0.3)), 6)
  })

  it('draws the repeats of a trail further back, each as much fainter as the trail gives back', () => {
    const values = {
      pitch: 0,
      density: 1.2,
      scatter: 0,
      spread: 0,
      trail: 0.5,
      trailTime: 400,
      mix: 1,
    }
    const layout = layoutOf({ values })
    const drawn = drawDisplay(display, params, { values, meters })
    const marks = flights(drawn, INK).sort((a, b) => right(a) - right(b))
    // One spark in sight, and the repeats that have had time to sound: each began 400 ms later.
    const least = deviceLeast(0, 70)
    const firsts = marks.filter((mark) => Math.abs(right(mark) - glintsX(least, layout)) < 0.01)
    const seconds = marks.filter(
      (mark) => Math.abs(right(mark) - glintsX(least + 0.4, layout)) < 0.01,
    )
    expect(firsts.length).toBeGreaterThan(0)
    expect(seconds.length).toBeGreaterThan(0)
    // A repeat that is as far along as its spark is laid `kMaxFeedback` x Trail as strongly.
    const glow = Math.max(...firsts.map((mark) => mark.alpha))
    const glowAfter = Math.max(...seconds.map((mark) => mark.alpha))
    expect(glowAfter).toBeLessThan(glow)
    expect(glowAfter).toBeGreaterThan(0)
    const none = flights(
      drawDisplay(display, params, { values: { ...values, trail: 0 }, meters }),
      INK,
    )
    expect(none.filter((mark) => right(mark) > glintsX(least + 0.3, layout))).toEqual([])
  })

  it('shows on the gauge the stretch Follow lets the playing move the pace over', () => {
    for (const values of [
      {},
      { density: 20, follow: 0.9 },
      { density: 0.2, follow: 0 },
      { density: 40, follow: 1 },
    ] as Record<string, number>[]) {
      const view = viewOf(display, params, { values })
      const layout = glintsLayout(view)
      const density = view.value('density')
      const stretch = marksOf(drawDisplay(display, params, { values, meters })).find(
        (mark) =>
          mark.kind === 'rect' &&
          mark.colour === INK &&
          Math.abs(left(mark) - layout.gauge.x) < 1e-6 &&
          Math.abs(right(mark) - layout.gauge.x - layout.gauge.w) < 1e-6 &&
          Math.abs(mark.alpha - 0.5) < 1e-6,
      )
      expect(stretch, JSON.stringify(values)).toBeDefined()
      if (!stretch) continue
      // From Density down to what is left of it in silence, on a scale of equal ratios.
      const up = (pace: number): number =>
        Math.log(Math.min(40, Math.max(0.2, pace)) / 0.2) / Math.log(40 / 0.2)
      const y = (pace: number): number => layout.gauge.y + layout.gauge.h * (1 - up(pace))
      expect(top(stretch)).toBeCloseTo(y(density), 6)
      expect(glintsPaceY(density, view, layout)).toBeCloseTo(y(density), 9)
      const idle = y(density * (1 - view.value('follow')))
      expect(foot(stretch)).toBeCloseTo(Math.max(y(density) + 1, idle), 6)
    }
  })

  it('draws nothing as thrown with Mix at nothing, and keeps its scales and rings', () => {
    const drawn = drawDisplay(display, params, { values: { mix: 0 }, meters })
    expect(flights(drawn, INK)).toEqual([])
    expect(lights(drawn, INK)).toEqual([])
    expect(bands(drawn).length).toBe(3)
    expect(drawn.words()).toContain('1 s')
    // Switched off it shows what it would do, in the ink.
    const off = drawDisplay(display, params, { meters, powered: false })
    expect(lights(off, INK).length).toBeGreaterThan(0)
    expect(marksOf(off).filter((mark) => mark.colour === ACCENT)).toEqual([])
  })
})

describe('the rings of the Glints display', () => {
  it('stands Size where the highest row starts at the least, and a drag there sets that Size', () => {
    for (const [pitch, high] of [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 2],
      [4, 6],
    ]) {
      for (const size of [8, 70, 300]) {
        const values = { pitch, size }
        const layout = layoutOf({ values })
        const ring = handleOf('size', values)
        expect(ring.x).toBeCloseTo(glintsX(deviceLeast(high, size), layout), 6)
        expect(ring.y).toBeCloseTo(glintsY(high, pitch, layout), 6)
        expect(ring.drag(ring.x, ring.y).size).toBeCloseTo(size, 4)
        // Dragged to where another Size would stand, it sets that Size.
        for (const wanted of [12, 45, 200]) {
          const there = glintsX(deviceLeast(high, wanted), layout)
          expect(ring.drag(there, 0).size, `x${high + 2} to ${wanted} ms`).toBeCloseTo(wanted, 3)
        }
      }
    }
    // Past either end it stops at the end of the range.
    const ring = handleOf('size')
    expect(ring.drag(-50, 0).size).toBe(8)
    expect(ring.drag(999, 0).size).toBe(300)
    expect(ring.reset?.()).toEqual({ size: 70 })
  })

  it('stands Scatter where the lowest row starts at the most, and a drag there sets that Scatter', () => {
    for (const [pitch, low] of [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 0],
      [4, 0],
    ]) {
      for (const scatter of [200, 350, 2000]) {
        const values = { pitch, scatter }
        const layout = layoutOf({ values })
        const least = deviceLeast(low, 70)
        const ring = handleOf('scatter', values)
        expect(ring.x).toBeCloseTo(glintsX(least + scatter * 0.001, layout), 6)
        expect(ring.y).toBeCloseTo(glintsY(low, pitch, layout), 6)
        expect(ring.drag(ring.x, ring.y).scatter).toBeCloseTo(scatter, 3)
        for (const wanted of [50, 600, 1500]) {
          const there = glintsX(least + wanted * 0.001, layout)
          expect(ring.drag(there, 0).scatter, `to ${wanted} ms`).toBeCloseTo(wanted, 3)
        }
      }
    }
    const ring = handleOf('scatter')
    expect(ring.drag(-50, 0).scatter).toBe(0)
    expect(ring.drag(999, 0).scatter).toBe(2000)
    expect(ring.reset?.()).toEqual({ scatter: 350 })
  })

  it('keeps the two rings apart on one row, and brings Scatter under the hand within twice the gap', () => {
    const values = { pitch: 0, scatter: 0 }
    const layout = layoutOf({ values })
    const size = handleOf('size', values)
    const scatter = handleOf('scatter', values)
    expect(scatter.y).toBeCloseTo(size.y, 6)
    expect(scatter.x - size.x).toBeCloseTo(9, 6)
    // Taken and not moved it is still no Scatter. Moved right the setting makes up the gap
    // over twice its width, half as fast again as the hand, and from there on is where the hand is.
    const hold: DisplayHold = {}
    expect(scatter.drag(scatter.x, scatter.y, hold).scatter).toBeCloseTo(0, 6)
    const least = deviceLeast(0, 70)
    const none = glintsX(least, layout)
    let before = 0
    for (const by of [4, 12, 18, 20, 60]) {
      // The plate asks for the rings again at every move: the hold remembers the press.
      const moved = handleOf('scatter', { ...values, scatter: 123 })
      const set = moved.drag(scatter.x + by, scatter.y, hold).scatter
      expect(set).toBeCloseTo(
        (glintsLateAt(none + Math.min(1.5 * by, 9 + by), layout) - least) * 1000,
        3,
      )
      expect(set).toBeGreaterThan(before)
      before = set
      // The ring as it is then drawn: under the hand once the gap is made up.
      if (by >= 18)
        expect(handleOf('scatter', { ...values, scatter: set }).x).toBeCloseTo(scatter.x + by, 3)
    }
    // Back to the left of the press it keeps its distance, down to no Scatter where it was taken.
    expect(scatter.drag(scatter.x - 3, scatter.y, hold).scatter).toBeCloseTo(0, 6)
    // The same hand at the same place sets the same thing every time.
    expect(scatter.drag(scatter.x + 20, 0, hold)).toEqual(scatter.drag(scatter.x + 20, 0, hold))
    // On two rows they are never in each other's way.
    const mixedSize = handleOf('size', { scatter: 0 })
    const mixedScatter = handleOf('scatter', { scatter: 0 })
    expect(Math.abs(mixedSize.y - mixedScatter.y)).toBeGreaterThan(12)
    expect(mixedScatter.x).toBeCloseTo(glintsX(deviceLeast(0, 70), layout), 6)
  })

  it('draws each ring where it is taken', () => {
    const drawn = drawDisplay(display, params, { meters, hot: 'size' })
    const rings = marksOf(drawn).filter(
      (mark) => mark.kind === 'stroke' && mark.points.length === 1 && mark.colour === INK,
    )
    const size = handleOf('size')
    const scatter = handleOf('scatter')
    expect(
      rings.some((r) => Math.abs(r.points[0][0] - size.x) < 1e-6 && r.points[0][1] === size.y),
    ).toBe(true)
    expect(
      rings.some(
        (r) => Math.abs(r.points[0][0] - scatter.x) < 1e-6 && r.points[0][1] === scatter.y,
      ),
    ).toBe(true)
    // The one under the hand is filled with the accent.
    const hot = marksOf(drawn).filter((mark) => mark.kind === 'fill' && mark.colour === ACCENT)
    expect(hot.length).toBe(1)
    expect(hot[0].points[0][0]).toBeCloseTo(size.x, 6)
  })
})

describe('the Glints display while the device throws', () => {
  const values = { trail: 0, mix: 1 }
  const layout = layoutOf({ values })

  it('puts a spark where the device says it began, on its row, to its side', () => {
    // x4, half left, 300 ms late, seen first by the frame looked at: it has only just begun.
    const drawn = runWith([{ at: thrownAt(29), code: deviceCode(2, -0.5, 0.3, -6) }], until(29), {
      values,
    })
    const marks = flights(drawn, ACCENT)
    expect(marks.length).toBe(1)
    const spark = glintsSpark(deviceCode(2, -0.5, 0.3, -6))
    expect(right(marks[0])).toBeCloseTo(glintsX(0.3, layout), 6)
    // Left is up in the row, by as much of the reach as the spark is thrown aside.
    const y = glintsY(2, 3, layout) + (spark?.pan ?? 0) * glintsReach(3, layout)
    expect(middle(marks[0])).toBeCloseTo(y, 6)
    expect(middle(marks[0])).toBeLessThan(glintsY(2, 3, layout))
    const points = lights(drawn, ACCENT)
    expect(points.length).toBe(1)
    // Nothing of the worked example is left once the device throws.
    expect(lights(drawn, INK)).toEqual([])
    expect(flights(drawn, INK)).toEqual([])
  })

  it('flies it left as it catches up: x4 makes up three times its age', () => {
    const size = 200
    const code = deviceCode(2, 0, 1.2, -6)
    const seen: number[] = []
    for (const frames of [2, 4, 6]) {
      // Looked at so many frames of a thirtieth after it was thrown.
      const drawn = runWith([{ at: thrownAt(15), code }], until(15 + frames), {
        values: { ...values, size },
      })
      const [mark] = flights(drawn, ACCENT)
      const age = frames / 30
      expect(right(mark)).toBeCloseTo(glintsX(1.2, layout), 6)
      expect(left(mark)).toBeCloseTo(glintsX(1.2 - 3 * age, layout), 4)
      // The point of light is at the reading end.
      const [point] = lights(drawn, ACCENT)
      expect((left(point) + right(point)) / 2).toBeCloseTo(left(mark), 6)
      seen.push(left(mark))
    }
    expect(seen[0]).toBeGreaterThan(seen[1])
    expect(seen[1]).toBeGreaterThan(seen[2])
  })

  it('makes the point of light as large as the window is open, and leaves a fading one behind', () => {
    const size = 300
    const code = deviceCode(0, 0, 0.5, 0)
    const armAt = (frames: number): { arm: number; alpha: number; left: number } => {
      const drawn = runWith([{ at: thrownAt(15), code }], until(15 + frames), {
        values: { ...values, size, sparkle: 0.5 },
      })
      const [point] = lights(drawn, ACCENT)
      const [mark] = flights(drawn, ACCENT)
      return point
        ? { arm: (right(point) - left(point)) / 2, alpha: point.alpha, left: left(mark) }
        : { arm: 0, alpha: 0, left: Number.NaN }
    }
    const edge = glintsEdge(0.5, 0.3)
    const sizes = [1, 3, 6, 8].map((frames) => ({
      ...armAt(frames),
      window: deviceWindow(frames / 30 / 0.3, edge),
    }))
    // The arm grows with the window by one rule, for the loudest reading at Sparkle half way.
    for (const { arm, window } of sizes) {
      expect(arm / (GLINTS_POINT + GLINTS_POINT_OPEN * window)).toBeCloseTo(1.05, 4)
    }
    expect(sizes[0].arm).toBeGreaterThan(sizes[3].arm)
    // After its 300 ms it stays where it ended, x2 having made up its whole length, and fades out.
    const ended = glintsX(0.5 - 0.3, layout)
    const after = armAt(15)
    const later = armAt(30)
    expect(after.left).toBeCloseTo(ended, 6)
    expect(later.left).toBeCloseTo(ended, 6)
    expect(after.alpha).toBeGreaterThan(later.alpha)
    expect(later.alpha).toBeGreaterThan(0)
    expect(armAt(60).alpha).toBe(0)
  })

  it('draws a spark plainly at the default Mix, while it sounds and for a moment after', () => {
    // As the plate first shows it: every setting where it starts, a spark of -12 dB on x3.
    expect(Math.cos((params.mix.default * Math.PI) / 2)).toBeGreaterThan(10 ** (-1 / 20))
    const lasts = params.size.default * 0.001
    const code = deviceCode(1, 0, 0.4, -12)
    const seen = (frames: number): { flight: Mark; point: Mark } => {
      const drawn = runWith([{ at: thrownAt(15), code }], until(15 + frames))
      return { flight: flights(drawn, ACCENT)[0], point: lights(drawn, ACCENT)[0] }
    }
    // The frame that first sees it: still sounding.
    expect(1 / 30).toBeLessThan(lasts)
    const sounding = seen(1)
    expect(sounding.point.alpha).toBeGreaterThan(GLINTS_FAINTEST)
    expect(sounding.flight.alpha).toBeGreaterThan(0.6)
    // A third of a second on its sound is long over: what is left is still plain, a cross three pixels across at the least.
    const after = seen(10)
    expect(10 / 30).toBeGreaterThan(lasts)
    expect(after.flight.alpha).toBeGreaterThan(0.4)
    expect(after.point.alpha).toBeGreaterThan(0.4)
    expect(right(after.point) - left(after.point)).toBeGreaterThan(3)
    // And it is gone when its glow and its two repeats are: nothing is left standing.
    expect(seen(60).point).toBeUndefined()
  })

  it('shows Sparkle in the point of light: longer arms about a tighter core', () => {
    const shape = (sparkle: number): { arm: number; core: number } => {
      const drawn = runWith([{ at: thrownAt(15), code: deviceCode(0, 0, 0.5, 0) }], until(17), {
        values: { ...values, size: 300, sparkle },
      })
      const [point] = lights(drawn, ACCENT)
      const centre = (left(point) + right(point)) / 2
      const core = drawn.calls.find(
        (call) =>
          call.name === 'arc' &&
          Math.abs((call.args[0] as number) - centre) < 1e-6 &&
          Math.abs((call.args[1] as number) - middle(point)) < 1e-6,
      )
      return { arm: (right(point) - left(point)) / 2, core: Number(core?.args[2]) }
    }
    const dull = shape(0)
    const bright = shape(1)
    expect(bright.arm).toBeGreaterThan(2 * dull.arm)
    expect(bright.core).toBeLessThan(0.5 * dull.core)
    // Sparkle sharpens a spark's edge and takes its body away: the arms grow as the core shrinks.
    expect(dull.arm / dull.core).toBeCloseTo(0.6 / 0.9, 6)
    expect(bright.arm / bright.core).toBeCloseTo(1.5 / 0.4, 6)
  })

  it('draws a quieter spark smaller', () => {
    const armOf = (db: number): number => {
      const drawn = runWith([{ at: thrownAt(29), code: deviceCode(0, 0, 0.4, db) }], until(29), {
        values,
      })
      const [point] = lights(drawn, ACCENT)
      return right(point) - left(point)
    }
    expect(armOf(0)).toBeGreaterThan(armOf(-18))
    expect(armOf(-18)).toBeGreaterThan(armOf(-42))
    expect(armOf(-42)).toBeGreaterThan(0)
  })

  it('takes every spark thrown between two readings, up to the four the device keeps', () => {
    const codes = [0, 1, 2, 0, 1, 2].map((row, i) => deviceCode(row, 0, 0.3 + 0.2 * i, -6))
    const three = runWith(
      codes.slice(0, 3).map((code) => ({ at: thrownAt(29), code })),
      until(29),
      { values },
    )
    closeTo(
      flights(three, ACCENT).map((mark) => right(mark)),
      [0.3, 0.5, 0.7].map((late) => glintsX(late, layout)),
    )
    // Six at once: the newest four are told, the two before them are lost and not made up.
    const six = runWith(
      codes.map((code) => ({ at: thrownAt(29), code })),
      until(29),
      { values },
    )
    closeTo(
      flights(six, ACCENT).map((mark) => right(mark)),
      [0.7, 0.9, 1.1, 1.3].map((late) => glintsX(late, layout)),
    )
  })

  it('draws a repeat of the trail further back and on the other side', () => {
    const trailed = { trail: 1, trailTime: 400, mix: 1, size: 100 }
    const code = deviceCode(0, -1, 0.5, 0)
    // Looked at fourteen frames after it was thrown: the spark is over, its first repeat sounds.
    const drawn = runWith([{ at: thrownAt(6), code }], until(20), { values: trailed })
    const marks = flights(drawn, ACCENT).sort((a, b) => right(a) - right(b))
    expect(marks.length).toBe(2)
    const row = glintsY(0, 3, layout)
    const reach = glintsReach(3, layout)
    expect(right(marks[0])).toBeCloseTo(glintsX(0.5, layout), 6)
    expect(middle(marks[0])).toBeCloseTo(row - reach, 6)
    expect(right(marks[1])).toBeCloseTo(glintsX(0.9, layout), 6)
    expect(middle(marks[1])).toBeCloseTo(row + reach, 6)
    // The repeat sounds now, at `kMaxFeedback` of the spark: its point is the brighter of the two.
    const points = lights(drawn, ACCENT).sort((a, b) => right(a) - right(b))
    expect(points.length).toBe(2)
    expect(points[1].alpha).toBeCloseTo(K_MAX_FEEDBACK, 6)
  })

  it('marks the pace the device keeps on the gauge', () => {
    for (const pace of [0.5, 3, 25]) {
      const drawn = runWith([], 3, { values }, pace)
      const mark = marksOf(drawn).find(
        (m) =>
          m.kind === 'rect' && m.colour === ACCENT && Math.abs(left(m) - layout.gauge.x) < 1e-6,
      )
      expect(mark, `pace ${pace}`).toBeDefined()
      if (!mark) continue
      const view = viewOf(display, params, { values })
      expect(middle(mark)).toBeCloseTo(glintsPaceY(pace, view, layout), 2)
    }
    // No pace, no mark: and after a while the worked example is back.
    const idle = runWith([], 4, { values }, 0)
    expect(marksOf(idle).filter((mark) => mark.colour === ACCENT)).toEqual([])
    expect(lights(idle, INK).length).toBeGreaterThan(0)
  })

  it('does not take readings that are not sparks for sparks', () => {
    for (const reading of [0, -6, 0.5]) {
      const drawn = runDisplay(display, params, 1, {
        values,
        meters: metersOf(descriptor.meters, reading),
      })
      expect(flights(drawn, ACCENT)).toEqual([])
      expect(lights(drawn, ACCENT)).toEqual([])
    }
    // A count that goes on while the reading under it is no spark throws nothing either.
    const drawn = runDisplay(display, params, 1, { values, meters }, (time) => ({
      meters: { ...meters, sparks: Math.floor(time * 30), pace: 3, spark1: 7, spark2: -1 },
    }))
    expect(flights(drawn, ACCENT)).toEqual([])
  })

  it('draws nothing as thrown while Mix lets none of it be heard, and goes on following', () => {
    const code = deviceCode(1, 0, 0.6, -6)
    const sparks = [6, 15, 29].map((frame) => ({ at: thrownAt(frame), code }))
    const silent = runWith(sparks, until(29), { values: { ...values, mix: 0 } })
    expect(marksOf(silent).filter((mark) => mark.colour === ACCENT)).toEqual([])
    expect(flights(silent, INK)).toEqual([])
    // Mix comes back: what was thrown unheard is not drawn as if it had just been thrown.
    const state = display.init?.()
    runDisplay(
      display,
      params,
      until(29),
      { values: { ...values, mix: 0 }, meters, state },
      (time) => ({
        meters: {
          ...meters,
          sparks: sparks.filter((s) => s.at <= time).length,
          pace: 3,
          spark1: code,
        },
      }),
    )
    const back = runDisplay(display, params, 0.2, {
      values,
      meters: { ...meters, sparks: 3, pace: 3, spark1: code },
      state,
      now: 11,
    })
    expect(flights(back, ACCENT)).toEqual([])
    // And the next one thrown is drawn.
    const next = runDisplay(display, params, 0.1, {
      values,
      meters: { ...meters, sparks: 4, pace: 3, spark1: code },
      state,
      now: 11.2,
    })
    expect(flights(next, ACCENT).length).toBe(1)
  })

  it('stands still while the device is switched off', () => {
    const drawn = runWith([{ at: thrownAt(27), code: deviceCode(0, 0, 0.4, 0) }], until(29), {
      values,
      powered: false,
    })
    expect(marksOf(drawn).filter((mark) => mark.colour === ACCENT)).toEqual([])
  })
})

describe('the Glints display at the two shapes it is given', () => {
  it('keeps every row, band and ring inside, a strip and upright', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
      [405, 48],
    ]) {
      for (const values of [
        {},
        { pitch: 4, size: 300, scatter: 2000, density: 40, trail: 1, trailTime: 800, spread: 1 },
        { pitch: 0, size: 8, scatter: 0, density: 0.2 },
      ] as Record<string, number>[]) {
        const view = viewOf(display, params, { values, width, height })
        const layout = glintsLayout(view)
        const drawn = drawDisplay(display, params, { values, meters, width, height })
        for (const band of bands(drawn, values)) {
          expect(left(band)).toBeGreaterThanOrEqual(layout.field.x)
          expect(right(band)).toBeLessThanOrEqual(layout.field.x + layout.field.w + 1.5)
          expect(top(band)).toBeGreaterThanOrEqual(3)
          expect(foot(band)).toBeLessThanOrEqual(height - 3)
        }
        for (const ring of display.handles?.(view) ?? []) {
          expect(ring.x).toBeGreaterThanOrEqual(layout.field.x)
          expect(ring.x).toBeLessThanOrEqual(width - 4)
          expect(ring.y).toBeGreaterThanOrEqual(7)
          expect(ring.y).toBeLessThanOrEqual(height - 7)
        }
        // The picture spans the same lateness whatever its width.
        expect(glintsLateAt(layout.field.x + layout.field.w, layout)).toBeCloseTo(
          GLINTS_SPAN_SEC,
          9,
        )
        expect(glintsLateAt(glintsX(0.35, layout), layout)).toBeCloseTo(0.35, 9)
      }
    }
  })
})
