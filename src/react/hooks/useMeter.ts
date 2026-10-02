// Meter readings sampled on frames: the analyser `Meter` (peak/RMS of the
// current window) and, when installed, the `LufsMeter`'s latest BS.1770
// reading. Both are pulled at the frame rate rather than pushed per message,
// so a 20 Hz meter and a 60 Hz display never fight.

import { useCallback, useEffect } from 'react'

import { type MeterReading } from '../../core/analysis/loudness'
import { LufsMeter } from '../../core/analysis/LufsMeter'
import { Meter } from '../../core/analysis/Meter'
import { type MasterBus } from '../../core/buses/MasterBus'
import { type Device, isMeteredDevice } from '../../core/devices/Device'
import { gainToDb } from '../../core/devices/native/units'
import { frameIntervalMs, useFrameSampled } from '../frame'
import { useEnginePart, useFrameScheduler } from './useEngine'

/** What `useMeter` reads: a bus with a meter (the master), or a meter itself. */
export type MeterSource = MasterBus | Meter | LufsMeter

export interface UseMeterOptions {
  /** Refresh rate (default 30). */
  fps?: number
  /** Stop sampling (the last reading stays) — e.g. while the panel is hidden. Default true. */
  active?: boolean
}

export interface MeterSnapshot {
  /** Peak of the analyser window, 0..1; the LUFS meter's sample peak when there is no analyser. */
  peak: number
  /** RMS of the analyser window, 0..1 (0 without an analyser). */
  rms: number
  /** `peak` in dBFS (−Infinity when silent). */
  peakDb: number
  /** Latest loudness reading, or null until a `LufsMeter` is installed. */
  lufs: MeterReading | null
  /** Short-term loudness, LUFS (−Infinity without a LUFS meter or when silent). */
  lufsShortTerm: number
  /** True peak in dBTP (−Infinity without a LUFS meter). */
  truePeakDb: number
  hasMeter: boolean
  hasLufs: boolean
}

interface MeterPair {
  meter: Meter | null
  lufs: LufsMeter | null
}

function resolve(source: MeterSource): MeterPair {
  if (source instanceof Meter) return { meter: source, lufs: null }
  if (source instanceof LufsMeter) return { meter: null, lufs: source }
  return { meter: source.meter, lufs: source.lufs }
}

const SILENT: MeterSnapshot = {
  peak: 0,
  rms: 0,
  peakDb: -Infinity,
  lufs: null,
  lufsShortTerm: -Infinity,
  truePeakDb: -Infinity,
  hasMeter: false,
  hasLufs: false,
}

export function readMeter(source: MeterSource): MeterSnapshot {
  const { meter, lufs } = resolve(source)
  if (!meter && !lufs) return SILENT
  const peak = meter ? meter.peak() : lufs ? lufs.peak : 0
  return {
    peak,
    rms: meter ? meter.rms() : 0,
    peakDb: gainToDb(peak),
    lufs: lufs ? lufs.reading : null,
    lufsShortTerm: lufs ? lufs.lufsShortTerm : -Infinity,
    truePeakDb: lufs ? lufs.truePeakDb : -Infinity,
    hasMeter: meter !== null,
    hasLufs: lufs !== null,
  }
}

/**
 * Frame-sampled meter readings. Defaults to the provided engine's master
 * (its analyser meter when created with `master: { meter: true }`, plus the
 * LUFS meter once `installLufsMeter` resolves — picked up on the next frame).
 */
export function useMeter(source?: MeterSource, options: UseMeterOptions = {}): MeterSnapshot {
  const target = useEnginePart(source, (engine) => engine.master, 'useMeter')
  const frame = useFrameScheduler()
  const sample = useCallback(() => readMeter(target), [target])
  return useFrameSampled(options.active ?? true, frameIntervalMs(options.fps), sample, frame)
}

/**
 * One of a device's own readings (a compressor's gain reduction), sampled on
 * frames. The device is watched while the hook is mounted and `active`, so it
 * reports nothing for a view nobody is looking at. 0 for a device without
 * that meter, and until the first reading arrives.
 */
export function useDeviceMeter(
  device: Device | null | undefined,
  name: string,
  options: UseMeterOptions = {},
): number {
  const frame = useFrameScheduler()
  const active = options.active ?? true
  const metered = device && isMeteredDevice(device) && name in device.meters ? device : null
  useEffect(() => {
    if (!metered || !active) return
    return metered.watchMeters()
  }, [metered, active])
  const sample = useCallback(() => (metered ? metered.meter(name) : 0), [metered, name])
  return useFrameSampled(active && metered !== null, frameIntervalMs(options.fps), sample, frame)
}
