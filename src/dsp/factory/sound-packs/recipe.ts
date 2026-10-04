// What a pack's sounds are written with. A pack sound is one of the pack's
// own presets played: the recipe names the preset, says what is played on it
// and for how long, and may change a setting or the effects where the sound
// needs it (a loop that has to come round, a single note that has to end).
// Every file of pack sounds beside this one is a list of recipes handed to
// `packSounds` and nothing else.

import { type PatchDevice } from '../../../core/devices/patch'
import { transposeWords } from '../key'
import { type FactoryPreset, type FactorySound } from '../types'

export { breathe, hall, quarterTurn, soften } from '../parts'
export { cycled, looped, played, type HeldNote, type Stroke } from '../sounds/recipe'

/** What `looped`, `played` and `cycled` give: the phrase and how it is rendered. */
type Playing = Pick<
  FactorySound,
  'phrase' | 'durationSec' | 'skipSec' | 'loopCrossfadeSec' | 'loopFold' | 'fadeOutSec'
>

export interface PackRecipe extends Playing {
  /** Its place in the pack, 1 to 100, never reused: the catalogue number is the pack's base plus this. */
  n: number
  /** Kebab-case, without the pack's id: the sound's id is `<pack id>-<id>`. */
  id: string
  /** Each note it mentions in braces ("Hangar drone {D}"), as the bank's sounds have them. */
  name: string
  kind: FactorySound['kind']
  description: string
  /** The pack's preset it is played on, by id; or `instrument` written out. */
  preset?: string
  /** Settings of the preset's instrument changed for this sound. */
  set?: Readonly<Record<string, number>>
  /** The effects in place of the preset's own; with `instrument`, the effects. */
  effects?: readonly PatchDevice[]
  /** Effects added after the others: a `quarterTurn`, a limiter. */
  then?: readonly PatchDevice[]
  /** An instrument written out, for a sound no preset of the pack plays. */
  instrument?: PatchDevice
  /** For a sample instrument: the id of the sound of the bank it plays (see `FactorySound.source`). */
  source?: string
  tuning?: 'whole-cycles'
}

/**
 * A pack's recipes as factory sounds: each with its catalogue number (`base`
 * plus its place), its id under the pack's, its patch written out and the
 * pack it belongs to. A recipe that names a preset the pack does not have
 * stops the module from loading, with the name it asked for.
 */
export function packSounds(
  pack: string,
  base: number,
  presets: readonly FactoryPreset[],
  recipes: readonly PackRecipe[],
): FactorySound[] {
  const byId = new Map(presets.map((preset) => [preset.id, preset]))
  return recipes.map((recipe) => {
    const { n, preset: presetId, set, effects, then, instrument: written, ...rest } = recipe
    const id = `${pack}-${recipe.id}`
    const preset = presetId === undefined ? undefined : byId.get(presetId)
    if (presetId !== undefined && !preset) {
      throw new Error(`live-mix: pack sound "${id}" names a preset "${presetId}" its pack lacks`)
    }
    const from = written ?? preset?.instrument
    if (!from)
      throw new Error(`live-mix: pack sound "${id}" has neither a preset nor an instrument`)
    const instrument = set ? { ...from, params: { ...from.params, ...set } } : from
    const name = transposeWords(recipe.name, 0)
    const description = transposeWords(recipe.description, 0)
    const names = name !== recipe.name || description !== recipe.description
    return {
      ...rest,
      id,
      number: base + n,
      name,
      description,
      ...(names ? { words: { name: recipe.name, description: recipe.description } } : {}),
      pack,
      patch: {
        id,
        name,
        category: recipe.kind,
        description,
        instrument,
        effects: [...(effects ?? preset?.effects ?? []), ...(then ?? [])],
      },
    }
  })
}
