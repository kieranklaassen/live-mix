// The truth of Skipping Stone's display: the landings come when the device
// plays them, an arc is as wide as its gap and as high as its landing is loud
// on each side, a ring is as wide as Ripple has spread it, each point sets the
// knob whose picture lies under the hand, and what is lit is what the device
// wrote, where it is in its flight.

import { describe, expect, it } from 'vitest'

import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  MAX_THROW_SEC,
  MIN_GAP_SEC,
  MOST_LANDINGS,
  RANGE_DB,
  SINK_OCTAVES,
  SKIPPING_STONE_FACES,
  heightOf,
  inkOf,
  ringOf,
  spanOf,
  throwOf,
  thrownOf,
} from '../components/displays/skipping-stone'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const face = SKIPPING_STONE_FACES['skipping-stone']
const display = face.display
const params = stockDescriptors().get('skipping-stone')?.params ?? {}
const { ink, accent } = PLAIN_COLOURS

/** The layout of a strip at rest, as `layOf` in the display has it. */
const size = viewOf(display, params)
const HAND = 4 + 9
const RIGHT = size.width - 4 - 2
const REACH = RIGHT - HAND
const WATER = Math.round(size.height / 2)
const RISE = Math.min(WATER - 4, size.height - 4 - WATER) - 1
const xOf = (seconds: number, span: number): number => HAND + (seconds / span) * REACH

/** device.json: the defaults. */
const FIRST_MS = 320
const BOUNCE = 0.8
const SKIPS = 8
const LOSS_DB = 2.5
const SINK = 0.3
const THROW = 0.6
const RIPPLE = 0.35
const MIX = 0.35
/** Mix at equal power: the gain of the skips. */
const wetOf = (mix: number): number => Math.sin((mix * Math.PI) / 2)

interface Mark {
  kind: 'stroke' | 'fill' | 'rect'
  colour: string
  alpha: number
  width: number
  points: [number, number][]
  /** An ellipse's middle and its two half widths. */
  ellipse: number[] | null
  /** A circle's middle and its radius. */
  circle: number[] | null
  /** A rectangle's corner and size. */
  rect: number[] | null
}

/** Everything that put ink down, with the colour it was painted in. */
function marks(drawn: RecordingContext): Mark[] {
  const out: Mark[] = []
  let points: [number, number][] = []
  let ellipse: number[] | null = null
  let circle: number[] | null = null
  const now = { fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1 }
  for (const call of drawn.calls) {
    const numbers = call.args as number[]
    if (call.name === 'beginPath') {
      points = []
      ellipse = null
      circle = null
    } else if (call.name === 'moveTo' || call.name === 'lineTo')
      points.push([numbers[0], numbers[1]])
    else if (call.name === 'ellipse') ellipse = numbers.slice(0, 4)
    else if (call.name === 'arc') circle = numbers.slice(0, 3)
    else if (call.name === 'set fillStyle') now.fillStyle = String(call.args[0])
    else if (call.name === 'set strokeStyle') now.strokeStyle = String(call.args[0])
    else if (call.name === 'set globalAlpha') now.globalAlpha = numbers[0]
    else if (call.name === 'set lineWidth') now.lineWidth = numbers[0]
    else if (call.name === 'stroke' || call.name === 'fill')
      out.push({
        kind: call.name,
        colour: call.name === 'fill' ? now.fillStyle : now.strokeStyle,
        alpha: now.globalAlpha,
        width: now.lineWidth,
        points: [...points],
        ellipse,
        circle,
        rect: null,
      })
    else if (call.name === 'fillRect')
      out.push({
        kind: 'rect',
        colour: now.fillStyle,
        alpha: now.globalAlpha,
        width: now.lineWidth,
        points: [],
        ellipse: null,
        circle: null,
        rect: numbers.slice(0, 4),
      })
  }
  return out
}

interface Arc {
  from: number
  to: number
  /** How far its top stands from the water: up is positive, the left side. */
  peak: number
  /** How many pieces the line is made of. */
  steps: number
  alpha: number
  width: number
}

