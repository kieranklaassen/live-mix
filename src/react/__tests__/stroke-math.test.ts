import { describe, expect, it } from 'vitest'

import { type WaveformPeaks } from '../../core/clips/peaks'
import {
  automationPositions,
  capInset,
  fadeEase,
  fadeGainAt,
  fadePaths,
  hitPositions,
  levelsBarsPath,
  levelsOutlinePath,
  passPhase,
  repeatSeams,
  STROKE_INSET_PX,
  strokeLevels,
  strokeRepeats,
} from '../components/stroke-math'

/** A ramp: silent at the start, full scale at the end. */
function rampPeaks(buckets = 100): WaveformPeaks {
  const max = Float32Array.from({ length: buckets }, (_, index) => index / (buckets - 1))
  return { min: max.map((value) => -value), max }
}

const flatPeaks = (buckets = 64, level = 1): WaveformPeaks => ({
  min: new Float32Array(buckets).fill(-level),
  max: new Float32Array(buckets).fill(level),
})

describe('stroke fades', () => {
  it('eases from silence to unity and clamps outside', () => {
    expect(fadeEase(0)).toBe(0)
    expect(fadeEase(0.5)).toBeCloseTo(0.5)
    expect(fadeEase(1)).toBeCloseTo(1)
    expect(fadeEase(2)).toBeCloseTo(1)
    expect(fadeEase(-1)).toBe(0)
  })

  it('takes the lower of the fade in and the fade out', () => {
    expect(fadeGainAt(0.5)).toBe(1)
    expect(fadeGainAt(0, 0.25, 0)).toBe(0)
    expect(fadeGainAt(0.25, 0.25, 0)).toBeCloseTo(1)
    expect(fadeGainAt(1, 0, 0.25)).toBeCloseTo(0)
    expect(fadeGainAt(0.875, 0, 0.25)).toBeCloseTo(0.5)
  })

  it('draws a fade from either end with its handle where the fade ends', () => {
    const left = fadePaths(0.25, 200, 40)
    expect(left.handle).toEqual([50, 3.5])
    expect(left.curve.startsWith('M0.0 20')).toBe(true)
    const right = fadePaths(0.25, 200, 40, true)
    expect(right.handle).toEqual([150, 3.5])
    expect(right.curve.startsWith('M200.0 20')).toBe(true)
    expect(right.shade.endsWith('Z')).toBe(true)
  })
})

describe('strokeLevels', () => {
  it('lays one column every 2 px and keeps the waveform inside the pill', () => {
    const width = 200
    const height = 40
    const levels = strokeLevels({ width, height, peaks: flatPeaks() })
    expect(levels).toHaveLength(100)
    expect(levels[0][0]).toBe(1)
    const room = height / 2 - STROKE_INSET_PX
    for (const [x, amp] of levels) {
      expect(amp).toBeLessThanOrEqual(Math.max(0.5, room - capInset(x, width, height)) + 1e-9)
    }
    // Full scale in the straight part, squeezed by the round ends.
    expect(levels[50][1]).toBeCloseTo(room)
    expect(levels[0][1]).toBeLessThan(levels[50][1])
  })

  it('draws a flat line without peaks', () => {
    const levels = strokeLevels({ width: 80, height: 20 })
    expect(new Set(levels.map(([, amp]) => amp))).toEqual(new Set([0.5]))
  })

  it('follows the source, reversed when asked', () => {
    const options = { width: 400, height: 40, peaks: rampPeaks() }
    const forward = strokeLevels(options)
    expect(forward[150][1]).toBeGreaterThan(forward[50][1])
    const backward = strokeLevels({ ...options, reversed: true })
    expect(backward[150][1]).toBeLessThan(backward[50][1])
  })

  it('repeats the source across the stroke', () => {
    const levels = strokeLevels({ width: 400, height: 40, peaks: rampPeaks(), repeats: 2 })
    // Column 90 is late in the first pass, column 110 early in the second.
    expect(levels[90][1]).toBeGreaterThan(levels[110][1])
    expect(levels[190][1]).toBeCloseTo(levels[90][1], 0)
  })

  it('begins partway into a pass where it is given a phase, and comes round to the top from there', () => {
    const options = { width: 400, height: 40, peaks: rampPeaks(), repeats: 2 }
    const whole = strokeLevels(options)
    const cut = strokeLevels({ ...options, phase: 0.25 })
    // A quarter of a pass is 50 px, 25 columns: the stroke starts where the whole one is by then.
    expect(cut[20][1]).toBeCloseTo(whole[45][1], 5)
    expect(cut[60][1]).toBeCloseTo(whole[85][1], 5)
    // It comes to the top of the sound after 150 px: column 70 is late in the pass, column 80 early in the next.
    expect(cut[70][1]).toBeGreaterThan(cut[80][1])
    // Reversed it reads the pass from its far end, from as far into it.
    const backward = strokeLevels({ ...options, reversed: true })
    const cutBackward = strokeLevels({ ...options, reversed: true, phase: 0.25 })
    expect(cutBackward[60][1]).toBeCloseTo(backward[85][1], 5)
  })

  it('draws a stroke with no phase, or one that is no fraction of a pass, as it always did', () => {
    const options = { width: 400, height: 40, peaks: rampPeaks(), repeats: 2.5, fadeIn: 0.1 }
    const plain = strokeLevels(options)
    for (const phase of [0, -0.2, 1, 1.5, Number.NaN]) {
      expect(strokeLevels({ ...options, phase })).toEqual(plain)
      expect(passPhase(phase)).toBe(0)
    }
    expect(passPhase(undefined)).toBe(0)
    expect(passPhase(0.4)).toBe(0.4)
  })

  it('applies fades and gain to what it draws', () => {
    const base = { width: 400, height: 40, peaks: flatPeaks() }
    const faded = strokeLevels({ ...base, fadeIn: 0.5 })
    expect(faded[25][1]).toBeLessThan(faded[150][1])
    const quiet = strokeLevels({ ...base, gain: 0.5 })
    expect(quiet[100][1]).toBeCloseTo(strokeLevels(base)[100][1] / 2)
  })

  it('normalises a quiet source unless told not to', () => {
    const base = { width: 400, height: 40, peaks: flatPeaks(64, 0.25) }
    expect(strokeLevels(base)[100][1]).toBeCloseTo(17)
    expect(strokeLevels({ ...base, normalize: false })[100][1]).toBeCloseTo(4.25)
  })
})

