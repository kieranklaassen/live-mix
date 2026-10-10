// The display of Generations against the device it shows: the room's
// response, what Damping and the low cut take, and where every mark stands
// are checked against `cpp/devices/generations/generations.h`. The numbers
// here are copied from that header (its constants are named beside each), and
// the response is checked a second way, against the device's filters run
// sample by sample as `kit::Svf`, `kit::OnePole` and `kit::DcBlocker` run them.

import { describe, expect, it } from 'vitest'

import { INK as STRENGTH, PLAIN_COLOURS, xOfHz, yOfDb } from '../components/display-kit'
import {
  GENERATIONS_DAMPING_AT_HZ,
  GENERATIONS_FACES,
  GENERATIONS_FOOT_DB,
  GENERATIONS_MAX_HZ,
  GENERATIONS_MIN_HZ,
  GENERATIONS_PASSES,
  GENERATIONS_TONES,
  GENERATIONS_TOP_DB,
  generationsContrastDb,
  generationsDampingDb,
  generationsDampingHz,
  generationsLayout,
  generationsLowCutDb,
  generationsPassDb,
  generationsRoom,
  generationsRoomDb,
  generationsRoomHz,
  generationsShownDb,
} from '../components/displays/generations'
import { type DisplayHandle, type DisplaySignal } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  metersOf,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const ACCENT = PLAIN_COLOURS.accent
const INK = PLAIN_COLOURS.ink
const PLATE = PLAIN_COLOURS.plate
const RATE = 48000

const descriptor = stockDescriptors().get('generations')
if (!descriptor) throw new Error('generations is not a stock device')
const { display } = GENERATIONS_FACES.generations
const params = descriptor.params
const meters = metersOf(descriptor.meters)
const size = displaySize(display)
const { box, track } = generationsLayout(size)
const foot = box.y + box.h

const xAt = (hz: number, inBox = box): number =>
  xOfHz(hz, inBox, GENERATIONS_MIN_HZ, GENERATIONS_MAX_HZ)
const yAt = (db: number, inBox = box): number =>
  yOfDb(db, inBox, GENERATIONS_TOP_DB, GENERATIONS_FOOT_DB)
/** The frequency at so many pixels into the box: the scale turned round. */
const hzAtPixel = (pixels: number): number =>
  GENERATIONS_MIN_HZ * Math.pow(GENERATIONS_MAX_HZ / GENERATIONS_MIN_HZ, pixels / box.w)

function handleOf(key: string, values: Record<string, number> = {}): DisplayHandle {
  const found = display.handles?.(viewOf(display, params, { values })).find((h) => h.key === key)
  if (!found) throw new Error(`no handle ${key}`)
  return found
}

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

/** The height of a line through points at `x`: the point there, or between the two around it. */
function heightAt(points: readonly [number, number][], x: number): number {
  for (let i = 0; i < points.length; i++) {
    if (Math.abs(points[i][0] - x) < 1e-6) return points[i][1]
    if (i > 0 && points[i - 1][0] < x && points[i][0] > x) {
      const t = (x - points[i - 1][0]) / (points[i][0] - points[i - 1][0])
      return points[i - 1][1] + t * (points[i][1] - points[i - 1][1])
    }
  }
  throw new Error(`the line does not reach ${x}`)
}

/** The parts of a drawing: the line of one pass, the two shades, the dashed line, and what is in the second colour. */
function partsOf(drawn: RecordingContext) {
  const marks = marksOf(drawn)
  const long = (mark: Mark): boolean => mark.points.length > 20
  return {
    marks,
    one: marks.find((m) => m.kind === 'stroke' && m.colour === INK && !m.dashed && long(m)),
    four: marks.find(
      (m) => m.kind === 'fill' && m.colour === INK && m.alpha === STRENGTH.fill && long(m),
    ),
    sixteen: marks.find(
      (m) => m.kind === 'fill' && m.colour === INK && m.alpha === STRENGTH.back && long(m),
    ),
    ceiling: marks.find((m) => m.kind === 'stroke' && m.colour === INK && m.dashed && long(m)),
    accent: marks.filter((m) => m.colour === ACCENT),
    words: marks.filter((m) => m.kind === 'words').map((m) => m.words),
  }
}

