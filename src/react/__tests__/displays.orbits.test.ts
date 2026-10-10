// The truth of the Orbits display: each loop's period is the device's own
// sum, a head stands where the device reports it and is carried on at that
// period, what a ring holds lies where the head was when it was written, as
// loud as Mix lets it out, and a drag to a place sets the value drawn there.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { INK, PLAIN_COLOURS, lerp } from '../components/display-kit'
import {
  ORBITS_BAND,
  ORBITS_BINS,
  ORBITS_FACES,
  ORBITS_FULL,
  ORBITS_MOST,
  ORBITS_NOTCH,
  ORBITS_RANGE_DB,
  bandShare,
  laneLength,
  orbitsCount,
  orbitsLay,
  orbitsLongest,
  orbitsOffsetText,
  orbitsPeriod,
  orbitsPeriodText,
  orbitsTimeText,
  orbitsWet,
  ringGapMost,
  ringPoint,
  ringRadius,
} from '../components/displays/orbits'
import {
  drawDisplay,
  metersOf,
  runDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('orbits')
const params = descriptor?.params ?? {}
const display = ORBITS_FACES.orbits.display
const { ink, accent, plate } = PLAIN_COLOURS

/** The window as it stands today, 128 by 100: the rings in the middle. */
const CX = 64
const CY = 50
const REACH = 43
/** The picture's own measures: the first ring from 0.22 to 0.5 of the reach, the outermost at most 0.98 of it. */
const FIRST = [0.22, 0.5] as const
const OUTERMOST = 0.98
const GAP_WIDEST = 0.26
const GAP_LEAST = 0.4

/** Every reading the device has, with these given: a loop's place 0..1, or -1 at rest. */
const readings = (given: Record<string, number> = {}): Record<string, number> => ({
  ...metersOf(descriptor?.meters, 0),
  ...given,
})
const atRest = readings({ phase1: -1, phase2: -1, phase3: -1, phase4: -1, phase5: -1 })

interface Round {
  kind: 'stroke' | 'fill'
  colour: string
  alpha: number
  width: number
  x: number
  y: number
  r: number
}

interface Shape {
  kind: 'stroke' | 'fill'
  colour: string
  alpha: number
  points: [number, number][]
}

/** Every circle and every outline that was stroked or filled, with the colour it was painted in. */
function marks(drawn: RecordingContext): { rounds: Round[]; shapes: Shape[] } {
  const rounds: Round[] = []
  const shapes: Shape[] = []
  let points: [number, number][] = []
  let circle: [number, number, number] | null = null
  const now = { fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1 }
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') {
      points = []
      circle = null
    } else if (call.name === 'moveTo' || call.name === 'lineTo')
      points.push([call.args[0] as number, call.args[1] as number])
    else if (call.name === 'arc')
      circle = [call.args[0] as number, call.args[1] as number, call.args[2] as number]
    else if (call.name === 'set fillStyle') now.fillStyle = String(call.args[0])
    else if (call.name === 'set strokeStyle') now.strokeStyle = String(call.args[0])
    else if (call.name === 'set globalAlpha') now.globalAlpha = call.args[0] as number
    else if (call.name === 'set lineWidth') now.lineWidth = call.args[0] as number
    else if (call.name === 'stroke' || call.name === 'fill') {
      const colour = call.name === 'fill' ? now.fillStyle : now.strokeStyle
      const base = { kind: call.name, colour, alpha: now.globalAlpha } as const
      if (circle) {
        rounds.push({ ...base, width: now.lineWidth, x: circle[0], y: circle[1], r: circle[2] })
      } else shapes.push({ ...base, points: [...points] })
    }
  }
  return { rounds, shapes }
}

/** The rings: the circles about the middle stroked as tracks, innermost first. */
const ringsOf = (drawn: RecordingContext, cx = CX, cy = CY): number[] =>
  marks(drawn)
    .rounds.filter(
      (round) =>
        round.kind === 'stroke' &&
        round.colour === ink &&
        round.alpha === INK.rule &&
        round.x === cx &&
        round.y === cy,
    )
    .map((round) => round.r)

/** The heads that are heard: the dots in the accent, in the order of their loops. */
const headsOf = (drawn: RecordingContext): Round[] =>
  marks(drawn).rounds.filter((round) => round.kind === 'fill' && round.colour === accent)

