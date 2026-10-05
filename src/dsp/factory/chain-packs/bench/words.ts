// A chain's name and its one sentence, built from what the lexicon says of
// the presets it holds and the words its pack is named with. The sentence is
// true as far as the lexicon is: it says each effect in the order it stands.

import { type FactoryChainCategory } from '../../types'
import { type Candidate } from './draw'
import { type Role, type Trait } from './lexicon/types'
import { type Head, type PackPalette } from './palettes/types'
import { weighted, type Random } from './random'

export const WORD_LIMITS = {
  /** A chain's name at most: what the bank keeps its own chains to. */
  name: 20,
  /** A chain's sentence at most. */
  sentence: 140,
  /** How often one head, or one tail, may open or close a name in a pack. */
  headUses: 3,
  tailUses: 4,
  /** The share of a pack's names that end in a tail rather than begin with a head. */
  tailShare: 0.3,
} as const

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// A palette's tails are written lower case; a month, a day and the side of a tape keep their capital in print.
const PROPER =
  /\b(january|february|march|april|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g
const printed = (tail: string) =>
  tail
    .replace(PROPER, capital)
    .replace(/\bside ([a-z])\b/, (_all, side: string) => `side ${side.toUpperCase()}`)

export const slug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** What a pack's names have used so far. */
export interface NameState {
  heads: Map<string, number>
  tails: Map<string, number>
  /** Lower-cased names no chain may take: every chain's so far, in every pack and the bank. */
  taken: Set<string>
  /** Ids no chain may take. */
  ids: Set<string>
}

export const freshNames = (
  taken: Iterable<string> = [],
  ids: Iterable<string> = [],
): NameState => ({
  heads: new Map(),
  tails: new Map(),
  taken: new Set([...taken].map((name) => name.toLowerCase())),
  ids: new Set(ids),
})

/**
 * Nouns of the lexicon that say too little after a pack's word to name a
 * chain by ("Attic pair", "Harbour set"): passed over wherever the leading
 * preset has another.
 */
const PLAIN_NOUNS: ReadonlySet<string> = new Set([
  'answer',
  'autumn',
  'band',
  'bed',
  'blend',
  'catch',
  'centre',
  'chunks',
  'clipper',
  'copy',
  'distance',
  'flaws',
  'flip',
  'floor',
  'glacier',
  'glances',
  'glimpses',
  'grip',
  'heads',
  'hint',
  'lapses',
  'layer',
  'line',
  'link',
  'middle',
  'mine',
  'night',
  'numbers',
  'pair',
  'past',
  'peak',
  'peaks',
  'repeat',
  'return',
  'returns',
  'run',
  'section',
  'send',
  'set',
  'single',
  'span',
  'split',
  'steps',
  'stops',
  'summer',
  'switch',
  'takes',
  'trips',
  'turns',
  'twin',
  'wall',
])

/**
 * What a master chain is named for: the finish it gives a mix, whatever
 * stands first in it. A compressor's or an equaliser's own noun after a
 * pack's word ("Pollen glue") names nothing a reader can use.
 */
export const MASTER_NOUNS: readonly string[] = ['finish', 'master', 'mixdown', 'polish', 'lacquer']

/** Nouns that only follow a pack's word: with a capital at the head of a name they read as something else ("Polish in the park"). */
const NEVER_FIRST: ReadonlySet<string> = new Set(['polish'])

/** The nouns a chain of this group, led by `lead`, can be named for. */
export const nameNouns = (category: FactoryChainCategory, lead: Candidate): readonly string[] =>
  category === 'master' ? MASTER_NOUNS : lead.voice.nouns

const headWord = (head: Head) => (typeof head === 'string' ? head : head.word)

/** Whether a pack's word says the noun over again: the noun is in it, or one of its words begins as the noun does. */
function echoes(word: string, noun: string): boolean {
  const lower = word.toLowerCase()
  if (lower.includes(noun)) return true
  const stem = noun.slice(0, 4)
  return stem.length === 4 && lower.split(/[ -]/).some((part) => part.startsWith(stem))
}

interface Naming {
  name: string
  head?: string
  tail?: string
  weight: number
}

/** Every name the pack's words and these nouns give, whoever has taken it: `used` weighs a word by how often it has served. */
function namings(
  palette: PackPalette,
  nouns: readonly string[],
  traits: ReadonlySet<Trait>,
  used: { head: (word: string) => number; tail: (word: string) => number },
): Naming[] {
  const options: Naming[] = []
  const allowed = nouns.filter((noun) => !palette.avoid?.includes(noun))
  const telling = allowed.filter((noun) => !PLAIN_NOUNS.has(noun))
  ;(telling.length > 0 ? telling : allowed).forEach((noun, index) => {
    const nounWeight = 0.6 ** index
    for (const head of palette.heads) {
      const word = headWord(head)
      const uses = used.head(word)
      if (uses >= WORD_LIMITS.headUses) continue
      // "Loop loop", "Looping loop", "Stairwell stairs".
      if (echoes(word, noun)) continue
      let fit = 1
      if (typeof head !== 'string') {
        if (!head.for.some((trait) => traits.has(trait))) continue
        fit = 3
      }
      options.push({
        name: `${word} ${noun}`,
        head: word,
        weight: (nounWeight * fit) / (1 + uses) ** 2,
      })
    }
    for (const entry of NEVER_FIRST.has(noun) ? [] : palette.tails) {
      const tail = headWord(entry)
      const uses = used.tail(tail)
      if (uses >= WORD_LIMITS.tailUses || echoes(tail, noun)) continue
      let fit = 1
      if (typeof entry !== 'string') {
        if (!entry.for.some((trait) => traits.has(trait))) continue
        fit = 3
      }
      options.push({
        name: `${capital(noun)} ${printed(tail)}`,
        tail,
        weight: (nounWeight * fit) / (1 + uses) ** 2,
      })
    }
  })
  return options.filter((option) => option.name.length <= WORD_LIMITS.name)
}

/**
 * A name for a chain: one of the pack's heads before one of `nouns`
 * ("Harbour plate"), or a noun before one of the pack's tails ("Plate at
 * dusk"). The nouns are the leading preset's own, or a master chain's
 * (`nameNouns`). `traits` are what a word with `for` is held to: the leading
 * preset's own, since the name is its noun. Undefined when every name it
 * could have is taken.
 */
export function chainName(
  random: Random,
  palette: PackPalette,
  nouns: readonly string[],
  traits: ReadonlySet<Trait>,
  state: NameState,
): string | undefined {
  const options = namings(palette, nouns, traits, {
    head: (word) => state.heads.get(word) ?? 0,
    tail: (word) => state.tails.get(word) ?? 0,
  }).filter(
    (option) =>
      !state.taken.has(option.name.toLowerCase()) &&
      !state.ids.has(`${palette.pack}-${slug(option.name)}`),
  )
  // Heads and tails are weighed as two lists, so that a pack with many heads still ends some names in a tail.
  const total = (list: readonly Naming[]) => list.reduce((sum, option) => sum + option.weight, 0)
  const headed = options.filter((option) => option.head !== undefined)
  const tailed = options.filter((option) => option.tail !== undefined)
  const share = tailed.length === 0 ? 0 : headed.length === 0 ? 1 : WORD_LIMITS.tailShare
  const list = random() < share ? tailed : headed
  const choice = weighted(random, list, (option) => option.weight / total(list))
  if (!choice) return undefined
  if (choice.head) state.heads.set(choice.head, (state.heads.get(choice.head) ?? 0) + 1)
  if (choice.tail) state.tails.set(choice.tail, (state.tails.get(choice.tail) ?? 0) + 1)
  state.taken.add(choice.name.toLowerCase())
  state.ids.add(`${palette.pack}-${slug(choice.name)}`)
  return choice.name
}

/**
 * Whether a name is still one the pack's words and these nouns give: a chain
 * named with a word its palette has since dropped, or for a noun its preset
 * no longer has, does not keep the name.
 */
export function nameStands(
  palette: PackPalette,
  nouns: readonly string[],
  traits: ReadonlySet<Trait>,
  name: string,
): boolean {
  return namings(palette, nouns, traits, { head: () => 0, tail: () => 0 }).some(
    (option) => option.name === name,
  )
}

/** A space is what a chain runs into; anything else follows what is before it. */
const SPACES: readonly Role[] = ['room', 'hall', 'halo']

/**
 * The chain in one sentence: each effect as the lexicon says it, in order.
 * "A wearing tape loop, then far-off static, into a long dark plate." Where
 * the whole of it is too long, the longest clauses give way to their short
 * forms.
 */
export function chainSentence(picks: readonly Candidate[], roles: readonly (Role | undefined)[]) {
  const short = picks.map(() => false)
  const build = () => {
    let text = ''
    picks.forEach((pick, index) => {
      const clause = short[index] ? pick.voice.brief : pick.voice.says
      if (index === 0) {
        text = capital(clause)
        return
      }
      const role = roles[index] ?? pick.voice.roles[0]
      const last = index === picks.length - 1
      // Only what is a space before anything else is run into: an amplifier in a room is still an amplifier.
      const space = SPACES.includes(role) && SPACES.includes(pick.voice.roles[0])
      text += (last && space ? ', into ' : ', then ') + clause
    })
    return `${text}.`
  }
  let sentence = build()
  while (sentence.length > WORD_LIMITS.sentence && short.includes(false)) {
    let longest = -1
    picks.forEach((pick, index) => {
      if (short[index]) return
      const gain = pick.voice.says.length - pick.voice.brief.length
      if (
        longest < 0 ||
        gain > picks[longest].voice.says.length - picks[longest].voice.brief.length
      ) {
        longest = index
      }
    })
    short[longest] = true
    sentence = build()
  }
  return sentence
}
