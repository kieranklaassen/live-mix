import { describe, expect, it } from 'vitest'

import {
  VisualFollower,
  strokeShape,
  type FollowInput,
  type FollowedStroke,
  type Heard,
  type Rgb,
} from '../follow'
import {
  KIND_SLOTS,
  MAP_H,
  MAP_W,
  SPECTRUM_BANDS,
  type KindSlot,
  type VisualSignals,
} from '../frame'

/** A pad from 4 s to 12 s, in the middle of the room. */
const stroke = (more: Partial<FollowedStroke> = {}): FollowedStroke => ({
  id: 'stroke-1',
  startSec: 4,
  durationSec: 8,
  fadeInSec: 2,
  fadeOutSec: 2,
  depth: 0.5,
  thickness: 0.1,
  gain: 1,
  slot: 'pad',
  colour: [0.2, 0.4, 0.8],
  ...more,
})

const hit = (more: Partial<FollowedStroke> = {}): FollowedStroke =>
  stroke({
    id: 'hit-1',
    slot: 'hits',
    startSec: 4,
    durationSec: 2,
    fadeInSec: 0,
    fadeOutSec: 0,
    ...more,
  })

/** One frame of a sixteen second piece, stopped at its start, with nothing in it. */
const frame = (more: Partial<FollowInput> = {}): FollowInput => ({
  dtSec: 0.016,
  playheadSec: 0,
  pieceSec: 16,
  playing: false,
  strokes: [],
  heard: null,
  energy: 0.6,
  space: 0.5,
  tone: 0.5,
  input: 0,
  ...more,
})

/** The same frame over and over, for `seconds`. */
function run(follower: VisualFollower, input: FollowInput, seconds: number): VisualSignals {
  for (let count = Math.round(seconds / input.dtSec); count > 0; count--) follower.step(input)
  return follower.signals
}

const colourOf = (signals: VisualSignals, slot: KindSlot): number[] => {
  const at = KIND_SLOTS.indexOf(slot) * 3
  return Array.from(signals.kindColours.slice(at, at + 3))
}

const expectColour = (colour: number[], wanted: Rgb): void => {
  wanted.forEach((part, index) => expect(colour[index]).toBeCloseTo(part, 5))
}

/** How loud the picture of the piece is at a place: across 0 to 1, from the back of the room 0 to the front 1. */
const lightAt = (signals: VisualSignals, across: number, depth: number): number => {
  const x = Math.min(MAP_W - 1, Math.floor(across * MAP_W))
  const y = Math.min(MAP_H - 1, Math.floor(depth * MAP_H))
  return signals.map[(y * MAP_W + x) * 4 + 3]
}

const loud = (): Heard => ({ level: 1, bands: new Float32Array(SPECTRUM_BANDS).fill(1) })

