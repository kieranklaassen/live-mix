// Zita-Rev1 (cpp/faust/zita-rev1.dsp): Fons Adriaensen's 8×8 FDN reverb via
// Faust's `re.zita_rev1_stereo`, compiled to C++ at library build time and
// hosted behind the device ABI like every other stock device. The param table
// is generated from the .dsp by scripts/build-faust.sh; what each knob does is
// said here, because a .dsp cannot carry it.

import { describeParams } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'
import { ZITA_REV1_PARAMS as GENERATED_PARAMS, type ZitaRev1ParamName } from './faust/zita-rev1'

/** The generated table, with what each knob does said for the info view. */
export const ZITA_REV1_PARAMS = describeParams(GENERATED_PARAMS, {
  preDelay: 'The gap before the reverb starts, which keeps the start of a sound clear of its tail.',
  crossover:
    'The frequency that splits the tail into lows and mids. Low decay sets the time below it and Mid decay the time above.',
  lowDecay:
    'How long the tail rings below the Crossover. Longer than Mid decay gives a heavier, warmer tail; shorter keeps the low end clear.',
  midDecay: 'How long the tail rings in the midrange: the main length of the reverb.',
  damping:
    'The frequency at which the tail dies twice as fast as in the mids. Lower gives a darker tail; higher keeps it bright.',
  mix: 'Balance between the dry signal and the reverb. The output is levelled, so it stays as loud as the input wherever the knob stands.',
})
export { type ZitaRev1ParamName }

export const ZITA_REV1_DEVICE = defineWasmDevice({
  id: 'zita-rev1',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/zita-rev1.wasm', import.meta.url),
  params: ZITA_REV1_PARAMS,
})

export type ZitaReverb = WasmDevice<typeof ZITA_REV1_PARAMS>

/**
 * Stereo in → stereo FDN reverb → `dry·(1−mix) + wet·mix`, the Dattorro
 * device's balance, then levelled: the sum is divided by
 * `√((1−mix)² + 0.2·mix²)`, what the dry signal and a reverb 7 dB under it
 * add up to, so the output stays as loud as the input wherever `mix` stands
 * (fully wet is 7 dB of make-up; at 0 the gain is exactly 1).
 * `lowDecay`/`midDecay` are T60s below and above `crossover`; `damping` is
 * the frequency where the mid T60 has halved. Parameter moves are smoothed
 * over 5 ms inside the DSP.
 */
export function createZitaReverb(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof ZITA_REV1_PARAMS> = {},
): Promise<ZitaReverb> {
  return WasmDevice.create(context, ZITA_REV1_DEVICE, options)
}