/** A spectrum with one level everywhere but for one band that stands `over` dB above it. */
function spectrumOf(level: number, band = 40, over = 0): DisplaySignal {
  const signal = testSignal()
  const bins = new Float32Array(1024).fill(level)
  bins[band] = level + over
  return { ...signal, spectrum: bins }
}

/** The display running for a second on the same readings and sound. */
function running(options: FrameOptions = {}): RecordingContext {
  return runDisplay(display, params, 1, { meters, signal: testSignal(), ...options })
}

// --- The device's filters, sample by sample -----------------------------------

/** How much louder a filter leaves a sine of `hz`, in dB, once it has settled. */
function measuredDb(hz: number, filter: (x: number) => number, rate = RATE): number {
  // Long enough for the narrowest tone of the largest room to stop ringing in,
  // then a whole number of cycles.
  const settle = rate
  const count = Math.round((Math.max(1, Math.round(hz * 0.2)) * rate) / hz)
  let re = 0
  let im = 0
  for (let i = 0; i < settle + count; i++) {
    const phase = (2 * Math.PI * hz * i) / rate
    const y = filter(Math.sin(phase))
    if (i >= settle) {
      re += y * Math.cos(phase)
      im += y * Math.sin(phase)
    }
  }
  return 20 * Math.log10((2 * Math.hypot(re, im)) / count)
}

/** `kit::Svf::bandpass`: the band output times k, so the peak passes at 1. */
function svfBandpass(g: number, k: number): (x: number) => number {
  const a1 = 1 / (1 + g * (g + k))
  const a2 = g * a1
  const a3 = g * a2
  let ic1 = 0
  let ic2 = 0
  return (x) => {
    const v3 = x - ic2
    const v1 = a1 * ic1 + a2 * v3
    const v2 = ic2 + a2 * ic1 + a3 * v3
    ic1 = 2 * v1 - ic1
    ic2 = 2 * v2 - ic2
    return k * v1
  }
}

/** The room as `process()` runs it: the straight path and the eight band-passes beside it. */
function roomFilter(room: number, resonance: number, rate = RATE): (x: number) => number {
  const model = generationsRoom(room, resonance, rate)
  const bands = model.g.map((g) => svfBandpass(g, model.k))
  return (x) => bands.reduce((sum, band, n) => sum + model.gain[n] * band(x), model.direct * x)
}

