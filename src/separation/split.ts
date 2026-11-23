// A part of a separation split further by a second separator: the drums into
// a kick, a snare, toms and cymbals, the vocals into a lead and a backing.
// The separator is run over the part as `separateTrack` runs one over a
// track, and the part is replaced, in its place, by the stems that come back
// and by what they leave of the part. So the ones that stand in the part's
// place add up to the part, as the stems and the remainder add up to the
// track, and the separation's one remainder is not touched.
//
// What a split answers is a new separation. The one it was handed is not
// written to, and the parts that were not split are the same arrays in both.

import { checkedNames, partNames, saidNames } from './names'
import { leftOf, separatorStems } from './separate'
import {
  SeparationError,
  type Channels,
  type SeparateOptions,
  type Separation,
  type Separator,
  type SplitReport,
} from './types'

/** What the stems leave of a track, which no separator gave and no split takes apart. */
const REMAINDER = 'remainder'

export interface SplitOptions<Rest extends string = string> extends SeparateOptions {
  /**
   * The name of what the second separator's stems leave of the part. Left
   * out, it keeps the part's own name. A name is a lower-case letter, then
   * lower-case letters, digits or hyphens, and none that another part has.
   */
  rest?: Rest
}

/**
 * `separation` with its part `name` split by `separator`: a new separation
 * in which the part is replaced, in its place, by the separator's stems in
 * their order and then by what they leave of the part. What is left keeps
 * the part's name, or takes `options.rest`. The separator is run over the
 * part as `separateTrack` runs one over a track, so its stems come back at
 * the part's rate, length and channel count, and with what is left they add
 * up to the part.
 *
 * The separation handed in is not written to. The parts that were not split
 * and the remainder are the same arrays in the answer, not copies. The
 * answer's report says the split in `splits`, after the ones made before it,
 * and can be split again.
 *
 * Rejects with a `SeparationError`, before the separator is asked, when the
 * separation's stems are not its names, when it has no such part, when the
 * part is `remainder`, when the separation has no report (a split is of a
 * separation the engine made), when the separator's stems or `options.rest`
 * are no names, when what is left would be named as one of the separator's
 * stems, or when a name the part is split into is another part's already.
 * Rejects as `separateTrack` does once the separator is asked, with a stem
 * held to 12 dB over the part's largest sample, and with the signal's reason
 * when `options.signal` fires.
 */
export async function splitPart<
  Name extends string,
  Part extends Name,
  Sub extends string,
  Rest extends string = Part,
>(
  separation: Separation<Name>,
  name: Part,
  separator: Separator<Sub>,
  options: SplitOptions<Rest> = {},
): Promise<Separation<Exclude<Name, Part> | Sub | Rest>> {
  // The names first: a record that does not match its names is refused by
  // that name before anything else is looked at.
  const parts: readonly string[] = partNames(separation)
  const part: string = name
  if (part === REMAINDER) {
    throw new SeparationError(
      `the ${REMAINDER} is what no separator gave of a track, and is not split`,
    )
  }
  if (!parts.includes(part)) {
    throw new SeparationError(
      `a separation has no part named ${part} to split: its parts are [${parts.join(', ')}]`,
    )
  }
  if (separation.report === undefined) {
    throw new SeparationError(
      `a separation with no report is not split: a split is of one that separateTrack or a split made`,
    )
  }
  const subs: readonly string[] = saidNames(separator.stems, "a separator's stems")
  const rest: string =
    options.rest === undefined ? part : checkedNames([options.rest], "a split's options")[0]
  if (subs.includes(rest)) {
    throw new SeparationError(
      `what the separator leaves of ${part} would be named ${rest}, as one of its stems is: ` +
        `options.rest gives it another name`,
    )
  }
  const inPlace = [...subs, rest]
  const taken = inPlace.find((one) => one !== part && parts.includes(one))
  if (taken !== undefined) {
    throw new SeparationError(
      `${part} is not split into ${taken}: the separation has a part of that name already`,
    )
  }

  const before: Record<string, Channels> = separation.stems
  const whole = before[part]
  const run = await separatorStems(
    { channels: whole, sampleRate: separation.sampleRate },
    separator,
    { signal: options.signal, onProgress: options.onProgress },
    `${part} part`,
  )
  const made: Record<string, Channels> = run.stems
  const left = leftOf(
    whole,
    subs.map((sub) => made[sub]),
  )

  const names: string[] = []
  const stems: Record<string, Channels> = {}
  for (const stem of parts) {
    if (stem === REMAINDER) continue
    if (stem !== part) {
      names.push(stem)
      stems[stem] = before[stem]
      continue
    }
    for (const sub of subs) {
      names.push(sub)
      stems[sub] = made[sub]
    }
    names.push(rest)
    stems[rest] = left.channels
  }
  const split: SplitReport = {
    part,
    names: inPlace,
    restDb: left.db,
    restPeak: left.peak,
    modelSampleRate: run.modelSampleRate,
    resampled: run.resampled,
  }
  const answer: Separation<string> = {
    sampleRate: separation.sampleRate,
    names,
    stems,
    remainder: separation.remainder,
    report: { ...separation.report, splits: [...(separation.report.splits ?? []), split] },
  }
  return answer as Separation<Exclude<Name, Part> | Sub | Rest>
}
