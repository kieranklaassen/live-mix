// The truth of the Twin Bars display. Its arithmetic against the compiled
// device played a key at 48 kHz (which ear has which bar, the swell of the
// pair in each ear and summed, how long every mode rings held and let go, how
// strongly a stroke lights each mode), the drawing against that arithmetic,
// and the timed draw: two seconds at 30 frames a second at four rates of
// Beat, in which nothing drawn may turn back more than six times in a second.

import { describe, expect, it } from 'vitest'

import { TWIN_BARS_PARAMS } from '../../dsp/devices/twin-bars.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  TWIN_BARS_FACES,
  TWIN_BARS_FLOOR_DB,
  TWIN_BARS_FOLLOWS_SEC,
  TWIN_BARS_LIT_SEC,
  TWIN_BARS_MATERIALS,
  TWIN_BARS_TOP_DB,
  twinBarsContact,
  twinBarsEar,
  twinBarsEars,
  twinBarsFallDb,
  twinBarsLayout,
  twinBarsLetGo,
  twinBarsModes,
  twinBarsPair,
  twinBarsResponse,
  twinBarsRing,
  twinBarsRingX,
  twinBarsSettings,
  twinBarsSpan,
  twinBarsStroke,
  twinBarsSum,
  twinBarsTilt,
  type TwinBarsSettings,
} from '../components/displays/twin-bars'
import { type DisplayNote, type DisplaySignal } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  recordingContext,
  testLevel,
  type DrawnPath,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const display = TWIN_BARS_FACES['twin-bars'].display
const size = displaySize(display)
const { ink, accent } = PLAIN_COLOURS

type Name = keyof typeof TWIN_BARS_PARAMS
type Values = Partial<Record<Name, number>>

const settingsOf = (values: Values = {}): TwinBarsSettings =>
  twinBarsSettings((name) => values[name as Name] ?? TWIN_BARS_PARAMS[name as Name].default)

/** The device is played this far under full scale, so its soft clip (knee 0.5) is never reached. */
const VOLUME_DB = -18
const VOLUME = Math.pow(10, VOLUME_DB / 20)
const BLOCK = 32

interface Played {
  left: Float32Array
  right: Float32Array
}

/** The compiled device played one key at sample 0, held, or let go at the block that begins at `offAt` samples. */
async function played(
  values: Values,
  hz: number,
  gain: number,
  seconds: number,
  offAt: number | null = null,
): Promise<Played> {
  const loaded = await loadWasmDevice('twin-bars', RATE)
  for (const [name, value] of Object.entries({ volume: VOLUME_DB, ...values }))
    loaded.set(TWIN_BARS_PARAMS[name as Name], value)
  const down = loaded.device.device_note_on
  const up = loaded.device.device_note_off
  if (!down || !up) throw new Error('the device takes no notes')
  down(1, hz, gain)
  const total = Math.ceil((seconds * RATE) / BLOCK) * BLOCK
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  for (let done = 0; done < total; done += BLOCK) {
    if (offAt !== null && done === offAt) up(1)
    loaded.device.device_process(BLOCK)
    left.set(loaded.view(loaded.device.device_out_left(), BLOCK), done)
    right.set(loaded.view(loaded.device.device_out_right(), BLOCK), done)
  }
  return { left, right }
}

/**
 * How strong the sine at `hz` is in a sound around `at` seconds, through a
 * raised-cosine window `window` seconds long: its size and its angle. Of two
 * tones closer than the window can tell apart it is the size of their sum.
 */
function toneAt(wave: Float32Array, hz: number, at: number, window: number): number {
  const frames = Math.round(window * RATE)
  const from = Math.round(at * RATE) - Math.floor(frames / 2)
  let re = 0
  let im = 0
  let weight = 0
  for (let i = 0; i < frames; i++) {
    const shade = 0.5 - 0.5 * Math.cos((TWO_PI * (i + 0.5)) / frames)
    const sample = wave[from + i] ?? 0
    re += shade * sample * Math.cos((TWO_PI * hz * (from + i)) / RATE)
    im += shade * sample * Math.sin((TWO_PI * hz * (from + i)) / RATE)
    weight += shade
  }
  return (2 * Math.hypot(re, im)) / weight
}

const mid = (sound: Played): Float32Array =>
  sound.left.map((sample, i) => 0.5 * (sample + sound.right[i]))

/** `TwinBars::stroke`, `middle`: the push's middle lands this many samples after the key, and the bars turn from there. */
const landsAt = (set: TwinBarsSettings, hz: number, gain: number): number =>
  (0.5 * (twinBarsContact(set.material, set.mallet, hz, gain, hz, RATE) - 1) + 1) / RATE

