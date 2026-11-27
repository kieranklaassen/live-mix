// The truth of the Ringing Order display: how loud each ringer is against the
// compiled device played at 48 kHz (every order, every voice with a pitch, every
// tower, a key that is let go), the ropes and the order it draws against that,
// and the two points that can be taken hold of.

import { describe, expect, it } from 'vitest'

import { RINGING_ORDER_PARAMS } from '../../dsp/devices/ringing-order.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { RINGING_ORDER_FACES, ringingHandles } from '../components/displays/ringing-order'
import { ringingLayout, ringingRope } from '../components/displays/ringing-order-layout'
import {
  RINGING_METHODS,
  RINGING_TOWERS,
  ringingBlows,
  ringingHunt,
  ringingKeys,
  ringingPage,
  ringingSettings,
  type RingingSettings,
} from '../components/displays/ringing-order-rows'
import {
  ringingLevels,
  ringingOvers,
  ringingTilts,
} from '../components/displays/ringing-order-sound'
import { displaySize, drawnPaths, runDisplay, testSignal, viewOf } from './display-harness'

const RATE = 48000
const { display } = RINGING_ORDER_FACES['ringing-order']
const size = displaySize(display)
type Name = keyof typeof RINGING_ORDER_PARAMS
type Values = Partial<Record<Name, number>>
const settingsOf = (values: Values = {}): RingingSettings =>
  ringingSettings((name) => values[name as Name] ?? RINGING_ORDER_PARAMS[name as Name].default)

/** Nothing but the lowest partial of each ringer, in the middle of the room. */
const PLAIN: Values = { body: 0, cover: 0, bite: 0, beat: 0, crossing: 0, place: 0, volume: -18 }
const KEYS = [220, 770]

/** The sound of keys pressed at once, and let go after so many seconds. */
async function played(values: Values, hz: readonly number[], seconds: number, off: number) {
  const loaded = await loadWasmDevice('ringing-order', RATE)
  const { device } = loaded
  for (const [name, value] of Object.entries(values))
    loaded.set(RINGING_ORDER_PARAMS[name as Name], value)
  for (const [id, each] of hz.entries()) device.device_note_on?.(id, each, 0.7)
  const sum = new Float32Array(Math.round((seconds * RATE) / 32) * 32)
  for (let done = 0; done < sum.length; done += 32) {
    if (done >= off * RATE) for (const id of hz.keys()) device.device_note_off?.(id)
    device.device_process(32)
    sum.set(loaded.view(device.device_out_left(), 32), done)
  }
  return sum
}

/** How strong a tone is around a time, through a raised cosine of 60 ms. */
function toneDb(wave: Float32Array, hz: number, time: number): number {
  const frames = 0.06 * RATE
  const from = Math.round(time * RATE - frames / 2)
  let [re, im] = [0, 0]
  for (let i = 0; i < frames; i += 1) {
    const shade = (0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / frames)) * (wave[from + i] ?? 0)
    re += shade * Math.cos((2 * Math.PI * hz * i) / RATE)
    im += shade * Math.sin((2 * Math.PI * hz * i) / RATE)
  }
  return 20 * Math.log10((4 * Math.hypot(re, im)) / frames + 1e-9)
}

