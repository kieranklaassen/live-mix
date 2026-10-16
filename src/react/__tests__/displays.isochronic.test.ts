// The display of Isochronic: its arithmetic held to the device's (the compiled
// module is rendered at 48 kHz and what each ear is let through is compared,
// a sample at a time, with what the display draws), what it draws, and that
// nothing on it moves in time with the pulse.

import { describe, expect, it } from 'vitest'

import { ISOCHRONIC_PARAMS } from '../../dsp/devices/isochronic.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, fillRect, ground } from '../components/display-kit'
import {
  ISOCHRONIC_FACES,
  ISOCHRONIC_LEVEL_SEC,
  ISOCHRONIC_NOISE_RMS,
  ISOCHRONIC_PERIODS,
  isochronicAttack,
  isochronicEars,
  isochronicLanePoints,
  isochronicLayout,
  isochronicMix,
  isochronicNoisePoints,
  isochronicOpen,
  isochronicPeriodText,
  isochronicPulse,
  isochronicRate,
  isochronicRateText,
  isochronicRelease,
  isochronicTimeText,
  isochronicWave,
  type IsochronicPulse,
} from '../components/displays/isochronic'
import {
  plateDisplay,
  type DisplayLevel,
  type DisplayNote,
  type DisplaySignal,
  type PlateDisplay,
} from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  type DrawnPath,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const display = ISOCHRONIC_FACES.isochronic.display

type Values = Readonly<Record<string, number>>

const valueOf = (values: Values, name: string): number =>
  values[name] ?? ISOCHRONIC_PARAMS[name as keyof typeof ISOCHRONIC_PARAMS].default

/** The pulse the display draws at these settings, with no glide. */
const pulseOf = (values: Values = {}): IsochronicPulse =>
  isochronicPulse(
    valueOf(values, 'rate'),
    valueOf(values, 'duty'),
    valueOf(values, 'edge'),
    valueOf(values, 'depth'),
    valueOf(values, 'offset'),
  )

const wrap = (cycles: number): number => cycles - Math.floor(cycles)

async function deviceAt(values: Values): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('isochronic', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(ISOCHRONIC_PARAMS[name as keyof typeof ISOCHRONIC_PARAMS], value)
  return device
}

interface Sides {
  left: Float32Array
  right: Float32Array
}

/** What the device puts out over `seconds`, a sample at a time: its two sides. */
function render(device: WasmDeviceHarness, seconds: number): Sides {
  const total = Math.round(seconds * RATE)
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  const silence = new Float32Array(128)
  for (let done = 0; done < total; done += 128) {
    const frames = Math.min(128, total - done)
    device.processBlock(silence.subarray(0, frames))
    left.set(device.view(device.device.device_out_left(), frames), done)
    right.set(device.view(device.device.device_out_right(), frames), done)
  }
  return { left, right }
}

function strike(device: WasmDeviceHarness, hz: number, id = 1): void {
  const on = device.device.device_note_on
  if (!on) throw new Error('the device takes no notes')
  on(id, hz, 1)
}

function reading(device: WasmDeviceHarness): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(0)
}

/** One key held from the first sample on, with a quick attack and a pure tone unless told otherwise. */
async function held(values: Values, seconds: number, hz = 997): Promise<Sides> {
  const device = await deviceAt({ attack: 0.005, warmth: 0, ...values })
  strike(device, hz)
  return render(device, seconds)
}

/**
 * What the pulse lets through in each ear, a sample at a time: the sound with
 * the pulse over the same sound with Depth at 0, where the device lets all of
 * it through. Near the tone's own zero crossings there is nothing to divide
 * by: those samples are not a number, and `carried` puts the one before in
 * their place.
 */
async function letThrough(values: Values, seconds: number): Promise<Sides> {
  const pulsed = await held(values, seconds)
  const plain = await held({ ...values, depth: 0 }, seconds)
  const share = (out: Float32Array, whole: Float32Array): Float32Array => {
    const gain = new Float32Array(out.length)
    for (let n = 0; n < out.length; n++)
      gain[n] = Math.abs(whole[n]) > 0.02 ? out[n] / whole[n] : NaN
    return gain
  }
  return { left: share(pulsed.left, plain.left), right: share(pulsed.right, plain.right) }
}

function carried(gain: Float32Array): Float32Array {
  const whole = new Float32Array(gain.length)
  for (let n = 0; n < gain.length; n++)
    whole[n] = Number.isNaN(gain[n]) ? (n > 0 ? whole[n - 1] : 0) : gain[n]
  return whole
}

/** The largest size of a signal over `[from, to)` samples. */
function peakOver(signal: Float32Array, from: number, to: number): number {
  let peak = 0
  for (let n = from; n < to; n++) peak = Math.max(peak, Math.abs(signal[n]))
  return peak
}

function rmsOver(signal: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let n = from; n < to; n++) sum += signal[n] * signal[n]
  return Math.sqrt(sum / (to - from))
}

