// The ways a factory sound's phrase is written (../sounds/recipe.ts), held to
// what the renderer needs of them. No audio: the sounds themselves are
// rendered in factory.test.ts.

import { describe, expect, it } from 'vitest'

import { cycled, looped, played } from '../sounds/recipe'

describe('looped', () => {
  it('holds every note through the skipped start, the loop and the fold', () => {
    const recipe = looped(16, 5, 3, [38, [45, 0.6]])
    expect(recipe.phrase.notes).toEqual([
      { atSec: 0, durSec: 25, note: 38 },
      { atSec: 0, durSec: 25, note: 45, gain: 0.6 },
    ])
    expect(recipe).toMatchObject({ durationSec: 16, skipSec: 5, loopCrossfadeSec: 3 })
  })
})

describe('played', () => {
  it('plays each stroke once and ends', () => {
    const recipe = played(
      6,
      [
        [0, 5, 69],
        [1.5, 2, 72, 0.5],
      ],
      0.3,
    )
    expect(recipe.phrase.notes).toEqual([
      { atSec: 0, durSec: 5, note: 69, gain: undefined },
      { atSec: 1.5, durSec: 2, note: 72, gain: 0.5 },
    ])
    expect(recipe).toMatchObject({ durationSec: 6, fadeOutSec: 0.3 })
    expect('loopCrossfadeSec' in recipe).toBe(false)
  })
})

describe('cycled', () => {
  const strokes = [
    [0.2, 1, 69, 0.7],
    [3.1, 2, 72],
  ] as const

  it('plays the strokes once a pass: one dropped, one kept, one folded over the start', () => {
    const recipe = cycled(8, strokes)
    expect(recipe.phrase.notes.map((note) => note.atSec)).toEqual([0.2, 3.1, 8.2, 11.1, 16.2, 19.1])
    expect(recipe.phrase.notes.map((note) => note.note)).toEqual([69, 72, 69, 72, 69, 72])
    expect(recipe).toMatchObject({
      durationSec: 8,
      skipSec: 8,
      loopCrossfadeSec: 0.25,
      loopFold: 'linear',
    })
  })

  it('drops as many passes as it is told, for a tail that outlasts the loop', () => {
    const recipe = cycled(4, strokes.slice(0, 1), { passes: 3, crossfadeSec: 0.5 })
    expect(recipe.phrase.notes.map((note) => note.atSec)).toEqual([0.2, 4.2, 8.2, 12.2, 16.2])
    expect(recipe).toMatchObject({ skipSec: 12, loopCrossfadeSec: 0.5 })
  })
})
