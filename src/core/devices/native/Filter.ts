// A single BiquadFilterNode behind the Device contract: any of the eight
// biquad responses, with frequency, Q and (for shelves and peaking) gain.
//
// `q` is one plain number for every shape: 0.707 is a cut with no peak at its
// corner, 1 stands level with the passband there, 2 is 6 dB over it. The node
// reads a low-pass's and a high-pass's Q in decibels and every other type's as
// the number, so the device writes `20·log10(q)` while the type is a cut and
// writes it again when the type turns between a cut and another shape.

import { type ParamSpec } from '../../params'
import { type DeviceDescriptor } from '../registry'
import {
  NodeDevice,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  type ParamRamp,
  defineNodeDevice,
} from './NodeDevice'
import { cutQDb } from './units'

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

/** The responses in words, in the order of `FILTER_TYPES`: what the Type control prints. */
export const FILTER_TYPE_NAMES = [
  'Low pass',
  'High pass',
  'Band pass',
  'Low shelf',
  'High shelf',
  'Peak',
  'Notch',
  'All pass',
] as const

/** Index of a biquad response on the `type` param scale. */
export function filterTypeIndex(type: FilterType): number {
  return FILTER_TYPES.indexOf(type)
}

/** Biquad response for a (rounded, clamped) `type` param value. */
export function filterTypeAt(index: number): FilterType {
  const clamped = Math.min(FILTER_TYPES.length - 1, Math.max(0, Math.round(index)))
  return FILTER_TYPES[clamped]
}

/** Whether a response is a low-pass or a high-pass: the two whose Q the node reads in decibels. */
export function isCutFilter(type: FilterType): boolean {
  return type === 'lowpass' || type === 'highpass'
}

export const FILTER_PARAMS = {
  /** Stepped: 0 lowpass, 1 highpass, 2 bandpass, 3 lowshelf, 4 highshelf, 5 peaking, 6 notch, 7 allpass. Switches instantly. */
  type: {
    id: 0,
    name: 'Type',
    min: 0,
    max: 7,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: FILTER_TYPE_NAMES,
    description:
      'The shape of the filter. Low-pass, high-pass, band-pass and notch remove a range; the shelves and peak boost or cut one; all-pass shifts phase only.',
  },
  frequency: {
    id: 1,
    name: 'Frequency',
    min: 20,
    max: 20000,
    default: 1000,
    taper: 'log',
    unit: 'Hz',
    description:
      'The cutoff or centre of the filter: where a low-pass or high-pass starts to cut, or where a band, peak, notch or shelf sits.',
  },
  q: {
    id: 2,
    name: 'Q',
    min: 0.1,
    max: 20,
    default: Math.SQRT1_2,
    taper: 'log',
    unit: '',
    description:
      'Resonance at the cutoff for low-pass and high-pass, where 0.71 is flat; how narrow the band is for band-pass, peak, notch and all-pass. The shelves ignore it.',
  },
  /** Only shelves and peaking use it. */
  gain: {
    id: 3,
    name: 'Gain',
    min: -24,
    max: 24,
    default: 0,
    taper: 'linear',
    unit: 'dB',
    description: 'How much a shelf or peak boosts or cuts. The other filter types ignore it.',
  },
} as const satisfies Record<string, ParamSpec>

export type FilterParamName = keyof typeof FILTER_PARAMS

export const FILTER_DEVICE = defineNodeDevice({
  id: 'filter',
  params: FILTER_PARAMS,
  build(context): NodeDeviceGraph<typeof FILTER_PARAMS> {
    const filter = context.createBiquadFilter()
    // What the two controls last said: the node's Q is written from both.
    let kind: FilterType = filter.type
    let q: number = FILTER_PARAMS.q.default
    const writeQ = (ramp: ParamRamp, rampSec?: number): void => {
      if (isCutFilter(kind)) ramp(filter.Q, cutQDb(q), rampSec, 'decibels')
      else ramp(filter.Q, q, rampSec)
    }
    return {
      input: filter,
      output: filter,
      nodes: [filter],
      apply: {
        type: (value, ramp) => {
          const next = filterTypeAt(value)
          const turned = isCutFilter(next) !== isCutFilter(kind)
          kind = next
          filter.type = next
          // The type turns at once, so what the node's Q means does too.
          if (turned) writeQ(ramp, 0)
        },
        frequency: (value, ramp) => ramp(filter.frequency, value),
        q: (value, ramp) => {
          q = value
          writeQ(ramp)
        },
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
  description:
    'A single filter with eight shapes, from low-pass and high-pass to shelves, peak, notch and all-pass, for cutting or shaping one part of the spectrum.',
  // 2: Q is one number for every shape. Under 1 a low-pass and a high-pass read it as decibels.
  version: 2,
  params: FILTER_PARAMS,
  presets: {
    'Low-pass gentle': { type: filterTypeIndex('lowpass'), frequency: 4000, q: 0.5 },
    'High-pass rumble': { type: filterTypeIndex('highpass'), frequency: 80, q: Math.SQRT1_2 },
    'Band-pass telephone': { type: filterTypeIndex('bandpass'), frequency: 1500, q: 2 },
    'Presence peak': { type: filterTypeIndex('peaking'), frequency: 3000, q: 1, gain: 4 },
  },
  create: createFilter,
}
