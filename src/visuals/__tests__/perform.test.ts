import { describe, expect, it } from 'vitest'

import { quietSignals, type VisualFrame, type VisualLayer } from '../frame'
import { DEFAULT_PALETTE, visualPalette } from '../palettes'
import {
  DIAL_REST,
  DIAL_REST_SPAN,
  PerformFollower,
  fullnessOf,
  performAsk,
  performAtRest,
  performMoves,
  performedFrame,
  stayShare,
  staying,
  type PerformNow,
} from '../perform'

const performance = (more: Partial<PerformNow> = {}): PerformNow => ({
  ...performAtRest(),
  ...more,
})

const PAINT: VisualLayer = {
  paint: 'dot-globe',
  variation: 0,
  level: 0.9,
  size: 0.5,
  glow: 0.7,
  hue: 0,
}

const frameOfLayers = (layers: VisualLayer[], grain = 0.4): VisualFrame => ({
  signals: quietSignals(),
  layers,
  palette: visualPalette(DEFAULT_PALETTE),
  grain,
})

describe('what a performance asks of the picture', () => {
  it('asks nothing of a piece as composed', () => {
    expect(performAsk(performAtRest())).toEqual({
      full: 1,
      energy: 1,
      level: 1,
      recede: 0,
      calm: 0,
      trailsKept: 1,
      trails: null,
      grain: 1,
      filter: null,
    })
  })

  it('asks nothing of the dials wherever Energy stands, while every sound is in', () => {
    const ask = performAsk(performAtRest(0.4))
    expect(ask).toMatchObject({ full: 1, energy: 0.4, level: 1, recede: 0, calm: 0, filter: null })
  })

  it('is as full as what the rides leave in of what Energy lets through', () => {
    expect(fullnessOf({ rides: 0.5, ladder: 0.5 })).toBe(0.25)
    expect(performAsk(performance({ rides: 0.5, ladder: 0.5 }))).toEqual(
      performAsk(performance({ rides: 0.25, ladder: 1 })),
    )
  })

  it('shows less of every visual, further off and less vivid, as the piece empties', () => {
    const half = performAsk(performance({ rides: 0.5 }))
    const bare = performAsk(performance({ rides: 0 }))
    expect(half.level).toBeLessThan(1)
    expect(bare.level).toBeLessThan(half.level)
    expect(bare.level).toBeGreaterThan(0.5)
    expect(half.recede).toBeGreaterThan(0)
    expect(bare.recede).toBeGreaterThan(half.recede)
    expect(half.calm).toBeGreaterThan(0)
    expect(bare.calm).toBeGreaterThan(half.calm)
  })

  it('hands the styles the Energy dial, or the fullness where that is lower', () => {
    expect(performAsk(performance({ energy: 1, rides: 0.25 })).energy).toBe(0.25)
    expect(performAsk(performance({ energy: 0.1, rides: 0.5 })).energy).toBe(0.1)
    expect(performAsk(performance({ energy: 0.7 })).energy).toBe(0.7)
  })

  it('softens and dims the picture with Tone under its rest, and takes grain off', () => {
    const ask = performAsk(performance({ tone: 0 }))
    expect(ask.filter?.soft).toBeGreaterThan(0.5)
    expect(ask.filter?.dim).toBeGreaterThan(0.1)
    expect(ask.filter?.thin).toBe(0)
    expect(ask.grain).toBeLessThan(1)
    const part = performAsk(performance({ tone: 0.25 }))
    expect(part.filter?.soft).toBeGreaterThan(0)
    expect(part.filter?.soft).toBeLessThan(ask.filter?.soft ?? 0)
  })

  it('takes the broad light away with Tone over its rest, and adds grain', () => {
    const ask = performAsk(performance({ tone: 1 }))
    expect(ask.filter?.thin).toBeGreaterThan(0.5)
    expect(ask.filter?.soft).toBe(0)
    expect(ask.filter?.dim).toBe(0)
    expect(ask.grain).toBeGreaterThan(1)
  })

  it('does nothing with Tone inside the span the sound leaves alone', () => {
    expect(DIAL_REST_SPAN).toBe(0.02)
    for (const tone of [DIAL_REST - 0.019, DIAL_REST, DIAL_REST + 0.019]) {
      const ask = performAsk(performance({ tone }))
      expect(ask.filter, `tone ${tone}`).toBeNull()
      expect(ask.grain, `tone ${tone}`).toBe(1)
    }
    expect(performAsk(performance({ tone: DIAL_REST - 0.03 })).filter?.soft).toBeGreaterThan(0)
  })

  it('lets the light ring on and spread with Space over its rest', () => {
    const ask = performAsk(performance({ space: 1 }))
    expect(ask.trails?.length).toBeGreaterThan(0.5)
    expect(ask.trails?.push).toBeGreaterThan(0)
    expect(ask.filter?.spread).toBeGreaterThan(0.2)
    expect(ask.trailsKept).toBe(1)
  })

  it('shortens the trails the piece has with Space under its rest, and adds none', () => {
    const ask = performAsk(performance({ space: 0 }))
    expect(ask.trails).toBeNull()
    expect(ask.filter).toBeNull()
    expect(ask.trailsKept).toBeLessThan(0.5)
    expect(ask.trailsKept).toBeGreaterThan(0)
    expect(performAsk(performance({ space: DIAL_REST })).trailsKept).toBe(1)
  })

  it('holds what it is handed between nothing and all', () => {
    expect(performAsk(performance({ rides: -3, tone: 9, space: -9 }))).toEqual(
      performAsk(performance({ rides: 0, tone: 1, space: 0 })),
    )
    // A host that cannot say where a part stands is not performing it.
    expect(
      performAsk(performance({ rides: NaN, ladder: NaN, tone: NaN, space: NaN, energy: NaN })),
    ).toEqual(performAsk(performAtRest()))
  })
})

