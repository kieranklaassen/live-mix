// 1176-style limiter (cpp/faust/limiter-1176.dsp): Faust's
// `co.limiter_1176_R4_stereo`, compiled to C++ at library build time and
// hosted behind the device ABI like every other stock device. The param table
// is generated from the .dsp by scripts/build-faust.sh; what each knob does is
// said here, because a .dsp cannot carry it.

import { describeParams } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'
import {
  LIMITER_1176_PARAMS as GENERATED_PARAMS,
  type Limiter1176ParamName,
} from './faust/limiter-1176'

/** The generated table, with what each knob does said for the info view. */
export const LIMITER_1176_PARAMS = describeParams(GENERATED_PARAMS, {
  inputGain:
    'Drives the signal into the fixed threshold, like the input knob on the hardware. More gain means more compression and a denser sound.',
  outputGain:
    'Level after the limiter, to make up for or trim what the limiting did. Above zero the output can pass full scale.',
})
export { type Limiter1176ParamName }

export const LIMITER_1176_DEVICE = defineWasmDevice({
  id: 'limiter-1176',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/limiter-1176.wasm', import.meta.url),
  params: LIMITER_1176_PARAMS,
})

export type Limiter1176 = WasmDevice<typeof LIMITER_1176_PARAMS>

/**
 * Fixed 1176 "R4" law: 4:1 above −6 dB on `|L|+|R|`, 0.8 ms attack, 0.5 s
 * release. `inputGain` drives that threshold like the hardware's INPUT knob
 * (a full-scale sine comes out 9 dB down at 0 dB); `outputGain` is make-up.
 * After the compressor sits a ceiling, a wire up to half scale and a tanh
 * knee from there to full scale: what the attack lets through stops at
 * 0 dBFS, so with `outputGain` at 0 nothing leaves above it. Both gains are
 * smoothed over 5 ms inside the DSP.
 */
export function createLimiter1176(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof LIMITER_1176_PARAMS> = {},
): Promise<Limiter1176> {
  return WasmDevice.create(context, LIMITER_1176_DEVICE, options)
}
