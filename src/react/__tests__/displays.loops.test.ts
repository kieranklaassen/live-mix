// The truth of the loop displays: the heads stand where the device reports
// them, at the places its code puts them, the windows are the device's own
// fades, and what is held is what was written when it was written.

import { describe, expect, it } from 'vitest'

import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  LOOPS_FACES,
  Tape,
  apart,
  carried,
  carry,
  chunkFade,
  deviceClock,
  chunkGain,
  grainReach,
  grainStartBehind,
  grainWindow,
  heightOfLevel,
  smearReach,
  tick,
  timeText,
} from '../components/displays/loops'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testLevel,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { ink, accent, plate } = PLAIN_COLOURS

/** A strip at rest is 184 by 48: the sound lies from x 4, the write head stands at 175, the foot is at 41.5. */
const HEAD = 175
const REACH = 171
const FOOT = 41.5
const MIDDLE = 4 + 31 / 2

interface Drawn {
  kind: 'stroke' | 'fill'
  colour: string
  alpha: number
  width: number
  points: [number, number][]
}

/** Every path that was stroked or filled, with the colour it was painted in. */
function paths(drawn: RecordingContext): Drawn[] {
  const out: Drawn[] = []
  let points: [number, number][] = []
  const now = { fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1 }
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      points.push([call.args[0] as number, call.args[1] as number])
    else if (call.name === 'set fillStyle') now.fillStyle = String(call.args[0])
    else if (call.name === 'set strokeStyle') now.strokeStyle = String(call.args[0])
    else if (call.name === 'set globalAlpha') now.globalAlpha = call.args[0] as number
    else if (call.name === 'set lineWidth') now.lineWidth = call.args[0] as number
    else if (call.name === 'stroke' || call.name === 'fill')
      out.push({
        kind: call.name,
        colour: call.name === 'fill' ? now.fillStyle : now.strokeStyle,
        alpha: now.globalAlpha,
        width: now.lineWidth,
        points: [...points],
      })
  }
  return out
}

/** Where the read heads stand: the upright lines 1.5 wide in the accent, tallest first. */
function readHeads(drawn: RecordingContext, colour = accent): { x: number; tall: number }[] {
  return paths(drawn)
    .filter(
      (path) =>
        path.kind === 'stroke' &&
        path.colour === colour &&
        path.width === 1.5 &&
        path.points.length === 2 &&
        path.points[0][0] === path.points[1][0],
    )
    .map((path) => ({
      x: path.points[0][0],
      tall: Math.abs(path.points[1][1] - path.points[0][1]),
    }))
}

/** How tall the held sound is drawn at `x`: half the height of the first outline filled there. */
function heldAt(drawn: RecordingContext, x: number, colour = ink): number {
  for (const path of paths(drawn)) {
    if (path.kind !== 'fill' || path.colour !== colour || path.points.length < 8) continue
    const upper = path.points.slice(0, path.points.length / 2)
    if (x < upper[0][0] - 1 || x > upper[upper.length - 1][0] + 1) continue
    let near = upper[0]
    for (const point of upper) if (Math.abs(point[0] - x) < Math.abs(near[0] - x)) near = point
    return MIDDLE - near[1]
  }
  return 0
}

