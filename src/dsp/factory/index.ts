// The factory bank: instrument presets, effect chains and sounds to paint
// with, all made of the stock devices. Everything here is data plus two
// renderers, so a host can list the bank before audio starts and render a
// preview or a sound only when someone asks for it.

import { type PatchCategory } from '../../core/devices/patch'
import { type PlanarAudio } from '../../core/render/encode'
import { renderPatch, type RenderPatchOptions } from '../patch-render'
import { FACTORY_CHAINS } from './chains'
import { PREVIEW_SECONDS, previewPhrase } from './phrases'
import { FACTORY_PRESETS } from './presets'
import { FACTORY_SOUNDS } from './sounds'
import { type FactoryPreset, type FactorySound } from './types'

export { FACTORY_CHAINS } from './chains'
export { FACTORY_PHRASES, PREVIEW_SECONDS, previewPhrase } from './phrases'
export { FACTORY_PRESETS } from './presets'
export { FACTORY_SOUNDS } from './sounds'
export {
  type FactoryChain,
  type FactoryChainCategory,
  type FactoryPhraseName,
  type FactoryPreset,
  type FactoryPresetCategory,
  type FactorySound,
} from './types'

/** Instrument preset groups in browser order. */
export const FACTORY_PRESET_CATEGORIES: readonly PatchCategory[] = [
  { id: 'pad', label: 'Pads' },
  { id: 'keys', label: 'Keys' },
  { id: 'bell', label: 'Bells' },
  { id: 'string', label: 'Strings' },
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

/**
 * Render a factory sound: its phrase on its patch, looped without a seam
 * when the recipe asks for it. A sound made from another one (a granular
 * cloud of the piano) renders that one first.
 */
export async function renderFactorySound(
  sound: FactorySound,
  options: FactoryRenderOptions = {},
): Promise<PlanarAudio> {
  const patch = typeof sound.patch === 'string' ? factoryPreset(sound.patch) : sound.patch
  if (!patch)
    throw new Error(`live-mix: factory sound "${sound.id}" names a preset that does not exist`)
  let sample = options.sample
  if (sound.source !== undefined) {
    const source = factorySound(sound.source)
    if (!source || source.source !== undefined) {
      throw new Error(`live-mix: factory sound "${sound.id}" has no plain source "${sound.source}"`)
    }
    sample = await renderFactorySound(source, options)
  }
  return renderPatch(patch, {
    ...options,
    sample,
    phrase: sound.phrase,
    durationSec: sound.durationSec,
    skipSec: sound.skipSec,
    loopCrossfadeSec: sound.loopCrossfadeSec,
    fadeOutSec: sound.loopCrossfadeSec ? 0 : (sound.fadeOutSec ?? 0.05),
    normalizePeakDb: FACTORY_PEAK_DB,
  })
}
