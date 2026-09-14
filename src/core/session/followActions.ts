// Follow actions: what a slot does once its follow time has passed. Two
// candidate actions, A and B, with the probability of A; the runtime draws
// from an injected random source (seeded in tests) and resolves the chosen
// action against the slot's column — the slots with clips on the same track,
// in scene order. Chains of these are the generative structure ambient sets
// are built from (plan R8).

import { type FollowTime, isFollowTime } from './launch'
import { type ScoreSlot } from './Slot'

/**
 * - `none`: keep playing; the follow time re-arms so the draw repeats.
 * - `stop`: stop the slot at the follow time.
 * - `again`: relaunch the same slot from its start.
 * - `previous` / `next`: the neighbouring slot in the column, wrapping.
 * - `first` / `last`: the ends of the column.
 * - `any`: a uniform draw over the column, including the slot itself.
 * - `other`: a uniform draw over the column excluding the slot (`again` when alone).
 */
export type FollowActionKind =
  'none' | 'stop' | 'again' | 'previous' | 'next' | 'first' | 'last' | 'any' | 'other'

export const FOLLOW_ACTION_KINDS: readonly FollowActionKind[] = [
  'none',
  'stop',
  'again',
  'previous',
  'next',
  'first',
  'last',
  'any',
  'other',
]

export interface ScoreFollowAction {
  a: FollowActionKind
  b: FollowActionKind
  /** Probability that A is drawn (0..1); B is drawn otherwise. */
  chance: number
  /** Measured from the launch; absent means the slot clip's duration (one pass). */
  time?: FollowTime
}

export function isFollowActionKind(value: unknown): value is FollowActionKind {
  return typeof value === 'string' && (FOLLOW_ACTION_KINDS as readonly string[]).includes(value)
}

export function isFollowAction(value: unknown): value is ScoreFollowAction {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const raw = value as Record<string, unknown>
  return (
    isFollowActionKind(raw.a) &&
    isFollowActionKind(raw.b) &&
    typeof raw.chance === 'number' &&
    raw.chance >= 0 &&
    raw.chance <= 1 &&
    (raw.time === undefined || isFollowTime(raw.time))
  )
}

/** A follow action with the field order fixed and `time` only when set. */
export function normaliseFollowAction(follow: ScoreFollowAction): ScoreFollowAction {
  const out: ScoreFollowAction = { a: follow.a, b: follow.b, chance: follow.chance }
  if (follow.time !== undefined) out.time = { unit: follow.time.unit, value: follow.time.value }
  return out
}

/** Draw A with probability `chance`, else B. `random` yields [0, 1). */
export function drawFollowAction(
  follow: Pick<ScoreFollowAction, 'a' | 'b' | 'chance'>,
  random: () => number,
): FollowActionKind {
  if (follow.chance >= 1) return follow.a
  if (follow.chance <= 0) return follow.b
  return random() < follow.chance ? follow.a : follow.b
}

/** What a resolved follow action asks the runtime to do. */
export type FollowOutcome =
  { kind: 'continue' } | { kind: 'stop' } | { kind: 'launch'; slot: ScoreSlot }

/**
 * Resolve `action` for `current` within `column` — the track's slots that
 * hold a clip, in scene order. `random` is only consulted for `any`/`other`.
 * A column that no longer contains the slot (it was removed mid-play)
 * resolves neighbours from the column's ends.
 */
export function resolveFollowAction(
  action: FollowActionKind,
  current: ScoreSlot,
  column: readonly ScoreSlot[],
  random: () => number,
): FollowOutcome {
  const playable = column.filter((slot) => slot.clip !== null)
  const index = playable.findIndex((slot) => slot.id === current.id)
  const launch = (slot: ScoreSlot | undefined): FollowOutcome =>
    slot ? { kind: 'launch', slot } : { kind: 'stop' }
  switch (action) {
    case 'none':
      return { kind: 'continue' }
    case 'stop':
      return { kind: 'stop' }
    case 'again':
      return current.clip ? { kind: 'launch', slot: current } : { kind: 'stop' }
    case 'next':
      if (playable.length === 0) return { kind: 'stop' }
      return launch(playable[index === -1 ? 0 : (index + 1) % playable.length])
    case 'previous':
      if (playable.length === 0) return { kind: 'stop' }
      return launch(
        playable[
          index === -1 ? playable.length - 1 : (index - 1 + playable.length) % playable.length
        ],
      )
    case 'first':
      return launch(playable[0])
    case 'last':
      return launch(playable[playable.length - 1])
    case 'any':
      return launch(playable[uniformIndex(random, playable.length)])
    case 'other': {
      const others = playable.filter((slot) => slot.id !== current.id)
      if (others.length === 0)
        return current.clip ? { kind: 'launch', slot: current } : { kind: 'stop' }
      return launch(others[uniformIndex(random, others.length)])
    }
    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

function uniformIndex(random: () => number, length: number): number {
  if (length <= 0) return 0
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)))
}

/** Short label for menus and history entries. */
export function describeFollowAction(follow: ScoreFollowAction): string {
  const percent = Math.round(follow.chance * 100)
  const when =
    follow.time === undefined
      ? 'at clip end'
      : follow.time.unit === 'bars'
        ? `after ${follow.time.value} bars`
        : `after ${follow.time.value} s`
  if (follow.a === follow.b || percent === 100) return `${follow.a} ${when}`
  if (percent === 0) return `${follow.b} ${when}`
  return `${follow.a} ${percent}% / ${follow.b} ${100 - percent}% ${when}`
}