describe('The room of Generations', () => {
  it('has its eight tones where room_hz() and kModeRatio put them', () => {
    expect([...GENERATIONS_TONES]).toEqual([1, 1.59, 2.03, 2.715, 3.18, 4.06, 4.934, 6.36])
    // kSmallRoomHz at Room 0, kLargeRoomHz at Room 1, and equal steps of pitch between.
    expect(generationsRoomHz(0)).toBeCloseTo(320, 9)
    expect(generationsRoomHz(1)).toBeCloseTo(70, 9)
    expect(generationsRoomHz(0.5)).toBeCloseTo(Math.sqrt(320 * 70), 9)
    // Every tone of every room is on the picture.
    expect(generationsRoomHz(1)).toBeGreaterThan(GENERATIONS_MIN_HZ)
    expect(generationsRoomHz(0) * 6.36).toBeLessThan(GENERATIONS_MAX_HZ)
  })

  it('passes each tone at 1 at any Room, Resonance and sample rate: peak_gains()', () => {
    for (const rate of [44100, 48000, 96000])
      for (const room of [0, 0.3, 0.5, 1])
        for (const resonance of [0.02, 0.1, 0.35, 0.8, 1]) {
          const model = generationsRoom(room, resonance, rate)
          for (const ratio of GENERATIONS_TONES) {
            const db = generationsRoomDb(model, generationsRoomHz(room) * ratio, rate)
            expect(Math.abs(db), `${rate} ${room} ${resonance} ${ratio}`).toBeLessThan(0.001)
          }
        }
  })

  it('tunes each tone by the sample rate and makes it as narrow as tune() does: kWideQ to kNarrowQ', () => {
    // Q 6 with no Resonance, 24 with all of it, and straight between.
    expect(generationsRoom(0.5, 0, RATE).k).toBeCloseTo(1 / 6, 9)
    expect(generationsRoom(0.5, 1, RATE).k).toBeCloseTo(1 / 24, 9)
    expect(generationsRoom(0.5, 0.35, RATE).k).toBeCloseTo(1 / (6 + 18 * 0.35), 9)
    // kit::Svf::set: the tangent of half the tone's angle at the sample rate.
    for (const rate of [44100, 96000]) {
      const model = generationsRoom(0.3, 0.5, rate)
      GENERATIONS_TONES.forEach((ratio, n) => {
        expect(model.g[n]).toBeCloseTo(
          Math.tan((Math.PI * generationsRoomHz(0.3) * ratio) / rate),
          9,
        )
      })
    }
  })

  it('leaves what lies between the tones under them by the contrast: kContrastDb', () => {
    expect(generationsContrastDb(0)).toBe(0)
    expect(generationsContrastDb(0.35)).toBeCloseTo(6.3, 9)
    expect(generationsContrastDb(1)).toBe(18)
    // The straight path alone, far above the highest tone of a large room.
    for (const resonance of [0.35, 1]) {
      const model = generationsRoom(1, resonance, RATE)
      expect(model.direct).toBeCloseTo(Math.pow(10, (-18 * resonance) / 20), 9)
      const far = generationsRoomDb(model, 20000, RATE)
      expect(far).toBeGreaterThan(-generationsContrastDb(resonance) - 0.5)
      expect(far).toBeLessThan(-generationsContrastDb(resonance) + 0.5)
    }
    // With no Resonance the room is the straight path: nothing is taken anywhere.
    const none = generationsRoom(0.5, 0, RATE)
    for (const hz of [60, 150, 400, 2000, 7000])
      expect(Math.abs(generationsRoomDb(none, hz, RATE))).toBeLessThan(1e-9)
    // Between two tones the room passes less than at either, and less the more Resonance.
    const between = Math.sqrt(2.03 * 2.715) * generationsRoomHz(0.5)
    const soft = generationsRoomDb(generationsRoom(0.5, 0.35, RATE), between, RATE)
    const hard = generationsRoomDb(generationsRoom(0.5, 1, RATE), between, RATE)
    expect(soft).toBeLessThan(-1)
    expect(hard).toBeLessThan(soft - 3)
  })

  it('answers every frequency as the filters themselves do, run sample by sample', () => {
    for (const [room, resonance] of [
      [0.5, 0.35],
      [1, 1],
    ]) {
      const model = generationsRoom(room, resonance, RATE)
      const low = generationsRoomHz(room)
      for (const hz of [60, low, low * Math.sqrt(2.03 * 2.715), low * 4.06, 5000]) {
        const measured = measuredDb(hz, roomFilter(room, resonance))
        expect(
          Math.abs(measured - generationsRoomDb(model, hz, RATE)),
          `Room ${room}, Resonance ${resonance}, ${hz} Hz`,
        ).toBeLessThan(0.02)
      }
    }
    // The tuning is by the sample rate, so the room is the same at 96 kHz.
    const hz = generationsRoomHz(0.3) * 1.59
    expect(Math.abs(measuredDb(hz, roomFilter(0.3, 0.7, 96000), 96000))).toBeLessThan(0.02)
  }, 60_000)

  it('takes highs with Damping as kit::OnePole does, and nothing at Damping 0', () => {
    // kOpenHz at the least, kDampedHz at the most.
    expect(generationsDampingHz(0)).toBeCloseTo(18000, 6)
    expect(generationsDampingHz(1)).toBeCloseTo(900, 6)
    expect(generationsDampingHz(0.5)).toBeCloseTo(Math.sqrt(18000 * 900), 6)
    for (const hz of [100, 4000, 12000]) expect(generationsDampingDb(0, hz, RATE)).toBe(0)
    for (const damping of [0.2, 0.6, 1]) {
      const a = Math.exp((-2 * Math.PI * generationsDampingHz(damping)) / RATE)
      for (const hz of [300, 1000, 4000]) {
        let state = 0
        const measured = measuredDb(hz, (x) => (state = x + (state - x) * a))
        expect(
          Math.abs(measured - generationsDampingDb(damping, hz, RATE)),
          `Damping ${damping} at ${hz} Hz`,
        ).toBeLessThan(0.02)
      }
    }
    // More Damping takes more.
    expect(generationsDampingDb(1, 4000, RATE)).toBeLessThan(
      generationsDampingDb(0.5, 4000, RATE) - 6,
    )
  })

  it('takes the lows under 12 Hz as kit::DcBlocker does: kLowCutHz', () => {
    const r = 1 - (2 * Math.PI * 12) / RATE
    for (const hz of [12, 50, 400]) {
      let x1 = 0
      let y1 = 0
      const measured = measuredDb(hz, (x) => {
        const y = x - x1 + r * y1
        x1 = x
        y1 = y
        return y
      })
      expect(Math.abs(measured - generationsLowCutDb(hz, RATE)), `${hz} Hz`).toBeLessThan(0.02)
    }
    expect(generationsLowCutDb(12, RATE)).toBeCloseTo(-3, 0)
    expect(Math.abs(generationsLowCutDb(400, RATE))).toBeLessThan(0.01)
  })

  it('is, for one pass, the low cut, Damping and the room one after the other', () => {
    const model = generationsRoom(0.5, 0.35, RATE)
    for (const hz of [70, 300, 3000])
      expect(generationsPassDb(model, 0.3, hz, RATE)).toBeCloseTo(
        generationsLowCutDb(hz, RATE) +
          generationsDampingDb(0.3, hz, RATE) +
          generationsRoomDb(model, hz, RATE),
        9,
      )
  })
})

