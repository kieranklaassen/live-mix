// Parameter table for the Dattorro plate device (cpp/devices/dattorro).
// Ids must match DattorroParam in dattorro_device.h.

import { type ParamSpec } from '../params'

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
