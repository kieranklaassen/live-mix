// A single BiquadFilterNode behind the Device contract: any of the eight
// biquad responses, with frequency, Q and (for shelves and peaking) gain.

import { type ParamSpec } from '../../params'
import { type DeviceDescriptor } from '../registry'
import {
  NodeDevice,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  defineNodeDevice,
} from './NodeDevice'

/** Biquad responses by `type` index; the order is the param's 0..7 scale. */
export const FILTER_TYPES = [
  'lowpass',
  'highpass',
  'bandpass',
  'lowshelf',
  'highshelf',
  'peaking',
  'notch',
  'allpass',
] as const satisfies readonly BiquadFilterType[]

export type FilterType = (typeof FILTER_TYPES)[number]

/** Index of a biquad response on the `type` param scale. */
export function filterTypeIndex(type: FilterType): number {
  return FILTER_TYPES.indexOf(type)
}

/** Biquad response for a (rounded, clamped) `type` param value. */
export function filterTypeAt(index: number): FilterType {
  const clamped = Math.min(FILTER_TYPES.length - 1, Math.max(0, Math.round(index)))
  return FILTER_TYPES[clamped]
}

export const FILTER_PARAMS = {
  /** Stepped: 0 lowpass, 1 highpass, 2 bandpass, 3 lowshelf, 4 highshelf, 5 peaking, 6 notch, 7 allpass. Switches instantly. */
  type: { id: 0, name: 'Type', min: 0, max: 7, default: 0, taper: 'linear', unit: '' },
  frequency: {
    id: 1,
    name: 'Frequency',
    min: 20,
    max: 20000,
    default: 1000,
    taper: 'log',
    unit: 'Hz',
  },
  q: { id: 2, name: 'Q', min: 0.1, max: 20, default: Math.SQRT1_2, taper: 'log', unit: '' },
  /** Only shelves and peaking use it. */
  gain: { id: 3, name: 'Gain', min: -24, max: 24, default: 0, taper: 'linear', unit: 'dB' },
} as const satisfies Record<string, ParamSpec>

export type FilterParamName = keyof typeof FILTER_PARAMS

export const FILTER_DEVICE = defineNodeDevice({
  id: 'filter',
  params: FILTER_PARAMS,
  build(context): NodeDeviceGraph<typeof FILTER_PARAMS> {
    const filter = context.createBiquadFilter()
    return {
      input: filter,
      output: filter,
      nodes: [filter],
      apply: {
        type: (value) => {
          filter.type = filterTypeAt(value)
        },
        frequency: (value, ramp) => ramp(filter.frequency, value),
        q: (value, ramp) => ramp(filter.Q, value),
        gain: (value, ramp) => ramp(filter.gain, value),
      },
    }
  },
})

export type Filter = NodeDevice<typeof FILTER_PARAMS>

/** One biquad: `type` picks the response, `frequency`/`q`/`gain` shape it. */
export function createFilter(
  context: BaseAudioContext,
  options: NodeDeviceOptions<typeof FILTER_PARAMS> = {},
): Filter {
  return new NodeDevice(context, FILTER_DEVICE, options)
}

export const FILTER_DESCRIPTOR: DeviceDescriptor<typeof FILTER_PARAMS> = {
  id: FILTER_DEVICE.id,
  name: 'Filter',
  kind: 'node',
  category: 'eq',
  version: 1,
  params: FILTER_PARAMS,
  presets: {
    'Low-pass gentle': { type: filterTypeIndex('lowpass'), frequency: 4000, q: 0.5 },
    'High-pass rumble': { type: filterTypeIndex('highpass'), frequency: 80, q: Math.SQRT1_2 },
    'Band-pass telephone': { type: filterTypeIndex('bandpass'), frequency: 1500, q: 2 },
    'Presence peak': { type: filterTypeIndex('peaking'), frequency: 3000, q: 1, gain: 4 },
  },
  create: createFilter,
}
