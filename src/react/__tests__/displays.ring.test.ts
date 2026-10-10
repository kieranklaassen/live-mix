// The truth of Ring's display: every mark against a number worked out here
// from the device's own formula (`cpp/devices/ring/ring.h`, `ring_waves.h`),
// at the size a strip has on a plate at rest (184 by 48) and at the other
// shapes a plate hands it. Where the native harness measured the device
// (`cpp/test/ring_test.cpp`), its figures are held here too.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { PLAIN_COLOURS } from '../components/display-kit'
import { RING_FACES } from '../components/displays/ring'
import {
  type DisplayHandle,
  type DisplayHold,
  type DisplaySignal,
} from '../components/plate-display'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const { ink, accent } = PLAIN_COLOURS
const { display } = RING_FACES.ring
const descriptor = stockDescriptors().get('ring')
if (!descriptor) throw new Error('no stock device ring')
const params: Readonly<Record<string, ParamSpec>> = descriptor.params

// --- The device's own numbers, copied from its headers -----------------------

// ring.h: kFirstGain, kSecondGain, kSecondRatio (the fifth is 700 cents), kDriftCents, kBandLimit.
const FIRST_GAIN = 0.8
const SECOND_GAIN = 0.6
const FIFTH = 1.49830708
const DRIFT_CENTS = 50
const BAND_LIMIT = 1 / 6
// ring_waves.h: Waves::kLimit, Waves::kSoft, Diode::kForward, Diode::kKnee.
const LIMITS = [1, 3, 5, 7, 11, 15, 23, 31, 47, 63, 95, 127]
const SOFT = 0.3
const FORWARD = 0.3
const KNEE = 0.12
const RATE = 48000

/** ring.h, `Ring::note_hz`: kit::midi_to_hz(12 · (octave + 1) + root), A4 at 440 Hz. */
const noteHz = (root: number, octave: number): number =>
  440 * 2 ** ((12 * (octave + 1) + root - 69) / 12)
const C4 = noteHz(0, 4)

/** kit::Svf at Q √½ is a Butterworth second order: |H|² = 1 / (1 + r⁴), r the ratio of the warped frequencies. */
const warp = (hz: number): number => Math.tan((Math.PI * hz) / RATE)
const lowPass = (hz: number, cut: number): number => 1 / Math.sqrt(1 + (warp(hz) / warp(cut)) ** 4)
const highPass = (hz: number, cut: number): number => {
  const r = warp(hz) / warp(cut)
  return (r * r) / Math.sqrt(1 + r ** 4)
}
const db = (gain: number): number => 20 * Math.log10(gain)

/** ring_waves.h, `Waves::ideal`: Triangle, Soft square and the diode bridge's gate, by number as Wave has them. */
function shape(wave: number, phase: number): number {
  const s = Math.sin(2 * Math.PI * phase)
  if (wave === 1) {
    const p = phase - Math.floor(phase)
    return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4
  }
  if (wave === 2) return s / Math.sqrt(s * s + SOFT * SOFT)
  return (
    0.5 *
    ((s - FORWARD) / Math.sqrt((s - FORWARD) ** 2 + KNEE * KNEE) +
      (s + FORWARD) / Math.sqrt((s + FORWARD) ** 2 + KNEE * KNEE))
  )
}

/**
 * The height of each harmonic of a shape, as `Waves::build` leaves it: the
 * sine series over the odd harmonics up to 127, scaled to a root mean square
 * of one. Summed here over twice as many points as the device takes, which
 * moves a mark by less than a ten thousandth of a pixel.
 */
function seriesOf(wave: number): number[] {
  if (wave === 0) return [0, Math.SQRT2, 0, 0, 0, 0, 0, 0]
  const points = 8192
  const harmonics: number[] = new Array<number>(128).fill(0)
  let power = 0
  for (let n = 1; n <= 127; n += 2) {
    let sum = 0
    for (let i = 0; i < points; i++)
      sum += shape(wave, i / points) * Math.sin((2 * Math.PI * n * i) / points)
    harmonics[n] = (2 * sum) / points
    power += 0.5 * harmonics[n] ** 2
  }
  return harmonics.map((height) => height / Math.sqrt(power))
}

// --- The picture's scales at 184 by 48 ---------------------------------------
//
// The marks stand from x 6 over 126 px, 15 Hz to 20 kHz in equal octaves, on
// y 35, and the top of the 48 dB of level is y 6. The cents of the drift are
// 18 px either way of x 158 for 50 cents, on y 32.

interface Scales {
  x: number
  w: number
  top: number
  base: number
}
const STRIP: Scales = { x: 6, w: 126, top: 6, base: 35 }
const OCTAVES = Math.log2(20000 / 15)
const xOn = (scales: Scales, hz: number): number =>
  scales.x + (Math.log2(hz / 15) / OCTAVES) * scales.w
const yOn = (scales: Scales, level: number): number =>
  scales.top + (Math.min(48, Math.max(0, -level)) / 48) * (scales.base - scales.top)
const xOf = (hz: number): number => xOn(STRIP, hz)
const yOf = (level: number): number => yOn(STRIP, level)
/** A line one pixel wide is drawn on the middle of the pixel it falls in. */
const onPixel = (x: number): number => Math.floor(x) + 0.5

/** Everything set so that only what a test moves shows: one sine carrier, the cuts wide open, the ring alone. */
const plain = {
  root: 0,
  octave: 4,
  fine: 0,
  tune: 0,
  wave: 0,
  second: 0,
  drift: 0,
  lowCut: 20,
  tone: 16000,
  mix: 1,
}
/** The example at rest: four partials of 220 Hz, each as far under the first as its number. */
const EXAMPLE = [1, 2, 3, 4].map((n) => ({ hz: 220 * n, level: db(1 / n) }))