describe('the visuals that paint for the whole piece', () => {
  it('leave one after another as the piece empties, the last drawn first', () => {
    expect([0, 1, 2].map((rank) => stayShare(1, rank, 3))).toEqual([1, 1, 1])
    expect([0, 1, 2].map((rank) => stayShare(0.75, rank, 3))).toEqual([1, 1, 0.5])
    expect([0, 1, 2].map((rank) => stayShare(0.5, rank, 3))).toEqual([1, 1, 0])
    expect([0, 1, 2].map((rank) => stayShare(0.25, rank, 3))).toEqual([1, 0.5, 0])
    expect([0, 1, 2].map((rank) => stayShare(0, rank, 3))).toEqual([1, 0, 0])
  })

  it('never lose the first drawn, and one alone never leaves', () => {
    for (const full of [0, 0.3, 1]) {
      expect(stayShare(full, 0, 5)).toBe(1)
      expect(stayShare(full, 0, 1)).toBe(1)
    }
  })

  it('are counted as showing while any of one shows', () => {
    expect(staying(1, 3)).toBe(3)
    expect(staying(0.6, 3)).toBe(3)
    expect(staying(0.5, 3)).toBe(2)
    expect(staying(0, 3)).toBe(1)
    expect(staying(0, 0)).toBe(0)
  })
})

describe('a frame with a performance laid over it', () => {
  it('is the frame itself when nothing is asked', () => {
    const frame = frameOfLayers([PAINT, { bend: 'trails', length: 0.5, push: 0.2 }])
    expect(performedFrame(frame, performAsk(performAtRest()))).toBe(frame)
    expect(performedFrame(frame, performAsk(performAtRest(0.3)))).toBe(frame)
  })

  it('shows less of each layer that paints and steps it back, and leaves its glow and colour', () => {
    const ask = performAsk(performance({ rides: 0 }))
    const made = performedFrame(frameOfLayers([PAINT]), ask)
    expect(made.layers).toEqual([
      { ...PAINT, level: PAINT.level * ask.level, size: PAINT.size - ask.recede },
    ])
    expect(made.palette.calm).toBeCloseTo(visualPalette(DEFAULT_PALETTE).calm + ask.calm)
    expect(made.palette.id).toBe(DEFAULT_PALETTE)
    expect(made.filter).toBeUndefined()
  })

  it('never takes the vividness past black and white', () => {
    const frame = { ...frameOfLayers([PAINT]), palette: visualPalette('black-and-white') }
    expect(performedFrame(frame, performAsk(performance({ rides: 0 }))).palette.calm).toBe(1)
  })

  it('carries the filter, and the grain Tone leaves', () => {
    const low = performedFrame(frameOfLayers([PAINT], 0.5), performAsk(performance({ tone: 0 })))
    expect(low.filter).toEqual(performAsk(performance({ tone: 0 })).filter)
    expect(low.grain).toBeLessThan(0.5)
    const high = performedFrame(frameOfLayers([PAINT], 0.5), performAsk(performance({ tone: 1 })))
    expect(high.grain).toBeGreaterThan(0.5)
    expect(high.grain).toBeLessThanOrEqual(1)
    expect(low.layers).toEqual([PAINT])
  })

  it('adds trails of its own after the piece own with Space up, and shortens the piece own with Space down', () => {
    const own: VisualLayer = { bend: 'trails', length: 0.6, push: 0.1 }
    const up = performedFrame(frameOfLayers([PAINT, own]), performAsk(performance({ space: 1 })))
    expect(up.layers).toHaveLength(3)
    expect(up.layers[1]).toEqual(own)
    expect(up.layers[2]).toMatchObject({ bend: 'trails' })
    const down = performedFrame(frameOfLayers([PAINT, own]), performAsk(performance({ space: 0 })))
    expect(down.layers).toHaveLength(2)
    expect(down.layers[1]).toMatchObject({ bend: 'trails', push: 0.1 })
    expect((down.layers[1] as { length: number }).length).toBeLessThan(0.6)
  })
})

