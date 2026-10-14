// The four orders over a way's takes, each held to its own rule, across the
// join of its list as well: a clip plays the list round.

import { describe, expect, it } from 'vitest'

import { TAKE_ORDERS, takeOrder } from '../ways/take-order'

const of = (takes: number, round?: number[]): { takes: number; round: number[] } => ({
  takes,
  round: round ?? Array.from({ length: takes }, (_, index) => index),
})
const SEEDS = [1, 2, 3, 77, 9999]
const ORDERS = TAKE_ORDERS.map((order) => order.id)

describe('takeOrder', () => {
  it('has a name and words a host can list for every order', () => {
    expect(ORDERS).toEqual(['in-turn', 'dealt', 'mostly-stays', 'grows'])
    for (const order of TAKE_ORDERS) {
      expect(order.name.length, order.id).toBeLessThanOrEqual(24)
      expect(order.words.length, order.id).toBeLessThanOrEqual(300)
    }
  })

  it('In turn is the round of the way, repeated', () => {
    expect(takeOrder('in-turn', of(2, [0, 0, 0, 1]), { length: 8 })).toEqual([
      0, 0, 0, 1, 0, 0, 0, 1,
    ])
    // The nearest whole number of rounds: a round is never cut.
    expect(takeOrder('in-turn', of(3), { length: 8 })).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2])
    expect(takeOrder('in-turn', of(3), { length: 1 })).toEqual([0, 1, 2])
  })

  it('Dealt plays every take once before any comes twice, and never one twice running', () => {
    for (const seed of SEEDS) {
      for (const takes of [3, 4, 5, 8]) {
        const list = takeOrder('dealt', of(takes), { seed, length: takes * 4 })
        expect(list).toHaveLength(takes * 4)
        for (let start = 0; start < list.length; start += takes) {
          expect([...list.slice(start, start + takes)].sort(), `seed ${seed}`).toEqual(
            Array.from({ length: takes }, (_, index) => index),
          )
        }
        list.forEach((take, index) => {
          expect(take, `seed ${seed} takes ${takes} at ${index}`).not.toBe(
            list[(index + 1) % list.length],
          )
        })
      }
    }
  })

  it('Dealt with two takes alternates, and differs between seeds with more', () => {
    expect(takeOrder('dealt', of(2), { seed: 5, length: 6 })).toEqual([0, 1, 0, 1, 0, 1])
    const lists = SEEDS.map((seed) => takeOrder('dealt', of(4), { seed, length: 16 }).join(' '))
    expect(new Set(lists).size).toBeGreaterThan(1)
  })

  it('Mostly stays keeps a take for two passes or more, then moves to a neighbour', () => {
    for (const seed of SEEDS) {
      for (const takes of [2, 3, 4, 8]) {
        for (const length of [8, 16, 31, 64]) {
          const list = takeOrder('mostly-stays', of(takes), { seed, length })
          const say = `seed ${seed} takes ${takes} length ${length}`
          expect(list, say).toHaveLength(length)
          expect(list[0], say).toBe(0)
          // Round the join as well: no move of more than one take, wrapping from the last to the first as one.
          list.forEach((take, index) => {
            const step = Math.abs(take - list[(index + 1) % list.length])
            expect(Math.min(step, takes - step), `${say} at ${index}`).toBeLessThanOrEqual(1)
          })
          // Every stay is two passes or longer, counting the one that runs over the join.
          const turned = [
            ...list.slice(list.lastIndexOf(0) + 1),
            ...list.slice(0, list.lastIndexOf(0) + 1),
          ]
          const stays = turned.join('').match(/(\d)\1*/g)
          for (const stay of stays ?? [])
            expect(stay.length, `${say} ${list.join('')}`).toBeGreaterThanOrEqual(2)
        }
      }
      // Long enough to move at all: it does not stay on the first take throughout.
      expect(new Set(takeOrder('mostly-stays', of(4), { seed, length: 32 })).size).toBeGreaterThan(
        1,
      )
    }
  })

  it('Grows plays the first take, then the first two, and so on', () => {
    expect(takeOrder('grows', of(4), { length: 10 })).toEqual([0, 0, 1, 0, 1, 2, 0, 1, 2, 3])
    // Longer: all of them again, a whole row at a time.
    expect(takeOrder('grows', of(4), { length: 18 })).toEqual([
      0, 0, 1, 0, 1, 2, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3,
    ])
    // Shorter: as many whole rows as come nearest.
    expect(takeOrder('grows', of(4), { length: 6 })).toEqual([0, 0, 1, 0, 1, 2])
    expect(takeOrder('grows', of(4), { length: 1 })).toEqual([0])
  })

  it('is that take throughout where there is one take, and nothing where there is none', () => {
    for (const order of ORDERS) {
      expect(takeOrder(order, of(1), { length: 5 }), order).toEqual([0, 0, 0, 0, 0])
      expect(takeOrder(order, { takes: 0, round: [] }, { length: 5 }), order).toEqual([])
    }
  })

  it('holds each place for as many passes as it is asked to', () => {
    expect(takeOrder('in-turn', of(3), { length: 12, holds: 2 })).toEqual([
      0, 0, 1, 1, 2, 2, 0, 0, 1, 1, 2, 2,
    ])
    expect(takeOrder('grows', of(3), { length: 24, holds: 4 })).toEqual(
      [0, 0, 1, 0, 1, 2].flatMap((take) => [take, take, take, take]),
    )
  })

  it('is the same list for the same seed, and only names takes the way has', () => {
    for (const order of ORDERS) {
      for (const seed of SEEDS) {
        const list = takeOrder(order, of(5), { seed, length: 20 })
        expect(takeOrder(order, of(5), { seed, length: 20 }), order).toEqual(list)
        expect(
          list.every((take) => Number.isInteger(take) && take >= 0 && take < 5),
          order,
        ).toBe(true)
      }
    }
  })
})
