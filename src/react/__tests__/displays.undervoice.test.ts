// The truth of the Undervoice display: what it draws of the folds, the throat,
// the drips and the door against the compiled device played at 48 kHz, and its
// two points against what they stand for.

import { describe, expect, it } from 'vitest'

import { UNDERVOICE_PARAMS } from '../../dsp/devices/undervoice.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import * as picture from '../components/displays/undervoice'
import * as throat from '../components/displays/undervoice-throat'
import * as harness from './display-harness'

const RATE = 48000
const display = picture.UNDERVOICE_FACES.undervoice.display
type Name = keyof typeof UNDERVOICE_PARAMS
type Values = Partial<Record<Name, number>>
const read = (values: Values) => (name: string) =>
  values[name as Name] ?? UNDERVOICE_PARAMS[name as Name].default

/** The folds and the throat and nothing else: one still singer, no air, no rings, no chest. */
const PLAIN: Values = Object.assign(
  Object.fromEntries('ring chest whisper roughness drift width turn'.split(' ').map((k) => [k, 0])),
  { singers: 1, attack: 0.008, volume: -20 },
)

/** What comes out of one key held for so many seconds, both sides added. */
async function played(values: Values, hz: number, seconds: number): Promise<Float32Array> {
  const loaded = await loadWasmDevice('undervoice', RATE)
  for (const [name, value] of Object.entries({ ...PLAIN, ...values }))
    loaded.set(UNDERVOICE_PARAMS[name as Name], value)
  loaded.device.device_note_on?.(1, hz, 0.7)
  const sum = new Float32Array(Math.round((seconds * RATE) / 32) * 32)
  for (let done = 0; done < sum.length; done += 32) {
    loaded.device.device_process(32)
    const left = loaded.view(loaded.device.device_out_left(), 32)
    const right = loaded.view(loaded.device.device_out_right(), 32)
    for (let i = 0; i < 32; i++) sum[done + i] = left[i] + right[i]
  }
  return sum
}

/** How strong a sine at `hz` is in `wave` around `at` seconds, in dB, through a raised cosine. */
function toneDb(wave: Float32Array, hz: number, at: number, seconds: number): number {
  const frames = Math.round(seconds * RATE)
  const from = Math.round((at - seconds / 2) * RATE)
  let [re, im] = [0, 0]
  for (let i = 0; i < frames; i++) {
    const x = (wave[from + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / frames))
    re += x * Math.cos((2 * Math.PI * hz * i) / RATE)
    im += x * Math.sin((2 * Math.PI * hz * i) / RATE)
  }
  return 20 * Math.log10((4 * Math.hypot(re, im)) / frames + 1e-9)
}

/** Two rows of levels are one, but for a level that all of them share. */
function expectAlike(is: readonly number[], want: readonly number[], db: number): void {
  const apart = is.map((each, k) => each - want[k])
  const shared = apart.reduce((sum, each) => sum + each, 0) / apart.length
  for (const each of apart) expect(Math.abs(each - shared), apart.join(' ')).toBeLessThan(db)
}

