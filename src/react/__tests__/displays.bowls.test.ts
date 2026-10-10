// The truth of Bowls' display: the table it draws against the table the
// compiled device lays (its .wasm, played notes and noise), the beat it shows
// against the beat the device reports, what is lit against what comes out,
// and each handle against the control it sets.
//
// The constants here are copied from `cpp/devices/bowls/bowls.h` and are not
// read from the display, so a display that drifts from the device fails.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  BOWLS_FACES,
  BOWL_SCALES,
  beatHz,
  bowlGlow,
  bowlName,
  bowlRadius,
  bowlSquash,
  bowlTurn,
  bowlsLayout,
  bowlsTable,
  firstStep,
  noteOfStep,
  registerOfY,
  ringOfX,
  slotBeat,
  slotPlace,
  xOfRing,
  xOfSlot,
  yOfRegister,
  yOfRow,
} from '../components/displays/bowls'
import { type DisplayHandle } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const BLOCK = 128

// bowls.h: kMaxBowls, kScaleSize and kScaleNotes, kLowNote, kRegisterSpan, kBeatHz, kBeatSpread.
const SLOTS = 12
const SCALES = [
  [0, 2, 4, 7, 9],
  [0, 3, 5, 7, 10],
  [0, 2, 4, 5, 7, 9, 11],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 2, 7],
  [0, 2, 4, 6, 8, 10],
  [0, 2, 3, 7, 8],
  [0, 1, 3, 7, 8],
]
const LOW_NOTE = 36
const REGISTER_NOTES = 36
const BEAT_AT_FULL = 5
const BEAT_SPREAD = 0.3

const descriptor = stockDescriptors().get('bowls')
if (!descriptor) throw new Error('no device bowls')
const params: Readonly<Record<string, ParamSpec>> = descriptor.params
const display = BOWLS_FACES.bowls.display
const METER_NAMES = Object.keys(descriptor.meters ?? {})

const hzOf = (note: number): number => 440 * Math.pow(2, (note - 69) / 12)

/** The compiled device at some settings (set while it sleeps, so they hold at once). */
async function compiled(values: Record<string, number> = {}): Promise<WasmDeviceHarness> {
  const loaded = await loadWasmDevice('bowls', RATE)
  for (const [name, value] of Object.entries(values)) loaded.set(params[name], value)
  return loaded
}

/** Play `seconds` of `sample(n)` into both sides; the mean square that came out of each side over the last `keep` seconds. */
function play(
  loaded: WasmDeviceHarness,
  seconds: number,
  sample: (n: number) => number,
  keep = seconds,
): { left: number; right: number } {
  const total = Math.round((seconds * RATE) / BLOCK) * BLOCK
  const from = total - Math.round(keep * RATE)
  const block = new Float32Array(BLOCK)
  let left = 0
  let right = 0
  let count = 0
  for (let done = 0; done < total; done += BLOCK) {
    for (let i = 0; i < BLOCK; i += 1) block[i] = sample(done + i)
    loaded.processBlock(block)
    const outL = loaded.view(loaded.device.device_out_left(), BLOCK)
    const outR = loaded.view(loaded.device.device_out_right(), BLOCK)
    for (let i = 0; i < BLOCK; i += 1) {
      if (done + i < from) continue
      left += outL[i] * outL[i]
      right += outR[i] * outR[i]
      count += 1
    }
  }
  return { left: left / Math.max(1, count), right: right / Math.max(1, count) }
}

/** A sine of a note that comes in over a tenth of a second (an abrupt start is an attack, which rings every bowl). */
const swell =
  (note: number, gain = 0.25) =>
  (n: number): number =>
    gain * Math.min(1, n / (0.1 * RATE)) * Math.sin((2 * Math.PI * hzOf(note) * n) / RATE)

/** White noise that is the same every run. */
function noise(gain = 1): (n: number) => number {
  let seed = 12345
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return gain * (seed / 2147483648 - 1)
  }
}

const silence = (): number => 0

/** The device's readings as the plate hands them to the display. */
function metersOf(loaded: WasmDeviceHarness): Record<string, number> {
  const read = loaded.device.device_meter
  if (!read) throw new Error('bowls reports no meters')
  return Object.fromEntries(METER_NAMES.map((name, index) => [name, read(index)]))
}

