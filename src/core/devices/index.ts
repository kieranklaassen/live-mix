// Devices: the contract, the stock node devices, the registry and presets.
// `devices` is the default registry, pre-seeded with the node devices so they
// appear in every consumer's list; WASM devices join through
// `registerStockWasmDevices()` from `@kieranklaassen/live-mix/dsp`.

import { NODE_DEVICES } from './native'
import { DeviceRegistry } from './registry'

export { type Device } from './Device'
export * from './native'
export {
  PRESET_FORMAT_VERSION,
  applyPreset,
  capturePreset,
  defaultPreset,
  isPreset,
  listPresets,
  parsePreset,
  presetParams,
  resolvePreset,
  serializePreset,
  type ApplyPresetResult,
  type Preset,
  type PresetSource,
  type PresetTable,
  type SerializedPreset,
} from './presets'
export {
  DeviceRegistry,
  validateDescriptor,
  type DeviceCategory,
  type DeviceCreateOptions,
  type DeviceCreateRequest,
  type DeviceDescriptor,
  type DeviceFactory,
  type DeviceFilter,
  type DeviceKind,
  type DeviceRegistryEvent,
  type DeviceRegistryListener,
  type RegisterOptions,
} from './registry'

/** The default registry: every stock node device, plus whatever consumers register. */
export const devices = new DeviceRegistry(NODE_DEVICES)
