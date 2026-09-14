// Devices: the contract, the stock node devices, the registry and presets.
// `devices` is the default registry, pre-seeded with the node devices so they
// appear in every consumer's list; WASM devices join through
// `registerStockWasmDevices()` from `@kieranklaassen/live-mix/dsp`.

import { NODE_DEVICES } from './native'
import { RACK_DESCRIPTOR } from './Rack'
import { DeviceRegistry } from './registry'

export { type Device } from './Device'
export * from './native'
export {
  MACRO_CURVES,
  RackMacro,
  createMacroMapping,
  macroCurve,
  macroCurveInverse,
  macroMappedValue,
  macroPositionFor,
  taperPosition,
  taperValue,
  type MacroCurve,
  type MacroMapping,
  type MacroMappingOptions,
  type MacroMappingShape,
} from './Macro'
export {
  ALIGNMENT_DELAY_ID,
  AlignmentDelay,
  PDC_MAX_DELAY_SECONDS,
  buildLatencyReport,
  chainCompensationSamples,
  chainLatencySamples,
  deviceLatencySamples,
  isAlignmentDelay,
  secondsToSamples,
  type AlignmentDelayOptions,
  type DeviceLatency,
  type LatencyPathInput,
  type LatencyPathKind,
  type LatencyReport,
  type LatencySource,
  type PathLatency,
} from './pdc'
export {
  Chain,
  DEFAULT_MACRO_COUNT,
  MAX_MACRO_COUNT,
  RACK_DESCRIPTOR,
  RACK_ID,
  RACK_MIX_PARAM,
  RACK_PARAMS,
  RACK_PRESET_FORMAT_VERSION,
  RACK_VERSION,
  Rack,
  captureRackPreset,
  createRack,
  createRackFromPreset,
  isRackPreset,
  macroIndexOf,
  macroParamName,
  parseRackPreset,
  rackParams,
  serializeRackPreset,
  type CaptureRackPresetOptions,
  type ChainOptions,
  type CreateRackFromPresetOptions,
  type MapMacroOptions,
  type RackChainPreset,
  type RackCreateOptions,
  type RackDevicePreset,
  type RackMacroMappingPreset,
  type RackMacroPreset,
  type RackOptions,
  type RackPreset,
  type RemoveChainOptions,
  type SerializedRackPreset,
  type ZoneRange,
} from './Rack'
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

/** The default registry: every stock node device and the rack, plus whatever consumers register. */
export const devices = new DeviceRegistry([...NODE_DEVICES, RACK_DESCRIPTOR])
