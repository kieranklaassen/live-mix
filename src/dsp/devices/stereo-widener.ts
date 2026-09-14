// Parameter table for the StereoWidener device (cpp/devices/stereo-widener):
// kkfonie's S1-style widener, source copied unchanged from Felt/Bloom/
// Sympathetic/Thesis. Ids must match StereoWidenerParam in
// stereo_widener_device.h.
//
// Width law (bass below 200 Hz is kept narrower throughout):
//   0.00-0.50  mono -> normal stereo (side gain 0 -> 1)
//   0.50-0.75  M/S side boost (side gain 1 -> 1.75)
//   0.75-1.00  side gain -> 2.5, allpass decorrelation blends in from 0.75,
//              a 0.8 ms Haas delay on the right channel from 0.85
// The device ramps width changes over 5 ms.

import { type ParamSpec } from '../params'

export const STEREO_WIDENER_PARAMS = {
  width: { id: 0, name: 'Width', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
} as const satisfies Record<string, ParamSpec>

export type StereoWidenerParamName = keyof typeof STEREO_WIDENER_PARAMS
