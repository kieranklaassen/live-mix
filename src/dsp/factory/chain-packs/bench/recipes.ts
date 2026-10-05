// The recipes a chain is drawn from: what follows what, by the job each
// effect does (./lexicon/types.ts has the roles). A recipe says nothing of
// which effect or preset fills a slot; the pack's palette decides that. Every
// recipe has two to four slots: one effect on one preset is already in the
// list of effects and is no chain.

import { type FactoryChainCategory } from '../../types'
import { type Role, type Trait } from './lexicon/types'

export interface Slot {
  role: Role
  /** Traits the preset must have every one of. */
  want?: readonly Trait[]
  /** Traits it must have at least one of. */
  any?: readonly Trait[]
  /** Traits it must have none of. */
  not?: readonly Trait[]
  /** Only presets of these devices (`DeviceDescriptor.id`). */
  devices?: readonly string[]
}

export interface Recipe {
  id: string
  /** The group its chains are listed under. */
  category: FactoryChainCategory
  slots: readonly Slot[]
  /** Which slot the chain is named for, counted from 0. */
  lead: number
  /** How often it is drawn against the others of its group (default 1). */
  weight?: number
}

const slot = (role: Role, rest: Omit<Slot, 'role'> = {}): Slot => ({ role, ...rest })

// A stage that colours without taking over: in front of a space or an echo.
const gentle = { not: ['heavy', 'strange', 'fast'] } as const
// A tone that stands in a chain to be heard: an equaliser that moves a decibel is no stage of its own.
const heard = { not: ['faint'] } as const
// What a master chain may hold: only what the lexicon marks as fit for a whole
// mix (`whole`). No amplifier, no radio, no reverb, no filter that takes the
// low end or the top away, nothing that pumps and nothing that folds the mix
// to mono.
const whole = { want: ['whole'] } as const
const masterTone = { ...whole, devices: ['ambient-eq'] } as const
// A limiter on a mix catches peaks and a compressor leans on it; one that flattens or pumps is an effect.
const masterCeiling = { ...whole, devices: ['ambient-limiter', 'fet-limiter'] } as const
// A limiter that can pass for glue still is one: no limiter runs into the limiter.
const masterGlue = { ...whole, devices: ['ambient-comp'] } as const
const masterWidth = { ...whole, devices: ['stereo-widener'] } as const
const masterDrive = { ...whole, devices: ['saturator', 'tape', 'analog-drive'] } as const
const masterWear = { ...whole, devices: ['tape', 'patina'] } as const

const recipe = (
  id: string,
  category: FactoryChainCategory,
  lead: number,
  slots: readonly Slot[],
  weight = 1,
): Recipe => ({ id, category, lead, slots, weight })

