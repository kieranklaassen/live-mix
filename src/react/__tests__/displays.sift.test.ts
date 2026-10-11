// Sift's display against the device it shows (`cpp/devices/sift/sift.h`): the
// gain a level gives its part is the device's own, each lane stands where the
// device's reading for its part says, the attacks come in right of now by
// Late, each point sets the level (and the Late) it stands for, and nothing
// is drawn as heard that Mix does not let through.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SIFT_FACES,
  SIFT_FOOT_DB,
  SIFT_PARTS,
  SIFT_PAST_SEC,
  SIFT_STICK_PX,
  SIFT_TOP_DB,
  siftAlong,
  siftHeight,
  siftLayout,
  siftLevelGain,
  siftLevelY,
} from '../components/displays/sift'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import {
  drawDisplay,
  patchUnder,
  runDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('sift')
if (!descriptor) throw new Error('sift is not a stock device')
const params = descriptor.params
const display = SIFT_FACES.sift.display
const ACCENT = PLAIN_COLOURS.accent
const INK = PLAIN_COLOURS.ink

/** The two shapes a plate hands the display: flat beside two columns of knobs, and upright. */
const SHAPES: readonly (readonly [number, number])[] = [
  [128, 100],
  [204, 100],
]

/** `device.json`: a level runs from -30 dB, where its part is silent, to +6 dB. */
const LEVEL_BOTTOM_DB = -30
const LEVEL_TOP_DB = 6
/** `device.json`: Late runs to 300 ms. */
const LATE_MAX_MS = 300

/**
 * `sift.h`, `level_gain()`:
 *   floor = db_to_gain(kParamMin[kTones]); return max(0, (db_to_gain(db) - floor) / (1 - floor))
 */
function deviceLevelGain(db: number): number {
  const floor = 10 ** (LEVEL_BOTTOM_DB / 20)
  return Math.max(0, (10 ** (db / 20) - floor) / (1 - floor))
}

function view(values: Record<string, number> = {}, size?: readonly [number, number]) {
  return viewOf(display, params, { values, width: size?.[0], height: size?.[1] })
}

function handleOf(
  key: string,
  values: Record<string, number> = {},
  size?: readonly [number, number],
): DisplayHandle {
  const found = display.handles?.(view(values, size)).find((h) => h.key === key)
  if (!found) throw new Error(`sift has no handle ${key}`)
  return found
}

interface Mark {
  kind: 'fill' | 'stroke'
  colour: string
  alpha: number
  width: number
  points: [number, number][]
}

/** Every path a drawing filled or stroked, with its colour and its points. */
function marksOf(drawn: RecordingContext): Mark[] {
  const marks: Mark[] = []
  let fill = ''
  let stroke = ''
  let alpha = 1
  let width = 1
  let points: [number, number][] = []
  for (const call of drawn.calls) {
    const [a, b] = call.args as number[]
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set strokeStyle') stroke = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'set lineWidth') width = Number(call.args[0])
    else if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo') points.push([a, b])
    else if (call.name === 'fill') marks.push({ kind: 'fill', colour: fill, alpha, width, points })
    else if (call.name === 'stroke')
      marks.push({ kind: 'stroke', colour: stroke, alpha, width, points })
  }
  return marks
}

/** The display run for a second and a half with the same readings throughout. */
function running(
  meters: Record<string, number>,
  values: Record<string, number> = {},
  options: FrameOptions = {},
): RecordingContext {
  return runDisplay(display, params, 1.5, { values, meters, ...options })
}

/** The line a lane's history draws: the one stroked or filled whose points all lie in the lane and that ends at `endX`. */
function laneLines(
  drawn: RecordingContext,
  lane: number,
  endX: number,
  values = {},
  size?: readonly [number, number],
) {
  const { lanes } = siftLayout(view(values, size))
  const box = lanes[lane]
  return marksOf(drawn).filter(
    (mark) =>
      mark.points.length > 10 &&
      mark.points.every(([, y]) => y >= box.y - 0.01 && y <= box.y + box.h + 0.01) &&
      mark.points.some(([x]) => Math.abs(x - endX) < 0.01),
  )
}

/** The highest a set of marks reaches at the place `x`: the smallest y there. */
function topAt(marks: Mark[], x: number): number {
  let top = Number.POSITIVE_INFINITY
  for (const mark of marks)
    for (const [px, py] of mark.points) if (Math.abs(px - x) < 0.01) top = Math.min(top, py)
  return top
}

describe('the gain a level gives its part', () => {
  it('is the device level_gain(): nothing at the bottom, 1 at 0 dB, decibels between', () => {
    expect(params.tones.min).toBe(LEVEL_BOTTOM_DB)
    expect(params.tones.max).toBe(LEVEL_TOP_DB)
    for (const db of [-30, -29, -24, -12, -6, -1, 0, 3, 6])
      expect(siftLevelGain(db, LEVEL_BOTTOM_DB)).toBeCloseTo(deviceLevelGain(db), 12)
    expect(siftLevelGain(-30, LEVEL_BOTTOM_DB)).toBe(0)
    expect(siftLevelGain(0, LEVEL_BOTTOM_DB)).toBe(1)
    expect(siftLevelGain(-12, LEVEL_BOTTOM_DB)).toBeCloseTo(0.2267, 4)
    expect(siftLevelGain(6, LEVEL_BOTTOM_DB)).toBeCloseTo(2.0278, 4)
  })

  it('stands on a lane scale of decibels from the foot to the top', () => {
    expect(siftHeight(1)).toBe(1)
    expect(siftHeight(10 ** (SIFT_FOOT_DB / 20))).toBeCloseTo(0, 9)
    expect(siftHeight(10 ** (-30 / 20))).toBeCloseTo(
      (-30 - SIFT_FOOT_DB) / (SIFT_TOP_DB - SIFT_FOOT_DB),
      9,
    )
    expect(siftHeight(0)).toBe(0)
    expect(siftHeight(4)).toBe(1)
  })
})

describe('the lanes', () => {
  it.each(SHAPES)(
    'lie in the display at %i by %i, with room to set a level and a Late by hand',
    (width, height) => {
      const size = [width, height] as const
      const layout = siftLayout(view({}, size))
      const { box, lanes, pace, nowX } = layout
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.w).toBeLessThanOrEqual(width)
      expect(lanes[0].y).toBeCloseTo(box.y, 9)
      expect(lanes[2].y + lanes[2].h).toBeCloseTo(box.y + box.h, 9)
      for (const lane of lanes) expect(lane.h).toBeCloseTo(lanes[0].h, 9)
      expect(lanes[1].y).toBeGreaterThan(lanes[0].y + lanes[0].h)
      // The past and the longest Late share the width at one pace.
      expect(pace).toBeCloseTo(box.w / (SIFT_PAST_SEC + LATE_MAX_MS / 1000), 9)
      expect(nowX).toBeCloseTo(box.x + SIFT_PAST_SEC * pace, 9)
      expect(nowX + (LATE_MAX_MS / 1000) * pace).toBeCloseTo(box.x + box.w, 9)
      // A handle has 20 px of travel or more, each way it moves.
      expect((LATE_MAX_MS / 1000) * pace).toBeGreaterThanOrEqual(20)
      for (const lane of lanes)
        expect(siftLevelY(lane, 0) - siftLevelY(lane, 1)).toBeGreaterThanOrEqual(20)
      // Two lanes' points never touch, whatever the two levels.
      expect(siftLevelY(lanes[1], 1) - siftLevelY(lanes[0], 0)).toBeGreaterThanOrEqual(9)
    },
  )
})

