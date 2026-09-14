// Registry descriptors for the stock WASM devices. Nothing registers on
// import (the package is side-effect free); consumers call
// `registerStockWasmDevices()` once, or register the descriptors they want.
// `wasmDeviceDescriptor` is what U22/U37 devices use to join the registry.

import {
  type DeviceCategory,
  type DeviceDescriptor,
  type DeviceRegistry,
  type PresetTable,
  devices,
} from '../core/devices'
import { type ParamSpec } from '../core/params'
import { DUCKER_PARAMS } from '../core/devices/native/ducker-abi'
import { type WorkletDuckerOptions } from '../core/devices/native/WorkletDucker'
import { DATTORRO_DEVICE } from './devices/dattorro'
import { ETHER_REVERB_DEVICE } from './devices/ether-reverb'
import { FELT_PIANO_DEVICE } from './devices/felt-piano'
import { createWorkletDucker, type DuckerProcessorOverrides } from './devices/ducker'
import { FDN_REVERB_DEVICE } from './devices/fdn-reverb'
import { LIMITER_1176_DEVICE } from './devices/limiter-1176'
import { SPECTRAL_DRIFTER_DEVICE } from './devices/spectral-drifter'
import { STEREO_WIDENER_DEVICE } from './devices/stereo-widener'
import { ZITA_REV1_DEVICE } from './devices/zita-rev1'
import { WasmDevice, type WasmDeviceDefinition, type WasmDeviceOptions } from './WasmDevice'

export interface WasmDeviceMeta<P extends Record<string, ParamSpec>> {
  name: string
  category: DeviceCategory
  version?: number
  presets?: PresetTable<P>
  /** Over the CPU budget (docs/devices.md) or otherwise not cleared for production. */
  experimental?: boolean
}

/**
 * Describe a WASM device for the registry. `registry.create(id, ctx, options)`
 * hands `processorUrl`, `wasm` and `createNode` through to `WasmDevice.create`.
 */
export function wasmDeviceDescriptor<P extends Record<string, ParamSpec>>(
  definition: WasmDeviceDefinition<P>,
  meta: WasmDeviceMeta<P>,
): DeviceDescriptor<P> {
  return {
    id: definition.id,
    name: meta.name,
    kind: 'wasm',
    category: meta.category,
    version: meta.version ?? 1,
    params: definition.params,
    presets: meta.presets,
    ...(meta.experimental ? { experimental: true } : {}),
    create: (context, options) =>
      WasmDevice.create(context, definition, options as WasmDeviceOptions<P>),
  }
}

export const DATTORRO_DESCRIPTOR = wasmDeviceDescriptor(DATTORRO_DEVICE, {
  name: 'Dattorro Plate',
  category: 'reverb',
  presets: {
    'ambient-live': { mix: 0.35, decay: 0.7, damping: 0.3, predelayMs: 20 },
    'Small plate': { mix: 0.25, decay: 0.45, damping: 0.5, predelayMs: 10 },
    'Long plate': { mix: 0.4, decay: 0.9, damping: 0.2, predelayMs: 40 },
  },
})

export const FDN_REVERB_DESCRIPTOR = wasmDeviceDescriptor(FDN_REVERB_DEVICE, {
  name: 'Tides FDN Reverb',
  category: 'reverb',
  presets: {
    Room: { mix: 0.3, decay: 1.2, damping: 0.5, size: 0.7, breathDepth: 0 },
    Hall: { mix: 0.4, decay: 4, damping: 0.4, size: 1.2, breathDepth: 0.2 },
    Breathing: { mix: 0.5, decay: 8, damping: 0.35, size: 1.4, breathRate: 0.2, breathDepth: 0.6 },
  },
})

export const STEREO_WIDENER_DESCRIPTOR = wasmDeviceDescriptor(STEREO_WIDENER_DEVICE, {
  name: 'Stereo Widener',
  category: 'spatial',
  presets: {
    Mono: { width: 0 },
    Normal: { width: 0.5 },
    Wide: { width: 0.8 },
    'Ultra wide': { width: 1 },
  },
})

export const ZITA_REV1_DESCRIPTOR = wasmDeviceDescriptor(ZITA_REV1_DEVICE, {
  name: 'Zita Reverb',
  category: 'reverb',
  presets: {
    Room: { preDelay: 30, lowDecay: 1.5, midDecay: 1.2, damping: 5000, mix: 0.25 },
    Hall: { preDelay: 60, crossover: 200, lowDecay: 3, midDecay: 2.5, damping: 6000, mix: 0.35 },
    Cathedral: { preDelay: 80, lowDecay: 7, midDecay: 6, damping: 3500, mix: 0.45 },
  },
})

export const LIMITER_1176_DESCRIPTOR = wasmDeviceDescriptor(LIMITER_1176_DEVICE, {
  name: '1176 Limiter',
  category: 'dynamics',
  presets: {
    Safety: { inputGain: 0, outputGain: 0 },
    Drive: { inputGain: 12, outputGain: -6 },
    Squash: { inputGain: 24, outputGain: -12 },
  },
})

export const ETHER_REVERB_DESCRIPTOR = wasmDeviceDescriptor(ETHER_REVERB_DEVICE, {
  name: 'Ether Reverb',
  category: 'reverb',
  presets: {
    Ether: { mix: 0.3, decay: 5, damping: 0.4, predelayMs: 0, size: 0.6 },
    Room: { mix: 0.25, decay: 1, damping: 0.6, predelayMs: 10, size: 0.3 },
    Cathedral: { mix: 0.4, decay: 20, damping: 0.2, predelayMs: 40, size: 0.9 },
    Frozen: { mix: 0.5, decay: 30, damping: 0, predelayMs: 0, size: 1, freeze: 1 },
  },
})

export const SPECTRAL_DRIFTER_DESCRIPTOR = wasmDeviceDescriptor(SPECTRAL_DRIFTER_DEVICE, {
  name: 'Bloom Spectral Drifter',
  category: 'other',
  presets: {
    Bloom: { mix: 0.5, bloom: 0.5, direction: 0, season: 0, seed: 0, interval: 1 },
    Shimmer: { mix: 0.4, bloom: 0.8, direction: 0, season: 0, seed: 0, interval: 1, decay: 3 },
    'Winter drift': { mix: 0.5, bloom: 0.6, direction: 1, season: 3, seed: 2, interval: 3 },
    Scatter: { mix: 0.5, bloom: 0.7, direction: 2, season: 1, seed: 1, interval: 2 },
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
]

/** Register the stock WASM devices (idempotent) in `registry`, the default one unless given. */
export function registerStockWasmDevices(registry: DeviceRegistry = devices): DeviceRegistry {
  for (const descriptor of STOCK_WASM_DEVICES) {
    if (!registry.has(descriptor.id)) registry.register(descriptor)
  }
  return registry
}
