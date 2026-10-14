import { describe, expect, it } from 'vitest'

import { VisualDesk, type DeskReading } from '../desk'
import type { FollowedStroke } from '../follow'
import { SPECTRUM_BANDS } from '../frame'
import { DEFAULT_GRAIN, emptyVisualSet, firstKnobs, type Visual, type VisualSet } from '../model'
import { DEFAULT_PALETTE, visualPalette } from '../palettes'

const visual = (id: string, kind: string, more: Partial<Visual> = {}): Visual => ({
  id,
  kind,
  variation: 0,
  stroke: null,
  lane: 0,
  beat: 0,
  beats: null,
  knobs: firstKnobs(kind),
  ...more,
})

const setOf = (...list: Visual[]): VisualSet => ({
  palette: DEFAULT_PALETTE,
  grain: DEFAULT_GRAIN,
  list,
})

/** A pad from 4 s to 12 s. */
const PAD: FollowedStroke = {
  id: 'stroke-1',
  startSec: 4,
  durationSec: 8,
  fadeInSec: 1,
  fadeOutSec: 1,
  depth: 0.5,
  thickness: 0.1,
  gain: 1,
  slot: 'pad',
  colour: [0.2, 0.4, 0.8],
}

/** A sixteen second piece at two beats a second, stopped at its start, with nothing in it. */
const reading = (more: Partial<DeskReading> = {}): DeskReading => ({
  set: emptyVisualSet(),
  playheadSec: 0,
  pieceSec: 16,
  beatSec: 0.5,
  playing: false,
  strokes: [],
  heard: null,
  energy: 0.6,
  space: 0.5,
  tone: 0.5,
  input: 0,
  ...more,
})

/** A desk that reads what `now` holds, and counts how often it reads. */
function deskOf(first: Partial<DeskReading> = {}) {
  const state = { now: reading(first), reads: 0 }
  const desk = new VisualDesk(() => {
    state.reads++
    return state.now
  })
  return { desk, state }
}

describe('the frame of the piece', () => {
  it('reads nothing until a frame is asked for', () => {
    const { state } = deskOf()
    expect(state.reads).toBe(0)
  })

  it('is the same frame when asked twice at the same time, read once', () => {
    const { desk, state } = deskOf()
    const first = desk.frame(1000)
    expect(desk.frame(1000)).toBe(first)
    expect(desk.frame(1001)).toBe(first)
    expect(state.reads).toBe(1)
  })

  it('reads again at a later time', () => {
    const { desk, state } = deskOf()
    const first = desk.frame(1000)
    const second = desk.frame(1016)
    expect(second).not.toBe(first)
    expect(state.reads).toBe(2)
    expect(desk.frame(1016)).toBe(second)
    expect(desk.frame(1032)).not.toBe(second)
    expect(state.reads).toBe(3)
  })

  it('runs time on by what lies between two frames, and starts with none', () => {
    const { desk } = deskOf()
    expect(desk.frame(5000).signals.time).toBe(0)
    expect(desk.frame(5016).signals.time).toBeCloseTo(0.016, 10)
    expect(desk.frame(5066).signals.time).toBeCloseTo(0.066, 10)
  })

  it('follows what the page reads now', () => {
    const { desk, state } = deskOf({ strokes: [PAD], playheadSec: 8 })
    for (let now = 0; now <= 2000; now += 16) desk.frame(now)
    const signals = desk.frame(2016).signals
    expect(signals.place).toBe(0.5)
    expect(signals.pad).toBeCloseTo(1, 3)
    expect(signals.mix).toBeCloseTo(0.45, 3)
    state.now = reading({
      strokes: [PAD],
      playheadSec: 2,
      energy: 0.2,
      space: 0.9,
      tone: 0.1,
      input: 1,
    })
    const next = desk.frame(2032).signals
    expect([next.place, next.energy, next.space, next.tone]).toEqual([0.125, 0.2, 0.9, 0.1])
    expect(next.input).toBeGreaterThan(0)
    expect(next.pad).toBeLessThan(1)
  })

  it('uses what is heard while the piece plays', () => {
    const heard = { level: 1, bands: new Float32Array(SPECTRUM_BANDS).fill(1) }
    const { desk } = deskOf({ playing: true, heard })
    for (let now = 0; now <= 2000; now += 16) desk.frame(now)
    expect(desk.frame(2016).signals.mix).toBeCloseTo(1, 3)
    expect(desk.frame(2016).signals.high).toBeCloseTo(1, 3)
  })

  it('paints the visuals of the piece where the playhead is, in beats', () => {
    const list = [
      visual('a', 'star', { beat: 8, beats: 8 }),
      visual('b', 'meadow', { stroke: 'stroke-1' }),
    ]
    const set = { ...setOf(...list), palette: 'sea', grain: 0.2 }
    const { desk, state } = deskOf({ set, strokes: [PAD], playheadSec: 1 })
    // Beat 2: before the stretch, and before the stroke.
    const before = desk.frame(0)
    expect(before.layers).toEqual([])
    expect(before.palette).toBe(visualPalette('sea'))
    expect(before.grain).toBe(0.2)
    // Five seconds in is beat 10: inside the stretch, and the stroke sounds.
    state.now = reading({ set, strokes: [PAD], playheadSec: 5 })
    const inside = desk.frame(16)
    expect(inside.layers.map((layer) => ('paint' in layer ? layer.paint : layer.bend))).toEqual([
      'star',
      'meadow',
    ])
    expect(inside.layers[0]).toMatchObject({ paint: 'star', level: 0.9 })
    // A piece with no beat has every stretch start at its start.
    state.now = reading({ set, strokes: [], playheadSec: 5, beatSec: 0 })
    expect(desk.frame(32).layers).toEqual([])
  })
})

