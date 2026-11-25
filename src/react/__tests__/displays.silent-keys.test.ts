// The truth of the Silent Keys display: the keys it draws against the keys the
// compiled device says it holds, for every shape, spacing and root; its bars
// against the strings the device reads out and against the sound that comes
// out; the walk and its turn; the damper's fall; the points that are dragged;
// and the timed draw: nothing on it turns back more than six times in any
// second, however fast the list walks and whatever wakes the strings.

import { describe, expect, it } from 'vitest'

import { SILENT_KEYS_METERS, SILENT_KEYS_PARAMS } from '../../dsp/devices/silent-keys.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SILENT_CHORDS,
  SILENT_FOOT_DB,
  SILENT_HIGHEST,
  SILENT_KEYS_FACES,
  SILENT_KEYS_MOST,
  SILENT_LOWEST,
  SILENT_SHAPES,
  SILENT_TOP_DB,
  silentBass,
  silentCellX,
  silentChordOf,
  silentEvery,
  silentFall,
  silentInWalk,
  silentKeyX,
  silentKeys,
  silentLayout,
  silentNoteName,
  silentNoteOfX,
  silentRange,
  silentRing,
  silentShare,
  silentWhites,
} from '../components/displays/silent-keys'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import { drawDisplay, viewOf, type RecordingContext } from './display-harness'

const RATE = 48000
const face = SILENT_KEYS_FACES['silent-keys']
const { display } = face
const SIZE = { width: 128, height: 100 }
const UPRIGHT = { width: 204, height: 100 }

type Values = Readonly<Record<string, number>>
type Name = keyof typeof SILENT_KEYS_PARAMS
const METERS = Object.keys(SILENT_KEYS_METERS)

const valueOf =
  (values: Values = {}) =>
  (name: string): number =>
    values[name] ?? SILENT_KEYS_PARAMS[name as Name].default

/** Values that set all eight chords alike, so that the stretch of keyboard is that chord's. */
const all = (shape: number, root: number): Values =>
  Object.fromEntries(
    Array.from({ length: 8 }, (_, k): [string, number][] => [
      [`shape${k + 1}`, shape],
      [`root${k + 1}`, root],
    ]).flat(),
  )

async function deviceAt(values: Values = {}): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('silent-keys', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(SILENT_KEYS_PARAMS[name as Name], value)
  return device
}

const meter = (device: WasmDeviceHarness, name: string): number => {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(METERS.indexOf(name))
}
const readings = (device: WasmDeviceHarness): Record<string, number> =>
  Object.fromEntries(METERS.map((name) => [name, meter(device, name)]))
/** The keys the device says it holds. */
const heldOf = (device: WasmDeviceHarness): number[] =>
  Array.from({ length: SILENT_KEYS_MOST }, (_, k) => meter(device, `note${k + 1}`)).filter(
    (note) => note >= 0,
  )

/** Run so many blocks of 128 with a sound made from the sample count; what came out of both sides. */
function run(
  device: WasmDeviceHarness,
  seconds: number,
  input: (n: number) => number = () => 0,
  from = 0,
): { left: Float32Array; right: Float32Array } {
  const blocks = Math.round((seconds * RATE) / 128)
  const left = new Float32Array(blocks * 128)
  const right = new Float32Array(blocks * 128)
  const block = new Float32Array(128)
  for (let b = 0; b < blocks; b++) {
    for (let i = 0; i < 128; i++) block[i] = input(from + b * 128 + i)
    device.processBlock(block)
    left.set(device.view(device.device.device_out_left(), 128), b * 128)
    right.set(device.view(device.device.device_out_right(), 128), b * 128)
  }
  return { left, right }
}

/** Noise that is the same every time. */
function noise(level: number): (n: number) => number {
  let seed = 1
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return level * (seed / 2147483648 - 1)
  }
}

