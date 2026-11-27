// The truth of the Standing Water display: the overtones of the cycle it draws
// and the growth of its figure against the compiled device played at 48 kHz,
// the picture against that arithmetic, and its two points.

import { describe, expect, it } from 'vitest'

import { STANDING_WATER_PARAMS } from '../../dsp/devices/standing-water.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  STANDING_WATER_FACES,
  waterGlassY,
  waterLayout,
  waterScale,
} from '../components/displays/standing-water'
import { waterCycle } from '../components/displays/standing-water-cycle'
import * as pool from '../components/displays/standing-water-parts'
import {
  displaySize,
  drawDisplay,
  runDisplay,
  testNotes,
  testSignal,
  viewOf,
} from './display-harness'

type Values = Partial<Record<keyof typeof STANDING_WATER_PARAMS, number>>
const RATE = 48000
const HZ = 220
const display = STANDING_WATER_FACES['standing-water'].display
const at = waterLayout(displaySize(display))
const specs: Readonly<Record<string, { default: number }>> = STANDING_WATER_PARAMS
const asking =
  (values: Values): pool.Ask =>
  (name) =>
    (values as Record<string, number>)[name] ?? specs[name].default

/** What the left ear hears of one held key of the compiled device. */
async function played(values: Values, seconds: number): Promise<Float32Array> {
  const loaded = await loadWasmDevice('standing-water', RATE)
  for (const [name, spec] of Object.entries(STANDING_WATER_PARAMS))
    loaded.set(spec, asking(values)(name))
  loaded.device.device_note_on?.(1, HZ, 0.7)
  const out = new Float32Array(Math.round((seconds * RATE) / 128) * 128)
  for (let done = 0; done < out.length; done += 128) {
    loaded.device.device_process(128)
    out.set(loaded.view(loaded.device.device_out_left(), 128), done)
  }
  return out
}

/** How strong the sine at `hz` is in the 0.2 s up to `end`, through a raised cosine. */
function tone(wave: Float32Array, hz: number, end: number): number {
  const frames = 0.2 * RATE
  let re = 0
  let im = 0
  for (let i = 0; i < frames; i++) {
    const n = Math.round(end * RATE) - frames + i
    const sample = wave[n] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frames))
    re += sample * Math.cos((2 * Math.PI * hz * n) / RATE)
    im += sample * Math.sin((2 * Math.PI * hz * n) / RATE)
  }
  return Math.hypot(re, im)
}

/** The display's water `seconds` after a key that is held. */
function watered(values: Values, seconds: number, seed = 5): pool.Water {
  const water = pool.waterStart(asking(values), HZ, 0.7, seed)
  for (let t = 0; t < seconds - 1e-9; t += 0.025) pool.waterMove(asking(values), water, true, 0.025)
  return water
}

function drawnBins(values: Values, seconds: number, seed = 5): Float64Array {
  const ask = asking(values)
  const water = watered(values, seconds, seed)
  const strength = pool.waterStrength(ask, water)
  const circle = pool.waterCircle(ask, water, strength)
  return waterCycle(ask, water, pool.waterRipples(ask, water), circle, strength).bins
}

/** Nothing of chance, nothing thrown in, one ear over the middle. */
const plain: Values = { unrest: 0, stray: 0, drift: 0.02, splash: 0, foam: 0, width: 0, lag: 0.15 }

describe('the cycle standing-water draws', () => {
  const cases: [string, Values][] = [
    ['hexagons in the light', {}],
    ['hexagons in height, deep', { reading: 0, depth: 0.8 }],
    ['hexagons in slope, wide', { reading: 1, circle: 0.8 }],
    ['stripes in slope', { pattern: 0, reading: 1 }],
    ['stripes in the light of a long pool', { pattern: 0, pool: 1, circle: 0.7 }],
    ['thick water with many layers', { thickness: 0.7, layers: 0.9, circle: 0.6 }],
  ]
  it.each(cases)('has the overtones the device plays: %s', async (_, values) => {
    const set = { ...plain, ...values }
    const wave = await played(set, 3)
    // Of stripes one wave wins, which chance decides: any of the three may be the device's.
    const misses = [1, 2, 3, 4, 5, 6].map((seed) => {
      const drawn = drawnBins(set, 2.9, seed)
      const heard = Array.from(drawn, (_bin, k) => (k % 2 ? 0 : tone(wave, (HZ * k) / 2, 3)))
      const [top, most] = [Math.max(...drawn), Math.max(...heard)]
      const off: number[] = []
      for (let k = 2; k < 80; k += 2) {
        const db = 20 * Math.log10(drawn[k] / top)
        if (db > -20) off.push(Math.abs(20 * Math.log10(heard[k] / most) - db))
      }
      return off.length > 3 ? Math.max(...off) : Infinity
    })
    expect(Math.min(...misses)).toBeLessThan(1.2)
  })

  it('has half the pitch in it only with Below', () => {
    expect(drawnBins(plain, 2)[1]).toBeLessThan(1e-6)
    expect(drawnBins({ ...plain, below: 0.8 }, 4)[1]).toBeGreaterThan(0.2)
  })
})

describe('the water of standing-water', () => {
  it('grows past its threshold in the time the device takes, and not under it', async () => {
    const set = { ...plain, lag: 1.5 }
    const wave = await played(set, 4)
    const full = tone(wave, HZ, 4)
    const half = [...Array(70).keys()].findIndex((n) => tone(wave, HZ, 0.3 + n * 0.05) > full / 2)
    const level = (seconds: number): number => {
      const strength = pool.waterStrength(asking(set), watered(set, seconds))
      return (1.28 * strength) / (strength + 0.28)
    }
    const drawn = [...Array(70).keys()].findIndex((n) => level(0.2 + n * 0.05) > level(4) / 2)
    expect(Math.abs(drawn - half) * 0.05).toBeLessThan(0.2)
    const under = { ...plain, shake: 0.1, threshold: 0.6 }
    expect(pool.waterStrength(asking(under), watered(under, 3))).toBeLessThan(0.05)
  })
})

describe('the picture of standing-water', () => {
  it('is lit by a key that is played, and says which', () => {
    const run = runDisplay(display, STANDING_WATER_PARAMS, 1.5, {
      notes: testNotes(1),
      signal: testSignal(),
    })
    expect(run.words().some((word) => /^Caustic {2}[CEG]4$/.test(word))).toBe(true)
    expect(run.print()).toContain(`set strokeStyle(${PLAIN_COLOURS.accent})`)
    expect(drawDisplay(display, STANDING_WATER_PARAMS).words()).toEqual(['Hexagons', 'Caustic'])
  })

  it('has two points that set Circle and Threshold where they stand', () => {
    const values = { pattern: 4, circle: 0.7, threshold: 0.5 }
    const points = display.handles?.(viewOf(display, STANDING_WATER_PARAMS, { values })) ?? []
    const [circle, sill] = points
    expect(circle.drag(circle.x, circle.y).circle).toBeCloseTo(0.7, 6)
    const middle = [at.pool.x + at.pool.w / 2, at.pool.y + at.pool.h / 2]
    const { high } = pool.WATER_FIGURES[4]
    expect(circle.drag(middle[0], middle[1]).circle).toBe(0)
    expect(
      circle.drag(middle[0] + high * waterScale(asking(values), at.pool), middle[1]).circle,
    ).toBeCloseTo(1, 6)
    expect(sill.drag(0, sill.y).threshold).toBeCloseTo(0.5, 6)
    expect(sill.y).toBeCloseTo(waterGlassY(0.34, at.glass), 6)
  })
})