/** The heads that are not: the small open rings in the ink that are not the middle. */
const ghostsOf = (drawn: RecordingContext, cx = CX, cy = CY): Round[] =>
  marks(drawn).rounds.filter(
    (round) =>
      round.kind === 'stroke' &&
      round.colour === ink &&
      round.r === 2 &&
      !(round.x === cx && round.y === cy),
  )

/** What the rings hold: each band's outline, innermost first. */
const bandsOf = (drawn: RecordingContext): Shape[] =>
  marks(drawn).shapes.filter(
    (shape) => shape.kind === 'fill' && shape.colour === ink && shape.alpha === ORBITS_BAND,
  )

/** How far out a ring's band reaches at stretch `bin` of its turn. */
const reachAt = (band: Shape, bin: number, cx = CX, cy = CY): number =>
  Math.hypot(band.points[bin][0] - cx, band.points[bin][1] - cy)

const draw = (options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, params, { meters: atRest, ...options })

describe('what the Orbits display takes from the device', () => {
  it('copies the numbers of cpp/devices/orbits/orbits.h', () => {
    const header = readFileSync(resolve(process.cwd(), 'cpp/devices/orbits/orbits.h'), 'utf8')
    expect(header).toContain(`kMaxLoops = ${ORBITS_MOST};`)
    expect(header).toContain('kRingFrames = 1440000;')
    expect(header).toContain('kDriftSeconds = 0.012f;')
    expect(header).toContain(`kCeiling = ${ORBITS_FULL}f;`)
    // The readings come in the order `meter` gives them: five places, then five levels.
    expect(Object.keys(descriptor?.meters ?? {})).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `phase${n}`),
      ...[1, 2, 3, 4, 5].map((n) => `level${n}`),
    ])
  })

  it("works out a loop's period as `Orbits::period` does", () => {
    // What the device's own function gives (printed from the header), by
    // loops, Length in seconds, Offset in percent and sample rate.
    const cases: [number, number, number, number, number[]][] = [
      [3, 2, 1.5, 48000, [96000, 97440, 98902]],
      [5, 0.7, 17, 48000, [33600, 39312, 45995, 53814, 62963]],
      [2, 12, 30, 48000, [576000, 748800]],
      [4, 0.25, 0.1, 44100, [11025, 11036, 11047, 11058]],
      // Where five loops would not fit their rings the ratio comes down, and the last fills its ring.
      [5, 12, 30, 48000, [576000, 724208, 910551, 1144841, 1439415]],
      [5, 12, 30, 96000, [1152000, 1217846, 1287456, 1361044, 1438839]],
    ]
    for (const [loops, length, offset, rate, periods] of cases) {
      expect(
        periods.map((_, k) => orbitsPeriod(k, loops, length, offset, rate)),
        `${loops} loops of ${length} s, ${offset} % apart at ${rate}`,
      ).toEqual(periods)
    }
    expect(orbitsLongest(48000)).toBe(1439415)
    expect(orbitsLongest(96000)).toBe(1438839)
  })

  it('rounds Loops as the device does', () => {
    const count = (loops: number): number =>
      orbitsCount(viewOf(display, params, { values: { loops } }))
    expect([2, 2.4, 2.5, 3.49, 3.5, 5].map(count)).toEqual([2, 2, 3, 3, 4, 5])
  })

  it('lets out of the loops what Mix does: the sine of a quarter turn', () => {
    expect(orbitsWet(0)).toBe(0)
    expect(orbitsWet(1)).toBe(1)
    expect(orbitsWet(0.5)).toBeCloseTo(Math.SQRT1_2, 12)
    expect(orbitsWet(0.4)).toBeCloseTo(Math.sin(0.2 * Math.PI), 12)
  })

  it('draws a level by its decibels under the level the device holds a loop to', () => {
    expect(bandShare(ORBITS_FULL)).toBe(1)
    expect(bandShare(1)).toBe(1)
    expect(bandShare(0)).toBe(0)
    expect(bandShare(ORBITS_FULL * Math.pow(10, -ORBITS_RANGE_DB / 20))).toBeCloseTo(0, 6)
    expect(bandShare(ORBITS_FULL * Math.pow(10, -ORBITS_RANGE_DB / 40))).toBeCloseTo(0.5, 6)
    expect(bandShare(0.2)).toBeGreaterThan(bandShare(0.1))
  })
})

