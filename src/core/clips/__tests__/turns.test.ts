import { describe, expect, it } from 'vitest'

import { type ClipTurns } from '../Clip'
import {
  clipSourceIds,
  clipSourceOnPass,
  nextOtherTurn,
  sameTurns,
  turnLength,
  turnOnPass,
  turnsRound,
} from '../turns'

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

describe('the different sources of a clip that takes turns', () => {
  const of = (...sourceIds: string[]): ClipTurns => ({ sourceIds })
  /** A host for which `a` and `b` play the same. */
  const alike = (id: string): string => (id === 'b' ? 'a' : id)

  it('numbers each turn by the different source it plays, in the order they first come', () => {
    expect(turnsRound(of('a', 'a', 'b', 'a', 'c'))).toEqual({ each: [0, 0, 1, 0, 2], count: 3 })
    expect(turnsRound(of('a'))).toEqual({ each: [0], count: 1 })
  })

  it('takes the host’s word for which sources are the same', () => {
    expect(turnsRound(of('a', 'a', 'b', 'a', 'c'), alike)).toEqual({
      each: [0, 0, 0, 0, 1],
      count: 2,
    })
  })

  it('the next is the first later turn that plays another source, for the whole of a turn', () => {
    const turns: ClipTurns = { sourceIds: ['a', 'b', 'c', 'd'], every: 4 }
    for (const pass of [0, 1, 2, 3]) expect(nextOtherTurn(turns, pass)).toBe(1)
    expect(nextOtherTurn(turns, 4)).toBe(2)
    expect(nextOtherTurn(turns, 12)).toBe(0)
  })

  it('passes over turns of the same source, and comes round to the start', () => {
    const turns = of('a', 'a', 'b', 'a', 'c')
    expect(nextOtherTurn(turns, 0)).toBe(2)
    expect(nextOtherTurn(turns, 2)).toBe(3)
    expect(nextOtherTurn(turns, 4)).toBe(0)
  })

  it('passes over a turn the host calls the same, and finds none where all are', () => {
    expect(nextOtherTurn(of('a', 'b', 'c'), 0, alike)).toBe(2)
    expect(nextOtherTurn(of('a', 'b', 'c'), 2, alike)).toBe(0)
    expect(nextOtherTurn(of('a', 'b'), 0, alike)).toBeNull()
    expect(nextOtherTurn(of('a', 'b'), 0)).toBe(1)
  })

  it('turns that are all one source have no next', () => {
    expect(nextOtherTurn(of('a', 'a', 'a'), 1)).toBeNull()
    expect(nextOtherTurn(of('a'), 0)).toBeNull()
  })

  it('turns that name no source have none, and a pass before the first is the first', () => {
    expect(turnsRound(of())).toEqual({ each: [], count: 0 })
    expect(nextOtherTurn(of(), 3)).toBeNull()
    expect(nextOtherTurn(of('a', 'b', 'c'), -5)).toBe(1)
    expect(nextOtherTurn(of('a', 'b', 'c'), Number.NaN)).toBe(1)
  })
})
