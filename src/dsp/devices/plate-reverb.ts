// The plate reverb device (cpp/devices/plate-reverb), ambient-live's global
// reverb lifted out as a stock WASM device. Ids must match PlateReverbParam in
// plate_reverb_device.h.

import { type ParamSpec } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'

export const PLATE_REVERB_PARAMS = {
  mix: {
    id: 0,
    name: 'Mix',
    min: 0,
    max: 1,
    default: 0.35,
    taper: 'linear',
    unit: '',
    description: 'Balance between the dry signal and the plate. Fully up is the plate alone.',
  },
  decay: {
    id: 1,
    name: 'Decay',
    min: 0,
    max: 1,
    default: 0.7,
    taper: 'linear',
    unit: '',
    description:
      'How much of the sound goes round the plate again on each pass. Low dies quickly; near the top the tail rings for a long time.',
  },
  damping: {
    id: 2,
    name: 'Damping',
    min: 0,
    max: 1,
    default: 0.3,
    taper: 'linear',
    unit: '',
    description:
      'How quickly the highs die out of the tail. Low keeps the plate bright; high makes it dark and soft.',
  },
  predelayMs: {
    id: 3,
    name: 'Pre-delay',
    min: 0,
    max: 250,
    default: 20,
    taper: 'linear',
    unit: 'ms',
    description:
      'The gap before the plate answers, which keeps the start of the sound clear of its tail.',
  },
} as const satisfies Record<string, ParamSpec>

export type PlateReverbParamName = keyof typeof PLATE_REVERB_PARAMS

export const PLATE_REVERB_DEVICE = defineWasmDevice({
  id: 'plate-reverb',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/plate-reverb.wasm', import.meta.url),
  params: PLATE_REVERB_PARAMS,
})

export type PlateReverb = WasmDevice<typeof PLATE_REVERB_PARAMS>

/**
 * Stereo in → mono sum → plate → `dry·(1−mix) + wet·mix`, exactly the law
 * ambient-live's engine applied. Insert it on a bus or the master.
 */
export function createPlateReverb(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof PLATE_REVERB_PARAMS> = {},
): Promise<PlateReverb> {
  return WasmDevice.create(context, PLATE_REVERB_DEVICE, options)
}