describe('the figures of Twin Bars', () => {
  it('are the header’s: the materials, the ears, the stroke, the mallet, Tone', () => {
    expect(TWIN_BARS_MATERIALS.map((made) => made.name)).toEqual(TWIN_BARS_PARAMS.bar.choices)
    // `kit::ear_gains`: all of its own bar at Ears 1, half of each at 0.
    expect(twinBarsEars(1)).toEqual({ same: 1, other: 0 })
    expect(twinBarsEars(0)).toEqual({ same: 0.5, other: 0.5 })
    expect(twinBarsEars(0.6).same).toBeCloseTo(0.8, 12)
    expect(twinBarsEars(7)).toEqual(twinBarsEars(1))
    // `stroke_level`: 0.25 at full strength, glass 1.4 times that, and soft keys fall faster than their gain.
    expect(twinBarsStroke(0, 1)).toBeCloseTo(0.25, 12)
    expect(twinBarsStroke(2, 1)).toBeCloseTo(0.35, 12)
    expect(twinBarsStroke(0, 0.5)).toBeCloseTo(0.25 * 0.5 * 0.65, 12)
    // `response`: a tap leaves all of itself, a push one period long a half, two or three periods nothing.
    expect(twinBarsResponse(0)).toBe(1)
    expect(twinBarsResponse(1)).toBe(0.5)
    expect(twinBarsResponse(2)).toBeCloseTo(0, 9)
    expect(twinBarsResponse(3)).toBeCloseTo(0, 9)
    // `tilt`: -1.5 at the dark end, 0 in the middle, 0.5 at the bright end.
    expect(twinBarsTilt(0)).toBe(-1.5)
    expect(twinBarsTilt(0.5)).toBe(0)
    expect(twinBarsTilt(1)).toBe(0.5)
    // The contact at middle C: 2.5 ms soft and a tenth of that hard at full strength times 0.8, longer on glass.
    expect(twinBarsContact(0, 0, 261.6256, 1, 261.6256, RATE)).toBe(Math.round(0.0025 * 0.8 * RATE))
    expect(twinBarsContact(0, 1, 261.6256, 1, 261.6256, RATE)).toBe(
      Math.round(0.00025 * 0.8 * RATE),
    )
    expect(twinBarsContact(2, 0, 261.6256, 1, 261.6256, RATE)).toBe(
      Math.round(0.0025 * 0.8 * 1.3 * RATE),
    )
    // Never more than most of a period of the bar's own fundamental, never under two samples.
    expect(twinBarsContact(0, 0, 1760, 1, 1758, RATE)).toBe(Math.round((0.9 * RATE) / 1758))
    expect(twinBarsContact(0, 1, 8000, 1, 8000, RATE)).toBe(2)
  })

  it('ring as long as `TwinBars::ring` says, held and let go', () => {
    // Decay is the fundamental's 60 dB on any material; a mode at ratio r dies 1 + d·(r - 1) times faster.
    for (const material of [0, 1, 2]) expect(twinBarsRing(material, 0, 6)).toBe(6)
    expect(twinBarsRing(0, 1, 6)).toBeCloseTo(6 / (1 + 0.25 * 1.757), 9)
    expect(twinBarsRing(1, 2, 6)).toBeCloseTo(6 / (1 + 3 * 8.9), 9)
    expect(twinBarsRing(2, 3, 6)).toBeCloseTo(6 / (1 + 0.6 * 5.63), 9)
    // A key let go rings Decay^(1 - Damp) · 0.07^Damp: Decay at 0, the choke at 1.
    expect(twinBarsLetGo(6, 0)).toBe(1)
    expect(6 * twinBarsLetGo(6, 1)).toBeCloseTo(0.07, 12)
    expect(6 * twinBarsLetGo(6, 0.3)).toBeCloseTo(Math.pow(6, 0.7) * Math.pow(0.07, 0.3), 9)
    expect(twinBarsRing(0, 0, 6, twinBarsLetGo(6, 1))).toBeCloseTo(0.07, 12)
    // Nothing rings shorter than 5 ms.
    expect(twinBarsRing(1, 2, 0.3, twinBarsLetGo(0.3, 1))).toBe(0.005)
    // The followed stroke's fall: held 3 s of a 6 s ring is 30 dB, then let go it falls at the released rate.
    const set = settingsOf({ decay: 6, damp: 1 })
    expect(twinBarsFallDb(set, 3, null)).toBeCloseTo(-30, 9)
    expect(twinBarsFallDb(set, 3.035, 0.035)).toBeCloseTo(-60, 9)
  })
})