describe('the rings of Orbits', () => {
  it('draws a ring for each loop that turns', () => {
    for (const loops of [2, 3, 4, 5]) {
      expect(ringsOf(draw({ values: { loops } })), `${loops} loops`).toHaveLength(loops)
    }
    expect(ringsOf(draw({ values: { loops: 3.5 } }))).toHaveLength(4)
  })

  it("sizes the first ring by Length and spaces the rings by Offset, each on its knob's taper", () => {
    for (const loops of [2, 3, 5]) {
      for (const length of [0.25, 2, 12]) {
        for (const offset of [0.1, 1.5, 30]) {
          const values = { loops, length, offset }
          const view = viewOf(display, params, { values })
          const widest = REACH * Math.min(GAP_WIDEST, (OUTERMOST - FIRST[1]) / (loops - 1))
          expect(ringGapMost(REACH, loops)).toBeCloseTo(widest, 9)
          const rings = ringsOf(draw({ values }))
          rings.forEach((radius, k) => {
            const wanted =
              REACH * lerp(FIRST[0], FIRST[1], view.at('length')) +
              k * widest * lerp(GAP_LEAST, 1, view.at('offset'))
            expect(radius, `ring ${k} of ${loops}`).toBeCloseTo(wanted, 9)
            expect(ringRadius(view, REACH, loops, k)).toBeCloseTo(wanted, 9)
            // A ring and the point on it stay in the picture.
            expect(radius + 3).toBeLessThanOrEqual(CY)
          })
        }
      }
    }
    // The ends: the shortest loop, the longest, and five rings as far apart as they go.
    expect(ringsOf(draw({ values: { length: 0.25 } }))[0]).toBeCloseTo(FIRST[0] * REACH, 9)
    expect(ringsOf(draw({ values: { length: 12 } }))[0]).toBeCloseTo(FIRST[1] * REACH, 9)
    const most = ringsOf(draw({ values: { loops: 5, length: 12, offset: 30 } }))
    expect(most[4]).toBeCloseTo(OUTERMOST * REACH, 9)
  })

  it('stands each head on its ring where the device reports it, from the top and clockwise', () => {
    const meters = readings({ phase1: 0.25, phase2: 0.5, phase3: 0.75 })
    const drawn = draw({ meters })
    const rings = ringsOf(drawn)
    const heads = headsOf(drawn)
    expect(heads).toHaveLength(3)
    // A quarter of the turn is to the right, half is at the foot, three quarters to the left.
    expect(heads[0].x).toBeCloseTo(CX + rings[0], 9)
    expect(heads[0].y).toBeCloseTo(CY, 9)
    expect(heads[1].x).toBeCloseTo(CX, 9)
    expect(heads[1].y).toBeCloseTo(CY + rings[1], 9)
    expect(heads[2].x).toBeCloseTo(CX - rings[2], 9)
    expect(heads[2].y).toBeCloseTo(CY, 9)
    // The start is at the top.
    const start = headsOf(draw({ meters: readings() }))
    expect(start[0].x).toBeCloseTo(CX, 9)
    expect(start[0].y).toBeCloseTo(CY - rings[0], 9)
    expect(ringPoint(CX, CY, 10, 0.25)[0]).toBeCloseTo(CX + 10, 9)
    // A loop that does not turn has no head, whatever its reading says.
    expect(headsOf(draw({ values: { loops: 2 }, meters }))).toHaveLength(2)
  })

  it("carries a head on between two readings at its own loop's period", () => {
    const meters = readings({ phase1: 0.25, phase2: 0.25, phase3: 0.25 })
    // Two frames a thirtieth of a second apart with the same reading.
    const drawn = runDisplay(display, params, 2 / 30, { meters })
    const rings = ringsOf(drawn)
    const heads = headsOf(drawn)
    rings.forEach((radius, k) => {
      const seconds = orbitsPeriod(k, 3, 2, 1.5, 48000) / 48000
      const [x, y] = ringPoint(CX, CY, radius, 0.25 + 1 / 30 / seconds)
      expect(heads[k].x, `loop ${k}`).toBeCloseTo(x, 9)
      expect(heads[k].y, `loop ${k}`).toBeCloseTo(y, 9)
    })
    // The second loop is 1.5 % slower than the first: it has gone less far.
    expect(heads[1].y - CY).toBeLessThan((heads[0].y - CY) * (rings[1] / rings[0]))
  })

  it('shows a loop at rest as an open head at the start, and nothing held', () => {
    const drawn = draw({ meters: atRest })
    expect(headsOf(drawn)).toHaveLength(0)
    const rings = ringsOf(drawn)
    const ghosts = ghostsOf(drawn)
    expect(ghosts).toHaveLength(3)
    ghosts.forEach((ghost, k) => {
      expect(ghost.x).toBeCloseTo(CX, 9)
      expect(ghost.y).toBeCloseTo(CY - rings[k], 9)
    })
    expect(bandsOf(drawn)).toHaveLength(0)
    // So does a device that is switched off, and one that has no readings.
    expect(headsOf(draw({ meters: readings({ phase1: 0.3 }), powered: false }))).toHaveLength(0)
    expect(headsOf(draw({ meters: {} }))).toHaveLength(0)
  })

  it('fills the middle while the loops listen and opens it with Hold on', () => {
    const middle = (drawn: RecordingContext): Round[] =>
      marks(drawn).rounds.filter((round) => round.x === CX && round.y === CY && round.r === 2)
    expect(middle(draw()).map((round) => round.kind)).toEqual(['fill'])
    expect(middle(draw({ values: { hold: 1 } })).map((round) => round.kind)).toEqual(['stroke'])
  })
})

