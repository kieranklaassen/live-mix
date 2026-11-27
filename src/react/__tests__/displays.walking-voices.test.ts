// The truth of the Walking Voices display: the ways it draws against the pitch
// of the compiled device, how it deals the crowd out, and its points.

import { describe, expect, it } from 'vitest'

import { WALKING_VOICES_PARAMS as PARAMS } from '../../dsp/devices/walking-voices.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import * as face from '../components/displays/walking-voices'
import { Crowd } from '../components/displays/walking-voices-crowd'
import * as people from '../components/displays/walking-voices-people'
import * as way from '../components/displays/walking-voices-way'
import { displaySize, drawDisplay, runDisplay, testNotes, viewOf } from './display-harness'

const RATE = 48000
const { display } = face.WALKING_VOICES_FACES['walking-voices']
const at = way.walkLayout(displaySize(display))
type Values = Partial<Record<keyof typeof PARAMS, number>>
const settingsOf = (values: Values = {}) =>
  people.crowdSettings((name) => ({ ...values })[name as 'lag'] ?? PARAMS[name as 'lag'].default)
const hzOf = (key: number): number => 440 * 2 ** ((key - 69) / 12)

/** One of two people sings alone on D5 and is sent to G5 after two seconds. */
const ALONE: Values = {
  ...{ people: 2, body: 3, leader: 1, vibrato: 0, air: 0, vowelSpread: 0, strain: 0, wander: 0 },
  ...{ breath: 12, agreement: 0.6, spread: 0, stubborn: 0, attack: 0.05, lowShare: 0, vowel: 0 },
}
const TIMES = Array.from({ length: 24 }, (_, i) => 1.9 + 0.07 * i)
const median = (of: number[]): number => of.sort((a, b) => a - b)[of.length >> 1]

async function pitchHeard(values: Values): Promise<number[]> {
  const loaded = await loadWasmDevice('walking-voices', RATE)
  const { device } = loaded
  for (const [name, value] of Object.entries({ ...ALONE, ...values }))
    loaded.set(PARAMS[name as 'lag'], value)
  const wave = new Float32Array(RATE * 4)
  device.device_note_on?.(1, hzOf(74), 0.7)
  for (let done = 0; done < wave.length; done += 64) {
    if (done === 2 * RATE) {
      device.device_note_off?.(1)
      device.device_note_on?.(2, hzOf(79), 0.7)
    }
    device.device_process(64)
    wave.set(loaded.view(device.device_out_left(), 64), done)
  }
  // The middle one of the single cycles in 40 ms.
  return TIMES.map((time) => {
    const rises: number[] = []
    for (let i = Math.round((time - 0.02) * RATE); i < (time + 0.02) * RATE; i++)
      if (wave[i] < 0 && wave[i + 1] >= 0) rises.push(i - wave[i] / (wave[i + 1] - wave[i]))
    return 69 + 12 * Math.log2(RATE / median(rises.slice(1).map((r, i) => r - rises[i])) / 440)
  })
}

function pitchWalked(values: Values): number[] {
  const crowd = new Crowd(settingsOf({ ...ALONE, ...values }))
  const seen = TIMES.map((): number[] => [])
  crowd.play([{ id: 1, pitch: 74 }])
  for (let n = 0; n < 4 * 240; n++) {
    if (n === 2 * 240) crowd.play([{ id: 2, pitch: 79 }], [1])
    crowd.step(1 / 240)
    for (const lead of crowd.walkers.filter((each) => each.lead && each.gate))
      TIMES.forEach((time, i) => {
        if (Math.abs(n / 240 - time) < 0.02) seen[i].push(crowd.heard(lead))
      })
  }
  return seen.map(median)
}

