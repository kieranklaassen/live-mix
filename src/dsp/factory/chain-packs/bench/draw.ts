// Draws one chain for a pack: a recipe, a preset for each of its slots, and
// a seed's nudge to the times and rates. Nothing here renders; what is drawn
// is measured, levelled and kept or refused in ./build.test.ts.

import { type PatchDevice } from '../../../../core/devices/patch'
import { patchDeviceParams } from '../../../../core/devices/patch'
import { type FactoryChainCategory } from '../../types'
import { benchEffect } from './effects'
import { LEXICON } from './lexicon'
import { type Role, type Trait, type Voice } from './lexicon/types'
import { type OwnRecipe, type OwnSlot, type PackPalette } from './palettes/types'
import { weighted, type Random } from './random'
import { RECIPES } from './recipes'

/** One preset of one effect, as the draw sees it. */
export interface Candidate {
  device: string
  preset: string
  voice: Voice
}

/** A chain as it is drawn, before it is measured. */
export interface Drawn {
  recipe: string
  category: FactoryChainCategory
  /** Which of `picks` the chain is named for. */
  lead: number
  picks: readonly Candidate[]
  effects: readonly PatchDevice[]
}

export const key = (device: string, preset: string) => `${device}:${preset}`

/** What tells one chain from another before either is heard: its effects and their presets, in order. */
export const signature = (effects: readonly PatchDevice[]) =>
  effects.map((effect) => key(effect.deviceId, effect.preset ?? '')).join(' > ')

const sequence = (picks: readonly Candidate[]) => picks.map((pick) => pick.device).join(' > ')

export const DRAW_LIMITS = {
  /** Chains of one pack on the same effects in the same order, at most. */
  sameEffects: 4,
  /** How far a seed moves a time or a rate, either way. */
  jitter: 0.125,
  /** The chance that an effect of a chain is moved at all. */
  jitterChance: 0.6,
  /** What the effects of a chain may cost together by the bench's table, percent of real time. */
  costPct: 12,
  /**
   * A preset the pack leans from by more than this (a weight under a
   * quarter) fills a slot only when nothing the pack leans to can; a recipe
   * likewise. What a pack turns well down a reader takes for foreign to it.
   */
  leastLean: 0.25,
} as const

/** Every preset a chain can use: all the lexicon has a job for, less what the bench's table refuses. */
export function candidates(refused: ReadonlySet<string>): Candidate[] {
  const all: Candidate[] = []
  for (const [device, lexicon] of LEXICON) {
    for (const [preset, voice] of Object.entries(lexicon.voices)) {
      if (voice.roles.length === 0 || refused.has(key(device, preset))) continue
      all.push({ device, preset, voice })
    }
  }
  return all
}

/** What a pack has drawn so far: the draw spreads itself over what it has used least. */
export interface DrawState {
  voices: Map<string, number>
  devices: Map<string, number>
  recipes: Map<string, number>
  sequences: Map<string, number>
  /** Signatures no chain may repeat: this pack's, every other pack's, the bank's, and what was refused. */
  taken: Set<string>
}

export const freshState = (taken: Iterable<string> = []): DrawState => ({
  voices: new Map(),
  devices: new Map(),
  recipes: new Map(),
  sequences: new Map(),
  taken: new Set(taken),
})

const count = (map: Map<string, number>, id: string) => map.get(id) ?? 0
const bump = (map: Map<string, number>, id: string) => map.set(id, count(map, id) + 1)

/** Record a chain as drawn, kept or not: it is not drawn again. */
export function noteDrawn(state: DrawState, drawn: Drawn, kept: boolean): void {
  state.taken.add(signature(drawn.effects))
  if (!kept) return
  for (const pick of drawn.picks) {
    bump(state.voices, key(pick.device, pick.preset))
    bump(state.devices, pick.device)
  }
  bump(state.recipes, drawn.recipe)
  bump(state.sequences, sequence(drawn.picks))
}

/** Whether a preset can take a slot: its job, its effect, its traits. */
export function fits(slot: OwnSlot, candidate: Candidate): boolean {
  const { voice } = candidate
  // A preset the lexicon skips is no voice, whatever a slot without a role would take.
  if (voice.roles.length === 0) return false
  if (slot.role !== undefined && !voice.roles.includes(slot.role)) return false
  if (slot.devices && !slot.devices.includes(candidate.device)) return false
  if (slot.presets && !slot.presets.includes(key(candidate.device, candidate.preset))) return false
  const has = (trait: Trait) => voice.traits.includes(trait)
  if (slot.want && !slot.want.every(has)) return false
  if (slot.any && !slot.any.some(has)) return false
  if (slot.not?.some(has)) return false
  return true
}

