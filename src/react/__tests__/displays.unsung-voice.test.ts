// The truth of the Unsung Voice display: its meetings, its odds and its
// overtones against the compiled device, its drawing, and its points.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { UNSUNG_VOICE_PARAMS as PARAMS } from '../../dsp/devices/unsung-voice.gen'
import { PLAIN_COLOURS } from '../components/display-kit'
import { UNSUNG_VOICE_FACES } from '../components/displays/unsung-voice'
import { unsungBars, unsungKey, unsungSettings } from '../components/displays/unsung-voice-bodies'
import * as meet from '../components/displays/unsung-voice-meetings'
import * as staff from '../components/displays/unsung-voice-staff'
import { displaySize, drawDisplay, drawnPaths, testSignal, viewOf } from './display-harness'

const RATE = 48000
const { display } = UNSUNG_VOICE_FACES['unsung-voice']
const at = staff.unsungLayout(displaySize(display))
type Name = keyof typeof PARAMS
type Values = Partial<Record<Name, number>>
const settingsOf = (values: Values) =>
  unsungSettings((name) => values[name as Name] ?? PARAMS[name as Name].default)
const hzOf = (key: number): number => 440 * 2 ** ((key - 69) / 12)
const CHORD = [50, 57, 65, 72, 76]
const listOf = (values: Values, keys: readonly number[]) => {
  const { tolerance, register, partner } = settingsOf(values)
  return meet.unsungMeetings(keys.map(hzOf), tolerance, register, partner)
}
const db = (ratio: number): number => 20 * Math.log10(ratio)

/** The device with these keys held until `off`: where its line stands every 32 samples, and its left side. */
async function played(values: Values, keys: readonly number[], seconds: number, off = Infinity) {
  const loaded = await loadWasmDevice('unsung-voice', RATE)
  const { device_note_on: down, device_note_off: up, device_meter: meter } = loaded.device
  if (!down || !up || !meter) throw new Error('takes no notes')
  for (const name of Object.keys(values) as Name[]) loaded.set(PARAMS[name], values[name] ?? 0)
  keys.forEach((key, id) => down(id, hzOf(key), 0.8))
  const line: number[] = []
  const wave = new Float32Array(Math.ceil((seconds * RATE) / 32) * 32)
  for (let n = 0; n < wave.length; n += 32) {
    if (n === Math.ceil((off * RATE) / 32) * 32) keys.forEach((_, id) => up(id))
    loaded.device.device_process(32)
    wave.set(loaded.view(loaded.device.device_out_left(), 32), n)
    line.push(meter(0))
  }
  return { line, wave }
}

