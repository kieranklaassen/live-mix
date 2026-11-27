// The truth of the Closed Eyes display: how a key tires and what is seen of its
// opposite against what the compiled device reports, where the opposite lies and how
// strong a struck bell's partials are against its sound, the lids, and its handles.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { CLOSED_EYES_PARAMS } from '../../dsp/devices/closed-eyes.gen'
import {
  CLOSED_EYES_FACES,
  eyeImage,
  eyeLayout,
  eyeLevels,
  eyeMirrored,
  eyeRun,
  eyeSettings,
  eyeSource,
} from '../components/displays/closed-eyes'
import { PLAIN_COLOURS } from '../components/display-kit'
import { displaySize, drawnPaths, runDisplay, viewOf } from './display-harness'

const RATE = 48000
const display = CLOSED_EYES_FACES['closed-eyes'].display
const size = displaySize(display)
type Name = keyof typeof CLOSED_EYES_PARAMS
type Values = Partial<Record<Name, number>>
const settingsOf = (values: Values = {}) =>
  eyeSettings((name) => values[name as Name] ?? CLOSED_EYES_PARAMS[name as Name].default)

/** A key held and let go on the device: its meters and its left side, every 128 samples. */
async function played(values: Values, hz: number, held: number, up: number) {
  const { device, set, view } = await loadWasmDevice('closed-eyes', RATE)
  for (const [name, value] of Object.entries(values)) set(CLOSED_EYES_PARAMS[name as Name], value)
  device.device_note_on?.(1, hz, 0.7)
  const wave: number[] = []
  const meters: number[][] = []
  for (let n = 0; n < ((held + up) * RATE) / 128; n++) {
    if (n === Math.round((held * RATE) / 128)) device.device_note_off?.(1)
    device.device_process(128)
    wave.push(...view(device.device_out_left(), 128))
    meters.push([0, 1].map((i) => device.device_meter?.(i) ?? 0))
  }
  return { wave, meter: (time: number) => meters[Math.round((time * RATE) / 128) - 1] }
}
// How strong a tone is in a sound about a time.
function toneAt(wave: readonly number[], hz: number, time: number, seconds = 0.2): number {
  const frames = Math.round(seconds * RATE)
  let [re, im] = [0, 0]
  for (let i = 0; i < frames; i++) {
    const n = Math.round((time - seconds / 2) * RATE) + i
    const shade = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frames)
    re += shade * wave[n] * Math.cos((2 * Math.PI * hz * n) / RATE)
    im += shade * wave[n] * Math.sin((2 * Math.PI * hz * n) / RATE)
  }
  return Math.hypot(re, im) / frames
}
const HARD = 0.925 // how tired the strongest partial gets at a touch of 0.7

describe('the figures of Closed Eyes', () => {
  it.each<[string, Values]>([
    ['a lamp', {}],
    ['a lamp that rests quickly', { tire: 0.4, recover: 0.6, seep: 0.5, attack: 0.1 }],
    ['a reed that is slow to leave', { source: 1, opposite: 5, rise: 0.8, length: 3 }],
    ['a bowl', { source: 2, opposite: 0, attack: 0.4, tire: 0.8, release: 0.3 }],
  ])('tire %s and bring up its opposite as the device reports', async (_, values) => {
    const set = settingsOf(values)
    const [held, up] = [2.4, 1.6]
    const heard = await played(values, 220, held, up)
    for (const time of [0.2, 0.5, 1, 1.6, 2.3])
      expect(Math.abs(heard.meter(time)[0] - HARD * eyeRun(set, time, 0).tired)).toBeLessThan(0.05)
    for (const after of [0.1, 0.3, 0.7, 1.5]) {
      const run = eyeRun(set, held, after)
      const seen = HARD * run.shown * run.charge
      expect(Math.abs(heard.meter(held + after)[1] - seen), `${after} s on`).toBeLessThan(0.07)
    }
  })

  it('weigh the partials of a struck bell as it sounds', async () => {
    const values: Values = { source: 4, depth: 0, after: 0, air: 0, drift: 0, attack: 0.01 }
    const { wave } = await played({ ...values, width: 0 }, 220, 0.4, 0)
    const { partials } = eyeSource(settingsOf(values), 220, 0.7)
    const levels = [0, 2, 4, 6].map((k) => {
      const [low, high] = [partials[k], partials[k + 1]]
      const drawn = (low.weight + high.weight) * Math.exp((-6.9078 * 0.08) / low.ring)
      return 20 * Math.log10(toneAt(wave, low.hz, 0.08, 0.14) / drawn)
    })
    for (const level of levels) expect(Math.abs(level - levels[0])).toBeLessThan(1.5)
  })

  it('put the opposite where it sounds', async () => {
    expect(eyeMirrored(220)).toBe(1760)
    expect(eyeMirrored(880)).toBe(110)
    for (const opposite of [0, 1, 5]) {
      const values: Values = { opposite, release: 0.15, rise: 0.04, tire: 0.3, drift: 0, width: 0 }
      const { wave } = await played(values, 220, 1.2, 1)
      const made = eyeImage(settingsOf(values), 220, 0.3)
      const { hz } = made.reduce((a, b) => (b.weight > a.weight ? b : a))
      expect(hz / 220).toBeCloseTo([2, 8, 0, 0, 0, 0.5][opposite], 6)
      const others = [hz * 1.31, 220].map((other) => toneAt(wave, other, 1.9))
      expect(toneAt(wave, hz, 1.9)).toBeGreaterThan(5 * Math.max(...others))
    }
  })
})