describe('the figures against the device itself', () => {
  it('gives the left ear the higher bar, and each ear its share by the family law', async () => {
    // A pair twenty hertz apart about A4: 450 Hz is the second bar, 430 Hz the first.
    for (const ears of [0, 0.3, 0.6, 1]) {
      const values = { beat: 20, ears, bar: 2, mallet: 0.2, decay: 20, damp: 0 }
      const sound = await played(values, 440, 1, 1.2)
      const { same, other } = twinBarsEars(ears)
      // Each bar is a stroke's worth, fallen as far as the middle of the window.
      const level = twinBarsStroke(2, 1) * VOLUME * Math.pow(10, (-60 * 0.6) / 20 / 20)
      const near = level * 0.02
      expect(Math.abs(toneAt(sound.left, 450, 0.6, 0.8) - same * level)).toBeLessThan(near)
      expect(Math.abs(toneAt(sound.left, 430, 0.6, 0.8) - other * level)).toBeLessThan(near)
      expect(Math.abs(toneAt(sound.right, 430, 0.6, 0.8) - same * level)).toBeLessThan(near)
      expect(Math.abs(toneAt(sound.right, 450, 0.6, 0.8) - other * level)).toBeLessThan(near)
    }
  })

  it('swells in each ear and in the sum as the display draws it, at any Beat, with Scatter too', async () => {
    const hz = 880
    for (const beat of [0.5, 4, 20])
      for (const scatter of [0, 12.5])
        for (const ears of [0, 0.6, 1]) {
          const values = { beat, ears, scatter, bar: 2, mallet: 0.2, tone: 0.3, decay: 3 }
          const set = settingsOf(values)
          const sound = await played(values, hz, 1, 1.05)
          const level = twinBarsStroke(set.material, 1) * VOLUME
          const lands = landsAt(set, hz, 1)
          const sum = mid(sound)
          let worst = 0
          let deepest = 1
          for (let at = 0.03; at <= 1; at += 0.0037) {
            const pair = twinBarsPair(at - lands, set, hz, RATE)
            // Eight milliseconds of window: seven periods of the key, a sixth of the fastest beat.
            worst = Math.max(
              worst,
              Math.abs(toneAt(sound.left, hz, at, 0.008) / level - twinBarsEar(pair, ears, true)),
              Math.abs(toneAt(sound.right, hz, at, 0.008) / level - twinBarsEar(pair, ears, false)),
              Math.abs(toneAt(sum, hz, at, 0.008) / level - twinBarsSum(pair)),
            )
            deepest = Math.min(deepest, twinBarsSum(pair))
          }
          expect(worst, `beat ${beat} scatter ${scatter} ears ${ears}`).toBeLessThan(0.015)
          // The sum goes through nothing between its crests wherever a whole swell fits in the second.
          if (beat >= 4 && scatter === 0) expect(deepest).toBeLessThan(0.05)
        }
  })

  it('has the late bar in the left ear: with Scatter the second bar is the one struck later', async () => {
    // A short ring and a long Scatter: 40 ms on, the bar struck first has fallen 8 dB and the late one is fresh.
    const hz = 880
    for (const ears of [0.6, 1]) {
      const values = { beat: 4, ears, scatter: 40, bar: 2, mallet: 0.2, tone: 0.3, decay: 0.3 }
      const set = settingsOf(values)
      const sound = await played(values, hz, 1, 0.4)
      const level = twinBarsStroke(set.material, 1) * VOLUME
      const lands = landsAt(set, hz, 1)
      let worst = 0
      let apart = 0
      for (let at = 0.05; at <= 0.3; at += 0.0037) {
        const pair = twinBarsPair(at - lands, set, hz, RATE)
        const left = twinBarsEar(pair, ears, true)
        const right = twinBarsEar(pair, ears, false)
        worst = Math.max(
          worst,
          Math.abs(toneAt(sound.left, hz, at, 0.008) / level - left),
          Math.abs(toneAt(sound.right, hz, at, 0.008) / level - right),
        )
        apart = Math.max(apart, Math.abs(left - right))
      }
      expect(worst, `ears ${ears}`).toBeLessThan(0.015)
      // The two ears are far enough apart here that the wrong way round would not pass.
      expect(apart).toBeGreaterThan(0.2)
    }
    // Before the late stroke lands the left ear at Ears 1 has nothing.
    const early = await played({ ears: 1, scatter: 40, decay: 0.3, bar: 2 }, hz, 1, 0.1)
    const stroke = twinBarsStroke(2, 1) * VOLUME
    expect(toneAt(early.left, hz, 0.02, 0.008) / stroke).toBeLessThan(1e-3)
    expect(toneAt(early.right, hz, 0.02, 0.008) / stroke).toBeGreaterThan(0.5)
    expect(twinBarsPair(0.02, settingsOf({ scatter: 40 }), hz, RATE).second).toBe(0)
  })

  it('rings every mode as long as the display draws it, held and let go, and lights it as strongly', async () => {
    const hz = 440
    const offAt = 0.032
    const cases: { values: Values; gain: number }[] = [
      { values: { mallet: 1 }, gain: 1 },
      { values: {}, gain: 1 },
      { values: { mallet: 0.2, tone: 0 }, gain: 0.6 },
      { values: { mallet: 0.8, tone: 1 }, gain: 0.5 },
    ]
    for (const bar of [0, 1, 2])
      for (const { values: more, gain } of cases) {
        const values = { ...more, bar, ears: 1, decay: 20, damp: 0.5 }
        const set = settingsOf(values)
        const held = await played(values, hz, gain, 0.7)
        const freed = await played(values, hz, gain, 0.45, Math.round(offAt * RATE))
        const lands = landsAt(set, hz, gain)
        const stroke = twinBarsStroke(bar, gain) * VOLUME
        const letGo = twinBarsLetGo(set.decay, set.damp)
        // At Ears 1 the right ear is the first bar alone and the left ear the second.
        for (const side of [-1, 1] as const) {
          const modes = twinBarsModes(set, hz, gain, side, RATE)
          expect(modes).toHaveLength(TWIN_BARS_MATERIALS[bar].ratio.length)
          expect(modes[0].hz).toBe(hz + side * 2)
          const wave = side < 0 ? held.right : held.left
          const waveFreed = side < 0 ? freed.right : freed.left
          modes.forEach((mode, k) => {
            const what = `${TWIN_BARS_MATERIALS[bar].name} mode ${k} side ${side} ${JSON.stringify(more)}`
            // Held: two readings a while apart give the ring time, and the first, taken back to the stroke, its size.
            const first = toneAt(wave, mode.hz, 0.05, 0.02)
            const apart = Math.min(mode.seconds / 3, 0.5)
            const second = toneAt(wave, mode.hz, 0.05 + apart, 0.02)
            const struck = (first * Math.pow(10, (3 * (0.05 - lands)) / mode.seconds)) / stroke
            expect(Math.abs(struck - mode.level), `${what} struck`).toBeLessThan(
              0.004 + 0.02 * mode.level,
            )
            // A mode the mallet leaves almost nothing in has no ring to time.
            if (mode.level < 0.02) return
            const seconds = (3 * apart) / Math.log10(first / second)
            expect(seconds / mode.seconds, `${what} held`).toBeGreaterThan(0.97)
            expect(seconds / mode.seconds, `${what} held`).toBeLessThan(1.03)
            // Let go: the same mode, Decay^(1 - Damp) · 0.07^Damp of it.
            const free = twinBarsRing(bar, k, set.decay, letGo)
            expect(free).toBeCloseTo(mode.seconds * letGo, 9)
            const window = Math.min(0.01, free / 3)
            if (mode.level < 0.1 || window < 0.004) return
            const from = offAt + 0.012
            const one = toneAt(waveFreed, mode.hz, from, window)
            const two = toneAt(waveFreed, mode.hz, from + free / 3, window)
            const freeSeconds = free / Math.log10(one / two)
            expect(freeSeconds / free, `${what} let go`).toBeGreaterThan(0.96)
            expect(freeSeconds / free, `${what} let go`).toBeLessThan(1.04)
          })
        }
      }
  })

  it('has every mode at the pitch the display has it, on both bars', async () => {
    // A hard mallet and the brightest Tone, so every mode is there to be found; a fifth of a second of window
    // tells pitches 30 Hz apart. Each mode is where the display says and not 30 Hz to either side.
    for (const bar of [0, 1, 2]) {
      const values = { bar, mallet: 1, tone: 1, ears: 1, decay: 20, beat: 6 }
      const sound = await played(values, 440, 1, 0.3)
      for (const side of [-1, 1] as const) {
        const wave = side < 0 ? sound.right : sound.left
        const modes = twinBarsModes(settingsOf(values), 440, 1, side, RATE)
        modes.forEach((mode, k) => {
          expect(mode.hz).toBeCloseTo(440 * TWIN_BARS_MATERIALS[bar].ratio[k] + side * 3, 9)
          const here = toneAt(wave, mode.hz, 0.15, 0.2)
          const what = `${TWIN_BARS_MATERIALS[bar].name} mode ${k} side ${side}`
          expect(here / toneAt(wave, mode.hz + 30, 0.15, 0.2), what).toBeGreaterThan(20)
          expect(here / toneAt(wave, mode.hz - 30, 0.15, 0.2), what).toBeGreaterThan(20)
        })
      }
    }
  })

  it('has no mode above 16 kHz, and the mallet never pushes longer than most of a period', async () => {
    // Metal's fourth mode on a key of 1800 Hz would lie at 16079 Hz: it is not made.
    const high = settingsOf({ mallet: 1, ears: 1 })
    expect(twinBarsModes(high, 1760, 1, 0, RATE)).toHaveLength(4)
    expect(twinBarsModes(high, 1800, 1, 0, RATE)).toHaveLength(3)
    const sound = await played({ mallet: 1, ears: 1, decay: 20 }, 1800, 1, 0.2)
    const stroke = twinBarsStroke(0, 1) * VOLUME
    expect(toneAt(sound.left, 1800 * 8.933 + 2, 0.1, 0.02) / stroke).toBeLessThan(1e-3)
    expect(toneAt(sound.left, 1800 * 5.404 + 2, 0.1, 0.02) / stroke).toBeGreaterThan(0.1)
    // The softest mallet high up: the push is held to 0.9 of a period, and the modes are lit as the display says.
    const soft = { mallet: 0, ears: 1, decay: 20 }
    const set = settingsOf(soft)
    const top = await played(soft, 1760, 1, 0.3)
    const lands = (0.5 * (twinBarsContact(0, 0, 1760, 1, 1758, RATE) - 1) + 1) / RATE
    for (const mode of twinBarsModes(set, 1760, 1, -1, RATE)) {
      const heard = toneAt(top.right, mode.hz, 0.05, 0.01)
      const struck = (heard * Math.pow(10, (3 * (0.05 - lands)) / mode.seconds)) / stroke
      expect(Math.abs(struck - mode.level), `${mode.hz} Hz`).toBeLessThan(0.004 + 0.02 * mode.level)
    }
  })
})