/** One slot's six bits of a reading, unpacked here by hand: four slots to a reading, the lowest slot lowest. */
function digitOf(meters: Record<string, number>, family: 'levels' | 'beats', slot: number): number {
  const packed = meters[`${family}${Math.floor(slot / 4) + 1}`]
  return Math.floor(packed / 64 ** (slot % 4)) % 64
}

interface Drawn {
  x: number
  y: number
  rx: number
  ry: number
  turn: number
  /** How strongly it was filled in the accent: 0 for a bowl left empty. */
  lit: number
}

/** Every bowl a drawing holds, in the order drawn. */
function bowlsOf(drawn: RecordingContext): Drawn[] {
  const found: Drawn[] = []
  let alpha = 1
  let fill: unknown = null
  for (const call of drawn.calls) {
    if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'set fillStyle') fill = call.args[0]
    else if (call.name === 'ellipse') {
      const [x, y, rx, ry, turn] = call.args as number[]
      found.push({ x, y, rx, ry, turn, lit: 0 })
    } else if (call.name === 'fill' && fill === PLAIN_COLOURS.accent && found.length > 0) {
      const last = found[found.length - 1]
      if (last.lit === 0) last.lit = alpha
    } else if (call.name === 'beginPath' && found.length > 0 && found[found.length - 1].lit === 0) {
      // A new path: what is filled from here on is not that bowl.
      found[found.length - 1].lit = -1
    }
  }
  return found.map((bowl) => ({ ...bowl, lit: Math.max(0, bowl.lit) }))
}

function handleOf(key: string, values: Record<string, number> = {}, size = {}): DisplayHandle {
  const found = display
    .handles?.(viewOf(display, params, { values, ...size }))
    .find((h) => h.key === key)
  if (!found) throw new Error(`bowls has no handle ${key}`)
  return found
}

/** The two shapes a plate is drawn in: the window beside the knobs, and upright as a pedal. */
const SHAPES = [displaySize(display), { width: 204, height: 100 }]