describe('how loud a stroke is at a place in the piece', () => {
  it('is silent before the stroke starts', () => {
    expect(strokeShape(stroke(), 0, 16, 0.5)).toBe(0)
    expect(strokeShape(stroke(), 3.9, 16, 0.5)).toBe(0)
    // A piece of no length has no start to ring on into.
    expect(strokeShape(stroke(), 3.9, 0, 0.5)).toBe(0)
  })

  it('rises over its fade in', () => {
    expect(strokeShape(stroke(), 4, 16, 0.5)).toBe(0)
    expect(strokeShape(stroke(), 4.5, 16, 0.5)).toBeCloseTo(0.25, 10)
    expect(strokeShape(stroke(), 5, 16, 0.5)).toBeCloseTo(0.5, 10)
    expect(strokeShape(stroke(), 6, 16, 0.5)).toBe(1)
    expect(strokeShape(stroke(), 8, 16, 0.5)).toBe(1)
  })

  it('is full at once where it has no fade in', () => {
    expect(strokeShape(stroke({ fadeInSec: 0 }), 4.03, 16, 0.5)).toBeCloseTo(1, 6)
    expect(strokeShape(stroke({ fadeInSec: 0 }), 4.1, 16, 0.5)).toBe(1)
  })

  it('falls over its fade out, but is never wholly gone before its end', () => {
    expect(strokeShape(stroke(), 11, 16, 0.5)).toBeCloseTo(0.5, 10)
    expect(strokeShape(stroke(), 11.8, 16, 0.5)).toBeCloseTo(0.25, 10)
    expect(strokeShape(stroke(), 12, 16, 0.5)).toBeCloseTo(0.25, 10)
  })

  it('rings on after its end, from where it stood and down to nothing', () => {
    const levels = [12, 12.2, 12.5, 13, 13.4].map((sec) => strokeShape(stroke(), sec, 16, 0.5))
    for (let index = 1; index < levels.length; index++)
      expect(levels[index]).toBeLessThan(levels[index - 1])
    expect(strokeShape(stroke(), 12.001, 16, 0.5)).toBeCloseTo(0.25, 2)
    expect(strokeShape(stroke(), 13.5, 16, 0.5)).toBe(0)
    expect(strokeShape(stroke(), 15, 16, 0.5)).toBe(0)
  })

  it('rings on longer the more Space there is', () => {
    const dry = strokeShape(stroke(), 12.3, 16, 0)
    const half = strokeShape(stroke(), 12.3, 16, 0.5)
    const wet = strokeShape(stroke(), 12.3, 16, 1)
    expect(dry).toBeGreaterThan(0)
    expect(half).toBeGreaterThan(dry)
    expect(wet).toBeGreaterThan(half)
    // A second after the end only a wide room still rings.
    expect(strokeShape(stroke(), 13, 16, 0)).toBe(0)
    expect(strokeShape(stroke(), 13, 16, 1)).toBeGreaterThan(0)
    expect(strokeShape(stroke(), 15, 16, 1)).toBe(0)
  })

  it('is heard at the start of the piece when it rings on past its end', () => {
    const last = stroke({ startSec: 13, durationSec: 3 })
    expect(strokeShape(last, 15.9, 16, 1)).toBeGreaterThan(0.2)
    expect(strokeShape(last, 0.5, 16, 1)).toBeGreaterThan(0)
    expect(strokeShape(last, 0.5, 16, 1)).toBeCloseTo(strokeShape(stroke(), 12.5, 16, 1), 10)
    expect(strokeShape(last, 3, 16, 1)).toBe(0)
    // Without a length there is nowhere to come round to.
    expect(strokeShape(last, 0.5, 0, 1)).toBe(0)
  })

  it('is full at once for a hit and gone soon after', () => {
    expect(strokeShape(hit(), 3.99, 16, 0.5)).toBe(0)
    expect(strokeShape(hit(), 4, 16, 0.5)).toBe(0)
    expect(strokeShape(hit(), 4.03, 16, 0.5)).toBeCloseTo(1, 6)
    const levels = [4.03, 4.1, 4.3, 4.8, 6].map((sec) => strokeShape(hit(), sec, 16, 0.5))
    for (let index = 1; index < levels.length; index++)
      expect(levels[index]).toBeLessThan(levels[index - 1])
    expect(strokeShape(hit(), 4.53, 16, 0.5)).toBeCloseTo(Math.exp(-1), 6)
    // More Space, a longer ring.
    expect(strokeShape(hit(), 4.5, 16, 1)).toBeGreaterThan(strokeShape(hit(), 4.5, 16, 0))
  })

  it('is silent three seconds after a hit', () => {
    expect(strokeShape(hit(), 6.9, 16, 1)).toBeGreaterThan(0)
    expect(strokeShape(hit(), 7.01, 16, 1)).toBe(0)
    expect(strokeShape(hit(), 10, 16, 1)).toBe(0)
  })

  it('shows each hit of a beat, from the last one before the place', () => {
    const beat = hit({ onsets: [0.5, 1, 1.5] })
    // Nothing before its first hit.
    expect(strokeShape(beat, 4.2, 16, 0.5)).toBe(0)
    expect(strokeShape(beat, 4.53, 16, 0.5)).toBeCloseTo(1, 6)
    expect(strokeShape(beat, 4.9, 16, 0.5)).toBeLessThan(0.6)
    expect(strokeShape(beat, 5.03, 16, 0.5)).toBeCloseTo(1, 6)
    expect(strokeShape(beat, 5.53, 16, 0.5)).toBeCloseTo(1, 6)
    expect(strokeShape(beat, 5.53, 16, 0.5)).toBeGreaterThan(strokeShape(hit(), 5.53, 16, 0.5))
    expect(strokeShape(beat, 8.6, 16, 0.5)).toBe(0)
  })

  it('does not show a hit that falls past the end of the stroke', () => {
    const cut = hit({ durationSec: 0.8, onsets: [0, 0.5, 1] })
    expect(strokeShape(cut, 4.53, 16, 0.5)).toBeCloseTo(1, 6)
    // At the third hit, which is cut off, it is still the second that fades.
    expect(strokeShape(cut, 5.03, 16, 0.5)).toBeCloseTo(Math.exp(-1), 6)
  })

  it('takes a hit with no hits written as one hit at its start', () => {
    expect(strokeShape(hit({ onsets: [] }), 4.03, 16, 0.5)).toBeCloseTo(1, 6)
  })

  it('hits again on every pass of a stroke that repeats its sound', () => {
    // A loop of two seconds laid over twelve, with hits at its top and half a second in.
    const loop = hit({ durationSec: 12, onsets: [0, 0.5], repeatSec: 2 })
    for (const pass of [0, 1, 4, 5]) {
      expect(strokeShape(loop, 4.03 + 2 * pass, 16, 0.5)).toBeCloseTo(1, 6)
      expect(strokeShape(loop, 4.53 + 2 * pass, 16, 0.5)).toBeCloseTo(1, 6)
    }
    // Between two passes it is the last hit of the pass before that fades.
    const alone = hit({ durationSec: 12, onsets: [0.5], repeatSec: 2 })
    expect(strokeShape(alone, 6.3, 16, 0.5)).toBeCloseTo(strokeShape(alone, 4.5 + 1.8, 16, 0.5), 6)
    expect(strokeShape(alone, 6.3, 16, 0.5)).toBeGreaterThan(0)
    // Past its end nothing is hit: the last hit played fades.
    expect(strokeShape(loop, 15.9, 16, 0.5)).toBeGreaterThan(0)
    expect(strokeShape(loop, 3.9, 16, 0.5)).toBe(0)
  })

  it('hits a repeating stroke with no hits written as each pass begins', () => {
    const loop = hit({ durationSec: 8, repeatSec: 2 })
    expect(strokeShape(loop, 4.03, 16, 0.5)).toBeCloseTo(1, 6)
    expect(strokeShape(loop, 8.03, 16, 0.5)).toBeCloseTo(1, 6)
    expect(strokeShape(loop, 9.9, 16, 0.5)).toBeLessThan(0.2)
  })

  it('leaves out the hits before where a stroke begins in its first pass', () => {
    // It begins a second into a pass of two: the hit at the top is not played until the pass comes round.
    const late = hit({ durationSec: 8, onsets: [0, 1.5], repeatSec: 2, phaseSec: 1 })
    expect(strokeShape(late, 4.2, 16, 0.5)).toBe(0)
    expect(strokeShape(late, 4.53, 16, 0.5)).toBeCloseTo(1, 6)
    expect(strokeShape(late, 5.03, 16, 0.5)).toBeCloseTo(1, 6)
    expect(strokeShape(late, 6.53, 16, 0.5)).toBeCloseTo(1, 6)
  })
})

