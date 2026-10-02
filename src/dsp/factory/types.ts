// What the factory bank holds. Instrument presets and effect chains are
// patches (core/devices/patch.ts); a factory sound is a recipe that renders a
// phrase on a patch into audio to paint with.

import { type Patch, type PatchDevice } from '../../core/devices/patch'
import { type SoundKind } from '../../core/analysis/sound-kind'
import { type Phrase } from '../patch-render'

/** The groups a preset browser lists instrument presets under. */
export type FactoryPresetCategory =
  'pad' | 'keys' | 'bell' | 'string' | 'plucked' | 'wind' | 'voice' | 'organ' | 'drone' | 'texture'

/** The phrases a preset can be auditioned with (./phrases.ts). */
export type FactoryPhraseName = 'chord' | 'keys' | 'bells' | 'line' | 'low' | 'hold'

/** An instrument with its settings and the effects after it. */
export interface FactoryPreset extends Patch {
  category: FactoryPresetCategory
  instrument: PatchDevice
  /** What its preview plays; the category decides when absent. */
  preview?: FactoryPhraseName
  /** The id of the pack it belongs to (./packs); absent for a preset of the bank itself. */
  pack?: string
}

/**
 * A pack: a hundred presets across every instrument that share one idea of
 * sound. Its name and description say what that is by a sound, a place or a
 * mood; a host lists the packs before any of their presets are loaded.
 */
export interface FactoryPack {
  /** Stable id; every preset of the pack has an id that starts with it. */
  id: string
  name: string
  /** What the pack sounds like and where its idea comes from, in a sentence or two. */
  description: string
  /** How many presets it holds, known before they are loaded. */
  count: number
}

/** What an effect chain is for; also where a browser lists it. */
export type FactoryChainCategory =
  'space' | 'echo' | 'tape' | 'motion' | 'texture' | 'pitch' | 'master'

/** Effects alone, for any channel: a painted sound, the live input, the master. */
export interface FactoryChain extends Patch {
  category: FactoryChainCategory
  instrument?: undefined
}

/** A sound to paint with, rendered on demand from a patch and a phrase. */
export interface FactorySound {
  /** Stable id: an arrangement refers to the sound by it. */
  id: string
  /** Stable catalogue number, never reused: hosts derive numeric sample ids from it. */
  number: number
  name: string
  /** What the sound is, as the library's own analysis labels it. */
  kind: SoundKind
  description: string
  /** The id of a factory preset, or a patch of its own. */
  patch: string | Patch
  phrase: Phrase
  /** Length of the rendered sound in seconds. */
  durationSec: number
  /** Rendered and dropped before the sound starts (see `RenderPatchOptions.skipSec`). */
  skipSec?: number
  /** Seconds of crossfade that make the sound loop without a seam; absent for a sound that ends. */
  loopCrossfadeSec?: number
  /** Fade at the end of a sound that does not loop (default 0.05 s). */
  fadeOutSec?: number
  /**
   * For a sample instrument (granular synth, sampler): the id of the factory
   * sound it plays, rendered first.
   */
  source?: string
  /**
   * `'whole-cycles'` for a sound of steady tones: each note is retuned, by
   * under two cents, to a whole number of cycles per loop when it is rendered
   * (see ./parts.ts), in whatever key that is.
   */
  tuning?: 'whole-cycles'
  /**
   * The name and description with each note they mention in braces
   * ("Low drone {D}"): what `transposeFactorySound` writes them from in
   * another key. Absent when neither names a note.
   */
  words?: { name: string; description: string }
}
