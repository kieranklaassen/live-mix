// The display of Breath Pacer: its arithmetic held to the device's (the
// compiled module is rendered at 48 kHz and the level that comes out is
// compared with the curve the display draws, the mark's place with the place
// the device reports, and the cycle's length under a slow down with the
// device's reading and with the turns measured in the sound), what it draws,
// and that nothing on it goes on and off or runs faster than a breath.

import { describe, expect, it } from 'vitest'

import { BREATH_PACER_PARAMS } from '../../dsp/devices/breath-pacer.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS, fillRect, ground } from '../components/display-kit'
import {
  BREATH_PACER_FACES,
  BREATH_PACER_JUMP_SEC,
  BREATH_PACER_LEVEL_SEC,
  BREATH_PACER_PARTS,
  BREATH_PACER_REST_SEC,
  breathPacerAt,
  breathPacerBreath,
  breathPacerCurvePlaces,
  breathPacerCycle,
  breathPacerFloorGain,
  breathPacerFollow,
  breathPacerLayout,
  breathPacerLevel,
  breathPacerMinuteText,
  breathPacerNames,
  breathPacerOpen,
  breathPacerPartDb,
  breathPacerPartShare,
  breathPacerPut,
  breathPacerRise,
  breathPacerSecondsText,
  breathPacerStretch,
  breathPacerTickSeconds,
  type BreathPacerCycle,
  type BreathPacerMark,
} from '../components/displays/breath-pacer'
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
const BLOCK = 128
const display = BREATH_PACER_FACES['breath-pacer'].display

type Values = Readonly<Record<string, number>>
type Name = keyof typeof BREATH_PACER_PARAMS

const valueOf = (values: Values, name: string): number =>
  values[name] ?? BREATH_PACER_PARAMS[name as Name].default

/** The cycle the display draws at these settings. */
const cycleOf = (values: Values = {}): BreathPacerCycle =>
  breathPacerCycle(
    valueOf(values, 'in'),
    valueOf(values, 'hold'),
    valueOf(values, 'out'),
    valueOf(values, 'rest'),
  )

const wrap = (cycles: number): number => cycles - Math.floor(cycles)

async function deviceAt(values: Values): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('breath-pacer', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(BREATH_PACER_PARAMS[name as Name], value)
  return device
}

function strike(device: WasmDeviceHarness, hz: number, id = 1): void {
  const on = device.device.device_note_on
  if (!on) throw new Error('the device takes no notes')
  on(id, hz, 1)
}

/** The device's readings: where the breath stands, how far through the slow down is, and the cycle's length against its setting. */
interface Readings {
  place: number
  slowing: number
  stretch: number
}

function readingsOf(device: WasmDeviceHarness): Readings {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return { place: read(0), slowing: read(1), stretch: read(2) }
}

/**
 * What the device puts out over `seconds`, a sample at a time (its left
 * side), with its readings as they stand before each block of 128.
 */
function render(
  device: WasmDeviceHarness,
  seconds: number,
): { left: Float32Array; right: Float32Array; readings: Readings[] } {
  const total = Math.round(seconds * RATE)
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  const readings: Readings[] = []
  const silence = new Float32Array(BLOCK)
  for (let done = 0; done < total; done += BLOCK) {
    const frames = Math.min(BLOCK, total - done)
    readings.push(readingsOf(device))
    device.processBlock(silence.subarray(0, frames))
    left.set(device.view(device.device.device_out_left(), frames), done)
    right.set(device.view(device.device.device_out_right(), frames), done)
  }
  return { left, right, readings }
}

/**
 * The tone alone, with its colour standing still: no air, no marks and
 * Bright at 0, so the wave keeps one shape and its size is the level.
 */
const TONE_ALONE: Values = { air: 0, marks: 0, bright: 0, tone: 0.8 }
/** A key of 960 Hz is 50 samples a cycle at 48 kHz, from its zero crossing at the first sample. */
const KEY_HZ = 960
const PERIOD = RATE / KEY_HZ

/** The size of the sound in each cycle of the key: its largest sample there. */
function sizes(signal: Float32Array): Float32Array {
  const out = new Float32Array(Math.floor(signal.length / PERIOD))
  for (let k = 0; k < out.length; k++) {
    let peak = 0
    for (let n = k * PERIOD; n < (k + 1) * PERIOD; n++) peak = Math.max(peak, Math.abs(signal[n]))
    out[k] = peak
  }
  return out
}

/** The size of the tone alone with the level standing at its top: Floor at 1 leaves the breath nothing to move. */
async function fullSize(): Promise<number> {
  const device = await deviceAt({ ...TONE_ALONE, floor: 1 })
  strike(device, KEY_HZ)
  const all = sizes(render(device, 1).left)
  return all[all.length - 2]
}

/** How strongly `hz` stands in a stretch of sound: the size of that one partial. */
function partial(signal: Float32Array, from: number, to: number, hz: number): number {
  let re = 0
  let im = 0
  for (let n = from; n < to; n++) {
    const turn = (2 * Math.PI * hz * n) / RATE
    re += signal[n] * Math.cos(turn)
    im += signal[n] * Math.sin(turn)
  }
  return (2 * Math.hypot(re, im)) / (to - from)
}

function rmsOver(signal: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let n = from; n < to; n++) sum += signal[n] * signal[n]
  return Math.sqrt(sum / (to - from))
}

function peakOver(signal: Float32Array, from: number, to: number): number {
  let peak = 0
  for (let n = from; n < to; n++) peak = Math.max(peak, Math.abs(signal[n]))
  return peak
}

const dbOf = (ratio: number): number => 20 * Math.log10(ratio)

