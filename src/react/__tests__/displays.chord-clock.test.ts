// The truth of the Chord Clock display: where its marks stand and how far its
// Path has gone against the compiled device played at 48 kHz, the tuning of
// its keys, what is drawn at rest, and what its two points set.

import { describe, expect, it } from 'vitest'

import { CHORD_CLOCK_PARAMS } from '../../dsp/devices/chord-clock.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { CHORD_CLOCK_FACES, clockLayout, clockWords } from '../components/displays/chord-clock'
import {
  clockBelow,
  clockKnobs,
  clockMarks,
  clockMove,
  clockRatio,
  clockState,
  type ClockState,
} from '../components/displays/chord-clock-keys'
import { drawDisplay, viewOf } from './display-harness'

const RATE = 48000
const { display } = CHORD_CLOCK_FACES['chord-clock']
type Values = Partial<Record<keyof typeof CHORD_CLOCK_PARAMS, number>>
const knobsOf = (values: Values) =>
  clockKnobs((name) => {
    const key = name as keyof typeof CHORD_CLOCK_PARAMS
    return values[key] ?? CHORD_CLOCK_PARAMS[key].default
  })
const D3 = 146.8324
const keyHz = (semitones: number): number => D3 * 2 ** (semitones / 12)
const held = (keys: readonly number[], age: number) =>
  keys.map((key) => ({ id: key, frequency: keyHz(key), gain: 0.7, age, released: null }))

/** The keys held for so many seconds on the compiled device, both sides added. */
async function play(values: Values, keys: readonly number[], seconds: number) {
  const { device, set, view } = await loadWasmDevice('chord-clock', RATE)
  for (const [name, value] of Object.entries(values))
    set(CHORD_CLOCK_PARAMS[name as keyof Values], value)
  for (const key of keys) device.device_note_on?.(key, keyHz(key), 0.7)
  const sound = new Float32Array(Math.round((seconds * RATE) / 128) * 128)
  for (let done = 0; done < sound.length; done += 128) {
    device.device_process(128)
    const left = view(device.device_out_left(), 128)
    const right = view(device.device_out_right(), 128)
    for (let i = 0; i < 128; i++) sound[done + i] = left[i] + right[i]
  }
  return sound
}

/** When a pulse is struck: the 5 ms windows four times louder than what came before. */
function onsets(sound: Float32Array): number[] {
  const step = RATE / 200
  const level = Array.from({ length: Math.floor(sound.length / step) }, (_, i) =>
    Math.hypot(...sound.subarray(i * step, (i + 1) * step)),
  )
  const found: number[] = []
  level.forEach((now, i) => {
    const before = Math.max(...level.slice(Math.max(i - 4, 0), i), 1e-4)
    if (i > 0 && now > 4 * before && i / 200 - (found.at(-1) ?? -1) > 0.03) found.push(i / 200)
  })
  return found
}

/** The display's clocks after so many seconds, moved frame by frame as the plate moves them. */
function moved(values: Values, keys: readonly number[], seconds: number): ClockState {
  const state = clockState()
  const frames = Math.round(seconds * 30)
  for (let n = 0; n <= frames; n++)
    clockMove(state, held(keys, n / 30), knobsOf(values), n === 0 ? 0 : 1 / 30)
  return state
}

const PULSES: Values = { tone: 0, rhythm: 1, bloom: 0, lift: 0, accent: 0 }
const DRY: Values = { ...PULSES, damping: 1, body: 2, path: 2, quicken: 0.5, pulseWidth: 0.1 }

