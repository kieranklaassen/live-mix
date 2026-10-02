// Registry descriptors for the stock WASM devices. Nothing registers on
// import (the package is side-effect free); consumers call
// `registerStockWasmDevices()` once, or register the descriptors they want.
// `wasmDeviceDescriptor` is what U22/U37 devices use to join the registry.

import { type DeviceDescriptor, type DeviceRegistry, devices } from '../core/devices'
import { DUCKER_PARAMS } from '../core/devices/native/ducker-abi'
import { type WorkletDuckerOptions } from '../core/devices/native/WorkletDucker'
import { DATTORRO_DEVICE } from './devices/dattorro'
import { ETHER_REVERB_DEVICE } from './devices/ether-reverb'
import { FELT_PIANO_DEVICE } from './devices/felt-piano'
import { createWorkletDucker, type DuckerProcessorOverrides } from './devices/ducker'
import { FDN_REVERB_DEVICE } from './devices/fdn-reverb'
import { GENERATED_WASM_DESCRIPTORS, GENERATED_WASM_DEVICES } from './devices/index.gen'
import { LIMITER_1176_DEVICE } from './devices/limiter-1176'
import { SPECTRAL_DRIFTER_DEVICE } from './devices/spectral-drifter'
import { STEREO_WIDENER_DEVICE } from './devices/stereo-widener'
import { ZITA_REV1_DEVICE } from './devices/zita-rev1'
import { wasmDeviceDescriptor } from './descriptor'

export { wasmDeviceDescriptor, type WasmDeviceMeta } from './descriptor'

export const DATTORRO_DESCRIPTOR = wasmDeviceDescriptor(DATTORRO_DEVICE, {
  name: 'Dattorro Plate',
  category: 'reverb',
  description:
    'The Dattorro plate reverb: the input is summed to mono, diffused and sent round a modulated figure-of-eight tank, for a smooth stereo tail on a bus or the master.',
  presets: {
    'ambient-live': { mix: 0.35, decay: 0.7, damping: 0.3, predelayMs: 20 },
    'Small plate': { mix: 0.25, decay: 0.45, damping: 0.5, predelayMs: 10 },
    'Long plate': { mix: 0.4, decay: 0.9, damping: 0.2, predelayMs: 40 },
    'Tight room': { mix: 0.18, decay: 0.2, damping: 0.6, predelayMs: 0 },
    'Dark plate': { mix: 0.4, decay: 0.75, damping: 0.85, predelayMs: 15 },
    'Bright plate': { mix: 0.35, decay: 0.6, damping: 0, predelayMs: 5 },
    'Faint sheen': { mix: 0.12, decay: 0.8, damping: 0.1, predelayMs: 90 },
    'Endless wash': { mix: 0.36, decay: 0.97, damping: 0.4, predelayMs: 60 },
    'Distant haze': { mix: 0.75, decay: 0.85, damping: 0.65, predelayMs: 0 },
    'Full wet send': { mix: 1, decay: 0.6, damping: 0.2, predelayMs: 0 },
  },
})

export const FDN_REVERB_DESCRIPTOR = wasmDeviceDescriptor(FDN_REVERB_DEVICE, {
  name: 'Tides FDN Reverb',
  category: 'reverb',
  description:
    'Eight-line feedback delay network reverb from Tides, from a room to a twenty-second tail, with a breathing gate that lets the input into the reverb in slow waves.',
  presets: {
    Room: { mix: 0.3, decay: 1.2, damping: 0.5, size: 0.7, breathDepth: 0 },
    Hall: { mix: 0.4, decay: 4, damping: 0.4, size: 1.2, breathDepth: 0.2 },
    Breathing: { mix: 0.5, decay: 8, damping: 0.35, size: 1.4, breathRate: 0.2, breathDepth: 0.6 },
    'Short ambience': { mix: 0.25, decay: 0.4, damping: 0.6, size: 0.5, breathDepth: 0 },
    'Thin veil': { mix: 0.12, decay: 2.5, damping: 0.5, size: 1, breathDepth: 0 },
    'Bright air': { mix: 0.35, decay: 3, damping: 0, size: 1, breathDepth: 0 },
    'Dark cave': { mix: 0.45, decay: 6, damping: 0.95, size: 1.6, breathDepth: 0 },
    'Small bright tank': { mix: 0.4, decay: 7, damping: 0.15, size: 0.5, breathDepth: 0 },
    'Open valley': {
      mix: 0.45,
      decay: 10,
      damping: 0.35,
      predelayMs: 120,
      size: 2,
      breathDepth: 0,
    },
    'Late arrival': {
      mix: 0.45,
      decay: 5,
      damping: 0.5,
      predelayMs: 250,
      size: 1.2,
      breathDepth: 0,
    },
    'Slow swell': {
      mix: 0.55,
      decay: 12,
      damping: 0.45,
      size: 1.8,
      breathRate: 0.05,
      breathDepth: 1,
    },
    'Pulsing gate': {
      mix: 0.5,
      decay: 1.5,
      damping: 0.3,
      size: 0.8,
      breathRate: 2,
      breathDepth: 1,
    },
    'Endless tail': {
      mix: 0.6,
      decay: 20,
      damping: 0.55,
      size: 1.5,
      breathRate: 0.08,
      breathDepth: 0.3,
    },
    'Full wet send': { mix: 1, decay: 8, damping: 0.4, size: 1.4, breathDepth: 0 },
  },
})