describe('the arithmetic of the Isochronic display against the device', () => {
  // Rate, Duty, Edge, Depth and Offset at their ends and between: an edge the
  // device holds to half the on time, one it holds to half the gap, a gap
  // that is not silent, and the right ear from a little to half a period late.
  const SETTINGS: [string, Values][] = [
    ['its defaults', {}],
    ['the slowest Rate with a soft edge', { rate: 0.5, duty: 0.35, edge: 50, offset: 90 }],
    ['six a second, part Depth', { rate: 6, duty: 0.4, edge: 20, depth: 0.55, offset: 120 }],
    ['forty a second, the edge held', { rate: 40, duty: 0.5, edge: 50, offset: 180 }],
    ['forty short clicks', { rate: 40, duty: 0.2, edge: 2, offset: 60 }],
    ['long pulses, short gaps', { rate: 14, duty: 0.9, edge: 8, depth: 0.8, offset: 30 }],
    ['short blips, little Depth', { rate: 3, duty: 0.1, edge: 50, depth: 0.3 }],
  ]

  it.each(SETTINGS)(
    'lets through what the device lets through in each ear, a sample at a time: %s',
    async (_what, values) => {
      const rate = valueOf(values, 'rate')
      const pulse = pulseOf(values)
      const period = RATE / rate
      // From the third period on: the right ear waits for its first gap after the key.
      const from = Math.ceil(2 * period)
      const to = Math.ceil(3.5 * period)
      const heard = await letThrough(values, to / RATE + 0.01)
      let worst = 0
      let moves = 0
      let compared = 0
      for (let n = from; n < to; n++) {
        const [left, right] = isochronicEars(wrap((n * rate) / RATE), pulse)
        moves = Math.max(moves, Math.abs(left - right))
        if (Number.isNaN(heard.left[n]) || Number.isNaN(heard.right[n])) continue
        worst = Math.max(worst, Math.abs(heard.left[n] - left), Math.abs(heard.right[n] - right))
        compared += 1
      }
      // Every sample but the few where the tone itself crosses zero.
      expect(compared).toBeGreaterThan(0.85 * (to - from))
      expect(worst).toBeLessThan(0.002)
      // And the test is of something: with an Offset the two ears differ.
      if (valueOf(values, 'offset') > 0) expect(moves).toBeGreaterThan(0.2)
    },
  )

  it('holds Edge to half the shorter of the on time and the gap, as the device does', () => {
    // At 40 a second and half Duty no edge is longer than 6.25 ms: a quarter of the period.
    expect(isochronicPulse(40, 0.5, 50, 1, 0).edge).toBeCloseTo(0.25, 9)
    expect(isochronicPulse(40, 0.2, 50, 1, 0).edge).toBeCloseTo(0.1, 9)
    expect(isochronicPulse(14, 0.9, 50, 1, 0).edge).toBeCloseTo(0.05, 9)
    // Under that it is the time asked for.
    expect(isochronicPulse(10, 0.5, 8, 1, 0).edge).toBeCloseTo(0.08, 9)
    // On for Duty of the period between the half heights of its two edges.
    const pulse = isochronicPulse(10, 0.4, 20, 1, 0)
    expect(isochronicOpen(pulse.edge / 2, pulse)).toBeCloseTo(0.5, 9)
    expect(isochronicOpen(pulse.duty + pulse.edge / 2, pulse)).toBeCloseTo(0.5, 9)
    expect(isochronicOpen(0, pulse)).toBe(0)
    expect(isochronicOpen(0.3, pulse)).toBe(1)
    expect(isochronicOpen(0.9, pulse)).toBe(0)
  })

  it('leaves in the gap what Depth leaves: nothing at full, all of it at none', () => {
    expect(isochronicPulse(10, 0.5, 8, 1, 0).floor).toBe(0)
    expect(isochronicPulse(10, 0.5, 8, 0, 0).floor).toBe(1)
    expect(isochronicPulse(10, 0.5, 8, 0.5, 0).floor).toBeCloseTo(0.25, 12)
    expect(isochronicEars(0.75, isochronicPulse(10, 0.5, 8, 0.5, 0))).toEqual([0.25, 0.25])
  })

  it('writes the rate the device pulses at, at the place of the glide the device reports', async () => {
    // Twenty a second down to five over three seconds.
    const glide = { rate: 20, target: 5, glide: 0.05, attack: 0.005, warmth: 0 }
    const seconds = glide.glide * 60
    const device = await deviceAt(glide)
    expect(reading(device)).toBe(0)
    strike(device, 997)
    render(device, 1.5)
    // Half way through its time the device says so, and the rate there is the ratio's middle.
    expect(reading(device)).toBeCloseTo(0.5, 3)
    expect(isochronicRate(20, 5, glide.glide, 0.5)).toBeCloseTo(10, 9)
    render(device, 1.7)
    expect(reading(device)).toBe(1)

    // The pulses themselves: each rise through half height, and the rate from one to the next.
    const heard = carried((await letThrough(glide, 4)).left)
    const rises: number[] = []
    for (let n = 1; n < heard.length; n++) if (heard[n - 1] < 0.5 && heard[n] >= 0.5) rises.push(n)
    expect(rises.length).toBeGreaterThan(25)
    let compared = 0
    for (let i = 1; i < rises.length; i++) {
      const measured = RATE / (rises[i] - rises[i - 1])
      const middle = (rises[i] + rises[i - 1]) / 2 / RATE
      const drawn = isochronicRate(20, 5, glide.glide, middle / seconds)
      expect(Math.abs(measured / drawn - 1), `the pulse at ${middle.toFixed(2)} s`).toBeLessThan(
        0.01,
      )
      compared += 1
    }
    expect(compared).toBeGreaterThan(25)
    // Past its time it holds at the Target; with Glide at 0 it stays at the Rate.
    expect(RATE / (rises[rises.length - 1] - rises[rises.length - 2])).toBeCloseTo(5, 1)
    expect(isochronicRate(20, 5, 0, 0.5)).toBe(20)
    expect(isochronicRate(20, 5, glide.glide, 7)).toBe(5)
  })

  it('draws one cycle of the tone as the device makes it at any Warmth', async () => {
    // A key of 240 Hz is 200 samples a cycle, from its zero crossing at the first sample.
    const from = RATE / 2
    const pure = (await held({ depth: 0 }, 0.6, 240)).left
    const size = peakOver(pure, from, from + 200)
    for (const warmth of [0.3, 0.65, 1]) {
      const warm = (await held({ depth: 0, warmth }, 0.6, 240)).left
      let worst = 0
      for (let n = from; n < from + 400; n++)
        worst = Math.max(worst, Math.abs(warm[n] / size - isochronicWave(wrap(n / 200), warmth)))
      expect(worst, `Warmth ${warmth}`).toBeLessThan(0.003)
      // Scaled so its peak is the sine's, as the display draws it.
      expect(peakOver(warm, from, from + 200) / size).toBeGreaterThan(0.99)
      expect(peakOver(warm, from, from + 200) / size).toBeLessThan(1.001)
    }
    expect(isochronicWave(0.25, 0)).toBeCloseTo(1, 12)
  })

  it('gives the tone and the noise the shares Air gives them', async () => {
    const from = RATE / 2
    const to = 5 * RATE
    const tone = (await held({ depth: 0 }, 5, 240)).left
    const size = peakOver(tone, from, from + 200)
    // All noise: its RMS is half the tone's peak (`kNoiseRms`), the same in both ears.
    const noise = await held({ depth: 0, air: 1 }, 5, 240)
    expect(rmsOver(noise.left, from, to) / size / ISOCHRONIC_NOISE_RMS).toBeGreaterThan(0.85)
    expect(rmsOver(noise.left, from, to) / size / ISOCHRONIC_NOISE_RMS).toBeLessThan(1.15)
    expect(Array.from(noise.right)).toEqual(Array.from(noise.left))
    // Half way their powers add.
    const half = (await held({ depth: 0, air: 0.5 }, 5, 240)).left
    const mix = isochronicMix(0.5)
    const expected = Math.hypot(mix.tone * Math.SQRT1_2, mix.noise * ISOCHRONIC_NOISE_RMS)
    expect(rmsOver(half, from, to) / size / expected).toBeGreaterThan(0.9)
    expect(rmsOver(half, from, to) / size / expected).toBeLessThan(1.1)
    expect(isochronicMix(0)).toEqual({ tone: 1, noise: 0 })
    expect(isochronicMix(1)).toEqual({ tone: 0, noise: 1 })
  })

  it("draws a key's rise and fall as the device's envelope goes", async () => {
    const plain = (await held({ depth: 0 }, 0.6, 240)).left
    const size = peakOver(plain, RATE / 2, RATE / 2 + 200)
    // Half way through an Attack of half a second.
    const slow = (await held({ depth: 0, attack: 0.5 }, 1, 240)).left
    const at = 0.25 * RATE
    expect(peakOver(slow, at - 100, at + 100) / size / isochronicAttack(0.5)).toBeGreaterThan(0.97)
    expect(peakOver(slow, at - 100, at + 100) / size / isochronicAttack(0.5)).toBeLessThan(1.03)
    expect(isochronicAttack(0)).toBe(0)
    expect(isochronicAttack(1)).toBe(1)
    // Half way through a Release of a second.
    const device = await deviceAt({ depth: 0, attack: 0.005, warmth: 0, release: 1 })
    strike(device, 240)
    render(device, 0.5)
    device.device.device_note_off?.(1)
    const fall = render(device, 0.6).left
    const half = 0.5 * RATE
    expect(peakOver(fall, half - 100, half + 100) / size / isochronicRelease(0.5)).toBeGreaterThan(
      0.9,
    )
    expect(peakOver(fall, half - 100, half + 100) / size / isochronicRelease(0.5)).toBeLessThan(1.1)
    expect(isochronicRelease(0)).toBe(1)
    expect(isochronicRelease(1)).toBeCloseTo(0.001, 6)
  })
})

