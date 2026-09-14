/**
 * `@kieranklaassen/live-mix/wam` — WebAudioModules 2.0 host adapter.
 *
 * Separate entry on purpose: it imports `@webaudiomodules/sdk` (an optional
 * peer), which nothing in `.` or `./dsp` may depend on. Import-safe under SSR
 * like the other entries — only the SDK's host bootstrap is imported, never
 * its `WamNode extends AudioWorkletNode`.
 *
 * @module live-mix/wam
 */

export {
  ensureWamHost,
  hasWamHost,
  initializeWamHost,
  type WamHost,
  type WamHostInitializer,
  type WamHostOptions,
} from './host'
export {
  isMappableWamParam,
  snapWamValue,
  wamParamSpec,
  wamParamSpecs,
  wamParamStep,
  wamTaper,
  type WamParamSpec,
} from './params'
export {
  WAM_DEVICE_RAMP_SECONDS,
  WamDevice,
  isWamModuleConstructor,
  loadWamModule,
  midiNoteFromFrequency,
  wamDeviceId,
  type WamDeviceOptions,
  type WamModuleConstructor,
  type WamModuleImporter,
  type WamModuleLike,
  type WamNodeLike,
  type WamSource,
} from './WamDevice'
export {
  WAM_AUTOMATION_STEP_SECONDS,
  wamDeviceParam,
  type WamDeviceParamOptions,
} from './automation'
export {
  describeWamDevice,
  registerWamDevice,
  wamDeviceDescriptor,
  type WamDescriptorSpec,
  type WamDeviceDescriptor,
  type WamDeviceMeta,
  type WamProbeOptions,
} from './registry'
export { isNoteDevice, type Device, type NoteDevice } from '../core/devices/Device'
export { clampParam, type ParamSpec, type ParamTaper } from '../core/params'
export type {
  WamDescriptor,
  WamEvent,
  WamParameterInfo,
  WamParameterInfoMap,
  WamParameterType,
} from '@webaudiomodules/api'
