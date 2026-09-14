// `@kieranklaassen/live-mix` — engine core.
//
// Import-safe under SSR: nothing here reads `window` or constructs an
// `AudioContext` at module load.

export const LIVE_MIX_VERSION = '0.0.1'

export * from './core/clips'
export { type Device } from './core/devices/Device'
export { clampParam, type ParamSpec, type ParamTaper } from './core/params'
