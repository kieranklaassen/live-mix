// What an instrument's own presets are held to, and how they are measured:
// each one is played alone, with no effect after it, on the phrase most of the
// instrument's bank presets are auditioned with, and compared with its
// siblings. A preset is worth a place in the list only when it can be told
// from the others and plays at a level that needs no hand on the fader.

import { type Patch } from '../../core/devices/patch'
import { type PlanarAudio } from '../../core/render/encode'
import { isWasmDescriptor, type WasmDeviceDescriptor } from '../descriptor'
import { FACTORY_PRESETS, PREVIEW_SECONDS } from '../factory'
import { FACTORY_PHRASES, previewPhrase } from '../factory/phrases'
import { type FactoryPresetCategory } from '../factory/types'
import { type Phrase, renderPatch } from '../patch-render'
import { STOCK_WASM_DEVICES } from '../registry'
import { compileFromDisk, type AudioMeasurement } from './render-support'

const node = { sampleRate: 48000, compile: compileFromDisk, sliceMs: 0 }

/** The library's own instruments. */
export const INSTRUMENTS: readonly WasmDeviceDescriptor[] = STOCK_WASM_DEVICES.filter(
  (descriptor): descriptor is WasmDeviceDescriptor =>
    descriptor.category === 'instrument' && isWasmDescriptor(descriptor),
)

export const INSTRUMENT_PRESET_LIMITS = {
  /** Presets of its own every instrument comes with at the least: as many as an effect has. */
  each: 16,
  /** Characters of a name at most: it stands beside the instrument's in the Instrument block. */
  name: 20,
  /** Sample peak at most, dBFS: a chord played hard on the bare instrument still has room above it. */
  peakDb: -3,
  /** RMS of the loudest 400 ms at the least, dBFS: under it nothing is heard. */
  silentDb: -50,
  /**
   * How far the loudest 400 ms of a preset may sit from the middle one of its
   * instrument, dB: stepping through the list does not send a hand to the fader.
   */
  levelDb: 6,
  /** Two presets whose prints are closer than this are one sound under two names (`printDistance`), dB. */
  alikeDb: 1,
  /** A steady offset at most, linear. */
  dc: 0.01,
} as const

/** What a preset can be outside of. */
export type InstrumentPresetProblem = 'PEAK' | 'SILENT' | 'DC' | 'LEVEL' | 'ALIKE'

/**
 * Presets that shipped outside the limits and stay as they shipped: what a
 * preset loads does not change once someone may have saved a piece on it.
 * By instrument and name, what each is outside of. They were all there before
 * the limits were: no preset written since is let off any of them.
 *
 * The level is measured against the middle preset of the instrument, so a
 * preset added to a list can move that middle and carry a shipped preset
 * across the line; it is then added here, with the others.
 */
export const AS_SHIPPED: Readonly<
  Record<string, Readonly<Record<string, readonly InstrumentPresetProblem[]>>>
