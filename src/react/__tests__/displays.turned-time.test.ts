// The truth of the Turned Time display: the way of a key through its sand and
// the turn a new key gives it against the compiled device played at 48 kHz, the
// partials it draws against a render, what is drawn, and what its points set.

import { describe, expect, it } from 'vitest'

import { TURNED_TIME_PARAMS } from '../../dsp/devices/turned-time.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import * as sand from '../components/displays/turned-time-sand'
import { TURNED_TIME_FACES } from '../components/displays/turned-time'
import * as kit from './display-harness'

const RATE = 48000
const C4 = 261.6256
const { display } = TURNED_TIME_FACES['turned-time']
const at = sand.timeLayout(kit.displaySize(display))
type Values = Partial<Record<keyof typeof TURNED_TIME_PARAMS, number>>
const valueOf =
  (values: Values): sand.TimeValue =>
  (name) =>
    values[name as keyof Values] ?? TURNED_TIME_PARAMS[name as keyof Values].default
const setOf = (values: Values): sand.TimeSet => sand.timeSet(valueOf(values))

/** A device with these values and one key held, run on so many seconds at a time. */
async function player(values: Values) {
  const { device, set, view } = await loadWasmDevice('turned-time', RATE)
  for (const [name, value] of Object.entries(values))
    set(TURNED_TIME_PARAMS[name as keyof Values], value)
  const run = (seconds: number): number[] => {
    const sound: number[] = []
    for (let done = 0; done < seconds * RATE; done += 64) {
      device.device_process(64)
      sound.push(...view(device.device_out_left(), 64))
    }
    return sound
  }
  device.device_note_on?.(1, C4, 0.7)
  const meter = (index: number): number => device.device_meter?.(index) ?? NaN
  return { run, meter, up: () => device.device_note_off?.(1) }
}

/** Every glass so many seconds on. */
function on(set: sand.TimeSet, glasses: sand.TimeGlass[], seconds: number): void {
  for (let done = 0; done < seconds - 1e-6; done += sand.TIME_STEP_SEC)
    for (const glass of glasses) sand.timeStep(set, glass, sand.TIME_STEP_SEC)
}

