// `@kieranklaassen/live-mix` — engine core.
//
// Import-safe under SSR: nothing here reads `window` or constructs an
// `AudioContext` at module load.

export const LIVE_MIX_VERSION = '0.0.1'

export * from './core/clips'
export { type Device } from './core/devices/Device'
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
  type EngineOptions,
} from './core/Engine'
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
