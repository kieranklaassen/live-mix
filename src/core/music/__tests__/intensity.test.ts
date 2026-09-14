import { describe, expect, it } from 'vitest'

import {
  INTENSITY_LABELS,
  INTENSITY_LADDER,
  MAX_INTENSITY,
  MIN_INTENSITY,
  clampIntensity,
  rankTonal,
  resolveReplacementTracks,
  targetIntensity,
  tonalPreference,
  type IntensityTrack,
  type ResolveReplacementsOptions,
} from '../intensity'

interface Track extends IntensityTrack {
  title: string
}

function track(id: number, intensity: number, camelot: string, durationSec = 180): Track {
  return { id, title: `Track ${id}`, intensity, camelot, durationSec }
}

const firstChooser = (candidates: Track[]): Track => candidates[0]

function resolve(
  overrides: Partial<ResolveReplacementsOptions<Track>> & { library: Track[] },
): Track[] {
  return resolveReplacementTracks<Track>({
    currentTrack: { intensity: 2, camelot: '8A' },
    direction: 'change',
    remainingSeconds: 60,
    chooser: firstChooser,
    ...overrides,
  })
}

describe('the ladder', () => {
  it('is 1 grounding, 2 settled, 3 active', () => {
    expect(INTENSITY_LADDER).toEqual([1, 2, 3])
    expect(MIN_INTENSITY).toBe(1)
    expect(MAX_INTENSITY).toBe(3)
    expect(INTENSITY_LABELS[1]).toBe('grounding')
    expect(INTENSITY_LABELS[3]).toBe('active')
  })

  it('clamps and rounds onto the ladder', () => {
    expect(clampIntensity(0)).toBe(1)
    expect(clampIntensity(2.4)).toBe(2)
    expect(clampIntensity(9)).toBe(3)
    expect(clampIntensity(NaN)).toBe(1)
  })
})

// Parity with Breathwork Live's musicResolver.test.ts (the resolver moved here).
describe('targetIntensity', () => {
  it('steps down for calmer with a floor of 1', () => {
    expect(targetIntensity(3, 'calmer')).toBe(2)
    expect(targetIntensity(2, 'calmer')).toBe(1)
    expect(targetIntensity(1, 'calmer')).toBe(1)
  })

  it('steps up for stronger and more-intense with a cap of 3', () => {
    expect(targetIntensity(1, 'stronger')).toBe(2)
    expect(targetIntensity(2, 'more-intense')).toBe(3)
    expect(targetIntensity(3, 'stronger')).toBe(3)
  })

  it('keeps the intensity for change, brighter and darker', () => {
    expect(targetIntensity(1, 'change')).toBe(1)
    expect(targetIntensity(3, 'change')).toBe(3)
    expect(targetIntensity(2, 'brighter')).toBe(2)
    expect(targetIntensity(2, 'darker')).toBe(2)
    expect(tonalPreference('brighter')).toBe('brighter')
    expect(tonalPreference('calmer')).toBeNull()
  })
})