interface Painted {
  colour: string
  alpha: number
  x: number
  y: number
  w: number
  h: number
}
/** Every rectangle that was filled, with what it was filled in. */
function rects(drawn: RecordingContext): Painted[] {
  let colour = ''
  let alpha = 1
  const out: Painted[] = []
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      out.push({ colour, alpha, x, y, w, h })
    }
  }
  return out
}
/** The bars, by where their middles are: what stands on the keyboard's back edge in the second colour. */
const barsOf = (drawn: RecordingContext, size = SIZE): Painted[] => {
  const { strings, keys } = silentLayout(size)
  return rects(drawn).filter(
    (one) =>
      one.colour === PLAIN_COLOURS.accent &&
      Math.abs(one.y + one.h - keys.y) < 1e-6 &&
      one.y >= strings.y - 1e-6,
  )
}
/** The strings' lines, by where they are: upright, from the top of the strings to the keyboard. */
function linesOf(drawn: RecordingContext, size = SIZE): { x: number; dashed: boolean }[] {
  const { strings, keys } = silentLayout(size)
  const out: { x: number; dashed: boolean }[] = []
  let at: [number, number][] = []
  let dashed = false
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') at = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      at.push(call.args as [number, number])
    else if (call.name === 'setLineDash') dashed = (call.args[0] as number[]).length > 0
    else if (call.name === 'stroke' && at.length === 2) {
      const [[x, y], [x2, y2]] = at
      if (x === x2 && y === strings.y && y2 === keys.y) out.push({ x, dashed })
    }
  }
  return out
}
/** The keys that are lit, by note, and how brightly. */
function litOf(drawn: RecordingContext, values: Values, size = SIZE): Map<number, number> {
  const { keys } = silentLayout(size)
  const range = silentRange(valueOf(values), keys.w)
  const out = new Map<number, number>()
  for (const one of rects(drawn)) {
    if (one.colour !== PLAIN_COLOURS.accent || one.y !== keys.y) continue
    const note = Array.from({ length: range.high - range.low + 1 }, (_, k) => range.low + k).find(
      (key) => Math.abs(silentKeyX(key, range, keys) - (one.x + one.w / 2)) < 1e-6,
    )
    if (note === undefined) throw new Error('a key is lit that is none')
    // A white key is as wide as the keyboard's share, a black one under it: never two keys on one middle.
    out.set(note, one.alpha)
  }
  return out
}

describe('the keys of a chord against the device', () => {
  it("keeps the device's own numbers", () => {
    expect([SILENT_CHORDS, SILENT_KEYS_MOST, SILENT_LOWEST, SILENT_HIGHEST]).toEqual([
      8, 6, 12, 108,
    ])
    expect(SILENT_SHAPES.length).toBe(SILENT_KEYS_PARAMS.shape1.choices.length)
    for (const shape of SILENT_SHAPES) expect(shape.length).toBeLessThanOrEqual(6)
  })

  it('holds the keys the device holds, at rest and before any sound, for every shape, spacing and root', async () => {
    const device = await deviceAt()
    let checked = 0
    for (let spacing = 0; spacing < 3; spacing++) {
      device.set(SILENT_KEYS_PARAMS.spacing, spacing)
      for (let shape = 1; shape < SILENT_SHAPES.length; shape++) {
        device.set(SILENT_KEYS_PARAMS.shape1, shape)
        for (let root = 0; root <= 60; root++) {
          device.set(SILENT_KEYS_PARAMS.root1, root)
          const keys = silentKeys(valueOf({ spacing, shape1: shape, root1: root }), 0)
          expect(keys, `${shape} ${spacing} ${root}`).toEqual(heldOf(device))
          checked++
        }
      }
    }
    expect(checked).toBe(3 * 24 * 61)
  })

  it('holds the six keys of the Keys shape as the device does: in order, none twice, none for Off', async () => {
    const device = await deviceAt({ shape1: 0 })
    let seed = 7
    for (let n = 0; n < 500; n++) {
      const values: Record<string, number> = { shape1: 0, spacing: n % 3, root1: n % 61 }
      for (let k = 1; k <= 6; k++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        values[`key${k}`] = seed % 3 === 0 ? 0 : (seed >>> 8) % (n % 2 ? 98 : 8)
      }
      for (const [name, value] of Object.entries(values))
        device.set(SILENT_KEYS_PARAMS[name as Name], value)
      expect(silentKeys(valueOf(values), 0)).toEqual(heldOf(device))
    }
    // A chord of no keys at all is one, too.
    for (let k = 1; k <= 6; k++) device.set(SILENT_KEYS_PARAMS[`key${k}` as Name], 0)
    expect(heldOf(device)).toEqual([])
    expect(silentKeys(valueOf({ shape1: 0 }), 0)).toEqual([])
  })

  it('holds the chord Chord points at, of eight, and says the first five as they are', async () => {
    const device = await deviceAt()
    const value = valueOf()
    for (let chord = 0; chord < 8; chord++) {
      device.set(SILENT_KEYS_PARAMS.chord, chord + 1)
      expect(meter(device, 'held')).toBe(silentChordOf(chord + 1) + 1)
      expect(silentKeys(value, chord), `chord ${chord + 1}`).toEqual(heldOf(device))
    }
    expect(silentKeys(value, 0).map(silentNoteName)).toEqual(['A2', 'C3', 'E3', 'G3'])
    expect(silentKeys(value, 1).map(silentNoteName)).toEqual(['F2', 'A2', 'C3', 'E3'])
    expect(silentKeys(value, 2).map(silentNoteName)).toEqual(['C3', 'E3', 'G3', 'B3', 'D4'])
    expect(silentKeys(value, 3).map(silentNoteName)).toEqual(['G2', 'B2', 'D3', 'E3'])
    expect(silentKeys(value, 4).map(silentNoteName)).toEqual(['D3', 'F3', 'A3', 'C4', 'E4'])
  })

  it('names a root as the knob does', () => {
    SILENT_KEYS_PARAMS.root1.choices.forEach((name, k) => expect(silentNoteName(24 + k)).toBe(name))
    SILENT_KEYS_PARAMS.key1.choices.forEach((name, k) => {
      if (k > 0) expect(silentNoteName(11 + k)).toBe(name)
    })
  })

  it('puts the bass strings one and two octaves under the lowest key, where the device has them', async () => {
    for (const root of [0, 5, 12, 21]) {
      const values = { ...all(2, root), bass: 1 }
      const device = await deviceAt(values)
      run(device, 1, noise(0.2))
      const keys = silentKeys(valueOf(values), 0)
      const bass = silentBass(valueOf(values), keys)
      expect(bass.length).toBe(root < 12 ? 1 : 2)
      expect(bass).toEqual([keys[0] - 12, keys[0] - 24].slice(0, bass.length))
      expect(meter(device, 'bass1') > 0).toBe(true)
      expect(meter(device, 'bass2') > 0).toBe(bass.length > 1)
    }
    expect(silentBass(valueOf(), [45])).toEqual([])
    expect(silentBass(valueOf({ bass: 0.5 }), [])).toEqual([])
    expect(silentBass(valueOf({ bass: 0.5 }), [23])).toEqual([])
  })
})