/** What a chain has room for once: a second one does the first one's job over again. */
const ONCE: readonly Trait[] = ['unsteady', 'backwards', 'long', 'frozen', 'far']
/** The jobs that leave no dry sound beside them: what they take away is gone for everything before them. */
const THROUGH: readonly Role[] = ['tone', 'wear', 'drive']
/** The jobs that are a space: a hint of one before another is covered by it. */
const SPACE: readonly Role[] = ['room', 'hall', 'halo']

/** A preset in a chain with the job it does there: its slot's, or its own first when the slot names none. */
export interface Placed {
  pick: Candidate
  role: Role | undefined
}

/**
 * Why a preset cannot follow the ones before it in a chain drawn from a
 * shared recipe; undefined when it can. `role` is the job it would do there,
 * `leadAt` the place of the preset the chain is named for. A master chain is
 * made of hints and is held to none of this beyond its slots.
 */
export function clash(
  before: readonly Placed[],
  candidate: Candidate,
  role: Role | undefined,
  leadAt: number,
  category: FactoryChainCategory,
): string | undefined {
  if (category === 'master') return undefined
  const lead = before.length === leadAt
  const job = role ?? candidate.voice.roles[0]
  const jobOf = (placed: Placed) => placed.role ?? placed.pick.voice.roles[0]
  const is = (placed: Placed, trait: Trait) => placed.pick.voice.traits.includes(trait)
  const has = (trait: Trait) => candidate.voice.traits.includes(trait)
  const had = (trait: Trait) => before.some((placed) => is(placed, trait))
  const through = THROUGH.includes(job)
  for (const trait of ONCE) if (has(trait) && had(trait)) return `two presets that are ${trait}`
  if (has('faint')) {
    if (lead) return 'named for a preset that is only a hint'
    if (had('faint')) return 'two presets that are each only a hint'
    if (had('heavy')) return 'a hint under a preset that takes the dry sound away'
    if (before.some((placed) => jobOf(placed) === job))
      return 'a hint of what an earlier preset already does in full'
  }
  if (has('heavy') && had('faint')) return 'a hint under a preset that takes the dry sound away'
  if (has('heavy') && has('long') && leadAt < before.length)
    return 'named for a preset that a long tail with no dry sound then covers'
  if (has('long') && had('faint')) return 'a hint under a tail that covers it'
  if (before.some((placed) => is(placed, 'faint') && jobOf(placed) === job))
    return 'a hint of what a later preset does in full'
  if (
    SPACE.includes(job) &&
    before.some((placed) => is(placed, 'faint') && SPACE.includes(jobOf(placed)))
  )
    return 'a hint of a space before a space that covers it'
  if (has('narrow') && had('wide')) return 'a width that is folded to the middle again'
  if (job === 'hiss' && had('noisy')) return 'a hiss under a preset that already hisses'
  if (has('noisy') && before.some((placed) => jobOf(placed) === 'hiss'))
    return 'a hiss under a preset that already hisses'
  if (through && has('dark')) {
    if (had('bright') || had('high')) return 'a brightness that is taken away again'
    if (before.some((placed) => is(placed, 'dark') && THROUGH.includes(jobOf(placed))))
      return 'the top taken off twice'
  }
  if (through && has('bright') && had('dark')) return 'a dullness that is lifted again'
  return undefined
}

/** `clash` for a whole chain as it stands, slot by slot. */
export function chainClash(
  recipe: Pick<DrawRecipe, 'slots' | 'lead' | 'category'>,
  picks: readonly Candidate[],
): string | undefined {
  const placed = picks.map((pick, index): Placed => ({ pick, role: recipe.slots[index]?.role }))
  for (let at = 0; at < picks.length; at += 1) {
    const why = clash(
      placed.slice(0, at),
      picks[at],
      recipe.slots[at]?.role,
      recipe.lead,
      recipe.category,
    )
    if (why) return why
  }
  return undefined
}

function lean(palette: PackPalette, candidate: Candidate): number {
  let weight = palette.devices?.[candidate.device] ?? 1
  weight *= palette.voices?.[key(candidate.device, candidate.preset)] ?? 1
  for (const trait of candidate.voice.traits) weight *= palette.traits?.[trait] ?? 1
  return weight
}

/**
 * How much less likely something becomes each time it is used, by how much
 * the pack leans to it: what a pack leans to comes round again, and what it
 * leans away from does not creep back in once the favourites have been used.
 */
export function spread(used: number, leaning: number): number {
  return 1 / (1 + used / Math.min(4, Math.max(0.25, leaning))) ** 2
}

export interface DrawRecipe {
  id: string
  category: FactoryChainCategory
  slots: readonly OwnSlot[]
  lead: number
  weight: number
  /** A pack's own recipe: its writer chose what stands beside what, and it is held to its slots alone. */
  own?: boolean
}