> = {
  'acoustic-guitar': {
    'Nylon dusk': ['ALIKE'],
    'Muted pattern': ['LEVEL'],
    'Soft thumb': ['ALIKE'],
  },
  atmosphere: { 'Rain on the window': ['LEVEL'], 'Mains hum': ['LEVEL'] },
  'bowed-string': { 'Volume swell': ['LEVEL'] },
  'chamber-strings': { 'Chamber section': ['ALIKE'], 'Warm section': ['ALIKE'] },
  clarinet: {
    'Warm clarinet': ['ALIKE'],
    'Bass clarinet': ['ALIKE'],
    'Hollow section': ['ALIKE'],
    Duduk: ['ALIKE'],
  },
  ember: { 'Warm Bass': ['LEVEL'], 'Glass Pluck': ['LEVEL'] },
  'felt-piano': {
    Felt: ['PEAK', 'ALIKE'],
    Bare: ['PEAK'],
    Hall: ['PEAK'],
    Lean: ['PEAK', 'ALIKE'],
  },
  'fm-glass': { 'Slow glass': ['LEVEL'] },
  'grain-synth': {
    'Frozen moment': ['PEAK'],
    Shimmer: ['PEAK'],
    'Backwards wash': ['PEAK'],
    Stutter: ['PEAK'],
  },
  harp: { 'Concert harp': ['ALIKE'], 'Muted harp': ['ALIKE'] },
  'ladder-bass': {
    'Sequence bass': ['ALIKE'],
    'Pedal drone': ['LEVEL'],
    'Soft sub': ['LEVEL'],
    'Rubber pluck': ['LEVEL', 'ALIKE'],
  },
  mallets: { 'Dry xylophone': ['LEVEL'] },
  'pedal-steel': { 'Slow steel': ['ALIKE'], 'Long slides': ['ALIKE'] },
  'west-coast': { 'Rain on wood': ['LEVEL'] },
  zither: { 'Chord zither major': ['ALIKE'], 'Chord zither minor': ['ALIKE'] },
  'zone-sampler': {
    Keys: ['ALIKE'],
    'Soft keys': ['ALIKE'],
    'Short and bright': ['ALIKE'],
    'Even touch': ['ALIKE'],
  },
}

/** The phrase an instrument's own presets are played on: the one most of its bank presets use. */
export function instrumentPhrase(deviceId: string): Phrase {
  const counts = new Map<FactoryPresetCategory, number>()
  for (const preset of FACTORY_PRESETS) {
    if (preset.instrument.deviceId !== deviceId) continue
    counts.set(preset.category, (counts.get(preset.category) ?? 0) + 1)
  }
  const [category] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? []
  return category ? previewPhrase({ category }) : FACTORY_PHRASES.chord
}

/** An instrument on one of its own presets and nothing after it. */
export function instrumentPresetPatch(deviceId: string, preset: string): Patch {
  return {
    id: `${deviceId}-own-preset`,
    name: preset,
    category: 'preset',
    description: '',
    instrument: { deviceId, preset },
    effects: [],
  }
}

/** One preset as someone hears it who loads it and plays: not normalised. */
export function renderInstrumentPreset(deviceId: string, preset: string): Promise<PlanarAudio> {
  return renderPatch(instrumentPresetPatch(deviceId, preset), {
    ...node,
    phrase: instrumentPhrase(deviceId),
    durationSec: PREVIEW_SECONDS,
  })
}

/** The middle value of a list; 0 for an empty one. */
export function median(values: readonly number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((x, y) => x - y)
  const half = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[half] : (sorted[half - 1] + sorted[half]) / 2
}

/**
 * Where a measured preset leaves the limits, shipped exceptions included:
 * `middleDb` is the loudest 400 ms of the middle preset of its instrument, and
 * `nearestDb` how far its print is from its nearest sibling's.
 */
export function instrumentPresetProblems(
  measured: AudioMeasurement,
  middleDb: number,
  nearestDb: number,
): InstrumentPresetProblem[] {
  const problems: InstrumentPresetProblem[] = []
  if (measured.peakDb > INSTRUMENT_PRESET_LIMITS.peakDb) problems.push('PEAK')
  if (!(measured.loudestDb >= INSTRUMENT_PRESET_LIMITS.silentDb)) problems.push('SILENT')
  if (Math.abs(measured.dc) >= INSTRUMENT_PRESET_LIMITS.dc) problems.push('DC')
  if (Math.abs(measured.loudestDb - middleDb) > INSTRUMENT_PRESET_LIMITS.levelDb)
    problems.push('LEVEL')
  if (nearestDb < INSTRUMENT_PRESET_LIMITS.alikeDb) problems.push('ALIKE')
  return problems
}

/** The same without what the preset shipped with. */
export function unexcused(
  deviceId: string,
  preset: string,
  problems: readonly InstrumentPresetProblem[],
): InstrumentPresetProblem[] {
  const excused = AS_SHIPPED[deviceId]?.[preset] ?? []
  return problems.filter((problem) => !excused.includes(problem))
}
