import { describe, expect, it } from 'vitest'

import { seededRandom } from '../../../score/__tests__/fixtures'
import {
  describeFollowAction,
  drawFollowAction,
  isFollowAction,
  normaliseFollowAction,
  resolveFollowAction,
  type FollowActionKind,
} from '../followActions'
import { defaultSlot, type ScoreSlot } from '../Slot'

const clip = {
  sourceId: 'a',
  offsetSec: 0,
  durationSec: 4,
  fadeInSec: 0,
  fadeOutSec: 0,
  fadeCurve: 'linear' as const,
  gainDb: 0,
}

function slot(id: string, scene: string, withClip = true): ScoreSlot {
  return defaultSlot({ id, track: 'kick', scene, clip: withClip ? clip : null })
}

// The column: s1, s2 (empty stop slot), s3, s4 in scene order.
const column = [slot('s1', 'a'), slot('s2', 'b', false), slot('s3', 'c'), slot('s4', 'd')]
const [s1, , s3, s4] = column

function launched(outcome: ReturnType<typeof resolveFollowAction>): string | null {
  return outcome.kind === 'launch' ? outcome.slot.id : outcome.kind
}

describe('drawFollowAction', () => {
  it('draws A with the given probability from a seeded source', () => {
    const random = seededRandom(7)
    let a = 0
    for (let i = 0; i < 2000; i += 1) {
      if (drawFollowAction({ a: 'next', b: 'stop', chance: 0.3 }, random) === 'next') a += 1
    }
    expect(a / 2000).toBeGreaterThan(0.26)
    expect(a / 2000).toBeLessThan(0.34)
  })

  it('is deterministic for a seed and never consults the source at the ends', () => {
    const sequence = (seed: number): FollowActionKind[] => {
      const random = seededRandom(seed)
      return Array.from({ length: 12 }, () =>
        drawFollowAction({ a: 'next', b: 'previous', chance: 0.5 }, random),
      )
    }
    expect(sequence(3)).toEqual(sequence(3))
    expect(sequence(3)).not.toEqual(sequence(4))
    const boom = (): number => {
      throw new Error('should not draw')
    }
    expect(drawFollowAction({ a: 'next', b: 'stop', chance: 1 }, boom)).toBe('next')
    expect(drawFollowAction({ a: 'next', b: 'stop', chance: 0 }, boom)).toBe('stop')
  })
})

describe('resolveFollowAction', () => {
  const never = (): number => {
    throw new Error('should not draw')
  }

  it('walks the column of slots with clips, skipping empty ones and wrapping', () => {
    expect(launched(resolveFollowAction('next', s1, column, never))).toBe('s3')
    expect(launched(resolveFollowAction('next', s3, column, never))).toBe('s4')
    expect(launched(resolveFollowAction('next', s4, column, never))).toBe('s1')
    expect(launched(resolveFollowAction('previous', s1, column, never))).toBe('s4')
    expect(launched(resolveFollowAction('previous', s4, column, never))).toBe('s3')
    expect(launched(resolveFollowAction('first', s3, column, never))).toBe('s1')
    expect(launched(resolveFollowAction('last', s1, column, never))).toBe('s4')
    expect(launched(resolveFollowAction('again', s3, column, never))).toBe('s3')
    expect(launched(resolveFollowAction('stop', s3, column, never))).toBe('stop')
    expect(launched(resolveFollowAction('none', s3, column, never))).toBe('continue')
  })

  it('any draws over the whole column, other over the rest', () => {
    const random = seededRandom(11)
    const any = new Set<string | null>()
    const other = new Set<string | null>()
    for (let i = 0; i < 200; i += 1) {
      any.add(launched(resolveFollowAction('any', s3, column, random)))
      other.add(launched(resolveFollowAction('other', s3, column, random)))
    }
    expect([...any].sort()).toEqual(['s1', 's3', 's4'])
    expect([...other].sort()).toEqual(['s1', 's4'])
    // Alone in the column, `other` plays again.
    expect(launched(resolveFollowAction('other', s1, [s1], random))).toBe('s1')
    // An empty slot alone has nothing to play again.
    const empty = slot('e', 'x', false)
    expect(launched(resolveFollowAction('other', empty, [empty], random))).toBe('stop')
    expect(launched(resolveFollowAction('again', empty, [empty], random))).toBe('stop')
  })

  it('resolves from the column ends when the slot is no longer in it, and stops on an empty column', () => {
    const gone = slot('gone', 'z')
    expect(launched(resolveFollowAction('next', gone, column, never))).toBe('s1')
    expect(launched(resolveFollowAction('previous', gone, column, never))).toBe('s4')
    expect(launched(resolveFollowAction('next', gone, [], never))).toBe('stop')
    expect(launched(resolveFollowAction('first', gone, [], never))).toBe('stop')
    expect(launched(resolveFollowAction('any', gone, [], never))).toBe('stop')
  })
})

describe('follow action records', () => {
  it('validates, normalises and describes', () => {
    expect(isFollowAction({ a: 'next', b: 'stop', chance: 0.5 })).toBe(true)
    expect(
      isFollowAction({ a: 'next', b: 'stop', chance: 0.5, time: { unit: 'bars', value: 4 } }),
    ).toBe(true)
    expect(isFollowAction({ a: 'next', b: 'stop', chance: 1.5 })).toBe(false)
    expect(isFollowAction({ a: 'jump', b: 'stop', chance: 0.5 })).toBe(false)
    expect(isFollowAction({ a: 'next', b: 'stop', chance: 0.5, time: { unit: 'bars' } })).toBe(
      false,
    )
    expect(isFollowAction(null)).toBe(false)
    expect(
      normaliseFollowAction({
        time: { value: 2, unit: 'seconds' },
        chance: 1,
        b: 'none',
        a: 'next',
      }),
    ).toEqual({ a: 'next', b: 'none', chance: 1, time: { unit: 'seconds', value: 2 } })
    expect(describeFollowAction({ a: 'next', b: 'stop', chance: 0.75 })).toBe(
      'next 75% / stop 25% at clip end',
    )
    expect(
      describeFollowAction({ a: 'any', b: 'any', chance: 0.5, time: { unit: 'bars', value: 4 } }),
    ).toBe('any after 4 bars')
    expect(
      describeFollowAction({
        a: 'next',
        b: 'stop',
        chance: 0,
        time: { unit: 'seconds', value: 3 },
      }),
    ).toBe('stop after 3 s')
  })
})