describe('what the rings of Orbits hold', () => {
  /** A second of the first loop of two (2 s round): it writes `level` for its first quarter, then nothing. */
  const quarter = (level: number, values: Record<string, number> = {}): RecordingContext =>
    runDisplay(display, params, 1, { values: { loops: 2, ...values } }, (time) => ({
      meters: readings({
        phase1: time / 2,
        level1: time < 0.5 ? level : 0,
        phase2: time / 2.03,
        level2: 0,
      }),
    }))

  it('lays what a loop wrote where its head was, as wide as its level under Mix', () => {
    const level = 0.3
    const drawn = quarter(level)
    const rings = ringsOf(drawn)
    const bands = bandsOf(drawn)
    // Only the first loop wrote anything.
    expect(bands).toHaveLength(1)
    const most = (rings[1] - rings[0]) / 2 - 0.5
    const wide = bandShare(level * orbitsWet(0.4)) * most
    expect(wide).toBeGreaterThan(1)
    // In the first quarter of the turn, where it was written: as wide as the level.
    for (const bin of [3, 9, 15]) expect(reachAt(bands[0], bin)).toBeCloseTo(rings[0] + wide, 5)
    // The second quarter was written with nothing, and the rest the head has not been over.
    for (const bin of [22, 30, 50, 68]) expect(reachAt(bands[0], bin)).toBeCloseTo(rings[0], 5)
    // The band lies as far inside the ring as outside it.
    const inner = bands[0].points[bands[0].points.length - 1 - 9]
    expect(Math.hypot(inner[0] - CX, inner[1] - CY)).toBeCloseTo(rings[0] - wide, 5)
    expect(bands[0].points).toHaveLength(2 * (ORBITS_BINS + 1))
  })

  it('is as loud as Mix lets it out, and gone with Mix at 0 while the heads still turn', () => {
    const full = quarter(0.3, { mix: 1 })
    const some = quarter(0.3, { mix: 0.4 })
    const rings = ringsOf(full)
    const most = (rings[1] - rings[0]) / 2 - 0.5
    expect(reachAt(bandsOf(full)[0], 9) - rings[0]).toBeCloseTo(bandShare(0.3) * most, 5)
    expect(reachAt(bandsOf(some)[0], 9)).toBeLessThan(reachAt(bandsOf(full)[0], 9))

    const none = quarter(0.3, { mix: 0 })
    expect(bandsOf(none)).toHaveLength(0)
    // Nothing of the loops is heard, so no head is lit; but each still stands where its loop is.
    expect(headsOf(none)).toHaveLength(0)
    const ghosts = ghostsOf(none)
    const lit = headsOf(full)
    expect(ghosts).toHaveLength(2)
    ghosts.forEach((ghost, k) => {
      expect(ghost.x).toBeCloseTo(lit[k].x, 9)
      expect(ghost.y).toBeCloseTo(lit[k].y, 9)
    })
    // The second head is not on top of the first: the loops have slid apart.
    expect(lit[0].y).toBeGreaterThan(CY)
  })

  it('forgets what a loop held when the device reports it at rest', () => {
    const state = display.init?.()
    const playing = (time: number): Partial<FrameOptions> => ({
      meters: readings({ phase1: time / 2, level1: 0.3, phase2: time / 2.03, level2: 0.3 }),
    })
    const values = { loops: 2 }
    expect(bandsOf(runDisplay(display, params, 1, { values, state }, playing))).toHaveLength(2)
    const rested = runDisplay(display, params, 0.1, { values, state, now: 11 }, () => ({
      meters: atRest,
    }))
    expect(bandsOf(rested)).toHaveLength(0)
    // And starts again from nothing.
    const again = runDisplay(display, params, 0.1, { values, state, now: 11.1 }, playing)
    const band = bandsOf(again)[0]
    expect(reachAt(band, 40)).toBeCloseTo(ringsOf(again)[0], 5)
  })
})