describe('the keyboard of the Silent Keys display', () => {
  it('is laid out from the size it is given: the list, the name, the strings, the keys, their octaves', () => {
    expect(silentLayout(SIZE)).toEqual({
      cells: { x: 5, y: 4, w: 118, h: 10 },
      cell: 14.75,
      track: 20,
      base: 33,
      left: 6,
      right: 122,
      strings: { x: 5, y: 37, w: 118, h: 28 },
      keys: { x: 5, y: 65, w: 118, h: 20 },
      octaves: 96,
    })
    for (const shape of [SIZE, UPRIGHT, { width: 293, height: 100 }]) {
      const lay = silentLayout(shape)
      expect(lay.track + 4.5).toBeLessThanOrEqual(lay.base - 8)
      expect(lay.base).toBeLessThan(lay.strings.y)
      expect(lay.strings.y + lay.strings.h).toBe(lay.keys.y)
      // A ring on the front of a key ends above the octaves' names, 6 px tall.
      expect(lay.keys.y + lay.keys.h + 4.5).toBeLessThanOrEqual(lay.octaves - 6)
    }
  })

  it('shows whole octaves that hold every key of all eight chords, whichever is held', () => {
    expect(silentRange(valueOf())).toEqual({ low: 36, high: 72 })
    for (const chord of [1, 4, 8])
      expect(silentRange(valueOf({ chord }))).toEqual({ low: 36, high: 72 })
    const many: Values[] = [
      {},
      { bass: 1 },
      { spacing: 2 },
      { spacing: 2, bass: 0.3 },
      all(16, 60),
      all(1, 0),
      { ...all(0, 0), key1: 1, key2: 97 },
      all(0, 0),
    ]
    for (const values of many) {
      const value = valueOf(values)
      for (const width of [0, 118, 194, 1800]) {
        const range = silentRange(value, width)
        expect(range.low % 12).toBe(0)
        expect(range.high % 12).toBe(0)
        expect(range.low).toBeGreaterThanOrEqual(SILENT_LOWEST)
        expect(range.high).toBeLessThanOrEqual(SILENT_HIGHEST)
        expect(range.high - range.low).toBeGreaterThanOrEqual(36)
        for (let chord = 0; chord < 8; chord++) {
          const keys = silentKeys(value, chord)
          for (const note of [...keys, ...silentBass(value, keys)]) {
            expect(note).toBeGreaterThanOrEqual(range.low)
            expect(note).toBeLessThanOrEqual(range.high)
          }
        }
      }
      // On either plate nothing is added for width; a plate opened upright shows all there is.
      expect(silentRange(value, 194)).toEqual(silentRange(value))
      expect(silentRange(value, 1800)).toEqual({ low: 12, high: 108 })
    }
  })

  it('stands a white key at its middle and a black one on the line between two, and finds them again', () => {
    const box = { x: 5, y: 0, w: 110, h: 10 }
    const range = { low: 36, high: 72 }
    expect(silentWhites(range)).toBe(22)
    expect(silentKeyX(36, range, box)).toBeCloseTo(5 + 2.5, 9)
    expect(silentKeyX(37, range, box)).toBeCloseTo(5 + 5, 9)
    expect(silentKeyX(41, range, box)).toBeCloseTo(5 + 17.5, 9)
    expect(silentKeyX(72, range, box)).toBeCloseTo(5 + 110 - 2.5, 9)
    for (let note = 36; note <= 72; note++) {
      const x = silentKeyX(note, range, box)
      expect(silentNoteOfX(x, range, box)).toBe(note)
      if (note > 36) expect(x).toBeGreaterThan(silentKeyX(note - 1, range, box))
    }
  })

  it('draws a line for each key the device holds, at rest, for every shape in every spacing, and lights it', async () => {
    for (const size of [SIZE, UPRIGHT]) {
      const { keys } = silentLayout(size)
      for (let shape = 1; shape < SILENT_SHAPES.length; shape++) {
        for (let spacing = 0; spacing < 3; spacing++) {
          const values = { shape1: shape, root1: 17, spacing, chord: 1 }
          const device = await deviceAt(values)
          const notes = heldOf(device)
          const range = silentRange(valueOf(values), keys.w)
          const drawn = drawDisplay(display, SILENT_KEYS_PARAMS, { values, ...size })
          const lines = linesOf(drawn, size)
          expect(lines.length).toBe(notes.length)
          notes.forEach((note, k) => {
            // A line is set on the row of pixels its key's middle falls in.
            expect(lines[k].x).toBe(Math.floor(silentKeyX(note, range, keys)) + 0.5)
            expect(lines[k].dashed).toBe(false)
          })
          const lit = litOf(drawn, values, size)
          expect([...lit.keys()].sort((a, b) => a - b)).toEqual(notes)
          for (const much of lit.values()) expect(much).toBeCloseTo(0.45, 9)
          // Nothing sounds: no bar.
          expect(barsOf(drawn, size)).toEqual([])
        }
      }
    }
  })

  it('says the chord as the knobs do, or the keys of the Keys shape by name', () => {
    const words = (values: Values): string[] =>
      drawDisplay(display, SILENT_KEYS_PARAMS, { values }).words()
    const list = ['1', '2', '3', '4', '5', '6', '7', '8']
    expect(words({})).toEqual([...list, 'A2 Minor 7', 'Close', 'C2', 'C3', 'C4', 'C5'])
    expect(words({ chord: 5, spacing: 2 }).slice(8, 10)).toEqual(['D3 Minor 9', 'Wide'])
    expect(words({ shape1: 0, key1: 37, key2: 44, key3: 37 }).slice(8, 9)).toEqual(['C3 G3'])
    expect(words({ shape1: 0 }).slice(8, 9)).toEqual(['No key held'])
  })
})