describe('the figures of undervoice', () => {
  it('count the pulses as the device does, and say what lies under a key', () => {
    const group = (division: number, hz: number) =>
      throat.undervoiceGroup(read({ division }), hz, [hz])
    expect([0, 1, 2, 3, 4].map((division) => group(division, 220))).toEqual([1, 2, 3, 4, 8])
    for (const hz of [65.4, 146.8, 440, 1760]) {
      expect(hz / group(5, hz)).toBeGreaterThan(1.94)
      expect(hz / group(5, hz)).toBeLessThanOrEqual(3.91)
    }
    // A pulse shared by an octave and a fifth divides each of them.
    const pulse = throat.undervoicePulse([110, 165, 220])
    for (const hz of [110, 165, 220])
      expect(Math.abs(hz / pulse - Math.round(hz / pulse))).toBeLessThan(0.05)
    expect(picture.undervoiceWords(440, 2)).toBe('A4 over A3')
    expect(picture.undervoiceWords(440, 128)).toBe('A4, 3.4 Hz')
  })

  it('shape the harmonics of a key as the throat does', async () => {
    // Read between the formants too, where the throat's own sum and its formula part by a few dB.
    const harmonics = [2, 3, 4, 6, 8, 10, 12, 14, 16]
    const heard = async (more: Values) => {
      const values = { division: 0, depth: 0, closure: 0.7, ...more }
      const wave = await played(values, 110, 1.6)
      const through = throat.undervoiceThroat(read({ ...PLAIN, ...values }), 0)
      return harmonics.map((h) => [toneDb(wave, 110 * h, 1.1, 0.8), through(110 * h)])
    }
    const from = await heard({ vowel: 0.4 })
    for (const more of [{ vowel: 0.15 }, { vowel: 0.8 }, { vowel: 0.4, mouth: 0.3, throat: 1.3 }]) {
      const to = await heard(more)
      const apart = (k: 0 | 1) => to.map((each, i) => each[k] - from[i][k])
      expectAlike(apart(0), apart(1), 4)
    }
  }, 60000)

  it('let the pulses through as the false folds do', async () => {
    for (const division of [1, 2, 3]) {
      const lines = Array.from({ length: 9 }, (_, k) => k + 2)
      const n = division + 1
      const [heard, drawn]: number[][][] = [[], []]
      // From 0.7 of Depth up the folds shut whole, and only their gate grows narrow.
      for (const depth of [0.7, 1]) {
        const values = { division, depth, closure: 0.7 }
        const wave = await played(values, 220, 1.6)
        heard.push(lines.map((k) => toneDb(wave, (220 * k) / n, 1.1, 0.8)))
        const gate = throat.undervoiceGate(read({ ...PLAIN, ...values }), 220, n, true)
        const made = new Float32Array(Math.round(0.8 * RATE)).map((_, i) => {
          const x = ((i / 480) % 1) / (0.84 - 0.5 * 0.7)
          return x < 1 ? x * (2 - 3 * x) * gate.at(i / 480) : 0
        })
        drawn.push(lines.map((k) => toneDb(made, (100 * k) / n, 0.4, 0.8)))
      }
      const change = (rows: number[][]) => rows[0].map((each, k) => rows[1][k] - each)
      expectAlike(change(heard), change(drawn), 1)
    }
  }, 60000)

  it('drip as often as they say', async () => {
    const wave = await played({ division: 5, depth: 1, skew: 0.1 }, 220, 3)
    const period = throat.undervoiceGroup(read({ division: 5 }), 220, [220]) / 220
    // The first quarter of a group is loud, and nothing is left by the last.
    const loud = (at: number) => toneDb(wave, 440, at * period, period / 4)
    for (const group of [3, 4, 5, 6]) {
      expect(loud(group + 0.15) - loud(group + 0.8)).toBeGreaterThan(20)
      expect(Math.abs(loud(group + 0.15) - loud(group + 1.15))).toBeLessThan(1.5)
    }
  }, 60000)

  it('turn the door when the device turns it', async () => {
    const values = { turn: 1, pace: 0.5, second: 1, depth: 1 }
    const wave = await played(values, 220, 2.4)
    const door = [1, 2].map((at) => throat.undervoiceDoor(read(values), at * 0.5).door)
    expect(door).toEqual([1, 0])
    expect(toneDb(wave, 330, 2, 0.1) - toneDb(wave, 330, 1, 0.1)).toBeGreaterThan(20)
  }, 60000)
})

describe('the picture of undervoice', () => {
  const { folds, lane } = picture.undervoiceLayout(harness.displaySize(display))

  it('has its points on the hump and on the vowels, and they set what they stand for', () => {
    for (const division of [0, 1, 2, 3, 4, 5, 6]) {
      const view = harness.viewOf(display, UNDERVOICE_PARAMS, { values: { division, skew: 0.5 } })
      const [gate, vowel] = display.handles?.(view) ?? []
      const group = folds.w / picture.UNDERVOICE_GROUPS[division]
      expect(gate.x).toBeCloseTo(folds.x + group * (0.015 + 0.965 * 0.5 ** 1.15), 6)
      const set = gate.drag(gate.x, folds.y + folds.h / 2)
      expect([set.skew, set.depth]).toEqual([expect.closeTo(0.5, 6), expect.closeTo(0.5, 6)])
      expect(vowel.drag(folds.x + folds.w / 2, lane)).toEqual({ vowel: 0.5 })
    }
  })

  it('stands still with no key, and names the newest one that is down', () => {
    expect(harness.drawDisplay(display, UNDERVOICE_PARAMS).words()).toContain('D3 over D2')
    const options = { notes: harness.testNotes(), signal: harness.testSignal() }
    const on = harness.runDisplay(display, UNDERVOICE_PARAMS, 0.2, options)
    expect(on.words()).toContain('G4 over G3')
  })
})