// --- What is drawn ---------------------------------------------------------------

const INK_COLOUR = PLAIN_COLOURS.ink
const ACCENT_COLOUR = PLAIN_COLOURS.accent

/** The two lanes: the lines drawn 1.25 wide, the left ear's first. */
function lanesOf(drawn: RecordingContext): [DrawnPath, DrawnPath] {
  const lines = drawnPaths(drawn).filter((path) => path.kind === 'stroke' && path.width === 1.25)
  expect(lines).toHaveLength(2)
  return [lines[0], lines[1]]
}

/** How high a line through `points` stands at `x`. */
function heightAt(points: readonly [number, number][], x: number): number {
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    if (x >= x0 && x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return NaN
}

/** Every dot drawn: where it stands. */
function dotsOf(drawn: RecordingContext): { x: number; y: number }[] {
  return drawn.calls
    .filter((call) => call.name === 'arc')
    .map((call) => ({ x: call.args[0] as number, y: call.args[1] as number }))
}

/** How wide the lit part of the level's bar is; 0 when none is lit. */
function litLevel(drawn: RecordingContext): number {
  let fill = ''
  let wide = 0
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'fillRect' && fill === ACCENT_COLOUR) wide = call.args[2] as number
  }
  return wide
}

/** The lines drawn in the accent: a key that is held, and one that is falling. */
const litLines = (drawn: RecordingContext): DrawnPath[] =>
  drawnPaths(drawn).filter((path) => path.kind === 'stroke' && path.colour === ACCENT_COLOUR)