export const RECIPES: readonly Recipe[] = [
  // Space: a room, a hall or a halo is what is heard.
  recipe('width-hall', 'space', 1, [slot('width'), slot('hall')]),
  recipe('swell-hall', 'space', 1, [slot('swell', gentle), slot('hall')]),
  recipe('tone-hall', 'space', 1, [slot('tone', heard), slot('hall')]),
  recipe('drive-hall', 'space', 1, [slot('drive', gentle), slot('hall')]),
  recipe('room-hall', 'space', 1, [slot('room'), slot('hall')]),
  recipe('hall-tone', 'space', 0, [slot('hall'), slot('tone', heard)]),
  recipe('hall-glue', 'space', 0, [slot('hall'), slot('glue')], 0.6),
  recipe('hall-width', 'space', 0, [slot('hall'), slot('width')], 0.6),
  recipe('halo-hall', 'space', 0, [slot('halo'), slot('hall')]),
  recipe('room-halo', 'space', 1, [slot('room'), slot('halo')], 0.7),
  recipe('tone-halo', 'space', 1, [slot('tone', heard), slot('halo')], 0.7),
  recipe('swell-halo', 'space', 1, [slot('swell', gentle), slot('halo')], 0.7),
  recipe('drive-room', 'space', 1, [slot('drive', gentle), slot('room')], 0.7),
  recipe('width-room', 'space', 1, [slot('width'), slot('room')], 0.6),
  recipe('tone-room-hall', 'space', 2, [slot('tone', heard), slot('room'), slot('hall')], 0.6),
  recipe('swell-halo-hall', 'space', 1, [slot('swell', gentle), slot('halo'), slot('hall')], 0.6),

  // Echo: repeats and loops.
  recipe('echo-room', 'echo', 0, [slot('echo'), slot('room')]),
  recipe('echo-hall', 'echo', 0, [slot('echo'), slot('hall')]),
  recipe('drive-echo', 'echo', 1, [slot('drive', gentle), slot('echo')]),
  recipe('echo-tone', 'echo', 0, [slot('echo'), slot('tone', heard)], 0.7),
  recipe('motion-echo', 'echo', 1, [slot('motion', gentle), slot('echo')]),
  recipe('echo-echo', 'echo', 0, [slot('echo'), slot('echo')], 0.7),
  recipe('swell-echo', 'echo', 1, [slot('swell', gentle), slot('echo')], 0.7),
  recipe('echo-halo', 'echo', 0, [slot('echo'), slot('halo')], 0.7),
  recipe('echo-width', 'echo', 0, [slot('echo'), slot('width')], 0.5),
  recipe('loop-hall', 'echo', 0, [slot('loop'), slot('hall')]),
  recipe('loop-room', 'echo', 0, [slot('loop'), slot('room')], 0.7),
  recipe('tone-loop', 'echo', 1, [slot('tone', heard), slot('loop')], 0.7),
  recipe('loop-echo', 'echo', 0, [slot('loop'), slot('echo')], 0.6),
  recipe('drive-echo-hall', 'echo', 1, [slot('drive', gentle), slot('echo'), slot('hall')], 0.7),
  recipe('loop-tone-hall', 'echo', 0, [slot('loop'), slot('tone', heard), slot('hall')], 0.6),

  // Tape: the medium and the drive.
  recipe('wear-hiss', 'tape', 0, [slot('wear'), slot('hiss')]),
  recipe('wear-room', 'tape', 0, [slot('wear'), slot('room')]),
  recipe('wear-hall', 'tape', 0, [slot('wear'), slot('hall')]),
  recipe('drive-wear', 'tape', 1, [slot('drive'), slot('wear')]),
  recipe('tone-wear', 'tape', 1, [slot('tone', heard), slot('wear')]),
  recipe('loop-wear', 'tape', 0, [slot('loop'), slot('wear')]),
  recipe('wear-echo', 'tape', 0, [slot('wear'), slot('echo')]),
  recipe('motion-wear', 'tape', 1, [slot('motion', gentle), slot('wear')]),
  recipe('wear-tone', 'tape', 0, [slot('wear'), slot('tone', heard)], 0.7),
  recipe('drive-tone', 'tape', 0, [slot('drive'), slot('tone', heard)], 0.6),
  recipe('drive-hiss', 'tape', 0, [slot('drive'), slot('hiss')], 0.5),
  recipe('loop-wear-hall', 'tape', 1, [slot('loop'), slot('wear'), slot('hall')], 0.8),
  recipe('drive-wear-room', 'tape', 1, [slot('drive'), slot('wear'), slot('room')], 0.7),
  recipe('wear-hiss-hall', 'tape', 0, [slot('wear'), slot('hiss'), slot('hall')], 0.6),
  recipe('tone-wear-echo', 'tape', 1, [slot('tone', heard), slot('wear'), slot('echo')], 0.6),

  // Motion: what turns, sweeps and pulses.
  recipe('motion-hall', 'motion', 0, [slot('motion'), slot('hall')]),
  recipe('motion-room', 'motion', 0, [slot('motion'), slot('room')]),
  recipe('pulse-echo', 'motion', 0, [slot('pulse'), slot('echo')]),
  recipe('pulse-hall', 'motion', 0, [slot('pulse'), slot('hall')]),
  recipe('pulse-room', 'motion', 0, [slot('pulse'), slot('room')], 0.7),
  recipe('motion-motion', 'motion', 0, [slot('motion'), slot('motion')], 0.7),
  recipe('width-motion', 'motion', 1, [slot('width'), slot('motion')], 0.7),
  recipe('drive-motion', 'motion', 1, [slot('drive', gentle), slot('motion')]),
  recipe('swell-motion', 'motion', 1, [slot('swell', gentle), slot('motion')], 0.7),
  recipe('motion-tone', 'motion', 0, [slot('motion'), slot('tone', heard)], 0.6),
  recipe('motion-halo', 'motion', 0, [slot('motion'), slot('halo')], 0.7),
  recipe('tone-pulse', 'motion', 1, [slot('tone', heard), slot('pulse')], 0.5),
  recipe(
    'drive-motion-hall',
    'motion',
    1,
    [slot('drive', gentle), slot('motion'), slot('hall')],
    0.7,
  ),
  recipe('motion-echo-hall', 'motion', 0, [slot('motion'), slot('echo'), slot('hall')], 0.6),

  // Texture: grains, holds and swells.
  recipe('grain-hall', 'texture', 0, [slot('grain'), slot('hall')]),
  recipe('grain-room', 'texture', 0, [slot('grain'), slot('room')], 0.7),
  recipe('hold-hall', 'texture', 0, [slot('hold'), slot('hall')]),
  recipe('swell-hold', 'texture', 1, [slot('swell', gentle), slot('hold')]),
  recipe('grain-echo', 'texture', 0, [slot('grain'), slot('echo')], 0.8),
  recipe('hold-motion', 'texture', 0, [slot('hold'), slot('motion')]),
  recipe('grain-wear', 'texture', 0, [slot('grain'), slot('wear')], 0.8),
  recipe('hold-wear', 'texture', 0, [slot('hold'), slot('wear')], 0.8),
  recipe('grain-tone', 'texture', 0, [slot('grain'), slot('tone', heard)], 0.6),
  recipe('hold-halo', 'texture', 0, [slot('hold'), slot('halo')], 0.7),
  recipe('drive-grain', 'texture', 1, [slot('drive', gentle), slot('grain')], 0.7),
  recipe('swell-room', 'texture', 0, [slot('swell'), slot('room')], 0.7),
  recipe('swell-width', 'texture', 0, [slot('swell'), slot('width')], 0.5),
  recipe('hold-tone', 'texture', 0, [slot('hold'), slot('tone', heard)], 0.6),
  recipe(
    'swell-grain-hall',
    'texture',
    1,
    [slot('swell', gentle), slot('grain'), slot('hall')],
    0.7,
  ),
  recipe('hold-motion-hall', 'texture', 0, [slot('hold'), slot('motion'), slot('hall')], 0.6),

  // Pitch: copies at another pitch.
  recipe('pitch-hall', 'pitch', 0, [slot('pitch'), slot('hall')]),
  recipe('pitch-room', 'pitch', 0, [slot('pitch'), slot('room')], 0.7),
  recipe('pitch-echo', 'pitch', 0, [slot('pitch'), slot('echo')]),
  recipe('swell-pitch', 'pitch', 1, [slot('swell', gentle), slot('pitch')], 0.8),
  recipe('pitch-motion', 'pitch', 0, [slot('pitch'), slot('motion')], 0.8),
  recipe('pitch-grain', 'pitch', 0, [slot('pitch'), slot('grain')], 0.6),
  recipe('pitch-halo', 'pitch', 0, [slot('pitch'), slot('halo')], 0.7),
  recipe('pitch-wear', 'pitch', 0, [slot('pitch'), slot('wear')], 0.8),
  recipe('pitch-tone', 'pitch', 0, [slot('pitch'), slot('tone', heard)], 0.6),
  recipe('drive-pitch', 'pitch', 1, [slot('drive', gentle), slot('pitch')], 0.6),
  recipe('pitch-hold', 'pitch', 0, [slot('pitch'), slot('hold')], 0.6),
  recipe('pitch-width', 'pitch', 0, [slot('pitch'), slot('width')], 0.5),
  recipe('swell-pitch-hall', 'pitch', 1, [slot('swell', gentle), slot('pitch'), slot('hall')], 0.7),
  recipe('pitch-echo-hall', 'pitch', 0, [slot('pitch'), slot('echo'), slot('hall')], 0.6),

  // Master: last on the mix, where little is a lot. Every one ends in a ceiling.
  recipe('glue-ceiling', 'master', 0, [slot('glue', masterGlue), slot('ceiling', masterCeiling)]),
  recipe('tone-ceiling', 'master', 0, [slot('tone', masterTone), slot('ceiling', masterCeiling)]),
  recipe('wear-ceiling', 'master', 0, [slot('wear', masterWear), slot('ceiling', masterCeiling)]),
  recipe('drive-ceiling', 'master', 0, [
    slot('drive', masterDrive),
    slot('ceiling', masterCeiling),
  ]),
  recipe('width-ceiling', 'master', 0, [
    slot('width', masterWidth),
    slot('ceiling', masterCeiling),
  ]),
  recipe('tone-glue-ceiling', 'master', 1, [
    slot('tone', masterTone),
    slot('glue', masterGlue),
    slot('ceiling', masterCeiling),
  ]),
  recipe('drive-tone-ceiling', 'master', 0, [
    slot('drive', masterDrive),
    slot('tone', masterTone),
    slot('ceiling', masterCeiling),
  ]),
  recipe('wear-glue-ceiling', 'master', 0, [
    slot('wear', masterWear),
    slot('glue', masterGlue),
    slot('ceiling', masterCeiling),
  ]),
  recipe('tone-width-ceiling', 'master', 1, [
    slot('tone', masterTone),
    slot('width', masterWidth),
    slot('ceiling', masterCeiling),
  ]),
  recipe('glue-width-ceiling', 'master', 0, [
    slot('glue', masterGlue),
    slot('width', masterWidth),
    slot('ceiling', masterCeiling),
  ]),
  recipe('drive-glue-ceiling', 'master', 0, [
    slot('drive', masterDrive),
    slot('glue', masterGlue),
    slot('ceiling', masterCeiling),
  ]),
]

const byId = new Map(RECIPES.map((entry) => [entry.id, entry]))

export function recipeById(id: string): Recipe | undefined {
  return byId.get(id)
}
