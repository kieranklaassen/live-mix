// The truth of the Deep Roots display: the roots it draws against the compiled
// device at 48 kHz (the deepest it reports, how far the chord has met, the sound
// at each pitch and when a root comes up), the bass's partials against the
// spectrum of one, and the two points that can be taken hold of.

import { describe, expect, it } from 'vitest'

import { DEEP_ROOTS_PARAMS } from '../../dsp/devices/deep-roots.gen'
import { PLAIN_COLOURS } from '../components/display-kit'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { DEEP_ROOTS_FACES } from '../components/displays/deep-roots'
import {
  deepFresh,
  deepGrown,
  deepKeysNow,
  deepRootsNow,
  deepSettings,
} from '../components/displays/deep-roots-growth'
import {
  DEEP_REACH_FROM,
  deepHandles,
  deepLayout,
  deepY,
} from '../components/displays/deep-roots-layout'
import { DEEP_SOILS, deepPartials, deepPlan } from '../components/displays/deep-roots-law'
import { hzOfKey } from '../components/displays/instrument-parts'
import { type DisplayFrame } from '../components/plate-display'
import { displaySize, drawnPaths, frameOf, runDisplay, testSignal, viewOf } from './display-harness'

const RATE = 48000
const { display } = DEEP_ROOTS_FACES['deep-roots']
type Name = keyof typeof DEEP_ROOTS_PARAMS
type Values = Partial<Record<Name, number>>
const settingsOf = (values: Values = {}) =>
  deepSettings((name) => values[name as Name] ?? DEEP_ROOTS_PARAMS[name as Name].default)
const WIDE = [50, 57, 65, 72, 76]
/** Nothing that moves by itself, up at once. */
const STILL: Values = { sway: 0, growth: 0.02, attack: 0.05, balance: 1, width: 0, volume: -6 }

/** Keys held for so many seconds: what the device reports at the end, and its last second of sound. */
async function held(values: Values, keys: readonly number[], seconds: number) {
  const loaded = await loadWasmDevice('deep-roots', RATE)
  const { device } = loaded
  for (const [name, value] of Object.entries(values))
    loaded.set(DEEP_ROOTS_PARAMS[name as Name], value)
  for (const [id, key] of keys.entries()) device.device_note_on?.(id, hzOfKey(key), 0.7)
  const sound = new Float32Array(Math.round((seconds * RATE) / 32) * 32)
  for (let done = 0; done < sound.length; done += 32) {
    device.device_process(32)
    sound.set(loaded.view(device.device_out_left(), 32), done)
  }
  const [deepest, meeting, count] = [0, 1, 2].map((index) => device.device_meter?.(index) ?? 0)
  return { deepest, meeting, count, sound: sound.subarray(-RATE) }
}

/** How strong a tone is over a second, through a raised cosine. */
function toneDb(wave: Float32Array, hz: number): number {
  let [re, im] = [0, 0]
  for (let i = 0; i < wave.length; i += 1) {
    const shade = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / wave.length)
    re += shade * wave[i] * Math.cos((2 * Math.PI * hz * i) / RATE)
    im += shade * wave[i] * Math.sin((2 * Math.PI * hz * i) / RATE)
  }
  return 20 * Math.log10((4 * Math.hypot(re, im)) / wave.length + 1e-9)
}

const CASES: [string, Values, number[]][] = [
  ['the defaults on a chord', {}, WIDE],
  ['one key', {}, [69]],
  ['a fifth, shared root', { meeting: -0.8 }, [57, 64]],
  ['a chord, shared root', { meeting: -1, tolerance: 150, branching: 1 }, WIDE],
  ['every division', { meeting: -0.5, series: 0.66, reach: 3.2, branching: 1 }, [60, 64, 67]],
  ['true differences', { meeting: 1, fit: 0, reach: 1, branching: 0 }, [60, 64, 67]],
  ['each alone', { meeting: 0, branching: 1, series: 0.5 }, [57, 60, 64]],
  ['a narrow tolerance', { meeting: 0.9, tolerance: 6, series: 0.4 }, [60, 63, 70]],
]

