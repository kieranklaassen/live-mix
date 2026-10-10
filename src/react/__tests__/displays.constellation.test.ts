// Constellation's display against its device. The sky is not read from the
// device: the display works out where each star stands by the sums of
// `cpp/devices/constellation/sky.h`, so the first thing held here is that the
// two give the same skies (one table of numbers, written down in
// `cpp/test/constellation_test.cpp` too). After that: each star is drawn at
// its time and side and as big as it is loud, Again's passes follow a span
// later, a star lights when the sound gets to it, and the point on the last
// star sets Span and Width.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  CONSTELLATION_FACES,
  DRIFT_PERIOD_SEC,
  PLACES,
  driftAt,
  driftSeconds,
  fadeShare,
  layOut,
  spanText,
  starCorner,
  starLevels,
} from '../components/displays/constellation'
import {
  drawDisplay,
  patchUnder,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const display = CONSTELLATION_FACES.constellation.display
const params: Readonly<Record<string, ParamSpec>> =
  stockDescriptors().get('constellation')?.params ?? {}
const { plate, ink, accent } = PLAIN_COLOURS

// On a plate the strip is 224 by 48: the sky is drawn in a box 216 by 40 at
// (4, 4). The note stands 3 px in, the last star 0.2 to 0.72 of the rest of
// the way across by where Span stands, the middle line is at 24 and a star
// all the way to one side stands 15 px from it.
const PLATE = { width: 224, height: 48 }
const X0 = 7
const ROOM = 213
const MID = 24
const REACH = 15
const GROW = 3
/** How many pixels one span is, for a Span in milliseconds. */
const acrossOf = (spanMs: number): number =>
  (0.2 + 0.52 * (Math.log(spanMs / 100) / Math.log(80))) * ROOM
/** The radius of the dot of a star that loud. */
const radiusOf = (level: number): number => 0.6 + GROW * Math.sqrt(level)

interface Round {
  x: number
  y: number
  r: number
  op: 'fill' | 'stroke'
  style: string
  alpha: number
}

/** Every circle drawn, filled or as a line, with its colour and how strongly it was laid. */
function rounds(drawn: RecordingContext): Round[] {
  const out: Round[] = []
  let fill = ''
  let stroke = ''
  let alpha = 1
  let arc: number[] | null = null
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set strokeStyle') stroke = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'beginPath' || call.name === 'moveTo') arc = null
    else if (call.name === 'arc') arc = call.args as number[]
    else if ((call.name === 'fill' || call.name === 'stroke') && arc)
      out.push({
        x: arc[0],
        y: arc[1],
        r: arc[2],
        op: call.name,
        style: call.name === 'fill' ? fill : stroke,
        alpha,
      })
  }
  return out
}

/** The stars that sound: dots in the ink. */
const dots = (drawn: RecordingContext): Round[] =>
  rounds(drawn).filter((round) => round.op === 'fill' && round.style === ink)
/** The lights: dots in the accent. */
const lights = (drawn: RecordingContext): Round[] =>
  rounds(drawn).filter((round) => round.op === 'fill' && round.style === accent)
/** Places that do not sound: thin rings in the ink (the point's ring is a heavier line at full strength). */
const rings = (drawn: RecordingContext): Round[] =>
  rounds(drawn).filter((round) => round.op === 'stroke' && round.style === ink && round.alpha < 1)
/** The point: the ring filled with the plate. */
const point = (drawn: RecordingContext): Round | undefined =>
  rounds(drawn).find((round) => round.op === 'fill' && round.style === plate)

const near = (rounds: Round[], x: number, y: number): Round | undefined =>
  rounds.find((round) => Math.abs(round.x - x) < 0.01 && Math.abs(round.y - y) < 0.01)

/** Everything still, wet only and nothing wandering, so a dot stands exactly on its star. */
const STILL = { drift: 0, mix: 1, again: 0, fade: 0, width: 1 }

