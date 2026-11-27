// The truth of the Slow Accord display: its ways against the compiled device
// (how many overtones have arrived, how far off they are, how many are on their
// way, over every metal, goal and manner), its drawing against those ways, and
// the two times that can be taken hold of.

import { describe, expect, it } from 'vitest'

import { SLOW_ACCORD_PARAMS } from '../../dsp/devices/slow-accord.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { SLOW_ACCORD_FACES, accordHandles } from '../components/displays/slow-accord'
import {
  ACCORD_SECONDS,
  accordLayout,
  accordLines,
  accordWay,
  accordX,
} from '../components/displays/slow-accord-lines'
import {
  ACCORD_BODIES,
  accordMetal,
  accordPlace,
  accordPlan,
  accordRests,
  accordSettings,
  type AccordNote,
  type AccordSettings,
} from '../components/displays/slow-accord-ways'
import { displaySize, runDisplay, testNotes, testSignal, viewOf } from './display-harness'

const RATE = 48000
const { display } = SLOW_ACCORD_FACES['slow-accord']
const at = accordLayout(displaySize(display))
type Name = keyof typeof SLOW_ACCORD_PARAMS
type Values = Partial<Record<Name, number>>
const settingsOf = (values: Values = {}): AccordSettings =>
  accordSettings((name) => values[name as Name] ?? SLOW_ACCORD_PARAMS[name as Name].default)
const CHORD = [50, 57, 65, 72, 76].map((key, id) => ({ id, hz: 440 * 2 ** ((key - 69) / 12) }))
const held = (notes = CHORD): AccordNote[] =>
  notes.map((note) => ({ ...note, gain: 0.7, on: 0, off: Infinity }))

/** The device's readings (arrived, cents off on the newest key, on their way) at each time asked for. */
async function readings(values: Values, notes: readonly AccordNote[], times: readonly number[]) {
  const loaded = await loadWasmDevice('slow-accord', RATE)
  const { device } = loaded
  const { device_note_on: down, device_meter: meter } = device
  if (!down || !meter) throw new Error('takes no notes')
  for (const [name, value] of Object.entries(values))
    loaded.set(SLOW_ACCORD_PARAMS[name as Name], value)
  for (const note of notes) down(note.id, note.hz, note.gain)
  let done = 0
  return times.map((time) => {
    for (; done < time * RATE; done += 32) device.device_process(32)
    return { agreed: meter(0), away: meter(1), moving: Math.round(3 * meter(2)) }
  })
}

function planned(values: Values, notes: readonly AccordNote[], times: readonly number[]) {
  const set = settingsOf(values)
  const keys = accordPlan(set, notes, 1 + Math.max(...times))
  return times.map((time) => {
    const ways = keys.flatMap((key) => key.legs.slice(1))
    const last = ways.map((legs) => legs.filter((leg) => leg.start <= time).at(-1))
    const there = last.filter((leg) => leg && leg.start + leg.span <= time && !leg.home)
    const newest = keys[keys.length - 1]
    const off = newest.goal.map((goal, k) => Math.abs(accordPlace(set, newest, k, time) - goal))
    return {
      agreed: there.length / ways.length,
      away: (1200 * off.reduce((sum, each) => sum + each, 0)) / (off.length - 1),
      moving: last.filter((leg) => leg && leg.start + leg.span > time).length,
    }
  })
}