describe('following the strokes of the piece', () => {
  it('says how loud each stroke is, by its id', () => {
    const strokes = [
      stroke({ id: 'full', gain: 0.5 }),
      stroke({ id: 'rising', startSec: 7, gain: 1 }),
      stroke({ id: 'later', startSec: 14, durationSec: 1 }),
    ]
    const { strokeLevels } = new VisualFollower().step(frame({ playheadSec: 8, strokes }))
    expect(strokeLevels.get('full')).toBeCloseTo(0.5, 10)
    expect(strokeLevels.get('rising')).toBeCloseTo(0.5, 10)
    expect(strokeLevels.has('later')).toBe(false)
    expect(strokeLevels.size).toBe(2)
  })

  it('forgets a stroke that no longer sounds', () => {
    const follower = new VisualFollower()
    expect(
      follower.step(frame({ playheadSec: 8, strokes: [stroke()] })).strokeLevels.has('stroke-1'),
    ).toBe(true)
    expect(follower.step(frame({ playheadSec: 2, strokes: [stroke()] })).strokeLevels.size).toBe(0)
    expect(follower.step(frame({ playheadSec: 8 })).strokeLevels.size).toBe(0)
  })

  it('hands back the same signals every frame, filled anew', () => {
    const follower = new VisualFollower()
    const first = follower.step(frame({ playheadSec: 4 }))
    const second = follower.step(frame({ playheadSec: 8 }))
    expect(first.signals).toBe(follower.signals)
    expect(second.signals).toBe(follower.signals)
    expect(follower.signals.place).toBe(0.5)
  })

  it('reads the place in the piece and the dials, held between nothing and full', () => {
    const follower = new VisualFollower()
    const { signals } = follower.step(frame({ playheadSec: 4, energy: 0.3, space: 0.8, tone: 0.1 }))
    expect([signals.place, signals.energy, signals.space, signals.tone]).toEqual([
      0.25, 0.3, 0.8, 0.1,
    ])
    follower.step(frame({ playheadSec: 40, energy: 4, space: -1, tone: 2 }))
    expect([signals.place, signals.energy, signals.space, signals.tone]).toEqual([1, 1, 0, 1])
    follower.step(frame({ playheadSec: 4, pieceSec: 0 }))
    expect(signals.place).toBe(0)
  })

  it('follows the loudest sound of each kind, and takes its colour', () => {
    const red: Rgb = [0.9, 0.1, 0.1]
    const blue: Rgb = [0.1, 0.1, 0.9]
    const green: Rgb = [0.1, 0.9, 0.1]
    const strokes = [
      stroke({ id: 'soft-pad', gain: 0.3, colour: red }),
      stroke({ id: 'loud-pad', gain: 0.9, colour: blue }),
      stroke({ id: 'softer-pad', gain: 0.2, colour: red }),
      stroke({ id: 'drone', slot: 'drone', gain: 0.6, colour: green }),
    ]
    const follower = new VisualFollower()
    const signals = run(follower, frame({ playheadSec: 8, strokes }), 2)
    expect(signals.pad).toBeCloseTo(0.9, 3)
    expect(signals.drone).toBeCloseTo(0.6, 3)
    expect(signals.texture).toBe(0)
    expect(signals.melodic).toBe(0)
    expectColour(colourOf(signals, 'pad'), blue)
    expectColour(colourOf(signals, 'drone'), green)
  })

  it('gives a kind at rest the colour it rests in', () => {
    const { signals } = new VisualFollower().step(frame())
    expectColour(colourOf(signals, 'drone'), [0.25, 0.62, 0.68])
    expectColour(colourOf(signals, 'pad'), [0.5, 0.36, 0.72])
    expectColour(colourOf(signals, 'texture'), [0.74, 0.56, 0.3])
    expectColour(colourOf(signals, 'melodic'), [0.42, 0.68, 0.34])
    expectColour(colourOf(signals, 'hits'), [0.78, 0.36, 0.32])
  })

  it('gives a kind its rest colour back when its sound has stopped', () => {
    const follower = new VisualFollower()
    follower.step(frame({ playheadSec: 8, strokes: [stroke()] }))
    expectColour(colourOf(follower.signals, 'pad'), [0.2, 0.4, 0.8])
    follower.step(frame({ playheadSec: 2, strokes: [stroke()] }))
    expectColour(colourOf(follower.signals, 'pad'), [0.5, 0.36, 0.72])
  })

  it('hears nothing of a stroke that is muted or painted with no level', () => {
    const strokes = [stroke({ id: 'muted', gain: 0, colour: [1, 0, 0] })]
    const follower = new VisualFollower()
    const { strokeLevels } = follower.step(frame({ playheadSec: 8, strokes }))
    expect(strokeLevels.size).toBe(0)
    const signals = run(follower, frame({ playheadSec: 8, strokes }), 2)
    expect(signals.pad).toBe(0)
    expect(signals.mix).toBe(0)
    expect(signals.bands.every((band) => band === 0)).toBe(true)
    expectColour(colourOf(signals, 'pad'), [0.5, 0.36, 0.72])
    expect(signals.map.every((part) => part === 0)).toBe(true)
  })

  it('lets a level in fast and lets it go slowly, neither at once', () => {
    const follower = new VisualFollower()
    const strokes = [stroke()]
    // Nothing moves in a frame of no length.
    expect(follower.step(frame({ dtSec: 0, playheadSec: 8, strokes })).signals.pad).toBe(0)
    // In one frame of a sixtieth it is a good part of the way up, and after three most of it.
    const first = follower.step(frame({ playheadSec: 8, strokes })).signals.pad
    expect(first).toBeGreaterThan(0.3)
    expect(first).toBeLessThan(0.6)
    const second = follower.step(frame({ playheadSec: 8, strokes })).signals.pad
    expect(second).toBeGreaterThan(first)
    expect(follower.step(frame({ playheadSec: 8, strokes })).signals.pad).toBeGreaterThan(0.75)
    expect(run(follower, frame({ playheadSec: 8, strokes }), 2).pad).toBeCloseTo(1, 3)
    // It falls more slowly when the stroke is over.
    const after = follower.step(frame({ playheadSec: 2, strokes })).signals.pad
    expect(after).toBeLessThan(1)
    expect(after).toBeGreaterThan(0.8)
    expect(run(follower, frame({ playheadSec: 2, strokes }), 2).pad).toBeCloseTo(0, 3)
  })

  it('is half in within a twentieth of a second of a stroke that starts, at sixty and at thirty frames a second', () => {
    for (const dtSec of [1 / 60, 1 / 30]) {
      const follower = new VisualFollower()
      const strokes = [stroke({ startSec: 4, durationSec: 8, fadeInSec: 0 })]
      follower.step(frame({ dtSec, playheadSec: 3.99, strokes }))
      let playheadSec = 3.99
      let frames = 0
      while (follower.signals.pad < 0.5 && frames < 100) {
        playheadSec += dtSec
        follower.step(frame({ dtSec, playheadSec, strokes }))
        frames++
      }
      expect(playheadSec - 4, `${Math.round(1 / dtSec)} frames a second`).toBeLessThan(0.05 + dtSec)
    }
  })

  it('stands where the music is after a long frame, as after many short ones', () => {
    const strokes = [stroke()]
    // A page that paints once a second: one frame, and the level is there.
    const seldom = new VisualFollower()
    seldom.step(frame({ dtSec: 0, playheadSec: 8, strokes }))
    expect(seldom.step(frame({ dtSec: 1, playheadSec: 8, strokes })).signals.pad).toBeCloseTo(1, 3)
    // And it has let go as far in one long frame as in the same time of short ones.
    const often = new VisualFollower()
    run(often, frame({ playheadSec: 8, strokes }), 2)
    run(seldom, frame({ playheadSec: 8, strokes }), 2)
    const gone = seldom.step(frame({ dtSec: 0.25, playheadSec: 2, strokes })).signals.pad
    expect(gone).toBeCloseTo(
      run(often, frame({ dtSec: 0.0125, playheadSec: 2, strokes }), 0.25).pad,
      6,
    )
    expect(gone).toBeLessThan(0.2)
  })

  it('follows the live input as fast', () => {
    const follower = new VisualFollower()
    const first = follower.step(frame({ input: 1 })).signals.input
    expect(first).toBeGreaterThan(0.3)
    expect(first).toBeLessThan(0.6)
    expect(run(follower, frame({ input: 1 }), 2).input).toBeCloseTo(1, 3)
  })

  it('shows a hit in full at once, and lets it fall after', () => {
    const follower = new VisualFollower()
    const strokes = [hit()]
    expect(follower.step(frame({ playheadSec: 3, strokes })).signals.hits).toBe(0)
    expect(follower.step(frame({ playheadSec: 4.03, strokes })).signals.hits).toBeCloseTo(1, 3)
    // The stroke is taken away: what was seen of the hit still falls.
    const falling = follower.step(frame({ playheadSec: 4.05 })).signals.hits
    expect(falling).toBeGreaterThan(0.9)
    expect(falling).toBeLessThan(1)
    expect(run(follower, frame({ playheadSec: 4.05 }), 0.6).hits).toBeLessThan(0.5)
    expect(run(follower, frame({ playheadSec: 4.05 }), 6).hits).toBeLessThan(0.001)
  })
})