describe("constellation's sky", () => {
  // From `cpp/test/constellation_test.cpp`: for each pattern, the sum over
  // seeds 1 to 16 and places 0 to 11 of (place + 1) (time + 2 side +
  // 3 brightness) / seed, then time, side and brightness of places 1, 5 and
  // 11 for seed 1 and for seed 11.
  const GOLDEN: readonly (readonly [number, number, readonly number[]])[] = [
    [
      0,
      567.049052,
      [
        0.749341, 0.184601, 0.96, 0.236264, -0.352969, 0.8, 0.041829, -0.811925, 0.56, 0.585409,
        -0.184601, 0.96, 0.068754, 0.352969, 0.8, 0.002767, 0.811925, 0.56,
      ],
    ],
    [
      1,
      735.433734,
      [
        0.294104, -0.806443, 0.9, 0.265455, -0.607987, 0.7, 0.722944, 0.787971, 0.55, 0.265477,
        -0.383804, 0.9, 0.235544, -0.387271, 0.7, 0.703009, 0.179602, 0.55,
      ],
    ],
    [
      2,
      699.133699,
      [
        0.888462, 0.084019, 0.696795, 0.404371, 0.459075, 0.663106, 0.151972, -0.015692, 0.583238,
        0.219364, 0.082833, 0.842265, 0.659768, 0.052814, 0.683452, 0.389212, 0.171392, 0.793168,
      ],
    ],
    [
      3,
      524.990436,
      [
        0.550059, 0, 0.85, 0.666775, -0.2, 0.55, 0.836059, -0.5, 0.4, 0.578848, 0, 0.85, 0.690242,
        -0.2, 0.55, 0.848934, -0.5, 0.4,
      ],
    ],
    [
      4,
      913.721244,
      [
        0.267721, -0.078997, 0.6, 0.789436, -0.705871, 0.76, 0.967533, -0.800387, 1, 0.231653,
        -0.043484, 0.6, 0.732214, -0.680291, 0.76, 0.944902, -0.800657, 1,
      ],
    ],
  ]

  it('is the sky the device lays out, for every pattern and seed', () => {
    for (const [pattern, sum, stars] of GOLDEN) {
      let total = 0
      for (let seed = 1; seed <= 16; seed++) {
        const sky = layOut(pattern, seed)
        for (let k = 0; k < PLACES; k++)
          total += ((k + 1) * (sky.time[k] + 2 * sky.pan[k] + 3 * sky.mag[k])) / seed
      }
      expect(Math.abs(total - sum), `pattern ${pattern}: the sum over its skies`).toBeLessThan(1e-4)
      let n = 0
      for (const seed of [1, 11]) {
        const sky = layOut(pattern, seed)
        for (const k of [1, 5, 11]) {
          const what = `pattern ${pattern} seed ${seed} place ${k}`
          expect(Math.abs(sky.time[k] - stars[n++]), `${what} time`).toBeLessThan(2e-6)
          expect(Math.abs(sky.pan[k] - stars[n++]), `${what} side`).toBeLessThan(2e-6)
          expect(Math.abs(sky.mag[k] - stars[n++]), `${what} brightness`).toBeLessThan(2e-6)
        }
      }
    }
  })

  it('puts the last star at the end of the span, on a side, at full brightness', () => {
    for (let pattern = 0; pattern < 5; pattern++) {
      for (let seed = 1; seed <= 16; seed++) {
        const sky = layOut(pattern, seed)
        expect(sky.time[0]).toBe(1)
        expect(Math.abs(sky.pan[0])).toBeCloseTo(0.8, 6)
        expect(sky.mag[0]).toBe(1)
        for (let k = 1; k < PLACES; k++) {
          expect(sky.time[k]).toBeGreaterThan(0)
          expect(sky.time[k]).toBeLessThan(1)
        }
      }
    }
  })

  it('wanders as the device does', () => {
    // `drift_at` for stars 0, 5 and 11 at three moments of the clock, from the same harness.
    const wander = [
      -0.197614, -0.333074, -0.055763, -0.191359, 0.034105, -0.880695, 0.190407, -0.530805,
      -0.356252,
    ]
    let n = 0
    for (const star of [0, 5, 11])
      for (const clock of [0, 0.1234, 0.9])
        expect(Math.abs(driftAt(star, clock) - wander[n++])).toBeLessThan(2e-5)
    // 6 ms at the most, and never more than half the star's own time.
    expect(driftSeconds(1, 1, 2.4, 1)).toBeCloseTo(0.006, 9)
    expect(driftSeconds(0.5, 1, 2.4, -1)).toBeCloseTo(-0.003, 9)
    expect(driftSeconds(1, 0.01, 0.1, 1)).toBeCloseTo(0.0005, 9)
  })

  it('shares the power among the stars that are lit', () => {
    const sky = layOut(2, 3)
    for (const stars of [1, 4, 12]) {
      const levels = starLevels(sky, stars, 0.4)
      expect(levels.reduce((sum, level) => sum + level * level, 0)).toBeCloseTo(1, 9)
      expect(levels.filter((level) => level > 0).length).toBe(stars)
    }
    // One star is one echo at the level it went in.
    expect(starLevels(sky, 1, 1)[0]).toBeCloseTo(1, 9)
    // Fade: a star is as much quieter than another as 2^(-3 Fade time) says.
    const plain = starLevels(sky, 12, 0)
    const faded = starLevels(sky, 12, 1)
    for (const k of [3, 7]) {
      expect(faded[k] / faded[0] / (plain[k] / plain[0])).toBeCloseTo(
        2 ** (-3 * sky.time[k]) / 2 ** -3,
        6,
      )
    }
    expect(fadeShare(1, 1)).toBeCloseTo(0.125, 9)
    expect(fadeShare(0, 1)).toBe(1)
    // The corner: Tone, what Fade leaves, up to an octave for a dim star, and a floor.
    expect(starCorner(8000, 1, 1)).toBeCloseTo(8000, 6)
    expect(starCorner(8000, 0.5, 0.5)).toBeCloseTo(3000, 6)
    expect(starCorner(500, 0.125, 0.4)).toBe(150)
  })
})

