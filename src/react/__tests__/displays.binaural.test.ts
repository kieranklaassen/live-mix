// The truth of the Binaural display: the arithmetic it is drawn from against
// the compiled device at 48 kHz (what each ear is given, sample by sample; the
// fold of a key; the glide's rate at the place the device reports; the bed's
// level; one key among others; the envelope), the drawing against that
// arithmetic, and the timed draw: two seconds at thirty frames a second with
// the level and the readings pulsing at the beat's rate, in which nothing that
// is drawn may turn back more than six times in any second.

import { describe, expect, it } from 'vitest'

import { BINAURAL_PARAMS } from '../../dsp/devices/binaural.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS, crisp, gainToDb } from '../components/display-kit'
import {
  BINAURAL_DRAWN_CYCLES,
  BINAURAL_FACES,
  BINAURAL_FLOOR_DB,
  BINAURAL_HOLD_SEC,
  BINAURAL_REST_HZ,
  BINAURAL_VOICE_AMP,
  binauralBedShare,
  binauralEars,
  binauralFold,
  binauralLayout,
  binauralMeanLevel,
  binauralRate,
  binauralRateText,
  binauralSounding,
  binauralSpan,
  binauralSpanText,
  binauralTimeText,
  binauralTimes,
  binauralTone,
} from '../components/displays/binaural'
import { pitchName } from '../components/displays/instrument-parts'
import {
  plateDisplay,
  type DisplayNote,
  type DisplaySignal,
  type PlateDisplay,
} from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  testLevel,
  testNotes,
  testSignal,
  type DrawnPath,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const BLOCK = 128
const display = BINAURAL_FACES.binaural.display

type Values = Readonly<Record<string, number>>
type Name = keyof typeof BINAURAL_PARAMS

/** A knob's value: what a test set, else the device's default. */
const valueOf =
  (values: Values = {}) =>
  (name: string): number =>
    values[name] ?? BINAURAL_PARAMS[name as Name].default

async function deviceAt(values: Values): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('binaural', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(BINAURAL_PARAMS[name as Name], value)
  return device
}

function keyDown(device: WasmDeviceHarness, id: number, hz: number, gain: number): void {
  const down = device.device.device_note_on
  if (!down) throw new Error('the device takes no notes')
  down(id, hz, gain)
}

function keyUp(device: WasmDeviceHarness, id: number): void {
  const up = device.device.device_note_off
  if (!up) throw new Error('the device takes no notes')
  up(id)
}

/** The glide's place as the device reports it: the one reading the display is given. */
function placeOf(device: WasmDeviceHarness): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(0)
}

interface Ears {
  left: Float32Array
  right: Float32Array
}

/** What comes out over the next `frames` samples, block by block. */
function render(device: WasmDeviceHarness, frames: number): Ears {
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  for (let done = 0; done < frames; done += BLOCK) {
    const count = Math.min(BLOCK, frames - done)
    device.device.device_process(count)
    left.set(device.view(device.device.device_out_left(), count), done)
    right.set(device.view(device.device.device_out_right(), count), done)
  }
  return { left, right }
}

/** The pitch of a wave that is one tone, in Hz, from where it crosses zero upward. */
function pitchOf(wave: Float32Array, from = 0, to = wave.length): number {
  let first = -1
  let last = -1
  let count = 0
  for (let n = from + 1; n < to; n++) {
    if (!(wave[n - 1] < 0 && wave[n] >= 0)) continue
    const at = n - 1 + wave[n - 1] / (wave[n - 1] - wave[n])
    if (first < 0) first = at
    last = at
    count++
  }
  return count < 2 ? 0 : ((count - 1) * RATE) / (last - first)
}

/** How strong the tone at `hz` is in a wave: its peak. Exact for a whole number of its cycles. */
function toneOf(wave: Float32Array, hz: number): number {
  let re = 0
  let im = 0
  for (let n = 0; n < wave.length; n++) {
    const turn = (2 * Math.PI * hz * n) / RATE
    re += wave[n] * Math.cos(turn)
    im += wave[n] * Math.sin(turn)
  }
  return (2 * Math.hypot(re, im)) / wave.length
}

const rmsOf = (wave: ArrayLike<number>, from: number): number => {
  let sum = 0
  for (let n = from; n < wave.length; n++) sum += wave[n] * wave[n]
  return Math.sqrt(sum / (wave.length - from))
}