describe('the frame that shows one kind alone', () => {
  it('paints the kind in the palette and the grain of the piece', () => {
    const { desk } = deskOf({ set: { palette: 'sea', grain: 0.2, list: [] } })
    const sample = desk.sample('dot-screen', 1, 0)
    expect(sample.layers).toHaveLength(1)
    expect(sample.layers[0]).toMatchObject({ paint: 'dot-screen', variation: 1, level: 1 })
    expect(sample.palette).toBe(visualPalette('sea'))
    expect(sample.grain).toBe(0.2)
    expect(desk.sample('trails', 0, 0).layers).toEqual([])
  })

  it('reads the piece once for a frame and all the samples of that time', () => {
    const { desk, state } = deskOf()
    desk.sample('dot-screen', 0, 1000)
    desk.sample('meadow', 0, 1000)
    desk.frame(1000)
    expect(state.reads).toBe(1)
    desk.sample('dot-screen', 0, 1016)
    expect(state.reads).toBe(2)
  })

  it('plays a small piece of its own where the piece has no strokes', () => {
    const { desk } = deskOf()
    let sample = desk.sample('dot-screen', 0, 0)
    for (let now = 16; now <= 3000; now += 16) sample = desk.sample('dot-screen', 0, now)
    const own = desk.frame(3008).signals
    // The piece is silent; the stand-in is not.
    expect(own.mix).toBe(0)
    expect(own.drone).toBe(0)
    expect(sample.signals).not.toBe(own)
    expect(sample.signals.mix).toBeGreaterThan(0.2)
    expect(sample.signals.drone).toBeGreaterThan(0.5)
    expect(sample.signals.bands.some((band) => band > 0)).toBe(true)
    expect(sample.signals.map.some((part) => part > 0)).toBe(true)
    expect(sample.signals.place).toBeCloseTo(3 / 16, 2)
    // It never reaches the picture of the piece itself.
    expect(own.map.every((part) => part === 0)).toBe(true)
  })

  it('shows every kind of the same time with the same stand-in', () => {
    const { desk } = deskOf()
    for (let now = 0; now <= 1000; now += 16) desk.sample('dot-screen', 0, now)
    const one = desk.sample('dot-screen', 0, 1016)
    const time = one.signals.time
    const other = desk.sample('meadow', 1, 1016)
    expect(other.signals).toBe(one.signals)
    expect(other.signals.time).toBe(time)
  })

  it('turns the stand-in with the dials of the piece', () => {
    const { desk } = deskOf({ energy: 0.1, space: 0.9, tone: 0.2 })
    const { signals } = desk.sample('dot-screen', 0, 0)
    expect([signals.energy, signals.space, signals.tone]).toEqual([0.1, 0.9, 0.2])
  })

  it('uses the stand-in while a piece with strokes stands still', () => {
    const { desk } = deskOf({ strokes: [PAD], playheadSec: 8, playing: false })
    let sample = desk.sample('dot-screen', 0, 0)
    for (let now = 16; now <= 2000; now += 16) sample = desk.sample('dot-screen', 0, now)
    expect(sample.signals).not.toBe(desk.frame(2000).signals)
    expect(sample.signals.drone).toBeGreaterThan(0.5)
  })

  it('uses the signals of the piece itself while it plays', () => {
    const { desk } = deskOf({ strokes: [PAD], playheadSec: 8, playing: true })
    for (let now = 0; now <= 2000; now += 16) desk.frame(now)
    const sample = desk.sample('dot-screen', 0, 2016)
    expect(sample.signals).toBe(desk.frame(2016).signals)
    expect(sample.signals.pad).toBeCloseTo(1, 3)
    expect(sample.signals.drone).toBe(0)
    expect(sample.signals.place).toBe(0.5)
  })
})

describe('cues and played notes', () => {
  it('shows a cue in the signals of the piece', () => {
    const { desk } = deskOf({ playheadSec: 4 })
    expect(desk.frame(0).signals.cue).toBe(0)
    desk.cue()
    const { signals } = desk.frame(16)
    expect(signals.cue).toBeGreaterThan(0.95)
    expect(signals.hits).toBeGreaterThan(0.95)
    expect(signals.map.some((part) => part > 0)).toBe(true)
    for (let now = 32; now <= 12_000; now += 16) desk.frame(now)
    expect(desk.frame(12_016).signals.cue).toBeLessThan(0.001)
  })

  it('shows a played note in the signals of the piece, louder for a louder note', () => {
    const { desk } = deskOf()
    expect(desk.frame(0).signals.keys).toBe(0)
    desk.note(1)
    const hard = desk.frame(16).signals.keys
    expect(hard).toBeGreaterThan(0.95)
    desk.note(0.2)
    const soft = desk.frame(32).signals.keys
    expect(soft).toBeGreaterThan(0.4)
    expect(soft).toBeLessThan(hard)
  })
})
