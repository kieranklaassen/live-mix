// The truth of the Stretch display: the window is the device's window at its
// length, the reader stands where the device reports it and falls behind as
// the device's own rule has it, the line ahead of it is what it still plays
// before Memory is used up, and the handles set what the knobs set.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { denormalizeParam, normalizeParam } from '../../core/params'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import { heightOfLevel, timeText } from '../components/displays/loops'
import {
  STRETCH_FACES,
  STRETCH_FRAMES,
  flagLength,
  hann,
  stretchAhead,
  stretchDrift,
  stretchFrame,
  stretchLanes,
  stretchText,
} from '../components/displays/stretch'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const display = STRETCH_FACES.stretch.display
const params = stockDescriptors().get('stretch')?.params ?? {}
const { ink, accent, plate } = PLAIN_COLOURS
const header = readFileSync(resolve(__dirname, '../../../cpp/devices/stretch/stretch.h'), 'utf8')

/** A strip at rest is 184 by 48: the recording lies from x 4 to the write head at 119, the pane from 129 to 179. */
const HEAD = 119
const REACH = 115
const TAPE = { y: 4, h: 31 }
const PANE = { x: 129, y: 6, w: 50, h: 25 }
/** Pixels a second of recording takes at a Memory, as the display lays it: 30 % of the reach at the shortest. */
const perSec = (memory: number): number =>
  (REACH * (0.3 + 0.7 * normalizeParam(params.memory, memory))) / memory

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

/** The reader: the upright line 1.5 wide. */
function readerOf(drawn: RecordingContext): Drawn | undefined {
  return paths(drawn).find(
    (path) =>
      path.kind === 'stroke' &&
      path.width === 1.5 &&
      path.points.length === 2 &&
      path.points[0][0] === path.points[1][0],
  )
}

/** The line of what is still to play: level, 2 wide. */
function aheadOf(drawn: RecordingContext): Drawn | undefined {
  return paths(drawn).find(
    (path) =>
      path.kind === 'stroke' &&
      path.width === 2 &&
      path.points.length === 2 &&
      path.points[0][1] === path.points[1][1],
  )
}

/** The outline of the recording that covers `x`: how tall it stands there, and how strongly it is laid. */
function heldAt(drawn: RecordingContext, x: number): { tall: number; alpha: number } {
  for (const path of paths(drawn)) {
    if (path.kind !== 'fill' || path.colour !== ink || path.points.length < 8) continue
    const upper = path.points.slice(0, path.points.length / 2)
    if (x < upper[0][0] || x > upper[upper.length - 1][0]) continue
    let near = upper[0]
    for (const point of upper) if (Math.abs(point[0] - x) < Math.abs(near[0] - x)) near = point
    return { tall: TAPE.y + TAPE.h / 2 - near[1], alpha: path.alpha }
  }
  return { tall: 0, alpha: 0 }
}

const usesAccent = (drawn: RecordingContext): boolean =>
  drawn.calls.some(
    (call) =>
      (call.name === 'set fillStyle' || call.name === 'set strokeStyle') && call.args[0] === accent,
  )

/**
 * The device's readings while it records from silence at `stretch`: its clock
 * counts the seconds, and the reader, `from` seconds behind at the start,
 * falls behind by (1 - 1/Stretch) a second (`tick()`), at 1/Stretch its speed.
 */
const reading =
  (stretch: number, from: number, level: (t: number) => number = () => 0.5) =>
  (t: number): Partial<FrameOptions> => ({
    meters: { level: level(t), behind: from + (1 - 1 / stretch) * t, speed: 1 / stretch, clock: t },
  })

