// The truth of the Spun Wire display: its wheel and its wires against the
// compiled device played at 48 kHz, the drawing against that arithmetic, and
// what its two points set.

import { describe, expect, it } from 'vitest'

import { SPUN_WIRE_PARAMS } from '../../dsp/devices/spun-wire.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { SPUN_WIRE_FACES } from '../components/displays/spun-wire'
import * as spun from '../components/displays/spun-wire-parts'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  runDisplay,
  testNotes,
  testSignal,
  viewOf,
} from './display-harness'

type Name = keyof typeof SPUN_WIRE_PARAMS
type Values = Partial<Record<Name, number>>
const RATE = 48000
const display = SPUN_WIRE_FACES['spun-wire'].display
const { lane } = spun.spunLayout(displaySize(display))
const setOf = (values: Values) =>
  spun.spunSet((name) => values[name as Name] ?? SPUN_WIRE_PARAMS[name as Name].default)

/** The keys held for `hold` seconds: the device's speed every 128 frames, and its left side. */
async function played(values: Values, seconds: number, hold: number, keys = [220]) {
  const loaded = await loadWasmDevice('spun-wire', RATE)
  for (const [name, value] of Object.entries(values))
    loaded.set(SPUN_WIRE_PARAMS[name as Name], value)
  const { device } = loaded
  keys.forEach((hz, id) => device.device_note_on?.(id, hz, 0.7))
  const blocks = Math.round((seconds * RATE) / 128)
  const wave = new Float32Array(blocks * 128)
  const speeds: number[] = []
  for (let n = 0; n < blocks; n++) {
    if (n === Math.round((hold * RATE) / 128)) keys.forEach((_, id) => device.device_note_off?.(id))
    device.device_process(128)
    wave.set(loaded.view(device.device_out_left(), 128), n * 128)
    speeds.push(device.device_meter?.(1) ?? 0)
  }
  return { wave, speedAt: (at: number) => speeds[Math.round((at * RATE) / 128) - 1] }
}

describe('the wheel of spun-wire', () => {
  // A wheel out of true by nothing still wanders by 2 %.
  const plain: Values = { wobble: 0, gear: 1 }
  const cases: [string, Values][] = [
    ['driven and let go', { ...plain, spin: 14, rise: 0.8, coast: 3 }],
    ['thrown', { ...plain, gesture: spun.THROWN, spin: 20, rise: 0.4, coast: 4 }],
    ['rocked', { ...plain, gesture: spun.ROCKED, spin: 12, rise: 0.5, coast: 3 }],
    ['turned once', { ...plain, gesture: spun.ONE_TURN, spin: 4, rise: 1 }],
  ]
  it.each(cases)('runs as the device’s does when it is %s', async (_, values) => {
    const { speedAt } = await played(values, 4, 1.5)
    const { speeds } = spun.spunRun(setOf(values), 1.5, 4)
    const spin = values.spin ?? 1
    for (let at = 0.1; at < 3.9; at += 0.1) {
      const drawn = speeds[Math.round(at / spun.TICK) - 1] ?? 0
      expect(Math.abs(speedAt(at) - drawn) / spin, `at ${at.toFixed(1)} s`).toBeLessThan(0.07)
    }
  })

  it('is geared by its place in the chord', async () => {
    for (const gear of [1, 2, 3, 4]) {
      const values = { wobble: 0, gear, spin: 6, rise: 0.05 }
      const { speedAt } = await played(values, 2, 3, [220, 275, 330])
      expect(speedAt(1.5) / 6 / spun.spunGeared(gear, 2)).toBeCloseTo(1, 1)
    }
  })

  it('plucks under Melt and rubs over it', () => {
    const at = (spin: number) => spun.spunRun(setOf({ spin, melt: 12, rise: 0.02 }), 2, 2).plucks
    expect(at(4).length).toBeGreaterThan(6)
    expect(at(4).at(-1)?.force).toBeGreaterThan(0.9)
    expect(at(50).filter((pluck) => pluck.at > 1)).toEqual([])
    expect(spun.spunMelted(setOf({ melt: 12 }), 12)).toBeCloseTo(0.5, 6)
  })
})

