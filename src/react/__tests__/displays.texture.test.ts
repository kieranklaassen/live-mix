// The texture displays against the devices they show: every curve, slope and
// place a display draws is checked here against the number the device's own
// code gives (the C++ under `cpp/devices/<id>/`), and what a display draws
// from the device's readings is checked to stand where the reading says.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  TEXTURE_FACES,
  blurHangSec,
  blurHeldAt,
  blurShapeDb,
  blurTiltDb,
  cascadeGain,
  cascadePasses,
  cascadeWindow,
  cloudDelay,
  cloudLength,
  cloudRate,
  cloudWindow,
  glitchGain,
  glitchRead,
  glitchRepeatSec,
  padFollow,
  padThresholdDb,
  sustainFall,
  sustainGateDb,
  sustainRise,
  type CascadeSlice,
  type GlitchPiece,
} from '../components/displays/texture'
import { type DisplayHandle, type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  metersOf,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const ACCENT = PLAIN_COLOURS.accent
const INK = PLAIN_COLOURS.ink

function device(id: string) {
  const descriptor = stock.get(id)
  if (!descriptor) throw new Error(`${id} is not a stock device`)
  const display: PlateDisplay = TEXTURE_FACES[id].display
  return { display, params: descriptor.params, meters: metersOf(descriptor.meters) }
}

function handleOf(id: string, key: string, values: Record<string, number> = {}): DisplayHandle {
  const { display, params } = device(id)
  const found = display.handles?.(viewOf(display, params, { values })).find((h) => h.key === key)
  if (!found) throw new Error(`${id} has no handle ${key}`)
  return found
}

interface Mark {
  kind: 'fill' | 'stroke' | 'rect' | 'words'
  colour: string
  alpha: number
  dashed: boolean
  /** The points of the path, or the corners of the rectangle. */
  points: [number, number][]
  /** Where each part of the path begins. */
  starts: [number, number][]
  words?: string
}

/** Everything a drawing put down, each mark with its colour and where it lies. */
function marksOf(drawn: RecordingContext): Mark[] {
  const marks: Mark[] = []
  let fill = ''
  let stroke = ''
  let alpha = 1
  let dashed = false
  let path: [number, number][] = []
  let starts: [number, number][] = []
  for (const { name, args } of drawn.calls) {
    const n = args as number[]
    if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set globalAlpha') alpha = Number(args[0])
    else if (name === 'setLineDash') dashed = (args[0] as number[]).length > 0
    else if (name === 'beginPath') {
      path = []
      starts = []
    } else if (name === 'moveTo') {
      path.push([n[0], n[1]])
      starts.push([n[0], n[1]])
    } else if (name === 'lineTo' || name === 'arc') path.push([n[0], n[1]])
    else if (name === 'rect') path.push([n[0], n[1]], [n[0] + n[2], n[1] + n[3]])
    else if (name === 'fill')
      marks.push({ kind: 'fill', colour: fill, alpha, dashed, points: path, starts })
    else if (name === 'stroke')
      marks.push({ kind: 'stroke', colour: stroke, alpha, dashed, points: path, starts })
    else if (name === 'fillRect')
      marks.push({
        kind: 'rect',
        colour: fill,
        alpha,
        dashed,
        points: [
          [n[0], n[1]],
          [n[0] + n[2], n[1] + n[3]],
        ],
        starts: [],
      })
    else if (name === 'fillText')
      marks.push({
        kind: 'words',
        colour: fill,
        alpha,
        dashed,
        points: [[n[1], n[2]]],
        starts: [],
        words: String(args[0]),
      })
  }
  return marks
}

const xs = (mark: Mark): number[] => mark.points.map(([x]) => x)
const ys = (mark: Mark): number[] => mark.points.map(([, y]) => y)
const left = (mark: Mark): number => Math.min(...xs(mark))
const right = (mark: Mark): number => Math.max(...xs(mark))
const top = (mark: Mark): number => Math.min(...ys(mark))
const foot = (mark: Mark): number => Math.max(...ys(mark))

/** The same drawing whenever it is made: a display at rest does not move. */
function expectStill(id: string, options: FrameOptions = {}): void {
  const { display, params, meters } = device(id)
  const one = drawDisplay(display, params, { ...options, meters, now: 10 })
  const other = drawDisplay(display, params, { ...options, meters, now: 73.4 })
  expect(other.print()).toBe(one.print())
}

// --- Sustain ----------------------------------------------------------------

describe('Sustain', () => {
  it('puts the threshold where detect() does: -30 dBFS at Sensitivity 0, -66 at 1', () => {
    expect(sustainGateDb(0)).toBeCloseTo(-30, 6)
    expect(sustainGateDb(0.5)).toBeCloseTo(-48, 6)
    expect(sustainGateDb(1)).toBeCloseTo(-66, 6)
    // The handle stands on it: 36 dB of the 72 the 40 pixels of the strip span.
    const loud = handleOf('sustainer', 'sensitivity', { sensitivity: 0 })
    const soft = handleOf('sustainer', 'sensitivity', { sensitivity: 1 })
    expect(soft.y - loud.y).toBeCloseTo((36 / 72) * 40, 3)
    expect(loud.y).toBeCloseTo(4 + (30 / 72) * 40, 3)
  })

  it('takes the threshold handle to the level it is dragged to', () => {
    const at = handleOf('sustainer', 'sensitivity')
    const down = at.drag(at.x, 4 + (48 / 72) * 40)
    expect(down.sensitivity).toBeCloseTo(0.5, 3)
    expect(at.drag(at.x, 0).sensitivity).toBe(0)
    expect(at.drag(at.x, 48).sensitivity).toBe(1)
  })

  it('lets a layer go at 60 dB per Decay, and not at all while it is held', () => {
    const view = (values: Record<string, number>) => ({
      value: (name: string) => values[name] ?? 0,
    })
    expect(sustainFall(view({ decay: 3 }))).toBeCloseTo(20, 6)
    expect(sustainFall(view({ decay: 12 }))).toBeCloseTo(5, 6)
    expect(sustainFall(view({ decay: 3, hold: 1 }))).toBe(0)
    // Decay at the top of its range never fades, except in Latch, where a new note lets the old go.
    expect(sustainFall(view({ decay: 60 }))).toBe(0)
    expect(sustainFall(view({ decay: 60, mode: 2 }))).toBeCloseTo(1, 6)
  })

  it('raises a layer over Attack on the envelope’s S-curve', () => {
    expect(sustainRise(0, 0.4)).toBe(0)
    expect(sustainRise(0.1, 0.4)).toBeCloseTo(0.15625, 6)
    expect(sustainRise(0.2, 0.4)).toBeCloseTo(0.5, 6)
    expect(sustainRise(0.4, 0.4)).toBe(1)
    expect(sustainRise(2, 0.4)).toBe(1)
  })

  it('draws the predicted fall at the slope Decay gives', () => {
    const { display, params, meters } = device('sustainer')
    // A held level of -12 dB with nothing played: the dashed line right of now falls 60 dB in Decay.
    const held = Math.pow(10, -12 / 20)
    const run = (decay: number) =>
      marksOf(
        runDisplay(display, params, 3, {
          values: { decay },
          meters: { ...meters, level: 0.2, held, layers: 1, caught: 1 },
        }),
      ).filter((mark) => mark.kind === 'stroke' && mark.dashed && mark.points.length === 2)
    const slope = (marks: Mark[]): number => {
      const fall = marks.find((mark) => left(mark) >= 144 && foot(mark) - top(mark) > 1)
      if (!fall) throw new Error('no fall drawn')
      const perSec = (Math.round(4 + 176 * 0.8) - 4) / 8
      const dbPerPx = 72 / 40
      return (((foot(fall) - top(fall)) * dbPerPx) / (right(fall) - left(fall))) * perSec
    }
    expect(slope(run(3))).toBeCloseTo(20, 0)
    expect(slope(run(6))).toBeCloseTo(10, 0)
  })

  it('shows a worked example at rest and the device’s own levels when it runs', () => {
    expectStill('sustainer')
    const { display, params, meters } = device('sustainer')
    const rest = drawDisplay(display, params, { meters })
    const held = Math.pow(10, -10 / 20)
    const running = runDisplay(display, params, 2, {
      meters: { ...meters, level: 0.001, held, layers: 2, caught: 2 },
    })
    expect(running.print()).not.toBe(rest.print())
    // What is held over what is played is in the second colour.
    expect(marksOf(running).some((mark) => mark.kind === 'fill' && mark.colour === ACCENT)).toBe(
      true,
    )
  })

  it('reads four meters, each one the display draws from', () => {
    const { meters } = device('sustainer')
    expect(Object.keys(meters)).toEqual(['level', 'held', 'layers', 'caught'])
  })

  it('marks a catch with a tick in ink where it happened, and the layers sounding in the second colour', () => {
    const { display, params, meters } = device('sustainer')
    // One catch, 15 frames before the last.
    const marks = marksOf(
      runDisplay(display, params, 2, { meters }, (time) => ({
        meters: { ...meters, level: 0.2, held: 0.2, layers: 2, caught: time > 1.49 ? 1 : 0 },
      })),
    )
    const nowX = Math.round(4 + 176 * 0.8)
    const perSec = (nowX - 4) / 8
    const ticks = marks.filter(
      (mark) => mark.kind === 'rect' && mark.colour === INK && foot(mark) - top(mark) === 5,
    )
    expect(ticks).toHaveLength(1)
    expect((left(ticks[0]) + right(ticks[0])) / 2).toBeCloseTo(nowX - (14 / 30) * perSec, 0)
    const pips = marks.filter((mark) => mark.kind === 'rect' && mark.colour === ACCENT)
    expect(pips).toHaveLength(2)
  })
})

// --- Pad Follower -----------------------------------------------------------

describe('Pad Follower', () => {
  const followed = (rise: number, fall: number, thresholdDb: number): Float32Array => {
    const out = new Float32Array(800)
    padFollow(rise, fall, thresholdDb, -8, out)
    return out
  }
  /** The followed level in dB at `t` seconds from now (10 ms a step from 8 s back). */
  const at = (out: Float32Array, t: number): number => out[Math.round((t + 8) / 0.01)]

  it('puts the threshold where the gate is half open: -36 dB at Sensitivity 0, -84 at 1', () => {
    expect(padThresholdDb(0)).toBeCloseTo(-36, 6)
    expect(padThresholdDb(0.5)).toBeCloseTo(-60, 6)
    expect(padThresholdDb(1)).toBeCloseTo(-84, 6)
    const loud = handleOf('pad-follower', 'sensitivity', { sensitivity: 0 })
    const soft = handleOf('pad-follower', 'sensitivity', { sensitivity: 1 })
    // 48 dB of the 84 the strip's 40 pixels span.
    expect(soft.y - loud.y).toBeCloseTo((48 / 84) * 40, 3)
    expect(loud.drag(loud.x, soft.y).sensitivity).toBeCloseTo(1, 3)
  })

  it('reaches 90 % of a chord after Rise, as set_times() sets the follower', () => {
    // The worked example's firm chord: -12 dB from 7.4 s ago, far over the threshold.
    for (const rise of [0.2, 0.6, 1.2]) {
      const out = followed(rise, 2, -60)
      const full = -12
      // A band settles for 70 ms first; Rise counts from the note, so the swell is Rise less that.
      const swell = Math.max(0.3 * rise, rise - 0.07)
      const reached = at(out, -7.4 + 0.07 + swell)
      expect(reached).toBeGreaterThan(full + 20 * Math.log10(0.9) - 0.5)
      expect(reached).toBeLessThan(full + 20 * Math.log10(0.9) + 0.5)
    }
  })

  it('falls 60 dB in Fall once the chord is let go', () => {
    for (const fall of [0.5, 1, 2]) {
      const out = followed(0.1, fall, -60)
      // The chord ends 5.6 s ago, settled at -12 dB.
      const end = at(out, -5.6 - 0.02)
      expect(end).toBeCloseTo(-12, 0)
      const after = at(out, -5.6 + fall)
      expect(end - after).toBeGreaterThan(54)
      expect(end - after).toBeLessThan(66)
    }
  })

  it('lets a partial at the threshold through at half its level', () => {
    // The soft chord is -50 dB: with the threshold there the gate, p³ / (p² + t²), gives p / 2.
    const out = followed(0.1, 2, -50)
    expect(at(out, -2.25)).toBeCloseTo(-50 - 6.02, 0)
    // Far under the threshold it is as good as shut: p³ / t², another 28 dB down at -36.
    const shut = followed(0.1, 2, -36)
    expect(at(shut, -2.25)).toBeCloseTo(-50 - 28, 0)
  })

  it('shows a worked example at rest and the device’s own levels when it runs', () => {
    expectStill('pad-follower')
    const { display, params, meters } = device('pad-follower')
    const rest = drawDisplay(display, params, { meters })
    const running = runDisplay(display, params, 2, {
      meters: { ...meters, heard: 0.001, held: 0.2 },
    })
    expect(running.print()).not.toBe(rest.print())
    expect(marksOf(running).some((mark) => mark.kind === 'fill' && mark.colour === ACCENT)).toBe(
      true,
    )
  })
})

// --- Cloud ------------------------------------------------------------------

describe('Cloud', () => {
  it('gives a grain the length grain_length() does', () => {
    expect(cloudLength(100, 1)).toBeCloseTo(0.1, 6)
    expect(cloudLength(100, 4)).toBeCloseTo(0.1, 6)
    // Two seconds at four times the speed would read 8 s: cut to what the buffer holds.
    const room = 8 - 32 / 48000 - 0.03
    expect(cloudLength(2000, 4)).toBeCloseTo(room / 5, 6)
    expect(cloudLength(2000, -4)).toBeCloseTo(room / 5, 6)
  })

  it('caps the grains a second at 24 sounding at once', () => {
    expect(cloudRate(20, 100)).toBe(20)
    expect(cloudRate(200, 500)).toBeCloseTo(48, 6)
    expect(cloudRate(200, 2000)).toBeCloseTo(12, 6)
  })

  it('opens a grain where spawn() does', () => {
    const margin = 16 / 48000
    // Position 0 is the newest sound a grain can read to its end: its own stretch behind the head.
    expect(cloudDelay(0, 1, 0.1, 0)).toBeCloseTo(0.1 + margin, 6)
    expect(cloudDelay(0, 2, 0.1, 0)).toBeCloseTo(0.2 + margin, 6)
    // Position 1 is the oldest that will last the grain out.
    expect(cloudDelay(1, 1, 0.1, 1)).toBeCloseTo(8 - 0.1 - margin, 6)
    expect(cloudDelay(0.5, 1, 0.1, 0)).toBeCloseTo(
      (cloudDelay(0, 1, 0.1, 0) + cloudDelay(1, 1, 0.1, 0)) / 2,
      6,
    )
  })

  it('shapes a grain as window_at() does', () => {
    // Texture 0 is a whole raised cosine; Texture 1 leaves 2 % at each end.
    expect(cloudWindow(0.25, 0)).toBeCloseTo(0.5, 6)
    expect(cloudWindow(0.5, 0)).toBeCloseTo(1, 6)
    expect(cloudWindow(0.75, 0)).toBeCloseTo(0.5, 6)
    expect(cloudWindow(0.01, 1)).toBeCloseTo(0.5, 6)
    expect(cloudWindow(0.02, 1)).toBeCloseTo(1, 6)
    expect(cloudWindow(0.5, 1)).toBe(1)
  })

  /**
   * Run the display for 15 frames and let the device report one grain on the
   * last but one; hand back the mark it made. By the last frame the sound it
   * reads has moved one frame further from the head.
   */
  const MOVED = 1 / 30
  function grainMark(reading: { place: number; rate: number; pan: number }): Mark {
    const { display, params, meters } = device('grain-cloud')
    const drawn = runDisplay(display, params, 0.5, { values: { size: 200 }, meters }, (time) => ({
      meters: { ...meters, ...reading, level: 0.2, grains: time > 0.41 ? 1 : 0 },
    }))
    const found = marksOf(drawn).filter(
      (mark) => mark.kind === 'rect' && mark.colour === ACCENT && foot(mark) - top(mark) === 2,
    )
    expect(found).toHaveLength(1)
    return found[0]
  }

  it('marks a grain where the device opened it', () => {
    // The scale is the square root of the age: two seconds back is half way across, 4 + 120 / 2.
    const xOf = (age: number): number => 124 - Math.sqrt(age / 8) * 120
    expect(xOf(2)).toBe(64)
    const grain = grainMark({ place: 2, rate: 1, pan: 0 })
    expect(left(grain)).toBeCloseTo(xOf(2 + MOVED), 3)
    // It reads 200 ms of sound towards the head: as wide as that.
    expect(right(grain)).toBeCloseTo(xOf(1.8 + MOVED), 3)
    // At four times the speed the same grain reads four times as much.
    const fast = grainMark({ place: 2, rate: 4, pan: 0 })
    expect(right(fast)).toBeCloseTo(xOf(1.2 + MOVED), 3)
    expect(left(grainMark({ place: 0.5, rate: 1, pan: 0 }))).toBeGreaterThan(left(grain))
  })

  it('puts a grain in the row of its pitch, where the Pitch handle would stand', () => {
    const middle = (mark: Mark): number => (top(mark) + foot(mark)) / 2
    const played = middle(grainMark({ place: 2, rate: 1, pan: 0 }))
    expect(played).toBeCloseTo(handleOf('grain-cloud', 'pitch', { pitch: 0 }).y, 3)
    expect(middle(grainMark({ place: 2, rate: 2, pan: 0 }))).toBeCloseTo(
      handleOf('grain-cloud', 'pitch', { pitch: 12 }).y,
      3,
    )
    expect(middle(grainMark({ place: 2, rate: -0.5, pan: 0 }))).toBeCloseTo(
      handleOf('grain-cloud', 'pitch', { pitch: -12 }).y,
      3,
    )
    // Left is up in the row and right is down.
    expect(middle(grainMark({ place: 2, rate: 1, pan: -1 }))).toBeLessThan(played)
    expect(middle(grainMark({ place: 2, rate: 1, pan: 1 }))).toBeGreaterThan(played)
  })

  it('stands Position on the held sound and sets Size by the wheel', () => {
    const near = handleOf('grain-cloud', 'position', { position: 0, size: 100 })
    const far = handleOf('grain-cloud', 'position', { position: 1, size: 100 })
    expect(near.x).toBeCloseTo(124 - Math.sqrt(cloudDelay(0, 1, 0.1) / 8) * 120, 3)
    expect(far.x).toBeCloseTo(124 - Math.sqrt(cloudDelay(1, 1, 0.1) / 8) * 120, 3)
    expect(near.drag(far.x, far.y).position).toBeCloseTo(1, 3)
    expect(near.wheel?.(1).size).toBeCloseTo(115, 3)
    expect(near.wheel?.(-1).size).toBeCloseTo(100 / 1.15, 3)
  })

  it('shows the cloud the settings make at rest, in ink, and the device’s grains in the second colour', () => {
    expectStill('grain-cloud')
    const { display, params, meters } = device('grain-cloud')
    const rest = marksOf(drawDisplay(display, params, { meters }))
    const grains = rest.filter((mark) => mark.kind === 'rect' && foot(mark) - top(mark) === 2)
    expect(grains.length).toBeGreaterThan(3)
    expect(grains.every((mark) => mark.colour === INK)).toBe(true)
  })
})

// --- Glitch -----------------------------------------------------------------

describe('Glitch', () => {
  const REPEAT = 1
  const SKIP = 2
  const REVERSE = 3
  const HALF = 4
  const STOP = 5
  const piece = (kind: number, length: number, speed = 1): GlitchPiece => ({
    t0: 0,
    t1: length,
    kind,
    speed,
    step: 0,
    slice: 0.25,
  })

  it('turns each repeat down as next_segment() does: 6 dB a repeat at full Decay', () => {
    expect(glitchGain(REPEAT, 0, 1)).toBe(1)
    expect(20 * Math.log10(glitchGain(REPEAT, 1, 1))).toBeCloseTo(-6, 6)
    expect(20 * Math.log10(glitchGain(REPEAT, 3, 0.5))).toBeCloseTo(-9, 6)
    // A stuck loop loses 2.4 dB a time, and the others play at full level.
    expect(20 * Math.log10(glitchGain(SKIP, 5, 1))).toBeCloseTo(-12, 6)
    expect(glitchGain(REPEAT, 4, 0)).toBe(1)
    expect(glitchGain(REVERSE, 3, 1)).toBe(1)
  })

  it('shortens each repeat by Bounce, never under 8 ms', () => {
    expect(glitchRepeatSec(0.25, 0, 1)).toBeCloseTo(0.25, 6)
    expect(glitchRepeatSec(0.25, 1, 1)).toBeCloseTo(0.25 * 0.55, 6)
    expect(glitchRepeatSec(0.25, 2, 1)).toBeCloseTo(0.25 * 0.55 * 0.55, 6)
    expect(glitchRepeatSec(0.25, 3, 0)).toBeCloseTo(0.25, 6)
    expect(glitchRepeatSec(0.25, 7, 1)).toBeCloseTo(0.008, 6)
  })

  it('draws where each kind reads as render() moves its reader', () => {
    // A repeat reads its slice from the start to the end; a reverse from the end to the start.
    expect(glitchRead(piece(REPEAT, 0.25), 0.125, 0)).toBeCloseTo(0.5, 6)
    expect(glitchRead(piece(REPEAT, 0.25), 0.25, 0)).toBeCloseTo(1, 6)
    expect(glitchRead(piece(REVERSE, 0.25, -1), 0, 0)).toBeCloseTo(1, 6)
    expect(glitchRead(piece(REVERSE, 0.25, -1), 0.25, 0)).toBeCloseTo(0, 6)
    // An octave up is through the slice in half the time.
    expect(glitchRead(piece(REPEAT, 0.125, 2), 0.125, 0)).toBeCloseTo(1, 6)
    // Half speed reads half as much sound as time goes by.
    expect(glitchRead(piece(HALF, 0.25), 0.25, 0)).toBeCloseTo(0.5, 3)
    // A tape that stops evenly has read half of what it would have, and spins up over 0.3 of the stop.
    const stop = piece(STOP, 0.25 * 1.3)
    expect(glitchRead(stop, 0.25, 0)).toBeCloseTo(0.5, 6)
    expect(glitchRead(stop, 0.125, 0)).toBeCloseTo(0.375, 6)
    expect(glitchRead(stop, 0.25 * 1.3, 0)).toBeCloseTo(0.5 + 0.15, 6)
  })

  it('measures one slice back from now with its handle', () => {
    // 4 s across 176 px, now three quarters of the way: 250 ms is 11 px left of it.
    const nowX = Math.round(4 + 176 * 0.75)
    const at = handleOf('glitch', 'time', { time: 250 })
    expect(at.x).toBeCloseTo(nowX - 11, 3)
    expect(handleOf('glitch', 'time', { time: 1000 }).x).toBeCloseTo(nowX - 44, 3)
    expect(at.drag(nowX - 22, at.y).time).toBeCloseTo(500, 3)
  })

  /** Run the display on what the device reports; `readings(t)` gives the meters at time `t`. */
  function runGlitch(
    seconds: number,
    readings: (time: number) => Record<string, number>,
    values: Record<string, number> = {},
  ): Mark[] {
    const { display, params, meters } = device('glitch')
    return marksOf(
      runDisplay(display, params, seconds, { values, meters }, (time) => ({
        meters: { ...meters, ...readings(time) },
      })),
    )
  }

  it('draws a repeat the device reports as blocks that fall by Decay, with the rest still to come', () => {
    // A slice clock of 250 ms; at 1 s an event of four repeats begins and the second is playing at the end.
    const marks = runGlitch(
      1.4,
      (time) => {
        const into = time % 0.25
        if (time < 1) return { events: 0, kind: 0, count: 0, piece: 0, next: 0.25 - into, speed: 1 }
        return {
          events: 1,
          kind: REPEAT,
          count: 4,
          piece: 1 + Math.floor((time - 1) / 0.25),
          next: 0.25 - into,
          speed: 1,
        }
      },
      { time: 250, decay: 1, calm: 0 },
    )
    const blocks = marks.filter(
      (mark) => mark.kind === 'fill' && mark.colour === ACCENT && mark.points.length === 4,
    )
    expect(blocks).toHaveLength(2)
    const height = (mark: Mark): number => foot(mark) - top(mark)
    // The second repeat is 6 dB under the first: half as tall.
    expect(height(blocks[1]) / height(blocks[0])).toBeCloseTo(0.5, 2)
    // Each is a slice long: 11 px.
    expect(right(blocks[0]) - left(blocks[0])).toBeCloseTo(11, 0)
    // The two that are left stand dashed at the right of now, a quarter and an eighth as tall.
    const nowX = Math.round(4 + 176 * 0.75)
    const coming = marks.filter(
      (mark) => mark.kind === 'stroke' && mark.dashed && mark.points.length === 4,
    )
    expect(coming).toHaveLength(2)
    expect(left(coming[0])).toBeGreaterThanOrEqual(nowX - 1)
    expect(height(coming[0]) / height(blocks[0])).toBeCloseTo(0.25, 2)
    expect(height(coming[1]) / height(blocks[0])).toBeCloseTo(0.125, 2)
    expect(marks.some((mark) => mark.words === 'REPEAT')).toBe(true)
    // The slice clock is short ticks along the foot, never a line up the picture.
    const ticks = marks.filter((mark) => mark.kind === 'rect' && right(mark) - left(mark) === 1)
    expect(ticks.length).toBeGreaterThanOrEqual(4)
    for (const tick of ticks) expect(foot(tick) - top(tick)).toBe(4)
  })

  it('names an event while it plays and for a moment after, so that a short one can be read', () => {
    // One reverse of a slice, from 1 s to 1.25 s.
    const word = (seconds: number): Mark | undefined =>
      runGlitch(
        seconds,
        (time) => {
          const into = time % 0.25
          const on = time >= 1 && time < 1.25
          return {
            events: time >= 1 ? 1 : 0,
            kind: on ? REVERSE : 0,
            count: on ? 1 : 0,
            piece: on ? 1 : 0,
            next: 0.25 - into,
            speed: -1,
          }
        },
        { time: 250 },
      ).find((mark) => mark.kind === 'words')
    expect(word(0.9)).toBeUndefined()
    const playing = word(1.15)
    expect(playing?.words).toBe('REVERSE')
    const after = word(2)
    expect(after?.words).toBe('REVERSE')
    expect(after?.alpha ?? 1).toBeLessThan(playing?.alpha ?? 0)
    expect(word(3.2)).toBeUndefined()
  })

  it('writes the word where all of it shows', () => {
    const { display, params, meters } = device('glitch')
    const nowX = Math.round(4 + 176 * 0.75)
    for (const kind of [REPEAT, SKIP, REVERSE, HALF, STOP]) {
      const drawn = runDisplay(display, params, 0.5, { meters }, (time) => ({
        meters: { ...meters, events: 1, kind, count: 2, piece: 1, next: 0.25 - (time % 0.25) },
      }))
      const at = drawn.calls.findIndex((call) => call.name === 'fillText')
      expect(at).toBeGreaterThan(-1)
      const [words, x] = drawn.calls[at].args as [string, number]
      const align = drawn.calls
        .slice(0, at)
        .reverse()
        .find((call) => call.name === 'set textAlign')?.args[0]
      // The test canvas makes a letter 5 px wide; the picture ends at 180.
      if (align === 'left') {
        expect(x).toBe(nowX + 6)
        expect(x + words.length * 5).toBeLessThanOrEqual(180)
      } else {
        expect(align).toBe('right')
        expect(x).toBe(180)
      }
    }
  })

  it('shows what the settings would do at rest, and nothing of it once the device reports', () => {
    expectStill('glitch')
    const { display, params, meters } = device('glitch')
    const rest = marksOf(drawDisplay(display, params, { meters, values: { chance: 1 } }))
    expect(rest.some((mark) => mark.colour === ACCENT && mark.kind === 'fill')).toBe(false)
    // With Chance at 1 every slice is an event: there are blocks, in ink.
    expect(
      rest.filter((mark) => mark.kind === 'fill' && mark.colour === INK && mark.points.length === 4)
        .length,
    ).toBeGreaterThan(3)
    // With Chance at 0 nothing happens: only the slice clock.
    const calm = marksOf(drawDisplay(display, params, { meters, values: { chance: 0 } }))
    expect(calm.filter((mark) => mark.kind === 'fill' && mark.points.length === 4)).toHaveLength(0)
  })
})

// --- Spectral Blur ----------------------------------------------------------

describe('Spectral Blur', () => {
  it('hangs for 20 s × Blur³', () => {
    expect(blurHangSec(0)).toBe(0)
    expect(blurHangSec(0.5)).toBeCloseTo(2.5, 6)
    expect(blurHangSec(0.6)).toBeCloseTo(4.32, 6)
    expect(blurHangSec(1)).toBeCloseTo(20, 6)
  })

  it('writes the hang time at the tip of the wedge, and FROZEN when nothing dies away', () => {
    const { display, params, meters } = device('spectral-blur')
    const words = (values: Record<string, number>): string[] =>
      drawDisplay(display, params, { meters, values }).words()
    expect(words({ blur: 0.6 })).toContain('4.3 s')
    expect(words({ blur: 0.5 })).toContain('2.5 s')
    expect(words({ blur: 1 })).toContain('20 s')
    expect(words({ blur: 0.6, freeze: 1 })).toContain('FROZEN')
    // The tip is the Blur handle: the ruler is the knob's own travel, 6 to 122.
    expect(handleOf('spectral-blur', 'blur', { blur: 0 }).x).toBeCloseTo(6, 3)
    expect(handleOf('spectral-blur', 'blur', { blur: 1 }).x).toBeCloseTo(122, 3)
    const tip = handleOf('spectral-blur', 'blur', { blur: 0.25 })
    expect(tip.drag(6 + 116 * 0.75, tip.y).blur).toBeCloseTo(0.75, 3)
  })

  it('tilts about 1 kHz as update_shape() does, lifting 12 dB at the most', () => {
    expect(blurTiltDb(1000, 6)).toBeCloseTo(0, 6)
    expect(blurTiltDb(2000, 3)).toBeCloseTo(3, 6)
    expect(blurTiltDb(250, 3)).toBeCloseTo(-6, 6)
    expect(blurTiltDb(16000, 6)).toBe(12)
    expect(blurTiltDb(31.25, 6)).toBeCloseTo(-30, 6)
    expect(blurTiltDb(31.25, -6)).toBe(12)
  })

  it('cuts with raised-cosine steps half an octave wide, off at the ends of their ranges', () => {
    // At its own frequency a cut is half way down its step: -6 dB.
    expect(blurShapeDb(200, 0, 200, 20000)).toBeCloseTo(-6.02, 1)
    expect(blurShapeDb(4000, 0, 20, 4000)).toBeCloseTo(-6.02, 1)
    // A quarter octave inside it is fully open, a quarter outside fully shut.
    expect(blurShapeDb(200 * Math.pow(2, 0.25), 0, 200, 20000)).toBeCloseTo(0, 6)
    expect(blurShapeDb(200 * Math.pow(2, -0.26), 0, 200, 20000)).toBeLessThan(-100)
    expect(blurShapeDb(4000 * Math.pow(2, 0.26), 0, 20, 4000)).toBeLessThan(-100)
    // Low Cut at 20 Hz and High Cut at 20 kHz are off.
    expect(blurShapeDb(20, 0, 20, 20000)).toBeCloseTo(0, 6)
    expect(blurShapeDb(20000, 0, 20, 20000)).toBeCloseTo(0, 6)
    // The tilt and a cut add up.
    expect(blurShapeDb(4000, -3, 20, 4000)).toBeCloseTo(-6 - 6.02, 1)
  })

  it('stands the cut and tilt handles on the curve', () => {
    // The curve's scale: +18 dB at the top of its box (17) to -36 at the foot (96).
    const yOf = (db: number): number => 17 + ((18 - db) / 54) * 79
    const xOf = (hz: number): number => 4 + (Math.log(hz / 20) / Math.log(1000)) * 120
    const values = { tilt: -2, lowCut: 100, highCut: 8000 }
    const low = handleOf('spectral-blur', 'lowCut', values)
    expect(low.x).toBeCloseTo(xOf(100), 3)
    expect(low.y).toBeCloseTo(yOf(blurShapeDb(100, -2, 100, 8000)), 1)
    const high = handleOf('spectral-blur', 'highCut', values)
    expect(high.x).toBeCloseTo(xOf(8000), 3)
    expect(high.y).toBeCloseTo(yOf(blurShapeDb(8000, -2, 100, 8000)), 1)
    // Tilt sits two octaves over the pivot, where a dB per octave is two dB.
    const tilt = handleOf('spectral-blur', 'tilt', values)
    expect(tilt.x).toBeCloseTo(xOf(4000), 3)
    expect(tilt.y).toBeCloseTo(yOf(-4), 3)
    expect(tilt.drag(tilt.x, yOf(6)).tilt).toBeCloseTo(3, 3)
    expect(low.drag(xOf(400), low.y).lowCut).toBeCloseTo(400, 1)
  })

  it('grades the held share from the middle of one half decade to the middle of the next', () => {
    const hang = [0, 0.2, 0.4, 0.8, 0.6, 1]
    // A band's reading stands at its middle.
    for (let band = 0; band < 6; band++) {
      expect(blurHeldAt(hang, (band + 0.5) / 6)).toBeCloseTo(hang[band], 6)
    }
    // Where two bands meet it is half way between them, and past the outer middles it stays level.
    expect(blurHeldAt(hang, 3 / 6)).toBeCloseTo(0.6, 6)
    expect(blurHeldAt(hang, 4 / 6)).toBeCloseTo(0.7, 6)
    expect(blurHeldAt(hang, 0)).toBe(0)
    expect(blurHeldAt(hang, 1)).toBe(1)
  })

  it('colours the spectrum by how much of each half decade the device says is hanging', () => {
    const { display, params, meters } = device('spectral-blur')
    const run = (hang: Record<string, number>): Mark[] =>
      marksOf(
        runDisplay(display, params, 2, { signal: testSignal(), meters: { ...meters, ...hang } }),
      ).filter((mark) => mark.kind === 'rect' && mark.colour === ACCENT)
    // Nothing hanging: the spectrum is in ink alone.
    expect(run({})).toHaveLength(0)
    // The band from 630 Hz to 2 kHz three quarters held: columns a pixel wide that stand on the
    // foot, strongest at the band's middle (pixel 74 of the box from 4 to 124) and gone by its neighbours'.
    const one = run({ hang4: 0.75 })
    expect(one.length).toBeGreaterThan(20)
    const held = [0, 0, 0, 0.75, 0, 0]
    for (const column of one) {
      expect(right(column) - left(column)).toBe(1)
      expect(foot(column)).toBe(96)
      expect(left(column)).toBeGreaterThan(4 + 120 * (2.5 / 6))
      expect(left(column)).toBeLessThan(4 + 120 * (4.5 / 6))
      expect(column.alpha).toBeCloseTo(0.9 * blurHeldAt(held, (left(column) + 0.5 - 4) / 120), 2)
    }
    const strongest = one.reduce((a, b) => (b.alpha > a.alpha ? b : a))
    expect(Math.abs(left(strongest) + 0.5 - 74)).toBeLessThanOrEqual(0.5)
    expect(strongest.alpha).toBeGreaterThan(0.9 * 0.7)
    // All six held, as when frozen: the whole spectrum, as strong as the colour gets.
    const all = run({ hang1: 1, hang2: 1, hang3: 1, hang4: 1, hang5: 1, hang6: 1 })
    expect(all.length).toBeGreaterThan(60)
    for (const column of all) expect(column.alpha).toBeCloseTo(0.9, 2)
  })

  it('makes no new points for its spectrum or its curves from one frame to the next', () => {
    const { display, params, meters } = device('spectral-blur')
    const state = display.init?.() as { spectrum: unknown[]; tone: unknown; tiltLine: unknown }
    const options = { signal: testSignal(), meters: { ...meters, hang3: 0.5 }, state }
    runDisplay(display, params, 0.2, options)
    const before = { spectrum: state.spectrum, first: state.spectrum[0], tone: state.tone }
    runDisplay(display, params, 0.2, options)
    expect(state.spectrum).toBe(before.spectrum)
    expect(state.spectrum[0]).toBe(before.first)
    expect(state.tone).toBe(before.tone)
    // A setting that moves the curve makes it again.
    runDisplay(display, params, 0.1, { ...options, values: { tilt: 3 } })
    expect(state.tone).not.toBe(before.tone)
  })

  it('is a still picture of the settings when there is no sound', () => {
    expectStill('spectral-blur')
  })
})

// --- Cascade ----------------------------------------------------------------

describe('Cascade', () => {
  const STACK = 0
  const RESTRIKE = 1
  const DRONE = 2
  const STEPS = 3
  const slice = (over: Partial<CascadeSlice> = {}): CascadeSlice => ({
    length: 0.4 - 0.0035,
    period: 0.4,
    step: 0,
    flip: false,
    pattern: STACK,
    repeats: 5,
    fifths: false,
    high: true,
    low: false,
    ...over,
  })
  interface Pass {
    start: number
    run: number
    speed: number
    age: number
    level: number
    swell: number
  }
  const passes = (over: Partial<CascadeSlice> = {}): Pass[] => {
    const all: Pass[] = []
    cascadePasses(slice(over), (start, run, speed, age, level, swell) =>
      all.push({ start, run, speed, age, level, swell }),
    )
    return all
  }
  const at = (all: Pass[], speed: number): Pass[] => all.filter((pass) => pass.speed === speed)

  it('loses 12 dB a repeat at full Decay, as repeat_gain() has it, and scales by High and Low', () => {
    expect(cascadeGain(0, 1, 1, 1, 0.6, 0.3)).toBe(1)
    expect(20 * Math.log10(cascadeGain(1, 1, 1, 1, 0.6, 0.3))).toBeCloseTo(-12, 3)
    expect(20 * Math.log10(cascadeGain(3, 1, 1, 0.5, 0.6, 0.3))).toBeCloseTo(-18, 3)
    expect(cascadeGain(4, 1, 1, 0, 0.6, 0.3)).toBe(1)
    // The faster parts take High, the half-speed one Low.
    expect(cascadeGain(0, 1, 2, 0, 0.6, 0.3)).toBeCloseTo(0.6, 6)
    expect(cascadeGain(0, 1, 4, 0, 0.6, 0.3)).toBeCloseTo(0.6, 6)
    expect(cascadeGain(0, 1, 0.5, 0, 0.6, 0.3)).toBeCloseTo(0.3, 6)
  })

  it('stacks a slice as mosaic_pass() does: Repeats × speed passes, back to back', () => {
    const all = passes()
    expect(at(all, 1)).toHaveLength(5)
    expect(at(all, 2)).toHaveLength(10)
    expect(at(all, 4)).toHaveLength(20)
    expect(at(all, 0.5)).toHaveLength(0)
    // A pass at speed s starts every Time / s and lasts the slice at that speed.
    at(all, 2).forEach((pass, k) => {
      expect(pass.start).toBeCloseTo(k * 0.2, 6)
      expect(pass.run).toBeCloseTo((0.4 - 0.0035) / 2, 6)
      expect(pass.age).toBeCloseTo(k / 2, 6)
    })
    expect(at(all, 4)[19].start).toBeCloseTo(1.9, 6)
    // The loop at the played speed sits under the others; the faster ones carry accents in turn.
    expect(at(all, 1)[0].level).toBeCloseTo(0.85, 6)
    expect(
      at(all, 2)
        .map((pass) => pass.level)
        .slice(0, 2),
    ).toEqual([0.9, 1.1])
    expect(
      at(all, 4)
        .map((pass) => pass.level)
        .slice(0, 4),
    ).toEqual([0.8, 1.15, 0.95, 1.1])
  })

  it('adds the half-speed part with Low and the fifths with Interval', () => {
    const low = passes({ low: true, high: false })
    expect(at(low, 0.5)).toHaveLength(3)
    expect(at(low, 0.5)[1].start).toBeCloseTo(0.8, 6)
    expect(at(low, 2)).toHaveLength(0)
    const fifths = passes({ fifths: true })
    // Repeats × 1.5 rounds half up, as the device does.
    expect(at(fifths, 1.5)).toHaveLength(8)
    expect(at(fifths, 3)).toHaveLength(15)
    // Four parts above instead of two: each 3 dB down.
    expect(at(fifths, 2)[0].level).toBeCloseTo(0.9 * Math.SQRT1_2, 6)
  })

  it('strikes as strum_pass() does: gaps from half a Time down to an eighth', () => {
    const all = at(passes({ pattern: RESTRIKE, high: false }), 1)
    expect(all).toHaveLength(5)
    const gaps = all.slice(1).map((pass, k) => pass.start - all[k].start)
    expect(gaps[0]).toBeCloseTo(0.2, 6)
    expect(gaps[3]).toBeCloseTo(0.05, 6)
    expect(gaps[1] / gaps[0]).toBeCloseTo(Math.pow(2, -2 / 3), 6)
    // Each stroke is a repeat older than the last, and every other slice runs them the other way.
    expect(all.map((pass) => pass.age)).toEqual([0, 1, 2, 3, 4])
    const back = at(passes({ pattern: RESTRIKE, high: false, flip: true }), 1)
    expect(back[1].start - back[0].start).toBeCloseTo(0.05, 6)
    // A stroke is a third of a Time of the slice, cut to the gap it has.
    expect(all[0].run).toBeCloseTo(0.4 / 3, 6)
    expect(all[3].run).toBeCloseTo(0.05, 6)
  })

  it('climbs through the speeds in Steps, one a repeat, from where the device had got to', () => {
    const steps = passes({ pattern: STEPS, repeats: 6 })
    expect(steps.map((pass) => pass.speed)).toEqual([1, 2, 4, 2, 1, 2])
    steps.forEach((pass, k) => expect(pass.start).toBeCloseTo(k * 0.4, 6))
    expect(steps[2].run).toBeCloseTo((0.4 - 0.0035) / 4, 6)
    expect(passes({ pattern: STEPS, repeats: 3, step: 2 }).map((pass) => pass.speed)).toEqual([
      4, 2, 1,
    ])
    expect(passes({ pattern: STEPS, repeats: 8, fifths: true }).map((pass) => pass.speed)).toEqual([
      1, 1.5, 2, 3, 4, 3, 2, 1.5,
    ])
  })

  it('loops a piece into a drone until Repeats × Time is up, each pass 12 % longer', () => {
    const drone = passes({ pattern: DRONE, high: false, repeats: 4 })
    const first = drone.filter((pass) => pass.swell === 0.5)
    // The first voice: a piece of twice an eighth of a Time, back to back.
    expect(first[0].run).toBeCloseTo(0.1, 6)
    expect(first[1].run).toBeCloseTo(0.1 * 1.12, 6)
    expect(first[1].start).toBeCloseTo(0.1, 6)
    expect(first[first.length - 1].start).toBeLessThan(4 * 0.4)
    expect(first[first.length - 1].start + first[first.length - 1].run).toBeGreaterThanOrEqual(1.6)
    // The second starts in the middle of the first one's first pass.
    const second = drone.filter((pass) => pass.swell !== 0.5)
    expect(second[0].start).toBeCloseTo(0.05, 6)
    expect(second[0].run).toBeCloseTo(0.05 + 0.056, 6)
  })

  it('stops a slice at 18 s, as the device does above 1.1 s of Time', () => {
    const long = passes({ period: 2, length: 2 - 0.0035, repeats: 16, high: false })
    expect(long).toHaveLength(9)
    expect(long[8].start + long[8].run).toBeLessThanOrEqual(18)
  })

  it('shapes a pass as render() does: a rise, then a fall that Shape rounds', () => {
    expect(cascadeWindow(0, 0.5, 1)).toBe(0)
    expect(cascadeWindow(0.25, 0.5, 1)).toBeCloseTo(0.5, 6)
    expect(cascadeWindow(0.5, 0.5, 1)).toBeCloseTo(1, 6)
    // At full Shape the fall mirrors the rise; at none it is its fourth power.
    expect(cascadeWindow(0.75, 0.5, 1)).toBeCloseTo(0.5, 6)
    expect(cascadeWindow(0.75, 0.5, 0)).toBeCloseTo(0.0625, 6)
    expect(cascadeWindow(1, 0.5, 0.3)).toBeCloseTo(0, 6)
  })

  /** The hills drawn in a colour: closed paths that stand on a row. */
  const hills = (marks: Mark[], colour: string): Mark[] =>
    marks.filter((mark) => mark.kind === 'fill' && mark.colour === colour && mark.points.length > 2)

  it('draws the score of one slice at rest: Repeats × speed hills in each row, falling by Decay', () => {
    expectStill('cascade')
    const { display, params, meters } = device('cascade')
    const rest = marksOf(
      drawDisplay(display, params, {
        meters,
        values: { pattern: 0, time: 400, repeats: 5, decay: 0.5, high: 1, low: 0, shape: 1 },
      }),
    )
    // One path holds every hill: 5 + 10 + 20 of them, each begun with a moveTo on its row.
    const score = hills(rest, INK)
    expect(score).toHaveLength(1)
    expect(hills(rest, ACCENT)).toHaveLength(0)
    const rows = new Map<number, number>()
    for (const [, y] of score[0].starts) {
      const row = Math.round(y * 100) / 100
      rows.set(row, (rows.get(row) ?? 0) + 1)
    }
    const counts = [...rows.entries()].sort(([a], [b]) => b - a)
    expect(counts.map(([, n]) => n)).toEqual([5, 10, 20])
    // The rows are an octave apart: the same step from 1 to 2 as from 2 to 4.
    const [one, two, four] = counts.map(([y]) => y)
    expect(one - two).toBeCloseTo(two - four, 1)
    expect(rest.some((mark) => mark.words === '5 × 400 ms')).toBe(true)
  })

  it('draws a slice the device reports from where it was caught, with the pass sounding now in the second colour', () => {
    const { display, params, meters } = device('cascade')
    const values = { pattern: 3, time: 400, repeats: 4, decay: 0, high: 1, low: 0, shape: 1 }
    // 24 frames; a slice is caught on the sixteenth, so the last is 8 frames on, in its first pass.
    const since = 8 / 30
    const drawn = runDisplay(display, params, 0.8, { values, meters }, (time) => ({
      meters: {
        ...meters,
        slices: time > 0.49 ? 1 : 0,
        length: 0.3965,
        period: 0.4,
        delay: 0,
        step: 0,
        slot: 0,
      },
    }))
    const marks = marksOf(drawn)
    const sounding = hills(marks, ACCENT)
    expect(sounding).toHaveLength(1)
    // Steps: the first repeat is at the played speed and a slice long, and now is two thirds through it.
    // The scale fits one slice's replays: three Times and the last pass, at twice the speed.
    // The plot is from 18, clear of the names of the rows, to 124.
    const nowX = Math.round(18 + 106 * 0.2)
    const perSec = (124 - nowX) / (1.04 * (1.2 + 0.3965 / 2))
    expect(left(sounding[0])).toBeCloseTo(nowX - since * perSec, 3)
    expect(right(sounding[0])).toBeCloseTo(nowX + (0.3965 - since) * perSec, 3)
    // The three repeats to come are in ink, at the right of now, a Time after the first began.
    const coming = hills(marks, INK)
    expect(coming).toHaveLength(1)
    expect(coming[0].starts).toHaveLength(3)
    expect(left(coming[0])).toBeCloseTo(nowX + (0.4 - since) * perSec, 3)
  })

  /** A slice caught every Time for `seconds`, as when the playing never stops. */
  function runCascade(seconds: number, values: Record<string, number>): Mark[] {
    const { display, params, meters } = device('cascade')
    const period = values.time / 1000
    return marksOf(
      runDisplay(display, params, seconds, { values, meters }, (time) => ({
        meters: {
          ...meters,
          slices: Math.floor(time / period),
          length: period - 0.0035,
          period,
          delay: 0,
          step: 0,
          slot: time % period,
        },
      })),
    )
  }

  it('draws the slice caught last in full and the earlier ones as one faint shape behind it', () => {
    const marks = runCascade(3, {
      pattern: 0,
      time: 400,
      repeats: 5,
      decay: 0.5,
      high: 1,
      low: 0,
      shape: 1,
    })
    const inked = hills(marks, INK)
    expect(inked).toHaveLength(2)
    const [bed, newest] = inked
    expect(bed.alpha).toBeLessThan(newest.alpha / 2)
    // The newest is one slice's cascade, less what sounds now: no more than its 35 passes.
    expect(newest.starts.length).toBeGreaterThan(25)
    expect(newest.starts.length).toBeLessThanOrEqual(35)
    // Behind it, the slices before that are still playing out, together.
    expect(bed.starts.length).toBeGreaterThan(newest.starts.length)
    // What sounds now, of any slice, is in the second colour: one path, drawn last.
    const sounding = hills(marks, ACCENT)
    expect(sounding).toHaveLength(1)
    expect(sounding[0].starts.length).toBeGreaterThan(3)
    const nowX = Math.round(18 + 106 * 0.2)
    for (const [x] of sounding[0].starts) expect(x).toBeLessThanOrEqual(nowX)
  })

  it('holds what a draw costs however many slices are playing out', () => {
    // A drone of sixteen repeats with every part: some 130 passes a slice, sixteen slices at once.
    const marks = runCascade(16, {
      pattern: 2,
      time: 900,
      repeats: 16,
      decay: 0.2,
      high: 1,
      low: 1,
      shape: 1,
    })
    const [bed, newest] = hills(marks, INK)
    // The earlier slices are given 240 hills between them, and the one that crosses that is finished.
    expect(bed.starts.length).toBeGreaterThan(100)
    expect(bed.starts.length).toBeLessThanOrEqual(240 + 288)
    expect(newest.starts.length).toBeLessThanOrEqual(288)
    // Each of theirs is a few points; a hill of the newest has its whole curve.
    expect(bed.points.length / bed.starts.length).toBeLessThanOrEqual(8)
    // Whatever sounds is still marked, of every slice.
    expect(hills(marks, ACCENT)[0].starts.length).toBeGreaterThan(20)
  })

  it('names its rows clear of the edge and of the plot', () => {
    const { display, params, meters } = device('cascade')
    const marks = marksOf(drawDisplay(display, params, { meters, values: { interval: 1 } }))
    const names = marks.filter((mark) => mark.kind === 'words' && mark.words !== undefined)
    expect(names.map((mark) => mark.words).slice(0, 6)).toEqual(['.5', '1', '1.5', '2', '3', '4'])
    // Right-aligned 2 px left of the plot, which begins 14 px in: room for the widest, 1.5.
    for (const name of names.slice(0, 6)) expect(name.points[0][0]).toBe(16)
  })
})

// --- All six ----------------------------------------------------------------

describe('The texture displays', () => {
  const ids = ['grain-cloud', 'glitch', 'cascade', 'spectral-blur', 'sustainer', 'pad-follower']
  const busy: Record<string, number> = {
    grains: 3,
    place: 1,
    rate: 1,
    pan: 0.2,
    level: 0.3,
    events: 1,
    kind: 1,
    count: 3,
    piece: 1,
    next: 0.1,
    speed: 1,
    slices: 2,
    length: 0.39,
    period: 0.4,
    slot: 0.1,
    hang3: 0.6,
    held: 0.3,
    layers: 2,
    caught: 1,
    heard: 0.1,
  }

  it('keep the second colour for what is happening: at rest every one is in ink alone', () => {
    for (const id of ids) {
      const { display, params, meters } = device(id)
      for (const options of [{ meters }, { meters, signal: testSignal(0, 0) }]) {
        const rest = marksOf(drawDisplay(display, params, options))
        expect(
          rest.filter((mark) => mark.colour === ACCENT),
          id,
        ).toHaveLength(0)
      }
    }
  })

  it('write nothing smaller than 8 px, at rest or running or with a point in hand', () => {
    for (const id of ids) {
      const { display, params, meters } = device(id)
      const mine = Object.fromEntries(Object.keys(meters).map((name) => [name, busy[name] ?? 0]))
      const hots = [undefined, ...(display.handles?.(viewOf(display, params)) ?? [])]
      for (const hot of hots) {
        const drawings = [
          drawDisplay(display, params, { meters, hot: hot?.key }),
          runDisplay(display, params, 1, { meters: mine, signal: testSignal(), hot: hot?.key }),
          runDisplay(display, params, 1, {
            meters: mine,
            signal: testSignal(),
            hot: hot?.key,
            values: { freeze: 1, interval: 1 },
          }),
        ]
        for (const drawn of drawings) {
          for (const call of drawn.calls) {
            if (call.name !== 'set font') continue
            const size = Number(/^(\d+(?:\.\d+)?)px/.exec(String(call.args[0]))?.[1])
            expect(size, `${id}: ${String(call.args[0])}`).toBeGreaterThanOrEqual(8)
          }
        }
      }
    }
  })
})
