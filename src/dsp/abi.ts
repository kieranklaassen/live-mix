// The live-mix WASM device ABI as seen from TypeScript. Mirrors
// cpp/common/device_api.h: every device module exports exactly these symbols,
// and the worklet host (worklets/wasm-device.processor.ts) is device-agnostic.
//
// Keep this file free of runtime imports: the processor imports it type-only
// so the bundled worklet stays self-contained.

import { type ParamModulation, type ParamTravel } from '../core/automation/param-modulation'
import { type LoadSlot } from '../core/load-mark'

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
  /** Instruments only: note events (see `NoteDevice`). */
  device_note_on?: (noteId: number, frequency: number, gain: number) => void
  device_note_off?: (noteId: number) => void
  /** Sample devices only: frames per channel that fit (see `WasmDevice.loadSample`). */
  device_sample_capacity?: () => number
  /** Where the host writes the sound: channel 0, then channel 1 `capacity` frames later. */
  device_sample_buffer?: () => number
  device_sample_commit?: (frames: number, channels: number, sampleRate: number) => void
  /**
   * Zone devices only (a multi-sample instrument): how many zones and how many
   * floats of sample data fit, and the calls that hand it sounds and zones
   * (see `WasmDevice.loadZones` and cpp/common/device_api.h).
   */
  device_zone_capacity?: () => number
  device_zone_pool_capacity?: () => number
  device_zones_begin?: () => void
  /** Room for one sound: its index, or -1 when it does not fit. */
  device_zone_sample?: (frames: number, channels: number, sampleRate: number) => number
  /** Where the host writes that sound: channel 0, then channel 1 `frames` later. */
  device_zone_sample_buffer?: (index: number) => number
  /** Where the host writes one zone's fields before `device_zone_add`. */
  device_zone_fields?: () => number
  device_zone_add?: () => number
  /** Devices with meters only: the reading at `index` of the manifest's `meters`, as it is now. */
  device_meter?: (index: number) => number
}

/** Main thread → worklet messages. */
export type DeviceMessage =
  | { type: 'set-param'; paramId: number; value: number }
  | { type: 'bypass'; enabled: boolean }
  | { type: 'note-on'; noteId: number; frequency: number; gain: number }
  | { type: 'note-off'; noteId: number }
  | { type: 'sample'; channels: Float32Array[]; sampleRate: number }
  /** A zone device forgets its instrument; the sounds and zones of the new one follow. */
  | { type: 'zones-begin' }
  /** One sound of the new instrument; they are numbered in the order they arrive. */
  | { type: 'zone-sample'; channels: Float32Array[]; sampleRate: number }
  /** Its zones, `ZONE_FIELD_COUNT` floats each, once every sound has been sent. */
  | { type: 'zones'; fields: Float32Array }
  /** Report the first `count` meters every `intervalFrames` frames; a count of 0 stops. */
  | { type: 'meters'; count: number; intervalFrames: number }
  /**
   * Move a parameter on the audio thread: from here on its value is worked
   * out at every block from the block's own time (`modulatedParamValue`),
   * around `base`, which a later `set-param` moves. A `modulation` of null
   * ends it and leaves the parameter at `base`.
   */
  | {
      type: 'modulate'
      paramId: number
      travel: ParamTravel
      base: number
      modulation: ParamModulation | null
    }
  /** The device is gone: stop processing, so the node can be let go and takes no more time. */
  | { type: 'dispose' }

/** Worklet → main thread messages. */
export type DeviceHostMessage =
  | { type: 'ready'; deviceId: string; maxBlockFrames: number }
  /** The meters' readings, in the manifest's order. */
  | { type: 'meters'; values: number[] }

/** `processorOptions` the host passes to `new AudioWorkletNode(...)`. */
/** One parameter the worklet moves: its travel, the value it is set to, and what moves it. */
export interface ParamModulationEntry {
  paramId: number
  travel: ParamTravel
  base: number
  modulation: ParamModulation
}

export interface WasmDeviceProcessorOptions {
  /** Compiled once per page; a Module transfers across threads, an Instance does not. */
  module: WebAssembly.Module
  /** Device type id, echoed in the `ready` message (diagnostics only). */
  deviceId?: string
  /** Initial parameter values applied right after `device_init`. */
  params?: readonly (readonly [paramId: number, value: number])[]
  /** The parameters moved on the audio thread from the first block on: `modulate` messages that need not arrive. */
  modulations?: readonly ParamModulationEntry[]
  /** The mark the processor shows while it works, where the engine's load is measured (core/load.ts). */
  load?: LoadSlot
}

/** Registered processor name; shared by the host and the worklet file. */
export const WASM_DEVICE_PROCESSOR_NAME = 'live-mix-wasm-device'

/** Bypass crossfade length: long enough to be click-free, short enough to feel instant. */
export const BYPASS_RAMP_SECONDS = 0.005

/** How often a watched device reports its meters: enough for a meter that reads as moving. */
export const DEVICE_METER_HZ = 30
