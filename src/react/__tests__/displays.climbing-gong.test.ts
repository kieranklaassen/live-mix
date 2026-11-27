// The truth of the Climbing Gong display: its law against the compiled device
// held for the whole round, the round and the rings, the two points, and that
// what the device reports is drawn in the accent up to the hand.

import { describe, expect, it } from 'vitest'

import { CLIMBING_GONG_DESCRIPTOR, CLIMBING_GONG_PARAMS } from '../../dsp/devices/climbing-gong.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { CLIMBING_GONG_FACES, GONG_REST } from '../components/displays/climbing-gong'
import {
  GONG_BEATERS,
  GONG_METALS,
  GONG_STEPS,
  gongLife,
  gongRegister,
  gongTime,
  gongTurn,
} from '../components/displays/climbing-gong-law'
import {
  gongLayout,
  gongOut,
  gongPoint,
  gongShare,
} from '../components/displays/climbing-gong-rings'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  runDisplay,
  testSignal,
  viewOf,
} from './display-harness'

type Name = keyof typeof CLIMBING_GONG_PARAMS
const display = CLIMBING_GONG_FACES['climbing-gong'].display
const at = gongLayout(displaySize(display))
const valueOf =
  (values: Readonly<Record<string, number>>) =>
  (name: string): number =>
    values[name] ?? CLIMBING_GONG_PARAMS[name as Name].default
const presets: Readonly<Record<string, Readonly<Record<string, number>>>> =
  CLIMBING_GONG_DESCRIPTOR.presets ?? {}
// In dB, and no lower than what the picture still shows.
const heard = (level: number): number => 20 * Math.log10(Math.max(level, 0.01))

/** What the device reports of its four registers, as means since the step before. */
async function reported(values: Readonly<Record<string, number>>, hz: number, gain: number) {
  const { device, set } = await loadWasmDevice('climbing-gong', 48000)
  const { device_note_on: down, device_meter: meter } = device
  if (!down || !meter) throw new Error('takes no notes or reports nothing')
  for (const [name, value] of Object.entries(values)) set(CLIMBING_GONG_PARAMS[name as Name], value)
  down(1, hz, gain)
  const levels = [0, 1, 2, 3].map(() => new Float32Array(GONG_STEPS + 1))
  let done = 0
  for (let step = 1; step <= GONG_STEPS; step++) {
    const to = Math.max(Math.round(gongTime(step / GONG_STEPS) * 1500), done + 1)
    const sums = [0, 0, 0, 0]
    const from = done
    for (; done < to; done++) {
      device.device_process(32)
      sums.forEach((_, r) => (sums[r] += meter(r) ** 2))
    }
    sums.forEach((sum, r) => (levels[r][step] = Math.sqrt(sum / (to - from))))
  }
  return levels
}

describe('the law of climbing-gong', () => {
  it('has the metals and the beaters the device has, each metal with a pair for every tone', () => {
    expect(GONG_METALS.map((metal) => metal.name)).toEqual(CLIMBING_GONG_PARAMS.metal.choices)
    expect(GONG_BEATERS.map((each) => each.name)).toEqual(CLIMBING_GONG_PARAMS.beater.choices)
    for (const metal of GONG_METALS) {
      expect(metal.ratio).toHaveLength(18)
      expect(metal.ratio[0]).toBe(1)
      expect([...metal.ratio].sort((a, b) => a - b)).toEqual([...metal.ratio])
    }
    expect([0, 5, 6, 9, 10, 13, 14, 17].map(gongRegister)).toEqual([0, 0, 1, 1, 2, 2, 3, 3])
  })

  it('climbs and darkens as the device does, over sixteen seconds of a held key', async () => {
    for (const [name, values] of Object.entries(presets)) {
      // The brush is a noise, and uneven blows or a fall are not at the same moment: those are held as means.
      const loose =
        valueOf(values)('beater') === 3 ||
        ['Counted strokes', 'Choked mallet', 'Breathing bronze'].includes(name)
      const is = await reported(values, 146.83, 0.8)
      const { registers } = gongLife(valueOf(values), 146.83, 0.8)
      const mean = (levels: Float32Array): number =>
        10 * Math.log10(levels.slice(18).reduce((sum, each) => sum + each * each, 0) / 31)
      if (loose) expect(Math.abs(mean(is[0]) - mean(registers[0])), name).toBeLessThan(4.5)
      for (let r = 0; r < 4 && !loose; r++) {
        let sum = 0
        for (let step = 18; step <= GONG_STEPS; step++)
          sum += Math.abs(heard(is[r][step]) - heard(registers[r][step])) / 31
        expect(sum, `${name} register ${r}`).toBeLessThan(r === 0 ? 1.2 : 3)
      }
    }
  }, 120000)

  it('lights the rungs one after another, and none with Climb down', () => {
    const first = (levels: Float32Array): number => levels.findIndex((level) => heard(level) > -35)
    const { registers } = gongLife(valueOf({}), GONG_REST.hz, GONG_REST.gain)
    const lit = registers.map(first)
    expect(Math.min(...lit)).toBeGreaterThan(0)
    expect(lit).toEqual([...lit].sort((a, b) => a - b))
    const still = gongLife(valueOf({ climb: 0, roll: 0 }), GONG_REST.hz, GONG_REST.gain)
    expect(Math.max(...still.registers[3])).toBeLessThan(0.001)
  })
})

