// The truth of the Orbits display: each loop's period is the device's own
// sum, a head stands where the device reports it and is carried on at that
// period, what a loop holds lies where the head was when it was written, as
// loud as Mix lets it out, a stretch nobody watched is drawn from the device's
// word and not left empty, Offset is drawn as the device uses it, and a drag
// to a place sets the value drawn there.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { denormalizeParam, normalizeParam } from '../../core/params'
import { INK, PLAIN_COLOURS, lerp } from '../components/display-kit'
import {
  EXTRA_LEAST,
  EXTRA_MOST,
  LANE_LEAST,
  LANE_MOST,
  ORBITS_BAND,
  ORBITS_BINS,
  ORBITS_FACES,
  ORBITS_FULL,
  ORBITS_MOST,
  ORBITS_NOTCH,
  ORBITS_RANGE_DB,
  ORBITS_UNSEEN,
  bandShare,
  laneLength,
  orbitsCount,
  orbitsLay,
  orbitsLongest,
  orbitsOffset,
  orbitsOffsetAt,
  orbitsOffsetText,
  orbitsPeriod,
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

/** The window as it stands today, 128 by 100: the rings above to the left, the lanes underneath. */
const WINDOW = { width: 128, height: 100 }
const CX = 34
const CY = 33
const REACH = 27
const LANES_X = 5
const LANES_LONG = 114
/** The upright plate's display and the strip. */
const UPRIGHT = { width: 204, height: 100 }
const STRIP = { width: 224, height: 48 }
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

/** The bands laid at one strength: those about the rings (innermost first), and those along the lanes. */
const bandsOf = (
  drawn: RecordingContext,
  alpha = ORBITS_BAND,
): { rings: Shape[]; lanes: Shape[] } => {
  const bands = marks(drawn).shapes.filter(
    (shape) => shape.kind === 'fill' && shape.colour === ink && shape.alpha === alpha,
  )
  return {
    rings: bands.filter((band) => band.points.length === 2 * (ORBITS_BINS + 1)),
    lanes: bands.filter((band) => band.points.length === 2 * ORBITS_BINS),
  }
}

/** How far out a ring's band reaches at stretch `bin` of its turn. */
const reachAt = (band: Shape, bin: number, cx = CX, cy = CY): number =>
  Math.hypot(band.points[bin][0] - cx, band.points[bin][1] - cy)

const draw = (options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, params, { meters: atRest, ...options })

const handlesAt = (values: Record<string, number> = {}, size: Partial<FrameOptions> = {}) =>
  display.handles?.(viewOf(display, params, { values, ...size })) ?? []

/** Where Offset stands on its knob's taper, 0 to 1. */
const offsetAt = (percent: number): number => Math.log(percent / 0.1) / Math.log(30 / 0.1)
const lengthAt = (seconds: number): number => Math.log(seconds / 0.25) / Math.log(12 / 0.25)

describe('what the Orbits display takes from the device', () => {
  it('copies the numbers of cpp/devices/orbits/orbits.h', () => {
    const header = readFileSync(resolve(process.cwd(), 'cpp/devices/orbits/orbits.h'), 'utf8')
    expect(header).toContain(`kMaxLoops = ${ORBITS_MOST};`)
    expect(header).toContain('kRingFrames = 1440000;')
    expect(header).toContain('kDriftSeconds = 0.012f;')
    // A band is full at full scale, where the record limiter starts.
    expect(header).toContain('kKnee = 1.0f;')
    expect(ORBITS_FULL).toBe(1)
    // The readings come in the order `meter` gives them: five places, five
    // levels at the record head, five of the most a loop holds.
    expect(Object.keys(descriptor?.meters ?? {})).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `phase${n}`),
      ...[1, 2, 3, 4, 5].map((n) => `level${n}`),
      ...[1, 2, 3, 4, 5].map((n) => `held${n}`),
    ])
  })

  it("works out a loop's period as `Orbits::period` does", () => {
    // What the device's own function gives (printed from the header), by
    // loops, Length in seconds, Offset in percent and sample rate.
    const cases: [number, number, number, number, number[]][] = [
      [3, 2, 0.5, 48000, [96000, 96480, 96962]],
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

  it('knows the Offset the device uses where the longest loop would not fit', () => {
    // As set, wherever every loop fits.
    expect(orbitsOffset(3, 2, 0.5, 48000)).toBeCloseTo(0.5, 9)
    expect(orbitsOffset(5, 10, 25, 48000)).toBeCloseTo(25, 9)
    expect(orbitsOffset(2, 12, 30, 48000)).toBeCloseTo(30, 9)
    // Five loops of 12 s: the last may be 1439415 samples, so each is that much longer than the one before.
    const fits = (Math.pow(1439415 / 576000, 1 / 4) - 1) * 100
    expect(fits).toBeGreaterThan(25.7)
    expect(fits).toBeLessThan(25.8)
    expect(orbitsOffset(5, 12, 30, 48000)).toBeCloseTo(fits, 9)
    // At 96 kHz a ring is 15 s, and long loops are held much closer.
    expect(orbitsOffset(5, 12, 30, 96000)).toBeCloseTo(
      (Math.pow(1438839 / 1152000, 1 / 4) - 1) * 100,
      9,
    )
    expect(orbitsOffset(5, 12, 30, 96000)).toBeLessThan(5.8)
    // And where that stands on the knob's taper.
    const view = viewOf(display, params, { values: { loops: 5, length: 12, offset: 30 } })
    expect(orbitsOffsetAt(view, 5, 48000)).toBeCloseTo(offsetAt(fits), 9)
    expect(orbitsOffsetAt(viewOf(display, params), 3, 48000)).toBeCloseTo(offsetAt(0.5), 9)
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

  it('draws a level by its decibels under full scale', () => {
    expect(bandShare(ORBITS_FULL)).toBe(1)
    expect(bandShare(1.5)).toBe(1)
    expect(bandShare(0)).toBe(0)
    expect(bandShare(ORBITS_FULL * Math.pow(10, -ORBITS_RANGE_DB / 20))).toBeCloseTo(0, 6)
    expect(bandShare(ORBITS_FULL * Math.pow(10, -ORBITS_RANGE_DB / 40))).toBeCloseTo(0.5, 6)
    expect(bandShare(0.2)).toBeGreaterThan(bandShare(0.1))
  })
})

describe('where the rings and the lanes of Orbits stand', () => {
  it('stands the rings over the lanes in the window, beside them where it is wide, and has lanes alone where it is low', () => {
    const window = orbitsLay(WINDOW, 3)
    expect(window.shape).toBe('stacked')
    expect(window.rings).toEqual({ cx: CX, cy: CY, reach: REACH })
    expect(window.lanes.x).toBe(LANES_X)
    expect(window.lanes.long).toBe(LANES_LONG)
    const upright = orbitsLay(UPRIGHT, 3)
    expect(upright.shape).toBe('beside')
    expect(upright.rings).toEqual({ cx: 50, cy: 50, reach: 43 })
    expect(upright.lanes.x).toBe(103)
    expect(upright.lanes.long).toBe(94)
    const strip = orbitsLay(STRIP, 3)
    expect(strip.shape).toBe('strip')
    expect(strip.rings).toBeNull()
    expect(strip.lanes.x).toBe(5)
    expect(strip.lanes.long).toBe(176)
    // A window too low for rings over lanes and too narrow for rings beside them has the lanes.
    expect(orbitsLay({ width: 128, height: 72 }, 3).shape).toBe('strip')
    expect(orbitsLay({ width: 160, height: 72 }, 3).shape).toBe('beside')
    expect(orbitsLay({ width: 176, height: 100 }, 3).shape).toBe('stacked')
  })

  it('keeps every ring, lane and point inside the picture, for any number of loops at the longest settings', () => {
    for (const size of [
      WINDOW,
      UPRIGHT,
      STRIP,
      { width: 80, height: 100 },
      { width: 176, height: 100 },
    ]) {
      for (const loops of [2, 3, 4, 5]) {
        const values = { loops, length: 12, offset: 30 }
        const view = viewOf(display, params, { values, ...size })
        const lay = orbitsLay(size, loops)
        const where = `${loops} loops at ${size.width} by ${size.height}`
        if (lay.rings) {
          const outermost = ringRadius(view, lay.rings.reach, loops, loops - 1, 48000)
          expect(outermost, where).toBeLessThanOrEqual(lay.rings.reach)
          expect(lay.rings.cx - lay.rings.reach, where).toBeGreaterThanOrEqual(4)
          expect(lay.rings.cy - lay.rings.reach, where).toBeGreaterThanOrEqual(4)
          // The rings end above the lanes or to the left of them.
          if (lay.shape === 'stacked') {
            expect(lay.rings.cy + lay.rings.reach, where).toBeLessThan(
              lay.lanes.y - lay.lanes.pitch / 2,
            )
          } else expect(lay.rings.cx + lay.rings.reach, where).toBeLessThan(lay.lanes.x)
        }
        for (const point of handlesAt(values, size)) {
          expect(point.x + 4, where).toBeLessThanOrEqual(size.width)
          expect(point.y + 4, where).toBeLessThanOrEqual(size.height)
          expect(point.x - 4, where).toBeGreaterThanOrEqual(0)
          expect(point.y - 4, where).toBeGreaterThanOrEqual(0)
        }
        // The two points are far enough apart to be told apart by a hand.
        const [length, offset] = handlesAt({ loops, length: 0.25, offset: 0.1 }, size)
        expect(Math.hypot(length.x - offset.x, length.y - offset.y), where).toBeGreaterThanOrEqual(
          9,
        )
      }
    }
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
          // Offset as the device uses it: the knob's, but for five loops of 12 s.
          const used = offsetAt(orbitsOffset(loops, length, offset, 48000))
          const rings = ringsOf(draw({ values }))
          rings.forEach((radius, k) => {
            const wanted =
              REACH * lerp(FIRST[0], FIRST[1], lengthAt(length)) +
              k * widest * lerp(GAP_LEAST, 1, used)
            expect(radius, `ring ${k} of ${loops}`).toBeCloseTo(wanted, 9)
            expect(ringRadius(view, REACH, loops, k, 48000)).toBeCloseTo(wanted, 9)
          })
        }
      }
    }
    // The ends: the shortest loop, the longest, and five rings as far apart as they go.
    expect(ringsOf(draw({ values: { length: 0.25 } }))[0]).toBeCloseTo(FIRST[0] * REACH, 9)
    expect(ringsOf(draw({ values: { length: 12 } }))[0]).toBeCloseTo(FIRST[1] * REACH, 9)
    const most = ringsOf(draw({ values: { loops: 5, length: 2, offset: 30 } }))
    expect(most[4]).toBeCloseTo((lerp(FIRST[0], FIRST[1], lengthAt(2)) + 0.48) * REACH, 9)
    // Five loops of 12 s are held closer than 30 %, and the rings say so.
    const held = ringsOf(draw({ values: { loops: 5, length: 12, offset: 30 } }))
    expect(held[4]).toBeLessThan(OUTERMOST * REACH - 0.1)
    expect(held[4]).toBeCloseTo(
      ringsOf(
        draw({ values: { loops: 5, length: 12, offset: orbitsOffset(5, 12, 30, 48000) } }),
      )[4],
      9,
    )
  })

  it('stands each head on its ring where the device reports it, from the top and clockwise', () => {
    const meters = readings({ phase1: 0.25, phase2: 0.5, phase3: 0.75 })
    const drawn = draw({ meters })
    const rings = ringsOf(drawn)
    // A head on each ring, then one on each lane.
    const heads = headsOf(drawn)
    expect(heads).toHaveLength(6)
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
    expect(headsOf(draw({ values: { loops: 2 }, meters }))).toHaveLength(4)
  })

  it("carries a head on between two readings at its own loop's period", () => {
    const meters = readings({ phase1: 0.25, phase2: 0.25, phase3: 0.25 })
    // Two frames a thirtieth of a second apart with the same reading.
    const drawn = runDisplay(display, params, 2 / 30, { meters })
    const rings = ringsOf(drawn)
    const heads = headsOf(drawn)
    rings.forEach((radius, k) => {
      const seconds = orbitsPeriod(k, 3, 2, 0.5, 48000) / 48000
      const [x, y] = ringPoint(CX, CY, radius, 0.25 + 1 / 30 / seconds)
      expect(heads[k].x, `loop ${k}`).toBeCloseTo(x, 9)
      expect(heads[k].y, `loop ${k}`).toBeCloseTo(y, 9)
    })
    // The second loop is half a percent slower than the first: it has gone less far.
    expect(heads[1].y - CY).toBeLessThan((heads[0].y - CY) * (rings[1] / rings[0]))
  })

  it('shows a loop at rest as an open head at the start, and nothing held', () => {
    const drawn = draw({ meters: atRest })
    expect(headsOf(drawn)).toHaveLength(0)
    const rings = ringsOf(drawn)
    const lanes = orbitsLay(WINDOW, 3).lanes
    const ghosts = ghostsOf(drawn)
    expect(ghosts).toHaveLength(6)
    rings.forEach((radius, k) => {
      expect(ghosts[k].x).toBeCloseTo(CX, 9)
      expect(ghosts[k].y).toBeCloseTo(CY - radius, 9)
      expect(ghosts[3 + k].x).toBeCloseTo(lanes.x, 9)
      expect(ghosts[3 + k].y).toBeCloseTo(lanes.y + k * lanes.pitch, 9)
    })
    for (const strength of [ORBITS_BAND, ORBITS_UNSEEN]) {
      expect(bandsOf(drawn, strength).rings).toHaveLength(0)
      expect(bandsOf(drawn, strength).lanes).toHaveLength(0)
    }
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

describe('the lanes of Orbits', () => {
  it("makes the first lane as long as Length and the last longer by Offset, each on its knob's taper", () => {
    for (const size of [WINDOW, UPRIGHT, STRIP]) {
      for (const loops of [2, 3, 5]) {
        const { lanes } = orbitsLay(size, loops)
        for (const length of [0.25, 2, 12]) {
          for (const offset of [0.1, 1.5, 30]) {
            const values = { loops, length, offset }
            const view = viewOf(display, params, { values, ...size })
            const used = offsetAt(orbitsOffset(loops, length, offset, 48000))
            for (let k = 0; k < loops; k++) {
              const wanted =
                lanes.long * lerp(LANE_LEAST, LANE_MOST, lengthAt(length)) +
                (k / (loops - 1)) * lanes.long * lerp(EXTRA_LEAST, EXTRA_MOST, used)
              expect(laneLength(view, lanes, loops, k, 48000)).toBeCloseTo(wanted, 9)
            }
          }
        }
      }
    }
    // The longest lane there can be takes all but a fiftieth of the room.
    expect(LANE_MOST + EXTRA_MOST).toBeCloseTo(0.98, 9)
  })

  it('stands each head as far along its lane as its loop is round its turn', () => {
    for (const size of [WINDOW, UPRIGHT, STRIP]) {
      const meters = readings({ phase1: 0.5, phase2: 0.25, phase3: 0 })
      const drawn = draw({ ...size, meters })
      const lay = orbitsLay(size, 3)
      const view = viewOf(display, params, size)
      const heads = headsOf(drawn).slice(lay.rings ? 3 : 0)
      expect(heads).toHaveLength(3)
      ;[0.5, 0.25, 0].forEach((place, k) => {
        expect(heads[k].x).toBeCloseTo(
          lay.lanes.x + place * laneLength(view, lay.lanes, 3, k, 48000),
          9,
        )
        expect(heads[k].y).toBeCloseTo(lay.lanes.y + k * lay.lanes.pitch, 9)
      })
    }
  })
})

describe('what the loops of Orbits hold', () => {
  /** A second of the first loop of two (2 s round): it writes `level` for its first quarter, then nothing. */
  const quarter = (level: number, values: Record<string, number> = {}): RecordingContext =>
    runDisplay(display, params, 1, { values: { loops: 2, ...values } }, (time) => ({
      meters: readings({
        phase1: time / 2,
        level1: time < 0.5 ? level : 0,
        phase2: time / 2.01,
        level2: 0,
      }),
    }))

  it('lays what a loop wrote where its head was, as wide as its level under Mix', () => {
    const level = 0.5
    const drawn = quarter(level)
    const rings = ringsOf(drawn)
    const bands = bandsOf(drawn)
    // Only the first loop wrote anything: one band about its ring and one along its lane.
    expect(bands.rings).toHaveLength(1)
    expect(bands.lanes).toHaveLength(1)
    const most = (rings[1] - rings[0]) / 2 - 0.5
    const share = bandShare(level * orbitsWet(0.4))
    expect(share).toBeGreaterThan(0.5)
    const wide = share * most
    // In the first quarter of the turn, where it was written: as wide as the level.
    for (const bin of [3, 9, 15])
      expect(reachAt(bands.rings[0], bin)).toBeCloseTo(rings[0] + wide, 5)
    // The second quarter was written with nothing, and the rest the head has not been over.
    for (const bin of [22, 30, 50, 68])
      expect(reachAt(bands.rings[0], bin)).toBeCloseTo(rings[0], 5)
    // The band lies as far inside the ring as outside it.
    const inner = bands.rings[0].points[bands.rings[0].points.length - 1 - 9]
    expect(Math.hypot(inner[0] - CX, inner[1] - CY)).toBeCloseTo(rings[0] - wide, 5)
    // The same along the lane: above and below it by the level, at the same stretches.
    const { lanes } = orbitsLay(WINDOW, 2)
    const view = viewOf(display, params, { values: { loops: 2 } })
    const long = laneLength(view, lanes, 2, 0, 48000)
    const high = (lanes.pitch / 2 - 1.5) * share
    for (const bin of [3, 9, 15]) {
      expect(bands.lanes[0].points[bin][0]).toBeCloseTo(
        lanes.x + ((bin + 0.5) / ORBITS_BINS) * long,
        5,
      )
      expect(bands.lanes[0].points[bin][1]).toBeCloseTo(lanes.y - high, 5)
      expect(bands.lanes[0].points[2 * ORBITS_BINS - 1 - bin][1]).toBeCloseTo(lanes.y + high, 5)
    }
    for (const bin of [22, 30, 50, 68])
      expect(bands.lanes[0].points[bin][1]).toBeCloseTo(lanes.y, 5)
  })

  it('is as loud as Mix lets it out, and gone with Mix at 0 while the heads still turn', () => {
    const full = quarter(0.3, { mix: 1 })
    const some = quarter(0.3, { mix: 0.4 })
    const rings = ringsOf(full)
    const most = (rings[1] - rings[0]) / 2 - 0.5
    expect(reachAt(bandsOf(full).rings[0], 9) - rings[0]).toBeCloseTo(bandShare(0.3) * most, 5)
    expect(reachAt(bandsOf(some).rings[0], 9)).toBeLessThan(reachAt(bandsOf(full).rings[0], 9))

    const none = quarter(0.3, { mix: 0 })
    expect(bandsOf(none).rings).toHaveLength(0)
    expect(bandsOf(none).lanes).toHaveLength(0)
    // Nothing of the loops is heard, so no head is lit; but each still stands where its loop is.
    expect(headsOf(none)).toHaveLength(0)
    const ghosts = ghostsOf(none)
    const lit = headsOf(full)
    expect(ghosts).toHaveLength(4)
    ghosts.forEach((ghost, k) => {
      expect(ghost.x).toBeCloseTo(lit[k].x, 9)
      expect(ghost.y).toBeCloseTo(lit[k].y, 9)
    })
    // The first head has gone half way round.
    expect(lit[0].y).toBeGreaterThan(CY)
  })

  it('forgets what a loop held when the device reports it at rest', () => {
    const state = display.init?.()
    const playing = (time: number): Partial<FrameOptions> => ({
      meters: readings({ phase1: time / 2, level1: 0.3, phase2: time / 2.01, level2: 0.3 }),
    })
    const values = { loops: 2 }
    expect(bandsOf(runDisplay(display, params, 1, { values, state }, playing)).rings).toHaveLength(
      2,
    )
    const rested = runDisplay(display, params, 0.1, { values, state, now: 11 }, () => ({
      meters: atRest,
    }))
    expect(bandsOf(rested).rings).toHaveLength(0)
    expect(bandsOf(rested).lanes).toHaveLength(0)
    // And starts again from nothing.
    const again = runDisplay(display, params, 0.1, { values, state, now: 11.1 }, playing)
    const band = bandsOf(again).rings[0]
    expect(reachAt(band, 40)).toBeCloseTo(ringsOf(again)[0], 5)
  })

  it('does not show a loop that holds sound as empty because nobody watched it being written', () => {
    // Opened on two loops that hold a peak of 0.4 and 0.1 and are writing nothing new.
    const holding = readings({ phase1: 0.3, phase2: 0.6, held1: 0.4, held2: 0.1 })
    const values = { loops: 2 }
    const opened = draw({ values, meters: holding })
    expect(bandsOf(opened).rings).toHaveLength(0)
    const unseen = bandsOf(opened, ORBITS_UNSEEN)
    expect(unseen.rings).toHaveLength(2)
    expect(unseen.lanes).toHaveLength(2)
    const rings = ringsOf(opened)
    const most = (rings[1] - rings[0]) / 2 - 0.5
    const wet = orbitsWet(0.4)
    // All the way round at the most the device says each loop holds, under Mix.
    for (const bin of [0, 10, 40, 71]) {
      expect(reachAt(unseen.rings[0], bin)).toBeCloseTo(rings[0] + bandShare(0.4 * wet) * most, 5)
      expect(reachAt(unseen.rings[1], bin)).toBeCloseTo(rings[1] + bandShare(0.1 * wet) * most, 5)
    }
    // But for the stretch under the head, which is seen: nothing is written there now.
    expect(reachAt(unseen.rings[0], Math.floor(0.3 * ORBITS_BINS))).toBeCloseTo(rings[0], 5)

    // Watched for a second while the first loop writes 0.2: that half of its
    // turn is what was seen, the other half still the device's word.
    const watched = runDisplay(display, params, 1, { values }, (time) => ({
      meters: readings({
        ...holding,
        phase1: 0.3 + time / 2,
        level1: 0.2,
        phase2: 0.6 + time / 2.01,
      }),
    }))
    const seen = bandsOf(watched).rings
    const rest = bandsOf(watched, ORBITS_UNSEEN).rings
    expect(seen).toHaveLength(1)
    for (const bin of [26, 40, 54]) {
      expect(reachAt(seen[0], bin)).toBeCloseTo(rings[0] + bandShare(0.2 * wet) * most, 5)
      expect(reachAt(rest[0], bin)).toBeCloseTo(rings[0], 5)
    }
    for (const bin of [5, 15, 66]) {
      expect(reachAt(seen[0], bin)).toBeCloseTo(rings[0], 5)
      expect(reachAt(rest[0], bin)).toBeCloseTo(rings[0] + bandShare(0.4 * wet) * most, 5)
    }
    // A device that does not say what its loops hold has nothing drawn for what was not watched.
    const older = { ...holding }
    for (const n of [1, 2, 3, 4, 5]) delete (older as Record<string, number>)[`held${n}`]
    expect(bandsOf(draw({ values, meters: older }), ORBITS_UNSEEN).rings).toHaveLength(0)
    // And with Mix at 0 nothing of the loops is drawn at all.
    expect(
      bandsOf(draw({ values: { ...values, mix: 0 }, meters: holding }), ORBITS_UNSEEN).rings,
    ).toHaveLength(0)
  })

  it('takes what it watched as unseen again when a loop is moved to another length', () => {
    const state = display.init?.()
    const playing = (time: number): Partial<FrameOptions> => ({
      meters: readings({
        phase1: time / 2,
        level1: 0.3,
        held1: 0.3,
        phase2: time / 2.01,
        level2: 0.3,
        held2: 0.3,
      }),
    })
    const before = runDisplay(display, params, 1, { values: { loops: 2 }, state }, playing)
    expect(bandsOf(before).rings).toHaveLength(2)
    // Length moves: both loops hold their sound at other places of their turns now.
    const moved = runDisplay(
      display,
      params,
      1 / 30,
      { values: { loops: 2, length: 3 }, state, now: 11 },
      () => ({
        meters: readings({
          phase1: 0.5,
          level1: 0,
          held1: 0.3,
          phase2: 0.5,
          level2: 0,
          held2: 0.3,
        }),
      }),
    )
    expect(bandsOf(moved).rings).toHaveLength(0)
    expect(bandsOf(moved, ORBITS_UNSEEN).rings).toHaveLength(2)
    // Offset moves: the first loop is where it was, the second is not.
    const other = display.init?.()
    runDisplay(display, params, 1, { values: { loops: 2 }, state: other }, playing)
    const wider = runDisplay(
      display,
      params,
      1 / 30,
      { values: { loops: 2, offset: 5 }, state: other, now: 11 },
      () => ({
        meters: readings({
          phase1: 0.5,
          level1: 0.3,
          held1: 0.3,
          phase2: 0.5,
          level2: 0,
          held2: 0.3,
        }),
      }),
    )
    // What was watched of the first is still there; the second is all the device's word again.
    expect(bandsOf(wider).rings).toHaveLength(1)
    const unseen = bandsOf(wider, ORBITS_UNSEEN).rings
    expect(unseen).toHaveLength(2)
    const rings = ringsOf(wider)
    expect(reachAt(unseen[0], 10)).toBeCloseTo(rings[0], 5)
    expect(reachAt(unseen[1], 10)).toBeGreaterThan(rings[1] + 0.5)
  })
})

describe('the points of Orbits', () => {
  it('puts Length at the end of the first lane and Offset at the end of the last, in every shape', () => {
    for (const size of [WINDOW, UPRIGHT, STRIP]) {
      for (const loops of [2, 3, 5]) {
        const { lanes } = orbitsLay(size, loops)
        const view = viewOf(display, params, { values: { loops }, ...size })
        const drawn = draw({ values: { loops }, ...size })
        const [length, offset] = handlesAt({ loops }, size)
        expect([length.key, offset.key]).toEqual(['length', 'offset'])
        expect(length.x).toBeCloseTo(lanes.x + laneLength(view, lanes, loops, 0, 48000), 9)
        expect(length.y).toBeCloseTo(lanes.y, 9)
        expect(offset.x).toBeCloseTo(lanes.x + laneLength(view, lanes, loops, loops - 1, 48000), 9)
        expect(offset.y).toBeCloseTo(lanes.y + (loops - 1) * lanes.pitch, 9)
        // Each is drawn where it stands.
        const points = marks(drawn).rounds.filter(
          (round) => round.kind === 'stroke' && round.r === 3 && round.width === 1.5,
        )
        expect(points.map((point) => [point.x, point.y])).toEqual([
          [length.x, length.y],
          [offset.x, offset.y],
        ])
      }
    }
  })

  it('gives both a travel a hand can set them with', () => {
    const travel = (size: { width: number; height: number }, loops: number): [number, number] => [
      handlesAt({ loops, length: 12 }, size)[0].x - handlesAt({ loops, length: 0.25 }, size)[0].x,
      handlesAt({ loops, offset: 30 }, size)[1].x - handlesAt({ loops, offset: 0.1 }, size)[1].x,
    ]
    for (const loops of [2, 3, 5]) {
      // The window: 45 px for Length's five and a half octaves, 39 px for Offset.
      expect(travel(WINDOW, loops)[0]).toBeCloseTo(0.4 * LANES_LONG, 9)
      expect(travel(WINDOW, loops)[1]).toBeCloseTo(0.35 * LANES_LONG, 9)
      expect(travel(WINDOW, loops)[0]).toBeGreaterThan(45)
      expect(travel(UPRIGHT, loops)[0]).toBeGreaterThan(37)
      expect(travel(UPRIGHT, loops)[1]).toBeGreaterThan(32)
      expect(travel(STRIP, loops)[0]).toBeGreaterThan(70)
      expect(travel(STRIP, loops)[1]).toBeGreaterThan(61)
    }
  })

  it('sets by a drag the value whose picture is under the hand', () => {
    for (const size of [WINDOW, UPRIGHT, STRIP]) {
      for (const loops of [2, 3, 5]) {
        for (const wanted of [0.25, 0.7, 2, 6.5, 12]) {
          const there = handlesAt({ loops, length: wanted }, size)[0]
          // From anywhere: the place alone says the Length.
          const set = handlesAt({ loops, length: 3.3 }, size)[0].drag(there.x, there.y).length
          expect(set / wanted, `Length ${wanted} of ${loops} loops`).toBeCloseTo(1, 9)
        }
        for (const wanted of [0.1, 0.6, 1.5, 9, 30]) {
          const there = handlesAt({ loops, offset: wanted }, size)[1]
          const set = handlesAt({ loops, offset: 4 }, size)[1].drag(there.x, there.y, {}).offset
          expect(set / wanted, `Offset ${wanted} of ${loops} loops`).toBeCloseTo(1, 9)
        }
      }
    }
    // Past the picture a drag stops at the knob's own ends.
    const [length, offset] = handlesAt()
    expect(length.drag(500, 0).length).toBeCloseTo(12, 9)
    expect(length.drag(-500, 0).length).toBeCloseTo(0.25, 9)
    expect(offset.drag(500, 0, {}).offset).toBeCloseTo(30, 9)
    expect(offset.drag(-500, 0, {}).offset).toBeCloseTo(0.1, 9)
    // A notch of the wheel is a hundredth of the knob's turn, on its taper, and stops at its ends.
    expect(length.wheel?.(1).length).toBeCloseTo(2 * Math.pow(12 / 0.25, ORBITS_NOTCH), 9)
    expect(length.wheel?.(-3).length).toBeCloseTo(2 * Math.pow(12 / 0.25, -3 * ORBITS_NOTCH), 9)
    expect(offset.wheel?.(2).offset).toBeCloseTo(0.5 * Math.pow(30 / 0.1, 2 * ORBITS_NOTCH), 9)
    expect(offset.wheel?.(500).offset).toBeCloseTo(30, 9)
    expect(length.wheel?.(-500).length).toBeCloseTo(0.25, 9)
    // A double press puts each back where the device starts.
    expect(length.reset?.()).toEqual({ length: 2 })
    expect(offset.reset?.()).toEqual({ offset: 0.5 })
  })

  it('draws Offset where the device holds it, and moves it from where the knob has it', () => {
    // Five loops of 12 s at 30 %: the device holds them 25.7 % apart.
    const values = { loops: 5, length: 12, offset: 30 }
    const used = orbitsOffset(5, 12, 30, 48000)
    const spec = params.offset
    for (const size of [WINDOW, UPRIGHT, STRIP]) {
      const { lanes } = orbitsLay(size, 5)
      const first = lanes.long * LANE_MOST
      const at = (percent: number): number =>
        lanes.x + first + lanes.long * lerp(EXTRA_LEAST, EXTRA_MOST, normalizeParam(spec, percent))
      const [, offset] = handlesAt(values, size)
      // The point stands at the end of the last lane as the device has it, short of where 30 % lies.
      expect(offset.x).toBeCloseTo(at(used), 9)
      expect(at(30) - offset.x).toBeGreaterThan(0.4)
      // Pressed and not moved, nothing changes: the knob stays at 30 %.
      const hold = {}
      expect(offset.drag(offset.x, offset.y, hold).offset).toBeCloseTo(30, 9)
      // Moved 10 px to the left, it is the setting that moved 10 px from where it lay.
      const moved = handlesAt(values, size)[1].drag(offset.x - 10, offset.y, hold).offset
      expect(moved).toBeCloseTo(
        denormalizeParam(
          spec,
          ((at(30) - 10 - lanes.x - first) / lanes.long - EXTRA_LEAST) / (EXTRA_MOST - EXTRA_LEAST),
        ),
        9,
      )
      expect(moved).toBeLessThan(used)
      // And from there on the point stands where the setting lies, as far from the hand as at the press.
      const after = handlesAt({ ...values, offset: moved }, size)[1]
      expect(after.x).toBeCloseTo(at(30) - 10, 6)
    }
    // The words say what the device does, not what the knob says.
    expect(draw({ values }).words()).toEqual(['12 s', '+26 %'])
    expect(draw({ values: { ...values, loops: 2 } }).words()).toEqual(['12 s', '+30 %'])
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
    expect([0.1, 0.5, 1.5, 17, 30].map(orbitsOffsetText)).toEqual([
      '+0.1 %',
      '+0.5 %',
      '+1.5 %',
      '+17 %',
      '+30 %',
    ])
  })

  it('writes Length and Offset beside the rings, and Hold only while it is on', () => {
    for (const size of [WINDOW, UPRIGHT, STRIP]) {
      expect(draw(size).words()).toEqual(['2.0 s', '+0.5 %'])
      expect(draw({ ...size, values: { length: 0.4, offset: 23, hold: 1 } }).words()).toEqual([
        '400 ms',
        '+23 %',
        'Hold',
      ])
    }
    // A window too narrow for words beside its rings has the rings and the lanes alone.
    const narrow = draw({ width: 100, height: 100 })
    expect(narrow.words()).toEqual([])
    expect(ringsOf(narrow)).toHaveLength(3)
  })

  it('draws only in the three colours of its plate', () => {
    const drawn = runDisplay(display, params, 0.5, { values: { hold: 1 } }, (time) => ({
      meters: readings({
        phase1: time / 2,
        level1: 0.3,
        held1: 0.4,
        phase2: time / 2.01,
        level2: 0.2,
        held2: 0.4,
      }),
    }))
    const { rounds, shapes } = marks(drawn)
    for (const mark of [...rounds, ...shapes]) expect([ink, accent, plate]).toContain(mark.colour)
  })
})