export const STEREO_WIDENER_DESCRIPTOR = wasmDeviceDescriptor(STEREO_WIDENER_DEVICE, {
  name: 'Stereo Widener',
  category: 'spatial',
  description:
    'Stereo width from mono to extra wide: mid/side balance first, then decorrelation and a tiny delay on one side near the top, with the bass narrowed as the rest widens.',
  presets: {
    Mono: { width: 0 },
    Normal: { width: 0.5 },
    Wide: { width: 0.8 },
    'Ultra wide': { width: 1 },
    Narrow: { width: 0.3 },
    'Gently wide': { width: 0.7 },
  },
})

export const ZITA_REV1_DESCRIPTOR = wasmDeviceDescriptor(ZITA_REV1_DEVICE, {
  name: 'Zita Reverb',
  category: 'reverb',
  description:
    "Fons Adriaensen's Zita-Rev1 hall reverb: an eight-line network with separate decay times for lows and mids, levelled so the output stays as loud as the input at any mix.",
  presets: {
    Room: { preDelay: 30, lowDecay: 1.5, midDecay: 1.2, damping: 5000, mix: 0.25 },
    Hall: { preDelay: 60, crossover: 200, lowDecay: 3, midDecay: 2.5, damping: 6000, mix: 0.35 },
    Cathedral: { preDelay: 80, lowDecay: 7, midDecay: 6, damping: 3500, mix: 0.45 },
    'Tight chamber': { preDelay: 20, lowDecay: 1, midDecay: 1, damping: 8000, mix: 0.2 },
    'Faint halo': { preDelay: 40, lowDecay: 2.5, midDecay: 3, damping: 7000, mix: 0.13 },
    'Dark hall': { preDelay: 50, lowDecay: 4, midDecay: 3, damping: 1500, mix: 0.4 },
    'Bright hall': {
      preDelay: 40,
      crossover: 300,
      lowDecay: 2,
      midDecay: 3,
      damping: 23520,
      mix: 0.35,
    },
    'Warm undertow': {
      preDelay: 60,
      crossover: 600,
      lowDecay: 8,
      midDecay: 2,
      damping: 4000,
      mix: 0.4,
    },
    'Airy tail': {
      preDelay: 30,
      crossover: 500,
      lowDecay: 1,
      midDecay: 5,
      damping: 14000,
      mix: 0.35,
    },
    'Vast nave': { preDelay: 100, lowDecay: 8, midDecay: 8, damping: 5000, mix: 0.5 },
    'Far away': { preDelay: 20, lowDecay: 5, midDecay: 4.5, damping: 3000, mix: 0.8 },
    'Full wet send': { preDelay: 20, lowDecay: 4, midDecay: 4, damping: 6000, mix: 1 },
  },
})

export const LIMITER_1176_DESCRIPTOR = wasmDeviceDescriptor(LIMITER_1176_DEVICE, {
  name: '1176 Limiter',
  category: 'dynamics',
  description:
    '1176-style levelling: a fixed 4:1 compressor with a fast attack that you drive with the input gain, followed by a soft ceiling that stops peaks at full scale.',
  presets: {
    Safety: { inputGain: 0, outputGain: 0 },
    Drive: { inputGain: 12, outputGain: -6 },
    Squash: { inputGain: 24, outputGain: -12 },
    'Light touch': { inputGain: 3, outputGain: -2.5 },
    'Gentle lift': { inputGain: 6, outputGain: -2 },
    'Lower ceiling': { inputGain: 0, outputGain: -3 },
    Flattened: { inputGain: 40, outputGain: -14.2 },
    'Tucked under': { inputGain: 28, outputGain: -14.7 },
  },
})