describe('the numbers the Stretch display shares with the device', () => {
  it('has the windows of the device, and takes a value between two choices as the nearer', () => {
    const frames = /kFrames\[kSizes\] = \{([^}]*)\}/.exec(header)?.[1].split(',').map(Number)
    expect(frames).toEqual([...STRETCH_FRAMES])
    expect(params.window.choices).toHaveLength(STRETCH_FRAMES.length)
    expect(stretchFrame(0)).toBe(2048)
    expect(stretchFrame(2.4)).toBe(8192)
    expect(stretchFrame(9)).toBe(16384)
    expect(stretchFrame(-1)).toBe(2048)
  })

  it('draws the Hann window the device reads through', () => {
    // stretch.h `init`: window_[n] = 0.5 - 0.5 cos(2 pi n / kMaxFrame); a shorter frame reads every 2nd, 4th or 8th.
    expect(header).toContain('window_[n] = static_cast<float>(0.5 - 0.5 * std::cos(step * n))')
    for (const frame of STRETCH_FRAMES)
      for (const i of [0, 1, frame / 4, frame / 2, frame - 1])
        expect(hann(i / frame)).toBeCloseTo(0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frame), 12)
    expect(hann(0)).toBe(0)
    expect(hann(0.5)).toBe(1)
    expect(hann(1)).toBe(0)
  })

  it('says how much the reader still plays as the rule of the reader gives it', () => {
    // tick(): for every hop recorded the reader moves on by hop / Stretch, until it is Memory behind.
    const hop = 2048 / 48000
    for (const [behind, memory, stretch] of [
      [0.2, 8, 8],
      [3, 8, 2],
      [0.5, 20, 100],
      [1, 1, 4],
    ]) {
      let lag = behind
      let played = 0
      while (lag + hop * (1 - 1 / stretch) <= memory) {
        lag += hop * (1 - 1 / stretch)
        played += hop / stretch
      }
      expect(Math.abs(stretchAhead(behind, memory, stretch) - played)).toBeLessThan(hop)
    }
    expect(stretchAhead(9, 8, 8)).toBe(0)
  })

  it('carries the reader on by how fast it falls behind', () => {
    // Recording runs a second a second; the reader 1/Stretch of that, or faster while it catches up.
    expect(stretchDrift(1 / 8, false)).toBeCloseTo(0.875, 12)
    expect(stretchDrift(4, false)).toBe(-3)
    // Waiting at the present it keeps up, and with Freeze on neither moves.
    expect(stretchDrift(1, false)).toBe(0)
    expect(stretchDrift(0, true)).toBe(0)
    // While its first window fills it stands on the first sample and the recording runs away.
    expect(stretchDrift(0, false)).toBe(1)
  })

  it('says a stretch shortly, and flags the reader by its speed', () => {
    expect(stretchText(8)).toBe('8×')
    expect(stretchText(2.5)).toBe('2.5×')
    expect(stretchText(100)).toBe('100×')
    expect(flagLength(0)).toBe(0)
    expect(flagLength(1 / 8)).toBeGreaterThan(2.5)
    expect(flagLength(1)).toBeGreaterThan(flagLength(1 / 8))
    expect(flagLength(9)).toBe(flagLength(2))
  })
})

