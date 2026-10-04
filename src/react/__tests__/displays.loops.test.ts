// The truth of the loop displays: the heads stand where the device reports
// them, at the places its code puts them, the windows are the device's own
// fades, and what is held is what was written when it was written.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  LOOPS_FACES,
  Tape,
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

  it('runs the time of a device with the clock and stops it when its readings stop', () => {
    const clock = deviceClock()
    // Readings that move: its time is the clock's.
    for (let n = 0; n <= 30; n++) tick(clock, 20 + n / 30, n, true)
    expect(clock.time).toBeCloseTo(1, 6)
    expect(clock.dt).toBeCloseTo(1 / 30, 6)
    // The same reading again and again: four frames are let pass, then it stands.
    for (let n = 1; n <= 30; n++) tick(clock, 21 + n / 30, 30, true)
    expect(clock.time).toBeCloseTo(1 + 4 / 30, 6)
    expect(clock.dt).toBe(0)
    // It goes on from where it stood when they move again.
    tick(clock, 22 + 1 / 30, 31, true)
    expect(clock.time).toBeCloseTo(1 + 5 / 30, 6)
    // Time nobody watched has passed all the same, but nothing is carried across it.
    tick(clock, 32 + 1 / 30, 32, true)
    expect(clock.time).toBeCloseTo(11 + 5 / 30, 6)
    expect(clock.dt).toBe(0.25)
    // Readings that need not move, such as silence, do not stop it.
    const quiet = deviceClock()
    for (let n = 0; n <= 30; n++) tick(quiet, 20 + n / 30, 0, false)
    expect(quiet.time).toBeCloseTo(1, 6)
  })

  it('says a length as it is said', () => {
    expect(timeText(0.6)).toBe('600 ms')
    expect(timeText(1.8)).toBe('1.8 s')
    expect(timeText(2)).toBe('2 s')
    expect(timeText(30)).toBe('30 s')
  })
})

