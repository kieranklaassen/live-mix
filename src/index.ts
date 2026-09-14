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
  type AddDuckerOptions,
  type AddLiveInputTrackOptions,
  type AddReturnTrackOptions,
  type EngineOptions,
} from './core/Engine'
export { LiveInputTrack, type LiveInputTrackOptions } from './core/tracks/LiveInputTrack'
export { ReturnTrack, type ReturnTrackOptions } from './core/tracks/ReturnTrack'
export { SendList, type Send, type SendOptions, type SendTarget } from './core/tracks/Send'
export {
  CONVOLVER_REVERB_PARAMS,
  ConvolverReverb,
  REVERB_DECAY_SECONDS,
  REVERB_WET_LEVEL,
  createConvolverReverb,
  generateHallImpulse,
  type ConvolverReverbOptions,
} from './core/devices/native/ConvolverReverb'
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