describe('following what is heard', () => {
  it('uses what is heard only while the piece plays', () => {
    const stopped = run(new VisualFollower(), frame({ playing: false, heard: loud() }), 2)
    expect(stopped.mix).toBe(0)
    expect(stopped.bands.every((band) => band === 0)).toBe(true)
    expect([stopped.low, stopped.mid, stopped.high]).toEqual([0, 0, 0])

    const playing = run(new VisualFollower(), frame({ playing: true, heard: loud() }), 2)
    expect(playing.mix).toBeCloseTo(1, 3)
    for (const band of playing.bands) expect(band).toBeCloseTo(1, 3)
    expect(playing.low).toBeCloseTo(1, 3)
    expect(playing.mid).toBeCloseTo(1, 3)
    expect(playing.high).toBeCloseTo(1, 3)
  })

  it('reads low, mid and high from their own parts of the spectrum', () => {
    const only = (band: number): VisualSignals => {
      const heard: Heard = { level: 0.5, bands: new Float32Array(SPECTRUM_BANDS) }
      heard.bands[band] = 1
      return run(new VisualFollower(), frame({ playing: true, heard }), 2)
    }
    const low = only(2)
    expect(low.low).toBeCloseTo(1, 3)
    expect([low.mid, low.high]).toEqual([0, 0])
    const mid = only(7)
    expect(mid.mid).toBeCloseTo(1, 3)
    expect([mid.low, mid.high]).toEqual([0, 0])
    const high = only(SPECTRUM_BANDS - 1)
    expect(high.high).toBeCloseTo(1, 3)
    expect([high.low, high.mid]).toEqual([0, 0])
  })

  it('works the whole out from the strokes where nothing is heard', () => {
    const strokes = [stroke({ gain: 0.8 }), stroke({ id: 'drone', slot: 'drone', gain: 0.6 })]
    const quiet = { level: 0, bands: new Float32Array(SPECTRUM_BANDS) }
    // Stopped, with silence heard: the piece at the playhead still shows.
    const stopped = run(new VisualFollower(), frame({ playheadSec: 8, strokes, heard: quiet }), 2)
    expect(stopped.mix).toBeCloseTo((0.8 + 0.6) * 0.45, 3)
    expect(stopped.low).toBeGreaterThan(0.3)
    expect(stopped.mid).toBeGreaterThan(0.3)
    // Playing where nothing can be heard: the same.
    const deaf = run(
      new VisualFollower(),
      frame({ playheadSec: 8, strokes, playing: true, heard: null }),
      2,
    )
    expect(deaf.mix).toBeCloseTo(stopped.mix, 6)
    // Playing with silence heard: what is heard wins.
    const heard = run(
      new VisualFollower(),
      frame({ playheadSec: 8, strokes, playing: true, heard: quiet }),
      2,
    )
    expect(heard.mix).toBe(0)
    expect(heard.low).toBe(0)
    // Each stroke is still told from the others.
    expect(heard.pad).toBeCloseTo(0.8, 3)
    expect(heard.drone).toBeCloseTo(0.6, 3)
  })

  it('guesses a drone low in the spectrum and a texture higher up', () => {
    const top = (signals: VisualSignals): number =>
      signals.bands.indexOf(Math.max(...signals.bands))
    const drone = run(
      new VisualFollower(),
      frame({ playheadSec: 8, strokes: [stroke({ slot: 'drone' })] }),
      2,
    )
    const texture = run(
      new VisualFollower(),
      frame({ playheadSec: 8, strokes: [stroke({ slot: 'texture' })] }),
      2,
    )
    expect(top(drone)).toBeLessThan(5)
    expect(top(texture)).toBeGreaterThan(top(drone))
    expect(drone.low).toBeGreaterThan(drone.high)
    expect(texture.high).toBeGreaterThan(drone.high)
  })

  it('lets the spectrum in fast and lets it go slowly, neither at once', () => {
    const follower = new VisualFollower()
    const input = frame({ playing: true, heard: loud() })
    const { signals } = follower.step(input)
    const first = Array.from(signals.bands)
    for (const band of first) {
      expect(band).toBeGreaterThan(0.3)
      expect(band).toBeLessThan(0.6)
    }
    expect(signals.mix).toBeGreaterThan(0.3)
    expect(signals.mix).toBeLessThan(0.6)
    follower.step(input)
    signals.bands.forEach((band, index) => expect(band).toBeGreaterThan(first[index]))
    run(follower, input, 2)
    for (const band of signals.bands) expect(band).toBeCloseTo(1, 3)
    // Silence after: it falls more slowly.
    const silent = frame({
      playing: true,
      heard: { level: 0, bands: new Float32Array(SPECTRUM_BANDS) },
    })
    follower.step(silent)
    for (const band of signals.bands) {
      expect(band).toBeLessThan(1)
      expect(band).toBeGreaterThan(0.8)
    }
  })

  it('keeps every level between nothing and full, whatever is heard', () => {
    const wild: Heard = { level: 7, bands: new Float32Array(SPECTRUM_BANDS).fill(9) }
    const signals = run(new VisualFollower(), frame({ playing: true, heard: wild, input: 5 }), 3)
    for (const level of [
      signals.mix,
      signals.low,
      signals.mid,
      signals.high,
      signals.input,
      ...signals.bands,
    ]) {
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(1)
    }
  })
})

