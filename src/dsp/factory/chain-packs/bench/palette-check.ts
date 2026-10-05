// Holds a pack's palette to its form before anything is drawn from it.

import { FACTORY_PACKS } from '../../packs'
import { type FactoryChainCategory } from '../../types'
import { LEXICON } from './lexicon'
import { ROLES, TRAITS } from './lexicon/types'
import { PALETTE_LIMITS, type Head, type PackPalette } from './palettes/types'
import { RECIPES } from './recipes'

/** The groups a chain is listed under, in the order a browser shows them. */
export const GROUPS: readonly FactoryChainCategory[] = [
  'space',
  'echo',
  'tape',
  'motion',
  'texture',
  'pitch',
  'master',
]

const usable = (id: string): boolean => {
  const at = id.indexOf(':')
  const voice = LEXICON.get(id.slice(0, at))?.voices[id.slice(at + 1)]
  return voice !== undefined && voice.roles.length > 0
}

/** What is wrong with a palette; empty when it is in order. */
export function paletteProblems(palette: PackPalette): string[] {
  const problems: string[] = []
  const say = (problem: string) => problems.push(`${palette.pack}: ${problem}`)
  if (!FACTORY_PACKS.some((pack) => pack.id === palette.pack)) say('not a pack of the library')

  const total = GROUPS.reduce((sum, group) => sum + (palette.groups[group] ?? 0), 0)
  if (total !== PALETTE_LIMITS.chains)
    say(`groups hold ${total} chains, not ${PALETTE_LIMITS.chains}`)
  for (const group of GROUPS) {
    if (!(palette.groups[group] >= PALETTE_LIMITS.leastInGroup)) {
      say(`group ${group} holds under ${PALETTE_LIMITS.leastInGroup}`)
    }
  }

  for (const [trait, weight] of Object.entries(palette.traits ?? {})) {
    if (!(TRAITS as readonly string[]).includes(trait)) say(`trait "${trait}" is not one`)
    if (!(weight >= 0)) say(`trait "${trait}" has a weight under 0`)
  }
  for (const device of Object.keys(palette.devices ?? {})) {
    if (!LEXICON.has(device)) say(`device "${device}" is not an effect of the lexicon`)
  }
  for (const id of Object.keys(palette.voices ?? {})) {
    if (!usable(id)) say(`voice "${id}" is not a preset a chain can use`)
  }
  const shared = new Set(RECIPES.map((recipe) => recipe.id))
  for (const id of Object.keys(palette.recipes ?? {})) {
    if (!shared.has(id)) say(`recipe "${id}" is not a shared recipe`)
  }

  const own = new Set<string>()
  const ownInGroup = new Map<FactoryChainCategory, number>()
  for (const recipe of palette.own ?? []) {
    const at = (problem: string) => say(`own recipe "${recipe.id}": ${problem}`)
    if (own.has(recipe.id) || shared.has(recipe.id)) at('its id is taken')
    own.add(recipe.id)
    if (!GROUPS.includes(recipe.category)) at(`group "${recipe.category}" is not one`)
    if (recipe.slots.length < 2 || recipe.slots.length > 4) at('two to four slots')
    if (!(recipe.lead >= 0 && recipe.lead < recipe.slots.length)) at('lead is not one of its slots')
    if (!(recipe.count >= 1)) at('count under 1')
    ownInGroup.set(recipe.category, (ownInGroup.get(recipe.category) ?? 0) + recipe.count)
    recipe.slots.forEach((slot, index) => {
      if (slot.role === undefined && !slot.devices && !slot.presets) {
        at(`slot ${index} names no job, no devices and no presets`)
      }
      if (slot.role !== undefined && !ROLES.includes(slot.role))
        at(`role "${slot.role}" is not one`)
      for (const device of slot.devices ?? []) {
        if (!LEXICON.has(device)) at(`device "${device}" is not an effect of the lexicon`)
      }
      for (const id of slot.presets ?? []) {
        if (!usable(id)) at(`preset "${id}" is not one a chain can use`)
      }
      for (const trait of [...(slot.want ?? []), ...(slot.any ?? []), ...(slot.not ?? [])]) {
        if (!TRAITS.includes(trait)) at(`trait "${trait}" is not one`)
      }
    })
  }
  for (const [group, count] of ownInGroup) {
    if (count > palette.groups[group])
      say(`own recipes ask for ${count} in ${group}, the group holds ${palette.groups[group]}`)
  }

  const nouns = new Set<string>()
  for (const lexicon of LEXICON.values()) {
    for (const voice of Object.values(lexicon.voices))
      for (const noun of voice.nouns) nouns.add(noun)
  }
  const word = (entry: Head) => (typeof entry === 'string' ? entry : entry.word)
  if (palette.heads.length < PALETTE_LIMITS.heads) {
    say(`${palette.heads.length} heads, at least ${PALETTE_LIMITS.heads}`)
  }
  if (palette.tails.length < PALETTE_LIMITS.tails) {
    say(`${palette.tails.length} tails, at least ${PALETTE_LIMITS.tails}`)
  }
  const seen = new Set<string>()
  const each = (kind: 'head' | 'tail', entry: Head, form: RegExp, formSays: string) => {
    const text = word(entry)
    const at = (problem: string) => say(`${kind} "${text}": ${problem}`)
    if (seen.has(text.toLowerCase())) at('twice')
    seen.add(text.toLowerCase())
    if (!form.test(text)) at(formSays)
    if (text.length > PALETTE_LIMITS[kind]) at(`over ${PALETTE_LIMITS[kind]} characters`)
    if (nouns.has(text.toLowerCase())) at('is a noun an effect has')
    if (typeof entry !== 'string') {
      if (entry.for.length === 0) at('is for no trait')
      for (const trait of entry.for) if (!TRAITS.includes(trait)) at(`trait "${trait}" is not one`)
    }
  }
  for (const head of palette.heads) {
    each('head', head, /^[A-Z][a-z]*([ -][a-z]+)*$/, 'one capital, then lower-case words')
  }
  for (const tail of palette.tails) each('tail', tail, /^[a-z]+([ -][a-z]+)*$/, 'lower-case words')
  return problems
}