describe('the Binaural display’s arithmetic against the device', () => {
  // One key from silence: the device restarts its beat at the crest, so sample
  // n stands n / 48000 seconds into the key and into the beat alike.
  const GAIN = 0.8
  const SETTINGS: readonly (readonly [string, Values])[] = [
    ['a pair, one tone an ear', {}],
    ['Ears at 0.8', { ears: 0.8 }],
    ['Ears at 0.5 and the fastest beat', { ears: 0.5, beat: 40 }],
    ['Ears at 0, the same in both ears', { ears: 0, beat: 10 }],
    ['Cross', { layout: 1 }],
    ['Cross at Ears 0.5 and the fastest beat', { layout: 1, ears: 0.5, beat: 40 }],
    ['no Warmth', { warmth: 0 }],
    ['all the Warmth there is', { warmth: 1, beat: 3 }],
    ['Cross with all the Warmth', { layout: 1, warmth: 1, ears: 0.8, beat: 0.5 }],
  ]
  // Both partials split between the ears, only the second, and neither.
  const KEYS = [110, 440, 587.33]

  for (const [name, values] of SETTINGS)
    it(`gives each ear what the device gives it, sample by sample: ${name}`, async () => {
      for (const hz of KEYS) {
        const device = await deviceAt({ ...values, attack: 0.01 })
        keyDown(device, 1, hz, GAIN)
        const out = render(device, Math.round(1.3 * RATE))
        const tone = binauralTone(valueOf(values), binauralFold(hz))
        const beat = valueOf(values)('beat')
        // The device holds the key's pitch as a float.
        const pitch = Math.fround(binauralFold(hz))
        const ears: [number, number] = [0, 0]
        let worst = 0
        let peak = 0
        // From a tenth of a second on, the key is at its full level.
        for (let n = Math.round(0.1 * RATE); n < out.left.length; n++) {
          binauralEars((n * pitch) / RATE, (n * beat) / RATE, tone, ears)
          const left = BINAURAL_VOICE_AMP * GAIN * ears[0]
          const right = BINAURAL_VOICE_AMP * GAIN * ears[1]
          worst = Math.max(worst, Math.abs(out.left[n] - left), Math.abs(out.right[n] - right))
          peak = Math.max(peak, Math.abs(out.left[n]))
        }
        // The device reads its sines from a table: a hundredth of a per cent of the key's peak.
        expect(worst, `${hz} Hz`).toBeLessThan(5e-5)
        expect(peak, `${hz} Hz`).toBeGreaterThan(0.05)
      }
    })

  it('folds a key by octaves into 80 Hz to 1 kHz, the left ear half of Beat above it', async () => {
    // C1, C7, a key under what the device takes (held to 8 Hz) and one on each edge.
    for (const hz of [32.7, 2093, 5, 80, 1000, 1001]) {
      const device = await deviceAt({ warmth: 0, attack: 0.01, beat: 6 })
      keyDown(device, 1, hz, GAIN)
      const out = render(device, 2 * RATE)
      const left = pitchOf(out.left, RATE / 2)
      const right = pitchOf(out.right, RATE / 2)
      expect((left + right) / 2, `${hz} Hz`).toBeCloseTo(binauralFold(hz), 2)
      expect(left - right, `${hz} Hz`).toBeCloseTo(6, 2)
    }
    expect(binauralFold(32.7)).toBeCloseTo(130.8, 6)
    expect(binauralFold(2093)).toBeCloseTo(523.25, 6)
    expect(binauralFold(5)).toBe(128)
    expect(binauralFold(1000)).toBe(1000)
    expect(binauralFold(1001)).toBe(500.5)
  })

  it('has the beat’s rate where the device reports its glide to be, on the way and once it holds', async () => {
    // Four to sixteen a second in three seconds.
    const values = { beat: 4, target: 16, glide: 0.05, warmth: 0, attack: 0.01 }
    const device = await deviceAt(values)
    // Armed: it waits for a key.
    render(device, RATE / 4)
    expect(placeOf(device)).toBe(0)
    keyDown(device, 1, 300, GAIN)
    render(device, RATE / 8)
    const span = RATE / 4
    const places: number[] = []
    let onTheWay = 0
    for (let step = 0; step < 16; step++) {
      const before = placeOf(device)
      const out = render(device, span)
      const after = placeOf(device)
      places.push(after)
      // The quarter second it lands in is part glide and part hold.
      if (before < 1 && after === 1) continue
      const measured = pitchOf(out.left) - pitchOf(out.right)
      const drawn = binauralRate(values.beat, values.target, values.glide, (before + after) / 2)
      expect(measured, `place ${before} to ${after}`).toBeCloseTo(drawn, 1)
      expect(Math.abs(measured - drawn)).toBeLessThan(0.04)
      if (after < 1) onTheWay++
    }
    expect(onTheWay).toBeGreaterThan(8)
    expect(places.every((place, i) => i === 0 || place >= places[i - 1])).toBe(true)
    expect(places[places.length - 1]).toBe(1)
    // By ratio: half way in time is half way in pitch, eight a second and not ten.
    expect(binauralRate(4, 16, 0.05, 0)).toBe(4)
    expect(binauralRate(4, 16, 0.05, 0.5)).toBeCloseTo(8, 9)
    expect(binauralRate(4, 16, 0.05, 1)).toBeCloseTo(16, 9)
    // With Glide at 0 the device stays at Beat, whatever Target says.
    const still = await deviceAt({ beat: 4, target: 16, glide: 0, warmth: 0, attack: 0.01 })
    keyDown(still, 1, 300, GAIN)
    const out = render(still, 2 * RATE)
    expect(pitchOf(out.left, RATE) - pitchOf(out.right, RATE)).toBeCloseTo(4, 2)
    expect(binauralRate(4, 16, 0, 0.5)).toBe(4)
  })

  it('has the bed as loud against a key as the device makes it', async () => {
    // At Ears 0 the tones are the same in both ears to the sample, so what is
    // left of left less right is the bed alone: two unlike noises.
    const quiet = 10 ** (-12 / 20)
    for (const [bed, colour] of [
      [1, 0],
      [0.5, 0],
      [1, 0.6],
      [0.7, 0.6],
    ]) {
      const device = await deviceAt({ ears: 0, bed, colour, warmth: 0, attack: 0.01, volume: -12 })
      keyDown(device, 1, 220, GAIN)
      const out = render(device, 6 * RATE)
      const apart = Float32Array.from(out.left, (left, n) => left - out.right[n])
      const measured = rmsOf(apart, RATE / 10) / Math.SQRT2 / quiet
      const drawn = binauralBedShare(bed) * BINAURAL_VOICE_AMP * GAIN
      expect(measured / drawn, `Bed ${bed}, Colour ${colour}`).toBeGreaterThan(0.92)
      expect(measured / drawn, `Bed ${bed}, Colour ${colour}`).toBeLessThan(1.08)
    }
    const bare = await deviceAt({ ears: 0, bed: 0, warmth: 0, attack: 0.01 })
    keyDown(bare, 1, 220, GAIN)
    const out = render(bare, RATE)
    expect(out.left.every((left, n) => left === out.right[n])).toBe(true)
    expect(binauralBedShare(0)).toBe(0)
  })

  it('has one key among others as tall as the device makes it', async () => {
    // Three keys, each a whole number of hertz, so a second holds whole cycles of every tone.
    const keys = [
      [200, 0.8],
      [300, 0.6],
      [420, 0.5],
    ] as const
    const device = await deviceAt({ beat: 6, warmth: 0, attack: 0.01 })
    keys.forEach(([hz, gain], id) => keyDown(device, id, hz, gain))
    render(device, RATE / 5)
    const out = render(device, RATE)
    const notes: DisplayNote[] = keys.map(([frequency, gain], id) => ({
      id,
      frequency,
      gain,
      age: 0.7,
      released: null,
    }))
    const times = binauralTimes(0.01, valueOf()('release'))
    const sounding = binauralSounding(notes, times)
    // The newest key, among three: its gain over the root of three.
    expect(sounding?.hz).toBe(420)
    expect(sounding?.level).toBeCloseTo(0.5 / Math.sqrt(3), 9)
    expect(toneOf(out.left, 423)).toBeCloseTo(BINAURAL_VOICE_AMP * (sounding?.level ?? 0), 5)
    // And alone it is as tall as its gain.
    expect(binauralSounding(notes.slice(0, 1), times)?.level).toBeCloseTo(0.8, 9)
    expect(binauralSounding([], times)).toBeNull()
  })

  it('swells and fades a key as the device does', async () => {
    const values = { attack: 0.4, release: 0.6, warmth: 0, beat: 6 }
    const device = await deviceAt(values)
    const times = binauralTimes(values.attack, values.release)
    const tone = binauralTone(valueOf(values), 220)
    keyDown(device, 1, 220, GAIN)
    const held = Math.round(0.8 * RATE)
    const first = render(device, held)
    keyUp(device, 1)
    const second = render(device, Math.round(0.9 * RATE))
    const ears: [number, number] = [0, 0]
    let worst = 0
    let seen = 0
    const levels: number[] = []
    for (let n = 0; n < held + second.left.length; n += 7) {
      const age = (n + 1) / RATE
      const note: DisplayNote = {
        id: 1,
        frequency: 220,
        gain: GAIN,
        age,
        released: n >= held ? (n + 1 - held) / RATE : null,
      }
      const level = binauralSounding([note], times)?.level ?? 0
      levels.push(level)
      binauralEars((n * 220) / RATE, (n * 6) / RATE, tone, ears)
      const out = n < held ? first.left[n] : second.left[n - held]
      worst = Math.max(worst, Math.abs(out - BINAURAL_VOICE_AMP * level * ears[0]))
      seen = Math.max(seen, Math.abs(out))
    }
    expect(worst).toBeLessThan(1e-4)
    expect(seen).toBeGreaterThan(0.1)
    // Half way up at a fifth of a second, full by the attack's end, a thousandth 0.6 s after the key is let go.
    const at = (seconds: number): number => levels[Math.round((seconds * RATE) / 7)]
    expect(at(0.2)).toBeGreaterThan(0.5 * GAIN)
    expect(at(0.2)).toBeLessThan(0.9 * GAIN)
    expect(at(0.5)).toBeCloseTo(GAIN, 6)
    expect(at(0.8 + 0.3)).toBeCloseTo(GAIN * 10 ** -1.5, 2)
    // Once the fade has ended there is no key to light the lanes.
    const gone: DisplayNote = { id: 1, frequency: 220, gain: GAIN, age: 3, released: 2 }
    expect(binauralSounding([gone], times)).toBeNull()
  })
})