describe("constellation's display", () => {
  it('draws every lit star at its time and its side, as big as it is loud', () => {
    for (const [pattern, shuffle] of [
      [0, 1],
      [1, 4],
      [2, 9],
      [3, 2],
      [4, 16],
    ]) {
      const values = { ...STILL, pattern, shuffle, stars: 12, span: 2400 }
      const drawn = drawDisplay(display, params, { ...PLATE, values })
      const sky = layOut(pattern, shuffle)
      const levels = starLevels(sky, 12, 0)
      const across = acrossOf(2400)
      const found = dots(drawn)
      for (let k = 0; k < PLACES; k++) {
        const dot = near(found, X0 + sky.time[k] * across, MID + sky.pan[k] * REACH)
        expect(dot, `pattern ${pattern}: star ${k} is drawn at its place`).toBeDefined()
        expect(dot?.r).toBeCloseTo(radiusOf(levels[k]), 6)
      }
      // The last star twice (in the sky and in its ring) and the others once: nothing else is a dot.
      expect(found.length).toBe(PLACES + 1)
      expect(rings(drawn)).toEqual([])
    }
  })

  it('shows the places Stars has not lit as rings, and moves no star as Stars turns', () => {
    const values = { ...STILL, pattern: 2, shuffle: 5, span: 1000 }
    const sky = layOut(2, 5)
    const across = acrossOf(1000)
    for (const stars of [1, 4, 9]) {
      const drawn = drawDisplay(display, params, { ...PLATE, values: { ...values, stars } })
      const unlit = rings(drawn)
      expect(unlit.length).toBe(PLACES - stars)
      for (let k = 0; k < PLACES; k++) {
        const at = [X0 + sky.time[k] * across, MID + sky.pan[k] * REACH] as const
        expect(
          near(k < stars ? dots(drawn) : unlit, ...at),
          `${stars} stars: place ${k}`,
        ).toBeDefined()
      }
      for (const ring of unlit) expect(ring.alpha).toBe(INK.rule)
    }
  })

  it('draws a star nearer the middle as Width comes down, left at the top', () => {
    const sky = layOut(0, 1)
    const across = acrossOf(2400)
    for (const width of [0, 0.5, 1]) {
      const drawn = drawDisplay(display, params, {
        ...PLATE,
        values: { ...STILL, stars: 12, span: 2400, width },
      })
      for (const k of [1, 5, 11])
        expect(
          near(dots(drawn), X0 + sky.time[k] * across, MID + sky.pan[k] * width * REACH),
        ).toBeDefined()
    }
    // Place 11 of this sky is far to the left: above the middle line.
    expect(sky.pan[11]).toBeLessThan(-0.5)
  })

  it('draws the passes Again makes a span later, each as much lower', () => {
    const values = { ...STILL, stars: 3, span: 400, again: 0.5 }
    const drawn = drawDisplay(display, params, { ...PLATE, values })
    const sky = layOut(0, 1)
    const levels = starLevels(sky, 3, 0)
    const across = acrossOf(400)
    const found = dots(drawn)
    for (let k = 0; k < 3; k++) {
      for (let pass = 0; X0 + (pass + sky.time[k]) * across < 220 - 4; pass++) {
        const dot = near(found, X0 + (pass + sky.time[k]) * across, MID + sky.pan[k] * REACH)
        expect(dot, `star ${k}, pass ${pass}`).toBeDefined()
        expect(dot?.r).toBeCloseTo(radiusOf(levels[k] * 0.5 ** pass), 6)
      }
    }
    // With no Again there is the one sky and no more.
    const once = drawDisplay(display, params, { ...PLATE, values: { ...values, again: 0 } })
    expect(dots(once).length).toBe(3 + 1)
    expect(found.length).toBeGreaterThanOrEqual(dots(once).length + 3)
  })

  it('draws a dot as big as Mix lets its star out, and rings where Mix lets nothing out', () => {
    const values = { ...STILL, stars: 5, span: 2400 }
    const sky = layOut(0, 1)
    const levels = starLevels(sky, 5, 0)
    const across = acrossOf(2400)
    const at = (k: number) => [X0 + sky.time[k] * across, MID + sky.pan[k] * REACH] as const
    const half = drawDisplay(display, params, { ...PLATE, values: { ...values, mix: 0.5 } })
    expect(near(dots(half), ...at(2))?.r).toBeCloseTo(radiusOf(levels[2] * Math.SQRT1_2), 6)
    // Mix at 0: nothing of the stars is heard, so no dot; the sky is still there to read and to drag.
    const dry = drawDisplay(display, params, { ...PLATE, values: { ...values, mix: 0 } })
    expect(dots(dry)).toEqual([])
    expect(lights(dry)).toEqual([])
    expect(rings(dry).length).toBe(PLACES)
    for (let k = 0; k < PLACES; k++) expect(near(rings(dry), ...at(k))).toBeDefined()
    expect(point(dry)).toBeDefined()
  })

  it('lays a darker star more faintly: Tone, and Fade on the late ones', () => {
    const values = { ...STILL, stars: 12, span: 2400 }
    const sky = layOut(0, 1)
    const across = acrossOf(2400)
    const strength = (extra: Record<string, number>, k: number): number =>
      near(
        dots(drawDisplay(display, params, { ...PLATE, values: { ...values, ...extra } })),
        X0 + sky.time[k] * across,
        MID + sky.pan[k] * REACH,
      )?.alpha ?? NaN
    expect(strength({ tone: 16000 }, 1)).toBeGreaterThan(strength({ tone: 2000 }, 1))
    expect(strength({ tone: 2000 }, 1)).toBeGreaterThan(strength({ tone: 500 }, 1))
    // Fade darkens the late star (place 1, at three quarters of the span) more than the early one (place 6).
    expect(sky.time[1]).toBeGreaterThan(0.7)
    expect(sky.time[6]).toBeLessThan(0.2)
    const late = strength({ fade: 0 }, 1) - strength({ fade: 1 }, 1)
    const early = strength({ fade: 0 }, 6) - strength({ fade: 1 }, 6)
    expect(late).toBeGreaterThan(2 * early)
    expect(early).toBeGreaterThan(0)
  })

  it('lights a star when the sound that went in gets to it', () => {
    // Two stars of a ladder over one second: place 1 sounds 0.55 s after the note, the last at 1 s.
    const values = { ...STILL, pattern: 3, shuffle: 1, stars: 2, span: 1000 }
    const sky = layOut(3, 1)
    expect(sky.time[1]).toBeCloseTo(0.55, 2)
    const across = acrossOf(1000)
    const first = [X0 + sky.time[1] * across, MID + sky.pan[1] * REACH] as const
    const last = [X0 + across, MID + sky.pan[0] * REACH] as const
    const after = (seconds: number): RecordingContext =>
      runDisplay(
        display,
        params,
        seconds,
        { ...PLATE, values, meters: { span: 1000, clock: 0 } },
        (time) => ({
          signal: time < 0.1 ? testSignal(0.8, 0.5) : testSignal(0, 0),
        }),
      )
    // A third of a second on, the note is on its way and has reached neither.
    const early = after(0.3)
    expect(near(lights(early), ...first)).toBeUndefined()
    expect(near(lights(early), ...last)).toBeUndefined()
    // At 0.57 s it is on the first star and not on the last; at 1.03 s the other way round.
    const middle = after(0.6)
    expect(near(lights(middle), ...first)).toBeDefined()
    expect(near(lights(middle), ...last)).toBeUndefined()
    const late = after(1.05)
    expect(near(lights(late), ...first)).toBeUndefined()
    expect(near(lights(late), ...last)).toBeDefined()
    // Long after, nothing is lit; and nothing is ever lit on a display that is not running.
    expect(lights(after(2.5))).toEqual([])
    expect(lights(drawDisplay(display, params, { ...PLATE, values }))).toEqual([])
  })

  it('draws the glow of the sound on its way only where it has got to', () => {
    const values = { ...STILL, stars: 1, span: 1000 }
    const across = acrossOf(1000)
    const glow = (drawn: RecordingContext): number[] => {
      const columns: number[] = []
      let fill = ''
      for (const call of drawn.calls) {
        if (call.name === 'set fillStyle') fill = String(call.args[0])
        else if (call.name === 'fillRect' && fill === accent) columns.push(Number(call.args[0]))
      }
      return columns
    }
    const drawn = runDisplay(
      display,
      params,
      0.5,
      { ...PLATE, values, meters: { span: 1000, clock: 0 } },
      (time) => ({
        signal: time < 0.1 ? testSignal(0.8, 0.5) : testSignal(0, 0),
      }),
    )
    // The last frame is 0.467 s after the note began: what went in then stands 0.37 to 0.47 of a span across.
    const columns = glow(drawn)
    expect(columns.length).toBeGreaterThan(3)
    expect(Math.min(...columns)).toBeGreaterThan(X0 + 0.3 * across)
    expect(Math.max(...columns)).toBeLessThan(X0 + 0.55 * across)
    // With Mix at 0 no star will sound of it, and nothing glows.
    const dry = runDisplay(display, params, 0.5, {
      ...PLATE,
      values: { ...values, mix: 0 },
      signal: testSignal(),
    })
    expect(glow(dry)).toEqual([])
  })

  it('follows the span the device stands on while it glides, and says it', () => {
    const values = { ...STILL, stars: 6, span: 2400 }
    const sky = layOut(0, 1)
    const across = acrossOf(2400)
    const gliding = drawDisplay(display, params, {
      ...PLATE,
      values,
      meters: { span: 1200, clock: 0 },
    })
    // Half way there the stars stand at half their distance; the point waits where Span will be.
    for (const k of [0, 2, 5])
      expect(
        near(dots(gliding), X0 + sky.time[k] * across * 0.5, MID + sky.pan[k] * REACH),
      ).toBeDefined()
    expect(point(gliding)?.x).toBeCloseTo(X0 + across, 6)
    expect(gliding.words()).toEqual(['1.2 s'])
    expect(patchUnder(gliding, '1.2 s', plate)).not.toBeNull()
    // Arrived, or with no reading yet, the stars stand on the knob's span.
    const readings: Record<string, number>[] = [{ span: 2400, clock: 0 }, {}]
    for (const meters of readings) {
      const there = drawDisplay(display, params, { ...PLATE, values, meters })
      expect(near(dots(there), X0 + sky.time[2] * across, MID + sky.pan[2] * REACH)).toBeDefined()
      expect(there.words()).toEqual(['2.4 s'])
    }
    expect(spanText(100)).toBe('100 ms')
    expect(spanText(999.6)).toBe('1 s')
    expect(spanText(8000)).toBe('8 s')
    expect(spanText(1260)).toBe('1.3 s')
  })

  it('moves each star by its own wander of the clock, drawn large', () => {
    const values = { ...STILL, stars: 12, span: 2400, drift: 1 }
    const sky = layOut(0, 1)
    const across = acrossOf(2400)
    const clock = 0.1234
    const drawn = drawDisplay(display, params, {
      ...PLATE,
      values,
      meters: { span: 2400, clock: clock * DRIFT_PERIOD_SEC },
    })
    const nudges: number[] = []
    for (let k = 1; k < PLACES; k++) {
      // 3 px for the full 6 ms; a star close to the note has less than 6 ms to wander in.
      const nudge = (driftSeconds(1, sky.time[k], 2.4, driftAt(k, clock)) / 0.006) * 3
      nudges.push(nudge)
      expect(
        near(dots(drawn), X0 + sky.time[k] * across + nudge, MID + sky.pan[k] * REACH),
        `star ${k} wanders ${nudge.toFixed(2)} px`,
      ).toBeDefined()
    }
    expect(Math.max(...nudges.map(Math.abs))).toBeGreaterThan(1)
    // Half the Drift is half the wander, and none is none.
    const half = drawDisplay(display, params, {
      ...PLATE,
      values: { ...values, drift: 0.5 },
      meters: { span: 2400, clock: clock * DRIFT_PERIOD_SEC },
    })
    expect(
      near(dots(half), X0 + sky.time[1] * across + nudges[0] / 2, MID + sky.pan[1] * REACH),
    ).toBeDefined()
  })

  it('has one point, on the last star: across is Span, up and down is Width', () => {
    const handlesAt = (values: Record<string, number>, size = PLATE) =>
      display.handles?.(viewOf(display, params, { ...size, values })) ?? []
    const [handle] = handlesAt({})
    expect(handlesAt({}).length).toBe(1)
    const side = layOut(0, 1).pan[0]
    expect(handle.x).toBeCloseTo(X0 + acrossOf(2400), 6)
    expect(handle.y).toBeCloseTo(MID + side * 0.8 * REACH, 6)
    // It is drawn where it is said to stand.
    const drawn = drawDisplay(display, params, { ...PLATE })
    expect(point(drawn)?.x).toBeCloseTo(handle.x, 6)
    expect(point(drawn)?.y).toBeCloseTo(handle.y, 6)
    // Taken and not moved it changes nothing.
    expect(handle.drag(handle.x, handle.y)).toEqual({ span: 2400, width: 0.8 })
    // Across: the knob's own taper between a fifth and 0.72 of the way, so every span can be reached.
    expect(handle.drag(X0 + 0.2 * ROOM, handle.y).span).toBeCloseTo(100, 6)
    expect(handle.drag(X0 + 0.72 * ROOM, handle.y).span).toBeCloseTo(8000, 6)
    expect(handle.drag(X0 + 0.46 * ROOM, handle.y).span).toBeCloseTo(Math.sqrt(100 * 8000), 3)
    expect(handle.drag(0, handle.y).span).toBe(100)
    expect(handle.drag(224, handle.y).span).toBe(8000)
    expect(handle.drag(handle.x + 10, handle.y).width).toBe(0.8)
    // Up and down: from the middle line (no width) out to where the last star stands at full width.
    expect(handle.drag(handle.x, MID).width).toBe(0)
    expect(handle.drag(handle.x, MID + side * REACH).width).toBeCloseTo(1, 9)
    expect(handle.drag(handle.x, MID + side * REACH * 0.25).width).toBeCloseTo(0.25, 9)
    expect(handle.drag(handle.x, MID + side * 40).width).toBe(1)
    expect(handle.drag(handle.x, MID - side * 10).width).toBe(0)
    expect(handle.drag(handle.x, MID).span).toBe(2400)
    // A sky whose last star is on the other side has its point on the other side of the line.
    const other = [...Array(16).keys()]
      .map((n) => n + 1)
      .find((seed) => layOut(0, seed).pan[0] === -side)
    expect(other).toBeDefined()
    const [mirrored] = handlesAt({ shuffle: other ?? 1 })
    expect(mirrored.y - MID).toBeCloseTo(-(handle.y - MID), 6)
    expect(mirrored.drag(mirrored.x, MID - side * REACH * 0.5).width).toBeCloseTo(0.5, 9)
    // The wheel lights one more star or puts one out, and stops at one and at twelve.
    expect(handle.wheel?.(1)).toEqual({ stars: 8 })
    expect(handle.wheel?.(-3)).toEqual({ stars: 6 })
    expect(handlesAt({ stars: 12 })[0].wheel?.(1)).toEqual({ stars: 12 })
    expect(handlesAt({ stars: 1 })[0].wheel?.(-1)).toEqual({ stars: 1 })
    expect(handle.reset?.()).toEqual({ span: 2400, width: 0.8 })
    // The ring grows with the dot it stands round, so the loudest single star is still inside it.
    const single = drawDisplay(display, params, { ...PLATE, values: { ...STILL, stars: 1 } })
    expect(point(single)?.r).toBeCloseTo(radiusOf(1) + 2, 6)
    expect(point(drawDisplay(display, params, { ...PLATE, values: { mix: 0 } }))?.r).toBe(3.5)
    // In hand it is filled with the accent.
    const hot = drawDisplay(display, params, { ...PLATE, hot: 'last' })
    expect(point(hot)).toBeUndefined()
    expect(near(lights(hot), handle.x, handle.y)).toBeDefined()
  })

  it('reads at the two sizes a plate gives it, every star inside the picture', () => {
    for (const size of [
      { width: 224, height: 48 },
      { width: 204, height: 100 },
    ]) {
      const box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
      const settings: Record<string, number>[] = [
        {},
        { stars: 12, pattern: 2, width: 1, mix: 1, again: 0.9, span: 150 },
      ]
      for (const values of settings) {
        const drawn = runDisplay(display, params, 0.3, {
          ...size,
          values,
          meters: { span: 0, clock: 77 },
          signal: testSignal(),
        })
        const all = [...dots(drawn), ...rings(drawn)]
        expect(all.length).toBeGreaterThan(PLACES)
        for (const round of all) {
          // Up and down every star is whole; across, the box cuts what runs past its end.
          expect(round.y - round.r).toBeGreaterThanOrEqual(box.y)
          expect(round.y + round.r).toBeLessThanOrEqual(box.y + box.h)
          expect(round.x).toBeGreaterThan(box.x)
        }
        const [handle] = display.handles?.(viewOf(display, params, { ...size, values })) ?? []
        const drawnPoint = point(drawn)
        expect(drawnPoint?.x).toBeCloseTo(handle.x, 6)
        expect(drawnPoint?.y).toBeCloseTo(handle.y, 6)
        expect((drawnPoint?.y ?? 0) - (drawnPoint?.r ?? 0)).toBeGreaterThanOrEqual(box.y)
        expect((drawnPoint?.y ?? 0) + (drawnPoint?.r ?? 0)).toBeLessThanOrEqual(box.y + box.h)
        // One word, the span, at the top right on a patch of the plate.
        expect(drawn.words().length).toBe(1)
        expect(patchUnder(drawn, drawn.words()[0], plate)).not.toBeNull()
      }
    }
    // On the taller strip the sides are further apart: there is more room to tell them.
    const sky = layOut(0, 1)
    const tall = drawDisplay(display, params, {
      width: 204,
      height: 100,
      values: { ...STILL, stars: 12 },
    })
    const ys = dots(tall).map((dot) => dot.y)
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(60)
    expect(sky.pan.some((pan) => pan < -0.7) && sky.pan.some((pan) => pan > 0.7)).toBe(true)
  })

  it('stands still when the device is switched off', () => {
    const on = runDisplay(display, params, 1, {
      ...PLATE,
      signal: testSignal(),
      meters: { span: 2400, clock: 3 },
    })
    const off = runDisplay(display, params, 1, {
      ...PLATE,
      signal: testSignal(),
      meters: { span: 2400, clock: 3 },
      powered: false,
    })
    expect(lights(on).length).toBeGreaterThan(0)
    expect(lights(off)).toEqual([])
    expect(dots(off).length).toBe(dots(on).length)
  })
})