function levelOf(samples: Float32Array): DisplayLevel {
  let peak = 0
  let sum = 0
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample))
    sum += sample * sample
  }
  return { peak, rms: Math.sqrt(sum / samples.length), wave: samples }
}

/**
 * The sound as the plate's taps read it at `time`: the 2048 samples before
 * it, a tone under the pulse of each ear, so the level read on one frame is
 * not the level read on the next.
 */
function pulsedSignal(
  time: number,
  rate: number,
  pulse: IsochronicPulse,
  size = 0.25,
): DisplaySignal {
  const left = new Float32Array(2048)
  const right = new Float32Array(2048)
  const both = new Float32Array(2048)
  for (let i = 0; i < 2048; i++) {
    const at = time - (2048 - i) / RATE
    const [l, r] = isochronicEars(wrap(at * rate), pulse)
    const tone = size * Math.sin(2 * Math.PI * 220 * at)
    left[i] = l * tone
    right[i] = r * tone
    both[i] = 0.5 * (left[i] + right[i])
  }
  return {
    input: null,
    output: levelOf(both),
    spectrum: null,
    binHz: RATE / 2048,
    left: levelOf(left),
    right: levelOf(right),
  }
}

const FPS = 30

/** A display run as the plate runs it, frame after frame on one state: every frame's drawing. */
function framesOf(
  shown: PlateDisplay,
  seconds: number,
  options: FrameOptions = {},
  each?: (time: number) => Partial<FrameOptions>,
): RecordingContext[] {
  const state: unknown = shown.init?.()
  const frames: RecordingContext[] = []
  for (let n = 0; n < Math.round(seconds * FPS); n++) {
    const time = n / FPS
    frames.push(
      drawDisplay(shown, ISOCHRONIC_PARAMS, {
        ...options,
        ...each?.(time),
        state,
        now: 10 + time,
        dt: n === 0 ? 0 : 1 / FPS,
      }),
    )
  }
  return frames
}

/**
 * How much a run of frames flickers: the most times, in any one second, that
 * one thing drawn turns back on itself. Every number handed to the canvas is
 * followed from frame to frame (a place, a size, a strength of ink), and it
 * turns back when it goes down after going up or up after going down. A word
 * or a colour that changes counts once each time, and so does a frame that
 * draws other things than the one before it.
 */
function flicker(frames: readonly RecordingContext[]): { most: number; what: string } {
  const turns = new Map<string, number[]>()
  const note = (what: string, frame: number): void => {
    turns.set(what, [...(turns.get(what) ?? []), frame])
  }
  let shape = ''
  let before: (number | string)[] = []
  let going: number[] = []
  frames.forEach((drawn, frame) => {
    const names: string[] = []
    const values: (number | string)[] = []
    for (const call of drawn.calls) {
      for (const arg of call.args.flatMap((one) =>
        Array.isArray(one) ? (one as unknown[]) : [one],
      )) {
        if (typeof arg !== 'number' && typeof arg !== 'string') continue
        names.push(call.name)
        values.push(arg)
      }
    }
    const drawnShape = drawn.calls.map((call) => call.name).join(',')
    if (frame > 0 && drawnShape !== shape) {
      note('what is drawn at all', frame)
      going = []
    } else if (frame > 0) {
      values.forEach((value, slot) => {
        const last = before[slot]
        const what = `${names[slot]} (value ${slot})`
        if (typeof value === 'number' && typeof last === 'number') {
          const way = Math.abs(value - last) < 1e-6 ? 0 : Math.sign(value - last)
          if (way === 0) return
          if (going[slot] && going[slot] !== way) note(what, frame)
          going[slot] = way
        } else if (value !== last) note(what, frame)
      })
    }
    shape = drawnShape
    before = values
  })
  let most = 0
  let worst = 'nothing'
  for (const [what, at] of turns) {
    for (let i = 0; i < at.length; i++) {
      let count = 0
      for (let j = i; j < at.length && at[j] - at[i] < FPS; j++) count += 1
      if (count > most) [most, worst] = [count, what]
    }
  }
  return { most, what: worst }
}

const HELD: readonly DisplayNote[] = [
  { id: 60, frequency: 261.63, gain: 0.8, age: 3, released: null },
  { id: 67, frequency: 392, gain: 0.8, age: 3, released: null },
]

