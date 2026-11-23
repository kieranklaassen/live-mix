// The names of stems. A separator, a model and a spec each say which stems
// they answer with, and a separation carries the same list, so the parts keep
// one order from the model to the desk. A name ends up as a key of a record,
// as an id on a score and in a host's file names, so one check holds every
// list that enters to one shape, before anything is run on it.

import { STEM_NAMES, SeparationError, type Channels, type Separation, type StemName } from './types'

/** A lower-case letter, then lower-case letters, digits or hyphens. */
const NAME = /^[a-z][a-z0-9-]*$/

/** What a part that is no stem is called: the track minus every stem. */
export const REMAINDER = 'remainder'

/**
 * A copy of `names`, once it is seen to be a list of stems: at least one
 * name, each of the one shape, none of them twice and none of them
 * `remainder`. Throws a `SeparationError` otherwise, with the name that is
 * refused. `whose` says in the refusal whose list it was, as in
 * "a separator's stems".
 */
export function checkedNames<Name extends string>(
  names: readonly Name[],
  whose: string,
): readonly Name[] {
  if (names.length === 0) {
    throw new SeparationError(`${whose} are empty: a list names one stem or more`)
  }
  const checked: Name[] = []
  for (const name of names) {
    if (typeof name !== 'string' || !NAME.test(name)) {
      throw new SeparationError(
        `${whose} hold ${JSON.stringify(name)}, which is no name for a stem: ` +
          `a name is a lower-case letter, then lower-case letters, digits or hyphens`,
      )
    }
    if (name === REMAINDER) {
      throw new SeparationError(
        `${whose} name ${REMAINDER}, which is what the stems leave of a track and no stem`,
      )
    }
    if (checked.includes(name)) throw new SeparationError(`${whose} name ${name} twice`)
    checked.push(name)
  }
  return checked
}

/** The list `said`, checked as `checkedNames` checks one, or the four when nothing was said. */
export function saidNames<Name extends string>(
  said: readonly Name[] | undefined,
  whose: string,
): readonly Name[] {
  return checkedNames((said ?? STEM_NAMES) as readonly Name[], whose)
}

/**
 * `names`, or the four as a desk lists them, vocals first, when `names` are
 * exactly the four in whatever order.
 */
export function inDeskOrder<Name extends string>(names: readonly Name[]): readonly Name[] {
  const said: readonly string[] = names
  const theFour =
    said.length === STEM_NAMES.length && STEM_NAMES.every((name) => said.includes(name))
  return theFour ? ([...STEM_NAMES] as readonly string[] as readonly Name[]) : names
}

/** The first of `keys`, the own keys of a record of stems, that `names` does not say, or nothing. */
export function unnamedKey(keys: Iterable<string>, names: readonly string[]): string | undefined {
  for (const key of keys) {
    if (!names.includes(key)) return key
  }
  return undefined
}

/**
 * The stems of `separation` in order. A separation that says no names is one
 * of the four. Throws a `SeparationError` when its names are no list of
 * stems, when its record holds a stem its names do not say, or when its names
 * say a stem its record does not hold, with that stem's name: a separation
 * written by hand with other stems and no names is refused, never read as
 * the four.
 */
export function stemNames<Name extends string = StemName>(
  separation: Pick<Separation<Name>, 'names' | 'stems'>,
): readonly Name[] {
  const names = saidNames(separation.names, "a separation's names")
  const unnamed = unnamedKey(Object.keys(separation.stems), names)
  if (unnamed !== undefined) {
    throw new SeparationError(
      `a separation holds the stem ${unnamed}, which its names do not say: [${names.join(', ')}]`,
    )
  }
  const stems: Partial<Record<string, Channels>> = separation.stems
  const missing = names.find((name) => !Object.hasOwn(stems, name))
  if (missing !== undefined) {
    throw new SeparationError(`a separation names the stem ${missing} and holds no such stem`)
  }
  return names
}

/** The parts of `separation` in order: its stems as `stemNames` gives them, then `remainder`. */
export function partNames<Name extends string = StemName>(
  separation: Pick<Separation<Name>, 'names' | 'stems'>,
): readonly (Name | 'remainder')[] {
  return [...stemNames(separation), REMAINDER]
}