describe('the points of Orbits', () => {
  const handlesAt = (values: Record<string, number> = {}, size: Partial<FrameOptions> = {}) =>
    display.handles?.(viewOf(display, params, { values, ...size })) ?? []

  it('puts Length under the middle on the first ring and Offset on the outermost', () => {
    for (const loops of [2, 3, 5]) {
      const drawn = draw({ values: { loops } })
      const rings = ringsOf(drawn)
      const [length, offset] = handlesAt({ loops })
      expect([length.key, offset.key]).toEqual(['length', 'offset'])
      expect([length.x, length.y]).toEqual([CX, CY + rings[0]])
      expect(offset.x).toBeCloseTo(CX + rings[loops - 1], 9)
      expect(offset.y).toBe(CY)
      // Each is drawn where it stands.
      const points = marks(drawn).rounds.filter(
        (round) => round.kind === 'stroke' && round.r === 3 && round.width === 1.5,
      )
      expect(points.map((point) => [point.x, point.y])).toEqual([
        [length.x, length.y],
        [offset.x, offset.y],
      ])
    }
  })

  it('sets by a drag the value whose picture is under the hand', () => {
    for (const loops of [2, 3, 5]) {
      for (const wanted of [0.25, 0.7, 2, 6.5, 12]) {
        const there = handlesAt({ loops, length: wanted })[0]
        // From anywhere: the place alone says the Length.
        const set = handlesAt({ loops, length: 3.3 })[0].drag(there.x, there.y).length
        expect(set / wanted, `Length ${wanted} of ${loops} loops`).toBeCloseTo(1, 9)
      }
      for (const wanted of [0.1, 0.6, 1.5, 9, 30]) {
        const there = handlesAt({ loops, offset: wanted })[1]
        const set = handlesAt({ loops, offset: 4 })[1].drag(there.x, there.y).offset
        expect(set / wanted, `Offset ${wanted} of ${loops} loops`).toBeCloseTo(1, 9)
      }
    }
    // Past the picture a drag stops at the knob's own ends.
    const [length, offset] = handlesAt()
    expect(length.drag(CX, 500).length).toBeCloseTo(12, 9)
    expect(length.drag(CX, CY).length).toBeCloseTo(0.25, 9)
    expect(offset.drag(500, CY).offset).toBeCloseTo(30, 9)
    expect(offset.drag(0, CY).offset).toBeCloseTo(0.1, 9)
    // A notch of the wheel is a hundredth of the knob's turn, on its taper, and stops at its ends.
    expect(length.wheel?.(1).length).toBeCloseTo(2 * Math.pow(12 / 0.25, ORBITS_NOTCH), 9)
    expect(length.wheel?.(-3).length).toBeCloseTo(2 * Math.pow(12 / 0.25, -3 * ORBITS_NOTCH), 9)
    expect(offset.wheel?.(2).offset).toBeCloseTo(1.5 * Math.pow(30 / 0.1, 2 * ORBITS_NOTCH), 9)
    expect(offset.wheel?.(500).offset).toBeCloseTo(30, 9)
    expect(length.wheel?.(-500).length).toBeCloseTo(0.25, 9)
    // A double press puts each back where the device starts.
    expect(length.reset?.()).toEqual({ length: 2 })
    expect(offset.reset?.()).toEqual({ offset: 1.5 })
  })

  it('has the same two points at the ends of the lanes where the display is too low for rings', () => {
    const size = { width: 224, height: 48 }
    for (const loops of [2, 4]) {
      const lay = orbitsLay(size, loops)
      expect(lay.rings).toBeNull()
      const lanes = lay.lanes
      if (!lanes) throw new Error('no lanes')
      const view = viewOf(display, params, { values: { loops }, ...size })
      const [length, offset] = handlesAt({ loops }, size)
      expect(length.x).toBeCloseTo(lanes.x + laneLength(view, lanes, 0), 9)
      expect(length.y).toBeCloseTo(lanes.y, 9)
      expect(offset.x).toBeCloseTo(lanes.x + laneLength(view, lanes, loops - 1), 9)
      expect(offset.y).toBeCloseTo(lanes.y + (loops - 1) * lanes.pitch, 9)
      for (const wanted of [0.25, 2, 12]) {
        const there = handlesAt({ loops, length: wanted }, size)[0]
        expect(length.drag(there.x, there.y).length / wanted).toBeCloseTo(1, 9)
      }
      for (const wanted of [0.1, 1.5, 30]) {
        const there = handlesAt({ loops, offset: wanted }, size)[1]
        expect(offset.drag(there.x, there.y).offset / wanted).toBeCloseTo(1, 9)
      }
      // The longest lane of the most loops still ends inside the picture.
      const longest = handlesAt({ loops: 5, length: 12, offset: 30 }, size)[1]
      expect(longest.x).toBeLessThanOrEqual(size.width - 4)
      expect(longest.y).toBeLessThanOrEqual(size.height - 4)
    }
  })
})

