// 1176-style limiter (cpp/faust/limiter-1176.dsp): Faust's
// `co.limiter_1176_R4_stereo`, compiled to C++ at library build time and
// hosted behind the device ABI like every other stock device. The param table
// is generated from the .dsp by scripts/build-faust.sh.

import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'
import { LIMITER_1176_PARAMS, type Limiter1176ParamName } from './faust/limiter-1176'

export { LIMITER_1176_PARAMS, type Limiter1176ParamName }

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
 * Both gains are smoothed over 5 ms inside the DSP.
 */
export function createLimiter1176(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof LIMITER_1176_PARAMS> = {},
): Promise<Limiter1176> {
  return WasmDevice.create(context, LIMITER_1176_DEVICE, options)
}