// --- The drawing ------------------------------------------------------------

const C4 = 261.6256
const lay = twinBarsLayout(size)
const middle = lay.beat.y + lay.beat.h / 2
const half = lay.beat.h / 2 - 1

const draw = (values: Values, options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, TWIN_BARS_PARAMS, { values, ...options })

/** A sound that comes out at `rms`. */
function signalOf(rms: number): DisplaySignal {
  return {
    input: null,
    output: testLevel(rms * Math.SQRT2),
    spectrum: null,
    binHz: 0,
    left: null,
    right: null,
  }
}

const key = (age: number, released: number | null = null, hz = C4, gain = 1): DisplayNote => ({
  id: Math.round(hz),
  frequency: hz,
  gain,
  age,
  released,
})

/** The display run as the plate runs it, frame after frame on one state: every frame's drawing. */
function run(
  values: Values,
  seconds: number,
  each: (time: number) => Partial<FrameOptions>,
  fps = 30,
): RecordingContext[] {
  const state: unknown = display.init?.()
  const frames: RecordingContext[] = []
  for (let n = 0; n < Math.round(seconds * fps); n++) {
    const time = n / fps
    frames.push(
      drawDisplay(display, TWIN_BARS_PARAMS, {
        values,
        ...each(time),
        state,
        now: 10 + time,
        dt: n === 0 ? 0 : 1 / fps,
      }),
    )
  }
  return frames
}

