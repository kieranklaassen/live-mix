// The truth of the Wire Lantern display: its solids against the closed forms,
// its levels, ring times and ears against the compiled device played at 48 kHz,
// the drawing against that arithmetic, and its one point.

import { describe, expect, it } from 'vitest'

import { WIRE_LANTERN_PARAMS } from '../../dsp/devices/wire-lantern.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { WIRE_LANTERN_FACES, wireLayout, wireRungY } from '../components/displays/wire-lantern'
import * as net from '../components/displays/wire-lantern-parts'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  testNotes,
  testSignal,
  viewOf,
} from './display-harness'

type Name = keyof typeof WIRE_LANTERN_PARAMS
type Values = Partial<Record<Name, number>>
const RATE = 48000
const HZ = 220
const display = WIRE_LANTERN_FACES['wire-lantern'].display
const asking =
  (values: Values): net.Ask =>
  (name) =>
    values[name as Name] ?? WIRE_LANTERN_PARAMS[name as Name].default
const solidNamed = (name: string) =>
  net.wireSolid((WIRE_LANTERN_PARAMS.solid.choices as readonly string[]).indexOf(name))

/** What each ear hears of one held key of the compiled device. */
async function played(values: Values, seconds: number): Promise<[Float32Array, Float32Array]> {
  const loaded = await loadWasmDevice('wire-lantern', RATE)
  for (const [name, value] of Object.entries(values))
    loaded.set(WIRE_LANTERN_PARAMS[name as Name], value)
  const { device } = loaded
  device.device_note_on?.(1, HZ, 0.7)
  const total = Math.round((seconds * RATE) / 128) * 128
  const sides: [Float32Array, Float32Array] = [new Float32Array(total), new Float32Array(total)]
  for (let done = 0; done < total; done += 128) {
    device.device_process(128)
    sides[0].set(loaded.view(device.device_out_left(), 128), done)
    sides[1].set(loaded.view(device.device_out_right(), 128), done)
  }
  return sides
}

/** How strong the sine at `hz` is around `time`, through a raised cosine of 0.4 s, in dB. */
function toneDb(wave: Float32Array, hz: number, time: number): number {
  const frames = 0.4 * RATE
  let re = 0
  let im = 0
  for (let i = 0; i < frames; i++) {
    const n = Math.round(time * RATE - frames / 2) + i
    const sample = wave[n] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frames))
    re += sample * Math.cos((2 * Math.PI * hz * n) / RATE)
    im += sample * Math.sin((2 * Math.PI * hz * n) / RATE)
  }
  return 20 * Math.log10(Math.hypot(re, im))
}

/** The same of a tone as the display has it. */
function drawnDb(values: Values, f: number, time: number, far: boolean): number {
  const ask = asking(values)
  const solid = net.wireSolid(ask('solid'))
  const at = net.wirePlayed(solid, ask('edge') - 1, net.wireAlong(ask('pluck')))
  const levels = net.wireLevels(ask, at, HZ, 0.7)
  const note = { frequency: HZ, gain: 0.7, age: time, released: null }
  const now = net.wireNow(ask, levels, note)
  const heard = net.wireHeard(ask, at, HZ, ask('turn') * time, far)
  const [a, b] = [now[2 * f] * heard[2 * f], now[2 * f + 1] * heard[2 * f + 1]]
  return 20 * Math.log10(Math.hypot(a, b))
}

