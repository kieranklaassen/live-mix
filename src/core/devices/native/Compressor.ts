// DynamicsCompressorNode plus make-up gain. Parameter defaults are the node's
// own, so the default device sounds exactly like an untouched compressor node;
// the presets carry the musical settings.

import { type ParamSpec } from '../../params'
import { type DeviceMeterSpec, type MeteredDevice } from '../Device'
import { type DeviceDescriptor } from '../registry'
import {
  NodeDevice,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  defineNodeDevice,
} from './NodeDevice'
import { dbToGain } from './units'

/**
 * The reference implementation (Chromium) pre-delays the signal by 6 ms to
 * look ahead; reported so delay compensation can align the chain.
 */
export const COMPRESSOR_LOOKAHEAD_SECONDS = 0.006

export const COMPRESSOR_PARAMS = {
  threshold: {
    id: 0,
    name: 'Threshold',
    min: -100,
    max: 0,
    default: -24,
    taper: 'linear',
    unit: 'dB',
    description:
      'The level above which the compressor starts turning the sound down. Lower compresses more of the signal.',
  },
  knee: {
    id: 1,
    name: 'Knee',
    min: 0,
    max: 40,
    default: 30,
    taper: 'linear',
    unit: 'dB',
    description:
      'The range above the threshold over which compression eases in. Wide is smooth and gradual; zero switches straight to the full ratio.',
  },
  ratio: {
    id: 2,
    name: 'Ratio',
    min: 1,
    max: 20,
    default: 12,
    taper: 'log',
    unit: ':1',
    description:
      'How firmly a signal over the threshold is held back. Low is gentle levelling; high approaches limiting.',
  },
  attack: {
    id: 3,
    name: 'Attack',
    min: 0.0001,
    max: 1,
    default: 0.003,
    taper: 'log',
    unit: 's',
    description:
      'How quickly the gain comes down when the level rises. Fast clamps transients; slow lets the front of each note through.',
  },
  release: {
    id: 4,
    name: 'Release',
    min: 0.001,
    max: 1,
    default: 0.25,
    taper: 'log',
    unit: 's',
    description:
      'How quickly the gain recovers when the level falls. Fast brings quiet detail up sooner and can pump; slow is smoother.',
  },
  makeupDb: {
    id: 5,
    name: 'Make-up',
    min: 0,
    max: 24,
    default: 0,
    taper: 'linear',
    unit: 'dB',
    description:
      'Extra gain after the compressor, to bring back the level that compression took away.',
  },
} as const satisfies Record<string, ParamSpec>

export type CompressorParamName = keyof typeof COMPRESSOR_PARAMS

/** What the compressor reports about its own work: the gain it is taking off. */
export const COMPRESSOR_METERS = {
  reduction: { id: 0, name: 'Gain reduction', unit: 'dB' },
} as const satisfies Record<string, DeviceMeterSpec>

interface CompressorGraph extends NodeDeviceGraph<typeof COMPRESSOR_PARAMS> {
  compressor: DynamicsCompressorNode
}

export const COMPRESSOR_DEVICE = defineNodeDevice({
  id: 'compressor',
  params: COMPRESSOR_PARAMS,
  latencySec: COMPRESSOR_LOOKAHEAD_SECONDS,
  build(context): CompressorGraph {
    const compressor = context.createDynamicsCompressor()
    const makeup = context.createGain()
    compressor.connect(makeup)
    return {
      input: compressor,
      output: makeup,
      nodes: [compressor, makeup],
      compressor,
      apply: {
        threshold: (value, ramp) => ramp(compressor.threshold, value),
        knee: (value, ramp) => ramp(compressor.knee, value),
        ratio: (value, ramp) => ramp(compressor.ratio, value),
        attack: (value, ramp) => ramp(compressor.attack, value),
        release: (value, ramp) => ramp(compressor.release, value),
        makeupDb: (value, ramp) => ramp(makeup.gain, dbToGain(value)),
      },
    }
  },
})

export class Compressor
  extends NodeDevice<typeof COMPRESSOR_PARAMS, CompressorGraph>
  implements MeteredDevice
{
  readonly meters = COMPRESSOR_METERS

  constructor(
    context: BaseAudioContext,
    options: NodeDeviceOptions<typeof COMPRESSOR_PARAMS> = {},
  ) {
    super(context, COMPRESSOR_DEVICE, options)
  }

  /** Current gain reduction in dB (≤ 0), read from the node for meters. */
  get reductionDb(): number {
    return this.graph.compressor.reduction
  }

  /** The latest reading of a meter: `reduction` is the node's own, in dB (0 or less). */
  meter(name: string): number {
    if (name !== 'reduction') throw new Error(`live-mix: ${this.id} has no meter "${name}"`)
    return this.reductionDb
  }

  /** The node keeps its own reading fresh, so there is nothing to start or to stop. */
  watchMeters(): () => void {
    return () => {}
  }
}

/** DynamicsCompressorNode with make-up gain; `reductionDb` reads the meter. */
export function createCompressor(
  context: BaseAudioContext,
  options: NodeDeviceOptions<typeof COMPRESSOR_PARAMS> = {},
): Compressor {
  return new Compressor(context, options)
}

export const COMPRESSOR_DESCRIPTOR: DeviceDescriptor<typeof COMPRESSOR_PARAMS> = {
  id: COMPRESSOR_DEVICE.id,
  name: 'Compressor',
  kind: 'node',
  category: 'dynamics',
  description:
    'General-purpose compressor, the one built into the browser, with make-up gain: evens out the level of a voice, an instrument or a bus.',
  version: 1,
  params: COMPRESSOR_PARAMS,
  meters: COMPRESSOR_METERS,
  presets: {
    Gentle: { threshold: -18, knee: 12, ratio: 2, attack: 0.02, release: 0.3, makeupDb: 2 },
    Voice: { threshold: -20, knee: 6, ratio: 4, attack: 0.005, release: 0.15, makeupDb: 4 },
    Glue: { threshold: -12, knee: 10, ratio: 1.5, attack: 0.03, release: 0.4, makeupDb: 1 },
    Limit: { threshold: -6, knee: 0, ratio: 20, attack: 0.0005, release: 0.05, makeupDb: 0 },
  },
  create: createCompressor,
}