describe('the drawing of climbing-gong', () => {
  it('puts the round on a third root of time and the rings apart', () => {
    for (const seconds of [0.1, 1, 4, 16])
      expect(gongTime(gongTurn(seconds))).toBeCloseTo(seconds, 9)
    expect([gongTurn(2), gongTurn(16)]).toEqual([0.5, 1])
    expect([gongShare(1), gongShare(0), gongShare(1e-3)]).toEqual([1, 0, 0])
    for (const { ratio } of GONG_METALS) {
      const outs = ratio.map((each) => gongOut(each, Math.max(...ratio)))
      expect([outs[0], outs[17]]).toEqual([0, 1])
    }
    expect(gongPoint(at, 1, 0.5)[1]).toBeCloseTo(at.cy - at.ry, 9)
  })

  it('has a point for Place along the foot and one for Climb outward and Climb time round', () => {
    const view = viewOf(display, CLIMBING_GONG_PARAMS, {
      values: { place: 0.7, climb: 0.4, climbTime: 2 },
    })
    const [place, climb] = display.handles?.(view) ?? []
    expect([place.x, place.y]).toEqual([...gongPoint(at, 0.7, 0)])
    expect([climb.x, climb.y]).toEqual([...gongPoint(at, 0.4, 0.5)])
    expect(place.drag(...gongPoint(at, 0.25, 0)).place).toBeCloseTo(0.25, 9)
    const set = climb.drag(...gongPoint(at, 0.8, gongTurn(5)))
    expect(set.climb).toBeCloseTo(0.8, 9)
    expect(set.climbTime).toBeCloseTo(5, 9)
    expect(climb.drag(at.cx - at.rx, at.cy + 30)).toEqual({ climb: 1, climbTime: 0.2 })
    expect(climb.reset?.()).toEqual({ climb: 0.55, climbTime: 0.8 })
  })

  it('draws what is reported in the accent, from the stroke up to the hand', () => {
    const accents = (drawn: ReturnType<typeof drawDisplay>) =>
      drawnPaths(drawn).filter(
        (path) => path.kind === 'fill' && path.colour === PLAIN_COLOURS.accent,
      )
    expect(accents(drawDisplay(display, CLIMBING_GONG_PARAMS))).toEqual([])
    const drawn = runDisplay(
      display,
      CLIMBING_GONG_PARAMS,
      2,
      { signal: testSignal(), meters: { rung1: 0.8, rung2: 0.2, rung3: 0, rung4: 0 } },
      (time) => ({ notes: [{ id: 1, frequency: 146.83, gain: 0.8, age: time, released: null }] }),
    )
    const lit = accents(drawn).flatMap((path) => path.points)
    expect(lit.length).toBeGreaterThan(40)
    // Two seconds are half the round: nothing is lit to the right of the middle.
    for (const [x] of lit) expect(x).toBeLessThan(at.cx + 3)
  })
})