describe('time and travel', () => {
  it('runs time on evenly, whether the piece plays or not', () => {
    const follower = new VisualFollower()
    follower.step(frame({ dtSec: 0.05, playing: false }))
    follower.step(frame({ dtSec: 0.05, playing: true }))
    expect(follower.signals.time).toBeCloseTo(0.1, 10)
  })

  it('takes no frame to be longer than a tenth of a second, or shorter than none', () => {
    const follower = new VisualFollower()
    follower.step(frame({ dtSec: 30 }))
    expect(follower.signals.time).toBeCloseTo(0.1, 10)
    const travel = follower.signals.travel
    follower.step(frame({ dtSec: -5 }))
    expect(follower.signals.time).toBeCloseTo(0.1, 10)
    expect(follower.signals.travel).toBe(travel)
  })

  it('only ever travels on', () => {
    const follower = new VisualFollower()
    const strokes = [stroke(), hit()]
    let before = follower.signals.travel
    expect(before).toBe(0)
    for (let count = 0; count < 400; count++) {
      // Forward, back, loud, silent, playing and stopped by turns.
      const playheadSec = (count * 7.3) % 16
      const playing = count % 3 === 0
      const energy = (count % 11) / 10
      const heard = count % 2 ? loud() : null
      follower.step(
        frame({ playheadSec, playing, energy, strokes, heard, dtSec: 0.001 + (count % 5) * 0.01 }),
      )
      expect(follower.signals.travel).toBeGreaterThan(before)
      before = follower.signals.travel
    }
  })

  it('travels faster when the music is fuller', () => {
    const quiet = run(new VisualFollower(), frame({ playing: true, heard: null }), 4).travel
    const full = run(new VisualFollower(), frame({ playing: true, heard: loud() }), 4).travel
    const calm = run(
      new VisualFollower(),
      frame({ playing: true, heard: loud(), energy: 0 }),
      4,
    ).travel
    expect(quiet).toBeGreaterThan(0)
    expect(full).toBeGreaterThan(quiet * 1.5)
    expect(calm).toBeLessThan(quiet)
  })
})

