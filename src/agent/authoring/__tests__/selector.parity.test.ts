// Parity goldens: `selectTracksForSession` must pick exactly what tuin's
// `music_selector.py` picked for the same fixture library, seed and duration
// (`fixtures/selector-goldens.json`, recorded by scripts/selector-parity-goldens.py
// against the read-only tuin checkout). 90 cases across three libraries cover
// the intensity ladder, the Camelot filter, both fallbacks and exhaustion.

import { describe, expect, it } from 'vitest'

import { type AgentTrack } from '../../types'
import { PythonRandom } from '../pythonRandom'
import {
  fallbackIntensities,
  pythonChooser,
  sectionTargetIntensity,
  selectNextTrack,
  selectTracksForSection,
  selectTracksForSession,
} from '../selector'
import goldens from './fixtures/selector-goldens.json'
import libraries from './fixtures/selector-library.json'

type Library = keyof typeof libraries

function library(name: string): AgentTrack[] {
  return libraries[name as Library]
}

describe('PythonRandom', () => {
  // Values from CPython 3.12: random.seed(42); [getrandbits(32) for _ in range(3)], random(), choice(range(238)).
  it('reproduces CPython MT19937 words, floats and choice for an int seed', () => {
    const r = new PythonRandom(42)
    expect([r.getrandbits(32), r.getrandbits(32), r.getrandbits(32)]).toEqual([
      2746317213, 478163327, 107420369,
    ])
    const seeded = new PythonRandom(42)
    expect(seeded.random()).toBeCloseTo(0.6394267984578837, 15)
    expect(seeded.random()).toBeCloseTo(0.025010755222666936, 15)
    expect(new PythonRandom(0).choice(Array.from({ length: 238 }, (_, i) => i))).toBe(216)
  })

  it('seeds from big integers the way random.seed splits them into 32-bit words', () => {
    const r = new PythonRandom(2n ** 40n + 7n)
    expect(r.getrandbits(32)).toBe(2635837658)
  })

  it('rejection-samples randbelow and refuses empty choices', () => {
    const r = new PythonRandom(1)
    for (let i = 0; i < 200; i += 1) expect(r.randbelow(7)).toBeLessThan(7)
    expect(() => r.choice([])).toThrow(/empty/)
    expect(() => r.getrandbits(33)).toThrow(RangeError)
  })
})

describe('selector parity with tuin music_selector.py', () => {
  it('covers every seed and duration the generator recorded', () => {
    expect(goldens.cases.length).toBe(
      goldens.seeds.length * goldens.durations.length * Object.keys(libraries).length,
    )
  })

  it.each(goldens.cases.map((c) => [c.library, c.seed, c.totalSec, c] as const))(
    '%s seed %d, %d s: same tracks, same order, same durations',
    (name, seed, totalSec, expected) => {
      const result = selectTracksForSession(totalSec, library(name), { seed })
      expect(result.sections.map((section) => section.tracks.map((t) => String(t.id)))).toEqual(
        expected.sections.map((section) => section.ids),
      )
      expect(result.sections.map((section) => section.totalDurationSec)).toEqual(
        expected.sections.map((section) => section.totalDurationSec),
      )
      expect([...result.usedIds].sort()).toEqual(expected.usedIds)
      expect(result.sectionTargetSec).toBe(Math.floor(totalSec / 3))
    },
  )

  it('exercises the fallback and exhaustion paths in the goldens', () => {
    const sparse = goldens.cases.filter((c) => c.library === 'sparse')
    // No intensity-3 track exists: the active section falls back to [2, 3] and still fills.
    expect(sparse.every((c) => c.sections[1].ids.length > 0)).toBe(true)
    const exhausted = goldens.cases.filter((c) =>
      c.sections.some((s) => s.totalDurationSec < Math.floor(c.totalSec / 3)),
    )
    expect(exhausted.length).toBeGreaterThan(0)
  })
})

describe('selector rules', () => {
  const tracks = library('standard')

  it('targets the tuin intensity ladder per section and position', () => {
    expect([0, 1, 2, 3].map((i) => sectionTargetIntensity(1, i, 4))).toEqual([1, 1, 2, 2])
    expect([0, 1, 2].map((i) => sectionTargetIntensity(1, i, 3))).toEqual([1, 2, 2])
    expect([0, 1].map((i) => sectionTargetIntensity(1, i, 2))).toEqual([1, 2])
    expect(sectionTargetIntensity(1, 0, 1)).toBe(1)
    expect(sectionTargetIntensity(2, 5, 4)).toBe(3)
    expect(sectionTargetIntensity(3, 0, 4)).toBe(1)
    expect(sectionTargetIntensity(3, 0, 4, { ...tracks[0], intensity: 3 })).toBe(2)
    expect(sectionTargetIntensity(3, 1, 4, { ...tracks[0], intensity: 2 })).toBe(1)
    expect(fallbackIntensities(2)).toEqual([2, 3])
    expect(fallbackIntensities(1)).toEqual([1, 2])
  })

  it('keeps the harmonic filter only when it leaves a candidate', () => {
    const first = (candidates: readonly AgentTrack[]) => candidates[0]
    const anchor: AgentTrack = { id: 'x', title: 'X', intensity: 3, camelot: '8A', durationSec: 1 }
    const pick = selectNextTrack(2, tracks, { previous: anchor, chooser: first })
    expect([7, 8, 9]).toContain(Number.parseInt(pick?.camelot ?? '0', 10))
    const far: AgentTrack = { id: 'y', title: 'Y', intensity: 3, camelot: '2B', durationSec: 1 }
    const only: AgentTrack[] = [
      { id: 'o1', title: 'O1', intensity: 3, camelot: '8A', durationSec: 1 },
      { id: 'o2', title: 'O2', intensity: 3, camelot: '9B', durationSec: 1 },
    ]
    // Nothing near 2B: the filter is dropped rather than leaving the section empty.
    expect(selectNextTrack(2, only, { previous: far, chooser: first })?.id).toBe('o1')
    // An "Unknown" anchor skips the filter entirely; an Unknown candidate never passes it.
    const unknown = { ...far, camelot: 'Unknown' }
    expect(selectNextTrack(2, only, { previous: unknown, chooser: first })?.id).toBe('o1')
    const mixed: AgentTrack[] = [
      { id: 'm1', title: 'M1', intensity: 3, camelot: 'Unknown', durationSec: 1 },
      { id: 'm2', title: 'M2', intensity: 3, camelot: '7A', durationSec: 1 },
    ]
    expect(selectNextTrack(2, mixed, { previous: anchor, chooser: first })?.id).toBe('m2')
  })

  it('never repeats a track and stops when the library is exhausted', () => {
    const used = new Set<string>()
    const section = selectTracksForSection(10_000, 2, tracks, { chooser: pythonChooser(3), used })
    const ids = section.tracks.map((t) => String(t.id))
    expect(new Set(ids).size).toBe(ids.length)
    expect(section.totalDurationSec).toBeLessThan(10_000)
    expect(selectNextTrack(2, tracks, { used, chooser: pythonChooser(3) })).toBeNull()
  })

  it('accepts a custom chooser and is deterministic for a seed', () => {
    const a = selectTracksForSession(1200, tracks, { seed: 9 })
    const b = selectTracksForSession(1200, tracks, { seed: 9 })
    expect(a).toEqual(b)
    const longest = selectTracksForSession(1200, tracks, {
      chooser: (candidates) =>
        candidates.reduce((best, c) => (c.durationSec > best.durationSec ? c : best)),
    })
    for (const section of longest.sections) {
      expect(section.tracks.length).toBeGreaterThan(0)
    }
  })
})