describe('the roots of deep-roots', () => {
  it.each(CASES)('are where the device has them: %s', async (_, given, keys) => {
    const values = { ...STILL, ...given }
    const heard = await held(values, keys, 6)
    const asked = keys.map((key) => ({ hz: hzOfKey(key), gain: 0.7, from: 0 }))
    const { roots, meeting } = deepPlan(settingsOf(values), asked)
    const strong = roots.filter((root) => root.power > 0.06)
    expect(meeting).toBeCloseTo(heard.meeting, 2)
    expect(Math.min(...strong.map((root) => root.goalHz)) / heard.deepest).toBeCloseTo(1, 2)
    // The two strongest stand out in the sound at the pitches they are drawn at.
    for (const { goalHz } of [...strong].sort((a, b) => b.power - a.power).slice(0, 2)) {
      const beside = [0.9, 1.1].map((off) => toneDb(heard.sound, goalHz * off))
      expect(toneDb(heard.sound, goalHz) - Math.max(...beside)).toBeGreaterThan(12)
    }
  })

  it.each([
    ['Clay', 0, 2],
    ['Stone', 4, 4],
  ])('have the partials drawn at the right: %s', async (_, soil, count) => {
    const plain: Values = { rootTone: 0.6, meeting: 0, series: 0, reach: 1, branching: 0 }
    const { sound } = await held({ ...STILL, ...plain, soil }, [69], 3)
    const drawn = deepPartials(DEEP_SOILS[soil], 220, 0.6, 0.7).slice(0, count)
    const misses = drawn.map(
      (level, k) => toneDb(sound, 220 * DEEP_SOILS[soil].ratio[k]) - 20 * Math.log10(level),
    )
    expect(Math.max(...misses) - Math.min(...misses)).toBeLessThan(1.5)
  })

  it.each([0.4, 1.5])('come up when the device has them, at a growth of %s s', async (growth) => {
    const plain: Values = { ...STILL, growth, meeting: 0, series: 0, reach: 1, branching: 0 }
    const set = settingsOf(plain)
    const state = deepFresh()
    const at = async (age: number) => {
      const notes = [{ id: 0, frequency: 440, gain: 0.7, age, released: null }]
      const { frame } = frameOf(display, DEEP_ROOTS_PARAMS, { state, now: 10 + age, notes })
      deepKeysNow(state, frame as DisplayFrame<typeof state>, set)
      deepRootsNow(state, set, 10 + age, 0.01)
      const { line, level } = deepGrown(state.roots[0], set, 10 + age)
      return [line, level > 0.2 ? 1 : 0, (await held(plain, [69], age)).count]
    }
    const before = await at(growth * 0.9)
    expect(before[0]).toBeCloseTo(0.9, 2)
    expect(before.slice(1)).toEqual([0, 0])
    expect(await at(growth + 0.5 * (0.014 + 0.8 * growth))).toEqual([1, 1, 1])
  })
})

describe('the drawing of deep-roots', () => {
  const { pitch } = deepLayout(displaySize(display))

  it.each([0.25, 1])('has the bass on a line as long as the chord has met: %s', (meeting) => {
    const held = { gain: 0.7, age: 9, released: null }
    const notes = WIDE.map((key, id) => ({ id, frequency: hzOfKey(key), ...held }))
    const meters = { deepest: hzOfKey(38), meeting }
    const signal = testSignal()
    const drawn = runDisplay(display, DEEP_ROOTS_PARAMS, 1, { signal, notes, meters })
    expect(drawn.words()).toContain('D2  73 Hz')
    const y = deepY(hzOfKey(38), pitch)
    const [line, ...others] = drawnPaths(drawn)
      .filter(({ kind, colour }) => kind === 'stroke' && colour === PLAIN_COLOURS.accent)
      .map(({ points }) => points)
      .filter((points) => points.every((point) => Math.abs(point[1] - y) <= 0.5))
      .filter(([from]) => from[0] < pitch.w / 2)
    expect(others).toEqual([])
    expect(line[1][0] - line[0][0]).toBeCloseTo(pitch.w * meeting, 0)
  })

  it('has a point for Floor and one for Reach, at the pitches they stand for', () => {
    const given: Record<string, number>[] = [{}, { floor: 90, reach: 3.2 }]
    for (const values of given) {
      const view = viewOf(display, DEEP_ROOTS_PARAMS, { values })
      const [floor, reach] = deepHandles(view)
      expect(floor.y).toBeCloseTo(deepY(view.value('floor'), pitch), 6)
      expect(floor.drag(0, floor.y).floor).toBeCloseTo(view.value('floor'), 6)
      expect(floor.drag(0, deepY(60, pitch)).floor).toBeCloseTo(60, 6)
      expect(reach.y).toBeCloseTo(deepY(DEEP_REACH_FROM / 2 ** view.value('reach'), pitch), 6)
      expect(reach.drag(0, reach.y).reach).toBeCloseTo(view.value('reach'), 6)
      expect(reach.drag(0, deepY(DEEP_REACH_FROM / 4, pitch)).reach).toBeCloseTo(2, 6)
    }
  })
})