const lines = (drawn: RecordingContext): DrawnPath[] =>
  drawnPaths(drawn).filter((path) => path.kind === 'stroke' && path.points.length > 1)
/** The two ears' swells: the left ear's, then the right ear's. */
const earLines = (drawn: RecordingContext): DrawnPath[] =>
  lines(drawn).filter((path) => path.width === 1.2)
/** The swell of the sum: the filled shape's upper edge. */
const sumEdge = (drawn: RecordingContext): [number, number][] => {
  const [shape] = drawnPaths(drawn).filter(
    (path) => path.kind === 'fill' && path.alpha === INK.fill && path.points.length > 100,
  )
  return shape.points.slice(0, shape.points.length / 2)
}
/** How many times a line dips towards the middle line and comes back. */
const dips = (points: [number, number][]): number => {
  const tall = points.map(([, y]) => Math.abs(middle - y))
  let count = 0
  for (let i = 1; i < tall.length - 1; i++)
    if (tall[i] < tall[i - 1] && tall[i] <= tall[i + 1]) count += 1
  return count
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
  colour: string
  alpha: number
}
function rects(drawn: RecordingContext): Rect[] {
  const out: Rect[] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      out.push({ x, y, w, h, colour, alpha })
    }
  }
  return out
}
/** The two bars beside the material's name. */
const pair = (drawn: RecordingContext): Rect[] =>
  rects(drawn).filter((rect) => rect.w === 9 && rect.h === 2)
/** How wide the level in the foot is drawn. */
const footWide = (drawn: RecordingContext): number =>
  rects(drawn).find((rect) => rect.colour === accent && rect.y === lay.foot.y)?.w ?? 0

interface Dot {
  x: number
  y: number
  r: number
}
/** The dots filled in the accent, in the order they were drawn. */
function dots(drawn: RecordingContext): Dot[] {
  const out: Dot[] = []
  let colour = ''
  let open: Dot[] = []
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'beginPath') open = []
    else if (call.name === 'arc') {
      const [x, y, r] = call.args as number[]
      open.push({ x, y, r })
    } else if (call.name === 'fill' && colour === accent) out.push(...open)
  }
  return out
}