// --- What was drawn, read back from the calls --------------------------------

interface Line {
  points: [number, number][]
  arcs: number
  colour: string
  width: number
  alpha: number
  dashed: boolean
}
interface Picture {
  lines: Line[]
  words: { words: string; x: number; y: number }[]
}

function pictureOf(drawn: RecordingContext): Picture {
  const picture: Picture = { lines: [], words: [] }
  let alpha = 1
  let stroke = ''
  let width = 1
  let dashed = false
  let points: [number, number][] = []
  let arcs = 0
  for (const { name, args } of drawn.calls) {
    const n = args as number[]
    if (name === 'set globalAlpha') alpha = n[0]
    else if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set lineWidth') width = n[0]
    else if (name === 'setLineDash') dashed = (args[0] as number[]).length > 0
    else if (name === 'beginPath') {
      points = []
      arcs = 0
    } else if (name === 'moveTo' || name === 'lineTo') points.push([n[0], n[1]])
    else if (name === 'arc') arcs += 1
    else if (name === 'stroke')
      picture.lines.push({ points: [...points], arcs, colour: stroke, width, alpha, dashed })
    else if (name === 'fillText') picture.words.push({ words: String(args[0]), x: n[1], y: n[2] })
  }
  return picture
}

interface Upright {
  x: number
  top: number
  foot: number
  alpha: number
}

/** The upright lines of one colour and width, left to right: the solid ones, or with `dashed` the dashed. */
function uprights(picture: Picture, colour: string, width: number, dashed = false): Upright[] {
  return picture.lines
    .filter(
      (line) =>
        line.colour === colour &&
        line.width === width &&
        line.dashed === dashed &&
        line.arcs === 0 &&
        line.points.length === 2 &&
        line.points[0][0] === line.points[1][0],
    )
    .map((line) => ({
      x: line.points[0][0],
      top: Math.min(line.points[0][1], line.points[1][1]),
      foot: Math.max(line.points[0][1], line.points[1][1]),
      alpha: line.alpha,
    }))
    .sort((one, other) => one.x - other.x)
}

/** The mark standing at `x`, or a failure that says which were there. */
function at(marks: Upright[], x: number): Upright {
  const found = marks.find((mark) => Math.abs(mark.x - x) < 0.01)
  if (!found)
    throw new Error(`no mark at ${x.toFixed(2)}: ${marks.map((m) => m.x.toFixed(2)).join(' ')}`)
  return found
}

const sent = (values: Record<string, number>, options: FrameOptions = {}): Picture =>
  pictureOf(drawDisplay(display, params, { ...options, values: { ...plain, ...values } }))

/** The parts of the picture, by how each is drawn. */
const were = (picture: Picture, base = 35): Upright[] =>
  uprights(picture, ink, 1, true).filter((mark) => mark.foot === base)
const dry = (picture: Picture, base = 35): Upright[] =>
  uprights(picture, ink, 1).filter((mark) => mark.foot === base && mark.alpha === 0.5)
const firstPairs = (picture: Picture, base = 35): Upright[] =>
  uprights(picture, ink, 1.5).filter((mark) => mark.foot === base && mark.alpha === 1)
const secondPairs = (picture: Picture): Upright[] =>
  uprights(picture, ink, 1).filter((mark) => mark.foot === 35 && mark.alpha === 0.8)
const harmonicPairs = (picture: Picture): Upright[] =>
  uprights(picture, ink, 1).filter((mark) => mark.foot === 35 && mark.alpha === 0.4)
/** The carriers' lines: the fundamentals a pixel and a half wide, the harmonics of the shape one. */
const carriers = (picture: Picture, base = 35): Upright[] =>
  uprights(picture, accent, 1.5).filter((mark) => mark.foot === base)
const carrierHarmonics = (picture: Picture): Upright[] =>
  uprights(picture, accent, 1).filter((mark) => mark.foot === 35)

function handleOf(key: string, options: FrameOptions = {}): DisplayHandle {
  const all = display.handles?.(viewOf(display, params, options)) ?? []
  const handle = all.find((point) => point.key === key)
  if (!handle) throw new Error(`ring has no handle ${key}`)
  return handle
}

/** A window of sound as the taps hand it over: sines of so many cycles in the window, each so tall. */
function waveOf(parts: readonly (readonly [number, number])[]): Float32Array {
  const wave = new Float32Array(2048)
  for (let i = 0; i < wave.length; i++)
    for (const [cycles, peak] of parts)
      wave[i] += peak * Math.sin((2 * Math.PI * cycles * i) / wave.length)
  return wave
}

/** The sound at the device: `wave` going in, and a spectrum coming out that is silent but for the bins given. */
function signalOf(wave: Float32Array, bins: Readonly<Record<number, number>> = {}): DisplaySignal {
  const spectrum = new Float32Array(1024).fill(-160)
  for (const [bin, level] of Object.entries(bins)) spectrum[Number(bin)] = level
  let peak = 0
  for (const sample of wave) if (Math.abs(sample) > peak) peak = Math.abs(sample)
  const level = { peak, rms: peak / Math.SQRT2, wave }
  return { input: level, output: level, spectrum, binHz: RATE / 2048, left: null, right: null }
}

// --- The spectrum as it is made ----------------------------------------------