describe('cues and played notes', () => {
  it('shows no cue, hit or note before there was one', () => {
    const { signals } = new VisualFollower().step(frame())
    expect([signals.cue, signals.hits, signals.keys]).toEqual([0, 0, 0])
  })

  it('raises the cue and the hits on a cue, and lets both fall', () => {
    const follower = new VisualFollower()
    follower.step(frame({ playheadSec: 4 }))
    follower.cue()
    const { signals } = follower.step(frame({ playheadSec: 4 }))
    expect(signals.cue).toBeGreaterThan(0.95)
    expect(signals.hits).toBeGreaterThan(0.95)
    run(follower, frame({ playheadSec: 4 }), 0.6)
    // A hit is gone sooner than a cue.
    expect(signals.cue).toBeLessThan(0.7)
    expect(signals.cue).toBeGreaterThan(0.5)
    expect(signals.hits).toBeLessThan(0.45)
    expect(signals.hits).toBeGreaterThan(0.25)
    run(follower, frame({ playheadSec: 4 }), 10)
    expect(signals.cue).toBeLessThan(0.001)
    expect(signals.hits).toBeLessThan(0.001)
  })

  it('leaves a flare in the picture of the piece where the playhead stood', () => {
    const follower = new VisualFollower()
    follower.step(frame({ playheadSec: 4 }))
    expect(follower.signals.map.every((part) => part === 0)).toBe(true)
    follower.cue()
    const { signals } = follower.step(frame({ playheadSec: 4 }))
    const column = Math.floor(0.25 * MAP_W)
    const lit = Array.from({ length: MAP_H }, (_, y) => signals.map[(y * MAP_W + column) * 4 + 3])
    expect(Math.max(...lit)).toBeGreaterThan(100)
    // It is where the cue fell, not all over the piece.
    const far = Array.from(
      { length: MAP_H },
      (_, y) => signals.map[(y * MAP_W + MAP_W - 1) * 4 + 3],
    )
    expect(Math.max(...far)).toBe(0)
    // And in the colour hits have.
    const brightest = lit.indexOf(Math.max(...lit))
    const cell = (brightest * MAP_W + column) * 4
    expect(signals.map[cell]).toBeGreaterThan(signals.map[cell + 1])
    expect(signals.map[cell]).toBeGreaterThan(signals.map[cell + 2])
  })

  it('keeps the flare where it fell when the playhead moves on, and lets it fade', () => {
    const follower = new VisualFollower()
    follower.step(frame({ playheadSec: 4 }))
    follower.cue()
    const column = Math.floor(0.25 * MAP_W)
    const lightIn = (y: number): number => follower.signals.map[(y * MAP_W + column) * 4 + 3]
    const brightest = (): number => Math.max(...Array.from({ length: MAP_H }, (_, y) => lightIn(y)))
    follower.step(frame({ playheadSec: 12 }))
    const fresh = brightest()
    expect(fresh).toBeGreaterThan(100)
    run(follower, frame({ playheadSec: 12 }), 1)
    expect(brightest()).toBeGreaterThan(0)
    expect(brightest()).toBeLessThan(fresh)
    run(follower, frame({ playheadSec: 12 }), 5)
    expect(follower.signals.map.every((part) => part === 0)).toBe(true)
  })

  it('raises the keys on a played note, louder for a louder note, and lets them fall', () => {
    const follower = new VisualFollower()
    follower.step(frame())
    follower.note()
    expect(follower.step(frame()).signals.keys).toBeGreaterThan(0.95)
    expect(run(follower, frame(), 0.7).keys).toBeLessThan(0.4)
    expect(run(follower, frame(), 8).keys).toBeLessThan(0.001)

    follower.note(0)
    const soft = follower.step(frame()).signals.keys
    follower.note(0.5)
    const medium = follower.step(frame()).signals.keys
    follower.note(1)
    const hard = follower.step(frame()).signals.keys
    expect(soft).toBeGreaterThan(0.3)
    expect(medium).toBeGreaterThan(soft)
    expect(hard).toBeGreaterThan(medium)
    // A note leaves the cue and the hits alone.
    expect(follower.signals.cue).toBeLessThan(0.001)
    expect(follower.signals.hits).toBeLessThan(0.001)
  })
})

