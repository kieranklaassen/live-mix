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
export { Engine, createEngine, type AddBusOptions, type EngineOptions } from './core/Engine'
export * from './core/transport'
