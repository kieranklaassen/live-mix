// The truth of the Clock Room display: its pendulums, their agreement, the
// strikes and the ring of a gong against the compiled device played at 48 kHz,
// the drawing against that arithmetic, and what its two points set.

import { describe, expect, it } from 'vitest'

import { CLOCK_ROOM_PARAMS } from '../../dsp/devices/clock-room.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import * as clock from '../components/displays/clock-room'
import { displaySize, drawDisplay, runDisplay, viewOf } from './display-harness'

const RATE = 48000
const display = clock.CLOCK_ROOM_FACES['clock-room'].display
const size = displaySize(display)
type Name = keyof typeof CLOCK_ROOM_PARAMS
type Values = Partial<Record<Name, number>>
const settingsOf = (values: Values = {}) =>
  clock.clockSettings((name) => values[name as Name] ?? CLOCK_ROOM_PARAMS[name as Name].default)
const CHORD = [146.83, 220, 349.23, 523.25, 659.26]

/** The compiled device, holding these keys from its first sample. */
async function played(values: Values, keys: readonly number[]) {
  const loaded = await loadWasmDevice('clock-room', RATE)
  for (const [name, value] of Object.entries({ volume: -12, ...values }))
    loaded.set(CLOCK_ROOM_PARAMS[name as Name], value)
  const { device } = loaded
  const { device_note_on: down, device_note_off: up, device_meter } = device
  if (!down || !up || !device_meter) throw new Error('takes no notes')
  keys.forEach((hz, id) => down(id, hz, 0.7))
  const meter = (index: number): number => device_meter(index)
  const left: number[] = []
  const run = (seconds: number, each: (time: number) => void = () => undefined): void => {
    const until = left.length + Math.round(seconds * RATE)
    while (left.length < until) {
      device.device_process(64)
      left.push(...loaded.view(device.device_out_left(), 64))
      each(left.length / RATE)
    }
  }
  return { meter, run, left, up }
}
const notesOf = (keys: readonly number[], off = 99): clock.ClockNote[] =>
  keys.map((hz) => ({ hz, gain: 0.7, on: 0, off }))

describe('the wall of the clock-room display', () => {
  const walls: [string, Values][] = [
    ['in step', {}],
    ['opposed', { wall: 1, learn: 0.9 }],
    ['splayed', { wall: 2, learn: 1, unlike: 0 }],
    ['chained', { wall: 3, learn: 0.8, beat: 1.4 }],
    ['not learning', { learn: 0, unlike: 1 }],
    ['running down', { runDown: 0.7, beat: 2 }],
  ]
  it.each(walls)('swings and agrees as the device does, %s', async (_name, values) => {
    const set = settingsOf(values)
    const wall = new clock.ClockWall(0)
    const { meter, run, left } = await played(values, CHORD)
    for (let step = 0; step < 24; step++) {
      run(0.25)
      const time = left.length / RATE
      wall.advance(time, notesOf(CHORD), set)
      const newest = wall.clocks[CHORD.length - 1]
      expect(Math.cos(Math.PI * newest.phase), `pendulum at ${time}`).toBeCloseTo(meter(1), 1)
      expect(wall.agreement, `agreement at ${time}`).toBeCloseTo(meter(0), 1)
    }
  })

  it.each([0, 1, 2, 3, 4])('strikes when escapement %i does', async (escapement) => {
    const set = settingsOf({ escapement })
    const wall = new clock.ClockWall(0)
    const { meter, run } = await played({ escapement }, CHORD)
    const heard: number[] = []
    let before = 0
    run(5, (time) => {
      if (meter(2) > before + 0.01) heard.push(time)
      before = meter(2)
    })
    wall.advance(5, notesOf(CHORD), set)
    const drawn = wall.clocks[CHORD.length - 1].strikes.map(({ at }) => at)
    expect(drawn.length).toBe(heard.length)
    drawn.forEach((at, i) => expect(Math.abs(at - heard[i])).toBeLessThan(0.03))
  })

  it.each([
    ['a coil in oak', { gong: 0 }, 220],
    ['a low coil in marble', { gong: 0, case: 1 }, 146.83],
    ['a high coil that is let go', { gong: 0, hush: 0.5, decay: 9 }, 523.25],
  ] as [string, Values, number][])('rings as long as %s', async (_name, values, hz) => {
    const bare: Values = { ...values, strikes: 0, glow: 0, swing: 0, second: 0, tick: 0, bloom: 0 }
    const { run, left, up } = await played(bare, [hz])
    const wall = new clock.ClockWall(0)
    wall.advance(0.1, notesOf([hz]), settingsOf(bare))
    const letGo = values.hush !== undefined
    if (letGo) up(0)
    run(1.2)
    const tone = (at: number): number => {
      let [re, im] = [0, 0]
      left.slice(at * RATE, (at + 0.2) * RATE).forEach((sample, i) => {
        const shade = 0.5 - 0.5 * Math.cos((10 * Math.PI * i) / RATE)
        re += shade * sample * Math.cos((2 * Math.PI * hz * i) / RATE)
        im += shade * sample * Math.sin((2 * Math.PI * hz * i) / RATE)
      })
      return Math.hypot(re, im)
    }
    const fell = 20 * Math.log10(tone(0.3) / tone(0.9))
    const said = (60 * 0.6) / clock.clockRing(settingsOf(bare), { ...wall.clocks[0], held: !letGo })
    expect(Math.abs(fell - said), `${fell} dB against ${said}`).toBeLessThan(0.15 * said + 0.3)
  })
})