describe('the arithmetic of the Breath Pacer display against the device', () => {
  // The quickest cycle the device has, one with all four parts and a Floor
  // that leaves half the knob, and one whose Rest is its longest part.
  const PATTERNS: [string, Values][] = [
    ['in 1 and out 1, the quickest there is', { in: 1, out: 1 }],
    [
      'in 2, held 1, out 3, at rest 1, over a Floor',
      { in: 2, hold: 1, out: 3, rest: 1, floor: 0.5 },
    ],
    ['in 1.5, held 0.5, out 1, at rest 2', { in: 1.5, hold: 0.5, out: 1, rest: 2, floor: 0.3 }],
  ]

  it.each(PATTERNS)(
    'draws the level the device puts out, over two cycles: %s',
    async (_what, pattern) => {
      const values = { ...TONE_ALONE, ...pattern }
      const cycle = cycleOf(values)
      const floor = valueOf(values, 'floor')
      const full = await fullSize()
      const device = await deviceAt(values)
      strike(device, KEY_HZ)
      const heard = sizes(render(device, 2 * cycle.seconds).left)
      // From the key's own rise on (kAttackSeconds, 50 ms) to the end of the second cycle.
      const first = Math.ceil((0.15 * RATE) / PERIOD)
      let worst = 0
      let lowest = 1
      let highest = 0
      for (let k = first; k < heard.length; k++) {
        const time = ((k + 0.5) * PERIOD) / RATE
        const drawn = breathPacerLevel(floor, breathPacerAt(cycle, wrap(time / cycle.seconds)))
        worst = Math.max(worst, Math.abs(heard[k] / full - drawn))
        lowest = Math.min(lowest, heard[k] / full)
        highest = Math.max(highest, heard[k] / full)
      }
      expect(worst).toBeLessThan(0.006)
      // And the test is of something: the level goes from the Floor's gain to the top.
      expect(highest).toBeGreaterThan(0.995)
      expect(lowest).toBeLessThan(breathPacerFloorGain(floor) + 0.01)
      expect(lowest).toBeGreaterThan(breathPacerFloorGain(floor) - 0.01)
    },
  )

  it.each(PATTERNS)(
    'has the breath where the device reports it, block by block: %s',
    async (_what, pattern) => {
      const cycle = cycleOf(pattern)
      const device = await deviceAt({ ...TONE_ALONE, ...pattern })
      // Nothing sounds: the device reports the start.
      expect(readingsOf(device).place).toBe(0)
      strike(device, KEY_HZ)
      const { readings } = render(device, 2.2 * cycle.seconds)
      let worst = 0
      readings.forEach((reading, block) => {
        const place = wrap((block * BLOCK) / RATE / cycle.seconds)
        // Across the end of a cycle the two are a whole turn apart.
        const apart = Math.abs(reading.place - place)
        worst = Math.max(worst, Math.min(apart, 1 - apart))
      })
      expect(worst).toBeLessThan(1e-4)
      // The parts take their share of the cycle: the place where each begins is its time over the whole.
      for (const part of cycle.parts) {
        const block = Math.round((part.from * RATE) / BLOCK)
        expect(readings[block].place).toBeCloseTo(part.from / cycle.seconds, 2)
      }
    },
  )

  it('shapes a rise as the device does: half a line and half a soft S', () => {
    expect(breathPacerRise(0)).toBe(0)
    expect(breathPacerRise(1)).toBeCloseTo(1, 12)
    expect(breathPacerRise(0.5)).toBeCloseTo(0.5, 12)
    // kEase 0.5: a quarter of the way in it stands at 0.25 + 0.5 · (0.1464 − 0.25).
    expect(breathPacerRise(0.25)).toBeCloseTo(0.25 + 0.5 * (0.5 - 0.5 * Math.SQRT1_2 - 0.25), 12)
    expect(breathPacerBreath(0, 0.25)).toBe(breathPacerRise(0.25))
    expect(breathPacerBreath(1, 0.25)).toBe(1)
    expect(breathPacerBreath(2, 0.25)).toBeCloseTo(1 - breathPacerRise(0.25), 12)
    expect(breathPacerBreath(3, 0.25)).toBe(0)
    // Floor is squared: silence at the bottom at 0, a quarter of the crest at a half, no movement at 1.
    expect(breathPacerLevel(0, 0)).toBe(0)
    expect(breathPacerLevel(0.5, 0)).toBeCloseTo(0.25, 12)
    expect(breathPacerLevel(1, 0)).toBe(1)
    expect(breathPacerLevel(0.5, 1)).toBe(1)
  })

  it('writes the length the cycle has under a slow down: the reading, and the turns in the sound', async () => {
    // A breath of two seconds that grows to four over six seconds (Over is in minutes).
    const slow = { ...TONE_ALONE, in: 1, out: 1, slowTo: 2, over: 0.1 }
    const cycle = cycleOf(slow)
    const full = await fullSize()
    const device = await deviceAt(slow)
    expect(readingsOf(device)).toEqual({ place: 0, slowing: 0, stretch: 1 })
    strike(device, KEY_HZ)
    const { left, readings } = render(device, 18)
    // The reading of the length is the display's own law at the reading of the place, all the way.
    let worst = 0
    for (const reading of readings)
      worst = Math.max(
        worst,
        Math.abs(reading.stretch / breathPacerStretch(2, 0.1, reading.slowing) - 1),
      )
    expect(worst).toBeLessThan(1e-3)
    // Half way through its time the cycle is the root of two times its length; past its time, twice.
    const at = (seconds: number): Readings => readings[Math.round((seconds * RATE) / BLOCK)]
    expect(at(3).slowing).toBeCloseTo(0.5, 2)
    expect(at(3).stretch).toBeCloseTo(Math.SQRT2, 2)
    expect(at(6.1).slowing).toBe(1)
    expect(at(6.1).stretch).toBeCloseTo(2, 4)
    expect(breathPacerStretch(2, 0.1, 0.5)).toBeCloseTo(Math.SQRT2, 12)
    expect(breathPacerStretch(2, 0.1, 7)).toBe(2)
    // With Over at 0, or Slow to at 1, there is no slow down.
    expect(breathPacerStretch(2, 0, 0.5)).toBe(1)
    expect(breathPacerStretch(1, 5, 0.5)).toBe(1)

    // The turns themselves: with Floor at 0 the level touches nothing where each In begins.
    const heard = sizes(left)
    const turns: number[] = [0]
    for (let k = Math.ceil((0.5 * RATE) / PERIOD); k < heard.length - 1; k++) {
      if (heard[k] / full > 0.02 || heard[k] > heard[k - 1] || heard[k] >= heard[k + 1]) continue
      turns.push(((k + 0.5) * PERIOD) / RATE)
    }
    expect(turns.length).toBeGreaterThanOrEqual(6)
    // From one turn to the next the breath goes through one whole cycle: the
    // time gone, counted in cycles of the length the device reads out as it
    // goes, comes to one.
    for (let i = 1; i < turns.length; i++) {
      let gone = 0
      for (let block = 0; block < readings.length; block++) {
        const time = (block * BLOCK) / RATE
        if (time < turns[i - 1] || time >= turns[i]) continue
        gone += BLOCK / RATE / (cycle.seconds * readings[block].stretch)
      }
      expect(Math.abs(gone - 1), `the cycle that ends at ${turns[i].toFixed(2)} s`).toBeLessThan(
        0.01,
      )
    }
    // The first cycle is longer than it is set and the last ones are twice it.
    expect(turns[1] - turns[0]).toBeGreaterThan(2.1)
    expect(turns[1] - turns[0]).toBeLessThan(2.4)
    const last = turns[turns.length - 1] - turns[turns.length - 2]
    expect(last).toBeCloseTo(4, 2)
    // And that is what the display writes, from the readings as they stand at the end.
    const end = readingsOf(device)
    const words = drawDisplay(display, BREATH_PACER_PARAMS, {
      values: slow,
      meters: { ...end },
    }).words()
    expect(words).toContain(breathPacerSecondsText(last))
    expect(words).toContain('4 s')
    expect(words).toContain('15 a minute')
  })

  it('draws how open the colour is as the device opens it', async () => {
    // `partial_weight`: the tone's second partial stands at 0.6 times the openness against its first.
    const SECOND_PARTIAL = 0.6
    const key = 480
    for (const bright of [0, 0.5, 1]) {
      const device = await deviceAt({
        air: 0,
        marks: 0,
        tone: 0.8,
        floor: 0.5,
        in: 1,
        hold: 2,
        out: 1,
        rest: 2,
        bright,
      })
      strike(device, key)
      const { left } = render(device, 6)
      // Through the middle second of Hold the breath is full; through the middle second of Rest it is empty.
      const stretches: [number, number, number][] = [
        [1.5, 2.5, 1],
        [4.5, 5.5, 0],
      ]
      for (const [from, to, breath] of stretches) {
        const first = partial(left, from * RATE, to * RATE, key)
        const second = partial(left, from * RATE, to * RATE, 2 * key)
        expect(second / first / SECOND_PARTIAL, `Bright ${bright}, breath ${breath}`).toBeCloseTo(
          breathPacerOpen(bright, breath),
          2,
        )
      }
    }
    expect(breathPacerOpen(0, 1)).toBe(0.5)
    expect(breathPacerOpen(1, 1)).toBe(1)
    expect(breathPacerOpen(1, 0)).toBe(0)
    expect(breathPacerOpen(0.5, 0.25)).toBe(0.375)
  })

  it('gives Air, Tone and Marks the levels their knobs give them', async () => {
    // Each scales the square of its knob (kAirGain, kToneGain, kMarkGain): 40 dB for ten times the knob.
    expect(breathPacerPartDb(1)).toBe(0)
    expect(breathPacerPartDb(0.1)).toBeCloseTo(-40, 9)
    expect(breathPacerPartDb(0)).toBe(-Infinity)
    const still = { floor: 1, bright: 0, in: 2, out: 2 }
    const toneOf = async (tone: number): Promise<number> => {
      const device = await deviceAt({ ...still, air: 0, marks: 0, tone })
      strike(device, KEY_HZ)
      return peakOver(render(device, 1).left, RATE / 2, RATE)
    }
    expect(dbOf((await toneOf(0.8)) / (await toneOf(0.4)))).toBeCloseTo(
      breathPacerPartDb(0.8) - breathPacerPartDb(0.4),
      1,
    )
    const airOf = async (air: number): Promise<number> => {
      const device = await deviceAt({ ...still, tone: 0, marks: 0, air })
      strike(device, KEY_HZ)
      return rmsOver(render(device, 2).left, RATE / 2, 2 * RATE)
    }
    expect(dbOf((await airOf(0.6)) / (await airOf(0.3)))).toBeCloseTo(
      breathPacerPartDb(0.6) - breathPacerPartDb(0.3),
      1,
    )
    // A mark alone: the struck sine at the start of In, at its largest.
    const markOf = async (marks: number): Promise<number> => {
      const device = await deviceAt({ ...still, air: 0, tone: 0, marks })
      strike(device, KEY_HZ)
      return peakOver(render(device, 0.2).left, 0, RATE / 5)
    }
    expect(dbOf((await markOf(0.9)) / (await markOf(0.3)))).toBeCloseTo(
      breathPacerPartDb(0.9) - breathPacerPartDb(0.3),
      1,
    )
    // On the display each fills its bar from 40 dB under its top.
    expect(breathPacerPartShare(1)).toBe(1)
    expect(breathPacerPartShare(0.1)).toBeCloseTo(0, 9)
    expect(breathPacerPartShare(0)).toBe(0)
    expect(breathPacerPartShare(Math.sqrt(0.1))).toBeCloseTo(0.5, 9)
  })
})

