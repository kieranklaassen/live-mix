import { describe, expect, it } from 'vitest'

import { type ClipTurns } from '../Clip'
import { clipSourceIds, clipSourceOnPass, sameTurns, turnLength, turnOnPass } from '../turns'

describe('clip turns', () => {
  const turns: ClipTurns = { sourceIds: ['a', 'b', 'c'], every: 2 }

  it('a clip without turns plays its own source on every pass', () => {
    for (const pass of [0, 1, 7, 400]) {
      expect(clipSourceOnPass({ sourceId: 'own' }, pass)).toBe('own')
    }
  })

  it('each turn lasts `every` passes and the first comes again after the last', () => {
    const played = Array.from({ length: 8 }, (_, pass) =>
      clipSourceOnPass({ sourceId: 'a', turns }, pass),
    )
    expect(played).toEqual(['a', 'a', 'b', 'b', 'c', 'c', 'a', 'a'])
  })

  it('a turn lasts one pass when the clip does not say', () => {
    const played = Array.from({ length: 4 }, (_, pass) =>
      clipSourceOnPass({ sourceId: 'a', turns: { sourceIds: ['a', 'b'] } }, pass),
    )
    expect(played).toEqual(['a', 'b', 'a', 'b'])
  })

  it('is a function of the pass alone: any pass can be asked for, in any order', () => {
    const clip = { sourceId: 'a', turns }
    expect(clipSourceOnPass(clip, 1000)).toBe(clipSourceOnPass(clip, 1000))
    expect(clipSourceOnPass(clip, 1000)).toBe(['a', 'b', 'c'][Math.floor(1000 / 2) % 3])
    expect(clipSourceOnPass(clip, 3)).toBe('b')
  })

  it('the turns say what plays: the clip’s own source is one only where it is listed', () => {
    const clip = { sourceId: 'drawn', turns: { sourceIds: ['x', 'y'] } }
    expect(clipSourceOnPass(clip, 0)).toBe('x')
    expect(clipSourceOnPass(clip, 1)).toBe('y')
    expect(clipSourceIds(clip)).toEqual(['drawn', 'x', 'y'])
  })

  it('a pass before the first, and one that is no number, is the first', () => {
    expect(turnOnPass(turns, -3)).toBe(0)
    expect(turnOnPass(turns, Number.NaN)).toBe(0)
    expect(turnOnPass(turns, 2.9)).toBe(1)
  })

  it('a length that is not a whole number from 1 is brought to one', () => {
    expect(turnLength({})).toBe(1)
    expect(turnLength({ every: 0 })).toBe(1)
    expect(turnLength({ every: -4 })).toBe(1)
    expect(turnLength({ every: Number.NaN })).toBe(1)
    expect(turnLength({ every: 3.7 })).toBe(3)
  })

  it('turns that name no source leave the clip on its own', () => {
    expect(clipSourceOnPass({ sourceId: 'own', turns: { sourceIds: [] } }, 5)).toBe('own')
    expect(turnOnPass({ sourceIds: [] }, 5)).toBe(0)
  })

  it('lists every source once, the clip’s own first', () => {
    expect(clipSourceIds({ sourceId: 'a' })).toEqual(['a'])
    expect(clipSourceIds({ sourceId: 'a', turns: { sourceIds: ['a', 'b', 'a', 'c'] } })).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('tells the same turns from other ones', () => {
    expect(sameTurns(undefined, undefined)).toBe(true)
    expect(sameTurns(turns, undefined)).toBe(false)
    expect(sameTurns(turns, { sourceIds: ['a', 'b', 'c'], every: 2 })).toBe(true)
    expect(sameTurns({ sourceIds: ['a'] }, { sourceIds: ['a'], every: 1 })).toBe(true)
    expect(sameTurns(turns, { sourceIds: ['a', 'b', 'c'], every: 4 })).toBe(false)
    expect(sameTurns(turns, { sourceIds: ['a', 'c', 'b'], every: 2 })).toBe(false)
    expect(sameTurns(turns, { sourceIds: ['a', 'b'], every: 2 })).toBe(false)
  })
})