describe('The picture of Generations', () => {
  it('puts a pass on the scale with its tones at the contrast, and so many passes that many times under', () => {
    // A tone passes whole however often: it stays at the top.
    expect(generationsShownDb(0, 1, 6.3)).toBeCloseTo(6.3, 9)
    expect(generationsShownDb(0, 16, 6.3)).toBeCloseTo(6.3, 9)
    // What the straight path alone carries is at 0 after one pass and sinks by the contrast on each.
    expect(generationsShownDb(-6.3, 1, 6.3)).toBeCloseTo(0, 9)
    expect(generationsShownDb(-6.3, 4, 6.3)).toBeCloseTo(-18.9, 9)
    expect([...GENERATIONS_PASSES]).toEqual([1, 4, 16])
  })

  it('draws one pass as the line and four and sixteen as the shades, each by the formula', () => {
    for (const values of [
      {},
      { room: 0.1, resonance: 0.9, damping: 0 },
      { room: 0.9, resonance: 0.15, damping: 1 },
    ] as Record<string, number>[]) {
      const room = values.room ?? params.room.default
      const resonance = values.resonance ?? params.resonance.default
      const damping = values.damping ?? params.damping.default
      const model = generationsRoom(room, resonance, RATE)
      const contrast = generationsContrastDb(resonance)
      const parts = partsOf(drawDisplay(display, params, { values, meters }))
      const lines = [parts.one, parts.four, parts.sixteen]
      // At a few places across, and on each tone itself.
      const places = [3, 20.5, 47, 80, 111.5].map(hzAtPixel)
      for (const ratio of GENERATIONS_TONES) places.push(generationsRoomHz(room) * ratio)
      for (const hz of places) {
        const pass = generationsPassDb(model, damping, hz, RATE)
        GENERATIONS_PASSES.forEach((passes, index) => {
          const shown = generationsShownDb(pass, passes, contrast)
          const line = lines[index]
          expect(line, `the shape of ${passes}`).toBeDefined()
          expect(
            heightAt(line?.points ?? [], xAt(hz)),
            `${JSON.stringify(values)}: ${passes} passes at ${hz.toFixed(0)} Hz`,
          ).toBeCloseTo(
            yAt(Math.min(GENERATIONS_TOP_DB + 24, Math.max(GENERATIONS_FOOT_DB - 24, shown))),
            6,
          )
        })
        // The dashed line is what Damping alone takes on a pass, laid on the tops.
        expect(heightAt(parts.ceiling?.points ?? [], xAt(hz))).toBeCloseTo(
          yAt(contrast + generationsDampingDb(damping, hz, RATE)),
          6,
        )
      }
    }
  })

  it('keeps the tops level and lets the valleys sink, pass after pass', () => {
    const parts = partsOf(drawDisplay(display, params, { values: { damping: 0 }, meters }))
    const low = generationsRoomHz(params.room.default)
    const contrast = generationsContrastDb(params.resonance.default)
    // On a tone the three shapes meet at the contrast, but for what the low
    // cut takes there: 0.01 dB a pass at 300 Hz, sixteen times.
    for (const ratio of [2.03, 4.06, 6.36]) {
      const x = xAt(low * ratio)
      for (const shape of [parts.one, parts.four, parts.sixteen])
        expect(Math.abs(heightAt(shape?.points ?? [], x) - yAt(contrast))).toBeLessThan(0.25)
    }
    // Under the lowest tone and over the highest each shape lies under the one before.
    for (const hz of [GENERATIONS_MIN_HZ, 4000]) {
      const x = xAt(hz)
      const one = heightAt(parts.one?.points ?? [], x)
      const four = heightAt(parts.four?.points ?? [], x)
      const sixteen = heightAt(parts.sixteen?.points ?? [], x)
      expect(four).toBeGreaterThan(one + 10)
      expect(sixteen).toBeGreaterThan(four + 10)
    }
    // The shades are filled from the foot of the picture, across its whole width.
    for (const shade of [parts.four, parts.sixteen]) {
      const corners = (shade?.points ?? []).slice(-2)
      expect(corners).toEqual([
        [box.x + box.w, foot],
        [box.x, foot],
      ])
    }
  })

  it('is one level line with no Resonance and no Damping: a pass is a copy', () => {
    const parts = partsOf(
      drawDisplay(display, params, { values: { resonance: 0, damping: 0 }, meters }),
    )
    // But for the low cut, which takes a hundredth of a dB a pass at 300 Hz.
    for (const shape of [parts.one, parts.four, parts.sixteen])
      for (const hz of [300, 1000, 6000])
        expect(Math.abs(heightAt(shape?.points ?? [], xAt(hz)) - yAt(0))).toBeLessThan(0.2)
  })

  it('numbers the shapes where they lie apart at the left, each number on a patch of the plate', () => {
    const drawn = drawDisplay(display, params, { meters })
    const parts = partsOf(drawn)
    expect(parts.words).toEqual(['1', '4'])
    const one = parts.marks.find((m) => m.words === '1')
    const four = parts.marks.find((m) => m.words === '4')
    // Each stands just over its own curve's left end.
    expect(one?.points[0][1]).toBeCloseTo((parts.one?.points[0][1] ?? 0) - 2, 6)
    expect(four?.points[0][1]).toBeCloseTo((parts.four?.points[0][1] ?? 0) - 2, 6)
    for (const words of ['1', '4']) {
      const at = parts.marks.findIndex((m) => m.words === words)
      expect(parts.marks[at - 1].kind).toBe('rect')
      expect(parts.marks[at - 1].colour).toBe(PLATE)
    }
    // The trace of what comes out crosses that corner when the sound has lows:
    // the numbers are put down after it, each on its patch, not struck through.
    const live = partsOf(
      running({ meters: { turn: 0.4, level: 0.2, hold: 2 }, signal: spectrumOf(-50, 4, 20) }),
    )
    const traced = live.marks.findIndex((m) => m.kind === 'stroke' && m.colour === ACCENT)
    expect(traced).toBeGreaterThan(-1)
    for (const words of ['1', '4'])
      expect(live.marks.findIndex((m) => m.words === words)).toBeGreaterThan(traced)
    // Where the shapes are one there is one number.
    const flat = partsOf(drawDisplay(display, params, { values: { resonance: 0 }, meters }))
    expect(flat.words).toEqual(['1'])
    // At full Resonance the second shape is off the foot at the left, and has no number.
    const steep = partsOf(drawDisplay(display, params, { values: { resonance: 1 }, meters }))
    expect(steep.words).toEqual(['1'])
  })

  it('lays the same picture out at the width of an opened plate', () => {
    const wide = { width: 204, height: 100 }
    const layout = generationsLayout(wide)
    expect(layout.box.w).toBe(196)
    const parts = partsOf(drawDisplay(display, params, { ...wide, meters }))
    const hz = generationsRoomHz(params.room.default) * 2.03
    const contrast = generationsContrastDb(params.resonance.default)
    const loss = generationsLowCutDb(hz, RATE) + generationsDampingDb(0.3, hz, RATE)
    expect(heightAt(parts.one?.points ?? [], xAt(hz, layout.box))).toBeCloseTo(
      yAt(contrast + loss, layout.box),
      2,
    )
    const handles = display.handles?.(viewOf(display, params, wide)) ?? []
    expect(handles.find((h) => h.key === 'tone')?.x).toBeCloseTo(xAt(hz, layout.box), 6)
    expect(handles.find((h) => h.key === 'damping')?.x).toBeCloseTo(
      xAt(GENERATIONS_DAMPING_AT_HZ, layout.box),
      6,
    )
  })
})

