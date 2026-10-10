// The factory bank: instrument presets, effect chains and sounds to paint
// with, all made of the stock devices. Everything here is data plus two
// renderers, so a host can list the bank before audio starts and render a
// preview or a sound only when someone asks for it.

import { type PatchCategory } from '../../core/devices/patch'
import { type PlanarAudio } from '../../core/render/encode'
import { renderPatch, type RenderPatchOptions } from '../patch-render'
import { FACTORY_CHAINS } from './chains'
import { type GeneratedSound } from './generate'
import { transposePatch, transposePhrase, transposeWords } from './key'
import { wholeCycles } from './parts'
import {
  CHAIN_PREVIEW_PATCH,
  CHAIN_PREVIEW_PHRASE,
  PREVIEW_SECONDS,
  previewPhrase,
} from './phrases'
import { FACTORY_PRESETS } from './presets'
import { FACTORY_SOUNDS } from './sounds'
import { type FactoryChain, type FactoryPreset, type FactorySound } from './types'
import { varySound, type SoundVariation } from './vary'

export { FACTORY_CHAINS } from './chains'
export {
  CHAIN_PREVIEW_PATCH,
  CHAIN_PREVIEW_PHRASE,
  FACTORY_PHRASES,
  PREVIEW_SECONDS,
  previewPhrase,
} from './phrases'
export { FACTORY_PRESETS } from './presets'
export {
  FACTORY_CHAIN_PACK_SIZE,
  FACTORY_PACKS,
  FACTORY_PACK_SIZE,
  FACTORY_SOUND_PACK_SIZE,
  factoryPack,
  loadFactoryPacks,
} from './packs'
export { loadFactoryPackChains } from './chain-packs'
export { loadFactoryPackSounds } from './sound-packs'
export { FACTORY_SOUNDS } from './sounds'
export {
  CHORD_COLOURS,
  FACTORY_HOME_KEY,
  FACTORY_MODES,
  PITCH_CLASS_NAMES,
  chordName,
  chordTakes,
  chordTones,
  factoryTranspose,
  keyChord,
  pitchClassName,
  relativeMajorRoot,
  transposePatch,
  transposePhrase,
  transposeWords,
  type ChordColour,
  type FactoryKey,
  type FactoryMode,
  type KeyChord,
} from './key'
export {
  GENERATED_KINDS,
  generateSound,
  type GenerateSoundOptions,
  type GeneratedKind,
  type GeneratedSound,
} from './generate'
export {
  VARIATION_KINDS,
  VARIATION_LIMITS,
  chordMoves,
  describeVariant,
  soundDegree,
  variationAmounts,
  varySound,
  type SoundVariation,
  type VariantChanges,
  type VariationKind,
  type VariedPlaying,
} from './vary'
export {
  type FactoryChain,
  type FactoryChainCategory,
  type FactoryPack,
  type FactoryPhraseName,
  type FactoryPreset,
  type FactoryPresetCategory,
  type FactorySound,
} from './types'

/** Instrument preset groups in browser order. */
export const FACTORY_PRESET_CATEGORIES: readonly PatchCategory[] = [
  { id: 'pad', label: 'Pads' },
  { id: 'keys', label: 'Keys' },
  { id: 'bass', label: 'Bass' },
  { id: 'bell', label: 'Bells' },
  { id: 'string', label: 'Strings' },
  { id: 'plucked', label: 'Plucked' },
  { id: 'wind', label: 'Wind' },
  { id: 'voice', label: 'Voices' },
  { id: 'organ', label: 'Organs' },
  { id: 'drone', label: 'Drones' },
  { id: 'texture', label: 'Textures' },
]

/** Effect chain groups in browser order. */
export const FACTORY_CHAIN_CATEGORIES: readonly PatchCategory[] = [
  { id: 'space', label: 'Space' },
  { id: 'echo', label: 'Echo' },
  { id: 'tape', label: 'Tape' },
  { id: 'motion', label: 'Motion' },
  { id: 'texture', label: 'Texture' },
  { id: 'pitch', label: 'Pitch' },
  { id: 'master', label: 'Master' },
]