/** The flights: every line of three points or more, in the order drawn. */
function arcs(drawn: RecordingContext, water = WATER): Arc[] {
  return marks(drawn)
    .filter((mark) => mark.kind === 'stroke' && mark.colour === ink && mark.points.length >= 3)
    .map((mark) => {
      let peak = 0
      for (const [, y] of mark.points) if (Math.abs(water - y) > Math.abs(peak)) peak = water - y
      return {
        from: mark.points[0][0],
        to: mark.points[mark.points.length - 1][0],
        peak,
        steps: mark.points.length - 1,
        alpha: mark.alpha,
        width: mark.width,
      }
    })
}

/** The rings on the water, stroked in ink: where, how wide, how strong. */
function rings(drawn: RecordingContext): { x: number; wide: number; alpha: number }[] {
  return marks(drawn)
    .filter((mark) => mark.kind === 'stroke' && mark.colour === ink && mark.ellipse !== null)
    .map((mark) => ({ x: mark.ellipse?.[0] ?? 0, wide: mark.ellipse?.[2] ?? 0, alpha: mark.alpha }))
}

/** The points a hand takes: the circles, in the order drawn. */
function dots(drawn: RecordingContext): { x: number; y: number }[] {
  return marks(drawn)
    .filter((mark) => mark.kind === 'stroke' && mark.circle !== null)
    .map((mark) => ({ x: mark.circle?.[0] ?? 0, y: mark.circle?.[1] ?? 0 }))
}

/** Everything painted in the second colour. */
const lit = (drawn: RecordingContext): Mark[] =>
  marks(drawn).filter((mark) => mark.colour === accent)

function handleOf(key: string, options: FrameOptions = {}): DisplayHandle {
  const found = display.handles?.(viewOf(display, params, options)).find((one) => one.key === key)
  if (!found) throw new Error(`no handle ${key}`)
  return found
}

/** The top of a skip's arc drawn in `steps` pieces, against its full height. */
const topOf = (steps: number): number => {
  let top = 0
  for (let i = 0; i <= steps; i++) top = Math.max(top, 4 * (i / steps) * (1 - i / steps))
  return top
}

describe('the throw (skipping_stone.h `landings`)', () => {
  it('copies the constants of the device', () => {
    // skipping_stone.h: kMaxLandings 16, kMinGapSeconds 0.002f, kMaxThrowSeconds 20.0f, kSinkOctaves 0.6f.
    expect(MOST_LANDINGS).toBe(16)
    expect(MIN_GAP_SEC).toBe(0.002)
    expect(MAX_THROW_SEC).toBe(20)
    expect(SINK_OCTAVES).toBe(0.6)
  })

  it.each([0.6, 1, 1.3])('lands on the geometric series for a bounce of %s', (bounce) => {
    const { seconds, count } = throwOf(300, bounce, 10)
    expect(count).toBe(10)
    let at = 0
    for (let k = 0; k < 10; k++) {
      at += 0.3 * Math.pow(bounce, k)
      expect(seconds[k]).toBeCloseTo(at, 5)
    }
  })

  it('ends when a gap is too short to tell apart or a landing comes too late', () => {
    // Gaps of 20, 10, 5 and 2.5 ms; the next, 1.25 ms, is under the 2 ms the device plays.
    expect(throwOf(20, 0.5, 16).count).toBe(4)
    // Landings at 2, 5, 9.5 and 16.25 s; the next would come at 26.4 s, past the 20 the device holds.
    const far = throwOf(2000, 1.5, 16)
    expect(far.count).toBe(4)
    expect(far.seconds[3]).toBeCloseTo(16.25, 4)
    expect(throwOf(320, 0.8, 16).count).toBe(16)
    expect(throwOf(320, 0.8, 3).count).toBe(3)
  })

  it('gives each landing the level, the side, the rings and the dullness the device does', () => {
    const { landings, total, wet, again } = thrownOf(viewOf(display, params))
    expect(landings).toHaveLength(SKIPS)
    expect(wet).toBeCloseTo(wetOf(MIX), 9)
    expect(again).toBe(0)
    const times = Array.from(
      { length: SKIPS },
      (_, k) => ((FIRST_MS / 1000) * (1 - Math.pow(BOUNCE, k + 1))) / (1 - BOUNCE),
    )
    expect(total).toBeCloseTo(times[SKIPS - 1], 5)
    landings.forEach((landing, k) => {
      expect(landing.at).toBeCloseTo(times[k], 5)
      // Loss, skip by skip.
      expect(landing.gain).toBeCloseTo(Math.pow(10, (-LOSS_DB * k) / 20), 9)
      // Ripple keeps `1 - ripple` of the power sharp at every skip.
      expect(landing.rings).toBeCloseTo(1 - Math.pow(1 - RIPPLE, k), 9)
      expect(landing.octaves).toBeCloseTo(SINK * 0.6 * k, 9)
      // The stone crosses at a steady speed: its place is its time between the first landing and the last.
      const across = (2 * (times[k] - times[0])) / (times[SKIPS - 1] - times[0]) - 1
      const angle = ((THROW * across + 1) * Math.PI) / 4
      expect(landing.left).toBeCloseTo(Math.cos(angle), 5)
      expect(landing.right).toBeCloseTo(Math.sin(angle), 5)
      expect(landing.left ** 2 + landing.right ** 2).toBeCloseTo(1, 9)
    })
  })

  it('carries the skips from one side to the other with Throw', () => {
    const right = thrownOf(viewOf(display, params, { values: { throw: 1 } })).landings
    expect(right[0].left).toBeCloseTo(1, 9)
    expect(right[0].right).toBeCloseTo(0, 9)
    expect(right[SKIPS - 1].left).toBeCloseTo(0, 6)
    expect(right[SKIPS - 1].right).toBeCloseTo(1, 9)
    const left = thrownOf(viewOf(display, params, { values: { throw: -1 } })).landings
    expect(left[0].right).toBeCloseTo(1, 9)
    expect(left[SKIPS - 1].left).toBeCloseTo(1, 9)
    for (const landing of thrownOf(viewOf(display, params, { values: { throw: 0 } })).landings) {
      expect(landing.left).toBeCloseTo(Math.SQRT1_2, 9)
      expect(landing.right).toBeCloseTo(Math.SQRT1_2, 9)
    }
  })
})