describe('what the Silent Keys display says is heard, against the device at 48 kHz', () => {
  it('reads a string as loud as it comes out, and shows it as high', async () => {
    // One string of one partial, alone: what comes out of the two sides together is that string.
    for (const [root, level] of [
      [21, 0.3],
      [33, 0.05],
      [45, 0.01],
    ]) {
      const values = { ...all(1, root), partials: 1, mix: 1, ring: 8 }
      const device = await deviceAt(values)
      const note = 24 + root
      const hz = 440 * 2 ** ((note - 69) / 12)
      run(device, 1, (n) => level * Math.sin((2 * Math.PI * hz * n) / RATE))
      run(device, 0.2)
      const meters = readings(device)
      const read = meters.string1
      const { left, right } = run(device, 0.1)
      let sum = 0
      for (let i = 0; i < left.length; i++) sum += left[i] ** 2 + right[i] ** 2
      const heard = Math.sqrt((2 * sum) / left.length)
      // It rings 8 s, so it has fallen by under half a dB since.
      expect(Math.abs(20 * Math.log10(heard / read)), `${root}`).toBeLessThan(0.6)
      for (const size of [SIZE, UPRIGHT]) {
        const bars = barsOf(
          drawDisplay(display, SILENT_KEYS_PARAMS, { values, meters, ...size }),
          size,
        )
        const { keys, strings } = silentLayout(size)
        expect(bars.length).toBe(1)
        const range = silentRange(valueOf(values), keys.w)
        expect(bars[0].x + bars[0].w / 2).toBeCloseTo(silentKeyX(note, range, keys), 6)
        const said = (20 * Math.log10(read) - SILENT_FOOT_DB) / (SILENT_TOP_DB - SILENT_FOOT_DB)
        expect(bars[0].h / strings.h).toBeCloseTo(Math.min(1, said), 6)
      }
    }
  })

  it('climbs the strings the sound woke and no others: a low C lights C and G of C E G, and hardly E', async () => {
    const values = { ...all(2, 24), mix: 1 }
    const device = await deviceAt(values)
    // A tenth of a second of a C2 with four partials (C2, C3, G3, C4), then nothing. (Its fifth, E4,
    // is the second of the E3 string.)
    const hz = 440 * 2 ** ((36 - 69) / 12)
    run(device, 0.1, (n) => {
      const fade = Math.min(1, n / 480, (4800 - n) / 480)
      let out = 0
      for (let k = 1; k <= 4; k++) out += Math.sin((2 * Math.PI * hz * k * n) / RATE) / k
      return 0.2 * fade * out
    })
    run(device, 0.3)
    const drawn = drawDisplay(display, SILENT_KEYS_PARAMS, { values, meters: readings(device) })
    const { keys, strings } = silentLayout(SIZE)
    const range = silentRange(valueOf(values), keys.w)
    const tall = (note: number): number =>
      barsOf(drawn).find(
        (bar) => Math.abs(bar.x + bar.w / 2 - silentKeyX(note, range, keys)) < 1e-6,
      )?.h ?? 0
    const perDb = strings.h / (SILENT_TOP_DB - SILENT_FOOT_DB)
    expect(tall(48)).toBeGreaterThan(0.4 * strings.h)
    expect(tall(55)).toBeGreaterThan(0.25 * strings.h)
    expect(tall(48) - tall(52)).toBeGreaterThan(12 * perDb)
    expect(tall(55) - tall(52)).toBeGreaterThan(6 * perDb)
    // The keys are lit by as much.
    const lit = litOf(drawn, values)
    for (const note of [48, 52, 55])
      expect(lit.get(note)).toBeCloseTo(0.45 + (0.55 * tall(note)) / strings.h, 6)
  })

  it('shows every string of a chord under noise at the level the device reads out, the bass strings too', async () => {
    const values = { shape1: 22, root1: 19, spacing: 1, bass: 0.8, mix: 1 }
    const device = await deviceAt(values)
    run(device, 2, noise(0.3))
    const meters = readings(device)
    const notes = silentKeys(valueOf(values), 0)
    const bass = silentBass(valueOf(values), notes)
    expect([notes.length, bass.length]).toEqual([6, 2])
    for (const size of [SIZE, UPRIGHT]) {
      const { keys, strings } = silentLayout(size)
      const range = silentRange(valueOf(values), keys.w)
      const drawn = drawDisplay(display, SILENT_KEYS_PARAMS, { values, meters, ...size })
      const bars = barsOf(drawn, size)
      expect(bars.length).toBe(8)
      const check = (note: number, read: number): void => {
        const x = silentKeyX(note, range, keys)
        const bar = bars.find((one) => Math.abs(one.x + one.w / 2 - x) < 1e-6)
        expect(bar?.h).toBeCloseTo(silentShare(20 * Math.log10(read)) * strings.h, 6)
      }
      notes.forEach((note, k) => check(note, meters[`string${k + 1}`]))
      bass.forEach((note, k) => check(note, meters[`bass${k + 1}`]))
      expect(linesOf(drawn, size).filter((line) => line.dashed).length).toBe(2)
      expect(linesOf(drawn, size).length).toBe(8)
    }
  })

  it("lets an old string fall as its damper has it fall: the fundamental's own rate", async () => {
    expect(silentRing(5, 220)).toBe(5)
    expect(silentRing(5, 2200)).toBeCloseTo(5 * 10 ** -0.4, 9)
    expect(silentRing(5, 20)).toBe(7.5)
    for (const [root, ring, damper] of [
      [21, 5, 400],
      [33, 1, 1000],
      [45, 10, 4000],
      [9, 30, 2000],
      [33, 0.3, 200],
    ]) {
      // One string of one partial; then a chord with no key held, so that nothing else sounds.
      const values = { ...all(1, root), shape2: 0, partials: 1, mix: 1, ring, damper }
      const device = await deviceAt(values)
      const note = 24 + root
      const hz = 440 * 2 ** ((note - 69) / 12)
      run(device, 1, (n) => 0.3 * Math.sin((2 * Math.PI * hz * n) / RATE))
      device.set(SILENT_KEYS_PARAMS.chord, 2)
      run(device, 0.05)
      const fall = silentFall(ring, damper, hz)
      // As long as it takes to fall about 20 dB, in whole blocks.
      const level = (): number => {
        const { left, right } = run(device, 0.02)
        let sum = 0
        for (let i = 0; i < left.length; i++) sum += left[i] ** 2 + right[i] ** 2
        return 10 * Math.log10(sum)
      }
      const blocks = Math.max(1, Math.round(((20 / fall) * RATE) / 128))
      const before = level()
      run(device, (blocks * 128) / RATE)
      const after = level()
      const seconds = (blocks * 128 + Math.round((0.02 * RATE) / 128) * 128) / RATE
      const said = fall * seconds
      expect(Math.abs((before - after) / said - 1), `${root} ${ring} ${damper}`).toBeLessThan(0.04)
    }
  })

  it('goes round the chords of a walk as the device does, with how far each has come', async () => {
    const values = { every: 1, count: 3, chord: 2, ...{ lift: 22 } }
    expect(silentEvery(1)).toBe(1)
    expect([silentEvery(0), silentEvery(0.12), silentEvery(0.13), silentEvery(0.25)]).toEqual([
      0, 0, 0.25, 0.25,
    ])
    const device = await deviceAt(values)
    const hiss = noise(0.1)
    const seen: number[] = []
    const { cells, cell } = silentLayout(SIZE)
    for (let n = 0; n < 13; n++) {
      // Read at 0.3 and 0.8 of each second, near enough.
      run(device, n === 0 ? 0.3 : 0.5, hiss)
      const meters = readings(device)
      const chord = meters.held - 1
      seen.push(chord + 1)
      const drawn = drawDisplay(display, SILENT_KEYS_PARAMS, { values, meters })
      const painted = rects(drawn)
      // The held cell is the one filled whole.
      const filled = painted.filter(
        (one) => one.colour === PLAIN_COLOURS.ink && one.alpha === 1 && one.y === cells.y,
      )
      expect(filled.length).toBe(1)
      expect(filled[0].x).toBeCloseTo(cells.x + chord * cell + 0.5, 9)
      // The other cells of the walk are shaded: three, of which one is filled.
      const shaded = painted.filter(
        (one) => one.colour === PLAIN_COLOURS.ink && one.alpha < 1 && one.y === cells.y,
      )
      expect(shaded.length).toBe(2)
      for (let k = 0; k < 8; k++) expect(silentInWalk(k, 3)).toBe(k < 3)
      // The turn under it.
      const turn = painted.find((one) => one.colour === PLAIN_COLOURS.accent && one.h === 2)
      expect(turn?.x).toBeCloseTo(cells.x + chord * cell + 0.5, 9)
      expect(turn?.w).toBeCloseTo((cell - 1) * meters.turn, 9)
      expect(meters.turn).toBeGreaterThan(0.25)
      expect(meters.turn).toBeLessThan(0.85)
      // And the strings of that chord.
      const { keys } = silentLayout(SIZE)
      const range = silentRange(valueOf(values), keys.w)
      expect(linesOf(drawn).map((line) => line.x)).toEqual(
        heldOf(device).map((note) => Math.floor(silentKeyX(note, range, keys)) + 0.5),
      )
    }
    // From Chord, up to Count, and round to the first.
    expect(seen).toEqual([2, 2, 3, 3, 1, 1, 2, 2, 3, 3, 1, 1, 2])
  })
})