// --- The drawing against the arithmetic -----------------------------------------

const draw = (options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, BINAURAL_PARAMS, options)

/** The two ears' tones as they are drawn: the lines 1.25 wide, in order. */
const lanesOf = (drawn: RecordingContext): DrawnPath[] =>
  drawnPaths(drawn).filter((path) => path.kind === 'stroke' && path.width === 1.25)

/** How often a lane's line crosses its middle. */
function crossings(path: DrawnPath, middle: number): number {
  let count = 0
  let side = 0
  for (const [, y] of path.points) {
    const now = Math.sign(middle - y)
    if (now !== 0 && side !== 0 && now !== side) count++
    if (now !== 0) side = now
  }
  return count
}

/** How wide the foot is filled. */
function footOf(drawn: RecordingContext, width = 128, height = 100): number {
  const { foot } = binauralLayout({ width, height })
  let fill = ''
  let wide = -1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'fillRect' && fill === PLAIN_COLOURS.accent) {
      const [, y, w, h] = call.args as number[]
      if (y === foot.y && h === foot.h) wide = w
    }
  }
  return wide
}

/** One key held for so long. */
const heldKey = (age: number, frequency = 261.63, gain = 0.8): DisplayNote[] => [
  { id: 60, frequency, gain, age, released: null },
]

