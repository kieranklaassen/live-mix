// `@kieranklaassen/live-mix/react` — headless React bindings (U24, R32).
//
// Hooks over the engine's change events through `useSyncExternalStore`, plus
// frame-sampled readings (playhead, meters) at a bounded rate. No components
// and no styles: those are the kit in U25. `react` is an optional peer
// dependency and this entry is the only one that imports it.
//
// Import-safe under SSR: nothing here reads `window`, `document` or
// `requestAnimationFrame` at module load, and every hook renders on the server
// from the same snapshot it uses on the client.

export {
  LiveMixContext,
  LiveMixProvider,
  useEngine,
  useEnginePart,
  useFrameScheduler,
  useMaybeEngine,
  type LiveMixContextValue,
  type LiveMixProviderProps,
} from './hooks/useEngine'
export {
  DEFAULT_REFRESH_FPS,
  defaultFrameScheduler,
  frameIntervalMs,
  useFrameSampled,
  type FrameScheduler,
} from './frame'
export { neverSubscribe, shallowEqual, useExternalSnapshot, type Subscribe } from './store'
export {
  useTransport,
  type TransportControls,
  type TransportSnapshot,
  type UseTransportOptions,
  type UseTransportResult,
} from './hooks/useTransport'
export {
  findStripHost,
  useGroup,
  useStrip,
  useTrack,
  type GroupControls,
  type StripControls,
  type StripSnapshot,
  type UseGroupResult,
  type UseStripResult,
  type UseTrackResult,
} from './hooks/useTrack'
export {
  readMeter,
  useMeter,
  type MeterSnapshot,
  type MeterSource,
  type UseMeterOptions,
} from './hooks/useMeter'
export {
  denormalizeParam,
  normalizeParam,
  useDevice,
  useDeviceParam,
  type DeviceControls,
  type DeviceSnapshot,
  type UseDeviceOptions,
  type UseDeviceParamResult,
  type UseDeviceResult,
} from './hooks/useParam'
export {
  useLane,
  useModulation,
  type LaneControls,
  type ModulationControls,
  type UseLaneResult,
  type UseModulationResult,
} from './hooks/useLane'
export {
  useSampleStore,
  type SampleStoreControls,
  type UseSampleStoreResult,
} from './hooks/useSampleStore'
export {
  useEngineStats,
  type EngineStatsControls,
  type UseEngineStatsResult,
} from './hooks/useEngineStats'
export {
  useClips,
  useSchedule,
  type ClipControls,
  type ClipSource,
  type ScheduleSnapshot,
  type ScheduledClipView,
  type UseClipsResult,
  type UseScheduleOptions,
  type UseScheduleResult,
} from './hooks/useClips'
export {
  useSession,
  useSlot,
  type SessionCell,
  type SessionControls,
  type SessionSnapshot,
  type SlotControls,
  type UseSessionResult,
  type UseSlotResult,
} from './hooks/useSession'
