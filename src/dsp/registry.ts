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
import { DATTORRO_DEVICE } from './devices/dattorro'
import { FDN_REVERB_DEVICE } from './devices/fdn-reverb'
import { LIMITER_1176_DEVICE } from './devices/limiter-1176'
import { STEREO_WIDENER_DEVICE } from './devices/stereo-widener'
import { ZITA_REV1_DEVICE } from './devices/zita-rev1'
import { WasmDevice, type WasmDeviceDefinition, type WasmDeviceOptions } from './WasmDevice'

export interface WasmDeviceMeta<P extends Record<string, ParamSpec>> {
  name: string
  category: DeviceCategory
  version?: number
  presets?: PresetTable<P>
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

/** Every stock WASM device shipped in `./dsp`. */
export const STOCK_WASM_DEVICES: readonly DeviceDescriptor[] = [
  DATTORRO_DESCRIPTOR,
  FDN_REVERB_DESCRIPTOR,
  STEREO_WIDENER_DESCRIPTOR,
  ZITA_REV1_DESCRIPTOR,
  LIMITER_1176_DESCRIPTOR,
]

/** Register the stock WASM devices (idempotent) in `registry`, the default one unless given. */
export function registerStockWasmDevices(registry: DeviceRegistry = devices): DeviceRegistry {
  for (const descriptor of STOCK_WASM_DEVICES) {
    if (!registry.has(descriptor.id)) registry.register(descriptor)
  }
  return registry
}
