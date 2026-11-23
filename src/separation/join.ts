// Several separators that stand as one. Each is run over the track in turn
// and the stems the set keeps of it are kept, so a set of models that each
// answer one stem, four models each kept for the stem it does best, and one
// model's vocals beside another's three all go where one separator goes. A
// set of one is how a host picks some of a separator's stems, or says them
// in another order.
//
// The separators run one after another and never two at once, and a stem the
// set does not keep is let go before the next separator starts: a model
// makes every stem it has, and four minutes of stereo is 85 MB a stem.

import { checkedNames, saidNames, unnamedKey } from './names'
import { SeparationError, type Channels, type SeparateOptions, type Separator } from './types'

/** One separator of a set, and the stems the set keeps of it. */
export interface JoinMember<Name extends string = string> {
  separator: Separator<Name>
  /**
   * The stems kept of the separator, in the order the set says them. Left
   * out, every stem of the separator is kept, in the separator's order.
   */
  take?: readonly Name[]
}

/**
 * The names a set keeps of one of its separators, as far as the types tell:
 * what its `take` names where it has one, the separator's stems where it has
 * none, and any name where that cannot be told.
 */
export type JoinedName<Member> = Member extends { take: readonly (infer Take extends string)[] }
  ? Take
  : Member extends { separator: Separator<infer Name>; take?: undefined }
    ? Name
    : string

/** A separator of a set once the set has been looked over: the stems it names, and the ones kept of it. */
interface Checked {
  separator: Separator<string>
  names: readonly string[]
  kept: readonly string[]
}

/**
 * The stems the set keeps of what `member`'s separator gives of `channels`,
 * by name. The answer is held to the stems the separator names, as
 * `separateTrack` holds one. Nothing else of the answer leaves this
 * function, so a stem that is not kept is held by nobody once it has
 * returned.
 */
async function keptOf(
  member: Checked,
  channels: Channels,
  options: SeparateOptions,
): Promise<Record<string, Channels>> {
  const { separator, names, kept } = member
  const given: Record<string, Channels> | null | undefined = await separator.separate(
    channels,
    options,
  )
  // A separator that answers nothing at all has answered no stem.
  const answer: Partial<Record<string, Channels>> = given ?? {}
  // A stem the separator did not name would be left in the remainder without a word.
  const unnamed = unnamedKey(Object.keys(answer), names)
  if (unnamed !== undefined) {
    throw new SeparationError(
      `a separator of a set answered a stem it does not name, ${unnamed}: its stems are [${names.join(', ')}]`,
    )
  }
  const stems: Record<string, Channels> = {}
  // Every stem the separator names is looked for, kept or not, among the
  // answer's own keys and nothing it inherits.
  for (const name of names) {
    const stem = Object.hasOwn(answer, name) ? answer[name] : undefined
    if (stem === undefined) {
      throw new SeparationError(
        `a separator of a set answered nothing for ${name}: its stems are [${names.join(', ')}]`,
      )
    }
    if (kept.includes(name)) stems[name] = stem
  }
  return stems
}

/**
 * The separators of `set` as one separator. Its stems are the kept names in
 * order: each member's `take` in the order it names them, the members in the
 * order they are given. A member with no `take` keeps every stem of its
 * separator, and a separator that says no stems answers the four.
 *
 * A run asks the separators one after another, each with the channels and
 * the signal the run was handed, and holds each answer to the stems its
 * separator names. The signal is looked at before the first separator is
 * asked and when each has answered, so a separator after a stop is not
 * asked at all. A separator that rejects makes the run reject with the same
 * error.
 *
 * The set says its `steps` as the sum of its separators', a separator that
 * says none being one step, and reports one count that rises across them. A
 * separator that says its steps has each of its reports passed on, counted
 * on from the separators before it. One that does not is counted once, when
 * it has answered, and what it reports itself is not passed on.
 *
 * Throws a `SeparationError` when the set is empty, when a separator's stems
 * or a `take` are no list of names, when a `take` names a stem its separator
 * does not answer, when one name is kept twice across the set, and when the
 * separators' sample rates differ.
 */
export function joinSeparators<const Set extends readonly JoinMember[]>(
  set: Set,
): Separator<JoinedName<Set[number]>>
export function joinSeparators(set: readonly JoinMember[]): Separator<string> {
  if (set.length === 0) {
    throw new SeparationError('a set of separators is empty: one separator or more is joined')
  }
  const sampleRate = set[0].separator.sampleRate
  const members: Checked[] = []
  const stems: string[] = []
  for (const { separator, take } of set) {
    if (separator.sampleRate !== sampleRate) {
      throw new SeparationError(
        `the separators of a set work at one sample rate, not at ${sampleRate} and at ${separator.sampleRate}`,
      )
    }
    const names = saidNames(separator.stems, "a separator's stems")
    const kept = take === undefined ? names : checkedNames(take, 'the stems kept of a separator')
    for (const name of kept) {
      if (!names.includes(name)) {
        throw new SeparationError(
          `a set keeps ${name} of a separator that does not answer it: its stems are [${names.join(', ')}]`,
        )
      }
      if (stems.includes(name)) {
        throw new SeparationError(
          `a set of separators keeps ${name} twice: a stem is kept of one separator`,
        )
      }
      stems.push(name)
    }
    members.push({ separator, names, kept })
  }
  /** What each separator says a track of `frames` frames takes, and nothing for one that does not say. */
  const said = (frames: number): (number | undefined)[] =>
    members.map(({ separator }) => separator.steps?.(frames))
  const summed = (counts: readonly (number | undefined)[]): number =>
    counts.reduce<number>((sum, count) => sum + (count ?? 1), 0)

  return {
    sampleRate,
    stems,
    steps: (frames) => summed(said(frames)),
    async separate(channels: Channels, run: SeparateOptions = {}) {
      // Every separator says its steps before the first is asked, so the
      // total is the same from the first report to the last.
      const counts = said(channels.length > 0 ? channels[0].length : 0)
      const total = summed(counts)
      const answer: Record<string, Channels> = {}
      let before = 0
      run.signal?.throwIfAborted()
      for (const [index, member] of members.entries()) {
        const count = counts[index]
        const from = before
        const kept = await keptOf(member, channels, {
          signal: run.signal,
          onProgress:
            count === undefined
              ? undefined
              : ({ done }) => run.onProgress?.({ done: from + done, total }),
        })
        run.signal?.throwIfAborted()
        // In the order they are kept, which need not be the separator's.
        for (const name of member.kept) answer[name] = kept[name]
        before += count ?? 1
        if (count === undefined) run.onProgress?.({ done: before, total })
      }
      return answer
    },
  }
}
