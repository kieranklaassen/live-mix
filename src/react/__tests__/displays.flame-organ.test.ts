// The truth of the Flame Organ display: its map and its figures against the
// compiled device played at 48 kHz, the drawing against that arithmetic, and
// what its two points set.

import { describe, expect, it } from 'vitest'

import { FLAME_ORGAN_PARAMS, FLAME_ORGAN_METERS } from '../../dsp/devices/flame-organ.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { FLAME_ORGAN_FACES } from '../components/displays/flame-organ'
import * as flame from '../components/displays/flame-organ-parts'
import { drawDisplay, drawnPaths, runDisplay, testNotes } from './display-harness'
import { displaySize, testSignal, viewOf } from './display-harness'

type Values = Partial<Record<keyof typeof FLAME_ORGAN_PARAMS, number>>
const RATE = 48000
const { display } = FLAME_ORGAN_FACES['flame-organ']
const at = flame.flameLayout(displaySize(display))

/** Nothing that moves by itself. */
const STILL: Values = { draught: 0, flicker: 0, lift: 0, roar: 0, secondFlame: 0, catch: 0.03 }

/** One key held: the device's readings at the end, and the last fifth of a second of its left side. */
async function played(values: Values, seconds: number) {
  const loaded = await loadWasmDevice('flame-organ', RATE)
  for (const [name, value] of Object.entries(values))
    loaded.set(FLAME_ORGAN_PARAMS[name as keyof Values], value)
  const { device } = loaded
  device.device_note_on?.(1, 220, 0.7)
  const blocks = Math.round((seconds * RATE) / 128)
  const wave = new Float32Array(blocks * 128)
  for (let n = 0; n < blocks; n++) {
    device.device_process(128)
    wave.set(loaded.view(device.device_out_left(), 128), n * 128)
  }
  const meter = (name: keyof typeof FLAME_ORGAN_METERS) =>
    device.device_meter?.(FLAME_ORGAN_METERS[name].id) ?? 0
  return { meter, wave: wave.subarray(wave.length - RATE / 5) }
}

/** How loud one harmonic of a key is in a wave. */
function harmonic(wave: Float32Array, hz: number): number {
  const turned = (shift: number) =>
    wave.reduce((sum, x, i) => {
      const window = 1 - Math.cos((2 * Math.PI * i) / wave.length)
      return sum + x * window * Math.cos((2 * Math.PI * hz * i) / RATE + shift)
    }, 0)
  return Math.hypot(turned(0), turned(Math.PI / 2))
}

describe('the map of flame-organ', () => {
  it('is the harmonic the device sings, for every tube and fuel', async () => {
    let wrong = 0
    const heard = new Set<number>()
    for (let tube = 0; tube < 5; tube++)
      for (let fuel = 0; fuel < 4; fuel++)
        for (const lag of [0.07, 0.16, 0.25, 0.34, 0.43])
          for (const place of [0.05, 0.14, 0.24, 0.34, 0.43]) {
            const { meter } = await played({ ...STILL, tube, fuel, lag, place }, 0.06)
            // The place sways by a hundredth of itself, so it is asked where the device has it.
            const { sings } = flame.flameStand(tube, fuel, meter('lag'), meter('place'))
            heard.add(sings)
            if (meter('sings') !== sings) wrong += 1
          }
    expect(wrong).toBe(0)
    expect(heard.size).toBeGreaterThanOrEqual(4)
  }, 60000)

  it.each([
    [1, 0.21, 0.17],
    [2, 0.1, 0.1],
    [3, 0.43, 0.08],
  ])('says the harmonic that is heard: %s', async (n, lag, place) => {
    const { wave } = await played({ ...STILL, lag, place, tube: 3, flame: 0.2, mouth: 1 }, 2.5)
    expect(flame.flameStand(3, 0, lag, place).sings).toBe(n)
    const levels = [1, 2, 3, 4].map((k) => harmonic(wave, 220 * k))
    expect(levels.indexOf(Math.max(...levels)) + 1).toBe(n)
  })

  it('lifts as far as Lift says and no further', async () => {
    const lifted = async (lift: number) => (await played({ ...STILL, lift }, 2)).meter('lift')
    expect(flame.flameLifted(0)).toBeLessThan(0.02)
    expect(await lifted(0)).toBeLessThan(0.02)
    expect(flame.flameLifted(1)).toBeGreaterThan(0.9)
    expect(await lifted(1)).toBeGreaterThan(0.9)
  })
})

