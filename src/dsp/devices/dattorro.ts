// The Dattorro plate device (cpp/devices/dattorro), ambient-live's global
// reverb lifted out as a stock WASM device. Ids must match DattorroParam in
// dattorro_device.h.

import { type ParamSpec } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'

export const DATTORRO_PARAMS = {
  mix: { id: 0, name: 'Mix', min: 0, max: 1, default: 0.35, taper: 'linear', unit: '' },
  decay: { id: 1, name: 'Decay', min: 0, max: 1, default: 0.7, taper: 'linear', unit: '' },
  damping: { id: 2, name: 'Damping', min: 0, max: 1, default: 0.3, taper: 'linear', unit: '' },
  predelayMs: {
    id: 3,
    name: 'Pre-delay',
    min: 0,
    max: 250,
    default: 20,
    taper: 'linear',
    unit: 'ms',
  },
} as const satisfies Record<string, ParamSpec>

export type DattorroParamName = keyof typeof DATTORRO_PARAMS

export const DATTORRO_DEVICE = defineWasmDevice({
  id: 'dattorro',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/dattorro.wasm', import.meta.url),
  params: DATTORRO_PARAMS,
})

export type DattorroReverb = WasmDevice<typeof DATTORRO_PARAMS>

/**
 * Stereo in → mono sum → plate → `dry·(1−mix) + wet·mix`, exactly the law
 * ambient-live's engine applied. Insert it on a bus or the master.
 */
export function createDattorroReverb(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof DATTORRO_PARAMS> = {},
): Promise<DattorroReverb> {
  return WasmDevice.create(context, DATTORRO_DEVICE, options)
}