describe('what the loop displays share', () => {
  it('draws a level by its decibels: full scale fills the height, 48 dB down is nothing', () => {
    expect(heightOfLevel(1)).toBe(1)
    expect(heightOfLevel(Math.pow(10, -48 / 20))).toBeCloseTo(0, 5)
    expect(heightOfLevel(0)).toBe(0)
    // Half way down in dB is 0.5 to the power 1.5.
    expect(heightOfLevel(Math.pow(10, -24 / 20))).toBeCloseTo(Math.pow(0.5, 1.5), 5)
    expect(heightOfLevel(0.5)).toBeGreaterThan(heightOfLevel(0.25))
  })

  it('keeps what was written by when it was written', () => {
    const tape = new Tape(4)
    // A second of silence, a burst for 0.2 s, then silence until 3 s.
    for (let n = 0; n <= 90; n++) {
      const t = n / 30
      tape.push(100 + t, t >= 1 && t < 1.2 ? 0.8 : 0)
    }
    expect(tape.at(3 - 1.1)).toBeCloseTo(0.8, 5)
    expect(tape.at(3 - 0.5)).toBe(0)
    expect(tape.at(3 - 2.5)).toBe(0)
    expect(tape.over(1.7, 2.1)).toBeCloseTo(0.8, 5)
    expect(tape.over(0, 1.6)).toBe(0)
    expect(tape.known).toBeCloseTo(3, 5)
    // Older than it keeps, and not yet written, are both nothing.
    expect(tape.at(9)).toBe(0)
    expect(tape.at(-1)).toBe(0)
  })

  it('leaves a stretch nobody watched blank and keeps what was before it in its place', () => {
    const tape = new Tape(8)
    for (let n = 0; n <= 30; n++) tape.push(50 + n / 30, 0.5)
    for (let n = 0; n <= 6; n++) tape.push(54 + n / 30, 0.5)
    expect(tape.at(0.1)).toBeCloseTo(0.5, 5)
    expect(tape.at(1.5)).toBe(0)
    expect(tape.at(3.7)).toBeCloseTo(0.5, 5)
    expect(tape.known).toBeCloseTo(0.2, 5)
  })

  it('carries a reading forward at its speed and takes a reading that is somewhere else', () => {
    const track = carried()
    expect(carry(track, 2, 3, 0)).toBe(2)
    // No new reading for two frames: it goes on at 3 a second.
    expect(carry(track, 2, 3, 1 / 60)).toBeCloseTo(2.05, 6)
    expect(carry(track, 2, 3, 1 / 60)).toBeCloseTo(2.1, 6)
    // A reading near where it was carried to: it meets it half way.
    expect(carry(track, 2.17, 3, 1 / 60)).toBeCloseTo(2.16, 6)
    // A reading far off (a new chunk, a head gone round): it goes there.
    expect(carry(track, 0.1, 3, 1 / 60)).toBe(0.1)
  })

  it('forgets what it kept when the device has forgotten it', () => {
    const tape = new Tape(4)
    for (let n = 0; n <= 30; n++) tape.push(7 + n / 30, 0.5)
    expect(tape.at(0.5)).toBeCloseTo(0.5, 5)
    tape.clear()
    expect(tape.at(0.5)).toBe(0)
    expect(tape.known).toBe(0)
    // And keeps again from there, with nothing of before.
    tape.push(9, 0.25)
    tape.push(9 + 1 / 30, 0.25)
    expect(tape.at(0)).toBeCloseTo(0.25, 5)
    expect(tape.at(1)).toBe(0)
  })

  it('runs the time of a device while its clock moves and stops it when the clock stops', () => {
    const clock = deviceClock()
    // A clock that moves: the device's time is the display's.
    for (let n = 0; n <= 30; n++) tick(clock, 20 + n / 30, n, true)
    expect(clock.time).toBeCloseTo(1, 6)
    expect(clock.dt).toBeCloseTo(1 / 30, 6)
    // The same reading again and again: four frames are let pass, then it stands.
    for (let n = 1; n <= 30; n++) tick(clock, 21 + n / 30, 30, true)
    expect(clock.time).toBeCloseTo(1 + 4 / 30, 6)
    expect(clock.dt).toBe(0)
    // It goes on from where it stood when the clock moves again.
    tick(clock, 22 + 1 / 30, 31, true)
    expect(clock.time).toBeCloseTo(1 + 5 / 30, 6)
    // Time nobody watched has passed all the same, but nothing is carried across it.
    tick(clock, 32 + 1 / 30, 32, true)
    expect(clock.time).toBeCloseTo(11 + 5 / 30, 6)
    expect(clock.dt).toBe(0.25)
  })

  it('stands at once while the device is asleep, whatever its clock reads', () => {
    const clock = deviceClock()
    for (let n = 0; n <= 30; n++) tick(clock, 20 + n / 30, n, true)
    for (let n = 1; n <= 30; n++) tick(clock, 21 + n / 30, -1, false)
    expect(clock.time).toBeCloseTo(1, 6)
    expect(clock.dt).toBe(0)
    // Awake again it goes on with the next frame.
    tick(clock, 22 + 1 / 30, 5, true)
    tick(clock, 22 + 2 / 30, 5.03, true)
    expect(clock.time).toBeCloseTo(1 + 2 / 30, 6)
  })

  it('runs with the display while a clock in seconds keeps up with it, round its lap too', () => {
    // Frames 60 a second; the device read every 1664 samples at 48 kHz, the
    // latest reading being the one a frame sees. The clock starts near its lap.
    const every = 1664 / 48000
    const clock = deviceClock()
    const lap = (seconds: number): number => seconds % 64
    for (let n = 0; n <= 1200; n++) {
      const now = 3 + n / 60
      const read = Math.floor((n / 60 + 0.01) / every) * every
      tick(clock, now, lap(63.5 + read), true, true)
      // Never held, never hurried: every frame passes whole.
      if (n > 0) expect(clock.dt).toBeCloseTo(1 / 60, 9)
    }
    expect(clock.time).toBeCloseTo(20, 6)
  })

  it('waits out what ran on after a pause, so its time stays the device own', () => {
    const clock = deviceClock()
    let device = 0
    let now = 50
    const frame = (runs: boolean): void => {
      now += 1 / 30
      if (runs) device += 1 / 30
      tick(clock, now, 10 + device, true, true)
    }
    tick(clock, now, 10, true, true)
    for (let n = 0; n < 30; n++) frame(true)
    expect(clock.time).toBeCloseTo(device, 6)
    // The sound is paused: four frames run on before that can be known.
    for (let n = 0; n < 30; n++) frame(false)
    expect(clock.time - device).toBeCloseTo(4 / 30, 6)
    // It goes on: the time here waits until the device has all but caught up.
    for (let n = 0; n < 10; n++) frame(true)
    expect(clock.time - device).toBeGreaterThanOrEqual(0)
    expect(clock.time - device).toBeLessThanOrEqual(0.05 + 1e-9)
    // And ten pauses later it is no further off.
    for (let pause = 0; pause < 10; pause++) {
      for (let n = 0; n < 12; n++) frame(false)
      for (let n = 0; n < 12; n++) frame(true)
    }
    expect(Math.abs(clock.time - device)).toBeLessThanOrEqual(0.05 + 1e-9)
  })

  it('catches up with a device that ran on while its readings came late', () => {
    const clock = deviceClock()
    for (let n = 0; n <= 30; n++) tick(clock, 20 + n / 30, 7 + n / 30, true, true)
    // Ten frames with no new reading: the time stands after four.
    for (let n = 1; n <= 10; n++) tick(clock, 21 + n / 30, 8, true, true)
    expect(clock.time).toBeCloseTo(1 + 4 / 30, 6)
    // The reading that comes says the device went on all the while.
    tick(clock, 21 + 11 / 30, 8 + 11 / 30, true, true)
    expect(clock.time).toBeCloseTo(1 + 11 / 30, 6)
  })

  it('measures two times on a clock the short way round its lap', () => {
    expect(apart(12, 10)).toBeCloseTo(2, 9)
    expect(apart(10, 12)).toBeCloseTo(2, 9)
    expect(apart(0.5, 63.9)).toBeCloseTo(0.6, 9)
    expect(apart(-9.01, 54.99)).toBeCloseTo(0, 9)
  })

  it('says a length as it is said', () => {
    expect(timeText(0.6)).toBe('600 ms')
    expect(timeText(1.8)).toBe('1.8 s')
    expect(timeText(2)).toBe('2 s')
    expect(timeText(30)).toBe('30 s')
  })
})

/** Whether anything at all was painted in the accent. */
const accented = (drawn: RecordingContext): boolean =>
  paths(drawn).some((path) => path.colour === accent)

/** Where the upright marks of a scale stand, left to right. */
const marks = (drawn: RecordingContext): number[] =>
  paths(drawn)
    .filter(
      (path) =>
        path.kind === 'stroke' &&
        path.colour === ink &&
        path.alpha === INK.grid &&
        path.points.length === 2 &&
        path.points[0][0] === path.points[1][0],
    )
    .map((path) => path.points[0][0])
    .sort((x, y) => x - y)