describe('the scale', () => {
  it('is the shortest step that holds the throw with a little room after it', () => {
    expect(spanOf(1.33)).toBe(2)
    expect(spanOf(0.92)).toBe(1)
    expect(spanOf(0.93)).toBe(2)
    expect(spanOf(0.05)).toBe(0.0625)
    expect(spanOf(16.25)).toBe(32)
    expect(spanOf(40)).toBe(32)
  })

  it('reads a level by its decibels: full scale at the top, 30 dB under it on the water', () => {
    expect(RANGE_DB).toBe(30)
    expect(heightOf(1)).toBe(1)
    expect(heightOf(Math.pow(10, -15 / 20))).toBeCloseTo(0.5, 9)
    expect(heightOf(Math.pow(10, -30 / 20))).toBeCloseTo(0, 9)
    expect(heightOf(0)).toBe(0)
    expect(heightOf(4)).toBe(1)
  })
})

describe('the picture', () => {
  /** The arcs a throw should have: per landing the left side over the water, then the right under it. */
  function expected(options: FrameOptions = {}): Omit<Arc, 'steps' | 'alpha'>[] {
    const thrown = thrownOf(viewOf(display, params, options))
    const span = spanOf(thrown.total)
    const out: Omit<Arc, 'steps' | 'alpha'>[] = []
    let from = HAND
    for (const landing of thrown.landings) {
      const to = xOf(landing.at, span)
      for (const [side, sign] of [
        [landing.left, 1],
        [landing.right, -1],
      ]) {
        const tall = heightOf(thrown.wet * landing.gain * side) * RISE
        if (tall > 0) out.push({ from, to, peak: sign * tall, width: 1.5 })
      }
      from = to
    }
    return out
  }

  it.each([
    ['at the defaults', {}],
    ['slowing down', { bounce: 1.25, first: 120, skips: 9 }],
    ['thrown to the left', { throw: -1, loss: 1 }],
    ['all the way up', { mix: 1, loss: 0, throw: 0 }],
  ])('draws every skip as wide as its gap and as high as it is loud, %s', (_name, values) => {
    const want = expected({ values })
    const drawn = arcs(drawDisplay(display, params, { values }))
    expect(drawn).toHaveLength(want.length)
    expect(want.length).toBeGreaterThan(3)
    drawn.forEach((arc, i) => {
      expect(arc.from).toBeCloseTo(want[i].from, 6)
      expect(arc.to).toBeCloseTo(want[i].to, 6)
      expect(arc.width).toBe(1.5)
      // The first flight falls from the hand: its top is where it starts. A skip rises and falls.
      const first = arc.from === HAND
      expect(arc.peak).toBeCloseTo(want[i].peak * (first ? 1 : topOf(arc.steps)), 6)
    })
  })

  it('lays the left side over the water and the right side under it', () => {
    const drawn = arcs(drawDisplay(display, params, { values: { throw: 1, loss: 0, mix: 1 } }))
    // Thrown hard right: the first landing is all left, the last is all right.
    expect(drawn[0].peak).toBeCloseTo(RISE, 6)
    expect(drawn[0].from).toBe(HAND)
    const last = drawn[drawn.length - 1]
    expect(last.peak).toBeLessThan(0)
    expect(-last.peak / topOf(last.steps)).toBeGreaterThan(0.95 * RISE)
    // In between the left side falls as the right side rises.
    const ups = drawn.filter((arc) => arc.peak > 0).map((arc) => arc.peak / topOf(arc.steps))
    const downs = drawn.filter((arc) => arc.peak < 0).map((arc) => -arc.peak / topOf(arc.steps))
    for (let i = 2; i < ups.length; i++) expect(ups[i]).toBeLessThan(ups[i - 1])
    for (let i = 1; i < downs.length; i++) expect(downs[i]).toBeGreaterThan(downs[i - 1])
  })

  it('makes a longer gap a wider arc, pixel for millisecond, within one step of the scale', () => {
    const short = arcs(drawDisplay(display, params, { values: { first: 250 } }))
    const long = arcs(drawDisplay(display, params, { values: { first: 400 } }))
    // Both throws lie on the two second scale.
    expect(short[0].to - short[0].from).toBeCloseTo((0.25 / 2) * REACH, 4)
    expect(long[0].to - long[0].from).toBeCloseTo((0.4 / 2) * REACH, 4)
    // The second gap is Bounce of the first.
    expect(long[2].to - long[2].from).toBeCloseTo(((0.4 * BOUNCE) / 2) * REACH, 4)
  })

  it('draws a landing fainter the duller Sink has made it', () => {
    const open = arcs(drawDisplay(display, params, { values: { sink: 0, throw: 0, loss: 0 } }))
    for (const arc of open) expect(arc.alpha).toBe(INK.trace)
    const sunk = arcs(drawDisplay(display, params, { values: { sink: 1, throw: 0, loss: 0 } }))
    expect(sunk).toHaveLength(2 * SKIPS)
    sunk.forEach((arc, i) => {
      const k = Math.floor(i / 2)
      expect(arc.alpha).toBeCloseTo(inkOf(0.6 * k), 9)
    })
    expect(inkOf(0)).toBe(INK.trace)
    expect(inkOf(2.5)).toBeCloseTo((INK.trace + 0.35) / 2, 9)
    expect(inkOf(5)).toBeCloseTo(0.35, 9)
    expect(inkOf(9)).toBeCloseTo(0.35, 9)
  })

  it('lays a ring where each skip lands, wider the more of it Ripple has turned into rings', () => {
    const span = 2
    const { landings } = thrownOf(viewOf(display, params))
    const drawn = rings(drawDisplay(display, params))
    expect(drawn).toHaveLength(SKIPS)
    drawn.forEach((ring, k) => {
      expect(ring.x).toBeCloseTo(xOf(landings[k].at, span), 6)
      expect(ring.wide).toBeCloseTo(ringOf(1 - Math.pow(1 - RIPPLE, k)), 9)
      expect(ring.alpha).toBe(INK.text)
    })
    // The first landing is always sharp; with Ripple all the way up every later one is all rings.
    const all = rings(drawDisplay(display, params, { values: { ripple: 1 } }))
    expect(all[0].wide).toBe(ringOf(0))
    for (const ring of all.slice(1)) expect(ring.wide).toBe(ringOf(1))
    for (const ring of rings(drawDisplay(display, params, { values: { ripple: 0 } })))
      expect(ring.wide).toBe(ringOf(0))
    expect(ringOf(0)).toBe(1.5)
    expect(ringOf(0.25)).toBeCloseTo(1.5 + 5.5 / 2, 9)
    expect(ringOf(1)).toBe(7)
  })

  it('throws again from the last landing with Again, that much softer', () => {
    expect(arcs(drawDisplay(display, params)).every((arc) => arc.width === 1.5)).toBe(true)
    const values = { again: 0.5, throw: 0, loss: 1, sink: 0, skips: 4, mix: 1 }
    const thrown = thrownOf(viewOf(display, params, { values }))
    const span = spanOf(thrown.total)
    const drawn = arcs(drawDisplay(display, params, { values }))
    const next = drawn.filter((arc) => arc.width === 1)
    expect(next.length).toBeGreaterThan(0)
    // The next throw starts where the first ended and its first skip lands First after that.
    expect(next[0].from).toBeCloseTo(xOf(thrown.total, span), 6)
    expect(next[0].to).toBeCloseTo(xOf(thrown.total + thrown.landings[0].at, span), 6)
    expect(next[0].peak / topOf(next[0].steps)).toBeCloseTo(heightOf(0.5 * Math.SQRT1_2) * RISE, 6)
    // The first throw is not changed by it.
    const first = drawn.filter((arc) => arc.width === 1.5)
    expect(first[0].peak).toBeCloseTo(heightOf(Math.SQRT1_2) * RISE, 6)
    expect(first).toHaveLength(8)
  })

  it('draws only what Mix lets be heard, and still reads the device with Mix at zero', () => {
    const half = arcs(drawDisplay(display, params, { values: { mix: 0.5 } }))
    const full = arcs(drawDisplay(display, params, { values: { mix: 1 } }))
    expect(Math.abs(half[0].peak)).toBeLessThan(Math.abs(full[0].peak))
    expect(half[0].peak).toBeCloseTo(
      heightOf(wetOf(0.5) * thrownOf(viewOf(display, params)).landings[0].left) * RISE,
      6,
    )
    const none = drawDisplay(display, params, { values: { mix: 0 } })
    expect(arcs(none)).toHaveLength(0)
    // The landings still stand where the device would play them, and the points with them.
    expect(rings(none)).toHaveLength(SKIPS)
    expect(dots(none)).toHaveLength(3)
    expect(none.words()).toContain('320 ms')
  })

  it('says the first landing in words, and what a point in hand sets', () => {
    expect(drawDisplay(display, params).words()).toEqual(['L', 'R', '320 ms'])
    expect(drawDisplay(display, params, { values: { first: 1400 } }).words()).toContain('1.40 s')
    expect(drawDisplay(display, params, { hot: 'bounce' }).words()).toContain('×0.80')
    expect(drawDisplay(display, params, { hot: 'loss' }).words()).toContain('2.5 dB')
    // A picture too narrow for the letters of the sides leaves them out.
    expect(drawDisplay(display, params, { width: 100, height: 40 }).words()).toEqual(['320 ms'])
  })

  it('lays itself out from the size it is given', () => {
    const drawn = drawDisplay(display, params, { width: 204, height: 100, values: { mix: 1 } })
    // Upright: the water line is half way down and a side is 45 high.
    const rise = 45
    const first = arcs(drawn, 50)[0]
    expect(first.from).toBe(HAND)
    expect(first.to).toBeCloseTo(HAND + (0.32 / 2) * (204 - 6 - HAND), 4)
    expect(first.peak).toBeCloseTo(
      heightOf(thrownOf(viewOf(display, params)).landings[0].left) * rise,
      6,
    )
    for (const ring of rings(drawn)) expect(ring.x).toBeLessThan(204 - 6)
  })
})