describe('the drawing of Twin Bars', () => {
  it('draws each ear’s swell and the sum’s over the first seconds, by the display’s arithmetic', () => {
    for (const values of [
      {},
      { beat: 0.5, ears: 1 },
      { beat: 20, ears: 0, decay: 20 },
      { beat: 7, ears: 0.3, scatter: 25, decay: 1.2 },
    ] as Values[]) {
      const set = settingsOf(values)
      const drawn = draw(values)
      const span = twinBarsSpan(set.beat)
      const [left, right] = earLines(drawn)
      const sum = sumEdge(drawn)
      expect(left.points.length).toBeGreaterThan(2 * lay.beat.w)
      expect(left.points[0][0]).toBe(lay.beat.x)
      expect(left.points.at(-1)?.[0]).toBeCloseTo(lay.beat.x + lay.beat.w, 9)
      left.points.forEach(([x, y], i) => {
        const both = twinBarsPair(((x - lay.beat.x) / lay.beat.w) * span, set, C4, RATE)
        expect(y).toBeCloseTo(middle - twinBarsEar(both, set.ears, true) * half, 9)
        expect(right.points[i][1]).toBeCloseTo(
          middle + twinBarsEar(both, set.ears, false) * half,
          9,
        )
        expect(sum[i][1]).toBeCloseTo(middle - twinBarsSum(both) * half, 9)
      })
      expect(drawn.words()).toContain(`${span.toFixed(1)} s`)
    }
    // Four swells at least, never under a second nor over eight: the axis is time, whatever the rate.
    expect(twinBarsSpan(0.5)).toBe(8)
    expect(twinBarsSpan(2)).toBe(2)
    expect(twinBarsSpan(4)).toBe(1)
    expect(twinBarsSpan(20)).toBe(1)
  })

  it('stands the beat still along the time axis: as many dips as Beat has in the span', () => {
    for (const [beat, count] of [
      [0.5, 4],
      [2, 4],
      [4, 4],
      [10, 10],
      [20, 20],
    ]) {
      const middleOnly = draw({ beat, ears: 0, decay: 20 })
      expect(dips(sumEdge(middleOnly)), `the sum at ${beat} Hz`).toBe(count)
      expect(dips(earLines(middleOnly)[0].points), `an ear at Ears 0, ${beat} Hz`).toBe(count)
      // At Ears 1 each ear has one bar, which only dies away: the beat is in the sum alone.
      const apart = draw({ beat, ears: 1, decay: 20 })
      expect(dips(sumEdge(apart))).toBe(count)
      expect(dips(earLines(apart)[0].points)).toBe(0)
      expect(dips(earLines(apart)[1].points)).toBe(0)
    }
  })

  it('shows beside the lane what each ear holds of its own bar and of the other', () => {
    for (const ears of [0, 0.6, 1]) {
      const strong = rects(draw({ ears })).filter(
        (rect) => rect.x === lay.shares.x && rect.alpha === 1 && rect.colour === ink,
      )
      expect(strong).toHaveLength(2)
      for (const rect of strong) expect(rect.h).toBeCloseTo(twinBarsEars(ears).same * half, 9)
      // The left ear's stands on the middle line, the right ear's hangs from it.
      expect(strong[0].y + strong[0].h).toBeCloseTo(middle - 1, 9)
      expect(strong[1].y).toBeCloseTo(middle + 1, 9)
    }
  })

  it('draws every mode’s fall to the floor at its ring time, and the key let go dashed', () => {
    const floor = lay.ring.y + lay.ring.h
    const yOf = (db: number): number =>
      lay.ring.y + ((TWIN_BARS_TOP_DB - db) / (TWIN_BARS_TOP_DB - TWIN_BARS_FLOOR_DB)) * lay.ring.h
    for (const values of [
      {},
      { bar: 1, mallet: 1, tone: 1, decay: 2 },
      { bar: 2, mallet: 0.8, decay: 20, damp: 1 },
      { bar: 0, mallet: 0.9, tone: 0.2, decay: 0.3, damp: 0.6 },
    ] as Values[]) {
      const set = settingsOf(values)
      const drawn = draw(values)
      const modes = twinBarsModes(set, C4, 1, 0, RATE)
      const [fundamental] = lines(drawn).filter((path) => path.width === 1.5)
      const overtones = lines(drawn).filter((path) => path.width === 1 && path.alpha === INK.back)
      const [letGo] = lines(drawn).filter((path) => path.width === 1 && path.alpha === INK.text)
      // The fundamental starts at 0 dB and reaches the floor at Decay.
      expect(fundamental.points[0][1]).toBeCloseTo(yOf((-60 * 0.01) / set.decay), 9)
      expect(fundamental.points.at(-1)?.[0]).toBeCloseTo(twinBarsRingX(set.decay, lay.ring), 9)
      expect(fundamental.points.at(-1)?.[1]).toBeCloseTo(floor, 9)
      // Each overtone starts as strong as the stroke leaves it and is gone sooner: the highest is drawn first.
      const drawnModes = modes.slice(1).filter((mode) => 20 * Math.log10(mode.level) > -60)
      expect(overtones).toHaveLength(drawnModes.length)
      drawnModes.reverse().forEach((mode, i) => {
        const db = 20 * Math.log10(mode.level)
        const ends = (mode.seconds * (db + 60)) / 60
        expect(overtones[i].points.at(-1)?.[0]).toBeCloseTo(twinBarsRingX(ends, lay.ring), 9)
        if (ends > 0.02)
          expect(overtones[i].points[0][1]).toBeCloseTo(yOf(db - (60 * 0.01) / mode.seconds), 9)
      })
      // Dashed: the fundamental of a key let go at once, Decay^(1 - Damp) · 0.07^Damp.
      const free = Math.pow(set.decay, 1 - set.damp) * Math.pow(0.07, set.damp)
      expect(letGo.points.at(-1)?.[0]).toBeCloseTo(twinBarsRingX(free, lay.ring), 6)
      expect(
        drawn.calls.some((call) => call.name === 'setLineDash' && String(call.args[0]) === '2,2'),
      ).toBe(true)
      expect(drawn.words()).toContain(TWIN_BARS_MATERIALS[set.material].name)
    }
    // The scale is seconds by ratio: 0.1 s, 1 s and 10 s stand the same distance apart.
    const [a, b, c] = [0.1, 1, 10].map((seconds) => twinBarsRingX(seconds, lay.ring))
    expect(b - a).toBeCloseTo(c - b, 9)
    expect(draw({}).words()).toEqual(expect.arrayContaining(['0.1', '1', '10 s']))
  })

  it('reads the level as the mean over the last second, never the reading of one frame', () => {
    const steady = run({}, 1.5, () => ({ signal: signalOf(0.1) }))
    // -20 dB on a scale from -60 dB up: two thirds of the foot, once a second of it has been heard.
    expect(Math.abs(footWide(steady[steady.length - 1]) - (2 / 3) * lay.foot.w)).toBeLessThan(1)
    // One frame of it is a thirtieth of a second's mean, 14.8 dB under.
    expect(footWide(steady[0])).toBeLessThan(0.45 * lay.foot.w)
    expect(footWide(steady[0])).toBeGreaterThan(0)
    // A sound that is there on every other frame reads as half its power, and the foot stands still.
    const flicker = run({}, 2.5, (time) => ({
      signal: signalOf(Math.round(time * 30) % 2 === 0 ? 0.2 : 0),
    }))
    const want = (1 - (10 * Math.log10(0.02)) / -60) * lay.foot.w
    const late = flicker.slice(45).map(footWide)
    for (const wide of late) expect(Math.abs(wide - want)).toBeLessThan(1.5)
    expect(new Set(late).size).toBe(1)
    // Silence, and a device switched off, empty it.
    expect(footWide(draw({}, { signal: signalOf(0) }))).toBe(0)
    expect(footWide(draw({}, { signal: signalOf(0.3), powered: false }))).toBe(0)
  })

  it('lights the pair while a key is held, not once a beat', () => {
    const rest = pair(draw({}))
    expect(rest).toHaveLength(2)
    for (const bar of rest) expect(bar.colour).toBe(ink)
    // Held for a second, then let go: lit all the while and half a second more.
    const frames = run({ beat: 10 }, 2, (time) => ({
      notes: [key(time, time >= 1 ? time - 1 : null)],
    }))
    frames.forEach((drawn, n) => {
      const time = n / 30
      const lit = time < 1 + TWIN_BARS_LIT_SEC - 0.04
      const dark = time > 1 + TWIN_BARS_LIT_SEC + 0.04
      for (const bar of pair(drawn)) {
        if (lit) expect(bar.colour, `at ${time.toFixed(2)} s`).toBe(accent)
        if (lit) expect(bar.alpha).toBe(1)
        if (dark) expect(bar.colour, `at ${time.toFixed(2)} s`).toBe(ink)
      }
    })
    // Switched off, nothing is lit and nothing is marked.
    const off = draw({}, { notes: [key(0.2)], powered: false })
    for (const bar of pair(off)) expect(bar.colour).toBe(ink)
    expect(dots(off)).toEqual([])
  })

  it('marks the followed stroke in its ring, and in its swell only at three hertz or under', () => {
    const at = (values: Values, note: DisplayNote): Dot[] => dots(draw(values, { notes: [note] }))
    const yOf = (db: number): number =>
      lay.ring.y + ((TWIN_BARS_TOP_DB - db) / (TWIN_BARS_TOP_DB - TWIN_BARS_FLOOR_DB)) * lay.ring.h
    for (const beat of [0.5, 2, 3]) {
      const values = { beat, ears: 0.6, decay: 6 }
      const set = settingsOf(values)
      const [ring, left, right] = at(values, key(0.3))
      expect(ring.x).toBeCloseTo(twinBarsRingX(0.3, lay.ring), 9)
      expect(ring.y).toBeCloseTo(yOf(-3), 9)
      const both = twinBarsPair(0.3, set, C4, RATE)
      const x = lay.beat.x + (0.3 / twinBarsSpan(beat)) * lay.beat.w
      expect(left.x).toBeCloseTo(x, 9)
      expect(right.x).toBeCloseTo(x, 9)
      expect(left.y).toBeCloseTo(middle - twinBarsEar(both, 0.6, true) * half, 9)
      expect(right.y).toBeCloseTo(middle + twinBarsEar(both, 0.6, false) * half, 9)
    }
    // Faster than three hertz the beat is the still shape alone: only the place in the ring is marked.
    for (const beat of [3.01, 6, 10, 20]) expect(at({ beat }, key(0.3))).toHaveLength(1)
    // Past the span of the upper lane the swell's marks are gone; rung out, the ring's is too.
    expect(at({ beat: 2 }, key(2.5))).toHaveLength(1)
    expect(at({ beat: 2, decay: 6 }, key(6.5))).toHaveLength(0)
    // A key let go falls at the released rate from where it was let go.
    const freed = { beat: 10, decay: 6, damp: 0.3 }
    const [dot] = at(freed, key(1, 0.5))
    const want = -60 * (0.5 / 6 + 0.5 / (Math.pow(6, 0.7) * Math.pow(0.07, 0.3)))
    expect(twinBarsFallDb(settingsOf(freed), 1, 0.5)).toBeCloseTo(want, 9)
    expect(dot.y).toBeCloseTo(yOf(want), 9)
    expect(dot.x).toBeCloseTo(twinBarsRingX(1, lay.ring), 9)
    // The key that is followed is named, and the swell is drawn for it: Scatter turns the pair by the key's pitch.
    const named = draw({ scatter: 10 }, { notes: [key(0.1, null, 440)] })
    expect(named.words()).toContain('A4')
    expect(draw({}).words()).toContain('C4')
    const both = twinBarsPair(0.5, settingsOf({ scatter: 10 }), 440, RATE)
    const [left] = earLines(named)
    const i = left.points.findIndex(([x]) => x >= lay.beat.x + 0.5 * lay.beat.w)
    expect(left.points[i][1]).toBeCloseTo(middle - twinBarsEar(both, 0.6, true) * half, 9)
  })

  it('follows a stroke for at least half a second, so a roll does not restart the marks sixteen times a second', () => {
    const pitches = [440, 523.25, 659.26]
    const roll = (time: number): DisplayNote[] => {
      const notes: DisplayNote[] = []
      for (let n = 0; n / 16 <= time + 1e-9; n++) {
        const age = time - n / 16
        notes.push({
          id: 100 + (n % 3),
          frequency: pitches[n % 3],
          gain: 0.8,
          age,
          released: age > 0.03 ? age - 0.03 : null,
        })
      }
      return notes
    }
    const frames = run({ beat: 2 }, 2, (time) => ({ notes: roll(time) }))
    const named = frames.map((drawn) => drawn.words()[1])
    const changes: number[] = []
    for (let n = 1; n < named.length; n++) if (named[n] !== named[n - 1]) changes.push(n / 30)
    expect(changes.length).toBeGreaterThan(0)
    for (let n = 1; n < changes.length; n++)
      expect(changes[n] - changes[n - 1]).toBeGreaterThanOrEqual(TWIN_BARS_FOLLOWS_SEC - 1e-9)
    // And the pair is lit throughout: the gaps of a roll are shorter than it stays lit.
    for (const drawn of frames) for (const bar of pair(drawn)) expect(bar.colour).toBe(accent)
  })
})