describe('the Tape Loop display', () => {
  const { display } = LOOPS_FACES['tape-loop']
  const params = paramsOf('tape-loop')
  const share = 0.3 + (0.7 * Math.log(1.8)) / Math.log(30)
  const tap = HEAD - REACH * share
  const pxPerSec = (REACH * share) / 1.8

  /** A level near 0.5 that is never the same twice running, as a sound is. */
  const burst = (t: number): number => 0.5 - 0.01 * (Math.round(t * 30) % 2)

  it('rests its play head on the far deck, one Length behind the record head', () => {
    const [head] = readHeads(drawDisplay(display, params))
    expect(head.x).toBeCloseTo(tap, 3)
    const handle = display.handles?.(viewOf(display, params))[0]
    expect(handle?.x).toBeCloseTo(tap, 3)
    expect(handle?.y).toBe(FOOT)
  })

  it('puts the play head where the device reports it, in loops behind the record head', () => {
    const meters = { level: 0.3, head: 0.5, length: 1.8, speed: 1 }
    const [head] = readHeads(drawDisplay(display, params, { meters }))
    expect(head.x).toBeCloseTo(HEAD - 0.5 * 1.8 * pxPerSec, 3)
  })

  it('moves the head at half speed as the device does, between readings too', () => {
    // tape_loop.h: phase_ += (1 - velocity) / length_ a sample, so at half
    // speed the head falls behind by half a second of tape a second.
    const phase = (t: number): number => 0.4 + (0.5 * t) / 1.8
    const every = runDisplay(display, params, 1, {}, (t) => ({
      meters: { level: 0.3, head: phase(t), length: 1.8, speed: 0.5 },
    }))
    const last = 29 / 30
    expect(readHeads(every)[0].x).toBeCloseTo(HEAD - phase(last) * 1.8 * pxPerSec, 1)
    // The same when a reading only arrives every third frame.
    const sparse = runDisplay(display, params, 1, {}, (t) => ({
      meters: {
        level: 0.3,
        head: phase(Math.floor(t * 10 + 1e-6) / 10),
        length: 1.8,
        speed: 0.5,
      },
    }))
    expect(Math.abs(readHeads(sparse)[0].x - (HEAD - phase(last) * 1.8 * pxPerSec))).toBeLessThan(
      0.5,
    )
  })

  it('lays what was recorded a second ago a second of tape behind the record head', () => {
    // Silence, a burst from 1.0 s to 1.3 s, silence: drawn at 2 s.
    const drawn = runDisplay(display, params, 2, {}, (t) => ({
      meters: { level: t >= 1 && t < 1.3 ? burst(t) : 0, head: 1, length: 1.8, speed: 1 },
    }))
    const now = 59 / 30
    const full = heightOfLevel(0.5) * 15
    expect(heldAt(drawn, HEAD - (now - 1.15) * pxPerSec)).toBeCloseTo(full, 0)
    expect(heldAt(drawn, HEAD - (now - 0.5) * pxPerSec)).toBeLessThan(1)
    expect(heldAt(drawn, HEAD - (now - 1.8) * pxPerSec)).toBeLessThan(1)
  })

  it('stands still when the device stops reporting, the tape and the play head alike', () => {
    const state = display.init?.()
    // A burst from 0.5 s to 0.8 s on a quiet tape, the head at half speed.
    const phase = (t: number): number => 0.2 + (0.5 * t) / 1.8
    const meters = (t: number) => ({
      level: t >= 0.5 && t < 0.8 ? burst(t) : burst(t) / 500,
      head: phase(t),
      length: 1.8,
      speed: 0.5,
    })
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

  it('follows the distance between the decks as it glides, with the handle where the knob is', () => {
    const meters = { level: 0, head: 1, length: 1.2, speed: 1 }
    const [head] = readHeads(drawDisplay(display, params, { meters }))
    expect(head.x).toBeCloseTo(HEAD - 1.2 * pxPerSec, 3)
  })

  it('sets Length from its far end, on the taper of the knob', () => {
    const handle = display.handles?.(viewOf(display, params))[0]
    expect(handle?.drag(HEAD - REACH, 0).length).toBeCloseTo(30, 5)
    expect(handle?.drag(HEAD - 0.3 * REACH, 0).length).toBeCloseTo(1, 5)
    expect(handle?.drag(HEAD - 0.65 * REACH, 0).length).toBeCloseTo(Math.sqrt(30), 5)
    expect(handle?.drag(tap, 0).length).toBeCloseTo(1.8, 6)
    expect(handle?.reset?.().length).toBe(1.8)
  })

  it('shows the record head hollow while Record is off', () => {
    const marks = (record: number) =>
      paths(drawDisplay(display, params, { values: { record } })).filter(
        (path) =>
          path.kind === 'fill' && path.points.length === 3 && path.points[2][0] === HEAD + 0.5,
      )
    expect(marks(0).map((mark) => mark.colour)).toEqual([ink])
    expect(marks(1).map((mark) => mark.colour)).toEqual([plate])
  })
})

describe('the Reverse Delay display', () => {
  const { display } = LOOPS_FACES['reverse-delay']
  const params = paramsOf('reverse-delay')
  const share = 0.18 + (0.14 * Math.log(600 / 50)) / Math.log(4000 / 50)
  const pxPerSec = (REACH * share) / 0.6

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
    // Two chunks cross with equal power: the one that ends and the one that starts.
    for (const into of [0.03, 0.1, 0.17]) {
      const power = chunkGain(into, 0.6, 0.2) ** 2 + chunkGain(0.6 + into, 0.6, 0.2) ** 2
      expect(power).toBeCloseTo(1, 6)
    }
  })

  it('puts a reader as far behind the newest sound as the device reports', () => {
    // 0.3 s into a chunk at Normal the reader is 0.6 s behind: one Time back.
    const meters = { level: 0.3, aBehind: 0.6, aGain: 1, bBehind: 0, bGain: 0 }
    const heads = readHeads(drawDisplay(display, params, { meters }))
    expect(heads).toHaveLength(1)
    expect(heads[0].x).toBeCloseTo(HEAD - 0.6 * pxPerSec, 3)
    expect(display.handles?.(viewOf(display, params))[0].x).toBeCloseTo(HEAD - 0.6 * pxPerSec, 3)
  })

  it('runs a reader back at 1 + rate seconds of sound a second', () => {
    // Launched at 0: reading backwards at `rate` while the newest sound runs on at 1.
    for (const [pitch, rate] of [
      [0, 1],
      [1, 2],
      [2, 0.5],
    ]) {
      const drawn = runDisplay(display, params, 0.4, { values: { pitch } }, (t) => ({
        meters: {
          level: 0.3,
          // A reading every third frame.
          aBehind: 0.001 + (1 + rate) * (Math.floor(t * 10 + 1e-6) / 10),
          aGain: 1,
          bBehind: 0,
          bGain: 0,
        },
      }))
      const behind = 0.001 + (1 + rate) * (11 / 30)
      expect(Math.abs(readHeads(drawn)[0].x - (HEAD - behind * pxPerSec))).toBeLessThan(0.6)
    }
  })

  it('shows a reader that is fading as a shorter, fainter head', () => {
    const tall = (aGain: number): number =>
      readHeads(
        drawDisplay(display, params, {
          meters: { level: 0.3, aBehind: 0.6, aGain, bBehind: 0, bGain: 0 },
        }),
      )[0].tall
    expect(tall(0.5)).toBeCloseTo(tall(1) / 2, 3)
  })

  it('sets Time from the end of its span', () => {
    const handle = display.handles?.(viewOf(display, params))[0]
    expect(handle?.drag(HEAD - 0.18 * REACH, 0).time).toBeCloseTo(50, 4)
    expect(handle?.drag(HEAD - 0.32 * REACH, 0).time).toBeCloseTo(4000, 3)
    expect(handle?.drag(handle.x, handle.y).time).toBeCloseTo(600, 4)
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
  })

  /** The lenses of the grains that are open: the fills in the accent. */
  const lenses = (drawn: RecordingContext): [number, number][][] =>
    paths(drawn)
      .filter((path) => path.kind === 'fill' && path.colour === accent && path.points.length === 13)
      .map((path) => path.points)

  it('draws a grain over the stretch of sound it reads, where the device started it', () => {
    const { pxPerSec } = scale({ pitch: 0 })
    // One grain started just now, 0.35 s behind the write point, at speed 1.
    const drawn = runDisplay(display, params, 0.1, { values: { pitch: 0 } }, (t) => ({
      meters: {
        level: 0.3,
        grains: t < 0.05 ? 7 : 8,
        newBehind: 0.35,
        newSpeed: 1,
        oldBehind: 9,
        oldSpeed: 1,
      },
    }))
    const [lens] = lenses(drawn)
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
    const drawn = runDisplay(display, params, 0.1, { values }, (t) => ({
      meters: {
        level: 0.3,
        grains: t < 0.05 ? 7 : 8,
        newBehind: 0.2,
        newSpeed: -2,
        oldBehind: 9,
        oldSpeed: 1,
      },
    }))
    const [lens] = lenses(drawn)
    expect(lens[0][0] - lens[12][0]).toBeCloseTo(2 * 0.12 * pxPerSec, 1)
    expect(Math.max(...lens.map((point) => point[1]))).toBeGreaterThan(MIDDLE + 10)
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
  const silent = { place: 0, speed: 0, gain: 0, heard: 0, age: 0, wait: 0 }

  it('takes the grains of Smear from as far around the playhead as the device does', () => {
    expect(smearReach(0, 2)).toBeCloseTo(0.02, 9)
    expect(smearReach(1, 2)).toBeCloseTo(0.3, 9)
    expect(smearReach(1, 0.4)).toBeCloseTo(0.1, 9)
  })

  it('puts the playhead where the device reports it in the loop', () => {
    const meters = { ...silent, place: 0.25, speed: 0.5, gain: 1, heard: 0.2, age: 3 }
    const [head] = readHeads(drawDisplay(display, params, { meters, signal: testSignal() }))
    expect(head.x).toBeCloseTo(start + 0.25 * (HEAD - start), 3)
  })

  it('moves the playhead backwards when the device plays backwards', () => {
    const place = (t: number): number => 0.8 - 0.5 * t
    const drawn = runDisplay(display, params, 0.5, { signal: testSignal() }, (t) => ({
      meters: {
        ...silent,
        place: place(Math.floor(t * 10 + 1e-6) / 10),
        speed: -0.5,
        gain: 1,
        heard: 0.2,
        age: 3 + t,
      },
    }))
    expect(
      Math.abs(readHeads(drawn)[0].x - (start + place(14 / 30) * (HEAD - start))),
    ).toBeLessThan(0.5)
  })

  it('with no loop, shows where one would start: at its beginning forwards, at its end backwards', () => {
    const resting = (speed: number) =>
      readHeads(drawDisplay(display, params, { values: { speed } }), ink)
    expect(resting(4)[0].x).toBeCloseTo(start, 3)
    expect(resting(1)[0].x).toBeCloseTo(HEAD - 4, 3)
    expect(readHeads(drawDisplay(display, params))).toHaveLength(0)
  })

  it('keeps what was played as the loop when it is taken, and lets it sink with its gain', () => {
    const state = display.init?.()
    const quiet = { ...testSignal(), input: testLevel(0.001) }
    // Two seconds of playing, heard by the memory: a level near 0.5, never the same twice running.
    runDisplay(display, params, 2, { state, meters: silent }, (t) => ({
      signal: { ...testSignal(), input: testLevel(0.5 - 0.01 * (Math.round(t * 30) % 2)) },
    }))
    // The loop is taken; from then on nothing more is played.
    const held = { ...silent, place: 0.1, speed: 0.5, gain: 1, heard: 0.5, age: 0.01 }
    const taken = runDisplay(display, params, 0.5, { state, signal: quiet, meters: held, now: 12 })
    const middle = (start + HEAD) / 2
    expect(heldAt(taken, middle)).toBeCloseTo(heightOfLevel(0.5) * 15, 0)
    // Fade has taken 12 dB off it.
    const faded = runDisplay(display, params, 0.2, {
      state,
      signal: quiet,
      meters: { ...held, gain: 0.25, age: 0.6 },
      now: 12.5,
    })
    expect(heldAt(faded, middle)).toBeCloseTo(heightOfLevel(0.125) * 15, 0)
  })

  it('crosses the loop with the write head while a phrase is played in', () => {
    const writer = (wait: number): number | undefined =>
      paths(
        drawDisplay(display, params, { meters: { ...silent, wait }, signal: testSignal() }),
      ).find((path) => path.kind === 'fill' && path.points.length === 3)?.points[2][0]
    expect(writer(0)).toBeCloseTo(HEAD + 0.5, 3)
    // A second to go of a two second loop: half way.
    expect(writer(1)).toBeCloseTo(Math.round(HEAD - 1 * pxPerSec) + 0.5, 3)
  })
})
