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
  type WasmDeviceDefinition,
  type WasmDeviceOptions,
  type WorkletNodeFactory,
} from './WasmDevice'
export { type Device } from '../core/devices/Device'
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
