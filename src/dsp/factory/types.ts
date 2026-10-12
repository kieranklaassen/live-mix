// What the factory bank holds. Instrument presets and effect chains are
// patches (core/devices/patch.ts); a factory sound is a recipe that renders a
// phrase on a patch into audio to paint with.

import { type Patch, type PatchDevice } from '../../core/devices/patch'
import { type SoundKind } from '../../core/analysis/sound-kind'
import { type LoopFold, type Phrase } from '../patch-render'

/** The groups a preset browser lists instrument presets under. */
export type FactoryPresetCategory =
  | 'pad'
  | 'keys'
  | 'bass'
  | 'bell'
  | 'string'
  | 'plucked'
  | 'wind'
  | 'voice'
  | 'organ'
  | 'drone'
  | 'texture'
  | 'drum'

/** The phrases a preset can be auditioned with (./phrases.ts). */
export type FactoryPhraseName =
  'chord' | 'keys' | 'bass' | 'bells' | 'line' | 'low' | 'hold' | 'drum'

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
 * sound, a hundred sounds to paint with that are those presets played, and a
 * hundred effect chains in the same idea for any channel. Its name and
 * description say what that is by a sound, a place or a mood; a host lists
 * the packs before any of their presets, sounds or chains are loaded.
 */
export interface FactoryPack {
  /** Stable id; every preset of the pack has an id that starts with it. */
  id: string
  name: string
  /** What the pack sounds like and where its idea comes from, in a sentence or two. */
  description: string
  /** How many presets it holds, known before they are loaded. */
  count: number
  /**
   * How many sounds to paint with it holds (./sound-packs), known before they
   * are loaded: a hundred, or none for a pack whose sounds are not written yet.
   */
  sounds: number
  /**
   * How many effect chains it holds (./chain-packs), known before they are
   * loaded: a hundred, or none for a pack whose chains are not drawn yet.
   */
  chains: number
}

/** What an effect chain is for; also where a browser lists it. */
export type FactoryChainCategory =
  'space' | 'echo' | 'tape' | 'motion' | 'texture' | 'pitch' | 'master'

/** Effects alone, for any channel: a painted sound, the live input, the master. */
export interface FactoryChain extends Patch {
  category: FactoryChainCategory
  instrument?: undefined
  /** The id of the pack it belongs to (./chain-packs); absent for a chain of the bank itself. */
  pack?: string
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
  /**
   * `'linear'` for a phrase that is played round again (see `cycled` in
   * ./sounds/recipe.ts): what is folded over the start is the start once
   * more, so the two are added at equal amplitude, not at equal power.
   */
  loopFold?: LoopFold
  /**
   * For a `'linear'` loop: every pass is laid on whole frames of the loop
   * (`RenderPatchOptions.wholeFramePasses`), so at a tempo where a pass is
   * not a whole number of frames the fold leaves the first stroke as it is.
   * The loops of the house pack say it. A loop that shipped before does not,
   * and is rendered at every tempo as it was.
   */
  wholeFramePasses?: boolean
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
   * For a sound that keeps time (a drum loop, a pulse, a bass line): the
   * tempo it is written at, in beats per minute. `renderFactorySound` with a
   * `bpm` of its own plays it at that tempo instead: the same notes closer
   * together or further apart, never the audio stretched (see ./tempo.ts).
   * Most such sounds come round; one without a `loopCrossfadeSec` keeps time
   * and ends (a fill, a rise: whole bars played once from a bar line).
   * Absent for a sound with no beat to it, which is the same at every tempo.
   */
  bpm?: number
  /**
   * For a sound that keeps time: controls of its own instrument that are a length
   * of time (`'time'`) or a rate (`'rate'`) in this sound and in no other, so they
   * follow the tempo beside the ones that do for every sound (`TIMED_PARAMS` in
   * ./tempo.ts). A sampler's `end`, where it is how much of the loaded sound one
   * held key reads backwards: the key reaches the first sample on the bar line at
   * every tempo at which the recording is long enough. Not a rule of the device: in most patches a sampler's End is a
   * place in the recording and stays where it is.
   */
  timedParams?: Readonly<Record<string, 'time' | 'rate'>>
  /**
   * True for a sound played on a kit (./kits.ts), whose keys are things and
   * not pitches: every C the same drum. In another key its notes stay where
   * they are and the kit's own tuning moves, and a variant never moves it to
   * another chord. Set by `sound()` from the instrument, never by hand.
   */
  kit?: true
  /**
   * For one part of a kit (a layer, a fill, a single drum): played at the kit's own
   * level and not brought to the bank's peak (`KIT_LEVEL_DB` in ./kits.ts).
   * A hat is then as far under a kick as the kit has it, so a kick, a clap
   * and a row of hats laid over each other are balanced as one kit, and a
   * hat alone is quieter than a sound of the bank is otherwise. On a sound
   * made from such a part (`source`): brought to the peak of that part and
   * not to the bank's, so a swell made from a crash ends as loud as the crash
   * starts.
   */
  kitLevel?: true
  /**
   * The name and description with each note they mention in braces
   * ("Low drone {D}"): what `transposeFactorySound` writes them from in
   * another key. Absent when neither names a note.
   */
  words?: { name: string; description: string }
  /** The id of the pack it belongs to (./sound-packs); absent for a sound of the bank itself. */
  pack?: string
}
