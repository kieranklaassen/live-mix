// `@kieranklaassen/live-mix` — engine core.
//
// Import-safe under SSR: nothing here reads `window` or constructs an
// `AudioContext` at module load.

export const LIVE_MIX_VERSION = '0.0.1'

export * from './core/clips'
export * from './core/automation'
export { isNoteDevice, type Device, type NoteDevice } from './core/devices/Device'
export { clampParam, type ParamSpec, type ParamTaper } from './core/params'
export { createClock, type Clock, type ClockOptions, type IntervalId } from './core/clock'
export {
  OutputRouter,
  isIOSWebKit,
  type OutputMode,
  type OutputRouterOptions,
} from './core/output/OutputRouter'
export { Bus, LEVEL_RAMP_SECONDS, type BusOptions } from './core/buses/Bus'
export { MasterBus, type MasterBusOptions } from './core/buses/MasterBus'
export { Meter, type MeterOptions } from './core/analysis/Meter'
export {
  Engine,
  createEngine,
  type AddAudioTrackOptions,
  type AddBusOptions,
  type AddDuckerOptions,
  type AddInstrumentTrackOptions,
  type AddLiveInputTrackOptions,
  type AddReturnTrackOptions,
  type EngineOptions,
} from './core/Engine'
export { LiveInputTrack, type LiveInputTrackOptions } from './core/tracks/LiveInputTrack'
export { InstrumentTrack, type InstrumentTrackOptions } from './core/tracks/InstrumentTrack'
export { ReturnTrack, type ReturnTrackOptions } from './core/tracks/ReturnTrack'
export { SendList, type Send, type SendOptions, type SendTarget } from './core/tracks/Send'
export {
  DUCK_DEPTH,
  DUCK_KEY_FFT_SIZE,
  DUCK_TIME_CONSTANT,
  Ducker,
  ENV_ATTACK_MS,
  ENV_GAIN_SCALE,
  ENV_POLL_MS,
  ENV_RELEASE_MS,
  createDucker,
  type DuckerOptions,
} from './core/devices/native/Ducker'
export {
  SampleStore,
  type LoadedSample,
  type SampleSource,
  type SampleStoreOptions,
} from './core/tracks/SampleStore'
export { ClipList } from './core/tracks/ClipList'
export {
  AudioTrack,
  CROSSFADE_SECONDS,
  DEFAULT_LOOKAHEAD_SECONDS,
  MAX_CLIP_GAIN_DB,
  STEER_CROSSFADE_SECONDS,
  STOP_FADE_SECONDS,
  trimGain,
  type AudioTrackOptions,
  type ClipVoice,
  type ClipVoiceOptions,
} from './core/tracks/AudioTrack'
export * from './core/transport'
export {
  // Node devices
  COMPRESSOR_DESCRIPTOR,
  COMPRESSOR_DEVICE,
  COMPRESSOR_LOOKAHEAD_SECONDS,
  COMPRESSOR_PARAMS,
  Compressor,
  DELAY_DESCRIPTOR,
  DELAY_DEVICE,
  DELAY_MAX_SECONDS,
  DELAY_PARAMS,
  EQ3_DESCRIPTOR,
  EQ3_DEVICE,
  EQ3_PARAMS,
  FILTER_DESCRIPTOR,
  FILTER_DEVICE,
  FILTER_PARAMS,
  FILTER_TYPES,
  NODE_DEVICES,
  NODE_DEVICE_RAMP_SECONDS,
  NodeDevice,
  PARAMETRIC_EQ_BANDS,
  PARAMETRIC_EQ_DESCRIPTOR,
  PARAMETRIC_EQ_DEVICE,
  PARAMETRIC_EQ_PARAMS,
  UTILITY_DESCRIPTOR,
  UTILITY_DEVICE,
  UTILITY_PARAMS,
  createCompressor,
  createDelay,
  createEq3,
  createFilter,
  createParametricEq,
  createUtility,
  dbToGain,
  defineNodeDevice,
  filterTypeAt,
  filterTypeIndex,
  gainToDb,
  utilityGain,
  type CompressorParamName,
  type Delay,
  type DelayParamName,
  type Eq3,
  type Eq3ParamName,
  type Filter,
  type FilterParamName,
  type FilterType,
  type NodeDeviceDefinition,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  type ParamApplier,
  type ParamRamp,
  type ParametricEq,
  type ParametricEqParamName,
  type Utility,
  type UtilityParamName,
  // Registry and presets
  DeviceRegistry,
  PRESET_FORMAT_VERSION,
  applyPreset,
  capturePreset,
  defaultPreset,
  devices,
  isPreset,
  listPresets,
  parsePreset,
  presetParams,
  resolvePreset,
  serializePreset,
  validateDescriptor,
  type ApplyPresetResult,
  type DeviceCategory,
  type DeviceCreateOptions,
  type DeviceCreateRequest,
  type DeviceDescriptor,
  type DeviceFactory,
  type DeviceFilter,
  type DeviceKind,
  type DeviceRegistryEvent,
  type DeviceRegistryListener,
  type Preset,
  type PresetSource,
  type PresetTable,
  type RegisterOptions,
  type SerializedPreset,
} from './core/devices'