describe('the points of the Silent Keys display', () => {
  const handlesAt = (values: Values = {}, size = SIZE): readonly DisplayHandle[] =>
    display.handles?.(viewOf(display, SILENT_KEYS_PARAMS, { values, ...size })) ?? []
  const named = (key: string, values: Values = {}, size = SIZE): DisplayHandle => {
    const found = handlesAt(values, size).find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }
  const lay = silentLayout(SIZE)

  it('picks a chord by the ring under its cell, from the first to the eighth', () => {
    const chord = named('chord')
    expect([chord.x, chord.y]).toEqual([silentCellX(0, lay), lay.track])
    for (let k = 0; k < 8; k++) expect(chord.drag(silentCellX(k, lay), 0)).toEqual({ chord: k + 1 })
    expect(chord.drag(-90, 0)).toEqual({ chord: 1 })
    expect(chord.drag(900, 0)).toEqual({ chord: 8 })
    const fifth = named('chord', { chord: 5, every: 3 })
    expect(fifth.x).toBe(silentCellX(4, lay))
    expect(fifth.drag(fifth.x, fifth.y)).toEqual({ chord: 5 })
    expect(fifth.wheel?.(1)).toEqual({ chord: 6 })
    expect(fifth.wheel?.(-9)).toEqual({ chord: 1 })
    expect(fifth.reset?.()).toEqual({ chord: 1 })
  })

  it('moves the root of the held chord along the keys, and steps its shape with the wheel', () => {
    for (const size of [SIZE, UPRIGHT]) {
      const { keys } = silentLayout(size)
      for (const chord of [1, 3, 8]) {
        const values = { chord }
        const range = silentRange(valueOf(values), keys.w)
        const root = named('root', values, size)
        const name = `root${chord}`
        const now = valueOf(values)(name)
        expect(root.x).toBeCloseTo(silentKeyX(24 + now, range, keys), 9)
        expect(root.y).toBe(keys.y + keys.h)
        expect(root.drag(root.x, root.y)).toEqual({ [name]: now })
        for (let note = range.low; note <= range.high; note++)
          expect(root.drag(silentKeyX(note, range, keys), 0)).toEqual({ [name]: note - 24 })
        const shape = `shape${chord}`
        expect(root.wheel?.(1)).toEqual({ [shape]: valueOf()(shape) + 1 })
        // Never as far as Keys, which has no root.
        expect(root.wheel?.(-40)).toEqual({ [shape]: 1 })
        expect(root.wheel?.(40)).toEqual({ [shape]: 24 })
        expect(root.reset?.()).toEqual({ [name]: valueOf()(name) })
      }
    }
    // Past the knob's ends it stays at them.
    const low = named('root', { ...all(1, 0) })
    expect(low.drag(0, 0)).toEqual({ root1: 0 })
  })

  it('reads a drag on the keyboard that was drawn when it was taken, so it does not run from the hand', () => {
    // From the octave C2 to C5, down to C2 itself: the picture then shows an octave more below.
    const before = silentRange(valueOf(all(2, 21)), lay.keys.w)
    const moved = { ...all(2, 21), root1: 12 }
    expect(silentRange(valueOf(moved), lay.keys.w).low).toBe(before.low - 12)
    const hold: DisplayHold = {}
    const taken = named('root', all(2, 21))
    expect(taken.drag(taken.x, taken.y, hold)).toEqual({ root1: 21 })
    const x = silentKeyX(36, before, lay.keys)
    expect(named('root', all(2, 21)).drag(x, 0, hold)).toEqual({ root1: 12 })
    // The plate asks for the handles again, at the setting the drag has made.
    expect(named('root', moved).drag(x, 0, hold)).toEqual({ root1: 12 })
    // Taken once more, it goes on down.
    const again = named('root', moved)
    expect(
      again.drag(silentKeyX(30, silentRange(valueOf(moved), lay.keys.w), lay.keys), 0, {}),
    ).toEqual({ root1: 6 })
  })

  it('has a ring on each key of the Keys shape, and none for Off', () => {
    const values = { shape1: 0, key1: 34, key3: 41, key6: 50 }
    expect(handlesAt(values).map((handle) => handle.key)).toEqual(['chord', 'key1', 'key3', 'key6'])
    const range = silentRange(valueOf(values), lay.keys.w)
    const third = named('key3', values)
    expect(third.name).toBe('Key 3')
    expect(third.x).toBeCloseTo(silentKeyX(52, range, lay.keys), 9)
    expect(third.drag(third.x, third.y)).toEqual({ key3: 41 })
    expect(third.drag(silentKeyX(49, range, lay.keys), 0)).toEqual({ key3: 38 })
    expect(third.reset?.()).toEqual({ key3: 0 })
  })

  it('leaves the keys alone while the list walks, which holds other chords than they would set', () => {
    for (const shape1 of [0, 6])
      expect(handlesAt({ every: 1, shape1, key1: 40 }).map((handle) => handle.key)).toEqual([
        'chord',
      ])
    expect(handlesAt({ every: 0.1 }).map((handle) => handle.key)).toEqual(['chord', 'root'])
  })

  it('draws its points where they stand', () => {
    for (const values of [
      {},
      { chord: 4 },
      { every: 2, chord: 3 },
      { shape1: 0, key2: 40, key4: 60 },
    ] as Values[]) {
      const drawn = drawDisplay(display, SILENT_KEYS_PARAMS, { values })
      const rings = drawn.calls
        .filter((call) => call.name === 'arc' && call.args[2] === 3.5)
        .map((call) => [call.args[0], call.args[1]])
      expect(rings).toEqual(handlesAt(values).map((handle) => [handle.x, handle.y]))
    }
  })
})

