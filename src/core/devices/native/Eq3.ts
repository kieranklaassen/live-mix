// Three-band tone control: low shelf → peaking mid → high shelf, in series.

import { type ParamSpec } from '../../params'
import { type DeviceDescriptor } from '../registry'
import {
  NodeDevice,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  defineNodeDevice,
} from './NodeDevice'

const gainSpec = (id: number, name: string, description: string): ParamSpec => ({
  id,
  name,
  min: -15,
  max: 15,
  default: 0,
  taper: 'linear',
  unit: 'dB',
  description,
})

export const EQ3_PARAMS = {
  lowGain: gainSpec(
    0,
    'Low',
    'Boosts or cuts everything below Low freq with a shelf. Up adds weight; down thins the sound.',
  ),
  lowFreq: {
    id: 1,
    name: 'Low freq',
    min: 40,
    max: 1000,
    default: 200,
    taper: 'log',
    unit: 'Hz',
    description:
      'Where the low shelf begins. Higher reaches up into the low mids; lower keeps it to the deep bass.',
  },
  midGain: gainSpec(
    2,
    'Mid',
    'Boosts or cuts a band around Mid freq. Up brings that range forward; down scoops it out.',
  ),
  midFreq: {
    id: 3,
    name: 'Mid freq',
    min: 200,
    max: 8000,
    default: 1000,
    taper: 'log',
    unit: 'Hz',
    description: 'The centre of the mid band: the range that Mid boosts or cuts.',
  },
  midQ: {
    id: 4,
    name: 'Mid Q',
    min: 0.3,
    max: 5,
    default: 1,
    taper: 'log',
    unit: '',
    description:
      'How narrow the mid band is. Low is a broad, gentle curve; high is a tight peak or notch around Mid freq.',
  },
  highGain: gainSpec(
    5,
    'High',
    'Boosts or cuts everything above High freq with a shelf. Up adds brightness and air; down darkens the sound.',
  ),
  highFreq: {
    id: 6,
    name: 'High freq',
    min: 1000,
    max: 16000,
    default: 5000,
    taper: 'log',
    unit: 'Hz',
    description:
      'Where the high shelf begins. Lower reaches down into the upper mids; higher keeps it to the very top.',
  },
} as const satisfies Record<string, ParamSpec>

export type Eq3ParamName = keyof typeof EQ3_PARAMS

export const EQ3_DEVICE = defineNodeDevice({
  id: 'eq3',
  params: EQ3_PARAMS,
  build(context): NodeDeviceGraph<typeof EQ3_PARAMS> {
    const low = context.createBiquadFilter()
    low.type = 'lowshelf'
    const mid = context.createBiquadFilter()
    mid.type = 'peaking'
    const high = context.createBiquadFilter()
    high.type = 'highshelf'
    low.connect(mid)
    mid.connect(high)
    return {
      input: low,
      output: high,
      nodes: [low, mid, high],
      apply: {
        lowGain: (value, ramp) => ramp(low.gain, value),
        lowFreq: (value, ramp) => ramp(low.frequency, value),
        midGain: (value, ramp) => ramp(mid.gain, value),
        midFreq: (value, ramp) => ramp(mid.frequency, value),
        midQ: (value, ramp) => ramp(mid.Q, value),
        highGain: (value, ramp) => ramp(high.gain, value),
        highFreq: (value, ramp) => ramp(high.frequency, value),
      },
    }
  },
})

export type Eq3 = NodeDevice<typeof EQ3_PARAMS>

/** Low shelf, peaking mid and high shelf in series; ±15 dB per band. */
export function createEq3(
  context: BaseAudioContext,
  options: NodeDeviceOptions<typeof EQ3_PARAMS> = {},
): Eq3 {
  return new NodeDevice(context, EQ3_DEVICE, options)
}

export const EQ3_DESCRIPTOR: DeviceDescriptor<typeof EQ3_PARAMS> = {
  id: EQ3_DEVICE.id,
  name: 'EQ Three',
  kind: 'node',
  category: 'eq',
  description:
    'Three-band tone control: a low shelf, a sweepable mid bell and a high shelf, for quick broad shaping of a channel.',
  version: 1,
  params: EQ3_PARAMS,
  presets: {
    Warm: { lowGain: 3, lowFreq: 150, highGain: -2, highFreq: 8000 },
    Air: { highGain: 4, highFreq: 10000 },
    'Voice clarity': { lowGain: -3, lowFreq: 120, midGain: 2.5, midFreq: 2500, midQ: 1.2 },
    'Under voice': { midGain: -4, midFreq: 2000, midQ: 0.8, highGain: -3, highFreq: 6000 },
  },
  create: createEq3,
}