/** A level that comes out, for a frame. */
const levelOut = (rms: number): DisplaySignal => {
  const signal = testSignal(0.5, 0.35)
  return { ...signal, output: { ...testLevel(rms * Math.SQRT2), rms } }
}

/** Frame after frame on one state, as the plate runs a display; every frame's drawing comes back. */
function runFrames(
  shown: PlateDisplay,
  seconds: number,
  options: FrameOptions,
  each?: (time: number) => Partial<FrameOptions>,
): RecordingContext[] {
  const state: unknown = shown.init?.()
  const frames: RecordingContext[] = []
  const count = Math.round(seconds * 30)
  for (let n = 0; n < count; n++)
    frames.push(
      drawDisplay(shown, BINAURAL_PARAMS, {
        ...options,
        ...each?.(n / 30),
        state,
        now: 10 + n / 30,
        dt: n === 0 ? 0 : 1 / 30,
      }),
    )
  return frames
}

describe('the Binaural display', () => {
  const SIZES = [
    [128, 100],
    [293, 100],
  ] as const

  it('draws each ear’s tone over time as the arithmetic has it, the left ear above', () => {
    const settings: Values[] = [
      {},
      { beat: 0.5 },
      { beat: 40, ears: 0.8 },
      { layout: 1 },
      { layout: 1, ears: 0.5, warmth: 1 },
      { warmth: 0, ears: 0.3 },
    ]
    for (const [width, height] of SIZES)
      for (const values of settings) {
        const lay = binauralLayout({ width, height })
        const lanes = lanesOf(draw({ values, width, height }))
        expect(lanes).toHaveLength(2)
        const tone = binauralTone(valueOf(values), BINAURAL_REST_HZ)
        const rate = valueOf(values)('beat')
        const beats = rate * binauralSpan(rate)
        ;[lay.left, lay.right].forEach((lane, ear) => {
          const path = lanes[ear]
          expect(path.colour).toBe(PLAIN_COLOURS.ink)
          expect(path.alpha).toBe(INK.trace)
          // A point a pixel, two when Warmth adds partials.
          expect(path.points.length).toBeGreaterThanOrEqual(lane.w)
          expect(path.points[0][0]).toBeCloseTo(lane.x, 9)
          expect(path.points[path.points.length - 1][0]).toBeCloseTo(lane.x + lane.w, 9)
          const middle = lane.y + lane.h / 2
          for (const [x, y] of path.points) {
            const along = (x - lane.x) / lane.w
            const ears = binauralEars(BINAURAL_DRAWN_CYCLES * along, beats * along, tone)
            expect(y).toBeCloseTo(middle - ears[ear] * lay.reach, 9)
            // Inside its lane.
            expect(Math.abs(y - middle)).toBeLessThanOrEqual(lane.h / 2)
          }
        })
        expect(lay.left.y + lay.left.h).toBeLessThan(lay.right.y)
      }
  })

  it('shows the left ear’s tone to be the higher, by the beats that stand across the lanes', () => {
    // At Ears 1 without Warmth each lane is one tone: eight cycles of the key
    // across, and half a cycle more or less for every beat.
    for (const [beat, beats] of [
      [0.5, 2.5],
      [6, 3],
      [10, 2],
      [40, 2],
    ]) {
      const lay = binauralLayout({ width: 293, height: 100 })
      const lanes = lanesOf(draw({ values: { beat, warmth: 0 }, width: 293 }))
      expect(beat * binauralSpan(beat)).toBeCloseTo(beats, 9)
      const left = crossings(lanes[0], lay.left.y + lay.left.h / 2)
      const right = crossings(lanes[1], lay.right.y + lay.right.h / 2)
      expect(left - right).toBe(2 * beats)
      expect(left + right).toBeGreaterThanOrEqual(4 * BINAURAL_DRAWN_CYCLES - 2)
      expect(left + right).toBeLessThanOrEqual(4 * BINAURAL_DRAWN_CYCLES)
    }
    // At Ears 0 the two ears are given the same.
    const lay = binauralLayout({ width: 128, height: 100 })
    const same = lanesOf(draw({ values: { ears: 0 } }))
    const apart = lay.right.y - lay.left.y
    same[0].points.forEach(([x, y], i) => {
      expect(same[1].points[i][0]).toBe(x)
      expect(same[1].points[i][1]).toBeCloseTo(y + apart, 9)
    })
  })

  it('holds two beats or a few more in the lanes at any rate, with a tick at each whole beat', () => {
    expect(binauralSpan(0.5)).toBe(5)
    expect(binauralSpan(6)).toBe(0.5)
    expect(binauralSpan(10)).toBe(0.2)
    expect(binauralSpan(40)).toBeCloseTo(0.05, 12)
    for (let rate = 0.5; rate <= 40; rate *= 1.07) {
      const beats = rate * binauralSpan(rate)
      expect(beats).toBeGreaterThanOrEqual(2 - 1e-9)
      expect(beats).toBeLessThan(3.4)
    }
    expect(binauralSpanText(5)).toBe('5 s')
    expect(binauralSpanText(1.5)).toBe('1.5 s')
    expect(binauralSpanText(0.75)).toBe('750 ms')
    expect(binauralSpanText(0.05)).toBe('50 ms')
    for (const [width, height] of SIZES)
      for (const beat of [0.5, 6, 7, 40]) {
        const lay = binauralLayout({ width, height })
        const drawn = draw({ values: { beat }, width, height })
        const beats = beat * binauralSpan(beat)
        const ticks = drawnPaths(drawn).filter(
          (path) =>
            path.points.length === 2 &&
            path.points[0][1] === lay.ticks &&
            path.points[1][1] === lay.ticks + 3,
        )
        const places = Array.from({ length: Math.floor(beats + 1e-9) + 1 }, (_, whole) =>
          crisp(lay.left.x + (whole / beats) * lay.left.w),
        )
        expect(ticks.map((tick) => tick.points[0][0])).toEqual(places)
        expect(drawn.words()).toContain(binauralSpanText(binauralSpan(beat)))
        expect(drawn.words()).toContain(`${binauralRateText(beat)} Hz`)
      }
  })

  it('says the layout and marks the two ears, and shows the bed as a band as tall as its level', () => {
    expect(draw().words()).toEqual(['L', 'R', '6 Hz', 'Pair', '500 ms'])
    expect(draw({ values: { layout: 1 } }).words()).toContain('Cross')
    const lay = binauralLayout({ width: 128, height: 100 })
    const bandOf = (bed: number): number[] => {
      const heights: number[] = []
      for (const call of draw({ values: { bed } }).calls)
        if (call.name === 'fillRect' && call.args[0] === lay.left.x && call.args[2] === lay.left.w)
          heights.push(call.args[3] as number)
      return heights
    }
    expect(bandOf(0)).toEqual([])
    for (const bed of [0.5, 1]) {
      const heights = bandOf(bed)
      expect(heights).toHaveLength(2)
      for (const height of heights)
        expect(height).toBeCloseTo(2 * binauralBedShare(bed) * lay.reach, 9)
    }
    // At Bed 1 it is as loud as one bare key: `kBedLevel` on noise of RMS 0.2 is 0.125, the RMS of a tone
    // that peaks at 0.175 to a hundredth.
    expect(binauralBedShare(1)).toBeCloseTo(0.125 / BINAURAL_VOICE_AMP, 12)
    expect(binauralBedShare(1) / Math.SQRT1_2).toBeCloseTo(1, 1)
  })

  it('lights the lanes while a key sounds, as tall as the key, and stands still while it is held', () => {
    for (const [width, height] of SIZES) {
      const lay = binauralLayout({ width, height })
      const values = { attack: 0.5 }
      const lanes = lanesOf(draw({ values, notes: heldKey(2, 440, 0.6), width, height }))
      expect(lanes).toHaveLength(4)
      // The pattern in the ink, standing back, and the key over it in the accent.
      expect(lanes.map((lane) => lane.colour)).toEqual([
        PLAIN_COLOURS.ink,
        PLAIN_COLOURS.accent,
        PLAIN_COLOURS.ink,
        PLAIN_COLOURS.accent,
      ])
      expect(lanes[0].alpha).toBe(INK.back)
      expect(lanes[1].alpha).toBe(1)
      // The key's own pitch decides which partials are split: 440 Hz has its third whole.
      const tone = binauralTone(valueOf(values), 440)
      expect(tone.splitSecond).toBe(true)
      expect(tone.splitThird).toBe(false)
      const middle = lay.left.y + lay.left.h / 2
      lanes[1].points.forEach(([x, y], i) => {
        const along = (x - lay.left.x) / lay.left.w
        const ears = binauralEars(BINAURAL_DRAWN_CYCLES * along, 3 * along, tone)
        expect(y).toBeCloseTo(middle - 0.6 * ears[0] * lay.reach, 9)
        expect(lanes[0].points[i][1]).toBeCloseTo(middle - ears[0] * lay.reach, 9)
      })
    }
    // Held, it is the same drawing two seconds in and ten: nothing in it follows the beat or the clock.
    const early = draw({ notes: heldKey(2), now: 12 })
    const late = draw({ notes: heldKey(10), now: 20 })
    expect(late.print()).toBe(early.print())
    expect(early.words()).toContain(`Pair ${pitchName(261.63)}`)
    // A key above the range is named where it sounds.
    expect(draw({ notes: heldKey(2, 2093) }).words()).toContain(`Pair ${pitchName(523.25)}`)
    // Among others the newest key is as tall as the device makes it.
    const chord = testNotes(4)
    const level = binauralSounding(chord, binauralTimes(1.5, 3))?.level ?? 0
    expect(level).toBeCloseTo(0.8 / Math.sqrt(3), 6)
    const lay = binauralLayout({ width: 128, height: 100 })
    const tall = (path: DrawnPath, middle: number): number =>
      Math.max(...path.points.map(([, y]) => Math.abs(y - middle)))
    const lit = lanesOf(draw({ notes: chord, values: { warmth: 0 } }))
    const middle = lay.left.y + lay.left.h / 2
    expect(tall(lit[1], middle) / tall(lit[0], middle)).toBeCloseTo(level, 6)
    // Bypassed, no key lights it.
    expect(lanesOf(draw({ notes: heldKey(2), powered: false }))).toHaveLength(2)
  })

  it('shows the glide from Beat to Target with a dot at the place the device reports', () => {
    const values = { beat: 10, target: 6, glide: 10 }
    const dotOf = (drawn: RecordingContext): number[] | undefined =>
      drawn.calls.find((call) => call.name === 'arc')?.args as number[] | undefined
    for (const [width, height] of SIZES) {
      const lay = binauralLayout({ width, height })
      for (const place of [0, 0.25, 0.5, 1]) {
        const drawn = draw({ values, meters: { glide: place }, width, height })
        const rate = binauralRate(10, 6, 10, place)
        const dot = dotOf(drawn)
        expect(dot?.[0]).toBeCloseTo(lay.glide.x + place * lay.glide.w, 9)
        // Beat is the higher rate here, so the line falls to the right and the dot with it.
        const from = lay.glide.y + lay.glide.reach * (1 - (2 * Math.log(10 / 0.5)) / Math.log(80))
        const to = lay.glide.y + lay.glide.reach * (1 - (2 * Math.log(6 / 0.5)) / Math.log(80))
        expect(to).toBeGreaterThan(from)
        expect(dot?.[1]).toBeCloseTo(from + place * (to - from), 9)
        if (place < 1) {
          expect(drawn.words()).toContain(`${binauralRateText(rate)} to 6 Hz`)
          expect(drawn.words()).toContain(binauralTimeText((1 - place) * 600))
        } else {
          expect(drawn.words()).toContain('6 Hz')
          expect(drawn.words().some((word) => word.includes(':'))).toBe(false)
        }
        // The lanes are drawn at the rate the glide has come to.
        const beats = rate * binauralSpan(rate)
        const lanes = lanesOf(drawn)
        const tone = binauralTone(valueOf(values), BINAURAL_REST_HZ)
        const [x, y] = lanes[0].points[lanes[0].points.length - 1]
        expect(x).toBeCloseTo(lay.left.x + lay.left.w, 9)
        expect(y).toBeCloseTo(
          lay.left.y +
            lay.left.h / 2 -
            binauralEars(BINAURAL_DRAWN_CYCLES, beats, tone)[0] * lay.reach,
          9,
        )
      }
    }
    expect(binauralTimeText(450)).toBe('7:30')
    expect(binauralTimeText(59.6)).toBe('1:00')
    expect(binauralRateText(binauralRate(10, 6, 10, 0.5))).toBe('7.7')
    // With Glide at 0 there is no glide to show, whatever the device reports.
    const off = draw({ values: { beat: 10, target: 6, glide: 0 }, meters: { glide: 0.5 } })
    expect(dotOf(off)).toBeUndefined()
    expect(off.words()).toContain('10 Hz')
  })

  it('takes the glide’s place from the device twice a second and no oftener', () => {
    const values = { beat: 10, target: 6, glide: 10 }
    const frames = runFrames(display, 2, { values }, (time) => ({ meters: { glide: time / 4 } }))
    const xs = frames.map(
      (frame) => (frame.calls.find((call) => call.name === 'arc')?.args as number[])[0],
    )
    const moves = xs.flatMap((x, i) => (i > 0 && x !== xs[i - 1] ? [i] : []))
    expect(moves).toEqual([15, 30, 45])
    expect(BINAURAL_HOLD_SEC).toBe(0.5)
    // A knob of the glide that moves is followed at once.
    const state: unknown = display.init?.()
    const at = (beat: number, now: number): string[] =>
      drawDisplay(display, BINAURAL_PARAMS, { values: { beat }, state, now, dt: 1 / 30 }).words()
    expect(at(6, 10)).toContain('6 Hz')
    expect(at(7, 10.033)).toContain('7 Hz')
  })

  it('fills the foot with the level over the last second, on a scale of sixty decibels', () => {
    const { foot } = binauralLayout({ width: 128, height: 100 })
    const shareOf = (gain: number): number => 1 - gainToDb(gain) / BINAURAL_FLOOR_DB
    const rms = 0.2
    const frames = runFrames(display, 3, {}, (time) => ({ signal: levelOut(time < 2 ? rms : 0) }))
    // A still draw and the first frame have no past: the foot is empty.
    expect(footOf(frames[0])).toBe(0)
    expect(footOf(draw({ signal: levelOut(rms) }))).toBe(0)
    // After a second and more of a steady level it stands at that level, to the pixel it moves by.
    for (const n of [35, 45, 59])
      expect(Math.abs(footOf(frames[n]) - shareOf(rms) * foot.w)).toBeLessThan(1)
    // Half a second in, half of the second's weight has the sound: 3 dB under.
    expect(Math.abs(footOf(frames[15]) - shareOf(rms * Math.SQRT1_2) * foot.w)).toBeLessThan(1)
    // It rises without turning back, and falls to nothing a second after the sound stops.
    const widths = frames.map((frame) => footOf(frame))
    for (let n = 1; n < 60; n++) expect(widths[n]).toBeGreaterThanOrEqual(widths[n - 1])
    for (let n = 61; n < 90; n++) expect(widths[n]).toBeLessThanOrEqual(widths[n - 1])
    expect(widths[89]).toBeLessThan(0.3 * widths[59])
    expect(widths[59]).toBeLessThanOrEqual(foot.w)
    // The mean itself: a steady level is that level, at any frame rate.
    for (const dt of [1 / 30, 1 / 60, 0.021]) {
      const state = { spans: [] as number[], powers: [] as number[] }
      let mean = 0
      for (let time = 0; time < 1.5; time += dt)
        mean = binauralMeanLevel(state, { signal: levelOut(rms), powered: true, dt })
      expect(mean).toBeCloseTo(rms, 9)
      expect(state.spans.length).toBeLessThanOrEqual(Math.ceil(1 / dt) + 1)
    }
  })
})