describe('stroke paths', () => {
  const levels = strokeLevels({ width: 40, height: 20, peaks: flatPeaks() })

  it('draws one bar per column, mirrored about the centre', () => {
    const path = levelsBarsPath(levels, 10)
    expect(path.match(/M/g)).toHaveLength(levels.length)
    expect(path).toContain('M21 3.0V17.0')
  })

  it('closes the outline and never leaves the stroke', () => {
    const path = levelsOutlinePath(levels, 10, 40, 1.4)
    expect(path.startsWith('M0 10')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    const ys = [...path.matchAll(/L[\d.]+ ([\d.-]+)/g)].map((match) => Number(match[1]))
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ys)).toBeLessThanOrEqual(20)
    expect(levelsOutlinePath([], 10, 40)).toBe('')
  })
})

describe('repeats, hits and automation', () => {
  it('puts a seam where each later pass starts', () => {
    expect(repeatSeams(1, 300)).toEqual([])
    expect(repeatSeams(3, 300)).toEqual([100, 200])
    expect(repeatSeams(2.5, 250)).toEqual([100, 200])
    // A seam on the very end of the stroke is not drawn.
    expect(repeatSeams(2, 200)).toEqual([100])
  })

  it('puts the seams of a stroke that begins partway into a pass where its sound comes round', () => {
    // Three passes of 100 px, begun a quarter in: the top of the sound is 75 px on, and every 100 after.
    expect(repeatSeams(3, 300, 0.25)).toEqual([75, 175, 275])
    // Shorter than a pass, and still across the top of the sound once.
    expect(repeatSeams(0.8, 80, 0.5)).toEqual([50])
    expect(strokeRepeats(0.8, 0.5)).toBe(true)
    // Not as far as the top: no seam.
    expect(repeatSeams(0.4, 40, 0.5)).toEqual([])
    expect(strokeRepeats(0.4, 0.5)).toBe(false)
    expect(strokeRepeats(1)).toBe(false)
    expect(strokeRepeats(1.2)).toBe(true)
    // No phase: as before.
    expect(repeatSeams(3, 300, 0)).toEqual(repeatSeams(3, 300))
  })

  it('repeats the hits of one pass across every pass', () => {
    expect(hitPositions([0, 0.5], 1, 200)).toEqual([0, 100])
    expect(hitPositions([0, 0.5], 2, 200)).toEqual([0, 50, 100, 150])
    // The partial last pass keeps only the hits that fit.
    expect(hitPositions([0, 0.5], 1.25, 250)).toEqual([0, 100, 200])
    expect(hitPositions([0.25], 1, 200, true)).toEqual([150])
  })

  it('moves the hits of a stroke that begins partway into a pass back by as much', () => {
    // Two passes of 100 px begun a quarter in: the hit at the top is first seen at 75 px.
    expect(hitPositions([0, 0.5], 2, 200, false, 0.25)).toEqual([25, 75, 125, 175])
    // The part of a third pass it reaches has its hits too.
    expect(hitPositions([0.1], 2, 200, false, 0.5)).toEqual([60, 160])
    expect(hitPositions([0.25], 1, 200, true, 0.5)).toEqual([50])
    expect(hitPositions([0, 0.5], 2, 200, false, 0)).toEqual(hitPositions([0, 0.5], 2, 200))
  })

  it('maps automation breakpoints into the stroke, high values at the top', () => {
    const points = [
      [0, 0],
      [0.5, 1],
      [2, 0.5],
    ] as const
    expect(automationPositions(points, 212, 40)).toEqual([
      [6, 29],
      [106, 5],
      [206, 20],
    ])
  })

  it('keeps automation nodes inside the rounded ends', () => {
    const [[x, y]] = automationPositions([[0, 0]], 400, 100)
    expect(y).toBeLessThanOrEqual(100 - capInset(x, 400, 100) - 5 + 0.5)
    expect(y).toBeGreaterThan(50)
  })
})