describe('the points', () => {
  it('has a point for First, Bounce and Loss, each with a way back', () => {
    const handles = display.handles?.(viewOf(display, params)) ?? []
    expect(handles.map((one) => one.key)).toEqual(['first', 'bounce', 'loss'])
    expect(handleOf('first').reset?.()).toEqual({ first: FIRST_MS })
    expect(handleOf('bounce').reset?.()).toEqual({ bounce: BOUNCE })
    expect(handleOf('loss').reset?.()).toEqual({ loss: LOSS_DB })
    expect(face.face).toEqual(['first', 'skips', 'ripple', 'mix'])
  })

  it('stands where the picture is, and is drawn there', () => {
    const first = handleOf('first')
    const bounce = handleOf('bounce')
    const loss = handleOf('loss')
    expect(first.x).toBeCloseTo(xOf(0.32, 2), 4)
    expect(first.y).toBe(WATER)
    expect(bounce.x).toBeCloseTo(xOf(0.32 * 1.8, 2), 4)
    expect(bounce.y).toBe(WATER)
    // The top of the second landing's arc, on the side it is louder on: here the left, over the water.
    const second = thrownOf(viewOf(display, params)).landings[1]
    expect(second.left).toBeGreaterThan(second.right)
    expect(loss.x).toBeCloseTo((first.x + bounce.x) / 2, 9)
    expect(loss.y).toBeCloseTo(
      WATER - heightOf(wetOf(MIX) * Math.pow(10, -LOSS_DB / 20) * second.left) * RISE,
      6,
    )
    const drawn = dots(drawDisplay(display, params))
    expect(drawn).toHaveLength(3)
    expect(drawn[0]).toEqual({ x: first.x, y: first.y })
    expect(drawn[1]).toEqual({ x: bounce.x, y: bounce.y })
    expect(drawn[2]).toEqual({ x: loss.x, y: loss.y })
    // Thrown the other way the second landing is louder on the right: its point lies under the water.
    expect(handleOf('loss', { values: { throw: -0.6 } }).y).toBeCloseTo(2 * WATER - loss.y, 6)
  })

  it('sets First to the time under the hand', () => {
    const handle = handleOf('first')
    // Taken and not moved: nothing changes.
    expect(handle.drag(handle.x, handle.y, {})).toEqual({ first: FIRST_MS })
    for (const x of [30, 44, 60, 75]) {
      const first = handle.drag(x, WATER, {}).first
      expect(first).toBeCloseTo(((x - HAND) / REACH) * 2000, 6)
      // Drag there, value there: with the throw still on the two second scale its point is under the hand.
      if (spanOf(thrownOf(viewOf(display, params, { values: { first } })).total) === 2)
        expect(handleOf('first', { values: { first } }).x).toBeCloseTo(x, 6)
    }
    expect(handle.drag(-400, 0, {}).first).toBe(20)
    expect(handle.drag(900, 0, {}).first).toBe(2000)
  })

  it('keeps the scale a point was taken on for as long as it is held', () => {
    const hold: DisplayHold = {}
    const taken = handleOf('first')
    expect(taken.drag(taken.x, taken.y, hold)).toEqual({ first: FIRST_MS })
    // The hand goes right: at 600 ms the whole throw no longer fits two seconds.
    const x = xOf(0.6, 2)
    expect(taken.drag(x, WATER, hold).first).toBeCloseTo(600, 6)
    const values = { first: 600 }
    expect(spanOf(thrownOf(viewOf(display, params, { values })).total)).toBe(4)
    // The next move is solved on the scale it was taken on, not on the one the throw now fits.
    const held = handleOf('first', { values })
    expect(held.drag(x + 10, WATER, hold).first).toBeCloseTo(600 + (10 / REACH) * 2000, 6)
    expect(held.drag(x + 10, WATER, {}).first).toBeCloseTo(((x + 10 - HAND) / REACH) * 4000, 6)
    // And the picture keeps it too: in hand the landing stays under the pointer, let go it is fitted again.
    const state = display.init?.()
    drawDisplay(display, params, { state })
    const inHand = drawDisplay(display, params, { state, values, dragging: true, hot: 'first' })
    expect(rings(inHand)[0].x).toBeCloseTo(x, 4)
    expect(dots(inHand)[0].x).toBeCloseTo(x, 4)
    const letGo = drawDisplay(display, params, { state, values })
    expect(rings(letGo)[0].x).toBeCloseTo(xOf(0.6, 4), 4)
  })

  it('draws a point whose landing has left the picture at its edge', () => {
    const state = display.init?.()
    drawDisplay(display, params, { state, values: { first: 20, bounce: 0.5 } })
    // Taken on a scale of an eighth of a second and carried far to the right.
    const drawn = dots(
      drawDisplay(display, params, { state, values: { first: 1000 }, dragging: true }),
    )
    expect(drawn.map((dot) => dot.x)).toEqual([RIGHT, RIGHT, RIGHT])
  })

  it('sets Bounce to the gap under the hand against the first', () => {
    const handle = handleOf('bounce')
    expect(handle.drag(handle.x, handle.y, {})).toEqual({ bounce: BOUNCE })
    for (const x of [58, 62, 70]) {
      const bounce = handle.drag(x, WATER, {}).bounce
      // The second landing comes First x (1 + Bounce) after the sound.
      expect(bounce).toBeCloseTo((((x - HAND) / REACH) * 2000 - FIRST_MS) / FIRST_MS, 6)
      if (spanOf(thrownOf(viewOf(display, params, { values: { bounce } })).total) === 2)
        expect(handleOf('bounce', { values: { bounce } }).x).toBeCloseTo(x, 5)
    }
    expect(handle.drag(-400, 0, {}).bounce).toBe(0.5)
    expect(handle.drag(900, 0, {}).bounce).toBe(1.5)
  })

  it('sets Loss to the height under the hand', () => {
    const handle = handleOf('loss')
    expect(handle.drag(handle.x, handle.y, {})).toEqual({ loss: LOSS_DB })
    const none = handleOf('loss', { values: { loss: 0 } }).y
    const most = handleOf('loss', { values: { loss: 12 } }).y
    expect(none).toBeLessThan(handle.y)
    expect(most).toBeGreaterThan(handle.y)
    for (const y of [none + 1, none + 3, most - 2, most]) {
      const loss = handle.drag(handle.x, y, {}).loss
      expect(loss).toBeGreaterThanOrEqual(0)
      expect(loss).toBeLessThanOrEqual(12)
      // Drag there, value there.
      expect(handleOf('loss', { values: { loss } }).y).toBeCloseTo(y, 6)
    }
    // A pixel is 30 dB over the height of a side.
    const one = handle.drag(handle.x, handle.y + 1, {}).loss - LOSS_DB
    expect(one).toBeCloseTo(RANGE_DB / RISE, 6)
    expect(handle.drag(handle.x, -400, {}).loss).toBe(0)
    expect(handle.drag(handle.x, 900, {}).loss).toBe(12)
    // On the right side the hand goes down for less loss.
    const under = handleOf('loss', { values: { throw: -0.6 } })
    expect(under.drag(under.x, under.y - 1, {}).loss - LOSS_DB).toBeCloseTo(RANGE_DB / RISE, 6)
  })

  it('takes an arc that lies under the scale from the water line, as far under as it lay', () => {
    // With little of the skips in the mix and all the loss, the second landing is under the 30 dB drawn.
    const values = { mix: 0.05, loss: 12 }
    const handle = handleOf('loss', { values })
    expect(handle.y).toBe(WATER)
    const second = thrownOf(viewOf(display, params, { values })).landings[1]
    const under = 20 * Math.log10(wetOf(0.05) * second.left) - 12 + RANGE_DB
    expect(under).toBeLessThan(0)
    const hold: DisplayHold = {}
    expect(handle.drag(handle.x, handle.y, hold)).toEqual({ loss: 12 })
    // A pixel up is a pixel's worth less loss, from the loss it had.
    expect(handle.drag(handle.x, WATER - 1, hold).loss).toBeCloseTo(12 - RANGE_DB / RISE, 6)
    expect(handle.drag(handle.x, WATER - 2, hold).loss).toBeCloseTo(12 - (2 * RANGE_DB) / RISE, 6)
    // With nothing of the skips in the mix there is no arc to move: the hand changes nothing.
    const flat = handleOf('loss', { values: { mix: 0 } })
    expect(flat.drag(flat.x, 0, {})).toEqual({ loss: LOSS_DB })
    expect(flat.drag(flat.x, 40, {})).toEqual({ loss: LOSS_DB })
  })
})