// --- The timed draw ---------------------------------------------------------------

/**
 * The most that anything drawn turns back in any one second of a run of
 * frames at thirty a second. Every number handed to the canvas is followed
 * from frame to frame (a place, a size, how strongly an ink is laid) and
 * counts once each time it changes direction; a word counts once each time it
 * changes; and a frame that is drawn with other calls than the one before
 * (something appears or goes) counts once for everything.
 */
function mostTurns(frames: readonly RecordingContext[]): number {
  const fps = 30
  // For every frame, how often the busiest thing in it had turned by then.
  const redraws = new Array<number>(frames.length).fill(0)
  const turnsAt: Map<number, number>[] = frames.map(() => new Map<number, number>())
  let shape = ''
  let last: number[] = []
  let words: string[] = []
  let heading: number[] = []
  frames.forEach((frame, n) => {
    const now = frame.numbers().map((number) => number.value)
    const said = frame.words()
    const calls = frame.calls.map((call) => call.name).join(',')
    if (n > 0 && calls !== shape) {
      redraws[n] = 1
      heading = []
    } else if (n > 0) {
      for (let k = 0; k < now.length; k++) {
        const step = Math.sign(now[k] - last[k])
        if (step === 0) continue
        if (heading[k] !== undefined && heading[k] !== 0 && heading[k] !== step)
          turnsAt[n].set(k, 1)
        heading[k] = step
      }
      // A word has no direction: every change of it counts. Words are numbered after the numbers.
      for (let k = 0; k < said.length; k++)
        if (said[k] !== words[k]) turnsAt[n].set(now.length + k, 1)
    }
    shape = calls
    last = now
    words = said
  })
  let most = 0
  for (let from = 0; from + fps <= frames.length || from === 0; from++) {
    const counts = new Map<number, number>()
    let all = 0
    let busiest = 0
    for (let n = from; n < Math.min(frames.length, from + fps); n++) {
      all += redraws[n]
      for (const k of turnsAt[n].keys()) {
        const count = (counts.get(k) ?? 0) + 1
        counts.set(k, count)
        busiest = Math.max(busiest, count)
      }
    }
    most = Math.max(most, all + busiest)
  }
  return most
}

