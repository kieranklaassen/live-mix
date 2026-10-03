// The FET limiter (cpp/faust/fet-limiter.dsp): Faust's
// `co.limiter_1176_R4_stereo`, compiled to C++ at library build time and
// hosted behind the device ABI like every other stock device. The param table
// is generated from the .dsp by scripts/build-faust.sh; what each knob does is
// said here, because a .dsp cannot carry it.

import { describeParams } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'
import {
  FET_LIMITER_PARAMS as GENERATED_PARAMS,
  type FetLimiterParamName,
} from './faust/fet-limiter'

/** The generated table, with what each knob does said for the info view. */
export const FET_LIMITER_PARAMS = describeParams(GENERATED_PARAMS, {
  inputGain:
    'Drives the signal into the fixed threshold, like the input knob on the hardware. More gain means more compression and a denser sound.',
  outputGain:
    'Level after the limiter, to make up for or trim what the limiting did. Above zero the output can pass full scale.',
})
export { type FetLimiterParamName }

export const FET_LIMITER_DEVICE = defineWasmDevice({
  id: 'fet-limiter',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/fet-limiter.wasm', import.meta.url),
  params: FET_LIMITER_PARAMS,
})

export type FetLimiter = WasmDevice<typeof FET_LIMITER_PARAMS>

/**
 * Faust's fixed "R4" law: 4:1 above −6 dB on `|L|+|R|`, 0.8 ms attack, 0.5 s
 * release. `inputGain` drives that threshold like the hardware's INPUT knob
 * (a full-scale sine comes out 9 dB down at 0 dB); `outputGain` is make-up.
 * After the compressor sits a ceiling, a wire up to half scale and a tanh
 * knee from there to full scale: what the attack lets through stops at
 * 0 dBFS, so with `outputGain` at 0 nothing leaves above it. Both gains are
 * smoothed over 5 ms inside the DSP.
 */
export function createFetLimiter(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof FET_LIMITER_PARAMS> = {},
): Promise<FetLimiter> {
  return WasmDevice.create(context, FET_LIMITER_DEVICE, options)
}