describe('what is lit (meters `level` and `clock`)', () => {
  /** A burst a tenth of a second long, then silence; the device's clock runs with the display's. */
  const burst = (seconds: number, options: FrameOptions = {}): RecordingContext =>
    runDisplay(display, params, seconds, options, (time) => ({
      meters: { clock: time, level: time < 0.1 ? 0.5 : 0 },
    }))

  it('lays the sound along the arcs where it is in its flight', () => {
    const seconds = 1
    const drawn = burst(seconds)
    const specks = lit(drawn).filter((mark) => mark.rect !== null && mark.rect[2] === 2)
    expect(specks.length).toBeGreaterThan(2)
    // The burst was written between 0.87 and 0.97 s before the last frame: it lies that far along the throw.
    const last = seconds - 1 / 30
    for (const speck of specks) {
      const x = (speck.rect?.[0] ?? 0) + 1
      expect(x).toBeGreaterThan(xOf(last - 0.1, 2) - 3)
      expect(x).toBeLessThan(xOf(last, 2) + 3)
    }
    // Half a second earlier it lay half a second nearer the hand.
    const early = lit(burst(0.5)).filter((mark) => mark.rect !== null && mark.rect[2] === 2)
    expect(early.length).toBeGreaterThan(2)
    for (const speck of early) {
      const x = (speck.rect?.[0] ?? 0) + 1
      expect(x).toBeGreaterThan(xOf(0.5 - 1 / 30 - 0.1, 2) - 3)
      expect(x).toBeLessThan(xOf(0.5 - 1 / 30, 2) + 3)
    }
  })

  it('lights a ring as its landing sounds', () => {
    // The fourth landing comes 0.945 s after the sound: the burst is on it at one second.
    const { landings } = thrownOf(viewOf(display, params))
    expect(landings[3].at).toBeCloseTo(0.9446, 3)
    const filled = lit(burst(1)).filter((mark) => mark.kind === 'fill' && mark.ellipse !== null)
    expect(filled).toHaveLength(1)
    expect(filled[0].ellipse?.[0]).toBeCloseTo(xOf(landings[3].at, 2), 6)
    // Before any landing has sounded no ring is lit.
    const before = lit(burst(0.25)).filter((mark) => mark.kind === 'fill' && mark.ellipse !== null)
    expect(before).toHaveLength(0)
  })

  it('shows the level thrown now at the hand', () => {
    const drawn = runDisplay(display, params, 0.2, {}, (time) => ({
      meters: { clock: time, level: 0.5 },
    }))
    const bar = lit(drawn).find((mark) => mark.rect !== null && mark.rect[0] === HAND - 1)
    const tall = heightOf(0.5) * RISE
    expect(bar?.rect?.[1]).toBeCloseTo(WATER - tall, 6)
    expect(bar?.rect?.[3]).toBeCloseTo(2 * tall, 6)
  })

  it('lights nothing when the device is asleep, switched off, or has no readings', () => {
    const asleep = runDisplay(display, params, 0.5, { meters: { clock: -1, level: 0.5 } })
    expect(lit(asleep)).toHaveLength(0)
    const off = runDisplay(display, params, 0.5, { powered: false }, (time) => ({
      meters: { clock: time, level: 0.5 },
    }))
    expect(lit(off)).toHaveLength(0)
    expect(lit(drawDisplay(display, params))).toHaveLength(0)
    // The picture of the settings is the same asleep and awake.
    expect(arcs(asleep)).toEqual(arcs(drawDisplay(display, params)))
  })

  it('forgets what it held when the device goes to sleep', () => {
    const state = display.init?.()
    runDisplay(display, params, 0.5, { state }, (time) => ({
      meters: { clock: time, level: 0.5 },
    }))
    runDisplay(display, params, 0.1, { state, now: 11, meters: { clock: -1, level: 0 } })
    // Awake again a moment later: what was thrown before the sleep is gone from the arcs.
    const woken = runDisplay(display, params, 0.1, { state, now: 11.2 }, (time) => ({
      meters: { clock: time, level: 0 },
    }))
    expect(lit(woken)).toHaveLength(0)
  })

  it('lays no sound along arcs that Mix has flattened', () => {
    const drawn = burst(1, { values: { mix: 0 } })
    expect(lit(drawn).filter((mark) => mark.rect !== null && mark.rect[2] === 2)).toHaveLength(0)
    expect(lit(drawn).filter((mark) => mark.ellipse !== null)).toHaveLength(0)
  })
})