export const ETHER_REVERB_DESCRIPTOR = wasmDeviceDescriptor(ETHER_REVERB_DEVICE, {
  name: 'Ether Reverb',
  category: 'reverb',
  description:
    'The reverb from Ether: a pre-delay into a Freeverb tank of eight combs and four allpasses a side, from a small room to a long wash, with a freeze that holds the tail.',
  presets: {
    Ether: { mix: 0.3, decay: 5, damping: 0.4, predelayMs: 0, size: 0.6 },
    Room: { mix: 0.25, decay: 1, damping: 0.6, predelayMs: 10, size: 0.3 },
    Cathedral: { mix: 0.4, decay: 20, damping: 0.2, predelayMs: 40, size: 0.9 },
    Frozen: { mix: 0.5, decay: 30, damping: 0, predelayMs: 0, size: 1, freeze: 1 },
    'Small booth': { mix: 0.2, decay: 0.5, damping: 0.8, predelayMs: 0, size: 0 },
    'Faint air': { mix: 0.1, decay: 3, damping: 0.3, predelayMs: 0, size: 0.5 },
    'Bright chamber': { mix: 0.3, decay: 2, damping: 0, predelayMs: 5, size: 0.4 },
    'Dark hall': { mix: 0.3, decay: 4, damping: 1, predelayMs: 20, size: 0.75 },
    'Slap room': { mix: 0.3, decay: 1, damping: 0.5, predelayMs: 130, size: 0.3 },
    'Late hall': { mix: 0.25, decay: 8, damping: 0.4, predelayMs: 200, size: 0.8 },
    'Shining tail': { mix: 0.2, decay: 10, damping: 0, predelayMs: 30, size: 0.88 },
    'Dark infinite': { mix: 0.25, decay: 30, damping: 1, predelayMs: 60, size: 1 },
    Distant: { mix: 0.7, decay: 3, damping: 0.6, predelayMs: 0, size: 0.5 },
    'Soft freeze': { mix: 0.4, decay: 0.5, damping: 1, predelayMs: 0, size: 0.3, freeze: 1 },
  },
})

export const SPECTRAL_DRIFTER_DESCRIPTOR = wasmDeviceDescriptor(SPECTRAL_DRIFTER_DEVICE, {
  name: 'Bloom Spectral Drifter',
  category: 'other',
  description:
    'The pitch drifter from Bloom: replays the input as overlapping reversed grains whose pitch slides towards a fifth or an octave the longer a sound rings.',
  presets: {
    Bloom: { mix: 0.5, bloom: 0.5, direction: 0, season: 0, seed: 0, interval: 1 },
    Shimmer: { mix: 0.4, bloom: 0.8, direction: 0, season: 0, seed: 0, interval: 1, decay: 3 },
    'Winter drift': { mix: 0.5, bloom: 0.6, direction: 1, season: 3, seed: 2, interval: 3 },
    Scatter: { mix: 0.5, bloom: 0.7, direction: 2, season: 1, seed: 1, interval: 2 },
    'Octave halo': {
      mix: 0.25,
      bloom: 1,
      direction: 0,
      season: 0,
      seed: 0,
      interval: 1,
      ageMode: 1,
      age: 1,
    },
    'Sub octave': {
      mix: 0.45,
      bloom: 1,
      direction: 1,
      season: 2,
      seed: 2,
      interval: 1,
      ageMode: 1,
      age: 1,
    },
    'Fifth above': {
      mix: 0.4,
      bloom: 1,
      direction: 0,
      season: 1,
      seed: 0,
      interval: 0,
      ageMode: 1,
      age: 1,
    },
    'Organ stack': {
      mix: 0.5,
      bloom: 1,
      direction: 0,
      season: 1,
      seed: 1,
      interval: 2,
      ageMode: 1,
      age: 1,
    },
    'Octaves both ways': {
      mix: 0.5,
      bloom: 1,
      direction: 2,
      season: 1,
      seed: 2,
      interval: 1,
      ageMode: 1,
      age: 1,
    },
    'Detune cloud': {
      mix: 0.5,
      bloom: 0.03,
      direction: 2,
      season: 1,
      seed: 0,
      interval: 1,
      ageMode: 1,
      age: 1,
    },
    'Reversed smear': { mix: 0.58, bloom: 0, direction: 0, season: 1, seed: 0, interval: 1 },
    'Rising glide': { mix: 0.5, bloom: 1, direction: 0, season: 0, seed: 0, interval: 3, decay: 1 },
    'Slow climb': { mix: 0.5, bloom: 1, direction: 0, season: 0, seed: 0, interval: 1, decay: 30 },
    Splintered: {
      mix: 0.5,
      bloom: 1,
      direction: 2,
      season: 1,
      seed: 1,
      interval: 3,
      ageMode: 1,
      age: 1,
    },
  },
})

