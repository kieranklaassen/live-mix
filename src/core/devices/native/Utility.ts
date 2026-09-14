// Channel utility: polarity, stereo width (down to mono), pan and gain.
//
//   in ─► polarity (±1) ─┬─► stereo (width) ───────┬─► sum ─► pan ─► trim ─► out
//                        └─► mono (1−width, 1 ch) ─┘
//
// The mono path is a GainNode forced to one channel (`channelCount = 1`,
// `channelCountMode = 'explicit'`), which the following node up-mixes to both
// speakers; crossfading it against the untouched path narrows the image
// click-free without a splitter/merger pair.

import { type ParamSpec } from '../../params'
import { type DeviceDescriptor } from '../registry'
import {
  NodeDevice,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  defineNodeDevice,
} from './NodeDevice'
import { dbToGain } from './units'

export const UTILITY_PARAMS = {
  /** Trim in dB; the minimum is treated as silence. */
  gainDb: { id: 0, name: 'Gain', min: -60, max: 12, default: 0, taper: 'linear', unit: 'dB' },
  pan: { id: 1, name: 'Pan', min: -1, max: 1, default: 0, taper: 'linear', unit: '' },
  /** 1 leaves the stereo image alone, 0 sums to mono. */
  width: { id: 2, name: 'Width', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
  /** Stepped: 0 normal, 1 inverted. Ramps through zero, so it is click-free. */
  polarity: { id: 3, name: 'Polarity', min: 0, max: 1, default: 0, taper: 'linear', unit: '' },
} as const satisfies Record<string, ParamSpec>

export type UtilityParamName = keyof typeof UTILITY_PARAMS

/** Linear gain for the `gainDb` param: the minimum is silence, not −60 dB. */
export function utilityGain(gainDb: number): number {
  return gainDb <= UTILITY_PARAMS.gainDb.min ? 0 : dbToGain(gainDb)
}

export const UTILITY_DEVICE = defineNodeDevice({
  id: 'utility',
  params: UTILITY_PARAMS,
  build(context): NodeDeviceGraph<typeof UTILITY_PARAMS> {
    const polarity = context.createGain()
    const stereo = context.createGain()
    const mono = context.createGain()
    mono.channelCount = 1
    mono.channelCountMode = 'explicit'
    const sum = context.createGain()
    const pan = context.createStereoPanner()
    const trim = context.createGain()

    polarity.connect(stereo)
    polarity.connect(mono)
    stereo.connect(sum)
    mono.connect(sum)
    sum.connect(pan)
    pan.connect(trim)

    return {
      input: polarity,
      output: trim,
      nodes: [polarity, stereo, mono, sum, pan, trim],
      apply: {
        gainDb: (value, ramp) => ramp(trim.gain, utilityGain(value)),
        pan: (value, ramp) => ramp(pan.pan, value),
        width: (value, ramp) => {
          ramp(stereo.gain, value)
          ramp(mono.gain, 1 - value)
        },
        polarity: (value, ramp) => ramp(polarity.gain, Math.round(value) === 1 ? -1 : 1),
      },
    }
  },
})

export type Utility = NodeDevice<typeof UTILITY_PARAMS>

/** Gain, pan, width (stereo → mono) and polarity on one insert. */
export function createUtility(
  context: BaseAudioContext,
  options: NodeDeviceOptions<typeof UTILITY_PARAMS> = {},
): Utility {
  return new NodeDevice(context, UTILITY_DEVICE, options)
}

export const UTILITY_DESCRIPTOR: DeviceDescriptor<typeof UTILITY_PARAMS> = {
  id: UTILITY_DEVICE.id,
  name: 'Utility',
  kind: 'node',
  category: 'utility',
  version: 1,
  params: UTILITY_PARAMS,
  presets: {
    Unity: {},
    Mono: { width: 0 },
    'Bass mono': { width: 0.35 },
    'Invert polarity': { polarity: 1 },
  },
  create: createUtility,
}