describe('the wires of spun-wire', () => {
  const alone: Values = { tuning: 0, gesture: spun.ONE_TURN, strung: 1, lacing: 0, beat: 0 }
  const cases: [string, Values][] = [
    ['steel', { ...alone, hub: 0, ring: 3 }],
    ['wood', { ...alone, ring: 8 }],
    ['heavy wire', { ...alone, gauge: 0.6, ring: 4 }],
    ['a nail on skin', { ...alone, hub: 2, plucker: spun.NAIL, ring: 6 }],
  ]
  it.each(cases)('ring as long as the display has them: %s', async (_, values) => {
    const { wave } = await played(values, 2.5, 3)
    const power = (at: number): number => {
      const [from, hz] = [Math.round(at * RATE), 220]
      let [re, im] = [0, 0]
      for (let i = 0; i < 0.2 * RATE; i++) {
        const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (0.2 * RATE))
        re += wave[i + from] * window * Math.cos((2 * Math.PI * hz * i) / RATE)
        im += wave[i + from] * window * Math.sin((2 * Math.PI * hz * i) / RATE)
      }
      return 10 * Math.log10(re * re + im * im)
    }
    const ring = spun.spunRing(setOf(values), 220)
    const span = Math.min(1, ring / 2)
    const measured = (60 * span) / (power(1) - power(1 + span))
    expect(measured / ring).toBeGreaterThan(0.85)
    expect(measured / ring).toBeLessThan(1.15)
  })
})

describe('the drawing of spun-wire', () => {
  const paths = (values: Values) => drawnPaths(drawDisplay(display, SPUN_WIRE_PARAMS, { values }))
  /** The upright lines of the lane that stand on its foot. */
  const stems = (values: Values) =>
    paths(values).filter(
      ({ kind, points }) =>
        kind === 'stroke' &&
        points.length === 2 &&
        points[0][0] === points[1][0] &&
        points[0][1] === lane.y + lane.h,
    ).length

  it('stands the plucks apart under Melt and fills them in over it', () => {
    expect(stems({ spin: 6, melt: 30 })).toBeGreaterThan(5)
    expect(stems({ spin: 60, melt: 2, rise: 0.02, coast: 20 })).toBeLessThan(4)
  })

  it('swings its wires while a wheel goes round', () => {
    const swung = (speed: number) =>
      drawnPaths(
        runDisplay(display, SPUN_WIRE_PARAMS, 1.5, {
          meters: { turn: 0.2, speed },
          notes: testNotes(5),
          signal: testSignal(),
        }),
      ).filter(({ kind, colour }) => kind === 'fill' && colour === PLAIN_COLOURS.accent).length
    expect(swung(40)).toBeGreaterThan(swung(0) + 3)
  })

  it('has a point for Spin and Spin up, and one for Coast where the wheel rests', () => {
    const values = { spin: 23, rise: 2, coast: 8 }
    const view = viewOf(display, SPUN_WIRE_PARAMS, { values })
    const [spin, coast] = display.handles?.(view) ?? []
    expect(spin.y).toBeCloseTo(spun.spunY(23, lane), 6)
    expect(spin.drag(spin.x, spin.y).spin).toBeCloseTo(23, 6)
    expect(spin.drag(spin.x, spin.y).rise).toBeCloseTo(2, 6)
    expect(spin.drag(spin.x + 4, lane.y + lane.h)).toMatchObject({ spin: 0.5 })
    expect(coast.drag(coast.x, 0).coast).toBeCloseTo(8, 6)
    const set = setOf(values)
    const scale = spun.spunScale(view, set, lane)
    const run = spun.spunRun(set, scale.hold, 60)
    const rest = spun.spunX(run.speeds.length * spun.TICK, run.turns, scale, lane)
    expect(Math.abs(rest - coast.x)).toBeLessThan(3)
  })
})
