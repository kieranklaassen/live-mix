import { describe, expect, it } from 'vitest'

import { TempoMap } from '../TempoMap'

describe('TempoMap (constant tempo)', () => {
  const map = TempoMap.constant(120)

  it('converts seconds to beats and back at 120 bpm', () => {
    expect(map.secondsToBeats(0)).toBe(0)
    expect(map.secondsToBeats(1)).toBe(2)
    expect(map.secondsToBeats(2.25)).toBe(4.5)
    expect(map.beatsToSeconds(4.5)).toBe(2.25)
    expect(map.beatsToSeconds(map.secondsToBeats(31.7))).toBeCloseTo(31.7, 10)
    expect(map.bpmAt(100)).toBe(120)
    expect(map.secondsPerBeatAt(0)).toBe(0.5)
  })

  it('reports bar and beat in 4/4', () => {
    expect(map.barBeatAt(0)).toEqual({ bar: 0, beat: 0 })
    expect(map.barBeatAt(1.5)).toEqual({ bar: 0, beat: 3 })
    expect(map.barBeatAt(2)).toEqual({ bar: 1, beat: 0 })
    expect(map.barBeatAt(2.25).bar).toBe(1)
    expect(map.barBeatAt(2.25).beat).toBeCloseTo(0.5)
    expect(map.barToSeconds(3)).toBe(6)
  })

  it('quantizes to the next bar, beat or sub-beat, leaving grid positions alone', () => {
    expect(map.quantize(0, 'bar')).toBe(0)
    expect(map.quantize(2, 'bar')).toBe(2)
    expect(map.quantize(1.7, 'bar')).toBe(2)
    expect(map.quantize(2.01, 'bar')).toBe(4)
    expect(map.quantize(0.6, 'beat')).toBe(1)
    expect(map.quantize(0.6, 0.5)).toBeCloseTo(0.75)
    expect(map.quantize(0.75, 0.5)).toBeCloseTo(0.75)
    expect(() => map.quantize(1, 0)).toThrow(/positive/)
  })
})

describe('TempoMap (tempo changes and meters)', () => {
  // 4 s at 120 (8 beats, 2 bars), then 60 bpm in 3/4 from 4 s.
  const map = new TempoMap([
    { atSec: 0, bpm: 120, beatsPerBar: 4 },
    { atSec: 4, bpm: 60, beatsPerBar: 3 },
  ])

  it('accumulates beats and bars across segments', () => {
    expect(map.secondsToBeats(4)).toBe(8)
    expect(map.secondsToBeats(7)).toBe(11)
    expect(map.beatsToSeconds(11)).toBe(7)
    expect(map.barBeatAt(4)).toEqual({ bar: 2, beat: 0 })
    expect(map.barBeatAt(7)).toEqual({ bar: 3, beat: 0 })
    expect(map.barBeatAt(8).bar).toBe(3)
    expect(map.barBeatAt(8).beat).toBeCloseTo(1)
    expect(map.barToSeconds(2)).toBe(4)
    expect(map.barToSeconds(3)).toBe(7)
    expect(map.bpmAt(3.999)).toBe(120)
    expect(map.bpmAt(4)).toBe(60)
    expect(map.beatsPerBarAt(5)).toBe(3)
  })

  it('quantizes across the change', () => {
    expect(map.quantize(3.9, 'bar')).toBe(4)
    expect(map.quantize(4.5, 'bar')).toBe(7)
    expect(map.quantize(4.2, 'beat')).toBe(5)
  })

  it('validates segments and sorts them', () => {
    expect(() => new TempoMap([])).toThrow(/at least one/)
    expect(() => new TempoMap([{ atSec: 1, bpm: 120 }])).toThrow(/start at 0/)
    expect(() => new TempoMap([{ atSec: 0, bpm: 0 }])).toThrow(/positive bpm/)
    const unsorted = new TempoMap([
      { atSec: 4, bpm: 60 },
      { atSec: 0, bpm: 120 },
    ])
    expect(unsorted.tempoSegments.map((s) => s.atSec)).toEqual([0, 4])
    // A later segment inherits the meter when it does not set one.
    expect(unsorted.beatsPerBarAt(5)).toBe(4)
  })
})