describe('the Tape Loop display', () => {
  const { display } = LOOPS_FACES['tape-loop']
  const params = paramsOf('tape-loop')
  const share = 0.3 + (0.7 * Math.log(1.8)) / Math.log(30)
  const tap = HEAD - REACH * share
  const pxPerSec = (REACH * share) / 1.8
  /** A tape that runs: its clock is at 5 s when the display first looks, and moves on with it. */
  const running = (t: number, more: Record<string, number> = {}) => ({
    level: 0.3,
    head: 1,
    length: 1.8,
    speed: 1,
    clock: 5 + t,
    ...more,
  })

  it('rests its play head on the far deck, one Length behind the record head, in the ink', () => {
    const drawn = drawDisplay(display, params)
    const [head] = readHeads(drawn, ink)
    expect(head.x).toBeCloseTo(tap, 3)
    expect(accented(drawn)).toBe(false)
    const handle = display.handles?.(viewOf(display, params))[0]
    expect(handle?.x).toBeCloseTo(tap, 3)
    expect(handle?.y).toBe(FOOT)
  })

  it('puts the play head where the device reports it, in loops behind the record head', () => {
    const [head] = readHeads(drawDisplay(display, params, { meters: running(0, { head: 0.5 }) }))
    expect(head.x).toBeCloseTo(HEAD - 0.5 * 1.8 * pxPerSec, 3)
  })

  it('moves the head at half speed as the device does, between readings too', () => {
    // tape_loop.h: phase_ += (1 - velocity) / length_ a sample, so at half
    // speed the head falls behind by half a second of tape a second.
    const phase = (t: number): number => 0.4 + (0.5 * t) / 1.8
    const every = runDisplay(display, params, 1, {}, (t) => ({
      meters: running(t, { head: phase(t), speed: 0.5 }),
    }))
    const last = 29 / 30
    expect(readHeads(every)[0].x).toBeCloseTo(HEAD - phase(last) * 1.8 * pxPerSec, 1)
    // The same when a reading only arrives every third frame.
    const sparse = runDisplay(display, params, 1, {}, (t) => {
      const read = Math.floor(t * 10 + 1e-6) / 10
      return { meters: running(read, { head: phase(read), speed: 0.5 }) }
    })
    expect(Math.abs(readHeads(sparse)[0].x - (HEAD - phase(last) * 1.8 * pxPerSec))).toBeLessThan(
      0.5,
    )
  })

  it('gains on the record head at double speed and falls back twice as fast in reverse', () => {
    // By hand, a 1.8 s loop. Double: the velocity is 2, so the phase falls by
    // 1 / 1.8 a second; from 0.9 of the loop (1.62 s behind) the head is
    // 1.32 s behind 0.3 s later. Reverse: the velocity is -1, the phase
    // grows by 2 / 1.8 a second; from 0.2 (0.36 s) it is 0.96 s behind then.
    const after = (speed: number, from: number): RecordingContext =>
      runDisplay(display, params, 1 / 3, {}, (t) => ({
        meters: running(t, { head: from + ((1 - speed) * t) / 1.8, speed }),
      }))
    const double = after(2, 0.9)
    expect(readHeads(double)[0].x).toBeCloseTo(HEAD - 1.32 * pxPerSec, 1)
    const reverse = after(-1, 0.2)
    expect(readHeads(reverse)[0].x).toBeCloseTo(HEAD - 0.96 * pxPerSec, 1)
    // The flag on the head points the way it plays: right forwards, left in reverse.
    const flag = (drawn: RecordingContext): number => {
      const [mark] = paths(drawn).filter(
        (path) => path.kind === 'fill' && path.colour === accent && path.points.length === 3,
      )
      return mark.points[1][0] - mark.points[0][0]
    }
    expect(flag(double)).toBeCloseTo(2.5 + 3 * 2, 6)
    expect(flag(reverse)).toBeCloseTo(-(2.5 + 3 * 1), 6)
  })

  it('lays what was recorded a second ago a second of tape behind the record head', () => {
    // Silence, a burst from 1.0 s to 1.3 s, silence: drawn at 2 s.
    const drawn = runDisplay(display, params, 2, {}, (t) => ({
      meters: running(t, { level: t >= 1 && t < 1.3 ? 0.5 : 0 }),
    }))
    const now = 59 / 30
    const full = heightOfLevel(0.5) * 15
    expect(heldAt(drawn, HEAD - (now - 1.15) * pxPerSec)).toBeCloseTo(full, 0)
    expect(heldAt(drawn, HEAD - (now - 0.5) * pxPerSec)).toBeLessThan(1)
    expect(heldAt(drawn, HEAD - (now - 1.8) * pxPerSec)).toBeLessThan(1)
  })

  it('runs under a drone: a level that never changes is laid as it is written', () => {
    // The same level at every reading, as a held note reads; only the clock moves.
    const state = display.init?.()
    const drone = (seconds: number, from: number): RecordingContext =>
      runDisplay(display, params, seconds, { state, now: 10 + from }, (t) => ({
        meters: running(from + t, { level: 0.5 }),
      }))
    const full = heightOfLevel(0.5) * 15
    const first = drone(0.5, 0)
    // Half a second of it lies on the tape, and nothing beyond.
    expect(heldAt(first, HEAD - 0.3 * pxPerSec)).toBeCloseTo(full, 0)
    expect(heldAt(first, HEAD - 0.8 * pxPerSec)).toBeLessThan(1)
    const later = drone(0.8, 0.5)
    expect(heldAt(later, HEAD - 0.8 * pxPerSec)).toBeCloseTo(full, 0)
    expect(heldAt(later, HEAD - 1.1 * pxPerSec)).toBeCloseTo(full, 0)
    // The seconds are marked on the tape and travel with it: the nearest mark
    // is as far from the record head as the tape has run since it was laid.
    const nearest = (drawn: RecordingContext): number => Math.max(...marks(drawn))
    expect(nearest(first)).toBeCloseTo(Math.round(HEAD - (14 / 30) * pxPerSec) + 0.5, 6)
    expect(nearest(later)).toBeCloseTo(Math.round(HEAD - (38 / 30 - 1) * pxPerSec) + 0.5, 6)
  })

  it('stands still when the clock of the device stops, the tape and the play head alike', () => {
    const state = display.init?.()
    // A burst from 0.5 s to 0.8 s on a quiet tape, the head at half speed.
    const phase = (t: number): number => 0.2 + (0.5 * t) / 1.8
    const meters = (t: number) =>
      running(t, { level: t >= 0.5 && t < 0.8 ? 0.5 : 0.001, head: phase(t), speed: 0.5 })
    runDisplay(display, params, 1, { state }, (t) => ({ meters: meters(t) }))
    // The sound is paused: for two seconds the last readings are all there is.
    const last = 29 / 30
    const paused = runDisplay(display, params, 2, { state, meters: meters(last), now: 11 })
    // Four frames pass before it is known to have stopped, and no more.
    const passed = 4 / 30
    expect(heldAt(paused, HEAD - (last - 0.65 + passed) * pxPerSec)).toBeCloseTo(
      heightOfLevel(0.5) * 15,
      0,
    )
    expect(heldAt(paused, HEAD - (last - 0.65 + 2) * pxPerSec)).toBeLessThan(1)
    const stood = HEAD - (phase(last) + (0.5 * passed) / 1.8) * 1.8 * pxPerSec
    expect(Math.abs(readHeads(paused)[0].x - stood)).toBeLessThan(0.5)
  })

  it('shows a blank tape and a play head in the ink while the device is asleep', () => {
    const state = display.init?.()
    runDisplay(display, params, 1, { state }, (t) => ({ meters: running(t, { level: 0.5 }) }))
    // tape_loop.h meter(): asleep the clock reads -1 and the level 0; the
    // head and the motor read as they were when it fell asleep, here part of
    // the way round at half speed. It wakes with the head on the far deck.
    const asleep = runDisplay(display, params, 0.5, {
      state,
      now: 11,
      meters: running(0, { level: 0, clock: -1, head: 0.4, speed: 0.5 }),
    })
    expect(accented(asleep)).toBe(false)
    expect(readHeads(asleep, ink)[0].x).toBeCloseTo(tap, 3)
    expect(heldAt(asleep, HEAD - 0.5 * pxPerSec)).toBeLessThan(1)
    // Woken, the tape starts again with nothing on it of before.
    const woken = runDisplay(display, params, 0.2, { state, now: 11.5 }, (t) => ({
      meters: running(t, { level: 0.5, clock: 40 + t }),
    }))
    expect(readHeads(woken)).toHaveLength(1)
    expect(heldAt(woken, HEAD - 0.1 * pxPerSec)).toBeCloseTo(heightOfLevel(0.5) * 15, 0)
    expect(heldAt(woken, HEAD - 0.7 * pxPerSec)).toBeLessThan(1)
  })

  it('follows the distance between the decks as it glides, with the handle where the knob is', () => {
    const [head] = readHeads(drawDisplay(display, params, { meters: running(0, { length: 1.2 }) }))
    expect(head.x).toBeCloseTo(HEAD - 1.2 * pxPerSec, 3)
  })

  it('sets Length from its far end, on the taper of the knob', () => {
    const handle = display.handles?.(viewOf(display, params))[0]
    expect(handle?.drag(HEAD - REACH, 0).length).toBeCloseTo(30, 5)
    expect(handle?.drag(HEAD - 0.3 * REACH, 0).length).toBeCloseTo(1, 5)
    expect(handle?.drag(HEAD - 0.65 * REACH, 0).length).toBeCloseTo(Math.sqrt(30), 5)
    expect(handle?.drag(tap, 0).length).toBeCloseTo(1.8, 6)
    // Past either end it stays at that end.
    expect(handle?.drag(-400, 0).length).toBeCloseTo(30, 5)
    expect(handle?.drag(900, 0).length).toBeCloseTo(1, 5)
    expect(handle?.reset?.().length).toBe(1.8)
  })

  it('shows the record head hollow while Record is off', () => {
    const top = (record: number) =>
      paths(drawDisplay(display, params, { values: { record } })).filter(
        (path) =>
          path.kind === 'fill' && path.points.length === 3 && path.points[2][0] === HEAD + 0.5,
      )
    expect(top(0).map((mark) => mark.colour)).toEqual([ink])
    expect(top(1).map((mark) => mark.colour)).toEqual([plate])
  })
})

