// DynamicsCompressorNode plus make-up gain. Parameter defaults are the node's
// own, so the default device sounds exactly like an untouched compressor node;
// the presets carry the musical settings.

import { type ParamSpec } from '../../params'
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
  },
  knee: { id: 1, name: 'Knee', min: 0, max: 40, default: 30, taper: 'linear', unit: 'dB' },
  ratio: { id: 2, name: 'Ratio', min: 1, max: 20, default: 12, taper: 'log', unit: ':1' },
  attack: { id: 3, name: 'Attack', min: 0.0001, max: 1, default: 0.003, taper: 'log', unit: 's' },
  release: { id: 4, name: 'Release', min: 0.001, max: 1, default: 0.25, taper: 'log', unit: 's' },
  makeupDb: { id: 5, name: 'Make-up', min: 0, max: 24, default: 0, taper: 'linear', unit: 'dB' },
} as const satisfies Record<string, ParamSpec>

export type CompressorParamName = keyof typeof COMPRESSOR_PARAMS

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

export class Compressor extends NodeDevice<typeof COMPRESSOR_PARAMS, CompressorGraph> {
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
  version: 1,
  params: COMPRESSOR_PARAMS,
  presets: {
    Gentle: { threshold: -18, knee: 12, ratio: 2, attack: 0.02, release: 0.3, makeupDb: 2 },
    Voice: { threshold: -20, knee: 6, ratio: 4, attack: 0.005, release: 0.15, makeupDb: 4 },
    Glue: { threshold: -12, knee: 10, ratio: 1.5, attack: 0.03, release: 0.4, makeupDb: 1 },
    Limit: { threshold: -6, knee: 0, ratio: 20, attack: 0.0005, release: 0.05, makeupDb: 0 },
  },
  create: createCompressor,
}
