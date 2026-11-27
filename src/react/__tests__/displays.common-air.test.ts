// The truth of the Common Air display: the breath it draws against the pressure
// the compiled device reports, the order its reeds fall silent in against the
// sound, the pairs and the sag against the header, and what its handles set.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { COMMON_AIR_PARAMS } from '../../dsp/devices/common-air.gen'
import {
  AIR_REEDS,
  COMMON_AIR_FACES,
  airBreath,
  airEdges,
  airLayout,
  airPair,
  airSag,
  airSettings,
  airSwing,
  airUnder,
} from '../components/displays/common-air'
import { PLAIN_COLOURS } from '../components/display-kit'
import { displaySize, drawDisplay, drawnPaths, runDisplay, viewOf } from './display-harness'

const RATE = 48000
const display = COMMON_AIR_FACES['common-air'].display
const size = displaySize(display)
type Name = keyof typeof COMMON_AIR_PARAMS
type Values = Partial<Record<Name, number>>
const settingsOf = (values: Values = {}) =>
  airSettings((name) => values[name as Name] ?? COMMON_AIR_PARAMS[name as Name].default)
const hzOf = (key: number): number => 440 * Math.pow(2, (key - 69) / 12)

/** The device with these values and keys held: its meters and its left side every 128 samples. */
async function played(values: Values, keys: readonly number[], seconds: number) {
  const { device, set, view } = await loadWasmDevice('common-air', RATE)
  for (const [name, value] of Object.entries(values)) set(COMMON_AIR_PARAMS[name as Name], value)
  keys.forEach((key, id) => device.device_note_on?.(id + 1, hzOf(key), 0.7))
  const wave: number[] = []
  const pressure: number[] = []
  const air: number[] = []
  for (let n = 0; n < (seconds * RATE) / 128; n++) {
    device.device_process(128)
    wave.push(...view(device.device_out_left(), 128))
    air.push(device.device_meter?.(0) ?? 0)
    pressure.push(device.device_meter?.(1) ?? 0)
  }
  const at = (list: readonly number[], time: number) => list[Math.round((time * RATE) / 128)]
  return { wave, air: (t: number) => at(air, t), pressure: (t: number) => at(pressure, t) }
}

/** How strong a tone is in a sound about a time. */
function toneAt(wave: readonly number[], hz: number, time: number): number {
  const frames = Math.round(0.12 * RATE)
  let [re, im] = [0, 0]
  for (let i = 0; i < frames; i++) {
    const n = Math.round(time * RATE) + i
    const shade = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frames)
    re += shade * wave[n] * Math.cos((2 * Math.PI * hz * n) / RATE)
    im += shade * wave[n] * Math.sin((2 * Math.PI * hz * n) / RATE)
  }
  return Math.hypot(re, im) / frames
}

