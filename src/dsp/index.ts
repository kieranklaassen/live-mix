// `@kieranklaassen/live-mix/dsp` — WASM device hosting.
//
// Nothing here touches `AudioContext`, `window` or `import.meta.url` at import
// time, so the entry is safe to import under SSR; asset URLs resolve lazily
// inside the factories.

export {
  WASM_DEVICE_PROCESSOR_NAME,
  type DeviceExports,
  type DeviceHostMessage,
  type DeviceMessage,
  type WasmDeviceProcessorOptions,
} from './abi'
export { clampParam, type ParamSpec, type ParamTaper } from './params'
export { DATTORRO_PARAMS, type DattorroParamName } from './devices/dattorro'
export {
  FDN_REVERB_PARAMS,
  fdnReverbBreathLaw,
  type FdnReverbParamName,
} from './devices/fdn-reverb'
export { STEREO_WIDENER_PARAMS, type StereoWidenerParamName } from './devices/stereo-widener'
