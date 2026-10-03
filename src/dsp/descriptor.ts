// `wasmDeviceDescriptor` turns a WASM device definition into a registry
// descriptor. It lives apart from registry.ts so the generated device modules
// (devices/*.gen.ts) can build their own descriptors without importing the list
// that imports them.

import { type DeviceCategory, type DeviceDescriptor, type PresetTable } from '../core/devices'
import { type ParamSpec } from '../core/params'
import { WasmDevice, type WasmDeviceDefinition, type WasmDeviceOptions } from './WasmDevice'

export interface WasmDeviceMeta<P extends Record<string, ParamSpec>> {
  name: string
  category: DeviceCategory
  /** One sentence for a device browser. */
  description?: string
  version?: number
  presets?: PresetTable<P>
  /** Names presets had before they were renamed: old name → the name of today. */
  formerPresets?: Readonly<Record<string, string>>
  /** Presets that were retuned, as they were before: still loaded by name, shown in no list. */
  retiredPresets?: PresetTable<P>
  /** Over the CPU budget (docs/devices.md) or otherwise not cleared for production. */
  experimental?: boolean
}

/**
 * A registry descriptor that still knows its module: what the offline patch
 * renderer needs to run the device without an audio context.
 */
export interface WasmDeviceDescriptor<
  P extends Record<string, ParamSpec> = Record<string, ParamSpec>,
> extends DeviceDescriptor<P> {
  kind: 'wasm'
  definition: WasmDeviceDefinition<P>
}

export function isWasmDescriptor(descriptor: DeviceDescriptor): descriptor is WasmDeviceDescriptor {
  return descriptor.kind === 'wasm' && 'definition' in descriptor
}

/**
 * Describe a WASM device for the registry. `registry.create(id, ctx, options)`
 * hands `processorUrl`, `wasm` and `createNode` through to `WasmDevice.create`.
 */
export function wasmDeviceDescriptor<P extends Record<string, ParamSpec>>(
  definition: WasmDeviceDefinition<P>,
  meta: WasmDeviceMeta<P>,
): WasmDeviceDescriptor<P> {
  return {
    id: definition.id,
    definition,
    name: meta.name,
    kind: 'wasm',
    category: meta.category,
    ...(meta.description ? { description: meta.description } : {}),
    version: meta.version ?? 1,
    params: definition.params,
    ...(definition.meters ? { meters: definition.meters } : {}),
    presets: meta.presets,
    ...(meta.formerPresets ? { formerPresets: meta.formerPresets } : {}),
    ...(meta.retiredPresets ? { retiredPresets: meta.retiredPresets } : {}),
    ...(meta.experimental ? { experimental: true } : {}),
    create: (context, options) =>
      WasmDevice.create(context, definition, options as WasmDeviceOptions<P>),
  }
}
