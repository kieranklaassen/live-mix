// The order a way's takes are played in over a stretch of passes: a list of
// take numbers for a host to name in a clip's turns. An order is decided by
// how many takes there are, a seed and a length, and by nothing else. Every
// order holds its rule across the join of its list, since a clip plays the
// list round.

import { draw, mod } from '../vary'
import { type WayTakes } from './types'

/** The orders a host lists, in menu order. */
export const TAKE_ORDERS = [
  {
    id: 'in-turn',
    name: 'In turn',
    words: "The way's own round, over and over: each take where the way itself puts it.",
  },
  {
    id: 'dealt',
    name: 'Dealt',
    words:
      'Every take once before any comes twice, in an order drawn anew for each deal, and never the same take twice running.',
  },
  {
    id: 'mostly-stays',
    name: 'Mostly stays',
    words:
      'Keeps a take for a few passes, then moves to the one beside it, and finds its way back.',
  },
  {
    id: 'grows',
    name: 'Grows',
    words:
      'The first take, then the first two, then the first three, until all of them have played.',
  },
] as const

export type TakeOrder = (typeof TAKE_ORDERS)[number]['id']

export interface TakeOrderOptions {
  /** How many passes the list is for. An order gives the nearest length its rule allows. */
  length: number
  /** Any whole number: the same seed gives the same list. Only the orders that draw read it. */
  seed?: number
  /** How many passes each place in the order is held for (default 1). */
  holds?: number
}

/** What is drawn from, so no two draws of an order are the same one. */
const DEAL = 1
const STAY = 2
const MOVE = 3

const upTo = (count: number): number[] => Array.from({ length: count }, (_, index) => index)
const times = <T>(count: number, value: T): T[] => Array.from({ length: count }, () => value)

/** Each take once, in an order drawn for this deal; never starting on the take the last deal ended on. */
function deal(takes: number, seed: number, index: number, before: number | undefined): number[] {
  // Two takes can only alternate.
  if (takes === 2) return [0, 1]
  const order = upTo(takes)
  for (let place = takes - 1; place > 0; place -= 1) {
    const other = Math.floor(draw(seed, DEAL, index, place) * (place + 1))
    ;[order[place], order[other]] = [order[other], order[place]]
  }
  if (order[0] === before) [order[0], order[1]] = [order[1], order[0]]
  return order
}

function dealt(takes: number, seed: number, steps: number): number[] {
  const deals = Math.max(1, Math.round(steps / takes))
  const out: number[] = []
  for (let index = 0; index < deals; index += 1) {
    const order = deal(takes, seed, index, out[out.length - 1])
    // The last deal ends on another take than the first deal starts on: the list is played round.
    if (index > 0 && index === deals - 1 && order[takes - 1] === out[0]) {
      ;[order[takes - 1], order[takes - 2]] = [order[takes - 2], order[takes - 1]]
    }
    out.push(...order)
  }
  return out
}

/**
 * Out from the first take and back again, a neighbour at a time, two to four
 * places on each: the way back is the way out, so the list ends on the take
 * it starts on.
 */
function mostlyStays(takes: number, seed: number, steps: number): number[] {
  const out: number[] = []
  let take = 0
  let left = steps
  while (left >= 6) {
    const stay = Math.min(
      2 + Math.floor(draw(seed, STAY, out.length) * 3),
      Math.floor((left - 2) / 2),
    )
    out.push(...times(stay, take))
    left -= 2 * stay
    take = mod(take + (draw(seed, MOVE, out.length) < 0.5 ? 1 : -1), takes)
  }
  const turn = times(Math.max(1, left), take)
  return [...out, ...turn, ...[...out].reverse()]
}

function grows(takes: number, steps: number): number[] {
  const out: number[] = []
  for (let row = 1; row <= takes; row += 1) {
    // A row is played where the list is nearer the asked length with it than without it.
    if (row > 1 && out.length + row / 2 > steps) return out
    out.push(...upTo(row))
  }
  const whole = Math.max(0, Math.round((steps - out.length) / takes))
  for (let row = 0; row < whole; row += 1) out.push(...upTo(takes))
  return out
}

/** The way's own round, over and over. */
const inTurn = (round: readonly number[], steps: number): number[] =>
  times(Math.max(1, Math.round(steps / round.length)), round).flat()

function placesOf(
  order: TakeOrder,
  takes: number,
  round: readonly number[],
  seed: number,
  steps: number,
): number[] {
  if (takes === 1) return times(steps, 0)
  switch (order) {
    case 'dealt':
      return dealt(takes, seed, steps)
    case 'mostly-stays':
      return mostlyStays(takes, seed, steps)
    case 'grows':
      return grows(takes, steps)
    // In turn, and an order the table does not have.
    default:
      return inTurn(round, steps)
  }
}

/**
 * The takes of a way (`wayTakes`) in `order`, as a list of take numbers about
 * `options.length` passes long: the nearest length the order's rule allows,
 * so that it still holds where the end of the list meets its start. None for
 * a way with nothing to play, or for a length that is no number of passes.
 */
export function takeOrder(
  order: TakeOrder,
  of: Pick<WayTakes, 'takes' | 'round'>,
  options: TakeOrderOptions,
): number[] {
  const takes = Math.floor(of.takes)
  if (!(takes >= 1) || !Number.isFinite(options.length)) return []
  const holds = Math.max(1, Math.floor(options.holds ?? 1))
  const steps = Math.max(1, Math.round(options.length / holds))
  const seed = options.seed ?? 0
  const round = of.round.length > 0 ? of.round : upTo(takes)
  return placesOf(order, takes, round, seed, steps).flatMap((take) => times(holds, take))
}