describe('The points of Generations', () => {
  it('has one on the third tone, at its top: across is Room, up is Resonance', () => {
    for (const [room, resonance] of [
      [0.5, 0.35],
      [0, 0],
      [1, 1],
      [0.25, 0.8],
    ]) {
      const point = handleOf('tone', { room, resonance })
      const hz = generationsRoomHz(room) * 2.03
      const loss = generationsLowCutDb(hz, RATE) + generationsDampingDb(0.3, hz, RATE)
      expect(point.x).toBeCloseTo(xAt(hz), 6)
      expect(point.y).toBeCloseTo(yAt(generationsContrastDb(resonance) + loss), 6)
      // Dragged from anywhere to where it stands for a setting, it sets that setting.
      const set = handleOf('tone', { room: 0.6, resonance: 0.1 }).drag(point.x, point.y)
      expect(set.room).toBeCloseTo(room, 6)
      expect(set.resonance).toBeCloseTo(resonance, 6)
    }
    // It is on the line of one pass.
    const parts = partsOf(drawDisplay(display, params, { meters }))
    const point = handleOf('tone')
    expect(heightAt(parts.one?.points ?? [], point.x)).toBeCloseTo(point.y, 2)
  })

  it('moves the room by the pitch it is dragged across, and stops at the ends of both ranges', () => {
    const point = handleOf('tone')
    // An octave to the left is a room whose tones are an octave lower.
    const octave = xAt(200) - xAt(100)
    const moved = point.drag(point.x - octave / 2, point.y)
    expect(generationsRoomHz(moved.room)).toBeCloseTo(generationsRoomHz(0.5) / Math.SQRT2, 6)
    expect(moved.resonance).toBeCloseTo(0.35, 2)
    expect(point.drag(-50, -50)).toEqual({ room: 1, resonance: 1 })
    const far = point.drag(size.width + 50, size.height + 50)
    expect(far.room).toBe(0)
    expect(far.resonance).toBe(0)
    expect(point.reset?.()).toEqual({ room: 0.5, resonance: 0.35 })
  })

  it('has one for Damping on the dashed line at 4 kHz: down is more', () => {
    for (const damping of [0, 0.1, 0.3, 0.75, 1])
      for (const resonance of [0, 0.35, 1]) {
        const point = handleOf('damping', { damping, resonance })
        expect(point.x).toBeCloseTo(xAt(GENERATIONS_DAMPING_AT_HZ), 6)
        expect(point.y).toBeCloseTo(
          yAt(generationsContrastDb(resonance) + generationsDampingDb(damping, 4000, RATE)),
          6,
        )
        const set = handleOf('damping', { damping: 0.5, resonance }).drag(point.x, point.y)
        expect(set.damping, `Damping ${damping} at Resonance ${resonance}`).toBeCloseTo(damping, 5)
        expect(Object.keys(set)).toEqual(['damping'])
      }
    const point = handleOf('damping')
    expect(point.drag(point.x, -50).damping).toBe(0)
    expect(point.drag(point.x, size.height + 50).damping).toBe(1)
    expect(point.drag(3, point.y).damping).toBeCloseTo(0.3, 5)
    expect(point.reset?.()).toEqual({ damping: 0.3 })
    // It is on the dashed line.
    const parts = partsOf(drawDisplay(display, params, { meters }))
    expect(heightAt(parts.ceiling?.points ?? [], point.x)).toBeCloseTo(point.y, 2)
  })

  it('draws both, and says what the one in hand is set to', () => {
    const rings = (drawn: RecordingContext): number =>
      drawn.calls.filter((call) => call.name === 'arc').length
    expect(rings(drawDisplay(display, params, { meters }))).toBe(2)
    const tone = drawDisplay(display, params, { meters, hot: 'tone', dragging: true })
    // The frequency said is where the point stands on the scale: the room's third tone.
    expect(tone.words()).toContain('304 Hz  +6.3 dB')
    for (const room of [0, 0.25, 0.5, 1]) {
      const at = handleOf('tone', { room })
      const said = drawDisplay(display, params, { meters, hot: 'tone', values: { room } }).words()
      const hz = `${Math.round(hzAtPixel(at.x - box.x))} Hz`
      expect(said.some((words) => words.startsWith(hz))).toBe(true)
    }
    const damping = drawDisplay(display, params, { meters, hot: 'damping' })
    expect(damping.words()).toContain('Damping 7.3 kHz')
    expect(
      drawDisplay(display, params, { meters, hot: 'damping', values: { damping: 0 } }).words(),
    ).toContain('Damping off')
    // The in-hand one is filled with the second colour.
    expect(partsOf(tone).accent.length).toBe(1)
  })
})