/** Peak level every rendered preview and factory sound is brought to, in dBFS. */
export const FACTORY_PEAK_DB = -6

export function factoryPreset(id: string): FactoryPreset | undefined {
  return FACTORY_PRESETS.find((preset) => preset.id === id)
}

export function factoryChain(id: string): (typeof FACTORY_CHAINS)[number] | undefined {
  return FACTORY_CHAINS.find((chain) => chain.id === id)
}

export function factorySound(id: string): FactorySound | undefined {
  return FACTORY_SOUNDS.find((sound) => sound.id === id)
}

/** What a host passes through to `renderPatch`: where and how to run the devices. */
export type FactoryRenderOptions = Pick<
  RenderPatchOptions,
  'sampleRate' | 'describe' | 'compile' | 'sliceMs' | 'signal'
> & {
  /** What a sample instrument plays when the recipe names no source of its own. */
  sample?: PlanarAudio
}

/** How a factory sound is rendered: where to run the devices, and in which key. */
export type FactorySoundRenderOptions = FactoryRenderOptions & {
  /**
   * Semitones the sound is moved from the bank's own key, as
   * `factoryTranspose(key)` gives them (default 0: C major and the other
   * white-key modes).
   */
  transpose?: number
  /**
   * Which variant of the sound to render (`varySound`): the same recipe
   * played differently, decided by a seed and an amount for each kind of
   * difference (chords, speed, pattern, touch). Absent, or at 0 in every
   * kind, the sound as written. A sound made from another one plays the
   * variant on that other sound as written.
   */
  vary?: SoundVariation
}

/**
 * A preset's audition: its category's phrase played on it, eight seconds
 * with the tail, at the bank's peak level.
 */
export function renderPresetPreview(
  preset: FactoryPreset,
  options: FactoryRenderOptions = {},
): Promise<PlanarAudio> {
  return renderPatch(preset, {
    ...options,
    phrase: previewPhrase(preset),
    durationSec: PREVIEW_SECONDS,
    fadeOutSec: 0.25,
    normalizePeakDb: FACTORY_PEAK_DB,
  })
}

/** Seconds of the input a chain preview plays before leaving the chain to ring out. */
export const CHAIN_PREVIEW_INPUT_SECONDS = 6

export interface ChainPreviewOptions extends FactoryRenderOptions {
  /**
   * The sound to run through the chain, at the render's sample rate: its
   * first six seconds are used. Without one a dry electric piano plays.
   */
  input?: PlanarAudio
}

/**
 * A chain's audition: a dry sound through it, eight seconds with the tail,
 * at the bank's peak level.
 */
export async function renderChainPreview(
  chain: FactoryChain,
  options: ChainPreviewOptions = {},
): Promise<PlanarAudio> {
  const { input: given, ...render } = options
  const sampleRate = given?.sampleRate ?? render.sampleRate
  const dry =
    given ??
    (await renderPatch(CHAIN_PREVIEW_PATCH, {
      ...render,
      phrase: CHAIN_PREVIEW_PHRASE,
      durationSec: CHAIN_PREVIEW_INPUT_SECONDS,
    }))
  const frames = Math.round(CHAIN_PREVIEW_INPUT_SECONDS * dry.sampleRate)
  // A long sound is cut with a short fade, so the chain's tail is heard on
  // its own instead of a click.
  const fade = Math.min(frames, Math.round(0.05 * dry.sampleRate))
  const input: PlanarAudio = {
    sampleRate: dry.sampleRate,
    channels: dry.channels.map((channel) => {
      if (channel.length <= frames) return channel
      const cut = channel.slice(0, frames)
      for (let i = 0; i < fade; i += 1) cut[frames - 1 - i] *= i / fade
      return cut
    }),
  }
  return renderPatch(chain, {
    ...render,
    sampleRate,
    input,
    durationSec: PREVIEW_SECONDS,
    fadeOutSec: 0.25,
    normalizePeakDb: FACTORY_PEAK_DB,
  })
}