describe('the rows of ringing-order', () => {
  it.each<[string, Values, number]>([
    ...RINGING_METHODS.map((name, method): [string, Values, number] => [name, { method }, 1]),
    ...[1, 2, 3, 5].map((voice): [string, Values, number] => [`voice ${voice}`, { voice }, 1]),
    ...RINGING_TOWERS.map((name, tower): [string, Values, number] => [name, { tower }, 2]),
    ['weight, swing and a gap', { weight: 0.7, swing: 0.6, gap: 0.5, series: 1 }, 1],
    ['leather and a tilt', { muffle: 0.6, tilt: -4, series: 2, voice: 3 }, 1],
    ['chord tones of a lone key, fused', { series: 4, overlap: 0.95, attack: 0.1 }, 1],
  ])('are as loud as the device: %s', async (_, given, count) => {
    const values = { ...PLAIN, muffle: 0, tilt: 0, overlap: 0.6, row: 1.2, ringers: 5, ...given }
    const set = settingsOf(values)
    const [seconds, off, hz] = [6, 4.8, KEYS.slice(0, count)]
    const wave = await played(values, hz, seconds, off)
    const clock = seconds / set.row
    const keys = ringingKeys(
      set,
      hz.map((frequency, id) => ({
        ...{ id, frequency, gain: 0.7, age: seconds, released: seconds - off },
      })),
      clock,
    )
    const steps = seconds * 50 + 1
    const misses: number[] = []
    for (const key of keys.map((each) => ({ ...each, keys: count, rank: each.slot }))) {
      const overs = ringingOvers(set, key.hz, hz.slice(0, count))
      const tilts = ringingTilts(set, key, overs)
      const levels = ringingLevels(set, key, overs, 0, clock, steps)
      const { blows } = ringingBlows(set, key, 0, clock)
      const own: number[] = []
      for (const [i, over] of overs.entries())
        for (let s = 20; s < 235; s += 7) {
          const near = blows.some(
            (blow) => blow.ringer === i && Math.abs(blow.time * set.row - s / 50) < 0.09,
          )
          const db = 20 * Math.log10(levels[i][s] + 1e-9) + tilts[i]
          const pitch = key.hz * over * (set.voice === 2 ? 1.998 : set.voice === 5 ? 0.5 : 1)
          if (!near && db > -34) own.push(toneDb(wave, pitch, s / 50) - db)
        }
      // One number between the picture and the device for each key: its own level by register.
      const middle = [...own].sort((a, b) => a - b)[own.length >> 1]
      misses.push(...own.map((miss) => Math.abs(miss - middle)))
    }
    expect(misses.length).toBeGreaterThan(30)
    expect(misses.filter((miss) => miss < 1).length / misses.length).toBeGreaterThan(0.95)
  })

  it('are neighbours changing places, and come home after twice as many rows as there are ringers', () => {
    expect(ringingHunt(5, 2)).toEqual([1, 3, 0, 4, 2])
    expect(ringingHunt(7, 14)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})

describe('the drawing of ringing-order', () => {
  it('has the order in the accent, through every blow of the page', () => {
    const notes = [{ id: 1, frequency: 220, gain: 0.7, age: 7, released: null }]
    const drawn = runDisplay(display, RINGING_ORDER_PARAMS, 0.1, { signal: testSignal(), notes })
    const set = settingsOf()
    const { ropes } = ringingLayout(size)
    const { from, to } = ringingPage(set, 7 / set.row)
    const [key] = ringingKeys(set, notes, 7 / set.row)
    const lines = drawnPaths(drawn).filter(
      (path) => path.kind === 'stroke' && path.colour === PLAIN_COLOURS.accent,
    )
    const points = lines.flatMap((path) => path.points)
    const { blows } = ringingBlows(set, key, from, to)
    expect(blows.filter((blow) => blow.time >= from).length).toBeGreaterThan(24)
    for (const blow of blows.filter((each) => !each.entry && each.time > from + 0.1)) {
      const x = ropes.x + ((blow.time - from) / (to - from)) * ropes.w
      const y = ringingRope(blow.ringer, set.ringers, ropes)
      expect(points.some((p) => Math.abs(p[0] - x) < 0.2 && Math.abs(p[1] - y) < 0.1)).toBe(true)
    }
  })

  it('has a point for Gap where the first row ends, and one for Overlap', () => {
    const given: Record<string, number>[] = [{}, { gap: 1, overlap: 0.3 }]
    for (const values of given) {
      const view = viewOf(display, RINGING_ORDER_PARAMS, { values })
      const [gap, overlap] = ringingHandles(view)
      const { ropes } = ringingLayout(size)
      expect((gap.x - ropes.x) * (1 + view.value('gap'))).toBeCloseTo(ropes.w / 4, 6)
      expect(gap.drag(gap.x, 0).gap).toBeCloseTo(view.value('gap'), 6)
      expect(gap.drag(ropes.x + ropes.w / 8, 0).gap).toBeCloseTo(1, 6)
      expect(gap.drag(999, 0).gap).toBe(0)
      expect(overlap.drag(overlap.x, 0).overlap).toBeCloseTo(view.value('overlap'), 6)
      expect(overlap.drag(0, 0).overlap).toBe(0)
    }
  })
})