describe('what the lanes draw while the device runs', () => {
  const meters = { tones: 0.25, attacks: 0.03, air: 0.01 }
  const values = { tones: -12, attacks: -6, air: 3, mix: 0.8, late: 0 }

  it.each(SHAPES)(
    'each lane stands where its reading says at %i by %i: the outline as found, the fill as heard',
    (width, height) => {
      const size = [width, height] as const
      const drawn = running(meters, values, { width, height })
      const { lanes, nowX } = siftLayout(view(values, size))
      SIFT_PARTS.forEach((part, n) => {
        const lane = lanes[n]
        const foot = lane.y + lane.h
        const lines = laneLines(drawn, n, nowX, values, size)
        const fills = lines.filter((mark) => mark.kind === 'fill')
        const outlines = lines.filter((mark) => mark.kind === 'stroke')
        expect(fills.length, `${part} has a fill`).toBeGreaterThan(0)
        expect(outlines.length, `${part} has an outline`).toBe(1)
        // sift.h: the reading is taken before the level; what is heard is the reading times level_gain() times Mix.
        const heard = meters[part] * deviceLevelGain(values[part]) * values.mix
        expect(topAt(fills, nowX), `${part} as heard`).toBeCloseTo(
          foot - siftHeight(heard) * lane.h,
          6,
        )
        expect(topAt(outlines, nowX), `${part} as found`).toBeCloseTo(
          foot - siftHeight(meters[part]) * lane.h,
          6,
        )
        // The whole past holds the same reading here, so the line is level.
        for (const [, y] of outlines[0].points)
          expect(y).toBeCloseTo(foot - siftHeight(meters[part]) * lane.h, 6)
        for (const mark of fills) expect(mark.colour).toBe(part === 'attacks' ? ACCENT : INK)
        expect(outlines[0].colour).toBe(INK)
      })
    },
  )

  it('follows a reading that changes: the newest stands at the line of now, the older to its left', () => {
    // Silence, then a tone for the last 0.4 s.
    const drawn = runDisplay(
      display,
      params,
      1.5,
      { values, meters: { tones: 0, attacks: 0, air: 0 } },
      (time) => (time > 1.1 ? { meters: { tones: 0.5, attacks: 0, air: 0 } } : {}),
    )
    const { lanes, nowX, pace } = siftLayout(view(values))
    const foot = lanes[0].y + lanes[0].h
    const [outline] = laneLines(drawn, 0, nowX, values).filter((mark) => mark.kind === 'stroke')
    const up = foot - siftHeight(0.5) * lanes[0].h
    for (const [x, y] of outline.points) {
      const ago = (nowX - x) / pace
      if (ago < 0.3) expect(y, `${ago.toFixed(2)} s ago`).toBeCloseTo(up, 6)
      if (ago > 0.5) expect(y, `${ago.toFixed(2)} s ago`).toBeCloseTo(foot, 6)
    }
  })

  it('brings the attacks in right of now by Late, and marks those still on their way', () => {
    for (const late of [0, 45, 150, 300]) {
      const set = { ...values, late }
      const drawn = running(meters, set)
      const { lanes, nowX, entryX, pace } = siftLayout(view(set))
      expect(entryX).toBeCloseTo(nowX + (late / 1000) * pace, 9)
      const lines = laneLines(drawn, 1, entryX, set)
      const fills = lines.filter((mark) => mark.kind === 'fill')
      // The newest reading comes in at the entry and the oldest kept lies the whole past to its left.
      const xs = fills[0].points.map(([x]) => x)
      expect(Math.max(...xs)).toBeCloseTo(entryX, 6)
      expect(Math.min(...xs)).toBeCloseTo(entryX - SIFT_PAST_SEC * pace, 6)
      // Drawn twice: strong where they have sounded, faint where they have yet to.
      expect(fills.map((mark) => mark.alpha)).toEqual([0.9, 0.35])
      const clips = drawn.calls
        .filter((call) => call.name === 'rect')
        .map((call) => call.args as number[])
      const lane = lanes[1]
      expect(
        clips.some(([x, y, w]) => x === lane.x && y === lane.y && Math.abs(x + w - nowX) < 1e-9),
      ).toBe(true)
      expect(
        clips.some(
          ([x, y, w]) =>
            Math.abs(x - nowX) < 1e-9 && y === lane.y && Math.abs(x + w - (lane.x + lane.w)) < 1e-9,
        ),
      ).toBe(true)
      // The tones and the air still come in at now.
      expect(laneLines(drawn, 0, nowX, set).length).toBeGreaterThan(0)
      expect(laneLines(drawn, 2, nowX, set).length).toBeGreaterThan(0)
    }
  })

  it('draws nothing as heard that Mix does not let through, and still reads the device', () => {
    const set = { ...values, mix: 0 }
    const drawn = running(meters, set)
    const { lanes, nowX } = siftLayout(view(set))
    SIFT_PARTS.forEach((part, n) => {
      const lane = lanes[n]
      const foot = lane.y + lane.h
      const lines = laneLines(drawn, n, nowX, set)
      expect(
        topAt(
          lines.filter((mark) => mark.kind === 'fill'),
          nowX,
        ),
        `${part} heard`,
      ).toBeCloseTo(foot, 6)
      expect(
        topAt(
          lines.filter((mark) => mark.kind === 'stroke'),
          nowX,
        ),
        `${part} found`,
      ).toBeCloseTo(foot - siftHeight(meters[part]) * lane.h, 6)
    })
    // The bars that show what each level lets through are gone with it.
    expect(marksOf(drawn).filter((mark) => mark.kind === 'stroke' && mark.width === 2)).toEqual([])
  })

  it('shows what each level and Mix let through as a bar on the travel of the lane point', () => {
    for (const mix of [1, 0.5]) {
      const set = { tones: 0, attacks: -12, air: 6, late: 120, mix }
      const drawn = drawDisplay(display, params, { values: set })
      const at = view(set)
      const { lanes, nowX, entryX } = siftLayout(at)
      const bars = marksOf(drawn).filter((mark) => mark.kind === 'stroke' && mark.width === 2)
      expect(bars.length).toBe(3)
      SIFT_PARTS.forEach((part, n) => {
        const bar = bars[n]
        const through = deviceLevelGain(set[part]) * mix
        expect(bar.points[0][0]).toBeCloseTo(part === 'attacks' ? entryX : nowX, 9)
        expect(bar.points[0][1]).toBeCloseTo(siftLevelY(lanes[n], 0), 9)
        expect(bar.points[1][1]).toBeCloseTo(siftLevelY(lanes[n], siftAlong(through, at, part)), 9)
        // On the same scale as the point: decibels along the level's own range.
        expect(siftAlong(through, at, part)).toBeCloseTo(
          Math.min(
            1,
            Math.max(
              0,
              (20 * Math.log10(through) - LEVEL_BOTTOM_DB) / (LEVEL_TOP_DB - LEVEL_BOTTOM_DB),
            ),
          ),
          9,
        )
      })
      // At unity and Mix 1 the bar ends on the point itself.
      if (mix === 1) expect(bars[0].points[1][1]).toBeCloseTo(handleOf('tones', set).y, 9)
    }
  })

  it('stands still while the device is switched off, and without the readings', () => {
    const { lanes, nowX } = siftLayout(view(values))
    const flat = (drawn: RecordingContext): void => {
      lanes.forEach((lane, n) => {
        for (const mark of laneLines(drawn, n, nowX, values))
          expect(topAt([mark], nowX)).toBeCloseTo(lane.y + lane.h, 6)
      })
    }
    flat(running(meters, values, { powered: false }))
    flat(running({}, values))
  })

  it('sets each lane name on a patch of the plate', () => {
    const drawn = running(meters, values)
    for (const part of SIFT_PARTS)
      expect(patchUnder(drawn, part, PLAIN_COLOURS.plate), part).not.toBeNull()
  })
})

