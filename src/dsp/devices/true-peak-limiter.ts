// Lookahead true-peak brickwall limiter (cpp/devices/true-peak-limiter), the
// stage `MasterBus.installLimiter` is built for. The detector is the BS.1770-4
// four-phase FIR the LufsMeter uses, so the meter's true-peak reading of the
// limited output never exceeds the ceiling; the attack is a linear ramp over
// the 1.5 ms lookahead ending exactly when the peak arrives, the release an
// exponential recovery, and a final clip keeps every sample under the ceiling.

import { type ParamSpec } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'

// Ids match TruePeakLimiterParam in cpp/devices/true-peak-limiter/true_peak_limiter_device.h.
export const TRUE_PEAK_LIMITER_PARAMS = {
  ceilingDb: {
    id: 0,
    name: 'Ceiling',
    min: -20,
    max: 0,
    default: -1,
    taper: 'linear',
    unit: 'dBTP',
  },
  releaseMs: {
    id: 1,
    name: 'Release',
    min: 10,
    max: 2000,
    default: 100,
    taper: 'log',
    unit: 'ms',
  },
  inputGainDb: {
    id: 2,
    name: 'Input gain',
    min: -24,
    max: 24,
    default: 0,
    taper: 'linear',
    unit: 'dB',
  },
} as const satisfies Record<string, ParamSpec>

export type TruePeakLimiterParamName = keyof typeof TRUE_PEAK_LIMITER_PARAMS

/** Lookahead window (the attack ramp length). */
export const TRUE_PEAK_LIMITER_LOOKAHEAD_SECONDS = 0.0015
/**
 * Input-to-output delay: the lookahead plus five samples of interpolator
 * alignment, at 48 kHz (77 samples; 44.1 kHz gives 71, 96 kHz 149).
 */
export const TRUE_PEAK_LIMITER_LATENCY_SECONDS = (Math.round(0.0015 * 48000) + 5) / 48000

export const TRUE_PEAK_LIMITER_DEVICE = defineWasmDevice({
  id: 'true-peak-limiter',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/true-peak-limiter.wasm', import.meta.url),
  params: TRUE_PEAK_LIMITER_PARAMS,
  latencySec: TRUE_PEAK_LIMITER_LATENCY_SECONDS,
})

export type TruePeakLimiter = WasmDevice<typeof TRUE_PEAK_LIMITER_PARAMS>

/**
 * Stereo-linked brickwall: nothing above `ceilingDb` (dBTP, default −1) on the
 * BS.1770 true-peak measure and on every sample. `releaseMs` is the recovery
 * time constant, `inputGainDb` drives the detector (make-up before the wall).
 * Gains are smoothed over 5 ms inside the DSP; initial values apply exactly.
 */
export function createTruePeakLimiter(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof TRUE_PEAK_LIMITER_PARAMS> = {},
): Promise<TruePeakLimiter> {
  return WasmDevice.create(context, TRUE_PEAK_LIMITER_DEVICE, options)
}
