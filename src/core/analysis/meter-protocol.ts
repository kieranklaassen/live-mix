// Messages between the LufsMeter host (core/analysis/LufsMeter.ts) and the
// meter worklet (dsp/worklets/meter.processor.ts). Runtime-import-free apart
// from the reading type, so the bundled worklet stays self-contained.

import { type MeterReading } from './loudness'

/** Registered processor name; shared by the host and the worklet file. */
export const METER_PROCESSOR_NAME = 'live-mix-meter'

/** Default posting cadence (20 Hz). */
export const DEFAULT_METER_INTERVAL_MS = 50
/** Readings are never posted faster than 30 Hz. */
export const MIN_METER_INTERVAL_MS = 1000 / 30
/** Nor slower than once a second. */
export const MAX_METER_INTERVAL_MS = 1000

export function clampMeterInterval(intervalMs: number): number {
  if (!Number.isFinite(intervalMs)) return DEFAULT_METER_INTERVAL_MS
  return Math.min(MAX_METER_INTERVAL_MS, Math.max(MIN_METER_INTERVAL_MS, intervalMs))
}

/** `processorOptions` the host passes to `new AudioWorkletNode(...)`. */
export interface MeterProcessorOptions {
  intervalMs?: number
}

/** Main thread → worklet. */
export type MeterMessage =
  { type: 'reset' } | { type: 'set-interval'; intervalMs: number } | { type: 'dispose' }

/** Worklet → main thread. */
export type MeterHostMessage = { type: 'reading'; reading: MeterReading }