describe('the display of chord-clock', () => {
  it.each([
    ['together', {}],
    ['staggered', { stagger: 1 }],
    ['not agreeing', { agree: 0 }],
  ])('puts a mark where the device strikes: keys %s', async (_, more: Values) => {
    const values = { ...DRY, ...more, slowness: 7 }
    const keys = [0, 7]
    const found = onsets(await play(values, keys, 8)).filter((at) => at > 4.2 && at < 7.4)
    const state = moved(values, keys, 4)
    const pulse = 1 / (state.anchorHz * 2 ** -7)
    // Two turns on from the fourth second, the marks as times.
    const times = state.keys.flatMap((key) =>
      clockMarks(state, key).flatMap(({ share }) => {
        const first = share - ((state.master / state.turn) % 1)
        return [-1, 0, 1, 2, 3].map((n) => 4 + (first + n) * state.turn * pulse)
      }),
    )
    expect(found.length).toBeGreaterThan(5)
    if (more.agree === 0) expect(clockWords(state, knobsOf(values))).toBe('drifting')
    for (const at of found)
      expect(Math.min(...times.map((time) => Math.abs(time - at))), `at ${at}`).toBeLessThan(0.035)
  })

  it('tunes a key to its fraction as the device does', async () => {
    expect([clockRatio(2, 15), clockRatio(3, 10), clockRatio(1, 26)]).toEqual([
      [12, 5],
      [7, 4],
      [9, 2],
    ])
    const sound = await play({ rhythm: 0, bloom: 0, attack: 0.05, quicken: 0.5 }, [0, 15], 3)
    const power = (hz: number): number => {
      let [re, im] = [0, 0]
      for (let i = RATE; i < sound.length; i++) {
        const fade = Math.sin((Math.PI * (i - RATE)) / (sound.length - RATE)) ** 2
        re += sound[i] * fade * Math.cos((2 * Math.PI * hz * i) / RATE)
        im += sound[i] * fade * Math.sin((2 * Math.PI * hz * i) / RATE)
      }
      return re * re + im * im
    }
    const { aim } = moved({}, [0, 15], 1).keys[1]
    expect(aim / D3).toBeCloseTo(12 / 5, 4)
    expect(power(aim)).toBeGreaterThan(20 * power(keyHz(15)))
  })

  it('takes each Path as the device does', async () => {
    expect([0, 0.5, 1].map((u) => clockBelow(0, 6, u))).toEqual([6, 3, 0])
    expect([0, 0.2, 1].map((u) => clockBelow(1, 4.5, u))).toEqual([4.5, 3.5, 0])
    expect([0, 0.5, 2].map((u) => clockBelow(2, 6, u))).toEqual([0, 3, 6])
    expect([0, 0.5, 1].map((u) => clockBelow(3, 6, u))).toEqual([6, 0, 6])
    // Glide under way: the pulses come as fast as the line says, near the second second.
    const sound = await play({ ...DRY, path: 0, quicken: 8, slowness: 6 }, [0], 2.4)
    const times = onsets(sound).filter((at) => at > 1.6)
    const expected = (from: number, to: number) =>
      D3 * 2 ** -clockBelow(0, 6, (from + to) / 16) * (to - from)
    expect(times.length).toBeGreaterThan(3)
    expect(Math.abs(times.length - expected(1.6, 2.4))).toBeLessThan(3)
  })

  it('shows four against five against six at rest', () => {
    const words = drawDisplay(display, CHORD_CLOCK_PARAMS).calls.filter(
      ({ name }) => name === 'fillText',
    )
    expect(words.map(({ args }) => args[0])).toEqual(
      expect.arrayContaining(['Tap, wood', '4:5:6', '20 Hz']),
    )
    const state = moved({}, [0, 4, 7], 0)
    expect(state.keys.map((key) => clockMarks(state, key).length)).toEqual([4, 5, 6])
    expect(clockMarks(state, state.keys[2]).filter(({ home }) => home)).toHaveLength(2)
  })

  it('sets Slowness from the slow end and Quicken from the far one', () => {
    const view = viewOf(display, CHORD_CLOCK_PARAMS)
    const { lane } = clockLayout(view)
    const [slow, far] = display.handles?.(view) ?? []
    for (const slowness of [2, 5, 10]) {
      const [there] =
        display.handles?.(viewOf(display, CHORD_CLOCK_PARAMS, { values: { slowness } })) ?? []
      expect(slow.drag(there.x, there.y).slowness).toBeCloseTo(slowness, 5)
    }
    expect(far.drag(lane.x + lane.w / 2, 0).quicken).toBeCloseTo(7.5, 5)
    expect(far.drag(lane.x + lane.w, 0).quicken).toBeCloseTo(30, 5)
  })
})