describe('the ways of slow-accord', () => {
  it.each<[string, Values, number]>([
    ['the defaults, one key', { again: 0 }, 1],
    ['the defaults, a chord', { again: 0 }, 5],
    ...[0, 1, 3, 4, 5].map((material): [string, Values, number] => [
      `metal ${material}`,
      { material, again: 0, overtones: 12, travel: 0.5 },
      5,
    ]),
    ...[1, 2, 3].map((goal): [string, Values, number] => [`goal ${goal}`, { goal, again: 0 }, 5]),
    ['half bent', { bend: 0.5, order: 1, again: 0, attack: 0.8 }, 3],
    ['hops and swings', { manner: 0.8, swing: 0.7, again: 0, travel: 0.8 }, 2],
    ['dissolves', { manner: -0.7, goal: 1, again: 0, travel: 0.8 }, 2],
  ])('are the device’s: %s', async (_, values, count) => {
    const times = [0.21, 0.53, 0.97, 1.61, 2.83, 4.7]
    const notes = held(CHORD.slice(0, count))
    const heard = await readings(values, notes, times)
    const drawn = planned(values, notes, times)
    heard.forEach((reading, i) => {
      expect(Math.abs(drawn[i].agreed - reading.agreed), `arrived at ${times[i]}`).toBeLessThan(
        0.06,
      )
      const off = Math.abs(drawn[i].away - reading.away)
      expect(off, `cents off at ${times[i]}`).toBeLessThan(8 + 0.06 * heard[0].away)
      expect(Math.abs(drawn[i].moving - reading.moving)).toBeLessThanOrEqual(1)
    })
  })

  it('never has four overtones on their way, whatever is held and sent on again', () => {
    for (const again of [-1, 1]) {
      const notes = held().map((note) => ({ ...note, on: 0.31 * note.id, off: 9 + note.id }))
      const keys = accordPlan(settingsOf({ again, rest: 0.25, travel: 0.4 }), notes, 20)
      for (let t = 0; t < 20; t += 0.037) {
        const legs = keys.flatMap((key) => key.legs.flat())
        expect(
          legs.filter((leg) => leg.start <= t && t < leg.start + leg.span).length,
        ).toBeLessThan(4)
      }
      expect(keys.some((key) => key.legs.some((legs) => legs.length > 2))).toBe(true)
    }
  })

  it('rest as loud as Glow holds them, and die as metal', () => {
    expect(ACCORD_BODIES.map((body) => body.name)).toEqual(SLOW_ACCORD_PARAMS.material.choices)
    const [key] = accordPlan(settingsOf(), held(CHORD.slice(0, 1)), 5)
    expect(Math.max(...accordRests(settingsOf({ glow: 1 }), key))).toBeCloseTo(1, 5)
    const set = settingsOf({ glow: 0, attack: 0.003, ring: 4 })
    expect(20 * Math.log10(accordMetal(set, 4) / accordMetal(set, 0.003))).toBeCloseTo(-60, 0)
  })
})

describe('the picture of slow-accord', () => {
  it('ends every way on its place when the metal is bent all of the way, and off it when not', () => {
    for (const bend of [1, 0.5]) {
      const set = settingsOf({ again: 0, bend })
      const [key] = accordPlan(set, held(CHORD.slice(0, 1)), ACCORD_SECONDS)
      const heights = accordLines(key, at.lines)
      const ends = key.metal.map(
        (_, k) => accordWay(set, key, k, heights[k], at).onto.at(-1)?.[1] ?? NaN,
      )
      const off = ends.map((y, k) => Math.abs(y - heights[k]))
      if (bend === 1) expect(Math.max(...off)).toBeLessThan(1e-6)
      else expect(Math.max(...off)).toBeGreaterThan(1)
    }
  })

  it('moves with the clock while a key sounds and shows the places that are taken', () => {
    const run = (moving: number) =>
      runDisplay(display, SLOW_ACCORD_PARAMS, 0.4, {
        meters: { agreed: 0.3, away: 40, moving, level: 0.1 },
        signal: testSignal(),
        notes: testNotes(),
      }).print()
    expect(run(1)).not.toBe(run(0))
  })

  it('lets Travel and Attack be taken where they stand on its scale of time', () => {
    const view = viewOf(display, SLOW_ACCORD_PARAMS, { values: { travel: 2, attack: 0.5 } })
    for (const each of accordHandles(view)) {
      expect(each.x).toBeCloseTo(accordX(each.key === 'travel' ? 2 : 0.5, at.lines), 6)
      expect(each.drag(accordX(1.4, at.lines), 0)[each.key]).toBeCloseTo(1.4, 6)
    }
  })
})
