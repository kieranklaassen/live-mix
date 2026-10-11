// DynamicsCompressorNode held to what its knobs say. The node adds a gain of
// its own behind its curve (what the curve takes off full scale, to the power
// 0.6: 3.66 dB at the node's defaults), on a sound under the threshold as on
// one over it. The device takes that off again, so a sound under the threshold
// leaves as loud as it came, one over it comes down by the ratio, and Make-up
// is the only gain there is: 0 means none. The presets carry the make-up the
// node was adding under them.

import { type ParamSpec } from '../../params'
import { type DeviceMeterSpec, type MeteredDevice } from '../Device'
import { type DeviceDescriptor } from '../registry'
import {
  NodeDevice,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  defineNodeDevice,
} from './NodeDevice'
import { dbToGain, gainToDb } from './units'

/**
 * The reference implementation (Chromium) pre-delays the signal by 6 ms to
 * look ahead; reported so delay compensation can align the chain.
 */
export const COMPRESSOR_LOOKAHEAD_SECONDS = 0.006

/**
 * The look-ahead in samples: the node rounds its 6 ms down to whole samples
 * (264 at 44.1 kHz, where 6 ms is 264.6; 288 at 48 kHz).
 */
export function compressorLookaheadSamples(sampleRate: number): number {
  return Math.floor(COMPRESSOR_LOOKAHEAD_SECONDS * sampleRate)
}

/**
 * The compressor node's static curve, as the Web Audio specification defines
 * it for `DynamicsCompressorNode`: a level under the threshold passes as it
 * is, one over `threshold + knee` rises by 1 / ratio dB a dB, and between the
 * two lies a smooth knee. The specification leaves the knee's shape to the
 * browser; this is the one the browsers share, an exponential approach whose
 * steepness `k` is searched for so the knee ends at the slope of the ratio
 * (the same fifteen steps between 0.1 and 10 000). Linear in, linear out.
 */
export function compressorNodeCurve(
  thresholdDb: number,
  kneeDb: number,
  ratio: number,
): (level: number) => number {
  const threshold = dbToGain(thresholdDb)
  const kneeEndDb = thresholdDb + kneeDb
  const kneeEnd = dbToGain(kneeEndDb)
  const slope = 1 / ratio
  const knee = (x: number, k: number): number =>
    x < threshold ? x : threshold + (1 - Math.exp(-k * (x - threshold))) / k
  const slopeAt = (x: number, k: number): number => {
    if (x < threshold) return 1
    const next = x * 1.001
    return (gainToDb(knee(next, k)) - gainToDb(knee(x, k))) / (gainToDb(next) - gainToDb(x))
  }
  let low = 0.1
  let high = 10000
  let k = 5
  for (let i = 0; i < 15; i++) {
    // A steeper knee flattens sooner: too flat at its end means k is too high.
    if (slopeAt(kneeEnd, k) < slope) high = k
    else low = k
    k = Math.sqrt(low * high)
  }
  const kneeEndOutDb = gainToDb(knee(kneeEnd, k))
  return (level) =>
    level < kneeEnd
      ? knee(level, k)
      : dbToGain(kneeEndOutDb + slope * (gainToDb(level) - kneeEndDb))
}

/**
 * The gain a `DynamicsCompressorNode` adds behind its curve, in dB, as the
 * specification has it: what the curve takes off a full-scale level, turned
 * round and raised to 0.6. It is on everything that leaves the node, whatever
 * its level, and the Compressor device takes it off again.
 */
export function compressorNodeMakeupDb(thresholdDb: number, kneeDb: number, ratio: number): number {
  return -0.6 * gainToDb(compressorNodeCurve(thresholdDb, kneeDb, ratio)(1))
}

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
      'Gain after the compressor, to bring back the level that compression took away. At 0 a sound under the threshold leaves as loud as it came.',
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
  latencySamples: compressorLookaheadSamples,
  build(context): CompressorGraph {
    const compressor = context.createDynamicsCompressor()
    const makeup = context.createGain()
    // Takes the node's own make-up off again. It follows the three settings
    // that gain is made of, as they were last written.
    const cancel = context.createGain()
    let threshold: number = COMPRESSOR_PARAMS.threshold.default
    let knee: number = COMPRESSOR_PARAMS.knee.default
    let ratio: number = COMPRESSOR_PARAMS.ratio.default
    const cancelling = (): number => dbToGain(-compressorNodeMakeupDb(threshold, knee, ratio))
    cancel.gain.value = cancelling()
    compressor.connect(cancel)
    cancel.connect(makeup)
    return {
      input: compressor,
      output: makeup,
      nodes: [compressor, makeup, cancel],
      compressor,
      // Each writes the node's own param first: that is the one a lane follows.
      apply: {
        threshold: (value, ramp) => {
          threshold = value
          ramp(compressor.threshold, value)
          ramp(cancel.gain, cancelling())
        },
        knee: (value, ramp) => {
          knee = value
          ramp(compressor.knee, value)
          ramp(cancel.gain, cancelling())
        },
        ratio: (value, ramp) => {
          ratio = value
          ramp(compressor.ratio, value)
          ramp(cancel.gain, cancelling())
        },
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

/** DynamicsCompressorNode with no gain but its Make-up; `reductionDb` reads the meter. */
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
  // 2: Make-up is all the gain there is. Under 1 the node's own make-up was on top of it.
  version: 2,
  params: COMPRESSOR_PARAMS,
  meters: COMPRESSOR_METERS,
  presets: {
    // Each Make-up is what it was (2, 4, 1 and 0 dB) and the make-up the node
    // added under those settings (3.51, 7.85, 1.35 and 3.42 dB): as loud as before.
    Gentle: { threshold: -18, knee: 12, ratio: 2, attack: 0.02, release: 0.3, makeupDb: 5.51 },
    Voice: { threshold: -20, knee: 6, ratio: 4, attack: 0.005, release: 0.15, makeupDb: 11.85 },
    Glue: { threshold: -12, knee: 10, ratio: 1.5, attack: 0.03, release: 0.4, makeupDb: 2.35 },
    Limit: { threshold: -6, knee: 0, ratio: 20, attack: 0.0005, release: 0.05, makeupDb: 3.42 },
  },
  create: createCompressor,
}