describe('resolveReplacementTracks', () => {
  it('picks only Camelot-compatible tracks at the target intensity', () => {
    const library = [track(1, 1, '3B'), track(2, 1, '9A'), track(3, 2, '8A')]
    const picks = resolve({
      library,
      currentTrack: { intensity: 2, camelot: '8A' },
      direction: 'calmer',
      remainingSeconds: 100,
    })
    expect(picks.map((t) => t.id)).toEqual([2])
  })

  it('is letter-agnostic and wraps the wheel mod 12', () => {
    const library = [track(1, 1, '6A'), track(2, 1, '1B')]
    const picks = resolve({
      library,
      currentTrack: { intensity: 1, camelot: '12A' },
      remainingSeconds: 100,
    })
    expect(picks.map((t) => t.id)).toEqual([2])
  })

  it('falls back to any track at the target intensity when none are compatible', () => {
    const library = [track(1, 1, '3B'), track(2, 2, '8A')]
    const picks = resolve({
      library,
      currentTrack: { intensity: 2, camelot: '8A' },
      direction: 'calmer',
      remainingSeconds: 100,
    })
    expect(picks.map((t) => t.id)).toEqual([1])
  })

  it('falls back to adjacent intensities when the target is exhausted', () => {
    const library = [track(1, 2, '8A'), track(2, 3, '8A')]
    const picks = resolve({
      library,
      currentTrack: { intensity: 2, camelot: '8A' },
      direction: 'calmer',
      remainingSeconds: 100,
    })
    expect(picks.map((t) => t.id)).toEqual([1])
  })

  it('never picks excluded (recently played) tracks', () => {
    const library = [track(1, 1, '8A'), track(2, 1, '8A')]
    const picks = resolve({
      library,
      currentTrack: { intensity: 1, camelot: '8A' },
      excludeIds: [1],
      remainingSeconds: 100,
    })
    expect(picks.map((t) => t.id)).toEqual([2])
  })

  it('greedily fills until the summed duration covers the remaining seconds', () => {
    const library = [
      track(1, 1, '8A', 120),
      track(2, 1, '8A', 120),
      track(3, 1, '8A', 120),
      track(4, 1, '8A', 120),
    ]
    const picks = resolve({
      library,
      currentTrack: { intensity: 1, camelot: '8A' },
      remainingSeconds: 250,
    })
    expect(picks.map((t) => t.id)).toEqual([1, 2, 3])
  })

  it('anchors each next pick on the previous pick, not the original track', () => {
    const library = [track(1, 1, '9A', 60), track(2, 1, '10A', 60), track(3, 1, '7A', 60)]
    const picks = resolve({
      library,
      currentTrack: { intensity: 1, camelot: '8A' },
      remainingSeconds: 120,
    })
    // 8A → 9A (first compatible), then 9A → 10A (compatible with 9, not with 8's 7).
    expect(picks.map((t) => t.id)).toEqual([1, 2])
  })

  it('always delivers at least one track near a boundary', () => {
    const picks = resolve({ library: [track(1, 2, '8A')], remainingSeconds: 0 })
    expect(picks).toHaveLength(1)
  })

  it('returns nothing when the library is exhausted', () => {
    expect(resolve({ library: [], remainingSeconds: 100 })).toEqual([])
  })

  it('an explicit target intensity overrides the direction', () => {
    const library = [track(1, 1, '8A'), track(2, 3, '8A')]
    const picks = resolve({
      library,
      currentTrack: { intensity: 1, camelot: '8A' },
      direction: 'calmer',
      targetIntensity: 3,
      remainingSeconds: 10,
    })
    expect(picks.map((t) => t.id)).toEqual([2])
  })

  it('uses the injected random source for the default chooser', () => {
    const library = [track(1, 2, '8A'), track(2, 2, '8A'), track(3, 2, '8A')]
    const picks = resolveReplacementTracks({
      library,
      currentTrack: { intensity: 2, camelot: '8A' },
      remainingSeconds: 10,
      random: () => 0.99,
    })
    expect(picks.map((t) => t.id)).toEqual([3])
  })
})

describe('tonal directions', () => {
  it('brighter prefers major and the clockwise neighbour; darker minor and the anticlockwise one', () => {
    const candidates = [track(1, 2, '7A'), track(2, 2, '8A'), track(3, 2, '9A'), track(4, 2, '9B')]
    expect(rankTonal('8A', candidates, 'brighter').map((t) => t.id)).toEqual([4, 3, 2, 1])
    expect(rankTonal('8A', candidates, 'darker').map((t) => t.id)).toEqual([1, 2, 3, 4])
  })

  it('ranks unparseable keys last and keeps input order on ties', () => {
    const candidates = [track(1, 2, 'Unknown'), track(2, 2, '8B'), track(3, 2, '8B')]
    expect(rankTonal('8A', candidates, 'brighter').map((t) => t.id)).toEqual([2, 3, 1])
  })

  it('the resolver picks the best-ranked candidate deterministically for a tonal direction', () => {
    const library = [track(1, 2, '7A'), track(2, 2, '9B'), track(3, 2, '8A')]
    const picks = resolveReplacementTracks({
      library,
      currentTrack: { intensity: 2, camelot: '8A' },
      direction: 'brighter',
      remainingSeconds: 10,
    })
    expect(picks.map((t) => t.id)).toEqual([2])
    const darker = resolveReplacementTracks({
      library,
      currentTrack: { intensity: 2, camelot: '8A' },
      direction: 'darker',
      remainingSeconds: 10,
    })
    expect(darker.map((t) => t.id)).toEqual([1])
  })
})