describe('the Reverse Delay display', () => {
  const { display } = LOOPS_FACES['reverse-delay']
  const params = paramsOf('reverse-delay')
  const share = 0.1 + (0.4 * Math.log(600 / 50)) / Math.log(4000 / 50)
  const pxPerSec = (REACH * share) / 0.6
  /** One reader at work, the other idle, the device's clock running. */
  const reading = (t: number, more: Record<string, number> = {}) => ({
    level: 0.3,
    aBehind: 0.6,
    aGain: 1,
    bBehind: 0,
    bGain: 0,
    clock: 5 + t,
    ...more,
  })

  it('fades a chunk as the device does', () => {
    // reverse_delay.h launch(): the fade is Smooth of the chunk, 4 ms at the least.
    expect(chunkFade(0.6, 0.35)).toBeCloseTo(0.21, 6)
    expect(chunkFade(0.6, 0)).toBeCloseTo(0.004, 6)
    expect(chunkFade(0.6, 1)).toBeCloseTo(0.6, 6)
    // In on a quarter sine, out on a quarter cosine from the next chunk's start.
    expect(chunkGain(0, 0.6, 0.2)).toBe(0)
    expect(chunkGain(0.1, 0.6, 0.2)).toBeCloseTo(Math.SQRT1_2, 6)
    expect(chunkGain(0.4, 0.6, 0.2)).toBe(1)
    expect(chunkGain(0.7, 0.6, 0.2)).toBeCloseTo(Math.SQRT1_2, 6)
    expect(chunkGain(0.8, 0.6, 0.2)).toBe(0)
    // By hand at the defaults (600 ms, Smooth 0.35): the fade is 210 ms, so
    // 70 ms in the gain is sin(30 degrees), and 70 ms before the end cos(60 degrees).
    expect(chunkGain(0.07, 0.6, 0.21)).toBeCloseTo(0.5, 6)
    expect(chunkGain(0.6 + 0.14, 0.6, 0.21)).toBeCloseTo(0.5, 6)
    // Two chunks cross with equal power: the one that ends and the one that starts.
    for (const into of [0.03, 0.1, 0.17]) {
      const power = chunkGain(into, 0.6, 0.2) ** 2 + chunkGain(0.6 + into, 0.6, 0.2) ** 2
      expect(power).toBeCloseTo(1, 6)
    }
  })

  it('puts a reader as far behind the newest sound as the device reports', () => {
    // 0.3 s into a chunk at Normal the reader is 0.6 s behind: one Time back.
    const heads = readHeads(drawDisplay(display, params, { meters: reading(0) }))
    expect(heads).toHaveLength(1)
    expect(heads[0].x).toBeCloseTo(HEAD - 0.6 * pxPerSec, 3)
    expect(display.handles?.(viewOf(display, params))[0].x).toBeCloseTo(HEAD - 0.6 * pxPerSec, 3)
  })

  it('runs a reader back at 1 + rate seconds of sound a second', () => {
    // Launched at 0: reading backwards at `rate` while the newest sound runs
    // on at 1. An octave up that is 3 s of sound a second, so 0.2 s into its
    // chunk the reader is 0.6 s behind.
    for (const [pitch, rate] of [
      [0, 1],
      [1, 2],
      [2, 0.5],
    ]) {
      const drawn = runDisplay(display, params, 0.4, { values: { pitch } }, (t) => {
        // A reading every third frame.
        const read = Math.floor(t * 10 + 1e-6) / 10
        return { meters: reading(read, { aBehind: 0.001 + (1 + rate) * read }) }
      })
      const behind = 0.001 + (1 + rate) * (11 / 30)
      expect(Math.abs(readHeads(drawn)[0].x - (HEAD - behind * pxPerSec))).toBeLessThan(0.6)
    }
  })

  it('shows a reader that is fading as a shorter, fainter head', () => {
    const tall = (aGain: number): number =>
      readHeads(drawDisplay(display, params, { meters: reading(0, { aGain }) }))[0].tall
    expect(tall(0.5)).toBeCloseTo(tall(1) / 2, 3)
  })

  it('marks where a chunk was cut, and lets the mark run back with the sound', () => {
    const cuts = (drawn: RecordingContext): number[] =>
      paths(drawn)
        .filter(
          (path) =>
            path.kind === 'stroke' &&
            path.colour === ink &&
            path.alpha === INK.rule &&
            path.points.length === 2 &&
            path.points[0][0] === path.points[1][0],
        )
        .map((path) => path.points[0][0])
    // A reader first seen 0.2 s behind at Normal started 0.1 s ago; 0.5 s on
    // (15 frames) its chunk was cut 0.6 s ago.
    const drawn = runDisplay(display, params, 16 / 30, {}, (t) => ({
      meters: reading(t, { aBehind: 0.2 + 2 * t }),
    }))
    expect(cuts(drawn)).toHaveLength(1)
    expect(cuts(drawn)[0]).toBeCloseTo(Math.round(HEAD - 0.6 * pxPerSec) + 0.5, 6)
  })

  it('shows nothing in the accent while the device is asleep, and forgets what it held', () => {
    const state = display.init?.()
    runDisplay(display, params, 1, { state }, (t) => ({
      meters: reading(t, { level: 0.5, aBehind: 0.2 + 2 * t }),
    }))
    // reverse_delay.h meter(): asleep the clock reads -1 and all else 0.
    const asleep = runDisplay(display, params, 0.5, {
      state,
      now: 11,
      meters: { level: 0, aBehind: 0, aGain: 0, bBehind: 0, bGain: 0, clock: -1 },
    })
    expect(accented(asleep)).toBe(false)
    expect(heldAt(asleep, HEAD - 0.5 * pxPerSec)).toBeLessThan(1)
    // A head in the ink where a chunk would start, pointing back.
    expect(readHeads(asleep, ink)[0].x).toBeCloseTo(HEAD - 9, 6)
  })

  it('sets Time from the end of its span, far enough along to set it by', () => {
    const handle = display.handles?.(viewOf(display, params))[0]
    expect(handle?.drag(HEAD - 0.1 * REACH, 0).time).toBeCloseTo(50, 4)
    expect(handle?.drag(HEAD - 0.5 * REACH, 0).time).toBeCloseTo(4000, 3)
    expect(handle?.drag(handle.x, handle.y).time).toBeCloseTo(600, 4)
    // Past either end it stays at that end.
    expect(handle?.drag(-400, 0).time).toBeCloseTo(4000, 3)
    expect(handle?.drag(900, 0).time).toBeCloseTo(50, 4)
    // A pixel is a step a hand can set a time by: under a tenth of it.
    const step = (handle?.drag((handle?.x ?? 0) - 1, 0).time ?? 0) / 600
    expect(step).toBeGreaterThan(1)
    expect(step).toBeLessThan(1.1)
    expect(handle?.reset?.().time).toBe(600)
  })
})

