import { describe, expect, it } from 'vitest'

import { TempoMap } from '../../time/TempoMap'
import {
  describeQuantize,
  followTimeSeconds,
  isFollowTime,
  isLaunchQuantize,
  quantizeLaunch,
  sameQuantize,
} from '../launch'

// 120 BPM 4/4: a beat is 0.5 s, a bar 2 s.
const tempo = TempoMap.constant(120)

describe('quantizeLaunch', () => {
  it('AE3: a launch 300 ms before the bar starts on the bar, not immediately', () => {
    expect(quantizeLaunch(tempo, 7.7, 'bar')).toBe(8)
    expect(quantizeLaunch(tempo, 7.7, 'none')).toBe(7.7)
  })

  it('matches TempoMap.quantize for bars and beats', () => {
    for (const sec of [0, 0.1, 0.5, 1.9, 2, 2.25, 13.999]) {
      expect(quantizeLaunch(tempo, sec, 'bar')).toBe(tempo.quantize(sec, 'bar'))
      expect(quantizeLaunch(tempo, sec, 'beat')).toBe(tempo.quantize(sec, 'beat'))
    }
  })

  it('a position on the grid is its own launch time', () => {
    expect(quantizeLaunch(tempo, 8, 'bar')).toBe(8)
    expect(quantizeLaunch(tempo, 8.5, 'beat')).toBe(8.5)
    expect(quantizeLaunch(tempo, 16, 4)).toBe(16)
    expect(quantizeLaunch(tempo, 6, { seconds: 3 })).toBe(6)
  })

  it('n bars snaps to the next multiple of n bars from the origin', () => {
    // Bars are 2 s: 4 bars = 8 s.
    expect(quantizeLaunch(tempo, 0.1, 4)).toBe(8)
    expect(quantizeLaunch(tempo, 8.1, 4)).toBe(16)
    expect(quantizeLaunch(tempo, 15.99, 4)).toBe(16)
    expect(quantizeLaunch(tempo, 3, 2)).toBe(4)
    expect(quantizeLaunch(tempo, 4.5, 1)).toBe(6)
    expect(quantizeLaunch(tempo, 0, 8)).toBe(0)
  })

  it('seconds snaps to the next multiple of the period', () => {
    expect(quantizeLaunch(tempo, 0.2, { seconds: 1.5 })).toBe(1.5)
    expect(quantizeLaunch(tempo, 1.5, { seconds: 1.5 })).toBe(1.5)
    expect(quantizeLaunch(tempo, 1.51, { seconds: 1.5 })).toBe(3)
  })

  it('follows tempo changes on the map', () => {
    // 60 BPM for the first 4 s (one bar), then 120 BPM (bars of 2 s).
    const map = new TempoMap([
      { atSec: 0, bpm: 60 },
      { atSec: 4, bpm: 120 },
    ])
    expect(quantizeLaunch(map, 1, 'bar')).toBe(4)
    expect(quantizeLaunch(map, 4.1, 'bar')).toBe(6)
    expect(quantizeLaunch(map, 3.2, 'beat')).toBe(4)
    expect(quantizeLaunch(map, 4.1, 'beat')).toBe(4.5)
    expect(quantizeLaunch(map, 5, 2)).toBe(6) // bar 2 is the next even bar: 4 + 2
  })

  it('rejects non-finite positions and degenerate grids', () => {
    expect(() => quantizeLaunch(tempo, NaN, 'bar')).toThrow(/finite/)
    expect(() => quantizeLaunch(tempo, 1, 0)).toThrow(/positive/)
    expect(() => quantizeLaunch(tempo, 1, { seconds: -1 })).toThrow(/positive/)
  })

  it('recognises and describes quantisation settings', () => {
    expect(isLaunchQuantize('bar')).toBe(true)
    expect(isLaunchQuantize('none')).toBe(true)
    expect(isLaunchQuantize(2)).toBe(true)
    expect(isLaunchQuantize({ seconds: 0.5 })).toBe(true)
    expect(isLaunchQuantize(0)).toBe(false)
    expect(isLaunchQuantize('bars')).toBe(false)
    expect(isLaunchQuantize({ seconds: 0 })).toBe(false)
    expect(isLaunchQuantize(null)).toBe(false)
    expect(describeQuantize('bar')).toBe('1 bar')
    expect(describeQuantize('beat')).toBe('1 beat')
    expect(describeQuantize('none')).toBe('none')
    expect(describeQuantize(4)).toBe('4 bars')
    expect(describeQuantize({ seconds: 2 })).toBe('2 s')
    expect(sameQuantize({ seconds: 2 }, { seconds: 2 })).toBe(true)
    expect(sameQuantize({ seconds: 2 }, 2)).toBe(false)
    expect(sameQuantize('bar', 'bar')).toBe(true)
  })
})

describe('followTimeSeconds', () => {
  it('seconds pass through; bars are measured on the map from the start position', () => {
    expect(followTimeSeconds(tempo, 3, { unit: 'seconds', value: 2.5 })).toBe(2.5)
    expect(followTimeSeconds(tempo, 8, { unit: 'bars', value: 2 })).toBe(4)
    // From mid-bar: two bars later is still two bars of seconds away.
    expect(followTimeSeconds(tempo, 8.5, { unit: 'bars', value: 2 })).toBeCloseTo(4)
    expect(followTimeSeconds(tempo, 0, { unit: 'bars', value: 0.5 })).toBe(1)
  })

  it('crosses tempo changes', () => {
    const map = new TempoMap([
      { atSec: 0, bpm: 60 },
      { atSec: 4, bpm: 120 },
    ])
    // Bar 0 is 4 s long, bar 1 is 2 s: two bars from 0 end at 6.
    expect(followTimeSeconds(map, 0, { unit: 'bars', value: 2 })).toBe(6)
  })

  it('recognises follow times', () => {
    expect(isFollowTime({ unit: 'bars', value: 1 })).toBe(true)
    expect(isFollowTime({ unit: 'seconds', value: 0.25 })).toBe(true)
    expect(isFollowTime({ unit: 'beats', value: 1 })).toBe(false)
    expect(isFollowTime({ unit: 'bars', value: 0 })).toBe(false)
    expect(isFollowTime('1 bar')).toBe(false)
  })
})