describe('the table Bowls draws', () => {
  it('lays the default table as bowls.h does: eight bowls of C major pentatonic from G3, in slots 1 to 8', () => {
    // Register 0.5 is note 54; the first note of the scale at or over 53.5 is G3 (55), step 13 from C1.
    const table = bowlsTable(0, 0, 8, 0.5)
    expect(table.map((bowl) => bowl.note)).toEqual([55, 57, 60, 62, 64, 67, 69, 72])
    expect(table.map((bowl) => bowl.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(table.map((bowl) => bowlName(bowl.note)).join(' ')).toBe('G3 A3 C4 D4 E4 G4 A4 C5')
  })

  it('counts the steps of every scale as the header does', () => {
    expect(BOWL_SCALES).toEqual(SCALES)
    for (let scale = 0; scale < SCALES.length; scale += 1) {
      const size = SCALES[scale].length
      for (const root of [0, 4, 9, 11]) {
        for (let step = 0; step < 5 * size; step += 1) {
          // note_of_step(): 24 + root + 12 * (step / size) + notes[step % size].
          const note = 24 + root + 12 * Math.floor(step / size) + SCALES[scale][step % size]
          expect(noteOfStep(scale, root, step)).toBe(note)
        }
      }
    }
  })

  it('starts at the first step at or over Register, to the half note the header takes off', () => {
    for (let scale = 0; scale < SCALES.length; scale += 1) {
      for (const register of [0, 0.125, 0.3, 0.5, 0.58, 0.875, 1]) {
        const base = LOW_NOTE + REGISTER_NOTES * register
        const step = firstStep(scale, 9, register)
        expect(noteOfStep(scale, 9, step)).toBeGreaterThanOrEqual(base - 0.5)
        if (step > 0) expect(noteOfStep(scale, 9, step - 1)).toBeLessThan(base - 0.5)
      }
    }
    // Moving Register keeps a bowl in its slot: the slot is the step, not the place in the row.
    const low = bowlsTable(0, 0, 8, 0.5)
    const high = bowlsTable(0, 0, 8, 0.56)
    for (const bowl of high) {
      const same = low.find((other) => other.note === bowl.note)
      if (same) expect(same.slot).toBe(bowl.slot)
    }
  })

  it('puts the slots where slot_place() does and beats them as slot_beat() does', () => {
    const places = new Set<number>()
    for (let slot = 0; slot < SLOTS; slot += 1) {
      // slot_place(): ((slot * 5) % 12 - 5.5) / 5.5.
      expect(slotPlace(slot)).toBeCloseTo((((slot * 5) % 12) - 5.5) / 5.5, 12)
      places.add(Math.round(slotPlace(slot) * 1000))
      // slot_beat(): 1 - kBeatSpread + 2 * kBeatSpread * frac(slot * 0.618034).
      const turn = slot * 0.618034
      const share = 1 - BEAT_SPREAD + 2 * BEAT_SPREAD * (turn - Math.floor(turn))
      expect(slotBeat(slot)).toBeCloseTo(share, 12)
      // tune(): kBeatHz * beat * beat * slot_beat(slot) between the two modes of the lowest pair.
      expect(beatHz(0.4, slot)).toBeCloseTo(BEAT_AT_FULL * 0.16 * share, 12)
      expect(beatHz(0, slot)).toBe(0)
    }
    expect(places.size).toBe(SLOTS)
    expect(slotPlace(0)).toBe(-1)
    expect(slotPlace(7)).toBe(1)
  })

  it("is the compiled device's table: noise rings the slots the picture has bowls in, and no others", async () => {
    const cases: Record<string, number>[] = [
      {},
      { root: 9, scale: 3, bowls: 12, register: 0.4 },
      { root: 9, scale: 4, bowls: 5, register: 0.3 },
      { root: 4, scale: 7, bowls: 7, register: 0.45 },
      { scale: 5, bowls: 9, register: 0.6 },
      { root: 11, scale: 6, bowls: 3, register: 1 },
      { root: 9, scale: 4, bowls: 12, register: 1 },
    ]
    // Register on the very edges the header rounds at: 36 + 36 r - 0.5 a whole note.
    for (let n = 0; n <= 36; n += 3) cases.push({ root: n % 12, scale: n % 8, register: n / 36 })
    for (let n = 1; n < 72; n += 10) cases.push({ root: 5, scale: 2, register: n / 72 })
    for (const values of cases) {
      const loaded = await compiled({ ...values, mix: 1 })
      play(loaded, 0.5, noise())
      const meters = metersOf(loaded)
      const rung: number[] = []
      for (let slot = 0; slot < SLOTS; slot += 1)
        if (digitOf(meters, 'levels', slot) > 0) rung.push(slot)
      const drawn = bowlsTable(
        values.root ?? 0,
        values.scale ?? 0,
        values.bowls ?? 8,
        values.register ?? 0.5,
      )
      expect(rung, JSON.stringify(values)).toEqual(
        drawn.map((bowl) => bowl.slot).sort((a, b) => a - b),
      )
    }
  })

  it("is the compiled device's table: a note played rings its own bowl most, on the side the picture has it", async () => {
    const settings: Record<string, number>[] = [
      { spread: 1 },
      { root: 9, scale: 3, bowls: 12, register: 0.4, spread: 1 },
      { root: 4, scale: 7, bowls: 7, register: 0.45, spread: 1 },
    ]
    for (const values of settings) {
      const table = bowlsTable(
        values.root ?? 0,
        values.scale ?? 0,
        values.bowls ?? 8,
        values.register ?? 0.5,
      )
      for (const bowl of [table[0], table[Math.floor(table.length / 2)], table[table.length - 1]]) {
        const loaded = await compiled({ ...values, mix: 1, beat: 0 })
        const out = play(loaded, 1.5, swell(bowl.note), 0.5)
        const meters = metersOf(loaded)
        let loudest = 0
        for (let slot = 1; slot < SLOTS; slot += 1)
          if (digitOf(meters, 'levels', slot) > digitOf(meters, 'levels', loudest)) loudest = slot
        expect(loudest, `${bowlName(bowl.note)} of ${JSON.stringify(values)}`).toBe(bowl.slot)
        // Left of the middle in the picture is more out of the left, and the further the more.
        const lean = 10 * Math.log10(out.right / out.left)
        expect(Math.sign(lean)).toBe(Math.sign(slotPlace(bowl.slot)))
        if (Math.abs(slotPlace(bowl.slot)) > 0.8) expect(Math.abs(lean)).toBeGreaterThan(10)
      }
    }
  })
})

describe('what Bowls reports and what the picture makes of it', () => {
  it('turns a bowl at the rate its two modes beat on the compiled device', async () => {
    for (const beat of [1, 0.4]) {
      const table = bowlsTable(0, 0, 8, 0.5)
      for (const bowl of [table[1], table[6]]) {
        const loaded = await compiled({ mix: 1, beat, ring: 20 })
        play(loaded, 1, swell(bowl.note))
        // Two seconds of ringing on, read block by block; the reading is 64ths of a turn and wraps.
        let before = digitOf(metersOf(loaded), 'beats', bowl.slot)
        let turned = 0
        const blocks = Math.round((2 * RATE) / BLOCK)
        for (let n = 0; n < blocks; n += 1) {
          play(loaded, BLOCK / RATE, silence)
          const now = digitOf(metersOf(loaded), 'beats', bowl.slot)
          turned += ((now - before + 96) % 64) - 32
          before = now
        }
        const hz = turned / 64 / ((blocks * BLOCK) / RATE)
        const want = BEAT_AT_FULL * beat * beat * slotBeat(bowl.slot)
        expect(Math.abs(hz), `Beat ${beat}, ${bowlName(bowl.note)}`).toBeGreaterThan(want * 0.95)
        expect(Math.abs(hz)).toBeLessThan(want * 1.05)
        expect(beatHz(beat, bowl.slot)).toBeCloseTo(want, 12)
      }
    }
  })

  it('holds a bowl still at Beat 0, as the compiled device does', async () => {
    const bowl = bowlsTable(0, 0, 8, 0.5)[6]
    const loaded = await compiled({ mix: 1, beat: 0 })
    play(loaded, 1, swell(bowl.note))
    const first = digitOf(metersOf(loaded), 'beats', bowl.slot)
    let moved = 0
    for (let n = 0; n < 40; n += 1) {
      play(loaded, 0.05, silence)
      const now = digitOf(metersOf(loaded), 'beats', bowl.slot)
      moved = Math.max(moved, Math.abs(((now - first + 96) % 64) - 32))
    }
    expect(moved).toBeLessThanOrEqual(1)
    // The picture turns a bowl by half the angle between its modes: a ring out of round looks the same after half a turn.
    expect(bowlTurn(0)).toBe(0)
    expect(bowlTurn(32)).toBeCloseTo(Math.PI / 2, 12)
    expect(bowlTurn(63)).toBeCloseTo((Math.PI * 63) / 64, 12)
  })

  it('reads the level the compiled device puts out: the readings add up to the wet sound, and Mix scales it', async () => {
    // A reading is a bowl's level over its beat (the squared sizes of its modes); at a moment of the
    // beat what comes out is up to 3 dB over that, or far under. So: the fastest beat, and a second of it.
    for (const mix of [1, 0.35]) {
      const loaded = await compiled({ mix, beat: 1, ring: 40 })
      play(loaded, 0.6, noise())
      // The input over, only the bowls come out. A second of that, and the readings in its middle.
      play(loaded, 0.3, silence)
      const first = play(loaded, 0.5, silence)
      const meters = metersOf(loaded)
      const second = play(loaded, 0.5, silence)
      let power = 0
      for (let slot = 0; slot < SLOTS; slot += 1) {
        const reading = digitOf(meters, 'levels', slot)
        // read_levels(): 63 + 10 log10 of the squared sizes of a bowl's six modes (a size squared is twice a mean square).
        if (reading > 0) power += 10 ** ((reading - 63) / 10)
      }
      const out = first.left + first.right + second.left + second.right
      const wet = Math.sin((mix * Math.PI) / 2)
      const heardDb = 10 * Math.log10(out)
      const readDb = 10 * Math.log10(power * wet * wet)
      expect(heardDb, `Mix ${mix}`).toBeGreaterThan(readDb - 1.5)
      expect(heardDb).toBeLessThan(readDb + 1.5)
    }
  })

  it('reads nothing once the compiled device has gone to sleep', async () => {
    const loaded = await compiled({ mix: 1, ring: 0.5 })
    play(loaded, 0.3, noise())
    expect(metersOf(loaded).levels1).toBeGreaterThan(0)
    play(loaded, 6, silence)
    for (const name of METER_NAMES) expect(metersOf(loaded)[name]).toBe(0)
  })

  it('lights a bowl by what is heard of it: its reading less what Mix takes', () => {
    expect(bowlGlow(0, 1)).toBe(0)
    expect(bowlGlow(40, 0)).toBe(0)
    // Lit from a reading of 9 (-54 dBFS) to full at 51 (-12 dBFS), evenly by dB.
    expect(bowlGlow(9, 1)).toBe(0)
    expect(bowlGlow(30, 1)).toBeCloseTo(0.5, 12)
    expect(bowlGlow(51, 1)).toBe(1)
    expect(bowlGlow(63, 1)).toBe(1)
    // kit::equal_power: the wet gain is sin(Mix * pi / 2), which is 3.01 dB down at a half.
    expect(bowlGlow(30, 0.5)).toBeCloseTo((30 - 3.0103 - 9) / 42, 4)
    expect(bowlGlow(30, 0.35)).toBeCloseTo(
      (30 + 20 * Math.log10(Math.sin(0.35 * Math.PI * 0.5)) - 9) / 42,
      10,
    )
    for (let reading = 1; reading < 63; reading += 1)
      expect(bowlGlow(reading + 1, 0.35)).toBeGreaterThanOrEqual(bowlGlow(reading, 0.35))
  })

  it("draws the device's own readings: the bowl that rings is lit and turned, the rest are not", async () => {
    const bowl = bowlsTable(0, 0, 8, 0.5)[6]
    const loaded = await compiled({ mix: 0.35, beat: 1 })
    play(loaded, 1.5, swell(bowl.note, 0.5))
    const meters = metersOf(loaded)
    const reading = digitOf(meters, 'levels', bowl.slot)
    expect(reading).toBeGreaterThan(30)
    const drawn = bowlsOf(
      drawDisplay(display, params, { values: { beat: 1 }, meters, signal: testSignal() }),
    )
    expect(drawn).toHaveLength(8)
    const lit = drawn[6]
    expect(lit.lit).toBeCloseTo(0.15 + 0.75 * bowlGlow(reading, 0.35), 10)
    expect(lit.turn).toBeCloseTo((Math.PI * digitOf(meters, 'beats', bowl.slot)) / 64, 10)
    for (const other of drawn) expect(other.lit).toBeLessThanOrEqual(lit.lit)
    // At Mix 0 nothing of the bowls is heard, and nothing is lit, though the device still rings inside.
    const dry = bowlsOf(
      drawDisplay(display, params, { values: { beat: 1, mix: 0 }, meters, signal: testSignal() }),
    )
    expect(dry.every((b) => b.lit === 0 && b.turn === 0)).toBe(true)
    // With the plate's power off, or no sound to read, the table lies at rest.
    const off = bowlsOf(
      drawDisplay(display, params, { meters, signal: testSignal(), powered: false }),
    )
    expect(off.every((b) => b.lit === 0)).toBe(true)
  })
})

describe('the picture of the table', () => {
  it('draws each bowl at its slot, in rows by pitch: the lower the larger and the nearer, in both shapes', () => {
    const settings: Record<string, number>[] = [
      {},
      { root: 9, scale: 3, bowls: 12, register: 0.4, spread: 1 },
      { root: 9, scale: 4, bowls: 12, register: 1, spread: 1, beat: 1 },
      { bowls: 3, register: 0, spread: 0.2 },
    ]
    for (const size of SHAPES) {
      const at = bowlsLayout(size)
      expect(bowlRadius(36, at)).toBe(at.big)
      expect(bowlRadius(66, at)).toBeCloseTo((at.big + at.small) / 2, 10)
      expect(bowlRadius(96, at)).toBe(at.small)
      expect(bowlRadius(120, at)).toBe(at.small)
      // Twelve rows, evenly, the first at the foot.
      expect(yOfRow(0, at) - yOfRow(1, at)).toBeCloseTo((yOfRow(0, at) - yOfRow(11, at)) / 11, 10)
      expect(yOfRow(0, at) - yOfRow(1, at)).toBeGreaterThan(3)
      for (const values of settings) {
        const table = bowlsTable(
          values.root ?? 0,
          values.scale ?? 0,
          values.bowls ?? 8,
          values.register ?? 0.5,
        )
        const drawn = bowlsOf(drawDisplay(display, params, { values, ...size }))
        expect(drawn).toHaveLength(table.length)
        table.forEach((bowl, n) => {
          const spread = values.spread ?? 0.6
          expect(drawn[n].x).toBeCloseTo(xOfSlot(bowl.slot, spread, at), 10)
          expect(drawn[n].y).toBeCloseTo(yOfRow(n, at), 10)
          const radius = bowlRadius(bowl.note, at)
          expect((drawn[n].rx + drawn[n].ry) / 2).toBeCloseTo(radius, 10)
          // All of it lies inside the picture.
          expect(drawn[n].x - drawn[n].rx).toBeGreaterThanOrEqual(0)
          expect(drawn[n].x + drawn[n].rx).toBeLessThanOrEqual(size.width)
          expect(drawn[n].y - drawn[n].rx).toBeGreaterThanOrEqual(0)
          expect(drawn[n].y + drawn[n].rx).toBeLessThanOrEqual(size.height)
          if (n > 0) {
            expect(drawn[n].y).toBeLessThan(drawn[n - 1].y)
            // Evenly by the note from C2 (the largest) to C7, and no smaller after.
            const lower = bowlRadius(table[n - 1].note, at)
            if (bowl.note < 96) expect(radius).toBeLessThan(lower)
            else expect(radius).toBe(at.small)
          }
        })
      }
    }
  })

  it('spreads the bowls between the sides by Spread, from one line to the full width', () => {
    for (const size of SHAPES) {
      const at = bowlsLayout(size)
      const middle = xOfSlot(0, 0, at)
      for (let slot = 0; slot < SLOTS; slot += 1) {
        expect(xOfSlot(slot, 0, at)).toBeCloseTo(middle, 10)
        // kit::pan_gains takes place * spread: the picture is as far from the middle as that.
        const full = xOfSlot(slot, 1, at) - middle
        expect(xOfSlot(slot, 0.5, at) - middle).toBeCloseTo(full / 2, 10)
        expect(Math.sign(full)).toBe(Math.sign(slotPlace(slot)))
      }
      const reach = xOfSlot(7, 1, at) - middle
      expect(xOfSlot(0, 1, at) - middle).toBeCloseTo(-reach, 10)
      expect(xOfSlot(3, 1, at) - middle).toBeCloseTo(reach * slotPlace(3), 10)
      // The widest bowl still clears the edge and Register's handle.
      expect(middle + reach + at.big).toBeLessThanOrEqual(size.width - 4)
      expect(middle - reach - at.big).toBeGreaterThan(at.gauge.x + 4)
    }
  })

  it('draws a bowl as far out of round as it beats, and round at Beat 0', () => {
    const table = bowlsTable(0, 0, 8, 0.5)
    const still = bowlsOf(drawDisplay(display, params, { values: { beat: 0 } }))
    for (const bowl of still) expect(bowl.rx).toBeCloseTo(bowl.ry, 10)
    for (const beat of [0.4, 1]) {
      const drawn = bowlsOf(drawDisplay(display, params, { values: { beat } }))
      table.forEach((bowl, n) => {
        // By the root of the rate the bowl beats at, 0.3 for the fastest there can be (Beat 1, slot_beat 1.3):
        // the rate goes by the square of Beat, so the shape goes evenly with the control.
        const hz = BEAT_AT_FULL * beat * beat * slotBeat(bowl.slot)
        const squash = 0.3 * Math.sqrt(hz / (BEAT_AT_FULL * (1 + BEAT_SPREAD)))
        expect(bowlSquash(hz)).toBeCloseTo(squash, 12)
        expect((drawn[n].rx - drawn[n].ry) / (drawn[n].rx + drawn[n].ry)).toBeCloseTo(squash, 10)
        expect(squash).toBeCloseTo(0.3 * beat * Math.sqrt(slotBeat(bowl.slot) / 1.3), 12)
      })
    }
    expect(bowlSquash(0)).toBe(0)
    expect(bowlSquash(BEAT_AT_FULL * 1.3)).toBeCloseTo(0.3, 12)
  })

  it('says the key, the notes the table runs from and to, and how long a bowl rings', () => {
    for (const size of SHAPES) {
      const rest = drawDisplay(display, params, size).words()
      expect(rest).toEqual(expect.arrayContaining(['C major 5', 'G3 to C5', '10 s']))
      const other = drawDisplay(display, params, {
        values: { root: 9, scale: 6, ring: 0.5, bowls: 5 },
        ...size,
      }).words()
      // A hirajoshi from Register's F#3: A3 B3 C4 E4 F4.
      expect(other).toEqual(expect.arrayContaining(['A hirajoshi', 'A3 to F4', '500 ms']))
      expect(drawDisplay(display, params, { values: { ring: 2.5 }, ...size }).words()).toContain(
        '2.5 s',
      )
      // The longest words there are still clear each other on the line under the table.
      const at = bowlsLayout(size)
      expect('A# hirajoshi'.length * 5 + 'A#3 to G#5'.length * 5 + 6).toBeLessThanOrEqual(
        at.field.w,
      )
    }
  })
  it("writes each bowl's note in its ring while nothing rings, and no name once a bowl is lit", async () => {
    const table = bowlsTable(0, 0, 8, 0.5)
    const named = (drawn: RecordingContext) =>
      drawn.calls.filter(
        (call) => call.name === 'fillText' && /^[A-G]#?\d$/.test(String(call.args[0])),
      )
    for (const size of SHAPES) {
      const at = bowlsLayout(size)
      const names = named(drawDisplay(display, params, size))
      expect(names).toHaveLength(8)
      for (const call of names) {
        const [word, x, y] = call.args as [string, number, number]
        const row = table.findIndex((bowl) => bowlName(bowl.note) === word)
        expect(row).toBeGreaterThanOrEqual(0)
        expect(x).toBeCloseTo(xOfSlot(table[row].slot, 0.6, at), 10)
        expect(y).toBeCloseTo(yOfRow(row, at) + 3, 10)
      }
      // In one line down the middle there is room for a name every other row at the most: none overlap.
      const stacked = named(drawDisplay(display, params, { values: { spread: 0 }, ...size }))
      expect(stacked.length).toBeGreaterThanOrEqual(3)
      const heights = stacked.map((call) => call.args[2] as number)
      for (let n = 1; n < heights.length; n += 1)
        expect(heights[n - 1] - heights[n]).toBeGreaterThanOrEqual(8)
    }
    const bowl = table[6]
    const loaded = await compiled({ mix: 0.35 })
    play(loaded, 1.5, swell(bowl.note, 0.5))
    const lit = drawDisplay(display, params, { meters: metersOf(loaded), signal: testSignal() })
    expect(named(lit)).toHaveLength(0)
    expect(lit.words()).toEqual(expect.arrayContaining(['C major 5', 'G3 to C5', '10 s']))
  })
})

describe('the handles of Bowls', () => {
  it('sets Ring on a scale of seconds that is even by ratio, end to end', () => {
    for (const size of SHAPES) {
      const at = bowlsLayout(size)
      // The control runs from half a second to forty, by ratio (device.json).
      expect(params.ring.min).toBe(0.5)
      expect(params.ring.max).toBe(40)
      expect(xOfRing(0.5, at)).toBeCloseTo(at.ring.x, 10)
      expect(xOfRing(40, at)).toBeCloseTo(at.ring.x + at.ring.w, 10)
      const octave = xOfRing(2, at) - xOfRing(1, at)
      expect(xOfRing(20, at) - xOfRing(10, at)).toBeCloseTo(octave, 10)
      expect(octave).toBeCloseTo((at.ring.w * Math.log(2)) / Math.log(80), 10)
      for (const seconds of [0.5, 0.8, 3, 10, 25, 40]) {
        const grip = handleOf('ring', { ring: seconds }, size)
        expect(grip.x).toBeCloseTo(xOfRing(seconds, at), 10)
        expect(grip.y).toBeCloseTo(at.ring.y, 10)
        // Drag to where a time lies and that time is set.
        expect(handleOf('ring', {}, size).drag(grip.x, grip.y).ring).toBeCloseTo(seconds, 8)
        expect(ringOfX(grip.x, at)).toBeCloseTo(seconds, 8)
      }
      // Past the ends it stops at the control's ends, and there is room to set it by hand.
      expect(handleOf('ring', {}, size).drag(-50, 0).ring).toBeCloseTo(0.5, 10)
      expect(handleOf('ring', {}, size).drag(size.width + 50, 0).ring).toBeCloseTo(40, 10)
      expect(at.ring.w).toBeGreaterThanOrEqual(40)
      expect(at.ring.x + at.ring.w).toBeLessThanOrEqual(size.width - 4)
      expect(handleOf('ring', { ring: 3 }, size).reset?.()).toEqual({ ring: params.ring.default })
    }
  })

  it('marks the scale at 1, 2, 5, 10 and 20 seconds and draws the fall to the handle', () => {
    for (const size of SHAPES) {
      const at = bowlsLayout(size)
      const drawn = drawDisplay(display, params, { values: { ring: 6 }, ...size })
      const starts = drawn.calls
        .filter((call) => call.name === 'moveTo')
        .map((call) => call.args as number[])
      for (const seconds of [1, 2, 5, 10, 20]) {
        const x = xOfRing(seconds, at)
        // (A rule one pixel wide is set on the pixel: within one of where the time lies.)
        expect(starts.some(([sx, sy]) => Math.abs(sx - x) < 1 && sy < at.ring.y)).toBe(true)
      }
      const ends = drawn.calls
        .filter((call) => call.name === 'lineTo')
        .map((call) => call.args as number[])
      const grip = xOfRing(6, at)
      expect(
        ends.some(([x, y]) => Math.abs(x - grip) < 1e-9 && Math.abs(y - at.ring.y) < 1e-9),
      ).toBe(true)
    }
  })

  it('sets Register on its own scale of octaves, C2 at the foot and C5 at the head', () => {
    for (const size of SHAPES) {
      const at = bowlsLayout(size)
      // Register's note is kLowNote + kRegisterSpan * register: an octave is a third of the scale.
      expect(REGISTER_NOTES / 12).toBe(3)
      const drawn = drawDisplay(display, params, size)
      for (const register of [0, 1 / 3, 0.5, 2 / 3, 0.8, 1]) {
        const grip = handleOf('register', { register }, size)
        expect(grip.x).toBeCloseTo(at.gauge.x, 10)
        expect(grip.y).toBeCloseTo(yOfRegister(register, at), 10)
        expect(grip.y).toBeCloseTo(at.gauge.foot + register * (at.gauge.head - at.gauge.foot), 10)
        // Drag to where a Register lies and that Register is set.
        expect(handleOf('register', {}, size).drag(grip.x, grip.y).register).toBeCloseTo(
          register,
          10,
        )
        expect(registerOfY(grip.y, at)).toBeCloseTo(register, 10)
      }
      // A mark at each C (set on the pixel: within one of where it lies).
      const marks = drawn.calls
        .filter((call) => call.name === 'lineTo')
        .map((call) => call.args as number[])
      for (let octave = 0; octave <= 3; octave += 1) {
        const y = yOfRegister(octave / 3, at)
        expect(
          marks.some(([mx, my]) => Math.abs(my - y) < 1 && Math.abs(mx - at.gauge.x - 3) < 1),
        ).toBe(true)
      }
      // The whole of the control is 40 px of travel or more, and it stops at its ends.
      expect(at.gauge.foot - at.gauge.head).toBeGreaterThanOrEqual(40)
      expect(handleOf('register', {}, size).drag(0, size.height + 40).register).toBe(0)
      expect(handleOf('register', {}, size).drag(0, -40).register).toBe(1)
      expect(handleOf('register', { register: 0.9 }, size).reset?.()).toEqual({
        register: params.register.default,
      })
    }
  })

  it('moves the table up the scale as Register rises: the same bowl in the same slot, a row nearer', () => {
    const at = bowlsLayout(SHAPES[0])
    const low = bowlsTable(0, 0, 8, 0.5)
    const high = bowlsTable(0, 0, 8, 0.56)
    expect(high[0].note).toBe(low[1].note)
    const before = bowlsOf(drawDisplay(display, params, { values: { register: 0.5 } }))
    const after = bowlsOf(drawDisplay(display, params, { values: { register: 0.56 } }))
    for (let n = 0; n < 7; n += 1) {
      expect(after[n].x).toBeCloseTo(before[n + 1].x, 10)
      expect(after[n].y).toBeCloseTo(yOfRow(n, at), 10)
      expect(after[n].rx).toBeCloseTo(before[n + 1].rx, 10)
    }
  })

  it('keeps its two handles apart and inside the picture at every setting', () => {
    for (const size of SHAPES) {
      for (const register of [0, 0.5, 1]) {
        for (const ring of [0.5, 10, 40]) {
          const a = handleOf('register', { register, ring }, size)
          const b = handleOf('ring', { register, ring }, size)
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(12)
          for (const grip of [a, b]) {
            expect(grip.x).toBeGreaterThanOrEqual(3)
            expect(grip.x).toBeLessThanOrEqual(size.width - 3)
            expect(grip.y).toBeGreaterThanOrEqual(3)
            expect(grip.y).toBeLessThanOrEqual(size.height - 3)
          }
        }
      }
    }
  })

  it('puts on the face the controls a player reaches for first', () => {
    expect(BOWLS_FACES.bowls.face).toEqual(['root', 'ring', 'strike', 'mix'])
    for (const name of BOWLS_FACES.bowls.face ?? []) expect(params[name]).toBeDefined()
  })
})