describe('the points', () => {
  it.each(SHAPES)(
    'stand where the levels and Late are, and set them from where the hand is, at %i by %i',
    (width, height) => {
      const size = [width, height] as const
      for (const part of ['tones', 'air'] as const) {
        const lane = siftLayout(view({}, size)).lanes[part === 'tones' ? 0 : 2]
        for (const db of [-30, -21, -12, 0, 3, 6]) {
          const point = handleOf(part, { [part]: db }, size)
          const along = (db - LEVEL_BOTTOM_DB) / (LEVEL_TOP_DB - LEVEL_BOTTOM_DB)
          expect(point.x).toBeCloseTo(siftLayout(view({}, size)).nowX, 9)
          expect(point.y).toBeCloseTo(siftLevelY(lane, along), 9)
          // Drag there, value there, wherever the hand is across.
          expect(handleOf(part, {}, size).drag(3, point.y)[part]).toBeCloseTo(db, 9)
        }
        expect(handleOf(part, {}, size).drag(0, -50)[part]).toBe(LEVEL_TOP_DB)
        expect(handleOf(part, {}, size).drag(0, 500)[part]).toBe(LEVEL_BOTTOM_DB)
        expect(handleOf(part, { [part]: -20 }, size).reset?.()).toEqual({
          [part]: params[part].default,
        })
      }
      const { lanes, nowX, pace } = siftLayout(view({}, size))
      for (const late of [0, 45, 150, 300]) {
        for (const db of [-30, -12, 6]) {
          const point = handleOf('attacks', { attacks: db, late }, size)
          expect(point.x).toBeCloseTo(nowX + (late / 1000) * pace, 9)
          expect(point.y).toBeCloseTo(
            siftLevelY(lanes[1], (db - LEVEL_BOTTOM_DB) / (LEVEL_TOP_DB - LEVEL_BOTTOM_DB)),
            9,
          )
          const set = handleOf('attacks', {}, size).drag(point.x, point.y)
          expect(set.attacks).toBeCloseTo(db, 9)
          expect(set.late).toBeCloseTo(late, 9)
        }
      }
      // Past the picture's ends Late stays in its range.
      expect(handleOf('attacks', {}, size).drag(-40, 50).late).toBe(0)
      expect(handleOf('attacks', {}, size).drag(width + 40, 50).late).toBe(LATE_MAX_MS)
      expect(handleOf('attacks', { attacks: 2, late: 80 }, size).reset?.()).toEqual({
        attacks: params.attacks.default,
        late: params.late.default,
      })
    },
  )

  it('keep Late where it was while a hand that sets the attacks level slips sideways', () => {
    for (const late of [0, 120]) {
      const start = { attacks: -12, late }
      const hold: DisplayHold = {}
      const press = handleOf('attacks', start)
      const { pace, nowX } = siftLayout(view(start))
      expect(press.drag(press.x, press.y, hold)).toEqual({ attacks: expect.closeTo(-12, 9), late })
      // The plate asks for the handles again at every move.
      const slipped = handleOf('attacks', start).drag(
        press.x + SIFT_STICK_PX - 1,
        press.y - 8,
        hold,
      )
      expect(slipped.late).toBe(late)
      expect(slipped.attacks).toBeGreaterThan(-12)
      // Moved further, Late is the one whose place is under the hand, and stays so on the way back.
      const moved = handleOf('attacks', start).drag(press.x + 12, press.y - 8, hold)
      expect(moved.late).toBeCloseTo(((press.x + 12 - nowX) / pace) * 1000, 9)
      const back = handleOf('attacks', { attacks: slipped.attacks, late: moved.late }).drag(
        press.x + 1,
        press.y - 8,
        hold,
      )
      expect(back.late).toBeCloseTo(((press.x + 1 - nowX) / pace) * 1000, 9)
    }
  })
})