describe('the Grain Delay display', () => {
  const { display } = LOOPS_FACES['grain-delay']
  const params = paramsOf('grain-delay')

  it('opens a grain with the window the device uses', () => {
    expect(grainWindow(0)).toBe(0)
    expect(grainWindow(0.25)).toBeCloseTo(0.5, 6)
    expect(grainWindow(0.5)).toBeCloseTo(1, 6)
    expect(grainWindow(1)).toBe(0)
  })

  it('places a grain so that its middle reads the sound that is Time old', () => {
    // After half its length the write point is size / 2 further on and the
    // read point has moved ratio x size / 2 along the sound.
    const middle = (delay: number, ratio: number, size: number, reversed: boolean): number =>
      grainStartBehind(delay, ratio, size, reversed) +
      size / 2 -
      ((reversed ? -ratio : ratio) * size) / 2
    expect(middle(0.35, 1, 0.12, false)).toBeCloseTo(0.35, 9)
    expect(middle(0.35, 2, 0.12, false)).toBeCloseTo(0.35, 9)
    expect(middle(0.35, 0.5, 0.12, false)).toBeCloseTo(0.35, 9)
    expect(middle(0.35, 1, 0.12, true)).toBeCloseTo(0.35, 9)
    expect(middle(0.5, 2, 0.12, true)).toBeCloseTo(0.5, 9)
    // An octave up at a short Time would run into the write point: it starts
    // further back, and ends just on it (grain_delay.h: the floor under Time).
    const start = grainStartBehind(0.01, 2, 0.12, false)
    expect(start).toBeCloseTo(0.12, 9)
    expect(start + 0.12 - 2 * 0.12).toBeCloseTo(0, 9)
    // Backwards it starts at the newest sound at the nearest.
    expect(grainStartBehind(0.01, 1, 0.12, true)).toBeCloseTo(0, 9)
    // By hand at the defaults (Time 350 ms, Size 120 ms), as spawn_grain() has
    // it. An octave up forwards leads by (2 - 1) x 120 / 2 = 60 ms and starts
    // 410 ms behind; backwards it starts 350 - (1 + 2) x 120 / 2 = 170 ms
    // behind; an octave down forwards starts 350 - 30 = 320 ms behind.
    expect(grainStartBehind(0.35, 2, 0.12, false)).toBeCloseTo(0.41, 9)
    expect(grainStartBehind(0.35, 2, 0.12, true)).toBeCloseTo(0.17, 9)
    expect(grainStartBehind(0.35, 0.5, 0.12, false)).toBeCloseTo(0.32, 9)
  })

  it('knows how far back the grains reach', () => {
    // Forwards at pitch 0: Time, Spray and one Size of sound gone by.
    expect(grainReach(0.35, 0.1, 1, 0.12, 0)).toBeCloseTo(0.57, 9)
    // Backwards: from Time + (1 + ratio) x Size / 2 behind when it ends.
    expect(grainReach(0.35, 0, 1, 0.12, 1)).toBeCloseTo(0.35 + 0.12, 9)
  })

  const scale = (values: Record<string, number> = {}) => {
    const view = viewOf(display, params, { values })
    const handle = display.handles?.(view)[0]
    const time = view.value('time') / 1000
    return { handle, time, pxPerSec: (HEAD - (handle?.x ?? 0)) / time }
  }

  it('stands Time where its knob stands, and makes room when the grains reach past the strip', () => {
    const at = Math.log(350 / 10) / Math.log(2000 / 10)
    expect(scale().handle?.x).toBeCloseTo(HEAD - REACH * (0.25 + 0.35 * at), 3)
    // A long grain backwards an octave up at a short Time reaches 0.9 s back.
    const wide = scale({ time: 60, size: 300, pitch: 12, reverse: 1 })
    expect(grainReach(0.06, 0.15 ** 2, 2, 0.3, 1)).toBeCloseTo(0.9, 9)
    expect(0.9 * wide.pxPerSec).toBeLessThanOrEqual(REACH)
    expect(0.9 * wide.pxPerSec).toBeGreaterThan(REACH * 0.9)
  })

  it('sets Time from its line, at any scale', () => {
    const settings: Record<string, number>[] = [
      {},
      { time: 60, size: 300, pitch: 12, reverse: 1 },
      { spray: 1 },
    ]
    for (const values of settings) {
      const { handle, time } = scale(values)
      expect(handle?.drag(handle.x, handle.y).time).toBeCloseTo(time * 1000, 2)
    }
    // With grains short enough to stay inside it, the strip is scaled by Time alone.
    const { handle } = scale({ size: 10, pitch: 0, spray: 0 })
    expect(handle?.drag(HEAD - 0.25 * REACH, 0).time).toBeCloseTo(10, 3)
    expect(handle?.drag(HEAD - 0.6 * REACH, 0).time).toBeCloseTo(2000, 1)
    // Past either end it is at that end, and not a hair short of it.
    expect(handle?.drag(-400, 0).time).toBe(2000)
    expect(handle?.drag(900, 0).time).toBe(10)
    expect(handle?.reset?.().time).toBe(350)
  })

  /** The lenses of the grains that are open: the fills in the accent. */
  const lenses = (drawn: RecordingContext): [number, number][][] =>
    paths(drawn)
      .filter((path) => path.kind === 'fill' && path.colour === accent && path.points.length === 13)
      .map((path) => path.points)

  /**
   * What grain_delay.h `meter()` reads `t` seconds after the display first
   * looks: its clock, and for the newest grain and the one before how far
   * behind the write point each started, which grows as the device runs on.
   * A grain is given by when it started and how far behind it started then.
   */
  interface Grain {
    at: number
    behind: number
    speed: number
  }
  const LONG_AGO: Grain = { at: -9, behind: 0.35, speed: 1 }
  const told = (t: number, newest: Grain, before: Grain = LONG_AGO, from = 5) => ({
    level: 0.3,
    clock: (from + t) % 64,
    newBehind: newest.behind + (t - newest.at),
    newSpeed: newest.speed,
    oldBehind: before.behind + (t - before.at),
    oldSpeed: before.speed,
  })

  it('draws a grain over the stretch of sound it reads, where the device started it', () => {
    const { pxPerSec } = scale({ pitch: 0 })
    // One grain starts at the third frame, 0.35 s behind the write point, at speed 1.
    const grain: Grain = { at: 2 / 30, behind: 0.35, speed: 1 }
    const drawn = runDisplay(display, params, 0.1, { values: { pitch: 0 } }, (t) => ({
      meters: t < 0.05 ? told(t, LONG_AGO) : told(t, grain, LONG_AGO),
    }))
    const [lens, ...others] = lenses(drawn)
    expect(others).toHaveLength(0)
    const from = HEAD - 0.35 * pxPerSec
    expect(lens[0][0]).toBeCloseTo(from, 1)
    expect(lens[12][0]).toBeCloseTo(from + 0.12 * pxPerSec, 1)
    // Forwards it stands above the middle.
    expect(Math.min(...lens.map((point) => point[1]))).toBeLessThan(MIDDLE - 10)
    expect(Math.max(...lens.map((point) => point[1]))).toBeCloseTo(MIDDLE, 3)
  })

  it('draws a grain that reads backwards under the middle, an octave up over twice the sound', () => {
    const values = { pitch: 12, reverse: 1 }
    const { pxPerSec } = scale(values)
    const grain: Grain = { at: 2 / 30, behind: 0.2, speed: -2 }
    const drawn = runDisplay(display, params, 0.1, { values }, (t) => ({
      meters: t < 0.05 ? told(t, LONG_AGO) : told(t, grain, LONG_AGO),
    }))
    const [lens] = lenses(drawn)
    expect(lens[0][0] - lens[12][0]).toBeCloseTo(2 * 0.12 * pxPerSec, 1)
    expect(Math.max(...lens.map((point) => point[1]))).toBeGreaterThan(MIDDLE + 10)
  })

  it('knows a grain by where it started: one lens for as long as it is the newest', () => {
    const values = { pitch: 0, size: 400 }
    const { pxPerSec } = scale(values)
    const grain: Grain = { at: 2 / 30, behind: 0.35, speed: 1 }
    // The same grain is told of at every reading for a third of a second; the
    // clock goes round its lap on the way (it starts 0.2 s short of 64).
    const drawn = runDisplay(display, params, 0.4, { values }, (t) => ({
      meters: t < 0.05 ? told(t, LONG_AGO, LONG_AGO, 63.8) : told(t, grain, LONG_AGO, 63.8),
    }))
    const open = lenses(drawn)
    expect(open).toHaveLength(1)
    // The stretch it reads has moved away with the sound: a third of a second further back.
    const since = 11 / 30 - 2 / 30
    expect(open[0][0][0]).toBeCloseTo(HEAD - (0.35 + since) * pxPerSec, 1)
  })

  it('takes up both grains when two have started since the last reading, and each new one after', () => {
    const values = { pitch: 0, size: 400 }
    const first: Grain = { at: 2 / 30, behind: 0.35, speed: 1 }
    const second: Grain = { at: 2 / 30, behind: 0.5, speed: 1 }
    const third: Grain = { at: 5 / 30, behind: 0.4, speed: -1 }
    const drawn = runDisplay(display, params, 0.3, { values }, (t) => ({
      meters:
        t < 0.05 ? told(t, LONG_AGO) : t < 0.15 ? told(t, second, first) : told(t, third, second),
    }))
    expect(lenses(drawn)).toHaveLength(3)
  })

  it('shows no grain open while the device is asleep, and keeps none for when it wakes', () => {
    const values = { pitch: 0, size: 400 }
    const state = display.init?.()
    const grain: Grain = { at: 2 / 30, behind: 0.35, speed: 1 }
    const awake = runDisplay(display, params, 0.2, { state, values }, (t) => ({
      meters: t < 0.05 ? told(t, LONG_AGO) : told(t, grain, LONG_AGO),
    }))
    expect(lenses(awake)).toHaveLength(1)
    // grain_delay.h meter(): asleep the clock reads -1.
    const asleep = runDisplay(display, params, 0.1, {
      state,
      values,
      now: 10.2,
      meters: { ...told(0.2, grain), level: 0, clock: -1 },
    })
    expect(accented(asleep)).toBe(false)
    // Awake again at once, with the same grain still the newest: it is not opened again.
    const woken = runDisplay(display, params, 0.1, { state, values, now: 10.3 }, (t) => ({
      meters: told(0.3 + t, grain, LONG_AGO),
    }))
    expect(lenses(woken)).toHaveLength(0)
  })

  it('shows the grains the settings ask for while none is open: Density of them, Size / Density apart', () => {
    const ghosts = (values: Record<string, number>) =>
      paths(drawDisplay(display, params, { values })).filter(
        (path) => path.kind === 'stroke' && path.colour === ink && path.points.length === 13,
      )
    const { pxPerSec } = scale({ pitch: 0 })
    const four = ghosts({ pitch: 0, density: 4 })
    expect(four).toHaveLength(4)
    expect(four[1].points[0][0] - four[0].points[0][0]).toBeCloseTo(-(0.12 / 4) * pxPerSec, 3)
    // Each is one Size of sound wide at pitch 0, and they are centred on Time.
    expect(four[0].points[12][0] - four[0].points[0][0]).toBeCloseTo(0.12 * pxPerSec, 3)
    const centre = four.reduce((sum, lens) => sum + (lens.points[0][0] + lens.points[12][0]) / 2, 0)
    expect(centre / 4).toBeCloseTo(HEAD - 0.35 * pxPerSec, 3)
    expect(ghosts({ pitch: 0, density: 8 })).toHaveLength(8)
    // Half of them backwards: both ways are drawn.
    expect(ghosts({ pitch: 0, density: 2, reverse: 0.5 })).toHaveLength(4)
  })
})