describe('the picture of Closed Eyes', () => {
  /** How long the rays in a colour are about the eye, under 0 the ones that stand. */
  function rays(colour: string, released: number | null, lids = 0) {
    const drawn = runDisplay(display, CLOSED_EYES_PARAMS, 1, {
      values: { seep: 0 },
      notes: [{ id: 1, frequency: 220, gain: 0.7, age: 2 + (released ?? 0), released }],
      meters: { tired: 0.5, after: 0.5, lids },
    })
    const { eye } = eyeLayout(size)
    return drawnPaths(drawn)
      .filter((path) => path.kind === 'stroke' && path.points.length === 2)
      .filter((path) => path.width === 1.3 && path.colour === colour)
      .filter(({ points: [a, b] }) => a[0] === b[0] && b[1] < eye.y + eye.h + 1)
      .map(({ points: [a, b] }) => b[1] - a[1])
  }

  it('stands a held key over the eye, and hangs its opposite under it once it is gone', () => {
    const { ink, accent } = PLAIN_COLOURS
    const held = rays(ink, null)
    expect(held.length).toBeGreaterThan(3)
    expect(Math.max(...held)).toBeLessThan(0)
    expect(rays(accent, null)).toHaveLength(0)
    expect(rays(ink, 3)).toHaveLength(0)
    const left = rays(accent, 1)
    expect(left.length).toBeGreaterThan(3)
    expect(Math.min(...left)).toBeGreaterThan(0)
    expect(rays(ink, null, 1)).toHaveLength(0)
    expect(rays(accent, null, 1).length).toBeGreaterThan(3)
  })

  it('lowers a key as Depth says and its opposite as After Level says', () => {
    const at = (values: Values) => eyeLevels(settingsOf({ seep: 0, ...values }), 5, 0.6, 9e9)
    const held = (depth: number) => eyeLevels(settingsOf({ seep: 0, depth }), 5, 0, 9e9)[1]
    const { tired } = eyeRun(settingsOf(), 5, 0)
    expect(held(0.8) / held(0)).toBeCloseTo((1 - 0.9 * 0.8 * HARD * tired) ** 2, 6)
    expect(at({ after: 0.4 })[0] / at({ after: 0.8 })[0]).toBeCloseTo(0.5 ** 1.6, 6)
  })

  it.each(['tire', 'length'] as const)('has a handle that takes %s along', (time) => {
    const level = time === 'tire' ? 'depth' : 'after'
    const find = (values: Values) => {
      const view = viewOf(display, CLOSED_EYES_PARAMS, { values })
      const found = display.handles?.(view).find(({ key }) => key === time)
      if (!found) throw new Error('no handle')
      return { ...found, view }
    }
    const first = find({})
    const taken = first.drag(first.x, first.y)
    expect(taken[time]).toBeCloseTo(first.view.value(time), 4)
    expect(taken[level]).toBeCloseTo(first.view.value(level), 4)
    const moved = find(first.drag(first.x + 5, first.y + 3))
    expect(moved.x).toBeCloseTo(first.x + 5, 3)
    expect(moved.y).toBeCloseTo(first.y + 3, 3)
  })
})
