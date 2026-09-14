// The live-mix WASM device ABI as seen from TypeScript. Mirrors
// cpp/common/device_api.h: every device module exports exactly these symbols,
// and the worklet host (worklets/wasm-device.processor.ts) is device-agnostic.
//
// Keep this file free of runtime imports: the processor imports it type-only
// so the bundled worklet stays self-contained.

/** The flat C ABI exported by every `*.wasm` device module. */
export interface DeviceExports {
  memory: WebAssembly.Memory
  /** Emscripten static-constructor hook; present when the module needs it. */
  _initialize?: () => void
  device_init: (sampleRate: number, maxBlockFrames: number) => void
  device_set_param: (paramId: number, value: number) => void
  device_in_left: () => number
  device_in_right: () => number
  device_out_left: () => number
  device_out_right: () => number
  device_max_block_frames: () => number
  device_process: (frames: number) => void
}

/** Main thread → worklet messages. */
export type DeviceMessage = { type: 'set-param'; paramId: number; value: number }

/** Worklet → main thread messages. */
export type DeviceHostMessage = { type: 'ready'; maxBlockFrames: number }

/** `processorOptions` the host passes to `new AudioWorkletNode(...)`. */
export interface WasmDeviceProcessorOptions {
  /** Compiled once per page; a Module transfers across threads, an Instance does not. */
  module: WebAssembly.Module
  /** Initial parameter values applied right after `device_init`. */
  params?: readonly (readonly [paramId: number, value: number])[]
}

/** Registered processor name; shared by the host and the worklet file. */
export const WASM_DEVICE_PROCESSOR_NAME = 'live-mix-wasm-device'