describe('the figures of Common Air', () => {
  it.each([0, 1, 2, 4])('draw breath %i as the device reports it under one key', async (breath) => {
    const values: Values = { breath, lung: 1.2, turn: 0.6, second: 0 }
    const plan = airBreath(settingsOf(values))
    const heard = await played(values, [57], plan[plan.length - 1].time)
    for (const point of plan.filter((one, i) => i % 5 === 2 && one.time > 0.03)) {
      const what = `breath ${breath} at ${point.time.toFixed(2)} s`
      expect(Math.abs(heard.pressure(point.time - 0.002) - point.pressure), what).toBeLessThan(0.05)
      if (breath === 4) expect(Math.abs(heard.air(point.time) - point.air)).toBeLessThan(0.03)
    }
  })

  it('draw a round of circular breathing as the device holds it', async () => {
    const values: Values = { breath: 3, lung: 1.6, turn: 1 }
    const set = settingsOf(values)
    const heard = await played(values, [57], 5)
    // The picture begins at the end of a sniff; the second round is past the start's lag.
    const from = set.lung * (2 + 0.15 + set.sniff)
    const plan = airBreath(set).filter((one, i) => one.time > set.lung * 0.3 && i % 6 === 0)
    for (const { time, pressure } of plan.filter((one) => from + one.time < 4.9))
      expect(Math.abs(heard.pressure(from + time) - pressure)).toBeLessThan(0.03)
  })

  it('silence the keys Starve says, and no lone key', async () => {
    const values: Values = { breath: 4, lung: 2, starve: 1, second: 0, pipe: 0, cup: 0, lock: 0 }
    const set = settingsOf(values)
    expect(airUnder(set, 0).under).toBe(AIR_REEDS[0].need)
    expect(airUnder(set, 1).under).toBeCloseTo(0.04 + 0.7, 6)
    const { wave } = await played(values, [50, 62, 74], 2)
    const fall = [50, 74].map((key) => toneAt(wave, hzOf(key), 1.1) / toneAt(wave, hzOf(key), 0.25))
    // The low key outlives the high one by far, as their swings with that air say.
    expect(fall[0]).toBeGreaterThan(3 * fall[1])
    expect(airSwing(set, 0.3, airUnder(set, 0).under)).toBeGreaterThan(0.4)
    expect(airSwing(set, 0.3, airUnder(set, 1).under)).toBe(0)
  })

  it('find the pairs of the header, and bend by thin air alone', () => {
    expect(airPair(hzOf(50), hzOf(57))).toBeCloseTo(1.6 / (1 + 0.175 * 5), 9)
    expect(airPair(hzOf(57), hzOf(50))).toBe(airPair(hzOf(50), hzOf(57)))
    expect(airPair(220, 440)).toBe(1)
    expect(airPair(hzOf(60), hzOf(66))).toBe(0)
    expect(airSag(AIR_REEDS[0], 90, 220, 1)).toBe(0)
    expect(airSag(AIR_REEDS[3], 60, 220, 0.4)).toBeCloseTo(
      1.8 * airSag(AIR_REEDS[0], 60, 220, 0.4),
      6,
    )
  })
})

describe('the picture of Common Air', () => {
  it('fills each key with the air it has and stands its tick where its reed goes silent', () => {
    const { wells } = airLayout(size)
    const notes = [50, 57, 65].map((key, id) => ({
      id,
      frequency: hzOf(key),
      gain: 0.7,
      age: 1,
      released: null,
    }))
    const full = (pressure: number) => {
      const drawn = runDisplay(display, COMMON_AIR_PARAMS, 4, {
        notes,
        meters: { air: 0.5, pressure, way: pressure, lock: 0.5 },
      })
      let fill = ''
      const heights: number[] = []
      for (const call of drawn.calls) {
        if (call.name === 'set fillStyle') fill = String(call.args[0])
        const box = call.args.map(Number)
        if (call.name === 'fillRect' && fill === PLAIN_COLOURS.accent && box[1] > wells.y)
          if (box[1] + box[3] < wells.y + wells.h + 0.1) heights.push(box[3])
      }
      return heights
    }
    expect(full(0.8)).toHaveLength(3)
    for (const high of full(0.8)) expect(high).toBeCloseTo((wells.h * 0.8) / 1.1, 0)
    for (const high of full(0.2)) expect(high).toBeCloseTo((wells.h * 0.2) / 1.1, 0)
    expect(drawnPaths(drawDisplay(display, COMMON_AIR_PARAMS)).length).toBeGreaterThan(10)
  })

  it.each([0, 3, 4])('stands its handles at the ends they set, in breath %i', (breath) => {
    const view = viewOf(display, COMMON_AIR_PARAMS, { values: { breath } })
    const edges = airEdges(view)
    for (const handle of display.handles?.(view) ?? []) {
      expect(edges.some((edge) => Math.abs(edge - handle.x) < 1e-6)).toBe(true)
      const name = handle.key as 'lung' | 'turn'
      expect(handle.drag(handle.x, 0)[name]).toBeCloseTo(view.value(name), 4)
      expect(handle.drag(999, 0)[name]).toBeCloseTo(COMMON_AIR_PARAMS[name].max, 6)
      const moved = handle.drag(handle.x + 3, 0)
      const again = viewOf(display, COMMON_AIR_PARAMS, { values: { breath, ...moved } })
      const now = display.handles?.(again).find((one) => one.key === handle.key)
      expect(now?.x).toBeCloseTo(handle.x + 3, 1)
    }
  })
})
