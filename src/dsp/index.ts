// `@kieranklaassen/live-mix/dsp` — WASM device hosting.
//
// Nothing here touches `AudioContext`, `window` or `import.meta.url` at import
// time, so the entry is safe to import under SSR; asset URLs resolve lazily
// inside the factories.

export {
  BYPASS_RAMP_SECONDS,
  WASM_DEVICE_PROCESSOR_NAME,
  type DeviceExports,
  type DeviceHostMessage,
  type DeviceMessage,
  type WasmDeviceProcessorOptions,
} from './abi'
export {
  clearWasmModuleCache,
  compileWasm,
  defaultProcessorUrl,
  resolveProcessorUrl,
  type AssetOverrides,
  type WasmSource,
} from './assets'
export {
  WasmDevice,
  defineWasmDevice,
  ensureProcessor,
  type WasmDeviceDefinition,
  type WasmDeviceOptions,
  type WorkletNodeFactory,
} from './WasmDevice'
export { isNoteDevice, type Device, type NoteDevice } from '../core/devices/Device'
export { clampParam, type ParamSpec, type ParamTaper } from '../core/params'
export {
  DATTORRO_DEVICE,
  DATTORRO_PARAMS,
  createDattorroReverb,
  type DattorroParamName,
  type DattorroReverb,
} from './devices/dattorro'
export {
  FDN_REVERB_DEVICE,
  FDN_REVERB_PARAMS,
  createFdnReverb,
  fdnReverbBreathLaw,
  type FdnReverb,
  type FdnReverbParamName,
} from './devices/fdn-reverb'
export {
  STEREO_WIDENER_DEVICE,
  STEREO_WIDENER_PARAMS,
  createStereoWidener,
  type StereoWidener,
  type StereoWidenerParamName,
} from './devices/stereo-widener'
export {
  ZITA_REV1_DEVICE,
  ZITA_REV1_PARAMS,
  createZitaReverb,
  type ZitaReverb,
  type ZitaRev1ParamName,
} from './devices/zita-rev1'
export {
  LIMITER_1176_DEVICE,
  LIMITER_1176_PARAMS,
  createLimiter1176,
  type Limiter1176,
  type Limiter1176ParamName,
} from './devices/limiter-1176'
export {
  DATTORRO_DESCRIPTOR,
  ETHER_REVERB_DESCRIPTOR,
  FDN_REVERB_DESCRIPTOR,
  FELT_PIANO_DESCRIPTOR,
  LIMITER_1176_DESCRIPTOR,
  WORKLET_DUCKER_DESCRIPTOR,
  SPECTRAL_DRIFTER_DESCRIPTOR,
  STEREO_WIDENER_DESCRIPTOR,
  STOCK_WASM_DEVICES,
  ZITA_REV1_DESCRIPTOR,
  registerStockWasmDevices,
  wasmDeviceDescriptor,
  type WasmDeviceMeta,
} from './registry'
export {
  DeviceRegistry,
  devices,
  type DeviceCategory,
  type DeviceCreateOptions,
  type DeviceCreateRequest,
  type DeviceDescriptor,
  type DeviceFactory,
  type DeviceKind,
  type Preset,
  type PresetTable,
} from '../core/devices'
export {
  createWorkletDucker,
  duckerProcessorUrl,
  loadDuckerProcessor,
  type DuckerProcessorOverrides,
} from './devices/ducker'
export {
  DUCKER_PARAMS,
  DUCKER_PROCESSOR_NAME,
  type DuckerParamName,
} from '../core/devices/native/ducker-abi'
export {
  WorkletDucker,
  type DuckerNodeFactory,
  type WorkletDuckerOptions,
} from '../core/devices/native/WorkletDucker'
export {
  TRUE_PEAK_LIMITER_DEVICE,
  TRUE_PEAK_LIMITER_LATENCY_SECONDS,
  TRUE_PEAK_LIMITER_LOOKAHEAD_FRAMES,
  TRUE_PEAK_LIMITER_LOOKAHEAD_SECONDS,
  TRUE_PEAK_LIMITER_PARAMS,
  createTruePeakLimiter,
  truePeakLimiterLatencySamples,
  type TruePeakLimiter,
  type TruePeakLimiterParamName,
} from './devices/true-peak-limiter'
export {
  SPECTRAL_DRIFTER_AGE_MODES,
  SPECTRAL_DRIFTER_DEVICE,
  SPECTRAL_DRIFTER_DIRECTIONS,
  SPECTRAL_DRIFTER_INTERVALS,
  SPECTRAL_DRIFTER_PARAMS,
  SPECTRAL_DRIFTER_SEASONS,
  SPECTRAL_DRIFTER_SEEDS,
  createSpectralDrifter,
  spectralDrifterIntensity,
  type SpectralDrifter,
  type SpectralDrifterParamName,
} from './devices/spectral-drifter'
export {
  ETHER_REVERB_DEVICE,
  ETHER_REVERB_PARAMS,
  createEtherReverb,
  etherReverbLaw,
  type EtherReverb,
  type EtherReverbParamName,
} from './devices/ether-reverb'
export {
  FELT_PIANO_DEVICE,
  FELT_PIANO_KEY_RANGE,
  FELT_PIANO_PARAMS,
  createFeltPiano,
  feltPianoKeyFor,
  type FeltPiano,
  type FeltPianoParamName,
} from './devices/felt-piano'
