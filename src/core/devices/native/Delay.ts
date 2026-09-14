// Feedback delay: a DelayNode with a damped feedback loop and a dry/wet mix.
//
//   in ─┬─► dry (1−mix) ─────────────────────────┬─► out
//       └─► delay ─► wet (mix) ──────────────────┘
//             ▲                 │
//             └─ feedback ◄─ damping (lowpass) ◄─┘
//
// The mix law is the linear `dry·(1−mix) + wet·mix` the Dattorro device uses.

import { type ParamSpec } from '../../params'
import { type DeviceDescriptor } from '../registry'
import {
  NodeDevice,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  defineNodeDevice,
} from './NodeDevice'

/** `maxDelayTime` of the DelayNode; the `timeSec` param cannot exceed it. */
export const DELAY_MAX_SECONDS = 4

export const DELAY_PARAMS = {
  timeSec: {
    id: 0,
    name: 'Time',
    min: 0.001,
    max: DELAY_MAX_SECONDS,
    default: 0.35,
    taper: 'log',
    unit: 's',
  },
  feedback: {
    id: 1,
    name: 'Feedback',
    min: 0,
    max: 0.95,
    default: 0.35,
    taper: 'linear',
    unit: '',
  },
  /** Low-pass corner inside the feedback loop; repeats get darker each pass. */
  damping: {
    id: 2,
    name: 'Damping',
    min: 500,
    max: 20000,
    default: 6000,
    taper: 'log',
    unit: 'Hz',
  },
  mix: { id: 3, name: 'Mix', min: 0, max: 1, default: 0.3, taper: 'linear', unit: '' },
} as const satisfies Record<string, ParamSpec>

export type DelayParamName = keyof typeof DELAY_PARAMS

export const DELAY_DEVICE = defineNodeDevice({
  id: 'delay',
  params: DELAY_PARAMS,
  build(context): NodeDeviceGraph<typeof DELAY_PARAMS> {
    const split = context.createGain()
    const sum = context.createGain()
    const dry = context.createGain()
    const wet = context.createGain()
    const delay = context.createDelay(DELAY_MAX_SECONDS)
    const damping = context.createBiquadFilter()
    damping.type = 'lowpass'
    damping.Q.value = Math.SQRT1_2
    const feedback = context.createGain()

    split.connect(dry)
    dry.connect(sum)
    split.connect(delay)
    delay.connect(wet)
    wet.connect(sum)
    delay.connect(damping)
    damping.connect(feedback)
    feedback.connect(delay)

    return {
      input: split,
      output: sum,
      nodes: [split, sum, dry, wet, delay, damping, feedback],
      apply: {
        timeSec: (value, ramp) => ramp(delay.delayTime, value),
        feedback: (value, ramp) => ramp(feedback.gain, value),
        damping: (value, ramp) => ramp(damping.frequency, value),
        mix: (value, ramp) => {
          ramp(dry.gain, 1 - value)
          ramp(wet.gain, value)
        },
      },
    }
  },
})

export type Delay = NodeDevice<typeof DELAY_PARAMS>

/** Damped feedback delay with a linear dry/wet `mix`; up to `DELAY_MAX_SECONDS`. */
export function createDelay(
  context: BaseAudioContext,
  options: NodeDeviceOptions<typeof DELAY_PARAMS> = {},
): Delay {
  return new NodeDevice(context, DELAY_DEVICE, options)
}

export const DELAY_DESCRIPTOR: DeviceDescriptor<typeof DELAY_PARAMS> = {
  id: DELAY_DEVICE.id,
  name: 'Delay',
  kind: 'node',
  category: 'delay',
  version: 1,
  params: DELAY_PARAMS,
  presets: {
    Slapback: { timeSec: 0.09, feedback: 0.05, damping: 8000, mix: 0.25 },
    Quarter: { timeSec: 0.5, feedback: 0.4, damping: 5000, mix: 0.3 },
    'Long tail': { timeSec: 0.75, feedback: 0.65, damping: 3000, mix: 0.35 },
    Wash: { timeSec: 1.2, feedback: 0.8, damping: 2000, mix: 0.5 },
  },
  create: createDelay,
}