/** The shared recipes of one group as this pack weighs them. */
export function sharedRecipes(palette: PackPalette, category: FactoryChainCategory): DrawRecipe[] {
  const all = RECIPES.filter((recipe) => recipe.category === category).map((recipe) => ({
    ...recipe,
    weight: (recipe.weight ?? 1) * (palette.recipes?.[recipe.id] ?? 1),
  }))
  // As with a preset: a recipe the pack leans from is drawn only when it has no other in the group.
  const leant = all.filter((recipe) => recipe.weight >= DRAW_LIMITS.leastLean)
  return leant.length > 0 ? leant : all
}

export const ownRecipe = (recipe: OwnRecipe): DrawRecipe => ({ ...recipe, weight: 1, own: true })

/**
 * Fill a recipe's slots, first to last. A slot takes the preset its job,
 * the pack's leanings and how little it has been used so far make likeliest;
 * no effect is in a chain twice and no chain has two presets that each take
 * the dry sound away. Undefined when a slot cannot be filled.
 */
export function drawChain(
  random: Random,
  palette: PackPalette,
  recipe: DrawRecipe,
  pool: readonly Candidate[],
  state: DrawState,
  cost: (candidate: Candidate) => number,
): Drawn | undefined {
  const picks: Candidate[] = []
  for (const slot of recipe.slots) {
    const heavy = picks.some((pick) => pick.voice.traits.includes('heavy'))
    const spent = picks.reduce((sum, pick) => sum + cost(pick), 0)
    const open = pool.filter((candidate) => {
      if (!fits(slot, candidate)) return false
      if (picks.some((other) => other.device === candidate.device)) return false
      if (heavy && candidate.voice.traits.includes('heavy')) return false
      const before = picks.map((pick, at): Placed => ({ pick, role: recipe.slots[at]?.role }))
      if (!recipe.own && clash(before, candidate, slot.role, recipe.lead, recipe.category))
        return false
      return spent + cost(candidate) <= DRAW_LIMITS.costPct
    })
    // What the pack leans away from does not come in while anything else will do the job.
    const leant = open.filter((candidate) => lean(palette, candidate) >= DRAW_LIMITS.leastLean)
    const pick = weighted(random, leant.length > 0 ? leant : open, (candidate) => {
      // The job a preset does best counts for most; a second or third job for half as much each.
      const rank =
        slot.role === undefined ? 1 : 0.5 ** Math.max(0, candidate.voice.roles.indexOf(slot.role))
      const used = count(state.voices, key(candidate.device, candidate.preset))
      const usedDevice = count(state.devices, candidate.device)
      const leaning = lean(palette, candidate)
      return (rank * leaning * spread(used, leaning)) / (1 + usedDevice / 10)
    })
    if (!pick) return undefined
    picks.push(pick)
  }
  if (count(state.sequences, sequence(picks)) >= DRAW_LIMITS.sameEffects) return undefined
  const effects = picks.map((pick) => jittered(random, pick))
  if (state.taken.has(signature(effects))) return undefined
  return { recipe: recipe.id, category: recipe.category, lead: recipe.lead, picks, effects }
}

/** A value to three figures: what a hand would have typed. */
export const rounded = (value: number) => Number(value.toPrecision(3))

/** The preset as it is, or with its times and rates moved by up to an eighth. */
function jittered(random: Random, pick: Candidate): PatchDevice {
  const device: PatchDevice = { deviceId: pick.device, preset: pick.preset }
  const descriptor = benchEffect(pick.device)
  const names = LEXICON.get(pick.device)?.jitter ?? []
  // The chance is drawn whether or not there is anything to move, so that one effect's list does not shift the next one's draw.
  const moves = random() < DRAW_LIMITS.jitterChance
  if (!descriptor || names.length === 0 || !moves) {
    names.forEach(() => random())
    return device
  }
  const now = patchDeviceParams(descriptor, device)
  const params: Record<string, number> = {}
  for (const name of names) {
    const by = 1 + (random() * 2 - 1) * DRAW_LIMITS.jitter
    const spec = descriptor.params[name]
    const value = now[name]
    if (!spec || !(Math.abs(value) > 0)) continue
    const moved = rounded(Math.min(spec.max, Math.max(spec.min, value * by)))
    if (moved !== rounded(value)) params[name] = moved
  }
  return Object.keys(params).length > 0 ? { ...device, params } : device
}

/** Every trait a chain's presets have between them. */
export function chainTraits(picks: readonly Candidate[]): Set<Trait> {
  return new Set(picks.flatMap((pick) => pick.voice.traits))
}
