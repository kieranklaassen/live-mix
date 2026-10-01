// What the factory bank holds. Instrument presets and effect chains are
// patches (core/devices/patch.ts); a factory sound is a recipe that renders a
// phrase on a patch into audio to paint with.

import { type Patch, type PatchDevice } from '../../core/devices/patch'
import { type SoundKind } from '../../core/analysis/sound-kind'
import { type Phrase } from '../patch-render'

/** The groups a preset browser lists instrument presets under. */
export type FactoryPresetCategory =
  'pad' | 'keys' | 'bell' | 'string' | 'voice' | 'organ' | 'drone' | 'texture'

/** The phrases a preset can be auditioned with (./phrases.ts). */
export type FactoryPhraseName = 'chord' | 'keys' | 'bells' | 'line' | 'low' | 'hold'

/** An instrument with its settings and the effects after it. */
export interface FactoryPreset extends Patch {
  category: FactoryPresetCategory
  instrument: PatchDevice
  /** What its preview plays; the category decides when absent. */
  preview?: FactoryPhraseName
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
}