describe('the Micro Looper display', () => {
  const { display } = LOOPS_FACES['micro-looper']
  const params = paramsOf('micro-looper')
  const share = 0.3 + (0.7 * Math.log(2 / 0.1)) / Math.log(8 / 0.1)
  const start = HEAD - REACH * share
  const pxPerSec = (REACH * share) / 2
  /** micro_looper.h meter(): asleep every reading is 0. */
  const asleep = { place: 0, speed: 0, gain: 0, heard: 0, age: 0, wait: 0 }
  /** Awake with no loop: `age` is under 0, and under the sign how long the memory has run, from 1. */
  const listening = (t: number, more: Record<string, number> = {}) => ({
    ...asleep,
    age: -1 - (7 + t),
    ...more,
  })
  /** A loop that plays: `age` is how long ago it was taken, and it moves on. */
  const looping = (t: number, more: Record<string, number> = {}) => ({
    ...asleep,
    place: 0.25,
    speed: 0.5,
    gain: 1,
    heard: 0.2,
    age: 3 + t,
    ...more,
  })

  it('takes the grains of Smear from as far around the playhead as the device does', () => {
    expect(smearReach(0, 2)).toBeCloseTo(0.02, 9)
    expect(smearReach(1, 2)).toBeCloseTo(0.3, 9)
    expect(smearReach(1, 0.4)).toBeCloseTo(0.1, 9)
    // By hand at the defaults (Smear 0.2, a 2 s loop): 20 ms + 0.2 x 280 ms = 76 ms.
    expect(smearReach(0.2, 2)).toBeCloseTo(0.076, 9)
  })

  it('puts the playhead where the device reports it in the loop', () => {
    const [head] = readHeads(
      drawDisplay(display, params, { meters: looping(0), signal: testSignal() }),
    )
    expect(head.x).toBeCloseTo(start + 0.25 * (HEAD - start), 3)
  })

  it('moves the playhead backwards when the device plays backwards', () => {
    // Reverse on a 2 s loop is half a loop a second the other way.
    const place = (t: number): number => 0.8 - 0.5 * t
    const drawn = runDisplay(display, params, 0.5, { signal: testSignal() }, (t) => {
      // A reading every third frame.
      const read = Math.floor(t * 10 + 1e-6) / 10
      return { meters: looping(read, { place: place(read), speed: -0.5 }) }
    })
    expect(
      Math.abs(readHeads(drawn)[0].x - (start + place(14 / 30) * (HEAD - start))),
    ).toBeLessThan(0.5)
  })

  it('goes on with a loop whose readings are a held note: only its age and place move', () => {
    // Double speed on a 2 s loop is one loop a second.
    const drawn = runDisplay(display, params, 1, { signal: testSignal() }, (t) => ({
      meters: looping(t, { place: (0.1 + t) % 1, speed: 1, heard: 0.2 }),
    }))
    // After 29 frames it has been round once and is 1 / 15 of the way in again.
    expect(readHeads(drawn)[0].x).toBeCloseTo(start + (1 / 15) * (HEAD - start), 1)
  })

  it('stops the playhead when the device stops: the same readings again and again', () => {
    const state = display.init?.()
    const meters = (t: number) => looping(t, { place: 0.1 + 0.5 * t })
    runDisplay(display, params, 0.5, { state, signal: testSignal() }, (t) => ({
      meters: meters(t),
    }))
    const last = 14 / 30
    const paused = runDisplay(display, params, 1, {
      state,
      signal: testSignal(),
      meters: meters(last),
      now: 10.5,
    })
    // Four frames run on before it is known to have stopped, and no more.
    const stood = 0.1 + 0.5 * (last + 4 / 30)
    expect(Math.abs(readHeads(paused)[0].x - (start + stood * (HEAD - start)))).toBeLessThan(0.5)
  })

  it('with no loop, shows where one would start: at its beginning forwards, at its end backwards', () => {
    const resting = (speed: number, meters?: Record<string, number>) =>
      readHeads(drawDisplay(display, params, { values: { speed }, meters }), ink)
    expect(resting(4)[0].x).toBeCloseTo(start, 3)
    expect(resting(1)[0].x).toBeCloseTo(HEAD - 4, 3)
    expect(accented(drawDisplay(display, params))).toBe(false)
    // The same awake and listening, and asleep: nothing plays, so nothing is in the accent.
    for (const meters of [listening(0), asleep]) {
      expect(resting(4, meters)[0].x).toBeCloseTo(start, 3)
      expect(accented(drawDisplay(display, params, { meters, signal: testSignal() }))).toBe(false)
    }
  })

  it('scrolls what it hears past the write head while it listens, and empties it asleep', () => {
    const state = display.init?.()
    // A second and a half of playing at one level, then nothing for half a second.
    const heard = runDisplay(display, params, 2, { state }, (t) => ({
      meters: listening(t),
      signal: { ...testSignal(), input: testLevel(t < 1.5 ? 0.5 : 0) },
    }))
    const now = 59 / 30
    const full = heightOfLevel(0.5) * 15
    expect(heldAt(heard, HEAD - (now - 1) * pxPerSec)).toBeCloseTo(full, 0)
    expect(heldAt(heard, HEAD - 0.2 * pxPerSec)).toBeLessThan(1)
    // Asleep the looper empties its memory, and so does the picture of it.
    const slept = runDisplay(display, params, 0.2, {
      state,
      meters: asleep,
      signal: { ...testSignal(), input: testLevel(0) },
      now: 12,
    })
    expect(heldAt(slept, HEAD - 1.2 * pxPerSec)).toBeLessThan(1)
  })

  it('keeps what was played as the loop when it is taken, and lets it sink with its gain', () => {
    const state = display.init?.()
    const quiet = { ...testSignal(), input: testLevel(0.001) }
    // Two seconds of playing at one level, heard by the memory while there is no loop.
    runDisplay(display, params, 2, { state }, (t) => ({
      meters: listening(t),
      signal: { ...testSignal(), input: testLevel(0.5) },
    }))
    // The loop is taken; from then on nothing more is played.
    const held = (t: number, more: Record<string, number> = {}) =>
      looping(t, { place: 0.1 + 0.5 * t, heard: 0.5, age: 0.01 + t, ...more })
    const taken = runDisplay(display, params, 0.5, { state, signal: quiet, now: 12 }, (t) => ({
      meters: held(t),
    }))
    const middle = (start + HEAD) / 2
    expect(heldAt(taken, middle)).toBeCloseTo(heightOfLevel(0.5) * 15, 0)
    // Fade has taken 12 dB off it.
    const faded = runDisplay(display, params, 0.2, { state, signal: quiet, now: 12.5 }, (t) => ({
      meters: held(0.5 + t, { gain: 0.25 }),
    }))
    expect(heldAt(faded, middle)).toBeCloseTo(heightOfLevel(0.125) * 15, 0)
  })

  it('crosses the loop with the write head while a phrase is played in', () => {
    const writer = (wait: number): number | undefined =>
      paths(
        drawDisplay(display, params, { meters: listening(0, { wait }), signal: testSignal() }),
      ).find((path) => path.kind === 'fill' && path.points.length === 3)?.points[2][0]
    expect(writer(0)).toBeCloseTo(HEAD + 0.5, 3)
    // A second to go of a two second loop: half way.
    expect(writer(1)).toBeCloseTo(Math.round(HEAD - 1 * pxPerSec) + 0.5, 3)
    // By hand: micro_looper.h takes a loop Length less 8 ms after its attack,
    // so the head sets out 1.992 s of a 2 s loop from the end.
    expect(writer(1.992)).toBeCloseTo(Math.round(HEAD - 1.992 * pxPerSec) + 0.5, 3)
  })
})