describe('the drawing of flame-organ', () => {
  const meters = { key: 220, burning: 1, air: 1, sings: 1, lift: 0, lag: 0.21, place: 0.17 }
  const running = (values: Values, more: Partial<typeof meters> = {}) =>
    runDisplay(display, FLAME_ORGAN_PARAMS, 0.2, {
      values,
      meters: { ...meters, ...more },
      notes: testNotes(1),
      signal: testSignal(),
    })
  /** The accent's shapes in the first tube: its air, then its flame. */
  const shapes = (values: Values, more: Partial<typeof meters> = {}): [number, number][][] =>
    drawnPaths(running({ roar: 0, secondFlame: 0, ...values }, more))
      .filter(
        ({ kind, colour, points }) =>
          kind === 'fill' && colour === PLAIN_COLOURS.accent && points.length > 20,
      )
      .map(({ points }) => points)
  const spans = (points: [number, number][]) =>
    Math.max(...points.map(([, y]) => y)) - Math.min(...points.map(([, y]) => y))

  it('has one bulge in the tube for each half wave of what sings', () => {
    for (const sings of [1, 2, 3]) {
      const side = Array.from(shapes({}, { sings })[0].slice(0, 41), ([x]) => x)
      const middle = Math.max(...side)
      let bulges = 0
      for (let i = 1; i < 40; i++)
        if (middle - side[i] > 2 && side[i] <= side[i - 1] && side[i] < side[i + 1]) bulges += 1
      expect(bulges).toBe(sings)
    }
  })

  it('burns as tall as the device says, at its place', () => {
    const [full, low] = [shapes({}), shapes({}, { burning: 0.25 })].map(([, lick]) => spans(lick))
    expect(low / full).toBeCloseTo(0.5, 2)
    expect(full).toBeCloseTo(flame.flameHigh(flame.flameTall(0.45, 0.8)), 1)
    const foot = (place: number) => Math.max(...shapes({}, { place })[1].map(([, y]) => y))
    expect(foot(0.1) - foot(0.4)).toBeCloseTo(0.3 * at.tubes.h, 1)
    expect(running({}).words()).toContain('A3 ×1')
    expect(running({}, { lift: 1 }).words()).toContain('A3 ×2')
  })

  it('ties the two flames while they lock and lets go as they part', () => {
    const lines = (between: number) => {
      const values = { between, secondFlame: 1 }
      const all = drawnPaths(drawDisplay(display, FLAME_ORGAN_PARAMS, { values }))
      const apart = flame.flameTubes(0, between, at.tubes).map(({ x }) => x)
      const tie = all.filter(({ points }) => apart.every((x, i) => points[i]?.[0] === x))
      return tie.filter(({ kind, points }) => kind === 'stroke' && points.length === 2).length
    }
    expect(lines(0)).toBe(3)
    expect(lines(1)).toBe(0)
    expect(flame.flamePlace2(0.17, 0)).toBeLessThan(flame.flamePlace2(0.17, 0.4))
  })

  it('has a point for Lag and Place, and one for Flame', () => {
    const values = { lag: 0.3, place: 0.3, flame: 0.7 }
    const view = viewOf(display, FLAME_ORGAN_PARAMS, { values })
    const [point, tip] = display.handles?.(view) ?? []
    expect(point.drag(point.x, point.y)).toEqual({
      lag: expect.closeTo(0.3, 9),
      place: expect.closeTo(0.3, 9),
    })
    expect(point.drag(at.map.x - 9, at.map.y - 9)).toEqual({ lag: 0.05, place: 0.45 })
    expect(point.reset?.()).toEqual({ lag: 0.21, place: 0.17 })
    expect(tip.drag(tip.x, tip.y).flame).toBeCloseTo(0.7, 9)
    expect(tip.drag(tip.x, 0).flame).toBe(1)
    expect(tip.drag(tip.x, 99).flame).toBe(0)
  })
})