describe('the words and the shapes of Orbits', () => {
  it('says a time and an offset as a player reads them', () => {
    expect([0.25, 0.7, 1, 2, 9.9, 12].map(orbitsTimeText)).toEqual([
      '250 ms',
      '700 ms',
      '1.0 s',
      '2.0 s',
      '9.9 s',
      '12 s',
    ])
    expect([0.7, 2.03, 15.6].map(orbitsPeriodText)).toEqual(['700.0 ms', '2.030 s', '15.60 s'])
    expect([0.1, 1.5, 17, 30].map(orbitsOffsetText)).toEqual(['+0.1 %', '+1.5 %', '+17 %', '+30 %'])
  })

  it('writes Length and Offset in the corners, and Hold only while it is on', () => {
    expect(draw().words()).toEqual(['2.0 s', '+1.5 %'])
    expect(draw({ values: { length: 0.4, offset: 23, hold: 1 } }).words()).toEqual([
      '400 ms',
      '+23 %',
      'Hold',
    ])
    // A window too narrow for words beside its rings has the rings alone.
    const narrow = draw({ width: 100, height: 100 })
    expect(narrow.words()).toEqual([])
    expect(ringsOf(narrow, 50, 50)).toHaveLength(3)
  })

  it("lays the loops out as lanes beside the rings where there is room, each with its loop's period", () => {
    const size = { width: 204, height: 100 }
    const lay = orbitsLay(size, 3)
    expect(lay.rings).toEqual({ cx: 50, cy: 50, reach: REACH })
    expect(lay.lanes?.even).toBe(true)
    const meters = readings({ phase1: 0.5, phase2: 0.25, phase3: 0 })
    const drawn = draw({ ...size, meters })
    expect(ringsOf(drawn, 50, 50)).toHaveLength(3)
    // The device's own periods at 48 kHz: 96000, 97440 and 98902 samples.
    expect(drawn.words()).toEqual(['2.000 s', '2.030 s', '2.060 s', '+1.5 %'])
    // Each loop has a head on its ring and one on its lane, as far along the lane as round the ring.
    const heads = headsOf(drawn)
    expect(heads).toHaveLength(6)
    const lanes = lay.lanes
    if (!lanes) throw new Error('no lanes')
    ;[0.5, 0.25, 0].forEach((place, k) => {
      expect(heads[3 + k].x).toBeCloseTo(lanes.x + place * lanes.long, 9)
      expect(heads[3 + k].y).toBeCloseTo(lanes.y + k * lanes.pitch, 9)
    })
    // Lanes and words stay inside the picture for any number of loops.
    for (const loops of [2, 5]) {
      const other = orbitsLay(size, loops).lanes
      if (!other) throw new Error('no lanes')
      expect(other.y + (loops - 1) * other.pitch + other.pitch / 2).toBeLessThanOrEqual(88)
      expect(other.x + other.long + other.words).toBeLessThanOrEqual(size.width - 4)
    }
  })

  it('draws only in the three colours of its plate', () => {
    const drawn = runDisplay(display, params, 0.5, { values: { hold: 1 } }, (time) => ({
      meters: readings({ phase1: time / 2, level1: 0.3, phase2: time / 2.03, level2: 0.2 }),
    }))
    const { rounds, shapes } = marks(drawn)
    for (const mark of [...rounds, ...shapes]) expect([ink, accent, plate]).toContain(mark.colour)
  })
})