describe('the solids of wire-lantern', () => {
  it('stand where cos(kL) is on the walk and where the loops are', () => {
    const ratios = (name: string): number[] => solidNamed(name).families.map(({ ratio }) => ratio)
    const root = Math.acos(-1 / 3)
    expect(ratios('Octahedron').slice(0, 6)).toEqual(
      [1, 4 / 3, 2, 8 / 3, 3, 4].map((ratio) => expect.closeTo(ratio, 4) as number),
    )
    expect(ratios('Tetrahedron')[1]).toBeCloseTo(Math.PI / root, 4)
    expect(ratios('Tetrahedron')[2]).toBeCloseTo((2 * Math.PI - root) / root, 4)
    expect(ratios('Cube')[1]).toBeCloseTo(Math.acos(-1 / 3) / Math.acos(1 / 3), 4)
    expect(ratios('Ring').slice(0, 5).map(Math.round)).toEqual([1, 2, 3, 4, 5])
    WIRE_LANTERN_PARAMS.solid.choices.forEach((name) => expect(solidNamed(name).name).toBe(name))
  })

  it('bend with True to the open intervals', () => {
    for (let solid = 0; solid < 6; solid++) {
      const bent = net.wireCents(asking({ solid, true: 1 }))
      const { families } = net.wireSolid(solid)
      families.forEach(({ natural }, f) => expect(bent[f]).toBeCloseTo(net.wireOpen(natural), 3))
    }
  })
})

describe('the levels of wire-lantern', () => {
  const plain: Values = {
    true: 1,
    turn: 0.01,
    sympathy: 0,
    contact: 0,
    shell: 0,
    width: 0.6,
    volume: -12,
  }
  const cases: [string, Values, number][] = [
    ['an octahedron plucked', { ...plain, solid: 2, decay: 8 }, 6],
    ['a cube struck, its corners leaking', { ...plain, solid: 3, exciter: 1, cornerLoss: 0.5 }, 3],
    ['a prism under a finger', { ...plain, solid: 4, touch: 0.1, edge: 3, hardness: 0.7 }, 5],
  ]
  it.each(cases)(
    'are the device’s for %s, at both ears, early and late',
    async (_, values, most) => {
      const sides = await played(values, 3)
      const cents = net.wireCents(asking(values))
      const misses: number[] = []
      for (const far of [false, true])
        for (const time of [0.4, 2.2])
          for (let f = 1; f < most; f++) {
            const drawn = drawnDb(values, f, time, far) - drawnDb(values, 0, time, far)
            if (drawn < -30) continue
            const hz = HZ * 2 ** (cents[f] / 1200)
            const wave = sides[far ? 1 : 0]
            misses.push(Math.abs(toneDb(wave, hz, time) - toneDb(wave, HZ, time) - drawn))
          }
      expect(misses.length).toBeGreaterThan(5)
      expect(Math.max(...misses)).toBeLessThan(1.5)
    },
  )
})

describe('the drawing of wire-lantern', () => {
  it('stands every tone at its pitch, lit while a key sounds', () => {
    const { ladder } = wireLayout(displaySize(display))
    const options = { notes: testNotes(), signal: testSignal(), values: { true: 1 } }
    const lit = drawnPaths(drawDisplay(display, WIRE_LANTERN_PARAMS, options)).filter(
      ({ colour, points }) => colour === PLAIN_COLOURS.accent && points[0]?.[0] > ladder.x,
    )
    for (const cents of net.wireCents(asking({ true: 1 })).slice(0, 6))
      expect(
        lit.some(({ points }) => Math.abs(points[0][1] - wireRungY(cents, ladder)) < 0.1),
      ).toBe(true)
  })

  it('has a point that sets Pluck Point and Hardness where it stands', () => {
    const values = { pluck: 0.8, hardness: 0.25, edge: 6 }
    const [point] = display.handles?.(viewOf(display, WIRE_LANTERN_PARAMS, { values })) ?? []
    expect(point.drag(point.x, point.y).pluck).toBeCloseTo(0.8, 6)
    expect(point.drag(point.x, point.y).hardness).toBeCloseTo(0.25, 6)
    const { wire } = wireLayout(displaySize(display))
    expect(point.drag(wire.x + wire.w / 2, wire.y)).toEqual({ pluck: 1, hardness: 1 })
    expect(point.wheel?.(1)).toEqual({ edge: 6 })
    expect(point.wheel?.(-1)).toEqual({ edge: 5 })
  })
})