/**
 * The worklet sidechain ducker (U17) as a registry device. Its factory takes
 * the registry's `params` map and hands `processorUrl`/`createNode` through;
 * key it after creation with `device.key(node)` (the registry cannot know
 * the key source).
 */
export const WORKLET_DUCKER_DESCRIPTOR: DeviceDescriptor<typeof DUCKER_PARAMS> = {
  id: 'ducker',
  name: 'Sidechain Ducker',
  kind: 'worklet',
  category: 'dynamics',
  description:
    'Turns a signal down while a key signal is sounding and lets it back up after, to keep music out of the way of a voice.',
  version: 1,
  params: DUCKER_PARAMS,
  presets: {
    'Breathwork voice': {
      depth: DUCKER_PARAMS.depth.default,
      attackMs: DUCKER_PARAMS.attackMs.default,
      releaseMs: DUCKER_PARAMS.releaseMs.default,
    },
    Gentle: { depth: 0.4, attackMs: 120, releaseMs: 1200 },
    Hard: { depth: 0.85, attackMs: 40, releaseMs: 400 },
  },
  create: (context, options) => {
    const { params, ...rest } = options as {
      params?: Readonly<Record<string, number>>
    } & DuckerProcessorOverrides &
      Pick<WorkletDuckerOptions, 'createNode' | 'windowSize' | 'reportHz'>
    return createWorkletDucker(context, { ...rest, ...(params ?? {}) })
  },
}

/** Every stock worklet-backed device shipped in `./dsp` (WASM modules and the ducker). */
export const FELT_PIANO_DESCRIPTOR = wasmDeviceDescriptor(FELT_PIANO_DEVICE, {
  name: 'Felt Piano',
  category: 'instrument',
  description:
    'Physically modelled felt piano with no samples: hammers striking through a felt strip, the thump and noise of the action, sympathetic strings under the pedal and its own room.',
  // Over the 5 % wasm budget on the CI core (docs/devices.md); the iPhone
  // figure the plan gates on is not recorded yet.
  experimental: true,
  presets: {
    Felt: { felt: 0.65, hardness: 0.35, grit: 0.12, reverbMix: 0.25, reverbSize: 0.3 },
    Bare: { felt: 0, hardness: 0.6, thump: 0.3, grit: 0, reverbMix: 0.15, reverbSize: 0.2 },
    Intimate: {
      felt: 0.9,
      hardness: 0.25,
      thump: 0.6,
      grit: 0.3,
      reverbMix: 0.35,
      reverbSize: 0.25,
    },
    Hall: { felt: 0.5, reverbMix: 0.45, reverbSize: 0.9, width: 0.7 },
    Lean: { polyphony: 12, resonance: 0, reverbMix: 0.15 },
  },
})

export const STOCK_WASM_DEVICES: readonly DeviceDescriptor[] = [
  DATTORRO_DESCRIPTOR,
  FDN_REVERB_DESCRIPTOR,
  STEREO_WIDENER_DESCRIPTOR,
  ZITA_REV1_DESCRIPTOR,
  LIMITER_1176_DESCRIPTOR,
  WORKLET_DUCKER_DESCRIPTOR,
  SPECTRAL_DRIFTER_DESCRIPTOR,
  ETHER_REVERB_DESCRIPTOR,
  FELT_PIANO_DESCRIPTOR,
  // The spec devices (cpp/devices/*/device.json with a params array).
  ...GENERATED_WASM_DESCRIPTORS,
]

/** Stock devices that play a sound handed to them through `WasmDevice.loadSample`. */
export const SAMPLE_DEVICE_IDS: ReadonlySet<string> = new Set(
  GENERATED_WASM_DEVICES.filter((device) => device.samples).map((device) => device.id),
)

/** Register the stock WASM devices (idempotent) in `registry`, the default one unless given. */
export function registerStockWasmDevices(registry: DeviceRegistry = devices): DeviceRegistry {
  for (const descriptor of STOCK_WASM_DEVICES) {
    if (!registry.has(descriptor.id)) registry.register(descriptor)
  }
  return registry
}