describe('what the Stretch display draws', () => {
  it('stands the reader where the device reports it, in the accent, and moves it between two readings', () => {
    for (const [stretch, from] of [
      [8, 0.3],
      [2, 1],
      [100, 0.1],
    ]) {
      const drawn = runDisplay(display, params, 3, { values: { stretch } }, reading(stretch, from))
      const behind = from + (1 - 1 / stretch) * (3 - 1 / 30)
      const mark = readerOf(drawn)
      expect(mark?.colour).toBe(accent)
      expect(mark?.alpha).toBe(1)
      expect(mark?.points[0][0]).toBeCloseTo(HEAD - behind * perSec(8), 1)
      expect(mark?.points[0][1]).toBe(TAPE.y)
      expect(mark?.points[1][1]).toBe(TAPE.y + TAPE.h)
    }
    // Readings that come only every fifth frame: the reader goes on at the device's rate in between.
    const slow = (t: number): Partial<FrameOptions> => reading(8, 0.3)(Math.floor(t * 6 + 1e-9) / 6)
    const coarse = runDisplay(display, params, 3 - 2 / 30, { values: { stretch: 8 } }, (t) => ({
      meters: { ...slow(t).meters, clock: t },
    }))
    const expected = HEAD - (0.3 + 0.875 * (3 - 3 / 30)) * perSec(8)
    expect(readerOf(coarse)?.points[0][0]).toBeCloseTo(expected, 0)
  })

  it('never puts the reader further back than Memory, whatever is read', () => {
    for (const behind of [-6, 0.5, 30, Number.NaN]) {
      const drawn = drawDisplay(display, params, {
        values: { memory: 4 },
        meters: { level: 0.5, behind, speed: 0.125, clock: 2 },
      })
      const x = readerOf(drawn)?.points[0][0] ?? Number.NaN
      expect(x).toBeGreaterThanOrEqual(HEAD - 4 * perSec(4) - 1e-6)
      expect(x).toBeLessThanOrEqual(HEAD)
    }
  })

  it('lays what was recorded where it was recorded, fainter behind the reader', () => {
    // Half a second of sound from the first second on, then silence.
    const burst = (t: number): number => (t >= 1 && t < 1.5 ? 0.8 : 0)
    const drawn = runDisplay(display, params, 3, {}, reading(8, 0.3, burst))
    const last = 3 - 1 / 30
    const full = heightOfLevel(0.8) * (TAPE.h / 2 - 0.5)
    const inBurst = heldAt(drawn, HEAD - (last - 1.25) * perSec(8))
    expect(inBurst.tall).toBeCloseTo(full, 1)
    // The reader is 2.9 s behind: the burst lies ahead of it, the start of the recording behind.
    expect(inBurst.alpha).toBe(0.36)
    expect(heldAt(drawn, HEAD - 0.5 * perSec(8))).toEqual({ tall: 0.5, alpha: 0.36 })
    expect(heldAt(drawn, HEAD - 6 * perSec(8))).toEqual({ tall: 0.5, alpha: 0.16 })
  })

  it('draws ahead of the reader what it still plays before Memory is used up', () => {
    const drawn = runDisplay(display, params, 3, { values: { stretch: 8 } }, reading(8, 0.3))
    const behind = 0.3 + 0.875 * (3 - 1 / 30)
    const line = aheadOf(drawn)
    expect(line?.colour).toBe(accent)
    expect(line?.points[0][0]).toBeCloseTo(HEAD - behind * perSec(8), 1)
    expect((line?.points[1][0] ?? 0) - (line?.points[0][0] ?? 0)).toBeCloseTo(
      stretchAhead(behind, 8, 8) * perSec(8),
      1,
    )
    // Catching up (faster than real time) it runs through all that lies ahead, to half a window behind the head.
    const catching = runDisplay(display, params, 1, {}, (t) => ({
      meters: { level: 0.5, behind: 6 - 4 * t, speed: 5, clock: t },
    }))
    expect(aheadOf(catching)?.points[0][0]).toBeCloseTo(
      HEAD - (6 - 4 * (1 - 1 / 30)) * perSec(8),
      1,
    )
    expect(aheadOf(catching)?.points[1][0]).toBeCloseTo(HEAD - (8192 / 48000 / 2) * perSec(8), 6)
    // At twice it will play all there is and more that is still to come: the line ends at the write head.
    const all = runDisplay(display, params, 3, { values: { stretch: 2 } }, reading(2, 1))
    expect(aheadOf(all)?.points[1][0]).toBe(HEAD)
    // At a hundred times it plays next to nothing of what lies ahead, and never past the write head.
    const far = runDisplay(display, params, 1, { values: { stretch: 100 } }, reading(100, 0.2))
    const short = aheadOf(far)
    expect((short?.points[1][0] ?? 0) - (short?.points[0][0] ?? 0)).toBeLessThan(1.5)
    const near = runDisplay(display, params, 1, { values: { stretch: 2 } }, reading(2, 0.05))
    expect(aheadOf(near)?.points[1][0]).toBeLessThanOrEqual(HEAD)
  })

  it('stands still under Freeze: no line ahead, and the write head no longer filled', () => {
    const heads = (drawn: RecordingContext): Drawn[] =>
      paths(drawn).filter(
        (path) =>
          path.kind === 'fill' && path.points.length === 3 && path.points[0][1] === TAPE.y - 1.5,
      )
    const running = runDisplay(display, params, 1, {}, reading(8, 0.3))
    expect(heads(running)[0].colour).toBe(ink)
    // The device's clock, its reader and its recording all stand.
    const frozen = runDisplay(display, params, 2, { values: { freeze: 1 } }, () => ({
      meters: { level: 0.5, behind: 2, speed: 0, clock: 5 },
    }))
    expect(heads(frozen)[0].colour).toBe(plate)
    expect(aheadOf(frozen)).toBeUndefined()
    expect(readerOf(frozen)?.points[0][0]).toBeCloseTo(HEAD - 2 * perSec(8), 6)
    expect(readerOf(frozen)?.colour).toBe(accent)
  })

  it('shows nothing in the accent while the device sleeps or Mix is at nothing', () => {
    const asleep = runDisplay(display, params, 1, {}, () => ({
      meters: { level: 0, behind: 0, speed: 1, clock: -1 },
    }))
    expect(usesAccent(asleep)).toBe(false)
    // At rest the reader waits where it will first read: half a window behind the write head.
    const ghost = readerOf(asleep)
    expect(ghost?.colour).toBe(ink)
    expect(ghost?.alpha).toBe(INK.back)
    expect(ghost?.points[0][0]).toBeCloseTo(HEAD - (8192 / 48000 / 2) * perSec(8), 6)
    expect(heldAt(asleep, 60).tall).toBe(0.5)
    const dry = runDisplay(display, params, 1, { values: { mix: 0 } }, reading(8, 0.3))
    expect(usesAccent(dry)).toBe(false)
    const off = drawDisplay(display, params, { powered: false })
    expect(usesAccent(off)).toBe(false)
  })

  it('draws the window at its length, with its seconds written', () => {
    STRETCH_FRAMES.forEach((frame, choice) => {
      const drawn = drawDisplay(display, params, { values: { window: choice } })
      const hump = paths(drawn).find(
        (path) => path.kind === 'stroke' && path.width === 1.5 && path.points.length > 4,
      )
      const end = PANE.x + (PANE.w * frame) / 16384
      expect(hump?.points[0]).toEqual([PANE.x, PANE.y + PANE.h])
      expect(hump?.points[hump.points.length - 1][0]).toBeCloseTo(end, 6)
      // The top of the hump is the window's middle, at the top of the pane.
      const top = Math.min(...(hump?.points.map((point) => point[1]) ?? []))
      expect(top).toBeCloseTo(PANE.y, 6)
      expect(drawn.words()).toContain(timeText(frame / 48000))
    })
    expect(drawDisplay(display, params, { values: { stretch: 20 } }).words()).toContain('20×')
    expect(drawDisplay(display, params, { values: { memory: 3 } }).words()).toContain(timeText(3))
  })
})

