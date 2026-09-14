// Parameter table for the Ether reverb device (cpp/devices/ether-reverb):
// kkfonie's Ether plugin, whose core is juce::dsp::Reverb (Freeverb) behind a
// pre-delay with a decay -> roomSize/damping law and a freeze. Ids must match
// EtherReverbParam in ether_reverb_device.h; the first five are the same ids
// as FDN_REVERB_PARAMS so presets keep their shape across the two reverbs.

import { type ParamSpec } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'

export const ETHER_REVERB_PARAMS = {
  mix: { id: 0, name: 'Mix', min: 0, max: 1, default: 0.3, taper: 'linear', unit: '' },
  decay: { id: 1, name: 'Decay', min: 0.5, max: 30, default: 5, taper: 'log', unit: 's' },
  damping: { id: 2, name: 'Damping', min: 0, max: 1, default: 0.4, taper: 'linear', unit: '' },
  predelayMs: {
    id: 3,
    name: 'Pre-delay',
    min: 0,
    max: 200,
    default: 0,
    taper: 'linear',
    unit: 'ms',
  },
  size: { id: 4, name: 'Size', min: 0, max: 1, default: 0.6, taper: 'linear', unit: '' },
  freeze: { id: 5, name: 'Freeze', min: 0, max: 1, default: 0, taper: 'linear', unit: '' },
} as const satisfies Record<string, ParamSpec>

export type EtherReverbParamName = keyof typeof ETHER_REVERB_PARAMS

/**
 * Ether's mapping from its knobs to Freeverb (PluginProcessor.cpp:141-149):
 * `decayFactor = (decay - 0.5) / 29.5`, `roomSize = min(1, size + 0.3 *
 * decayFactor)`, `damping = max(0, damping - 0.2 * decayFactor)`; frozen is
 * roomSize 0.999 and damping 0. Freeverb's comb feedback is then
 * `roomSize * 0.28 + 0.7`. Identical to `EtherReverbDevice::reverb_parameters_for`.
 */
export function etherReverbLaw(
  decay: number,
  size: number,
  damping: number,
  freeze: boolean,
): { roomSize: number; damping: number; feedback: number } {
  const decayFactor = (decay - 0.5) / 29.5
  const roomSize = freeze ? 0.999 : Math.min(1, size + decayFactor * 0.3)
  const damp = freeze ? 0 : Math.max(0, damping - decayFactor * 0.2)
  return { roomSize, damping: damp, feedback: freeze ? 1 : roomSize * 0.28 + 0.7 }
}

export const ETHER_REVERB_DEVICE = defineWasmDevice({
  id: 'ether-reverb',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/ether-reverb.wasm', import.meta.url),
  params: ETHER_REVERB_PARAMS,
})

export type EtherReverb = WasmDevice<typeof ETHER_REVERB_PARAMS>

/**
 * kkfonie's Ether as a stereo insert: Freeverb (eight combs, four allpasses
 * per channel, as juce::Reverb runs it) fed through `predelayMs`, with `decay`
 * and `size` setting the room and `damping` the high-frequency loss. `freeze`
 * (>= 0.5) makes the combs lossless and mutes the input and the dry signal so
 * the tail hangs until released. Linear dry/wet `mix`.
 */
export function createEtherReverb(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof ETHER_REVERB_PARAMS> = {},
): Promise<EtherReverb> {
  return WasmDevice.create(context, ETHER_REVERB_DEVICE, options)
}