// --- The timed draw (R10) ---------------------------------------------------

/** Everything the canvas was handed on one frame, in order: the calls' names, numbers and words. */
function handed(drawn: RecordingContext): (number | string)[] {
  const out: (number | string)[] = []
  for (const call of drawn.calls) {
    out.push(call.name)
    for (const arg of call.args.flatMap((each) =>
      Array.isArray(each) ? (each as unknown[]) : [each],
    ))
      out.push(typeof arg === 'number' ? arg : String(arg))
  }
  return out
}

/**
 * The most times any one thing drawn turns back within a second. A thing is
 * a place in the order of what the canvas is handed: a coordinate, a size, a
 * strength, a colour or a word. A number turns back when it has moved one
 * way by a hundredth (of a pixel, or of full strength) and then moves the
 * other way by as much; a colour or a word, each time it changes.
 */
function mostTurns(frames: RecordingContext[], fps = 30): { turns: number; moved: number } {
  const all = frames.map(handed)
  const slots = Math.max(...all.map((each) => each.length))
  let most = 0
  let moved = 0
  for (let slot = 0; slot < slots; slot++) {
    const turnsAt: number[] = []
    let way = 0
    let far: number | null = null
    let said: string | null = null
    let changed = false
    all.forEach((each, n) => {
      const value = each[slot]
      if (value === undefined) return
      if (typeof value === 'string') {
        if (said !== null && value !== said) turnsAt.push(n)
        if (said !== null && value !== said) changed = true
        said = value
        far = null
        way = 0
        return
      }
      if (far === null) {
        far = value
        return
      }
      const step = value - far
      if (way === 0) {
        if (Math.abs(step) >= 0.01) {
          way = Math.sign(step)
          far = value
          changed = true
        }
      } else if (step * way > 0) far = value
      else if (-step * way >= 0.01) {
        turnsAt.push(n)
        way = -way
        far = value
      }
    })
    if (changed) moved += 1
    for (let i = 0; i < turnsAt.length; i++) {
      let within = 0
      for (let j = i; j < turnsAt.length && turnsAt[j] < turnsAt[i] + fps; j++) within += 1
      most = Math.max(most, within)
    }
  }
  return { turns: most, moved }
}