describe('the drawing of clock-room', () => {
  const at = clock.clockLayout(size)
  it('puts every hand at its place in the swing and every strike at its time', () => {
    const set = settingsOf()
    const wall = new clock.ClockWall(0)
    wall.advance(clock.clockSpan(set.beat), notesOf(CHORD), set)
    const drawn = drawDisplay(display, CLOCK_ROOM_PARAMS)
    expect(drawn.words()).toEqual(['In step', '48 a min'])
    const arcs = drawn.calls
      .filter(({ name }) => name === 'arc')
      .map(({ args }) => args as number[])
    wall.clocks.forEach((each, i) => {
      const [x, y] = clock.onDial(clock.clockPlace(each, set), at.r * (0.86 - 0.1 * i), at.middle)
      expect(arcs.some((arc) => Math.hypot(arc[0] - x, arc[1] - y) < 0.01)).toBe(true)
    })
    const lines = drawn.calls.filter(({ name }) => name === 'moveTo').map(({ args }) => args[0])
    for (const { at: time, touch } of wall.clocks[2].strikes) {
      const x = at.lanes.x + at.lanes.w * (1 - (wall.time - time) / wall.span)
      const there = lines.some((from) => Math.abs((from as number) - x) < 0.51)
      if (touch === 0) expect(there, `a mark at ${time} s`).toBe(true)
    }
  })

  it('takes the agreement from the device', () => {
    const note = { frequency: 220, gain: 0.7, age: 0.1, released: null }
    const notes = [
      { ...note, id: 1 },
      { ...note, id: 2, frequency: 330 },
    ]
    const meters = { agreement: 0.5, swing: 0.2, level: 0.1 }
    const drawn = runDisplay(display, CLOCK_ROOM_PARAMS, 0.03, { notes, meters })
    const disc = drawn.calls.find(({ name }) => name === 'arc')?.args as number[]
    expect(disc[2]).toBeCloseTo(1 + 0.5 * at.r * 0.36, 5)
  })

  it('has a point for Learn at the end of the reach and one for Unlike', () => {
    const view = viewOf(display, CLOCK_ROOM_PARAMS, { values: { learn: 0.9, unlike: 0.6 } })
    const [learn, unlike] = display.handles?.(view) ?? []
    expect(learn.x).toBeCloseTo(clock.clockRateX(clock.clockReach(0.9), at.rates), 5)
    expect(unlike.x).toBeCloseTo(clock.clockRateX(-0.3, at.rates), 5)
    expect(learn.drag(clock.clockRateX(clock.clockReach(0.5), at.rates), 0).learn).toBeCloseTo(
      0.5,
      5,
    )
    expect(unlike.drag(clock.clockRateX(-0.45, at.rates), 0).unlike).toBeCloseTo(0.9, 5)
    expect([learn.drag(-99, 0), unlike.drag(999, 0)]).toEqual([{ learn: 0 }, { unlike: 0 }])
    expect([learn.reset?.(), unlike.reset?.()]).toEqual([{ learn: 0.66 }, { unlike: 0.3 }])
  })
})