describe('the figures of unsung-voice', () => {
  it.each<Values>([
    {},
    { tolerance: 60 },
    { register: 700, partner: 10 },
    { partner: 4, tolerance: 8 },
    { partner: 12, register: 2800 },
  ])('has the meetings of the device: %o', async (values) => {
    for (const keys of [CHORD, [48, 55, 60], [45, 52, 59, 61], [57], [36], [84]]) {
      const list = listOf(values, keys)
      const set = { ...values, glide: 0, pace: 0.12, second: 0 }
      const line = (await played(set, keys, 4)).line.filter((hz) => hz > 0)
      const where = line.map((hz) => list.findIndex((one) => Math.abs(one.hz / hz - 1) < 2e-4))
      expect(where, `${keys.join(' ')}: a meeting the display lacks`).not.toContain(-1)
      if (list.length > 0) expect(where[0]).toBe(meet.unsungFirst(list, 0.15))
      expect(new Set(where).size).toBeGreaterThanOrEqual(Math.min(2, list.length))
    }
  })

  it.each([-1, -0.5, 0.15, 1])('steps as often as the display says, Lean %d', async (lean) => {
    const list = listOf({}, CHORD)
    const { line } = await played({ lean, glide: 0, pace: 0.12, second: 0 }, CHORD, 60)
    const steps = line
      .map((hz) => list.findIndex((one) => Math.abs(one.hz / hz - 1) < 2e-4))
      .filter((is, i, all) => is >= 0 && is !== all[i - 1])
    const seen = list.map(() => 0)
    const due = list.map(() => 0)
    for (const [i, to] of steps.entries()) {
      if (i === 0) continue
      const odds = meet.unsungOdds(list, list[steps[i - 1]].hz, 0, lean)
      expect(odds[to], `${steps[i - 1]} to ${to}`).toBeGreaterThan(0)
      odds.forEach((share, k) => (due[k] += share))
      seen[to] += 1
    }
    expect(steps.length).toBeGreaterThan(300)
    for (const [k, times] of seen.entries())
      expect(Math.abs(times - due[k]), `meeting ${k}`).toBeLessThan(4 * Math.sqrt(due[k] + 1))
  })

  const PLAIN: Values = { closeness: 1, breath: 0, lift: 0, partner: 0, width: 0, attack: 0.05 }
  it.each<Values>([
    {},
    { body: 1, vowel: 0.6 },
    { body: 2, vowel: 0.5 },
    { body: 3, tilt: 0.4 },
    { body: 4, tilt: -0.5 },
  ])('has the overtones of the device: %o', async (more) => {
    const values = { ...PLAIN, ...more }
    const note = { id: 0, frequency: hzOf(57), gain: 0.8, age: 4, released: null }
    const bars = unsungBars(settingsOf(values), note)
    const wave = (await played(values, [57], 5)).wave.subarray(3 * RATE)
    const strong = bars.map((_, k) => {
      let re = 0
      let im = 0
      for (let n = 0; n < wave.length; n += 1) {
        const turn = (2 * Math.PI * note.frequency * (k + 1) * n) / RATE
        const shade = wave[n] * (1 - Math.cos((2 * Math.PI * n) / wave.length))
        re += shade * Math.cos(turn)
        im += shade * Math.sin(turn)
      }
      return Math.hypot(re, im)
    })
    const top = bars.indexOf(Math.max(...bars))
    const heard = bars.flatMap((bar, k) => (db(bar / bars[top]) > -38 ? [k] : []))
    expect(heard.length).toBeGreaterThanOrEqual(3)
    for (const k of heard) {
      const off = db(strong[k] / strong[top]) - db(bars[k] / bars[top])
      expect(Math.abs(off), `overtone ${k + 1}`).toBeLessThan(3)
    }
  })

  it('comes in and goes as the device does', async () => {
    const values: Values = { ...PLAIN, body: 1, attack: 1.5, release: 4 }
    const { wave } = await played(values, [57], 4, 3)
    const level = (time: number): number =>
      Math.hypot(...wave.subarray(Math.round(time * RATE), Math.round((time + 0.08) * RATE)))
    for (const time of [0.1, 0.2, 0.5, 3.1, 3.4]) {
      const { env } = unsungKey(settingsOf(values), time + 0.04, time > 3 ? time - 2.96 : null)
      // The touch is darker while the key comes in, so it is a little softer than its envelope.
      const off = db(level(time) / level(2.8)) - db(env)
      expect(Math.abs(off), `${time} s`).toBeLessThan(time < 1 ? 5 : 3)
    }
  })
})

describe('the picture of unsung-voice', () => {
  it('shows the line on its meeting, through the keys it is made of', () => {
    const { hz } = listOf({}, CHORD)[2]
    const notes = CHORD.map((key, id) => {
      return { id, frequency: hzOf(key), gain: 0.8, age: 2, released: null }
    })
    const meters = { line: hz, lineLevel: 0.6, second: 0, secondLevel: 0 }
    const drawn = drawDisplay(display, PARAMS, { notes, meters, signal: testSignal() })
    const y = staff.unsungY(hz, 1800, at.staff)
    const dots = drawn.calls.filter((call) => call.name === 'arc')
    expect(dots.some((call) => call.args[0] === at.now && call.args[1] === y)).toBe(true)
    const through = drawnPaths(drawn).filter(
      ({ colour, points }) => colour === PLAIN_COLOURS.accent && points.at(-1)?.[0] === at.staff.x,
    )
    expect(through).toHaveLength(1)
    expect(Math.abs(through[0].points[0][1] - y)).toBeLessThanOrEqual(0.5)
  })

  it('lets Register, Pace and Lean be taken where they stand', () => {
    const view = viewOf(display, PARAMS, { values: { pace: 3, lean: -0.4 } })
    const [register, step] = staff.unsungHandles(view)
    expect(register.drag(0, staff.unsungTop(1200, at.staff)).register).toBeCloseTo(1200, 4)
    expect(step.drag(at.now + staff.unsungAway(5, at.staff), 0).pace).toBeCloseTo(5, 6)
    expect(step.drag(step.x, step.y).lean).toBeCloseTo(-0.4, 6)
    expect(step.drag(0, staff.unsungTop(1800, at.staff)).lean).toBeCloseTo(1, 6)
  })
})