describe('what a performance does to the picture, in plain values', () => {
  it('is nothing for a piece as composed', () => {
    expect(performMoves(performAtRest())).toEqual([])
    expect(performMoves(performAtRest(0.2))).toEqual([])
  })

  it('names the sounds that are in as what thins it, however they were taken out', () => {
    expect(performMoves(performance({ rides: 0.25 }))).toEqual([
      { from: 'sounds', does: 'thins', amount: 0.75 },
    ])
    expect(performMoves(performance({ ladder: 0 }))).toEqual([
      { from: 'sounds', does: 'thins', amount: 1 },
    ])
  })

  it('names Tone and Space for what they do, either side of their rest', () => {
    expect(performMoves(performance({ tone: 0, space: 1 }))).toEqual([
      { from: 'tone', does: 'softens', amount: 1 },
      { from: 'space', does: 'rings', amount: 1 },
    ])
    expect(performMoves(performance({ tone: 1, space: 0 }))).toEqual([
      { from: 'tone', does: 'sharpens', amount: 1 },
      { from: 'space', does: 'dries', amount: 1 },
    ])
  })
})

describe('the picture taken to where the performance stands', () => {
  const dials = { energy: 1, space: 0.5, tone: 0.5 }
  const reading = (rides: number, overSec: number, ladder = 1) => ({ rides, ladder, overSec })

  it('starts where the performance stands, whatever the first reading', () => {
    const follower = new PerformFollower()
    expect(follower.step(reading(0.25, 8), { energy: 0.3, space: 0.9, tone: 0.1 }, 0)).toEqual({
      rides: 0.25,
      ladder: 1,
      energy: 0.3,
      space: 0.9,
      tone: 0.1,
    })
  })

  it('takes a move of four seconds less than half of the way in a quarter second, and there in four', () => {
    const follower = new PerformFollower()
    follower.step(reading(1, 4), dials, 0)
    const early = follower.step(reading(0, 4), dials, 0.25).rides
    expect(early).toBeLessThan(1)
    expect(early).toBeGreaterThan(0.5)
    const late = follower.step(reading(0, 4), dials, 3.75).rides
    expect(late).toBeLessThan(0.02)
  })

  it('is there within a tenth of a second for a move that takes eight hundredths', () => {
    const follower = new PerformFollower()
    follower.step(reading(1, 0.08), dials, 0)
    follower.step(reading(1, 0.08), { ...dials, tone: 0 }, 0.016)
    const tone = follower.step(reading(1, 0.08), { ...dials, tone: 0 }, 0.084).tone
    expect(tone).toBeLessThan(0.01)
  })

  it('leaves a fade under way alone when a dial is turned', () => {
    const turned = new PerformFollower()
    const left = new PerformFollower()
    for (const follower of [turned, left]) {
      follower.step(reading(1, 4), dials, 0)
      follower.step(reading(0, 4), dials, 0.5)
    }
    // Energy is turned half a second into the fade: its own share moves at the dial's pace.
    const after = turned.step(reading(0, 0.08, 0.5), { ...dials, energy: 0.5 }, 0.5)
    const alone = left.step(reading(0, 4), dials, 0.5)
    expect(after.rides).toBe(alone.rides)
    // A second into a fade of four: well short of the end, where the dial's pace would have had it.
    expect(after.rides).toBeGreaterThan(0.3)
    expect(after.ladder).toBeLessThan(0.51)
  })

  it('comes to the same place however often it is stepped', () => {
    const run = (steps: number[]) => {
      const follower = new PerformFollower()
      follower.step(reading(1, 4), dials, 0)
      let now = follower.step(reading(0.2, 4), dials, 0)
      for (const went of steps) now = follower.step(reading(0.2, 4), dials, went)
      return now.rides
    }
    const fast = run(Array.from({ length: 120 }, () => 1 / 60))
    const slow = run(Array.from({ length: 10 }, () => 1 / 5))
    expect(fast).toBeCloseTo(slow, 6)
    expect(run([10])).toBe(0.2)
    expect(run(Array.from({ length: 600 }, () => 1 / 60))).toBe(0.2)
  })

  it('stands exactly at rest once it has come back there', () => {
    const follower = new PerformFollower()
    follower.step(reading(1, 0.5), dials, 0)
    follower.step(reading(0, 0.5), { energy: 0.2, space: 1, tone: 0 }, 2)
    let now = follower.step(reading(1, 0.5), dials, 0)
    for (let frame = 0; frame < 120; frame++) now = follower.step(reading(1, 0.5), dials, 1 / 60)
    expect(now).toEqual(performAtRest())
    expect(performAsk(now)).toEqual(performAsk(performAtRest()))
  })

  it('starts anew after it is put to rest', () => {
    const follower = new PerformFollower()
    follower.step(reading(1, 8), dials, 0)
    follower.rest()
    expect(follower.step(reading(0, 8), dials, 0.1).rides).toBe(0)
  })
})