describe('the ring display', () => {
  it('reads Root, Octave, Fine, Tune and Frequency as the device does: the carrier is the note', () => {
    // ring.h: 440 · 2^((12 · (Octave + 1) + Root − 69) / 12). A4 is 440 Hz, middle C 261.63 Hz.
    expect(C4).toBeCloseTo(261.6256, 3)
    expect(noteHz(9, 4)).toBe(440)
    for (const [root, octave] of [
      [0, 4],
      [9, 4],
      [0, 0],
      [11, 7],
      [6, 2],
      [3, 6],
    ]) {
      const [line] = carriers(sent({ root, octave }))
      expect(line.x).toBeCloseTo(xOf(noteHz(root, octave)), 9)
      // A sine alone: its one line reaches the top of the scale.
      expect(line.top).toBeCloseTo(6, 9)
    }
    // Fine is cents on the note: 100 of them are the next semitone.
    expect(carriers(sent({ fine: 100 }))[0].x).toBeCloseTo(xOf(noteHz(1, 4)), 9)
    expect(carriers(sent({ fine: -50 }))[0].x).toBeCloseTo(xOf(C4 * 2 ** (-50 / 1200)), 9)
    // Free: Frequency, and Fine still on it.
    expect(carriers(sent({ tune: 1, frequency: 1000 }))[0].x).toBeCloseTo(xOf(1000), 9)
    expect(carriers(sent({ tune: 1, frequency: 1000, fine: 100 }))[0].x).toBeCloseTo(
      xOf(1000 * 2 ** (1 / 12)),
      9,
    )
    // Root and Octave are not read on Free, nor Frequency on Note.
    expect(carriers(sent({ tune: 1, frequency: 1000, root: 7, octave: 2 }))[0].x).toBeCloseTo(
      xOf(1000),
      9,
    )
    expect(carriers(sent({ frequency: 1000 }))[0].x).toBeCloseTo(xOf(C4), 9)
  })

  it('shows an example at rest: four partials of one tone, dashed where they went in', () => {
    const marks = were(sent({}))
    expect(marks.map((mark) => mark.x)).toEqual(EXAMPLE.map(({ hz }) => onPixel(xOf(hz))))
    marks.forEach((mark, n) => expect(mark.top).toBeCloseTo(yOf(EXAMPLE[n].level), 9))
    // 48 dB of level over 29 px: the second partial, 6.02 dB under the first, stands 3.64 px lower.
    expect(marks[1].top - marks[0].top).toBeCloseTo((6.0206 / 48) * 29, 3)
  })

  it('sends every partial to a sum and a difference at √½ of its height, and leaves nothing where it was', () => {
    // wet = in · √2 sin: a partial at f comes out at c + f and |c − f|, each
    // at √2 / 2 of it (the harness: 1440 and 560 Hz at 0.3536 for 0.5 in at
    // 440 against 1000, the input's own frequency 147 dB under).
    const picture = sent({})
    const pairs = firstPairs(picture)
    expect(pairs).toHaveLength(8)
    for (const { hz, level } of EXAMPLE) {
      for (const to of [C4 + hz, Math.abs(C4 - hz)]) {
        const through = Math.SQRT1_2 * highPass(to, 20) * lowPass(to, 16000)
        expect(at(pairs, xOf(to)).top).toBeCloseTo(yOf(level + db(through)), 6)
      }
    }
    // The first partial, 220 Hz against 261.63: 41.63 and 481.63 Hz.
    expect(pairs[0].x).toBeCloseTo(xOf(41.6256), 3)
    expect(at(pairs, xOf(481.6256)).top).toBeCloseTo(yOf(-3.0103), 2)
    // With the ring alone in the mix nothing of a partial is left where it went in.
    expect(dry(picture)).toEqual([])
    // A difference under the scale's low end has no mark: 230 − 220 is 10 Hz.
    const low = firstPairs(sent({ tune: 1, frequency: 230 }))
    expect(low).toHaveLength(7)
    expect(low[0].x).toBeCloseTo(xOf(440 - 230), 9)
  })

  it('adds a second carrier at its interval, the two at 0.8 and 0.6', () => {
    // ring.h: kFirstGain 0.8, kSecondGain 0.6, kSecondRatio a fifth (700 cents), an octave, an octave below.
    expect(FIRST_GAIN ** 2 + SECOND_GAIN ** 2).toBeCloseTo(1, 12)
    expect(FIFTH).toBeCloseTo(2 ** (700 / 1200), 7)
    for (const [second, ratio] of [
      [1, FIFTH],
      [2, 2],
      [3, 0.5],
    ]) {
      const picture = sent({ second })
      const lines = carriers(picture)
      expect(lines).toHaveLength(2)
      expect(at(lines, xOf(C4)).top).toBeCloseTo(yOf(db(FIRST_GAIN)), 9)
      expect(at(lines, xOf(C4 * ratio)).top).toBeCloseTo(yOf(db(SECOND_GAIN)), 9)
      const first = firstPairs(picture)
      const added = secondPairs(picture)
      expect(first).toHaveLength(8)
      expect(added).toHaveLength(8)
      for (const { hz, level } of EXAMPLE) {
        const one = C4 + hz
        expect(at(first, xOf(one)).top).toBeCloseTo(
          yOf(level + db(FIRST_GAIN * Math.SQRT1_2 * highPass(one, 20) * lowPass(one, 16000))),
          6,
        )
        const other = Math.abs(C4 * ratio - hz)
        expect(at(added, onPixel(xOf(other))).top).toBeCloseTo(
          yOf(level + db(SECOND_GAIN * Math.SQRT1_2 * highPass(other, 20) * lowPass(other, 16000))),
          6,
        )
      }
    }
    // Off: one carrier at its whole height, and no second pairs.
    const off = sent({})
    expect(carriers(off)).toHaveLength(1)
    expect(secondPairs(off)).toEqual([])
  })

  it('gives the carrier the harmonics of its shape, each as tall as the series has it', () => {
    // The harness measured the third harmonic of each shape under its first:
    // Triangle −19.1 dB (1 / 9), Soft square −12.6 dB, Diode −14.3 dB.
    const measured = [0, -19.1, -12.6, -14.3]
    for (const wave of [1, 2, 3]) {
      const series = seriesOf(wave)
      expect(db(Math.abs(series[3] / series[1]))).toBeCloseTo(measured[wave], 1)
      const picture = sent({ wave })
      const [first] = carriers(picture)
      // A line as tall as the harmonic is, against a sine alone (√2).
      expect(first.x).toBeCloseTo(xOf(C4), 9)
      expect(first.top).toBeCloseTo(yOf(db(Math.abs(series[1]) / Math.SQRT2)), 4)
      const lines = carrierHarmonics(picture)
      expect(lines.map((line) => line.x)).toEqual([3, 5, 7].map((n) => xOf(n * C4)))
      lines.forEach((line, k) => {
        const n = 3 + 2 * k
        expect(line.top).toBeCloseTo(yOf(db(Math.abs(series[n]) / Math.SQRT2)), 4)
      })
      // The loudest partial against each harmonic: a pair at n·c ± f, half the harmonic's height each.
      const pairs = harmonicPairs(picture)
      for (const n of [3, 5, 7]) {
        for (const to of [n * C4 + 220, n * C4 - 220]) {
          const level = db(0.5 * Math.abs(series[n]) * highPass(to, 20) * lowPass(to, 16000))
          if (level > -48) expect(at(pairs, onPixel(xOf(to))).top).toBeCloseTo(yOf(level), 4)
        }
      }
      // The pairs around the carrier itself are as tall as its first harmonic makes them.
      expect(at(firstPairs(picture), xOf(C4 + 220)).top).toBeCloseTo(
        yOf(db(0.5 * Math.abs(series[1]) * lowPass(C4 + 220, 16000) * highPass(C4 + 220, 20))),
        4,
      )
    }
    // A sine has one line and no pairs higher up.
    expect(carrierHarmonics(sent({}))).toEqual([])
    expect(harmonicPairs(sent({}))).toEqual([])
  })

  it('cuts the harmonics off under a sixth of the sample rate, as the device chooses its tables', () => {
    // ring.h `choose_cut`: room = (rate / 6) / carrier. The table whose limit
    // is the highest under it is blended in over the one below. At 1 kHz the
    // room is 8: the fifth whole, the seventh (8 − 7) / (11 − 7) = a quarter,
    // as the harness measured. At 2 kHz it is 4: the third at (4 − 3) / (5 − 3)
    // = a half. At 3 kHz it is 2.67 and only the sine of the shape is left.
    expect((RATE * BAND_LIMIT) / 1000).toBe(8)
    const room = (hz: number): number => (RATE * BAND_LIMIT) / hz
    const quarter = (room(1000) - LIMITS[3]) / (LIMITS[4] - LIMITS[3])
    const half = (room(2000) - LIMITS[1]) / (LIMITS[2] - LIMITS[1])
    expect([quarter, half]).toEqual([0.25, 0.5])
    expect(room(3000)).toBeLessThan(LIMITS[1])
    const series = seriesOf(1)
    const top = (n: number, share: number): number =>
      yOf(db((share * Math.abs(series[n])) / Math.SQRT2))
    const at1k = carrierHarmonics(sent({ wave: 1, tune: 1, frequency: 1000 }))
    expect(at1k.map((line) => line.x)).toEqual([3000, 5000, 7000].map(xOf))
    expect(at1k[0].top).toBeCloseTo(top(3, 1), 4)
    expect(at1k[1].top).toBeCloseTo(top(5, 1), 4)
    expect(at1k[2].top).toBeCloseTo(top(7, quarter), 4)
    const at2k = carrierHarmonics(sent({ wave: 1, tune: 1, frequency: 2000 }))
    expect(at2k.map((line) => line.x)).toEqual([xOf(6000)])
    expect(at2k[0].top).toBeCloseTo(top(3, half), 4)
    expect(carrierHarmonics(sent({ wave: 1, tune: 1, frequency: 3000 }))).toEqual([])
    // The fundamental is never cut.
    expect(carriers(sent({ wave: 1, tune: 1, frequency: 4000 }))[0].top).toBeCloseTo(top(1, 1), 4)
  })

  it('draws what Low Cut and Tone leave of the ringing sound, and takes it off every pair', () => {
    const cuts = { lowCut: 200, tone: 2000 }
    const picture = sent(cuts)
    // The curve: both Butterworth cuts, the top of the scale all of the sound.
    const curve = picture.lines.find((line) => line.colour === ink && line.points.length > 20)
    if (!curve) throw new Error('no curve')
    expect(curve.points).toHaveLength(64)
    expect(curve.points[0][0]).toBe(6)
    expect(curve.points[63][0]).toBeCloseTo(132, 9)
    for (const [x, y] of curve.points) {
      const hz = 15 * 2 ** (((x - 6) / 126) * OCTAVES)
      expect(y).toBeCloseTo(yOf(db(highPass(hz, 200) * lowPass(hz, 2000))), 6)
    }
    // Second order: 3 dB down at the corner, 12.3 dB an octave past it.
    expect(db(highPass(200, 200))).toBeCloseTo(-3.0103, 3)
    expect(db(highPass(100, 200))).toBeCloseTo(-12.3, 1)
    expect(db(lowPass(4000, 2000))).toBeCloseTo(-12.6, 1)
    // The pairs go through it: the sum of the fourth partial, 1141.6 Hz, and the difference of the first, 41.6 Hz.
    const pairs = firstPairs(picture)
    const high = C4 + 880
    expect(at(pairs, xOf(high)).top).toBeCloseTo(
      yOf(db(0.25) + db(Math.SQRT1_2 * highPass(high, 200) * lowPass(high, 2000))),
      6,
    )
    const low = 41.6256
    expect(db(highPass(low, 200))).toBeCloseTo(-27.3, 1)
    expect(at(pairs, xOf(low)).top).toBeCloseTo(yOf(-3.0103 + db(highPass(low, 200))), 3)
    // A pair the cuts take under the foot of the scale is not drawn: the same difference under a low cut at 1 kHz.
    expect(db(Math.SQRT1_2 * highPass(low, 1000))).toBeLessThan(-48)
    expect(firstPairs(sent({ lowCut: 1000 })).map((mark) => mark.x)).not.toContain(xOf(low))
    // The dry sound is not touched by them.
    const mixed = sent({ ...cuts, mix: 0 })
    dry(mixed).forEach((mark, n) => expect(mark.top).toBeCloseTo(yOf(EXAMPLE[n].level), 9))
  })

  it('draws only what Mix lets be heard, and goes on reading the device with none of it in the mix', () => {
    // kit::equal_power: the dry sound at cos, the ringing at sin of Mix quarter turns.
    const half = sent({ mix: 0.5 })
    dry(half).forEach((mark, n) => {
      expect(mark.x).toBe(onPixel(xOf(EXAMPLE[n].hz)))
      expect(mark.top).toBeCloseTo(yOf(EXAMPLE[n].level - 3.0103), 3)
    })
    expect(at(firstPairs(half), xOf(C4 + 220)).top).toBeCloseTo(
      yOf(db(Math.sin(Math.PI / 4) * Math.SQRT1_2 * lowPass(C4 + 220, 16000))),
      4,
    )
    const less = sent({ mix: 0.25 })
    expect(dry(less)[0].top).toBeCloseTo(yOf(db(Math.cos(Math.PI / 8))), 6)
    expect(at(firstPairs(less), xOf(C4 + 220)).top).toBeCloseTo(
      yOf(db(Math.sin(Math.PI / 8) * Math.SQRT1_2 * lowPass(C4 + 220, 16000))),
      4,
    )
    // None of it: the partials stand whole where they went in and nothing is made of them.
    const unheard: Record<string, number>[] = [{ mix: 0 }, { mix: 0, wave: 2, second: 1 }]
    for (const values of unheard) {
      const none = sent(values)
      expect(firstPairs(none)).toEqual([])
      expect(secondPairs(none)).toEqual([])
      expect(harmonicPairs(none)).toEqual([])
      dry(none).forEach((mark, n) => expect(mark.top).toBeCloseTo(yOf(EXAMPLE[n].level), 9))
      // Nothing is in the second colour: the carrier is a setting, drawn in the ink where it is set.
      expect(none.lines.filter((line) => line.colour === accent)).toEqual([])
      const set = uprights(none, ink, 1.5).filter((mark) => mark.alpha === 0.5)
      expect(set[0].x).toBeCloseTo(xOf(C4), 9)
    }
    // The handles stay, and still set what they stand for.
    const options = { values: { ...plain, mix: 0 } }
    expect(handleOf('carrier', options).x).toBeCloseTo(xOf(C4), 9)
    expect(handleOf('carrier', options).drag(xOf(noteHz(0, 6)), 20)).toEqual({ octave: 6 })
    expect(handleOf('tone', options).drag(xOf(3000), 9).tone).toBeCloseTo(3000, 6)
  })

  it('names the carrier and the notes of the scale', () => {
    const words = (values: Record<string, number>): string[] =>
      sent(values).words.map((word) => word.words)
    expect(words({})).toEqual(expect.arrayContaining(['C4', '262 Hz']))
    // The root in every octave on the scale, every other one named at this width, the carrier's own among them.
    expect(words({}).filter((word) => /^C\d+$/.test(word))).toEqual([
      'C0',
      'C2',
      'C4',
      'C6',
      'C8',
      'C10',
      'C4',
    ])
    const scale = sent({ root: 9, octave: 3 })
    expect(scale.words.map((word) => word.words).filter((word) => /^A\d+$/.test(word))).toEqual([
      'A1',
      'A3',
      'A5',
      'A7',
      'A9',
      'A3',
    ])
    for (const octave of [1, 3, 5, 7, 9]) {
      const tick = scale.words.find((word) => word.words === `A${octave}`)
      expect(tick?.x).toBeCloseTo(xOf(noteHz(9, octave)), 9)
    }
    expect(words({ root: 9 })).toEqual(expect.arrayContaining(['A4', '440 Hz']))
    expect(words({ fine: 35 })).toContain('C4 +35')
    expect(words({ fine: -100 })).toEqual(expect.arrayContaining(['C4 −100', '247 Hz']))
    // Free: a scale in hertz, and the carrier in figures a slow one can be read in.
    expect(words({ tune: 1, frequency: 2.5 })).toEqual(
      expect.arrayContaining(['Free', '2.50 Hz', '100', '1k', '10k']),
    )
    expect(words({ tune: 1, frequency: 13 })).toContain('13.0 Hz')
    expect(words({ tune: 1, frequency: 3100 })).toContain('3.1 kHz')
    expect(words({ tune: 1, frequency: 6 }).some((word) => /^C\d/.test(word))).toBe(false)
  })
})