/**
 * A factory sound moved by `semitones`: its notes, the devices that are set
 * to a pitch, and its name and description ("Low drone D" is "Low drone F"
 * three up). Its id and number stay, so it is the same sound to whatever
 * refers to it. A sound made from another one keeps its own notes, since the
 * sound it plays is the one that moves.
 */
export function transposeFactorySound(sound: FactorySound, semitones: number): FactorySound {
  if (semitones === 0) return sound
  const patch = typeof sound.patch === 'string' ? factoryPreset(sound.patch) : sound.patch
  const name = sound.words ? transposeWords(sound.words.name, semitones) : sound.name
  const description = sound.words
    ? transposeWords(sound.words.description, semitones)
    : sound.description
  return {
    ...sound,
    name,
    description,
    ...(patch ? { patch: { ...transposePatch(patch, semitones), name, description } } : {}),
    phrase: sound.source === undefined ? transposePhrase(sound.phrase, semitones) : sound.phrase,
  }
}

/**
 * Render a factory sound: its phrase on its patch, looped without a seam
 * when the recipe asks for it, in the bank's own key or `transpose`
 * semitones from it. A sound made from another one (a granular cloud of the
 * piano) renders that one first, in the same key.
 */
export async function renderFactorySound(
  sound: FactorySound,
  options: FactorySoundRenderOptions = {},
): Promise<PlanarAudio> {
  const { transpose = 0, vary, ...render } = options
  // Varied as it is written, on the white keys, and moved into the key afterwards.
  const inKey = transposeFactorySound(varySound(sound, vary), transpose)
  const patch = typeof inKey.patch === 'string' ? factoryPreset(inKey.patch) : inKey.patch
  if (!patch)
    throw new Error(`live-mix: factory sound "${sound.id}" names a preset that does not exist`)
  let sample = render.sample
  if (sound.source !== undefined) {
    const source = factorySound(sound.source)
    if (!source || source.source !== undefined) {
      throw new Error(`live-mix: factory sound "${sound.id}" has no plain source "${sound.source}"`)
    }
    sample = await renderFactorySound(source, { ...render, transpose })
  }
  const phrase =
    inKey.tuning === 'whole-cycles'
      ? {
          notes: inKey.phrase.notes.map((note) => ({
            ...note,
            note: wholeCycles(note.note, inKey.durationSec),
          })),
        }
      : inKey.phrase
  return renderPatch(patch, {
    ...render,
    sample,
    phrase,
    durationSec: inKey.durationSec,
    skipSec: inKey.skipSec,
    loopCrossfadeSec: inKey.loopCrossfadeSec,
    loopFold: inKey.loopFold,
    fadeOutSec: inKey.loopCrossfadeSec ? 0 : (inKey.fadeOutSec ?? 0.05),
    normalizePeakDb: FACTORY_PEAK_DB,
  })
}

/**
 * Render a generated sound (`generateSound`): its phrase on its patch, looped
 * without a seam when it is one that loops, at the bank's peak level.
 */
export function renderGeneratedSound(
  sound: GeneratedSound,
  options: FactoryRenderOptions = {},
): Promise<PlanarAudio> {
  return renderPatch(sound.patch, {
    ...options,
    phrase: sound.phrase,
    durationSec: sound.durationSec,
    skipSec: sound.skipSec,
    loopCrossfadeSec: sound.loopCrossfadeSec,
    fadeOutSec: sound.loopCrossfadeSec ? 0 : (sound.fadeOutSec ?? 0.05),
    normalizePeakDb: FACTORY_PEAK_DB,
  })
}