describe('the picture of the piece', () => {
  it('has light where a sounding stroke lies and none far from any stroke', () => {
    const { signals } = new VisualFollower().step(frame({ playheadSec: 6, strokes: [stroke()] }))
    // On the stroke: from 4 s to 12 s of 16, in the middle of the room.
    expect(lightAt(signals, 6 / 16, 0.5)).toBeGreaterThan(200)
    expect(lightAt(signals, 10 / 16, 0.5)).toBeGreaterThan(0)
    // Before it starts, and at the back and the front of the room.
    expect(lightAt(signals, 1 / 16, 0.5)).toBe(0)
    expect(lightAt(signals, 6 / 16, 0)).toBe(0)
    expect(lightAt(signals, 6 / 16, 0.99)).toBe(0)
  })

  it('shows a stroke in its colour', () => {
    const { signals } = new VisualFollower().step(
      frame({ playheadSec: 6, strokes: [stroke({ colour: [0.2, 0.4, 0.8] })] }),
    )
    const cell = (Math.floor(0.5 * MAP_H) * MAP_W + Math.floor((6 / 16) * MAP_W)) * 4
    const [red, green, blue, light] = signals.map.slice(cell, cell + 4)
    expect(light).toBe(255)
    expect(red).toBeLessThan(green)
    expect(green).toBeLessThan(blue)
    expect(blue).toBeGreaterThan(190)
    expect(blue).toBeLessThanOrEqual(0.8 * 255)
  })

  it('shows a stroke faintly while it waits and brightly while it plays', () => {
    const waiting = new VisualFollower().step(
      frame({ playheadSec: 1, strokes: [stroke()] }),
    ).signals
    const sounding = new VisualFollower().step(
      frame({ playheadSec: 6, strokes: [stroke()] }),
    ).signals
    const faint = lightAt(waiting, 6 / 16, 0.5)
    expect(faint).toBeGreaterThan(0)
    expect(faint).toBeLessThan(100)
    expect(lightAt(sounding, 6 / 16, 0.5)).toBeGreaterThan(faint * 2)
  })

  it('puts a stroke at the back of the room at the top and one at the front at the bottom', () => {
    const back = new VisualFollower().step(
      frame({ playheadSec: 6, strokes: [stroke({ depth: 0.1 })] }),
    ).signals
    const front = new VisualFollower().step(
      frame({ playheadSec: 6, strokes: [stroke({ depth: 0.9 })] }),
    ).signals
    expect(lightAt(back, 6 / 16, 0.1)).toBeGreaterThan(200)
    expect(lightAt(back, 6 / 16, 0.9)).toBe(0)
    expect(lightAt(front, 6 / 16, 0.9)).toBeGreaterThan(200)
    expect(lightAt(front, 6 / 16, 0.1)).toBe(0)
  })

  it('is dark for a piece with no strokes or no length', () => {
    expect(new VisualFollower().step(frame()).signals.map.every((part) => part === 0)).toBe(true)
    const noLength = new VisualFollower().step(
      frame({ pieceSec: 0, playheadSec: 6, strokes: [stroke()] }),
    ).signals
    expect(noLength.map.every((part) => part === 0)).toBe(true)
  })

  it('is painted anew every frame', () => {
    const follower = new VisualFollower()
    follower.step(frame({ playheadSec: 6, strokes: [stroke()] }))
    expect(lightAt(follower.signals, 6 / 16, 0.5)).toBeGreaterThan(0)
    follower.step(frame({ playheadSec: 6 }))
    expect(follower.signals.map.every((part) => part === 0)).toBe(true)
  })
})