describe('the Isochronic display', () => {
  it('is laid out from the size it is given', () => {
    for (const [width, height] of [
      [128, 100],
      [204, 100],
      [293, 100],
    ]) {
      const lay = isochronicLayout({ width, height })
      expect(lay.lanes.x).toBeGreaterThanOrEqual(4)
      expect(lay.lanes.x + lay.lanes.w).toBeLessThanOrEqual(width - 12)
      expect(lay.lanes.h).toBe(2 * lay.lane + 1)
      expect(lay.mid).toBe(lay.lanes.y + lay.lane + 0.5)
      // Each part under the one before it, and all of it on the display.
      expect(lay.lanes.y).toBeGreaterThan(lay.words)
      expect(lay.glide.y - 4).toBeGreaterThanOrEqual(lay.lanes.y + lay.lanes.h)
      expect(lay.wave.y).toBeGreaterThanOrEqual(lay.glide.y + 4)
      expect(lay.envelope.x).toBeGreaterThan(lay.wave.x + lay.wave.w)
      expect(lay.envelope.x + lay.envelope.w).toBeLessThanOrEqual(width - 4)
      expect(lay.foot.y).toBeGreaterThanOrEqual(lay.wave.y + lay.wave.h + 2)
      expect(lay.foot.y + lay.foot.h).toBeLessThanOrEqual(height - 3)
    }
  })

  it('draws three periods of each ear as the device lets it through, the right ear Offset later', () => {
    const settings: Values[] = [
      {},
      { rate: 0.5, duty: 0.35, edge: 50, offset: 90 },
      { rate: 6, duty: 0.4, edge: 20, depth: 0.55, offset: 120 },
      { rate: 40, duty: 0.5, edge: 50, offset: 180 },
      { rate: 40, duty: 0.2, edge: 2, offset: 60 },
      { rate: 14, duty: 0.9, edge: 8, depth: 0.8, offset: 30 },
    ]
    for (const values of settings) {
      for (const width of [128, 204]) {
        const lay = isochronicLayout({ width, height: 100 })
        const pulse = pulseOf(values)
        const [upper, lower] = lanesOf(drawDisplay(display, ISOCHRONIC_PARAMS, { values, width }))
        const timeOf = (x: number): number => ((x - lay.lanes.x) / lay.lanes.w) * ISOCHRONIC_PERIODS
        const across = (time: number): number =>
          lay.lanes.x + (time / ISOCHRONIC_PERIODS) * lay.lanes.w
        // Every point of both lines is the pulse at its time, from end to end of the lanes.
        for (const [x, y] of upper.points)
          expect(y).toBeCloseTo(lay.mid - 0.5 - isochronicEars(timeOf(x), pulse)[0] * lay.lane, 6)
        for (const [x, y] of lower.points)
          expect(y).toBeCloseTo(lay.mid + 0.5 + isochronicEars(timeOf(x), pulse)[1] * lay.lane, 6)
        for (const line of [upper, lower]) {
          expect(line.colour).toBe(INK_COLOUR)
          expect(line.points[0][0]).toBeCloseTo(lay.lanes.x, 6)
          expect(line.points[line.points.length - 1][0]).toBeCloseTo(lay.lanes.x + lay.lanes.w, 6)
        }
        // The corners of every pulse are among them: where it starts to rise, is up, starts to fall, is down.
        for (let period = 0; period < ISOCHRONIC_PERIODS; period++) {
          for (const corner of [0, pulse.edge, pulse.duty, pulse.duty + pulse.edge]) {
            const x = across(period + corner)
            expect(upper.points.some((point) => Math.abs(point[0] - x) < 1e-6)).toBe(true)
            const later = period + corner + pulse.offset
            if (later < ISOCHRONIC_PERIODS)
              expect(lower.points.some((point) => Math.abs(point[0] - across(later)) < 1e-6)).toBe(
                true,
              )
          }
        }
        // Between the corners the lines are level: the top and the gap, as high as Depth leaves them.
        const top = across(1 + (pulse.edge + pulse.duty) / 2)
        const gap = across(1 + (pulse.duty + pulse.edge + 1) / 2)
        expect(heightAt(upper.points, top)).toBeCloseTo(lay.mid - 0.5 - lay.lane, 6)
        expect(heightAt(upper.points, gap)).toBeCloseTo(lay.mid - 0.5 - pulse.floor * lay.lane, 6)
        // The lower lane is the upper one turned over and moved Offset to the right.
        const moved = (pulse.offset / ISOCHRONIC_PERIODS) * lay.lanes.w
        expect(heightAt(lower.points, top + moved) - lay.mid).toBeCloseTo(
          lay.mid - heightAt(upper.points, top),
          6,
        )
      }
    }
  })

  it('gives a rise and a fall enough points to be a curve, and a hard edge two', () => {
    const soft = isochronicLanePoints(isochronicPulse(10, 0.5, 50, 1, 0), 0, 300)
    const hard = isochronicLanePoints(isochronicPulse(0.5, 0.5, 2, 1, 0), 0, 300)
    expect(soft.length).toBeGreaterThan(hard.length + 20)
    // A hard edge at the slowest Rate is one step: its corners and a point between.
    expect(hard.length).toBe(2 + ISOCHRONIC_PERIODS * 6 - 1)
    for (const [time, gain] of [...soft, ...hard]) {
      expect(time).toBeGreaterThanOrEqual(0)
      expect(time).toBeLessThanOrEqual(ISOCHRONIC_PERIODS)
      expect(gain).toBeGreaterThanOrEqual(0)
      expect(gain).toBeLessThanOrEqual(1)
    }
  })

  it('writes the Rate and the length of one period', () => {
    expect(isochronicRateText(0.5)).toBe('0.5 Hz')
    expect(isochronicRateText(7.746)).toBe('7.7 Hz')
    expect(isochronicRateText(10)).toBe('10 Hz')
    expect(isochronicRateText(40)).toBe('40 Hz')
    expect(isochronicPeriodText(0.5)).toBe('2.0 s')
    expect(isochronicPeriodText(0.8)).toBe('1.3 s')
    expect(isochronicPeriodText(6)).toBe('167 ms')
    expect(isochronicPeriodText(40)).toBe('25 ms')
    expect(isochronicTimeText(600)).toBe('10:00')
    expect(isochronicTimeText(41.2)).toBe('0:42')
    expect(isochronicTimeText(0)).toBe('0:00')
    for (const rate of [0.5, 6, 10, 40]) {
      const words = drawDisplay(display, ISOCHRONIC_PARAMS, { values: { rate } }).words()
      expect(words).toEqual(['L', 'R', isochronicRateText(rate), isochronicPeriodText(rate)])
    }
  })

  it("marks the glide's place where the device says it is, with the rate there and the time left", () => {
    const values = { rate: 10, target: 6, glide: 10 }
    const lay = isochronicLayout({ width: 128, height: 100 })
    // No glide: no dot and no time.
    const plain = drawDisplay(display, ISOCHRONIC_PARAMS, {
      values: { rate: 10 },
      meters: { glide: 0.5 },
    })
    expect(dotsOf(plain)).toHaveLength(0)
    // Waiting for a key: the dot at the Rate's end, the whole time to go.
    const waiting = drawDisplay(display, ISOCHRONIC_PARAMS, { values, meters: { glide: 0 } })
    expect(dotsOf(waiting)).toHaveLength(1)
    expect(dotsOf(waiting)[0].x).toBeCloseTo(lay.glide.x, 6)
    expect(waiting.words()).toContain('10:00')
    expect(waiting.words()).toContain('10 Hz')
    // Half way: the rate is the middle by ratio, and the lanes are that rate's.
    const half = drawDisplay(display, ISOCHRONIC_PARAMS, { values, meters: { glide: 0.5 } })
    const now = isochronicRate(10, 6, 10, 0.5)
    expect(now).toBeCloseTo(Math.sqrt(60), 9)
    expect(dotsOf(half)[0].x).toBeCloseTo(lay.glide.x + 0.5 * lay.glide.w, 6)
    expect(half.words()).toContain(isochronicRateText(now))
    expect(half.words()).toContain(isochronicPeriodText(now))
    expect(half.words()).toContain('5:00')
    // At its end: the Target, and no time left. A slower pulse stands lower on the line.
    const done = drawDisplay(display, ISOCHRONIC_PARAMS, { values, meters: { glide: 1 } })
    expect(dotsOf(done)[0].x).toBeCloseTo(lay.glide.x + lay.glide.w, 6)
    expect(done.words()).toContain('6.0 Hz')
    expect(done.words()).toContain('0:00')
    expect(dotsOf(done)[0].y).toBeGreaterThan(dotsOf(waiting)[0].y)
    // Switched off it is drawn where it would start.
    const off = drawDisplay(display, ISOCHRONIC_PARAMS, {
      values,
      meters: { glide: 0.5 },
      powered: false,
    })
    expect(off.words()).toContain('10 Hz')
    // The lanes follow: an Edge held at the Rate is free at a slower Target.
    const held = { rate: 40, target: 0.5, glide: 10, edge: 50 }
    const start = lanesOf(
      drawDisplay(display, ISOCHRONIC_PARAMS, { values: held, meters: { glide: 0 } }),
    )
    const end = lanesOf(
      drawDisplay(display, ISOCHRONIC_PARAMS, { values: held, meters: { glide: 1 } }),
    )
    expect(start[0].points).not.toEqual(end[0].points)
  })

  it("takes the glide's place from the device twice a second and no more often", () => {
    const values = { rate: 10, target: 6, glide: 10 }
    const frames = framesOf(display, 2, { values }, (time) => ({ meters: { glide: time / 2 } }))
    const places = new Set(frames.map((drawn) => dotsOf(drawn)[0].x.toFixed(4)))
    expect(places.size).toBeGreaterThanOrEqual(3)
    expect(places.size).toBeLessThanOrEqual(5)
    // A knob of the glide moved is taken at once.
    const state = display.init?.()
    drawDisplay(display, ISOCHRONIC_PARAMS, {
      values,
      meters: { glide: 0.2 },
      state,
      now: 10,
      dt: 0,
    })
    const moved = drawDisplay(display, ISOCHRONIC_PARAMS, {
      values: { ...values, target: 4 },
      meters: { glide: 0.6 },
      state,
      now: 10.033,
      dt: 0.033,
    })
    const lay = isochronicLayout({ width: 128, height: 100 })
    expect(dotsOf(moved)[0].x).toBeCloseTo(lay.glide.x + 0.6 * lay.glide.w, 6)
  })

  it('draws one cycle of the tone as Warmth makes it, and the noise of Air in its place', () => {
    const lay = isochronicLayout({ width: 128, height: 100 })
    const centre = lay.wave.y + lay.wave.h / 2
    const high = lay.wave.h / 2 - 1
    const toneOf = (drawn: RecordingContext): DrawnPath[] =>
      drawnPaths(drawn).filter(
        (path) => path.kind === 'stroke' && path.width === 1.5 && path.colour === INK_COLOUR,
      )
    for (const warmth of [0, 0.4, 1]) {
      for (const air of [0, 0.5]) {
        const [tone] = toneOf(drawDisplay(display, ISOCHRONIC_PARAMS, { values: { warmth, air } }))
        const share = isochronicMix(air).tone
        for (const [x, y] of tone.points) {
          const turn = (x - lay.wave.x) / lay.wave.w
          expect(y).toBeCloseTo(centre - share * isochronicWave(turn, warmth) * high, 6)
        }
        expect(tone.points[0][0]).toBeCloseTo(lay.wave.x, 6)
        expect(tone.points[tone.points.length - 1][0]).toBeCloseTo(lay.wave.x + lay.wave.w, 6)
      }
    }
    // All Air: no tone is left, and the noise stands half as high (by RMS) as the tone's peak did.
    expect(toneOf(drawDisplay(display, ISOCHRONIC_PARAMS, { values: { air: 1 } }))).toHaveLength(0)
    const rmsOf = (heights: number[]): number =>
      Math.sqrt(heights.reduce((sum, value) => sum + value * value, 0) / heights.length)
    expect(rmsOf(isochronicNoisePoints(1))).toBeCloseTo(ISOCHRONIC_NOISE_RMS, 9)
    expect(rmsOf(isochronicNoisePoints(0.5))).toBeCloseTo(
      ISOCHRONIC_NOISE_RMS * isochronicMix(0.5).noise,
      9,
    )
    expect(rmsOf(isochronicNoisePoints(0))).toBe(0)
    // The noise is drawn with Air and not without it.
    const marks = (air: number): number =>
      drawDisplay(display, ISOCHRONIC_PARAMS, { values: { air } }).marks()
    expect(marks(0.5)).toBe(marks(0) + 1)
  })

  it('lights the rise of a key for as long as one is held, and its fall for as long as it takes', () => {
    const lay = isochronicLayout({ width: 128, height: 100 })
    expect(litLines(drawDisplay(display, ISOCHRONIC_PARAMS))).toHaveLength(0)
    // Held: the rise, lit on every frame whatever the sound does under the pulse.
    const pulse = pulseOf({ rate: 6 })
    const frames = framesOf(display, 2, { values: { rate: 6 }, notes: HELD }, (time) => ({
      signal: pulsedSignal(time, 6, pulse),
    }))
    const first = litLines(frames[0])
    expect(first).toHaveLength(1)
    expect(first[0].points[0][0]).toBeCloseTo(lay.envelope.x, 6)
    for (const drawn of frames) expect(litLines(drawn)).toEqual(first)
    // Let go: the fall, until the Release is over (1.5 s at the defaults).
    const letGo = (released: number): readonly DisplayNote[] => [
      { id: 60, frequency: 261.63, gain: 0.8, age: 3 + released, released },
    ]
    const falling = litLines(drawDisplay(display, ISOCHRONIC_PARAMS, { notes: letGo(0.4) }))
    expect(falling).toHaveLength(1)
    expect(falling[0].points[falling[0].points.length - 1][0]).toBeCloseTo(
      lay.envelope.x + lay.envelope.w,
      6,
    )
    expect(litLines(drawDisplay(display, ISOCHRONIC_PARAMS, { notes: letGo(1.6) }))).toHaveLength(0)
    expect(
      litLines(drawDisplay(display, ISOCHRONIC_PARAMS, { notes: HELD, powered: false })),
    ).toHaveLength(0)
    // The rise and the fall drawn are the device's: half way up, and 60 dB down at the end.
    const whole = drawnPaths(drawDisplay(display, ISOCHRONIC_PARAMS)).filter(
      (path) => path.kind === 'stroke' && path.width === 1 && path.points.length === 26,
    )
    expect(whole).toHaveLength(1)
    const foot = lay.envelope.y + lay.envelope.h - 0.5
    const top = lay.envelope.y + 1.5
    expect(whole[0].points[6][1]).toBeCloseTo(foot - isochronicAttack(0.5) * (foot - top), 6)
    expect(whole[0].points[12][1]).toBeCloseTo(top, 6)
    expect(whole[0].points[13][1]).toBeCloseTo(top, 6)
    expect(whole[0].points[19][1]).toBeCloseTo(foot - isochronicRelease(0.5) * (foot - top), 6)
    expect(foot - whole[0].points[25][1]).toBeCloseTo(0.001 * (foot - top), 6)
  })

  it('shows the level over the last second, and holds it still under a small change', () => {
    const lay = isochronicLayout({ width: 128, height: 100 })
    const steady = (rms: number): DisplaySignal => {
      const level: DisplayLevel = { peak: rms * Math.SQRT2, rms, wave: new Float32Array(2048) }
      return {
        input: null,
        output: level,
        spectrum: null,
        binHz: RATE / 2048,
        left: level,
        right: level,
      }
    }
    const shareOf = (meanSquare: number): number =>
      Math.min(1, Math.max(0, 1 + (10 * Math.log10(meanSquare)) / 60))
    // A steady sound of -20 dBFS: the bar comes up over a second and never falls on the way.
    const rising = framesOf(display, 2, { signal: steady(0.1) }).map(litLevel)
    expect(rising[0]).toBe(0)
    for (let n = 1; n < rising.length; n++) expect(rising[n]).toBeGreaterThanOrEqual(rising[n - 1])
    // Half a second in, half of the second is still silence: 3 dB less.
    expect(Math.abs(rising[15] / lay.foot.w - shareOf(0.005))).toBeLessThanOrEqual(0.021)
    for (const n of [30, 45, 59])
      expect(Math.abs(rising[n] / lay.foot.w - shareOf(0.01))).toBeLessThanOrEqual(0.021)
    expect(new Set(rising.slice(31)).size).toBe(1)
    // The sound stops: it goes down, and is gone when the second is over.
    const falling = framesOf(display, 3, {}, (time) => ({
      signal: steady(time <= 1.5 ? 0.1 : 0),
    })).map(litLevel)
    for (let n = 47; n < falling.length; n++) expect(falling[n]).toBeLessThanOrEqual(falling[n - 1])
    expect(falling[60]).toBeGreaterThan(0)
    expect(falling[60]).toBeLessThan(falling[45])
    expect(falling[77]).toBe(0)
    // A level that goes up and down by half a decibel from frame to frame does not move the bar.
    let frame = 0
    const wobbling = framesOf(display, 3, {}, () => ({
      signal: steady(frame++ % 2 === 0 ? 0.1 : 0.106),
    })).map(litLevel)
    expect(new Set(wobbling.slice(32)).size).toBe(1)
    // Loud is a full bar, and one frame is the same as the run that ends on it.
    expect(ISOCHRONIC_LEVEL_SEC).toBe(1)
    const full = runDisplay(display, ISOCHRONIC_PARAMS, 1.5, { signal: steady(1) })
    expect(litLevel(full)).toBeCloseTo(lay.foot.w, 6)
    // Switched off, or with no sound to read, nothing is lit.
    expect(
      litLevel(
        runDisplay(display, ISOCHRONIC_PARAMS, 1.5, { signal: steady(0.5), powered: false }),
      ),
    ).toBe(0)
    expect(litLevel(runDisplay(display, ISOCHRONIC_PARAMS, 1.5, {}))).toBe(0)
  })
})