describe('the display of turned-time', () => {
  it.each<Values>([
    {},
    { neck: 0, inertia: 0.9, sand: 1 },
    { neck: 2, attack: 1.2, sand: 0.7 },
    { neck: 3, body: 5, sand: 0.5 },
    { turn: 1, sand: 0.6, pour: 0.8 },
    { turn: 2, sand: 0.5 },
  ])('runs a glass as the device does, %o', async (values) => {
    // A key has a lean of its own by chance, so nothing leans here.
    const all = { stagger: 0, ...values }
    const [device, set] = [await player(all), setOf(all)]
    const glass = sand.timeStart(set, C4, 0.7, 0)
    for (let at = 0.2; at < 5; at += 0.2) {
      device.run(0.2)
      on(set, [glass], 0.2)
      expect(Math.abs(glass.u - device.meter(0)), `at ${at} s`).toBeLessThan(0.06)
      expect(Math.abs(glass.speed - device.meter(1)), `way at ${at} s`).toBeLessThan(0.25)
    }
  })

  it('is let go as the device is, and turned by the key that follows', async () => {
    const values: Values = { turn: 2, stagger: 0, sand: 1, release: 2 }
    const [device, set] = [await player(values), setOf(values)]
    device.run(1)
    device.up()
    const glass = sand.timeStart(set, C4, 0.7, 0)
    on(set, [glass], 1)
    sand.timeLetGo(set, glass)
    device.run(0.6)
    on(set, [glass], 0.6)
    expect(glass.way).toBe(-1)
    expect(Math.abs(glass.u - device.meter(0))).toBeLessThan(0.03)

    const turned = setOf({ stagger: 0.5, apart: 0.5 })
    const [near, far] = [C4, C4 * 8].map((hz) => sand.timeStart(turned, hz, 0.7, 0))
    on(turned, [near, far], 0.4)
    const key = sand.timeStart(turned, C4 * 1.5, 0.7, 0)
    sand.timeTurnOthers(turned, [near, far, key], C4 * 1.5, key)
    on(turned, [near, far, key], 0.3)
    expect([near.way, far.way, key.way]).toEqual([-1, 1, 1])
  })

  it.each<Values>([
    {},
    { body: 2, split: 0.7, depth: 0.5 },
    { body: 3, neck: 3, sand: 0.8, depth: 0.3, inertia: 0 },
    { body: 5, neck: 0, exchange: 0.8 },
  ])('draws each partial as it goes in a render, %o', async (values) => {
    const still = { stagger: 0, beat: 0, ears: 0, grains: 0, settling: 0, strike: 0, memory: 1 }
    const all = { ...still, sand: 3, volume: -12, ...values }
    const [device, set] = [await player(all), setOf(all)]
    const partials = sand.timePartials(set, C4, 0.7, RATE)
    const heard = [0, 1, 2, 3].map(() => {
      device.run(0.5)
      const before = device.meter(0)
      const sound = device.run(0.06)
      return { u: (before + device.meter(0)) / 2, sound }
    })
    const level = (sound: number[], hz: number): number => {
      let [re, im] = [0, 0]
      sound.forEach((one, i) => {
        const window = one * (1 - Math.cos((2 * Math.PI * i) / sound.length))
        re += window * Math.cos((2 * Math.PI * hz * i) / RATE)
        im += window * Math.sin((2 * Math.PI * hz * i) / RATE)
      })
      return 10 * Math.log10(re * re + im * im + 1e-12)
    }
    const { places } = sand.TIME_BODIES[set.body]
    // Where a partial lies far under the loudest, the air is louder than it.
    const heights = heard.map(({ u }) => Math.max(...partials.map((one) => one.at(u))))
    let read = 0
    for (const k of [0, 1, 2, 3, 4]) {
      const over = heard.filter(({ u }, i) => partials[k].at(u) > heights[i] - 18)
      const off = over.map(({ u, sound }) => level(sound, C4 * places[k]) - partials[k].at(u))
      for (const one of off) expect(Math.abs(one - off[0]), `partial ${k}`).toBeLessThan(2.5)
      read += off.length
    }
    expect(read).toBeGreaterThan(7)
  })

  it('draws a key on its way, and bends it where another turns it', () => {
    const keys = [C4, 392].map((frequency, id) => ({ id, frequency, gain: 0.7, released: null }))
    const each = (t: number) => ({
      notes: keys.map((key) => ({ ...key, age: t - 0.5 * key.id })).filter(({ age }) => age >= 0),
    })
    const options = { values: { stagger: 0 }, meters: {}, signal: kit.testSignal() }
    const drawn = kit.runDisplay(display, TURNED_TIME_PARAMS, 1.1, options, each)
    const way = (colour: string, width: number) =>
      kit
        .drawnPaths(drawn)
        .find((one) => one.colour === colour && one.width === width && one.points.length > 8)
        ?.points.map(([, y]) => y) ?? []
    const [first, newest] = [way(PLAIN_COLOURS.ink, 1), way(PLAIN_COLOURS.accent, 1.5)]
    expect(Math.max(...first)).toBeGreaterThan(first[first.length - 1] + 4)
    expect(newest[newest.length - 1]).toBe(Math.max(...newest))
    expect(drawn.words()).toContain('fading')
  })

  it('sets what its points stand for', () => {
    for (const neck of [0, 1, 2, 3]) {
      const view = kit.viewOf(display, TURNED_TIME_PARAMS, { values: { neck } })
      const [depth, pour] = display.handles?.(view) ?? []
      const deeper = setOf({ neck, ...depth.drag(depth.x + 3, 0) })
      expect(at.middle + sand.timeWide(deeper, 1, at)).toBeCloseTo(depth.x + 3, 2)
      const later = setOf({ neck, ...pour.drag(pour.x + 1, 0) })
      expect(at.middle - sand.timeWide(later, -0.3, at)).toBeCloseTo(pour.x + 1, 2)
    }
  })
})