describe('Generations while it runs', () => {
  it('shows nothing in the second colour at rest', () => {
    expect(partsOf(drawDisplay(display, params, { meters })).accent).toEqual([])
    // Nor switched off, whatever the readings say.
    const busy = { turn: 0.4, level: 0.2, hold: 2 }
    expect(partsOf(running({ meters: busy, powered: false })).accent).toEqual([])
  })

  it('marks where the record head is in the loop, as tall as the loop is loud', () => {
    const mark = (turn: number, level: number): Mark | undefined =>
      partsOf(running({ meters: { turn, level, hold: 1 }, signal: spectrumOf(-200) })).accent.find(
        (m) => m.kind === 'rect',
      )
    for (const turn of [0, 0.25, 0.9]) {
      const drawn = mark(turn, 0.1)
      const middle = ((drawn?.points[0][0] ?? 0) + (drawn?.points[1][0] ?? 0)) / 2
      expect(middle).toBeCloseTo(track.x + turn * track.w, 6)
      // It stands on the line along the foot.
      expect(drawn?.points[1][1]).toBeCloseTo(track.y + 1, 6)
    }
    const tall = (m: Mark | undefined): number => (m?.points[1][1] ?? 0) - (m?.points[0][1] ?? 0)
    // −10 dBFS and over is the tallest, −60 and under the shortest.
    expect(tall(mark(0.5, 0.32))).toBeCloseTo(7, 6)
    expect(tall(mark(0.5, 0.001))).toBeCloseTo(3, 6)
    expect(tall(mark(0.5, 0.01))).toBeCloseTo(3 + 4 * (20 / 50), 4)
    // An empty loop has no place in it: the device reads −1.
    expect(mark(-1, 0)).toBeUndefined()
  })

  it('hangs a bar from the tops as long as what a pass still takes: the level hold', () => {
    const bars = (hold: number, values: Record<string, number> = {}): Mark[] =>
      partsOf(
        running({ meters: { turn: 0.5, level: 0.1, hold }, values, signal: spectrumOf(-200) }),
      ).accent.filter((m) => m.kind === 'rect' && m.points[0][0] > box.x + box.w / 2 + 10)
    const contrast = generationsContrastDb(params.resonance.default)
    // The hold gives back 6 dB: a pass takes 6 dB.
    const [bar] = bars(2)
    expect(bar.points[0][1]).toBeCloseTo(yAt(contrast), 6)
    expect(bar.points[1][1]).toBeCloseTo(yAt(contrast - 20 * Math.log10(2)), 6)
    expect(bar.points[1][0]).toBeLessThanOrEqual(box.x + box.w)
    // It follows the tops as Resonance moves them.
    expect(bars(2, { resonance: 1 })[0].points[0][1]).toBeCloseTo(yAt(18), 6)
    // The most the hold gives is 18 dB (kMostHold): the bar stays in the picture.
    expect(bars(8, { resonance: 1 })[0].points[1][1]).toBeCloseTo(yAt(18 - 20 * Math.log10(8)), 6)
    expect(bars(8, { resonance: 0 })[0].points[1][1]).toBeLessThanOrEqual(foot + 1e-9)
    // Nothing is taken once only the room's tones are left, and nothing from an empty loop.
    expect(bars(1)).toEqual([])
    expect(
      partsOf(running({ meters: { turn: -1, level: 0, hold: 2 }, signal: spectrumOf(-200) }))
        .accent,
    ).toEqual([])
  })

  it('traces what comes out with its strongest part level with the tops', () => {
    const contrast = generationsContrastDb(params.resonance.default)
    // One band 20 dB over the rest, at 40 bins of 23.4 Hz.
    const drawn = partsOf(running({ meters, signal: spectrumOf(-50, 40, 20) }))
    const line = drawn.accent.find((m) => m.kind === 'stroke')
    const heights = (line?.points ?? []).map(([, y]) => y)
    expect(Math.min(...heights)).toBeCloseTo(yAt(contrast), 4)
    // The rest lies 20 dB under it, on the picture's own scale.
    expect(Math.max(...heights)).toBeCloseTo(yAt(contrast - 20), 4)
    const peakAt = (line?.points ?? []).find(([, y]) => Math.abs(y - yAt(contrast)) < 1e-3)
    expect(Math.abs((peakAt?.[0] ?? 0) - xAt((40 * 48000) / 2048))).toBeLessThan(2)
    // However loud the sound is, the shape stands in the same place.
    const quiet = partsOf(running({ meters, signal: spectrumOf(-80, 40, 20) }))
    const quietLine = quiet.accent.find((m) => m.kind === 'stroke')?.points ?? []
    expect(quietLine.length).toBe(line?.points.length)
    quietLine.forEach(([x, y], index) => {
      expect(x).toBeCloseTo(line?.points[index][0] ?? 0, 6)
      expect(y).toBeCloseTo(line?.points[index][1] ?? 0, 6)
    })
    // Silence is not traced.
    expect(
      partsOf(running({ meters, signal: spectrumOf(-200) })).accent.filter(
        (m) => m.kind === 'stroke',
      ),
    ).toEqual([])
  })

  it('draws the room at work only while Mix lets the loop be heard', () => {
    const busy = { turn: 0.4, level: 0.2, hold: 2 }
    const accent = (values: Record<string, number>): number =>
      partsOf(running({ meters: busy, values })).accent.length
    expect(accent({})).toBeGreaterThan(0)
    expect(accent({ mix: 0.02 })).toBeGreaterThan(0)
    expect(accent({ mix: 0 })).toBe(0)
    expect(display.params).toContain('mix')
    // At rest too: no shades of what the passes would do, and no numbers.
    const none = partsOf(drawDisplay(display, params, { meters, values: { mix: 0 } }))
    expect(none.four).toBeUndefined()
    expect(none.sixteen).toBeUndefined()
    expect(none.words).toEqual([])
    // The room's own line, the dashed one and both points stay.
    expect(none.one).toBeDefined()
    expect(none.ceiling).toBeDefined()
    const rings = drawDisplay(display, params, { meters, values: { mix: 0 } }).calls.filter(
      (call) => call.name === 'arc',
    )
    expect(rings.length).toBe(2)
    // Running with the loop out of the mix is the picture of a plate that is not played.
    expect(running({ meters: busy, values: { mix: 0 } }).print()).toBe(
      drawDisplay(display, params, { meters, values: { mix: 0 } }).print(),
    )
    expect(drawDisplay(display, params, { meters, values: { mix: 0.02 } }).print()).toBe(
      drawDisplay(display, params, { meters }).print(),
    )
  })
})