// --- What is drawn ---------------------------------------------------------------

const INK_COLOUR = PLAIN_COLOURS.ink
const ACCENT_COLOUR = PLAIN_COLOURS.accent
const PLATE_COLOUR = PLAIN_COLOURS.plate
const FPS = 30

/** The level's line: the one line drawn 1.5 wide in the ink. */
function levelLine(drawn: RecordingContext): DrawnPath {
  const lines = drawnPaths(drawn).filter(
    (path) => path.kind === 'stroke' && path.width === 1.5 && path.colour === INK_COLOUR,
  )
  expect(lines).toHaveLength(1)
  return lines[0]
}

/** The line of how open the colour is: the one that stands back, through as many points as the level's. */
function openLine(drawn: RecordingContext): DrawnPath {
  const points = levelLine(drawn).points.length
  const lines = drawnPaths(drawn).filter(
    (path) =>
      path.kind === 'stroke' &&
      path.width === 1 &&
      path.alpha === INK.back &&
      path.points.length === points,
  )
  expect(lines).toHaveLength(1)
  return lines[0]
}

interface Dot {
  x: number
  y: number
  radius: number
  colour: string
}

/** Every dot drawn: where it stands, how large it is and what it is filled with. */
function dotsOf(drawn: RecordingContext): Dot[] {
  const dots: Dot[] = []
  let fill = ''
  let last: Dot | null = null
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'arc') {
      const [x, y, radius] = call.args as number[]
      last = { x, y, radius, colour: '' }
    } else if (call.name === 'fill' && last) {
      dots.push({ ...last, colour: fill })
      last = null
    } else if (call.name === 'beginPath') last = null
  }
  return dots
}

/** The mark for now: the dot in the accent on the curve while a breath sounds, else the ring at rest. */
function markOf(drawn: RecordingContext): Dot & { running: boolean } {
  const lay = breathPacerLayout({ width: widthOf(drawn), height: 100 })
  const dots = dotsOf(drawn).filter((one) => one.y > lay.slow.y + 3)
  const lit = dots.filter((one) => one.colour === ACCENT_COLOUR)
  const resting = dots.filter((one) => one.colour === PLATE_COLOUR)
  expect(lit.length + resting.length).toBe(1)
  return lit.length === 1 ? { ...lit[0], running: true } : { ...resting[0], running: false }
}

/** How wide the display was drawn: the ground is the first thing filled, over all of it. */
function widthOf(drawn: RecordingContext): number {
  const first = drawn.calls.find((call) => call.name === 'fillRect')
  return (first?.args[2] as number | undefined) ?? 128
}

/** The lines drawn in the accent: the upright line through the mark for now. */
const litLines = (drawn: RecordingContext): DrawnPath[] =>
  drawnPaths(drawn).filter((path) => path.kind === 'stroke' && path.colour === ACCENT_COLOUR)

/** Every bar filled: its place, its size, what it is filled with and how strongly. */
function barsOf(
  drawn: RecordingContext,
): { x: number; y: number; w: number; h: number; colour: string; alpha: number }[] {
  const bars: { x: number; y: number; w: number; h: number; colour: string; alpha: number }[] = []
  let fill = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      bars.push({ x, y, w, h, colour: fill, alpha })
    }
  }
  return bars
}

/** How wide the lit part of the level's bar is; 0 when none is lit. */
function litLevel(drawn: RecordingContext): number {
  const lit = barsOf(drawn).filter((bar) => bar.colour === ACCENT_COLOUR)
  return lit.length > 0 ? lit[lit.length - 1].w : 0
}

/** Where each word was written: its left end (or the end it is set from) and its line. */
function wordsAt(drawn: RecordingContext): { words: string; x: number; y: number }[] {
  return drawn.calls
    .filter((call) => call.name === 'fillText')
    .map((call) => ({
      words: String(call.args[0]),
      x: call.args[1] as number,
      y: call.args[2] as number,
    }))
}

function levelOf(samples: Float32Array): DisplayLevel {
  let peak = 0
  let sum = 0
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample))
    sum += sample * sample
  }
  return { peak, rms: Math.sqrt(sum / samples.length), wave: samples }
}

