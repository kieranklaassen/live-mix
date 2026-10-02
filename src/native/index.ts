/**
 * `@kieranklaassen/live-mix/native` — VST3 and Audio Unit plug-ins as devices.
 *
 * A browser cannot load a native plug-in, so this entry talks to the plug-in
 * host (`native/host`, a JUCE program a desktop shell starts next to the
 * page): `NativeHostClient` is the control connection, `NativeDevice` puts a
 * loaded plug-in behind the `Device` contract, and the registry helpers list
 * scanned plug-ins next to the built-in devices. The page must be
 * cross-origin isolated (the audio bridge uses shared memory). U39 of the
 * plan; docs/native.md is the guide.
 *
 * @module live-mix/native
 */

export {
  NativeHostClient,
  findNativeHost,
  type ControlSocket,
  type NativeHostClientOptions,
} from './HostClient'
export {
  DEFAULT_PANEL_PARAM_COUNT,
  NativeDevice,
  defaultNativeProcessorUrl,
  defaultNativePumpUrl,
  midiNoteFromFrequency,
  nativeDeviceId,
  type NativeDeviceOptions,
  type NativeDeviceStatus,
  type NativeParamEdit,
  type NativeNodeFactory,
  type PumpWorker,
} from './NativeDevice'
export {
  fromNormalised,
  isExposedNativeParam,
  nativeParamKey,
  nativeParamSpec,
  nativeParamSpecs,
  tidyParamText,
  toNormalised,
  type NativeParamSpec,
} from './params'
export {
  isNativeDeviceDescriptor,
  nativeDeviceCategory,
  nativeDeviceDescription,
  nativeDeviceDescriptor,
  registerNativeDevices,
  scanNativeDevices,
  type NativeDescriptorDefaults,
  type NativeDeviceDescriptor,
} from './registry'
export {
  DEFAULT_EDIT_GESTURE_GAP_MS,
  DEFAULT_STATE_DELAY_MS,
  DEFAULT_STATE_POLL_MS,
  captureNativeState,
  followNativeEdits,
  type FollowNativeEditsOptions,
} from './follow'
export {
  MissingNativeDevice,
  NATIVE_DEVICE_PREFIX,
  isMissingNativeDescriptor,
  isMissingNativeDevice,
  isNativeDeviceId,
  missingNativeDescriptor,
  nativePluginName,
  registerMissingNativeDevices,
  type MissingNativeDescriptor,
} from './missing'
export {
  OfflineBridgeClock,
  isOfflineContext,
  offlineBridgeClock,
  type OfflineBridgeMember,
  type OfflineContextLike,
} from './offline'
export {
  BRIDGE_LATENCY_MARGIN_FRAMES,
  BRIDGE_MAX_BLOCK_FRAMES,
  BRIDGE_RING_FRAMES,
  DEFAULT_BRIDGE_LATENCY_FRAMES,
  MAX_BRIDGE_LATENCY_FRAMES,
  MIN_BRIDGE_LATENCY_FRAMES,
  NATIVE_BRIDGE_PROCESSOR_NAME,
  bridgeLatencyFor,
  clampBridgeLatency,
  type BridgeMemory,
  type PumpStats,
} from './bridge-protocol'
export {
  NATIVE_PROTOCOL_VERSION,
  type NativeHostAddress,
  type NativeHostEvent,
  type NativeHostEvents,
  type NativeHostInfo,
  type NativeLoadOptions,
  type NativeParamChange,
  type NativeParamInfo,
  type NativePluginInfo,
  type NativeScanOptions,
  type NativeScanProgress,
  type NativeScanResult,
  type NativeSlotInfo,
} from './protocol'
export {
  isEditorDevice,
  isNoteDevice,
  isParamTextDevice,
  type Device,
  type EditorDevice,
  type NoteDevice,
  type ParamTextDevice,
} from '../core/devices/Device'
export { clampParam, type ParamSpec, type ParamTaper } from '../core/params'