/** The level and the reading of a frame, both pulsing at `rate` a second. */
const pulsing =
  (rate: number, lead = 0.3) =>
  (time: number): Partial<FrameOptions> => {
    const swing = Math.abs(Math.cos(Math.PI * rate * time + lead))
    return {
      signal: levelOut(0.35 * swing),
      meters: { glide: 0.5 + 0.4 * Math.sin(2 * Math.PI * rate * time + lead) },
      notes: testNotes(0.6 + time),
    }
  }

describe('the Binaural display, drawn for two seconds at thirty frames a second', () => {
  // A display that does what this one must not: its bar is as long as the level of the frame.
  const flashing = plateDisplay({
    place: 'window',
    columns: 2,
    params: ['beat'],
    live: { signal: true },
    info: 'A bar as long as the level that comes out in this frame, to prove the count of turns.',
    draw(frame) {
      frame.ctx.fillStyle = frame.colours.accent
      frame.ctx.fillRect(4, 90, 120 * (frame.signal?.output.rms ?? 0), 5)
    },
  })

  it('counts a bar that follows the level of each frame as flashing, and a slow swell as none', () => {
    const turns = (rate: number): number => mostTurns(runFrames(flashing, 2, {}, pulsing(rate)))
    // A level that pulses six times a second turns twelve times.
    expect(turns(6)).toBe(12)
    expect(turns(10)).toBeGreaterThan(6)
    expect(turns(40)).toBeGreaterThan(6)
    // Once in two seconds is no flash.
    expect(turns(0.5)).toBeLessThanOrEqual(2)
    // Words that change and things that come and go are counted too.
    const blinking = plateDisplay({
      ...flashing,
      draw(frame) {
        if (Math.round(frame.now * 30) % 2 === 0) frame.ctx.fillRect(4, 90, 20, 5)
      },
    })
    expect(mostTurns(runFrames(blinking, 2, {}))).toBeGreaterThan(20)
    const counting = plateDisplay({
      ...flashing,
      draw(frame) {
        frame.ctx.fillText(String(Math.round(frame.now * 30)), 4, 90)
      },
    })
    expect(mostTurns(runFrames(counting, 2, {}))).toBeGreaterThan(20)
  })

  // Beat at its slowest, its default, in the air and at its fastest, and two rates between whole numbers.
  for (const beat of [0.5, 6, 10, 40, 3.5, 7.3])
    for (const [width, height] of [
      [128, 100],
      [204, 100],
      [293, 100],
    ])
      it(`turns nothing back more than six times in any second at Beat ${beat}, ${width} wide`, () => {
        const settings: Values[] = [
          // No glide: the reading is not used.
          { beat },
          // A glide, with the device's reading of it pulsing at the beat's rate.
          { beat, target: beat > 5 ? 2 : 30, glide: 5 },
          // The beat in the air, where the level that comes out pulses most; a bed, Cross.
          { beat, ears: 0, bed: 0.5, layout: 1, warmth: 1, target: 12, glide: 0.5 },
        ]
        for (const values of settings) {
          const frames = runFrames(display, 2, { values, width, height }, pulsing(beat))
          expect(frames).toHaveLength(60)
          expect(mostTurns(frames), JSON.stringify(values)).toBeLessThanOrEqual(6)
          // And the run is one that shows something: a key lights the lanes and the foot fills.
          expect(lanesOf(frames[59])).toHaveLength(4)
          expect(footOf(frames[59], width, height)).toBeGreaterThan(0)
        }
      })
})
