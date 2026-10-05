// A pack's palette: what the builder draws that pack's hundred chains from.
// The recipes (../recipes.ts) and the lexicon (../lexicon) are the same for
// every pack; the palette is where a pack becomes itself: which effects it
// reaches for, which it never touches, the chains only it has, and the words
// its chains are named with.

import { type FactoryChainCategory } from '../../../types'
import { type Trait } from '../lexicon/types'
import { type Slot } from '../recipes'

/** A slot of a pack's own recipe: a job as in a shared recipe, or these effects, or these very presets. */
export interface OwnSlot extends Omit<Slot, 'role'> {
  role?: Slot['role']
  /** Only these presets, each as `"<device id>:<preset name>"`. */
  presets?: readonly string[]
}

/** A chain only this pack draws: its signature. */
export interface OwnRecipe {
  id: string
  category: FactoryChainCategory
  /** Two to four slots. */
  slots: readonly OwnSlot[]
  /** Which slot the chain is named for, counted from 0. */
  lead: number
  /** How many of the pack's chains are drawn from it. */
  count: number
}

/**
 * A word a chain's name begins or ends with. With `for`, only on a chain
 * that has one of those traits: a word that says something of the sound
 * ("Slowed", "run backwards") is kept to the chains it is true of.
 */
export type Head = string | { word: string; for: readonly Trait[] }

export interface PackPalette {
  /** `FactoryPack.id`. */
  pack: string
  /** How many chains go under each group; a hundred in all, at least five in each. */
  groups: Readonly<Record<FactoryChainCategory, number>>
  /**
   * How much the pack leans to a trait (above 1) or away from it (under 1; 0
   * never draws a preset that has it). Left out is 1.
   */
  traits?: Readonly<Partial<Record<Trait, number>>>
  /** The same for a whole effect, by device id. */
  devices?: Readonly<Record<string, number>>
  /** The same for one preset, as `"<device id>:<preset name>"`. */
  voices?: Readonly<Record<string, number>>
  /** The same for a shared recipe, by its id. */
  recipes?: Readonly<Record<string, number>>
  /** The chains only this pack has, drawn before the shared recipes fill the rest of each group. */
  own?: readonly OwnRecipe[]
  /**
   * Words a name begins with: "<Head> <noun>", the noun being what the
   * chain's leading effect is ("Harbour plate", "Low-tide loop"). Written as
   * it is printed, capital first. Forty or more, none of them a noun an
   * effect has.
   */
  heads: readonly Head[]
  /**
   * Words a name ends with: "<Noun> <tail>" ("Plate at dusk", "Loop under
   * snow"). Lower case. Fifteen or more.
   */
  tails: readonly Head[]
  /**
   * Nouns of the lexicon this pack's names never use, lower case: a word
   * that in this pack would name a work of the musician it takes after.
   */
  avoid?: readonly string[]
}

export const PALETTE_LIMITS = {
  chains: 100,
  leastInGroup: 5,
  heads: 40,
  tails: 15,
  /** A head and a tail at most this long: a name is at most 20 characters with its noun, and a noun is three to nine. */
  head: 14,
  tail: 13,
} as const
