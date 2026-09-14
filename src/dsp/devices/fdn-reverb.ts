// Parameter table for the FDN reverb device (cpp/devices/fdn-reverb), the
// 8-line Feedback Delay Network extracted from kkfonie's Tides plugin.
// Ids must match FdnReverbParam in fdn_reverb_device.h.

import { type ParamSpec } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'

export const FDN_REVERB_PARAMS = {
  mix: { id: 0, name: 'Mix', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
  decay: { id: 1, name: 'Decay', min: 0.1, max: 20, default: 5, taper: 'log', unit: 's' },
  damping: { id: 2, name: 'Damping', min: 0, max: 1, default: 0.4, taper: 'linear', unit: '' },
  predelayMs: {
    id: 3,
    name: 'Pre-delay',
    min: 0,
    max: 250,
    default: 0,
    taper: 'linear',
    unit: 'ms',
  },
  size: { id: 4, name: 'Size', min: 0.5, max: 2, default: 1, taper: 'linear', unit: '' },
  breathRate: {
    id: 5,
    name: 'Breath rate',
    min: 0.05,
    max: 2,
    default: 0.3,
    taper: 'log',
    unit: 'Hz',
  },
  breathDepth: {
    id: 6,
    name: 'Breath depth',
    min: 0,
    max: 1,
    default: 0.4,
    taper: 'linear',
    unit: '',
  },
} as const satisfies Record<string, ParamSpec>

export type FdnReverbParamName = keyof typeof FDN_REVERB_PARAMS

/**
 * Tides' breathing law, `1 - depth * (1 - breathMod)` with
 * `breathMod = sin(2π·phase) * 0.5 + 0.5`. Identical to `FdnReverb::breath_law`
 * in C++; UI that animates the breath must use this so visual equals audio.
 */
export function fdnReverbBreathLaw(phase: number, depth: number): number {
  const breathMod = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5
  return 1 - depth * (1 - breathMod)
}

export const FDN_REVERB_DEVICE = defineWasmDevice({
  id: 'fdn-reverb',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/fdn-reverb.wasm', import.meta.url),
  params: FDN_REVERB_PARAMS,
})

export type FdnReverb = WasmDevice<typeof FDN_REVERB_PARAMS>

/**
 * Tides' breathing 8-line FDN reverb as a stereo insert: equal-power dry/wet
 * mix, RT60 `decay`, `damping`, `predelayMs`, `size`, and the breathing gate
 * (`breathRate`, `breathDepth`) whose law is `fdnReverbBreathLaw`.
 */
export function createFdnReverb(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof FDN_REVERB_PARAMS> = {},
): Promise<FdnReverb> {
  return WasmDevice.create(context, FDN_REVERB_DEVICE, options)
}