// --- Handles -----------------------------------------------------------------

describe('the handles of the ring display', () => {
  it('moves the carrier to the octave of the root under the hand, and by semitones with the wheel', () => {
    const handle = handleOf('carrier', { values: plain })
    expect(handle.x).toBeCloseTo(xOf(C4), 9)
    expect(handle.y).toBeCloseTo(20.5, 9)
    for (let octave = 0; octave <= 7; octave++) {
      expect(handle.drag(xOf(noteHz(0, octave)), 20)).toEqual({ octave })
      // The octave set is the one whose line then stands under the hand.
      const moved = handleOf('carrier', { values: { ...plain, octave } })
      expect(moved.x).toBeCloseTo(xOf(noteHz(0, octave)), 9)
    }
    // Nearer one octave than the next: a little under half an octave either way stays.
    expect(handle.drag(xOf(C4 * 2 ** 0.45), 20)).toEqual({ octave: 4 })
    expect(handle.drag(xOf(C4 * 2 ** 0.55), 20)).toEqual({ octave: 5 })
    expect(handle.drag(xOf(C4 * 2 ** -0.55), 20)).toEqual({ octave: 3 })
    // Past the ends of the range it stays at them.
    expect(handle.drag(-40, 20)).toEqual({ octave: 0 })
    expect(handle.drag(184, 20)).toEqual({ octave: 7 })
    // The root and Fine stay as they are: the octaves of A, a quarter tone sharp.
    const bent = handleOf('carrier', { values: { ...plain, root: 9, fine: 50 } })
    expect(bent.x).toBeCloseTo(xOf(440 * 2 ** (50 / 1200)), 9)
    expect(bent.drag(bent.x, bent.y)).toEqual({ octave: 4 })
    expect(bent.drag(xOf(110 * 2 ** (50 / 1200)), 20)).toEqual({ octave: 2 })
    // The wheel: a semitone a step, over the octave's end too.
    expect(handle.wheel?.(1)).toEqual({ root: 1, octave: 4 })
    expect(handle.wheel?.(-1)).toEqual({ root: 11, octave: 3 })
    expect(handleOf('carrier', { values: { ...plain, root: 11 } }).wheel?.(1)).toEqual({
      root: 0,
      octave: 5,
    })
    expect(handleOf('carrier', { values: { ...plain, octave: 0 } }).wheel?.(-1)).toEqual({
      root: 0,
      octave: 0,
    })
    expect(handleOf('carrier', { values: { ...plain, root: 11, octave: 7 } }).wheel?.(1)).toEqual({
      root: 11,
      octave: 7,
    })
    expect(handle.reset?.()).toEqual({ octave: 4 })
  })

  it('sets Frequency on Free: drag there, value there', () => {
    const free = { ...plain, tune: 1, frequency: 62 }
    const handle = handleOf('carrier', { values: free })
    expect(handle.x).toBeCloseTo(xOf(62), 9)
    expect(handle.drag(handle.x, handle.y)).toEqual({ frequency: 62 })
    for (const hz of [20, 77.7, 440, 3100]) {
      const set = handle.drag(xOf(hz), 20).frequency
      expect(set).toBeCloseTo(hz, 6)
      expect(handleOf('carrier', { values: { ...free, frequency: set } }).x).toBeCloseTo(xOf(hz), 6)
    }
    // Fine is on top of it: the line stands a semitone above Frequency and is solved for that.
    const bent = handleOf('carrier', { values: { ...free, fine: 100 } })
    expect(bent.x).toBeCloseTo(xOf(62 * 2 ** (1 / 12)), 9)
    expect(bent.drag(xOf(1000), 20).frequency).toBeCloseTo(1000 / 2 ** (1 / 12), 6)
    // The range's ends.
    expect(handle.drag(xOf(19000), 20)).toEqual({ frequency: 4000 })
    expect(handle.wheel?.(12).frequency).toBeCloseTo(124, 9)
    expect(handle.wheel?.(-1).frequency).toBeCloseTo(62 / 2 ** (1 / 12), 9)
    expect(handle.reset?.()).toEqual({ frequency: 6 })
  })

  it('waits at the edge for a carrier slower than the scale, and is moved from where the setting lies', () => {
    // 2.5 Hz lies 2.58 octaves left of the scale's 15 Hz: 31.4 px past the edge at x 6.
    const slow = { ...plain, tune: 1, frequency: 2.5 }
    const handle = handleOf('carrier', { values: slow })
    expect(handle.x).toBe(6)
    const past = (Math.log2(15 / 2.5) / OCTAVES) * 126
    expect(past).toBeCloseTo(31.4, 1)
    // Taken and not moved it stays; moved 10 px it goes up by 10 px of the scale, not to the edge's 15 Hz.
    const hold: DisplayHold = {}
    expect(handle.drag(6, handle.y, hold)).toEqual({ frequency: 2.5 })
    const perPx = OCTAVES / 126
    const first = handle.drag(16, handle.y, hold).frequency
    expect(first).toBeCloseTo(2.5 * 2 ** (10 * perPx), 9)
    // The plate asks for the handles again at every move: the same hold carries the press.
    const again = handleOf('carrier', { values: { ...slow, frequency: first } })
    expect(again.x).toBe(6)
    expect(again.drag(26, again.y, hold).frequency).toBeCloseTo(2.5 * 2 ** (20 * perPx), 9)
    expect(again.drag(16, again.y, hold).frequency).toBeCloseTo(first, 9)
    // Far enough and the line comes onto the scale, under the hand less what it lay past.
    const on = again.drag(6 + past + 12, again.y, hold).frequency
    expect(on).toBeCloseTo(15 * 2 ** (12 * perPx), 9)
    expect(handleOf('carrier', { values: { ...slow, frequency: on } }).x).toBeCloseTo(18, 9)
    // The picture has the line at the edge too.
    expect(carriers(sent(slow))[0].x).toBe(6)
  })

  it('stands the two cuts on the curve at their corners: drag there, value there', () => {
    const cuts = { ...plain, lowCut: 200, tone: 2000 }
    const low = handleOf('lowCut', { values: cuts })
    const tone = handleOf('tone', { values: cuts })
    expect(low.x).toBeCloseTo(xOf(200), 9)
    expect(low.y).toBeCloseTo(yOf(db(highPass(200, 200) * lowPass(200, 2000))), 6)
    expect(tone.x).toBeCloseTo(xOf(2000), 9)
    expect(tone.y).toBeCloseTo(yOf(db(highPass(2000, 200) * lowPass(2000, 2000))), 6)
    // 3 dB under the top, where the other cut takes nothing: 1.8 px.
    expect(low.y).toBeCloseTo(6 + (3.0103 / 48) * 29, 2)
    for (const hz of [20, 60, 500, 2000]) {
      const set = low.drag(xOf(hz), 9).lowCut
      expect(set).toBeCloseTo(hz, 6)
      expect(handleOf('lowCut', { values: { ...cuts, lowCut: set } }).x).toBeCloseTo(xOf(hz), 6)
    }
    for (const hz of [300, 900, 7000, 16000]) expect(tone.drag(xOf(hz), 9).tone).toBeCloseTo(hz, 6)
    // Past its range a cut stays at the end of it.
    expect(low.drag(xOf(9000), 9)).toEqual({ lowCut: 2000 })
    expect(low.drag(0, 9)).toEqual({ lowCut: 20 })
    expect(tone.drag(xOf(40), 9)).toEqual({ tone: 300 })
    expect(tone.drag(184, 9)).toEqual({ tone: 16000 })
    expect(low.drag(low.x, low.y)).toEqual({ lowCut: 200 })
    expect(low.reset?.()).toEqual({ lowCut: 60 })
    expect(tone.reset?.()).toEqual({ tone: 7000 })
    // Crossed, each stands low on what the other leaves.
    const crossed = handleOf('tone', { values: { ...plain, lowCut: 2000, tone: 300 } })
    expect(crossed.y).toBeCloseTo(yOf(db(highPass(300, 2000) * lowPass(300, 300))), 6)
  })
})