// --- R10: nothing flashes ----------------------------------------------------------

/** The rates the timed draw is held at: the slowest, two where a flash is felt most, and the fastest. */
const TIMED_RATES = [0.5, 6, 10, 40]
/** The most times in a second anything drawn may turn back on itself. */
const MOST_TURNS = 6

/** A display that does what this one must not: a patch as wide as the sound is loud on each frame, and as strong as the reading. */
const flasher = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['rate'],
  live: { meters: true, signal: true, notes: true },
  info: 'A patch that goes on and off with the pulse, which is what the display of Isochronic may not do.',
  draw(frame) {
    ground(frame)
    const rms = frame.signal ? frame.signal.output.rms : 0
    fillRect(
      frame.ctx,
      { x: 4, y: 4, w: 4 + 400 * rms, h: 20 },
      frame.colours.accent,
      0.2 + 0.8 * frame.meter('glide'),
    )
  },
})

describe('the Isochronic display over time (R10)', () => {
  /**
   * Two seconds at 30 frames a second with the sound and the reading both
   * going with the pulse. With `skew` the reading goes a little faster than
   * the pulse, so that it is not at the same place of its period each time the
   * display takes it.
   */
  const pulsing = (
    shown: PlateDisplay,
    rate: number,
    values: Values = {},
    skew = 1,
  ): { frames: RecordingContext[]; levels: number[] } => {
    const pulse = pulseOf({ ...values, rate })
    const levels: number[] = []
    const frames = framesOf(shown, 2, { values: { ...values, rate }, notes: HELD }, (time) => {
      const signal = pulsedSignal(time, rate, pulse)
      levels.push(signal.output.rms)
      return { signal, meters: { glide: isochronicOpen(wrap(time * rate * skew), pulse) } }
    })
    return { frames, levels }
  }

  it('is handed a sound and a reading that do pulse', () => {
    for (const rate of TIMED_RATES) {
      const { frames, levels } = pulsing(display, rate)
      expect(frames).toHaveLength(60)
      const most = Math.max(...levels)
      const least = Math.min(...levels)
      // At forty a second the plate's tap is longer than a period, so it reads less of the pulse.
      expect(most / Math.max(least, 1e-9)).toBeGreaterThan(rate < 40 ? 20 : 1.05)
    }
  })

  it('catches a display that flashes', () => {
    for (const rate of [6, 10, 40]) {
      const { most, what } = flicker(pulsing(flasher, rate).frames)
      expect(most, `at ${rate} a second: ${what}`).toBeGreaterThan(MOST_TURNS)
    }
    // A thing that goes on and off is caught as well as one that changes size.
    const lit = Array.from({ length: 60 }, (_, n) =>
      drawDisplay(n % 4 < 2 ? flasher : display, ISOCHRONIC_PARAMS),
    )
    expect(flicker(lit).most).toBeGreaterThan(MOST_TURNS)
    // And a display that stands still is not.
    const still = Array.from({ length: 60 }, () => drawDisplay(display, ISOCHRONIC_PARAMS))
    expect(flicker(still)).toEqual({ most: 0, what: 'nothing' })
  })

  for (const rate of TIMED_RATES) {
    it(`draws nothing that turns back more than six times a second at Rate ${rate}`, () => {
      const glide = { target: rate > 5 ? 2 : 20, glide: 10 }
      const cases: [string, Values, number][] = [
        ['at its defaults', {}, 1],
        ['with a glide', glide, 1],
        ['with a glide, its reading out of step with the frames', glide, 1.07],
        [
          'with a hard edge, part Depth and the ears apart',
          { edge: 2, depth: 0.6, offset: 120, air: 0.5 },
          1,
        ],
      ]
      for (const [what, values, skew] of cases) {
        const { frames } = pulsing(display, rate, values, skew)
        const found = flicker(frames)
        expect(found.most, `${what}: ${found.what}`).toBeLessThanOrEqual(MOST_TURNS)
      }
    })
  }

  it('holds still through a glide whose reading only rises, but for two takes a second', () => {
    const values = { rate: 10, target: 6, glide: 0.1 }
    const frames = framesOf(display, 2, { values, notes: HELD }, (time) => ({
      signal: pulsedSignal(time, 10, pulseOf(values)),
      meters: { glide: time / 6 },
    }))
    const pictures = frames.map((drawn) => drawn.print())
    let changes = 0
    for (let n = 1; n < pictures.length; n++) if (pictures[n] !== pictures[n - 1]) changes += 1
    // The glide is taken four times in two seconds; the level comes up over the first second.
    expect(flicker(frames).most).toBeLessThanOrEqual(2)
    expect(changes).toBeLessThanOrEqual(34)
    expect(new Set(pictures.slice(31, 45)).size).toBe(1)
  })
})