/** A steady sound of one level, as the plate's taps report it. */
function steady(rms: number): DisplaySignal {
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
      drawDisplay(shown, BREATH_PACER_PARAMS, {
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

const HELD: readonly DisplayNote[] = [
  { id: 60, frequency: 261.63, gain: 0.8, age: 3, released: null },
  { id: 67, frequency: 392, gain: 0.8, age: 3, released: null },
]

/** How wide a word is drawn in a test: the recording canvas gives every letter five pixels. */
const wideOf = (words: string): number => words.length * 5

const SETTINGS: Values[] = [
  {},
  { in: 1, out: 1 },
  { in: 4, hold: 7, out: 8, bright: 0.9 },
  { in: 3, hold: 1, out: 4, rest: 2, floor: 0.3, bright: 1 },
  { in: 2, out: 2, rest: 4, floor: 1, bright: 0 },
  { in: 12, hold: 12, out: 12, rest: 12, floor: 0.6 },
]

describe('the Breath Pacer display', () => {
  it('is laid out from the size it is given', () => {
    for (const [width, height] of [
      [128, 100],
      [204, 100],
      [293, 100],
    ]) {
      const lay = breathPacerLayout({ width, height })
      expect(lay.left).toBeGreaterThanOrEqual(4)
      expect(lay.right).toBeLessThanOrEqual(width - 4)
      expect(lay.curve.x).toBe(lay.left)
      expect(lay.curve.x + lay.curve.w).toBe(lay.right)
      expect(lay.base).toBe(lay.curve.y + lay.curve.h)
      // Each part under the one before it, and all of it on the display.
      expect(lay.header).toBeGreaterThanOrEqual(9)
      expect(lay.slow.row).toBeGreaterThan(lay.header + 8)
      expect(lay.curve.y).toBeGreaterThanOrEqual(lay.slow.row + 3)
      expect(lay.curve.h).toBeGreaterThanOrEqual(30)
      expect(lay.names).toBeGreaterThanOrEqual(lay.base + 4 + 8)
      expect(lay.mix.row).toBeGreaterThanOrEqual(lay.names + 9)
      expect(lay.foot.y).toBeGreaterThanOrEqual(lay.mix.row + 2)
      expect(lay.foot.y + lay.foot.h).toBeLessThanOrEqual(height - 3)
    }
  })

  it('draws one cycle as the device shapes it: the level, and how open the colour is', () => {
    for (const values of SETTINGS) {
      for (const width of [128, 204]) {
        const lay = breathPacerLayout({ width, height: 100 })
        const cycle = cycleOf(values)
        const floor = valueOf(values, 'floor')
        const bright = valueOf(values, 'bright')
        const drawn = drawDisplay(display, BREATH_PACER_PARAMS, { values, width })
        const level = levelLine(drawn)
        const open = openLine(drawn)
        const placeOf = (x: number): number => (x - lay.curve.x) / lay.curve.w
        // Every point of both lines is the device's law at its place in the cycle, from end to end.
        for (const [x, y] of level.points)
          expect(y).toBeCloseTo(
            lay.base - breathPacerLevel(floor, breathPacerAt(cycle, placeOf(x))) * lay.curve.h,
            6,
          )
        for (const [x, y] of open.points)
          expect(y).toBeCloseTo(
            lay.base - breathPacerOpen(bright, breathPacerAt(cycle, placeOf(x))) * lay.curve.h,
            6,
          )
        for (const line of [level, open]) {
          expect(line.points[0][0]).toBeCloseTo(lay.curve.x, 6)
          expect(line.points[line.points.length - 1][0]).toBeCloseTo(lay.curve.x + lay.curve.w, 6)
        }
        // The corners of every part are among them, in seconds across the axis.
        for (const part of cycle.parts) {
          const x = lay.curve.x + (part.from / cycle.seconds) * lay.curve.w
          expect(level.points.some((point) => Math.abs(point[0] - x) < 1e-6)).toBe(true)
        }
        // The top of the curve is all of the sound, and the breath comes back to where it began.
        const top = Math.min(...level.points.map((point) => point[1]))
        expect(top).toBeCloseTo(lay.curve.y, 6)
        expect(level.points[level.points.length - 1][1]).toBeCloseTo(level.points[0][1], 6)
        expect(level.points[0][1]).toBeCloseTo(
          lay.base - breathPacerFloorGain(floor) * lay.curve.h,
          6,
        )
      }
    }
  })

  it('gives a rise and a fall enough points to be a curve, and a level part two', () => {
    const cycle = cycleOf({ in: 3, hold: 1, out: 4, rest: 2 })
    const places = breathPacerCurvePlaces(cycle, 116)
    // In and Out about every pixel and a half, Hold and Rest from corner to corner.
    expect(places[0]).toBe(0)
    expect(places[places.length - 1]).toBe(1)
    expect(places.filter((place) => place > 0.3 && place < 0.4)).toHaveLength(0)
    expect(places.filter((place) => place > 0.8 && place < 1)).toHaveLength(0)
    expect(places.filter((place) => place < 0.3).length).toBeGreaterThanOrEqual(20)
    for (let i = 1; i < places.length; i++) expect(places[i]).toBeGreaterThan(places[i - 1])
    // A part of a second across a wide curve still bends.
    expect(
      breathPacerCurvePlaces(cycleOf({ in: 1, out: 12, rest: 12 }), 116).length,
    ).toBeGreaterThan(16)
  })

  it('writes the length of a cycle and how many go in a minute', () => {
    const lay = breathPacerLayout({ width: 128, height: 100 })
    const cases: [Values, string, string][] = [
      [{}, '10 s', '6 a minute'],
      [{ in: 5.5, out: 5.5 }, '11 s', '5.5 a minute'],
      [{ in: 4, hold: 7, out: 8 }, '19 s', '3.2 a minute'],
      [{ in: 1, out: 1 }, '2 s', '30 a minute'],
      [{ in: 6.5, out: 6.5 }, '13 s', '4.6 a minute'],
    ]
    for (const [values, length, minute] of cases) {
      const seconds = cycleOf(values).seconds
      expect(breathPacerSecondsText(seconds)).toBe(length)
      expect(breathPacerMinuteText(seconds)).toBe(minute)
      const words = wordsAt(drawDisplay(display, BREATH_PACER_PARAMS, { values }))
      expect(words[0]).toEqual({ words: length, x: lay.left, y: lay.header })
      expect(words[1]).toEqual({ words: minute, x: lay.right, y: lay.header })
    }
  })

  it('names each part that takes time under its stretch of the axis, with its seconds', () => {
    for (const width of [128, 204]) {
      const lay = breathPacerLayout({ width, height: 100 })
      for (const values of SETTINGS) {
        const cycle = cycleOf(values)
        const drawn = drawDisplay(display, BREATH_PACER_PARAMS, { values, width })
        const names = wordsAt(drawn).filter((word) => word.y === lay.names)
        // A Hold or a Rest of no time is not named.
        expect(names.map((word) => word.words.split(' ')[0])).toEqual(
          cycle.parts.map((part) => part.name),
        )
        for (const name of names) expect(BREATH_PACER_PARTS).toContain(name.words.split(' ')[0])
        // No word runs into its neighbour or off either end.
        names.forEach((word, i) => {
          expect(word.x).toBeGreaterThanOrEqual(lay.left - 1e-9)
          expect(word.x + wideOf(word.words)).toBeLessThanOrEqual(lay.right + 1e-9)
          if (i > 0)
            expect(word.x).toBeGreaterThanOrEqual(
              names[i - 1].x + wideOf(names[i - 1].words) + 3 - 1e-9,
            )
        })
      }
    }
    const lay = breathPacerLayout({ width: 128, height: 100 })
    const namesAt = (values: Values, width = 128): { words: string; x: number }[] =>
      wordsAt(drawDisplay(display, BREATH_PACER_PARAMS, { values, width }))
        .filter((word) => word.y === lay.names)
        .map(({ words, x }) => ({ words, x }))
    // Two parts with room to spare: each under the middle of its part.
    expect(namesAt({})).toEqual([
      { words: 'In 5', x: lay.curve.x + 0.25 * lay.curve.w - 10 },
      { words: 'Out 5', x: lay.curve.x + 0.75 * lay.curve.w - 12.5 },
    ])
    expect(namesAt({ in: 5.5, out: 5.5 }).map((word) => word.words)).toEqual(['In 5.5', 'Out 5.5'])
    // Four parts that fit, and four whose seconds do not: those stand as names alone.
    expect(namesAt({ in: 3, hold: 1, out: 4, rest: 2 }).map((word) => word.words)).toEqual([
      'In 3',
      'Hold 1',
      'Out 4',
      'Rest 2',
    ])
    const long = { in: 12, hold: 12, out: 12, rest: 12 }
    expect(namesAt(long).map((word) => word.words)).toEqual(['In', 'Hold', 'Out', 'Rest'])
    expect(namesAt(long, 204).map((word) => word.words)).toEqual([
      'In 12',
      'Hold 12',
      'Out 12',
      'Rest 12',
    ])
    // A short part beside long ones keeps its name, moved along to clear the end.
    const pushed = breathPacerNames(
      cycleOf({ in: 1, hold: 12, out: 1, rest: 12 }),
      1,
      lay,
      (seconds) => lay.curve.x + (seconds / 26) * lay.curve.w,
      wideOf,
    )
    expect(pushed.map((word) => word.words)).toEqual(['In', 'Hold', 'Out', 'Rest'])
    expect(pushed[0].x).toBe(lay.left)
    // Under a slow down the seconds are the ones of now.
    expect(
      breathPacerNames(cycleOf({ in: 2.5, out: 2.5 }), 1.6, lay, () => 60, wideOf).map(
        (word) => word.words,
      ),
    ).toEqual(['In 4', 'Out 4'])
  })

  it('marks every second of the cycle on the axis, and where each part begins', () => {
    const ticksOf = (values: Values): { short: number[]; long: number[] } => {
      const lay = breathPacerLayout({ width: 128, height: 100 })
      const upright = drawnPaths(drawDisplay(display, BREATH_PACER_PARAMS, { values })).filter(
        (path) =>
          path.kind === 'stroke' &&
          path.points.length === 2 &&
          path.points[0][0] === path.points[1][0] &&
          path.points[0][1] === lay.base,
      )
      return {
        short: upright
          .filter((path) => path.points[1][1] === lay.base + 2)
          .map((p) => p.points[0][0]),
        long: upright
          .filter((path) => path.points[1][1] === lay.base + 4)
          .map((p) => p.points[0][0]),
      }
    }
    const lay = breathPacerLayout({ width: 128, height: 100 })
    const at = (share: number): number => Math.floor(lay.curve.x + share * lay.curve.w) + 0.5
    // Ten seconds: a tick at each of the nine between, and a longer one at 0, at the turn and at the end.
    const plain = ticksOf({})
    expect(plain.short).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map((second) => at(second / 10)))
    expect(plain.long).toEqual([at(0), at(0.5), at(1)])
    // Four parts: five longer ones.
    const four = ticksOf({ in: 3, hold: 1, out: 4, rest: 2 })
    expect(four.short).toHaveLength(9)
    expect(four.long).toEqual([at(0), at(0.3), at(0.4), at(0.8), at(1)])
    // The longest cycle: a tick every five seconds, so they do not crowd.
    expect(ticksOf({ in: 12, hold: 12, out: 12, rest: 12 }).short).toEqual(
      [5, 10, 15, 20, 25, 30, 35, 40, 45].map((second) => at(second / 48)),
    )
    expect(breathPacerTickSeconds(10, 116)).toBe(1)
    expect(breathPacerTickSeconds(38, 116)).toBe(1)
    expect(breathPacerTickSeconds(48, 116)).toBe(5)
    expect(breathPacerTickSeconds(96, 116)).toBe(5)
    expect(breathPacerTickSeconds(96, 40)).toBe(10)
  })

  it('marks the two struck notes where they sound, as large as Marks stands', () => {
    const lay = breathPacerLayout({ width: 128, height: 100 })
    const struck = (values: Values): Dot[] =>
      dotsOf(drawDisplay(display, BREATH_PACER_PARAMS, { values })).filter(
        (one) => one.colour === INK_COLOUR && one.y === lay.base,
      )
    // One where In starts and one where Out starts; none where Hold or Rest does.
    const values = { in: 3, hold: 1, out: 4, rest: 2, marks: 1 }
    expect(struck(values)).toEqual([
      { x: lay.curve.x, y: lay.base, radius: 2.5, colour: INK_COLOUR },
      { x: lay.curve.x + 0.4 * lay.curve.w, y: lay.base, radius: 2.5, colour: INK_COLOUR },
    ])
    expect(struck({ ...values, marks: 0 })).toEqual([])
    const some = struck({ marks: 0.3 })
    expect(some.map((one) => one.x)).toEqual([lay.curve.x, lay.curve.x + 0.5 * lay.curve.w])
    for (const one of some) expect(one.radius).toBeCloseTo(1 + 1.5 * breathPacerPartShare(0.3), 9)
    expect(some[0].radius).toBeGreaterThan(1)
    expect(some[0].radius).toBeLessThan(2.5)
  })

  it('shows how far up Air, Tone and Marks stand', () => {
    for (const width of [128, 204]) {
      const lay = breathPacerLayout({ width, height: 100 })
      const values = { air: 1, tone: Math.sqrt(0.1), marks: 0 }
      const drawn = drawDisplay(display, BREATH_PACER_PARAMS, { values, width })
      const words = wordsAt(drawn).filter((word) => word.y === lay.mix.row)
      expect(words.map((word) => word.words)).toEqual(['Air', 'Tone', 'Marks'])
      const bars = barsOf(drawn).filter((bar) => bar.y === lay.mix.y && bar.colour === INK_COLOUR)
      const tracks = bars.filter((bar) => bar.alpha === INK.fill)
      const filled = bars.filter((bar) => bar.alpha === 1)
      expect(tracks).toHaveLength(3)
      const wide = tracks[0].w
      expect(wide).toBeGreaterThanOrEqual(12)
      for (const track of tracks) expect(track.w).toBe(wide)
      // Each track starts after its word and ends before the next word, the last at the right end.
      tracks.forEach((track, i) => {
        expect(track.x).toBeCloseTo(words[i].x + wideOf(words[i].words) + 3, 9)
        if (i < 2) expect(track.x + wide).toBeLessThan(words[i + 1].x)
      })
      expect(tracks[2].x + wide).toBeCloseTo(lay.right, 9)
      // Air at its top fills its bar, Tone 20 dB under its top fills half, Marks at none fills none.
      expect(filled).toHaveLength(2)
      expect(filled[0]).toMatchObject({ x: tracks[0].x, w: wide })
      expect(filled[1].x).toBe(tracks[1].x)
      expect(filled[1].w).toBeCloseTo(wide / 2, 9)
    }
  })

  it("marks the slow down's place where the device says it is, with the lengths of now", () => {
    const lay = breathPacerLayout({ width: 128, height: 100 })
    const values = { in: 2.5, out: 2.5, slowTo: 2, over: 10 }
    const slowDot = (drawn: RecordingContext): Dot[] =>
      dotsOf(drawn).filter((one) => one.y === lay.slow.y)
    const row = (drawn: RecordingContext): { words: string; x: number }[] =>
      wordsAt(drawn)
        .filter((word) => word.y === lay.slow.row)
        .map(({ words, x }) => ({ words, x }))
    // The line runs between the length as set and the length it grows to.
    const x0 = lay.left + wideOf('5 s') + 3
    const x1 = lay.right - wideOf('10 s') - 3
    for (const slowing of [0, 0.25, 0.678, 1]) {
      const stretch = Math.pow(2, slowing)
      const drawn = drawDisplay(display, BREATH_PACER_PARAMS, {
        values,
        meters: { place: 0.2, slowing, stretch },
      })
      expect(row(drawn)).toEqual([
        { words: '5 s', x: lay.left },
        { words: '10 s', x: lay.right },
      ])
      const dots = slowDot(drawn)
      expect(dots).toHaveLength(1)
      expect(dots[0].x).toBeCloseTo(x0 + slowing * (x1 - x0), 9)
      expect(dots[0].colour).toBe(ACCENT_COLOUR)
      // Over it, the length of a cycle now and how many of those go in a minute.
      const words = drawn.words()
      expect(words[0]).toBe(breathPacerSecondsText(5 * stretch))
      expect(words[1]).toBe(breathPacerMinuteText(5 * stretch))
      // And each part is named with its seconds now.
      const half = Math.round(25 * stretch) / 10
      expect(words).toContain(`In ${Number.isInteger(half) ? half : half.toFixed(1)}`)
    }
    const at = (meters: Record<string, number>, set: Values = values): string[] =>
      drawDisplay(display, BREATH_PACER_PARAMS, { values: set, meters }).words()
    expect(at({ place: 0.2, slowing: 0.678, stretch: 1.6 }).slice(0, 2)).toEqual([
      '8 s',
      '7.5 a minute',
    ])
    // A device that reports only the place: the length is the law's at that place.
    expect(at({ place: 0.2, slowing: 0.5 })[0]).toBe(breathPacerSecondsText(5 * Math.SQRT2))
    // A reading out of its range is held to it; none at all is the start.
    expect(at({ place: 0.2, slowing: 2, stretch: 9 })[0]).toBe('10 s')
    expect(at({ place: 0.2, slowing: -1, stretch: 0.2 })[0]).toBe('5 s')
    expect(at({})[0]).toBe('5 s')
    expect(at({ place: 0.2, slowing: Number.NaN, stretch: Number.NaN })[0]).toBe('5 s')
    // With no slow down set there is no line, whatever is reported.
    const none: Values[] = [
      { in: 2.5, out: 2.5 },
      { in: 2.5, out: 2.5, slowTo: 2, over: 0 },
      { in: 2.5, out: 2.5, slowTo: 1, over: 10 },
    ]
    for (const set of none) {
      const drawn = drawDisplay(display, BREATH_PACER_PARAMS, {
        values: set,
        meters: { place: 0.2, slowing: 0.7, stretch: 1.6 },
      })
      expect(slowDot(drawn)).toEqual([])
      expect(row(drawn)).toEqual([])
      expect(drawn.words().slice(0, 2)).toEqual(['5 s', '12 a minute'])
    }
  })

  it("takes the slow down's place from the device twice a second and no more often", () => {
    const lay = breathPacerLayout({ width: 128, height: 100 })
    const values = { in: 2.5, out: 2.5, slowTo: 2, over: 10 }
    const frames = framesOf(display, 2, { values }, (time) => ({
      meters: { place: 0, slowing: time / 6, stretch: Math.pow(2, time / 6) },
    }))
    /** Where the slow down's dot stands across. */
    const slowX = (drawn: RecordingContext): number =>
      dotsOf(drawn).find((one) => one.y === lay.slow.y)?.x ?? Number.NaN
    const xs = frames.map(slowX)
    for (let n = 1; n < xs.length; n++) expect(xs[n]).toBeGreaterThanOrEqual(xs[n - 1])
    expect(new Set(xs).size).toBe(4)
    expect(new Set(frames.map((drawn) => drawn.words()[0])).size).toBeLessThanOrEqual(4)
    // Moving Slow to or Over is seen at once.
    const state: unknown = display.init?.()
    const one = (set: Values, slowing: number, now: number): number =>
      slowX(
        drawDisplay(display, BREATH_PACER_PARAMS, {
          values: set,
          meters: { place: 0, slowing, stretch: 1 },
          state,
          now,
          dt: 1 / FPS,
        }),
      )
    const first = one(values, 0.8, 20)
    expect(one(values, 0, 20 + 1 / FPS)).toBe(first)
    expect(one({ ...values, over: 11 }, 0, 20 + 2 / FPS)).toBeLessThan(first)
  })

  it('shows the level over the last second, and holds it still under a small change', () => {
    const lay = breathPacerLayout({ width: 128, height: 100 })
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
    expect(BREATH_PACER_LEVEL_SEC).toBe(1)
    const full = runDisplay(display, BREATH_PACER_PARAMS, 1.5, { signal: steady(1) })
    expect(litLevel(full)).toBeCloseTo(lay.foot.w, 6)
    // Switched off, or with no sound to read, nothing is lit.
    expect(
      litLevel(
        runDisplay(display, BREATH_PACER_PARAMS, 1.5, { signal: steady(0.5), powered: false }),
      ),
    ).toBe(0)
    expect(litLevel(runDisplay(display, BREATH_PACER_PARAMS, 1.5, {}))).toBe(0)
  })

  it('keeps the mark where the device says the breath is, on the curve, frame after frame', async () => {
    const lay = breathPacerLayout({ width: 128, height: 100 })
    // One frame of the plate is 1600 samples at 48 kHz: sixteen blocks of a hundred.
    const step = new Float32Array(100)
    const cases: [string, Values, number, number][] = [
      ['a breath of two seconds', { in: 1, out: 1, floor: 0.3 }, 5, 0.002],
      ['four parts', { in: 1.5, hold: 0.5, out: 1, rest: 1 }, 9, 0.002],
      // The cycle's length is taken twice a second, so the mark's own pace is a little behind the device's.
      ['under a slow down', { in: 1, out: 1, slowTo: 2, over: 0.1 }, 9, 0.012],
    ]
    for (const [what, values, seconds, near] of cases) {
      const device = await deviceAt({ ...values, release: 0.05 })
      const cycle = cycleOf(values)
      const floor = valueOf(values, 'floor')
      const state: unknown = display.init?.()
      strike(device, 220)
      let worst = 0
      let wraps = 0
      let before = 0
      for (let n = 0; n < seconds * FPS; n++) {
        const readings = readingsOf(device)
        const drawn = drawDisplay(display, BREATH_PACER_PARAMS, {
          values,
          meters: { ...readings },
          state,
          now: 10 + n / FPS,
          dt: n === 0 ? 0 : 1 / FPS,
        })
        const mark = markOf(drawn)
        const place = (mark.x - lay.curve.x) / lay.curve.w
        if (readings.place > 0) {
          // A breath is sounding: the dot is lit, at the device's place and on the level's line there.
          expect(mark.running, `${what}, frame ${n}`).toBe(true)
          expect(mark.radius).toBe(3)
          const apart = Math.abs(wrap(place - readings.place + 0.5) - 0.5)
          worst = Math.max(worst, apart)
          expect(mark.y).toBeCloseTo(
            lay.base - breathPacerLevel(floor, breathPacerAt(cycle, place)) * lay.curve.h,
            9,
          )
          // The line through it stands at the same place, on a whole pixel.
          const lines = litLines(drawn)
          expect(lines).toHaveLength(1)
          expect(lines[0].points).toEqual([
            [Math.floor(mark.x) + 0.5, lay.curve.y],
            [Math.floor(mark.x) + 0.5, lay.base],
          ])
          if (place < before - 0.5) wraps += 1
          before = place
        }
        for (let block = 0; block < 16; block++) device.processBlock(step)
      }
      expect(worst, what).toBeLessThan(near)
      // It went round with the breath: once for each cycle begun after the first.
      expect(wraps, what).toBeGreaterThanOrEqual(2)
      // The key let go and the sound gone: the device says nothing sounds, and the mark goes back to rest.
      device.device.device_note_off?.(1)
      let last = drawDisplay(display, BREATH_PACER_PARAMS, { values, state, now: 0, dt: 0 })
      for (let n = 0; n < FPS; n++) {
        for (let block = 0; block < 16; block++) device.processBlock(step)
        last = drawDisplay(display, BREATH_PACER_PARAMS, {
          values,
          meters: { ...readingsOf(device) },
          state,
          now: 10 + seconds + n / FPS,
          dt: 1 / FPS,
        })
      }
      expect(readingsOf(device).place, what).toBe(0)
      const rest = markOf(last)
      expect(rest.running, what).toBe(false)
      expect(rest.x).toBe(lay.curve.x)
      expect(rest.y).toBeCloseTo(lay.base - breathPacerFloorGain(floor) * lay.curve.h, 9)
      expect(rest.radius).toBe(2.5)
      expect(litLines(last)).toEqual([])
    }
  })

  it('rests the mark at the start of In when nothing sounds or the plate is off', () => {
    const lay = breathPacerLayout({ width: 128, height: 100 })
    for (const options of [
      {},
      { meters: { place: 0, slowing: 0, stretch: 1 } },
      { meters: { place: 0.4, slowing: 0, stretch: 1 }, powered: false },
      { meters: { place: Number.NaN, slowing: 0, stretch: 1 } },
    ]) {
      const drawn = drawDisplay(display, BREATH_PACER_PARAMS, options)
      expect(markOf(drawn)).toEqual({
        x: lay.curve.x,
        y: lay.base,
        radius: 2.5,
        colour: PLATE_COLOUR,
        running: false,
      })
      expect(litLines(drawn)).toEqual([])
    }
    // Moving a length puts the mark straight on the reading, since the place means another time now.
    const state: unknown = display.init?.()
    const xOf = (values: Values, place: number, n: number): number =>
      markOf(
        drawDisplay(display, BREATH_PACER_PARAMS, {
          values,
          meters: { place, slowing: 0, stretch: 1 },
          state,
          now: 10 + n / FPS,
          dt: n === 0 ? 0 : 1 / FPS,
        }),
      ).x
    expect(xOf({}, 0.5, 0)).toBeCloseTo(lay.curve.x + 0.5 * lay.curve.w, 9)
    expect(xOf({ in: 2 }, 0.3, 1)).toBeCloseTo(lay.curve.x + 0.3 * lay.curve.w, 9)
  })

  it('moves the mark at the pace of the breath: never back, never faster than twice its pace', () => {
    const dt = 1 / FPS
    const pace = 0.5
    // Readings of any kind, from a generator that gives the same ones each run.
    let seed = 12345
    const any = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    for (const kind of ['any place', 'on and off', 'a quick sawtooth']) {
      let mark: BreathPacerMark = breathPacerPut(0.3)
      const jumps: number[] = []
      for (let n = 1; n <= 600; n++) {
        const reading =
          kind === 'any place' ? any() : kind === 'on and off' ? (n % 2) * any() : wrap(n * 0.37)
        const next = breathPacerFollow(mark, reading, pace, dt)
        expect(next.place).toBeGreaterThanOrEqual(0)
        expect(next.place).toBeLessThan(1)
        const moved = mark.running && next.running && next.sinceJump !== 0
        if (moved) {
          // On along the cycle, by no more than twice the pace.
          const on = wrap(next.place - mark.place)
          expect(on).toBeLessThanOrEqual(2 * pace * dt + 1e-12)
        } else if (next.sinceJump === 0) jumps.push(n)
        mark = next
      }
      // In one move to the reading, or to rest, at most twice a second.
      for (let i = 1; i < jumps.length; i++)
        expect((jumps[i] - jumps[i - 1]) * dt).toBeGreaterThanOrEqual(BREATH_PACER_JUMP_SEC - 1e-9)
    }
    // With the reading where the pace takes it, the mark stays on it.
    let mark = breathPacerPut(0.2)
    for (let n = 1; n <= 90; n++) {
      mark = breathPacerFollow(mark, wrap(0.2 + n * pace * dt), pace, dt)
      expect(Math.abs(wrap(mark.place - (0.2 + n * pace * dt) + 0.5) - 0.5)).toBeLessThan(1e-9)
    }
    // A reading a little ahead is made up a quarter of the way each frame; one a little behind is waited for.
    const ahead = breathPacerFollow(breathPacerPut(0.5), 0.5 + pace * dt + 0.02, pace, dt)
    expect(ahead.place).toBeCloseTo(0.5 + pace * dt + 0.005, 9)
    const behind = breathPacerFollow(breathPacerPut(0.5), 0.45, pace, dt)
    expect(behind.place).toBeGreaterThanOrEqual(0.5)
    expect(behind.place).toBeLessThan(0.5 + pace * dt)
    // A breath begun again at In is far from the mark: it goes there in one move.
    const again = breathPacerFollow(breathPacerPut(0.6), 0.01, pace, dt)
    expect(again).toMatchObject({ place: 0.01, running: true, sinceJump: 0 })
    // And not again within half a second: until then it waits or goes on at its pace.
    let after = again
    let frames = 0
    do {
      after = breathPacerFollow(after, 0.6, pace, dt)
      frames += 1
      if (after.sinceJump !== 0)
        expect(after.place).toBeLessThan(0.01 + frames * 2 * pace * dt + 1e-9)
    } while (after.sinceJump !== 0)
    expect(after.place).toBe(0.6)
    expect(frames * dt).toBeGreaterThanOrEqual(BREATH_PACER_JUMP_SEC - 1e-9)
    expect(frames * dt).toBeLessThan(BREATH_PACER_JUMP_SEC + 2 * dt)
  })

  it('takes the mark to rest a quarter of a second after the device says nothing sounds', () => {
    const dt = 1 / FPS
    const pace = 0.5
    let mark = breathPacerPut(0.4)
    expect(mark).toMatchObject({ place: 0.4, running: true })
    // One reading of nothing (the first sample of In reads 0 too) does not stop it.
    const frames = Math.ceil(BREATH_PACER_REST_SEC * FPS)
    for (let n = 1; n < frames; n++) {
      mark = breathPacerFollow(mark, 0, pace, dt)
      expect(mark.running).toBe(true)
      expect(mark.place).toBeCloseTo(0.4 + n * pace * dt, 9)
    }
    const back = breathPacerFollow(mark, 0.4 + frames * pace * dt, pace, dt)
    expect(back.running).toBe(true)
    expect(back.quiet).toBe(0)
    // A quarter of a second of it does.
    mark = breathPacerFollow(mark, 0, pace, dt)
    expect(mark).toMatchObject({ place: 0, running: false })
    // A key played right after waits out the half second, then the mark goes to the breath.
    let waited = 0
    while (!mark.running) {
      mark = breathPacerFollow(mark, 0.05 + waited * pace * dt, pace, dt)
      waited += 1
    }
    expect(waited * dt).toBeGreaterThanOrEqual(BREATH_PACER_JUMP_SEC - 1e-9)
    expect(waited * dt).toBeLessThan(BREATH_PACER_JUMP_SEC + 2 * dt)
    // From a rest of long standing the mark goes to the breath on the first frame.
    expect(breathPacerFollow(breathPacerPut(0), 0.02, pace, dt)).toMatchObject({
      place: 0.02,
      running: true,
    })
    // Numbers that are no numbers move nothing.
    expect(breathPacerPut(Number.NaN)).toMatchObject({ place: 0, running: false })
    expect(breathPacerPut(-1)).toMatchObject({ place: 0, running: false })
    expect(breathPacerFollow(breathPacerPut(0.4), 0.4, Number.NaN, dt).place).toBeCloseTo(0.4, 9)
    expect(breathPacerFollow(breathPacerPut(0.4), 0.7, pace, 0)).toMatchObject({ place: 0.7 })
  })
})

// --- R10: nothing flashes ----------------------------------------------------------

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

/**
 * How often the mark comes back to where it began: the most times, in any
 * one second, that it is drawn to the left of where it stood a frame before
 * or goes back to rest.
 */
function rounds(frames: readonly RecordingContext[]): number {
  const at: number[] = []
  let before = markOf(frames[0])
  frames.forEach((drawn, frame) => {
    const mark = markOf(drawn)
    if (frame > 0 && (mark.x < before.x - 1e-6 || (before.running && !mark.running))) at.push(frame)
    before = mark
  })
  let most = 0
  for (let i = 0; i < at.length; i++) {
    let count = 0
    for (let j = i; j < at.length && at[j] - at[i] < FPS; j++) count += 1
    most = Math.max(most, count)
  }
  return most
}

/**
 * The rates the timed draw is held at. A breath of this device takes two
 * seconds at the least, so 0.5 a second is the quickest it goes; 6, 10 and 40
 * a second are a sound and readings no setting gives, handed to the display
 * all the same, the two where a flash is felt most and one faster than the
 * frames.
 */
const TIMED_RATES = [0.5, 6, 10, 40]
/** The most times in a second anything drawn may turn back on itself. */
const MOST_TURNS = 6
/** The most times in a second the mark may come back to where it began. */
const MOST_ROUNDS = 3

/**
 * The sound as the plate's taps read it at `time`: the 2048 samples before
 * it, a tone that swells from nothing to full and back `rate` times a second,
 * so the level read on one frame is not the level read on the next.
 */
function pulsedSignal(time: number, rate: number, size = 0.25): DisplaySignal {
  const wave = new Float32Array(2048)
  for (let i = 0; i < 2048; i++) {
    const at = time - (2048 - i) / RATE
    wave[i] =
      size * (0.5 - 0.5 * Math.cos(2 * Math.PI * rate * at)) * Math.sin(2 * Math.PI * 220 * at)
  }
  const level = levelOf(wave)
  return {
    input: null,
    output: level,
    spectrum: null,
    binHz: RATE / 2048,
    left: level,
    right: level,
  }
}

/** A display that does what this one must not: a patch as wide as the sound is loud on each frame, and as strong as the reading. */
const flasher = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['in'],
  live: { meters: true, signal: true, notes: true },
  info: 'A patch that goes on and off with the sound, which is what the display of Breath Pacer may not do.',
  draw(frame) {
    ground(frame)
    const rms = frame.signal ? frame.signal.output.rms : 0
    fillRect(
      frame.ctx,
      { x: 4, y: 4, w: 4 + 400 * rms, h: 20 },
      frame.colours.accent,
      0.2 + 0.8 * frame.meter('place'),
    )
  },
})