// --- What is live -------------------------------------------------------------

describe('the ring display while it runs', () => {
  /** A sine of half of full scale at 375 Hz, bin 16 of the window. */
  const tone = waveOf([[16, 0.5]])
  const reading = (hz: number): Record<string, number> => ({ carrier: hz })

  it('stands the carrier where the device says it is, and shows how far it leans in cents', () => {
    // ring.h: the meter is the first carrier's frequency with the glide and the drift on it.
    const sharp = C4 * 2 ** (20 / 1200)
    const running = pictureOf(
      drawDisplay(display, params, {
        values: { ...plain, drift: 1 },
        meters: reading(sharp),
        signal: signalOf(tone),
      }),
    )
    expect(carriers(running)[0].x).toBeCloseTo(xOf(sharp), 9)
    // 18 px for 50 cents either way of x 158: 20 cents sharp is 7.2 px right.
    const lean = uprights(running, accent, 2)
    expect(lean).toHaveLength(1)
    expect(lean[0].x).toBeCloseTo(158 + (20 / DRIFT_CENTS) * 18, 6)
    expect([lean[0].top, lean[0].foot]).toEqual([28, 36])
    // The pairs are worked out from the carrier as it is set: the drift is the line's, not the picture's.
    expect(at(firstPairs(running), xOf(C4 + 375)).top).toBeGreaterThan(0)
    // Flat, and past the scale's end.
    const flat = (hz: number): number =>
      uprights(
        pictureOf(
          drawDisplay(display, params, {
            values: { ...plain, drift: 1 },
            meters: reading(hz),
            signal: signalOf(tone),
          }),
        ),
        accent,
        2,
      )[0].x
    expect(flat(C4 * 2 ** (-35 / 1200))).toBeCloseTo(158 - (35 / DRIFT_CENTS) * 18, 6)
    expect(flat(C4 * 2)).toBeCloseTo(158 + 18, 9)
    // At rest, and switched off, the line stands on the pitch that is set and the mark in the middle.
    for (const options of [
      { meters: reading(sharp) },
      { meters: reading(sharp), signal: signalOf(tone), powered: false },
      { meters: reading(0), signal: signalOf(tone) },
    ]) {
      const still = pictureOf(drawDisplay(display, params, { values: plain, ...options }))
      expect(carriers(still)[0].x).toBeCloseTo(xOf(C4), 9)
      expect(uprights(still, accent, 2)[0].x).toBe(158)
    }
  })

  it('draws how far Drift lets the carrier lean: 50 cents at the top, by the square of the control', () => {
    // ring.h: drift_.set(value · value), kDriftCents 50.
    const bar = (drift: number): Line | undefined =>
      sent({ drift }).lines.find((line) => line.colour === ink && line.width === 3)
    for (const [drift, reach] of [
      [1, 18],
      [0.5, 4.5],
      [0.25, 18 / 16],
    ]) {
      const points = bar(drift)?.points ?? []
      expect(points.map(([, y]) => y)).toEqual([32, 32])
      expect(points[0][0]).toBeCloseTo(158 - reach, 9)
      expect(points[1][0]).toBeCloseTo(158 + reach, 9)
    }
    expect(bar(0)).toBeUndefined()
  })

  it('reads the partials of the sound going in, on the scale of what comes out', () => {
    // One sine: one partial, where it is, and the scale hangs from it.
    const one = pictureOf(
      drawDisplay(display, params, { values: plain, meters: reading(C4), signal: signalOf(tone) }),
    )
    const went = were(one)
    expect(went).toHaveLength(1)
    expect(went[0].x).toBe(onPixel(xOf(375)))
    expect(went[0].top).toBeCloseTo(6, 6)
    // Its sum and its difference: 636.6 and 113.4 Hz, 3 dB under it.
    const pairs = firstPairs(one)
    expect(pairs).toHaveLength(2)
    expect(pairs[0].x).toBeCloseTo(xOf(375 - C4), 2)
    expect(pairs[1].x).toBeCloseTo(xOf(375 + C4), 2)
    expect(pairs[1].top).toBeCloseTo(yOf(-3.0103), 2)
    // The level is read as the analyser reads it (a Blackman window, the
    // transform's size taken out): half of full scale is 0.5 · 0.42 / 2, at
    // −19.58 dB. A peak coming out 10 dB over that takes the top of the
    // scale, and the partial stands 10 dB under it.
    expect(db((0.5 * 0.42) / 2)).toBeCloseTo(-19.58, 2)
    const under = pictureOf(
      drawDisplay(display, params, {
        values: plain,
        meters: reading(C4),
        signal: signalOf(tone, { 300: -9.58 }),
      }),
    )
    expect(were(under)[0].top).toBeCloseTo(yOf(-10), 2)
    // Two partials, the second between two bins and half as tall: 944.5 Hz, 6 dB under.
    const two = pictureOf(
      drawDisplay(display, params, {
        values: plain,
        meters: reading(C4),
        signal: signalOf(
          waveOf([
            [16, 0.5],
            [40.3, 0.25],
          ]),
        ),
      }),
    )
    const both = were(two)
    expect(both).toHaveLength(2)
    expect(Math.abs(both[1].x - xOf(40.3 * (RATE / 2048)))).toBeLessThan(0.6)
    expect(both[1].top).toBeCloseTo(yOf(-6.02), 0)
    expect(firstPairs(two)).toHaveLength(4)
  })

  it('goes back to the example in silence, when switched off, and for a sound that is not a number', () => {
    const example = EXAMPLE.map(({ hz }) => onPixel(xOf(hz)))
    const silent = signalOf(new Float32Array(2048))
    const quiet = runDisplay(display, params, 0.3, {
      values: plain,
      meters: reading(C4),
      signal: silent,
    })
    expect(were(pictureOf(quiet)).map((mark) => mark.x)).toEqual(example)
    const off = drawDisplay(display, params, {
      values: plain,
      meters: reading(C4),
      signal: signalOf(tone),
      powered: false,
    })
    expect(were(pictureOf(off)).map((mark) => mark.x)).toEqual(example)
    const broken = signalOf(new Float32Array(2048).fill(Number.NaN))
    const drawn = drawDisplay(display, params, {
      values: plain,
      meters: reading(C4),
      signal: broken,
    })
    expect(drawn.numbers().every(({ value }) => Number.isFinite(value))).toBe(true)
    expect(were(pictureOf(drawn)).map((mark) => mark.x)).toEqual(example)
  })
})

