// Turns: a clip that plays another source on some passes. Which source is a
// pure function of the clip and a counted pass, never of when it was asked
// or what played before, so a piece that takes turns plays the same way
// every time, a pass can be gone back to, and a bounce hears what a live
// pass heard. The same question is asked by the track that plays the clip,
// by whatever holds its samples, and by a host that draws or renders it.

import { type Clip, type ClipTurns } from './Clip'

/** How many counted passes a turn lasts: a whole number from 1, whatever was written. */
export function turnLength(turns: Pick<ClipTurns, 'every'>): number {
  const every = turns.every
  return every !== undefined && Number.isFinite(every) && every >= 1 ? Math.floor(every) : 1
}

/**
 * Which turn a clip is on in counted pass `pass` (0 is the first), as an
 * index into `turns.sourceIds`. A pass before the first is the first.
 */
export function turnOnPass(turns: ClipTurns, pass: number): number {
  const count = turns.sourceIds.length
  if (count === 0) return 0
  const counted = Number.isFinite(pass) && pass > 0 ? Math.floor(pass) : 0
  return Math.floor(counted / turnLength(turns)) % count
}

/**
 * The source a clip plays on counted pass `pass`: its turn's, or its own
 * `sourceId` when it takes no turns.
 */
export function clipSourceOnPass(clip: Pick<Clip, 'sourceId' | 'turns'>, pass: number): string {
  const turns = clip.turns
  if (!turns || turns.sourceIds.length === 0) return clip.sourceId
  return turns.sourceIds[turnOnPass(turns, pass)]
}

/** Two turns are the same when they name the same source, for a host that says no more. */
const sameSource = (sourceId: string): string => sourceId

/** Which different source each turn of a clip plays, and how many there are. */
export interface TurnsRound {
  /** For each turn, the number of the different source it plays, from 0 in the order they first come. */
  each: number[]
  /** How many different sources the turns play. */
  count: number
}

/**
 * The round of a clip's turns as a host draws it: turns of one source are one
 * and the same. `key` is the host's word for what a source plays, for a host
 * that can tell two sources play the same (the same notes rendered twice);
 * left out, two turns are the same when they name the same source.
 */
export function turnsRound(
  turns: ClipTurns,
  key: (sourceId: string) => string = sameSource,
): TurnsRound {
  const seen = new Map<string, number>()
  const each = turns.sourceIds.map((sourceId) => {
    const name = key(sourceId)
    let number = seen.get(name)
    if (number === undefined) {
      number = seen.size
      seen.set(name, number)
    }
    return number
  })
  return { each, count: seen.size }
}

/**
 * The turn that comes next with another source than the one counted pass
 * `pass` plays, as an index into `turns.sourceIds`: the first later turn,
 * coming round to the start, that is not the same. Null when every turn plays
 * the same. `key` is as in `turnsRound`.
 */
export function nextOtherTurn(
  turns: ClipTurns,
  pass: number,
  key: (sourceId: string) => string = sameSource,
): number | null {
  const count = turns.sourceIds.length
  if (count === 0) return null
  const on = turnOnPass(turns, pass)
  const sounding = key(turns.sourceIds[on])
  for (let step = 1; step < count; step += 1) {
    const index = (on + step) % count
    if (key(turns.sourceIds[index]) !== sounding) return index
  }
  return null
}

/** Every source a clip may play, each once: its own first, then its turns' in order. */
export function clipSourceIds(clip: Pick<Clip, 'sourceId' | 'turns'>): string[] {
  return [...new Set([clip.sourceId, ...(clip.turns?.sourceIds ?? [])])]
}

/** True when two clips take the same turns, or neither takes any. */
export function sameTurns(a: ClipTurns | undefined, b: ClipTurns | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    turnLength(a) === turnLength(b) &&
    a.sourceIds.length === b.sourceIds.length &&
    a.sourceIds.every((id, index) => id === b.sourceIds[index])
  )
}