describe('the handles of the Stretch display', () => {
  const handlesAt = (values: Record<string, number>, size = {}) =>
    display.handles?.(viewOf(display, params, { values, ...size })) ?? []
  const handleOf = (key: string, values: Record<string, number>, size = {}) => {
    const found = handlesAt(values, size).find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }

  it('sets Memory from the left end of its span, on the taper of the knob', () => {
    for (const memory of [1, 2.5, 8, 20]) {
      const handle = handleOf('memory', { memory })
      // It stands under the dashed line where the reader runs up to the present.
      expect(handle.x).toBeCloseTo(HEAD - memory * perSec(memory), 6)
      // Taken and not moved, it sets what is there.
      expect(handle.drag(handle.x, handle.y).memory).toBeCloseTo(memory, 6)
    }
    const handle = handleOf('memory', {})
    expect(handle.drag(-500, 0).memory).toBeCloseTo(20, 6)
    expect(handle.drag(900, 0).memory).toBeCloseTo(1, 6)
    const half = HEAD - REACH * (0.3 + 0.7 * 0.5)
    expect(handle.drag(half, 0).memory).toBeCloseTo(denormalizeParam(params.memory, 0.5), 6)
    expect(handle.reset?.()).toEqual({ memory: params.memory.default })
  })

  it('sets Window from the foot of the hump: the window that ends nearest the hand', () => {
    STRETCH_FRAMES.forEach((frame, choice) => {
      const handle = handleOf('window', { window: choice })
      expect(handle.x).toBeCloseTo(PANE.x + (PANE.w * frame) / 16384, 6)
      expect(handle.y).toBe(PANE.y + PANE.h)
      expect(handle.drag(handle.x, handle.y)).toEqual({ window: choice })
      expect(handle.drag(handle.x + 1, 0)).toEqual({ window: choice })
    })
    const handle = handleOf('window', {})
    expect(handle.drag(-500, 0)).toEqual({ window: 0 })
    expect(handle.drag(900, 0)).toEqual({ window: 3 })
    expect(handle.reset?.()).toEqual({ window: params.window.default })
  })

  it('has both shapes: the window beside the recording on a low strip, under it on an upright plate', () => {
    const low = stretchLanes({ width: 184, height: 48 })
    expect(low.head).toBe(HEAD)
    expect(low.reach).toBe(REACH)
    expect(low.pane).toEqual(PANE)
    expect(low.pane.x).toBeGreaterThan(low.tape.x + low.tape.w)
    const tall = stretchLanes({ width: 104, height: 150 })
    expect(tall.pane.y).toBeGreaterThan(tall.tape.y + tall.tape.h)
    expect(tall.pane.w).toBe(104 - 10)
    for (const size of [
      { width: 184, height: 48 },
      { width: 104, height: 150 },
      { width: 60, height: 30 },
    ])
      for (const handle of handlesAt({ memory: 20, window: 3 }, size)) {
        expect(handle.x).toBeGreaterThanOrEqual(0)
        expect(handle.x).toBeLessThanOrEqual(size.width)
        expect(handle.y).toBeGreaterThanOrEqual(0)
        expect(handle.y).toBeLessThanOrEqual(size.height)
      }
  })
})