// --- The other shapes of a plate ----------------------------------------------

describe('the ring display at the sizes a plate hands it', () => {
  it('lays out from its size: the strip under four knobs, and an upright plate 204 by 100', () => {
    // 224 by 48: the marks over 158 px from x 6, the foot on y 35.
    const wide: Scales = { x: 6, w: 158, top: 6, base: 35 }
    const strip = pictureOf(drawDisplay(display, params, { values: plain, width: 224, height: 48 }))
    expect(carriers(strip)[0].x).toBeCloseTo(xOn(wide, C4), 9)
    expect(were(strip).map((mark) => mark.x)).toEqual(
      EXAMPLE.map(({ hz }) => onPixel(xOn(wide, hz))),
    )
    expect(at(firstPairs(strip), xOn(wide, C4 + 220)).top).toBeCloseTo(
      yOn(wide, db(Math.SQRT1_2 * lowPass(C4 + 220, 16000))),
      4,
    )
    // 204 by 100: the scale is the whole width, 192 px, from y 20 to the foot on y 87; the words stand in a row over it.
    const tall: Scales = { x: 6, w: 192, top: 20, base: 87 }
    const upright = pictureOf(
      drawDisplay(display, params, { values: plain, width: 204, height: 100 }),
    )
    expect(carriers(upright, 87)[0].x).toBeCloseTo(xOn(tall, C4), 9)
    expect(carriers(upright, 87)[0].top).toBeCloseTo(20, 9)
    const marks = were(upright, 87)
    expect(marks.map((mark) => mark.x)).toEqual(EXAMPLE.map(({ hz }) => onPixel(xOn(tall, hz))))
    marks.forEach((mark, n) => expect(mark.top).toBeCloseTo(yOn(tall, EXAMPLE[n].level), 9))
    expect(at(firstPairs(upright, 87), xOn(tall, C4 + 220)).top).toBeCloseTo(
      yOn(tall, db(Math.SQRT1_2 * lowPass(C4 + 220, 16000))),
      4,
    )
    expect(upright.words.map((word) => word.words)).toContain('C4  262 Hz')
    // Every octave of the root has room for its name there.
    expect(upright.words.filter((word) => /^C\d+$/.test(word.words))).toHaveLength(11)
    // The handles are laid out by the same scales.
    const view = viewOf(display, params, { values: plain, width: 204, height: 100 })
    const handles = display.handles?.(view) ?? []
    const carrier = handles.find((point) => point.key === 'carrier')
    expect(carrier?.x).toBeCloseTo(xOn(tall, C4), 9)
    expect(carrier?.y).toBeCloseTo(53.5, 9)
    expect(carrier?.drag(xOn(tall, noteHz(0, 2)), 50)).toEqual({ octave: 2 })
    const tone = handles.find((point) => point.key === 'tone')
    expect(tone?.x).toBeCloseTo(xOn(tall, 16000), 9)
    expect(tone?.drag(xOn(tall, 5000), 30).tone).toBeCloseTo(5000, 6)
  })
})