describe('the ways of walking-voices', () => {
  it.each<[string, Values]>([
    ['a slide', { path: 0, lag: 0.9 }],
    ['a long slide', { path: 0, lag: 3 }],
    ['steps', { path: 1, lag: 0.6 }],
    ['a turn', { path: 2, lag: 0.5, reach: 3 }],
    ['a late arrival', { path: 4, lag: 1 }],
  ])('are the device’s: %s', async (_, values) => {
    const heard = await pitchHeard(values)
    const off = pitchWalked(values).map((pitch, i) => Math.abs(pitch - heard[i]))
    // In a spoken step the second of the two is heard for a moment.
    expect(off.filter((each) => each < 0.3).length).toBeGreaterThanOrEqual(20)
    expect(median(off)).toBeLessThan(0.04)
  })

  it('leave two people on every note whatever wanders and breathes', () => {
    const crowd = new Crowd(settingsOf({ wander: 0.8, breath: 0.6, people: 20 }))
    const chords = [
      [50, 57, 65, 72],
      [48, 57, 64, 67, 72],
      [53, 60, 69],
    ]
    chords.forEach((keys, round) => {
      const on = keys.map((pitch, i) => ({ id: 10 * round + i, pitch }))
      const off = crowd.notes.map((note) => note.id)
      crowd.play(on, off)
      for (let n = 0; n < 500; n++) crowd.step(1 / 100)
      for (const note of crowd.notes) {
        const here = crowd.walkers.filter((s) => s.gate && s.own && s.serial === note.serial)
        expect(here.filter((s) => !s.away && s.gap <= 0).length).toBeGreaterThanOrEqual(2)
      }
    })
  })

  it.each([
    [0.9, 38],
    [0, null],
    [-0.9, 84],
  ])('deal everybody out by a Low share of %s', (low, beside) => {
    const seats = people.crowdSeats([50, 57, 65, 72], low)
    people.crowdDeal(seats, 30)
    expect(seats.reduce((sum, seat) => sum + seat.quota, 0)).toBe(30)
    expect(seats.find((seat) => !seat.own)?.pitch ?? null).toBe(beside)
    const own = seats.filter((seat) => seat.own).map((seat) => seat.quota)
    expect(low === 0 || Math.sign(own[0] - own[3]) === Math.sign(low)).toBe(true)
    expect(Math.min(...own)).toBeGreaterThanOrEqual(2)
    expect(people.CROWD_PATHS).toEqual(PARAMS.path.choices)
    expect(people.CROWD_BODIES).toEqual(PARAMS.body.choices)
  })
})

describe('the picture of walking-voices', () => {
  it.each([0, 3])('ends every way where its person stands, with Path at %s', (path) => {
    const seen = way.walkAtRest(settingsOf({ path, wander: 0, breath: 12 }))
    const pieces = seen.crowd.walkers.flatMap((s, i) => {
      if (!s.gate) return []
      const lines = way.walkLines(seen.looks[i], 0, at, seen.low, seen.high)
      const [x, y] = lines.at(-1)?.at(-1) ?? [NaN, NaN]
      expect(Math.abs(x - way.walkX(0, at.way))).toBeLessThan(3)
      expect(y).toBeCloseTo(way.walkY(seen.crowd.heard(s), at.way, seen.low, seen.high), 0)
      return [lines.length]
    })
    // Who leaps is not drawn on the way.
    expect(Math.max(...pieces) > 1).toBe(path === 3)
  })

  it('walks while keys are held and is still at rest', () => {
    const run = (seconds: number) =>
      runDisplay(display, PARAMS, seconds, { notes: testNotes() }).print()
    expect(run(0.4)).not.toBe(run(0.8))
    const rest = (now: number) => drawDisplay(display, PARAMS, { now }).print()
    expect(rest(3)).toBe(rest(9))
  })

  it('lets Lag and Room spread be taken where they stand', () => {
    const view = viewOf(display, PARAMS, { values: { lag: 2, spread: 0.4 } })
    const [lag, spread] = face.walkHandles(view)
    expect(lag.x).toBeCloseTo(way.walkX(2, at.way), 6)
    expect(lag.drag(way.walkX(0.7, at.way), 0).lag).toBeCloseTo(0.7, 6)
    expect(spread.drag(spread.x, 0).spread).toBeCloseTo(0.4, 6)
    expect(spread.drag(at.room.x + at.room.w - 2, 0).spread).toBeCloseTo(1, 6)
  })
})