describe('the Silent Keys display in time', () => {
  /** A device run as the page runs it: thirty frames a second, read and drawn after each. */
  async function timed(
    values: Values,
    seconds: number,
    input: (n: number) => number,
  ): Promise<RecordingContext[]> {
    const device = await deviceAt(values)
    const state = display.init?.()
    const out: RecordingContext[] = []
    let n = 0
    for (let k = 0; k < seconds * 30; k++) {
      while (n < ((k + 1) / 30) * RATE) {
        run(device, 128 / RATE, input, n)
        n += 128
      }
      out.push(
        drawDisplay(display, SILENT_KEYS_PARAMS, {
          values,
          meters: readings(device),
          state,
          now: 10 + k / 30,
          dt: 1 / 30,
        }),
      )
    }
    return out
  }

  /** The most times a series turns back within any one second at thirty frames. */
  function mostTurns(series: readonly number[]): number {
    const turns: number[] = []
    let way = 0
    for (let n = 1; n < series.length; n++) {
      const move = series[n] - series[n - 1]
      if (Math.abs(move) < 1e-6) continue
      if (way !== 0 && Math.sign(move) !== way) turns.push(n)
      way = Math.sign(move)
    }
    let most = 0
    for (let first = 0; first < turns.length; first++) {
      let last = first
      while (last < turns.length && turns[last] - turns[first] < 30) last++
      most = Math.max(most, last - first)
    }
    return most
  }

  /** How tall the bar over a place is in each frame, 0 for none. */
  const tallest = (frames: readonly RecordingContext[], x: number): number[] =>
    frames.map(
      (drawn) => barsOf(drawn).find((bar) => Math.abs(bar.x + bar.w / 2 - x) < 1e-6)?.h ?? 0,
    )

  it('never turns a bar back more than six times a second, with clicks ten times a second on short strings', async () => {
    const hiss = noise(0.8)
    const clicks = (n: number): number => (n % 4800 < 480 ? hiss(n) : 0)
    for (const ring of [0.2, 0.6]) {
      const values = { ring, mix: 1, sharpness: 0.1, lift: 30 }
      const frames = await timed(values, 4, clicks)
      const { keys } = silentLayout(SIZE)
      const range = silentRange(valueOf(values), keys.w)
      let moved = 0
      for (const note of silentKeys(valueOf(values), 0)) {
        const series = tallest(frames, silentKeyX(note, range, keys))
        // It does move: up and down by some.
        moved = Math.max(moved, Math.max(...series.slice(60)) - Math.min(...series.slice(60)))
        expect(mostTurns(series), `${note} at ${ring}`).toBeLessThanOrEqual(6)
      }
      expect(moved).toBeGreaterThan(1)
    }
  }, 60_000)

  it('shows no more than three chords a second of a list that walks four, and one at a time', async () => {
    const values = { every: 0.25, count: 8, mix: 1 }
    const frames = await timed(values, 4, noise(0.3))
    const { cells, cell } = silentLayout(SIZE)
    const shown = frames.map((drawn) => {
      const filled = rects(drawn).filter(
        (one) => one.colour === PLAIN_COLOURS.ink && one.alpha === 1 && one.y === cells.y,
      )
      expect(filled.length).toBe(1)
      return Math.round((filled[0].x - cells.x - 0.5) / cell)
    })
    const changes = shown.flatMap((one, n) => (n > 0 && one !== shown[n - 1] ? [n] : []))
    expect(changes.length).toBeGreaterThan(8)
    for (let k = 1; k < changes.length; k++)
      expect(changes[k] - changes[k - 1]).toBeGreaterThanOrEqual(10)
    // How far a chord has come is not shown: it would come round four times a second.
    for (const drawn of frames)
      expect(rects(drawn).some((one) => one.colour === PLAIN_COLOURS.accent && one.h === 2)).toBe(
        false,
      )
    // The bars of one key, over the whole of it, keep to six turns a second as well.
    const { keys } = silentLayout(SIZE)
    const range = silentRange(valueOf(values), keys.w)
    for (let note = range.low; note <= range.high; note++)
      expect(
        mostTurns(tallest(frames, silentKeyX(note, range, keys))),
        String(note),
      ).toBeLessThanOrEqual(6)
  }, 60_000)

  it('goes on showing a string whose damper is down, falling, with no line over it, and then not at all', async () => {
    const values: Record<string, number> = {
      ...all(1, 21),
      root2: 26,
      damper: 1000,
      ring: 10,
      mix: 1,
    }
    const device = await deviceAt(values)
    const state = display.init?.()
    const { keys, strings } = silentLayout(SIZE)
    const range = silentRange(valueOf(values), keys.w)
    const x = silentKeyX(45, range, keys)
    const hiss = noise(0.3)
    const tall: number[] = []
    const lines: number[] = []
    for (let k = 0; k < 90; k++) {
      if (k === 45) {
        values.chord = 2
        device.set(SILENT_KEYS_PARAMS.chord, 2)
      }
      run(device, 1600 / RATE, hiss)
      const drawn = drawDisplay(display, SILENT_KEYS_PARAMS, {
        values: { ...values },
        meters: readings(device),
        state,
        now: 10 + k / 30,
        dt: 1 / 30,
      })
      tall.push(barsOf(drawn).find((bar) => Math.abs(bar.x + bar.w / 2 - x) < 1e-6)?.h ?? 0)
      lines.push(linesOf(drawn).filter((line) => line.x === Math.floor(x) + 0.5).length)
    }
    expect(lines.slice(0, 45)).toEqual(Array.from({ length: 45 }, () => 1))
    expect(lines.slice(45)).toEqual(Array.from({ length: 45 }, () => 0))
    expect(tall[44]).toBeGreaterThan(0.3 * strings.h)
    // It falls by what its damper says: 60 dB in a little under a second, a bar that only sinks.
    const perFrame =
      ((silentFall(10, 1000, 110) / 30) * strings.h) / (SILENT_TOP_DB - SILENT_FOOT_DB)
    for (let k = 46; k < 90; k++) expect(tall[k]).toBeLessThanOrEqual(tall[k - 1])
    for (let k = 55; k < 60; k++) expect(tall[k - 1] - tall[k]).toBeCloseTo(perFrame, 1)
    expect(tall[89]).toBe(0)
  })

  it('stands as at rest when it is switched off, whatever the readings say', () => {
    const meters = { ...Object.fromEntries(METERS.map((name) => [name, 0.4])), held: 5, note1: 45 }
    const off = drawDisplay(display, SILENT_KEYS_PARAMS, {
      values: { every: 2 },
      meters,
      powered: false,
    })
    expect(barsOf(off)).toEqual([])
    expect(off.words()).toContain('A2 Minor 7')
    // And readings that are no numbers draw no bar.
    for (const bad of [Number.NaN, Infinity, -1]) {
      const drawn = drawDisplay(display, SILENT_KEYS_PARAMS, {
        meters: { ...meters, held: bad, string1: bad, turn: bad },
      })
      for (const { value } of drawn.numbers()) expect(Number.isFinite(value)).toBe(true)
    }
  })

  it('has the chord, its ring, its lift and its share on the face, and every knob in one section', () => {
    expect(face.face).toEqual(['chord', 'ring', 'lift', 'mix'])
    expect((face.sections ?? []).flat().sort()).toEqual(Object.keys(SILENT_KEYS_PARAMS).sort())
    // Two rows to a section: each root stands over its own shape.
    const chords = (face.sections ?? []).slice(1, 3)
    for (const section of chords)
      section.slice(0, 4).forEach((root, k) => {
        expect(root.replace('root', 'shape')).toBe(section[4 + k])
      })
  })
})