describe('the Breath Pacer display over time (R10)', () => {
  /**
   * Two seconds at 30 frames a second with the sound and all three readings
   * going round `rate` times a second. With `skew` the readings go a little
   * faster than the sound, so that they are not at the same place of their
   * period each time the display takes them. They start half way round, so
   * that the slowest of them comes back to its start within the run.
   */
  const pulsing = (
    shown: PlateDisplay,
    rate: number,
    values: Values = {},
    skew = 1,
  ): { frames: RecordingContext[]; levels: number[]; places: number[] } => {
    const levels: number[] = []
    const places: number[] = []
    const slowTo = valueOf(values, 'slowTo')
    const frames = framesOf(shown, 2, { values, notes: HELD }, (time) => {
      const signal = pulsedSignal(time, rate)
      const place = wrap(time * rate * skew + 0.513)
      levels.push(signal.output.rms)
      places.push(place)
      return { signal, meters: { place, slowing: place, stretch: 1 + (slowTo - 1) * place } }
    })
    return { frames, levels, places }
  }

  it('is handed a sound and readings that do pulse', () => {
    for (const rate of TIMED_RATES) {
      const { frames, levels, places } = pulsing(display, rate)
      expect(frames).toHaveLength(60)
      const loud = Math.max(...levels)
      const quiet = Math.min(...levels)
      // The plate's tap is 43 ms long: at six a second it takes in a quarter of a period, at
      // ten near half and at forty more than one, so it reads less and less of the swell.
      const least = { 0.5: 100, 6: 5, 10: 2, 40: 1.15 }[rate] ?? 1
      expect(loud / Math.max(quiet, 1e-9)).toBeGreaterThan(least)
      let back = 0
      for (let n = 1; n < places.length; n++) if (places[n] < places[n - 1]) back += 1
      expect(back).toBeGreaterThanOrEqual(rate < 1 ? 1 : 10)
    }
  })

  it('catches a display that flashes', () => {
    for (const rate of [6, 10, 40]) {
      const { most, what } = flicker(pulsing(flasher, rate).frames)
      expect(most, `at ${rate} a second: ${what}`).toBeGreaterThan(MOST_TURNS)
    }
    // A thing that goes on and off is caught as well as one that changes size.
    const lit = Array.from({ length: 60 }, (_, n) =>
      drawDisplay(n % 4 < 2 ? flasher : display, BREATH_PACER_PARAMS),
    )
    expect(flicker(lit).most).toBeGreaterThan(MOST_TURNS)
    // And a display that stands still is not.
    const still = Array.from({ length: 60 }, () => drawDisplay(display, BREATH_PACER_PARAMS))
    expect(flicker(still)).toEqual({ most: 0, what: 'nothing' })
    // A mark put straight on a reading that goes round ten times a second goes round too often.
    const state: unknown = display.init?.()
    const thrown = Array.from({ length: 60 }, (_, n) =>
      drawDisplay(display, BREATH_PACER_PARAMS, {
        meters: { place: wrap((n / FPS) * 10 + 0.013), slowing: 0, stretch: 1 },
        state,
        now: 10 + n / FPS,
        dt: 0,
      }),
    )
    expect(rounds(thrown)).toBeGreaterThan(MOST_ROUNDS)
    expect(flicker(thrown).most).toBeGreaterThan(MOST_TURNS)
  })

  const slowDown = { slowTo: 2, over: 5 }
  const cases: [string, Values, number][] = [
    ['at its defaults', {}, 1],
    ['at the quickest breath', { in: 1, out: 1 }, 1],
    ['at the quickest breath, its readings out of step with the frames', { in: 1, out: 1 }, 1.07],
    ['with a slow down', { in: 2.5, out: 2.5, ...slowDown }, 1],
    [
      'with a slow down, its readings out of step with the frames',
      { in: 1, out: 1, ...slowDown },
      1.07,
    ],
    [
      'with four parts, a Floor and all the marks',
      { in: 1, hold: 1, out: 1, rest: 1, floor: 0.5, marks: 1 },
      1,
    ],
  ]

  for (const rate of TIMED_RATES) {
    it(`draws nothing that turns back more than six times a second at ${rate} a second`, () => {
      for (const [what, values, skew] of cases) {
        const { frames } = pulsing(display, rate, values, skew)
        const found = flicker(frames)
        expect(found.most, `${what}: ${found.what}`).toBeLessThanOrEqual(MOST_TURNS)
        expect(rounds(frames), what).toBeLessThanOrEqual(MOST_ROUNDS)
      }
    })
  }

  it('moves only at the pace of the breath when the device goes as it is set', () => {
    // The quickest breath there is, sounding as the device makes it: level and place as the law gives them.
    const values = { in: 1, out: 1 }
    const cycle = cycleOf(values)
    const frames = framesOf(display, 4, { values, notes: HELD }, (time) => {
      const place = wrap(time / cycle.seconds + 0.013)
      return {
        signal: steady(0.2 * breathPacerLevel(0, breathPacerAt(cycle, place)) + 1e-4),
        meters: { place, slowing: 0, stretch: 1 },
      }
    })
    // The mark goes round once in two seconds and over the top once in two seconds.
    expect(rounds(frames)).toBe(1)
    expect(flicker(frames).most).toBeLessThanOrEqual(2)
    // With the breath standing still nothing moves at all once the level has come up.
    const held = framesOf(display, 2, { values, notes: HELD }, () => ({
      signal: steady(0.1),
      meters: { place: 0, slowing: 0, stretch: 1 },
    }))
    expect(new Set(held.slice(31).map((drawn) => drawn.print())).size).toBe(1)
  })
})