describe('the timed draw of Twin Bars', () => {
  /** A sound that pulses at the rate of the beat. */
  const pulsing = (rate: number, time: number): DisplaySignal =>
    signalOf(0.25 * (0.5 + 0.5 * Math.cos(TWO_PI * rate * time)))

  it('counts what turns back: a light at six a second is caught, a slow mark is not', () => {
    const lamp = (rate: number): RecordingContext[] =>
      Array.from({ length: 60 }, (_, n) => {
        const drawn = recordingContext()
        drawn.ctx.globalAlpha = 0.5 + 0.5 * Math.cos((TWO_PI * rate * n) / 30)
        drawn.ctx.fillRect(n, 0, 4, 4)
        return drawn
      })
    expect(mostTurns(lamp(6)).turns).toBeGreaterThan(6)
    expect(mostTurns(lamp(10)).turns).toBeGreaterThan(6)
    expect(mostTurns(lamp(0.5)).turns).toBeLessThanOrEqual(2)
  })

  it.each([0.5, 3, 6, 10, 20])(
    'turns nothing back more than six times in a second at Beat %s',
    (beat) => {
      const scenes: [string, (time: number) => Partial<FrameOptions>][] = [
        ['a key held', (time) => ({ notes: [key(time)] })],
        ['a key let go', (time) => ({ notes: [key(time, time > 0.5 ? time - 0.5 : null)] })],
        [
          'a key struck again every beat',
          (time) => {
            const age = time % (1 / beat)
            return { notes: [key(age, age > 0.02 ? age - 0.02 : null, 440, 0.8)] }
          },
        ],
        ['no key', () => ({})],
      ]
      for (const ears of [0, 0.6, 1])
        for (const [what, notes] of scenes) {
          const frames = run({ beat, ears, scatter: ears === 1 ? 20 : 0 }, 2, (time) => ({
            signal: pulsing(beat, time),
            ...notes(time),
          }))
          expect(frames).toHaveLength(60)
          const { turns, moved } = mostTurns(frames)
          expect(turns, `${what}, Ears ${ears}`).toBeLessThanOrEqual(6)
          // It is a running display that was timed: the level, and with a key the marks, did move.
          expect(moved, `${what}, Ears ${ears}`).toBeGreaterThan(0)
        }
    },
  )
})
