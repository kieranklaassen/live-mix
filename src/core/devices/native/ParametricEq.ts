// Channel EQ: a high-pass low cut, four peaking bands and a low-pass high cut,
// all in series. Band defaults sit two octaves apart with 0 dB gain, so the
// default device is transparent apart from the cuts at their extremes.

import { type ParamSpec } from '../../params'
import { type DeviceDescriptor } from '../registry'
import {
  NodeDevice,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  type ParamApplier,
  defineNodeDevice,
} from './NodeDevice'

export const PARAMETRIC_EQ_BANDS = 4

type BandIndex = 1 | 2 | 3 | 4
type BandParamName<N extends BandIndex> = `band${N}Freq` | `band${N}Gain` | `band${N}Q`

export type ParametricEqParamName = 'lowCut' | BandParamName<BandIndex> | 'highCut'

const BAND_DEFAULT_FREQUENCIES: readonly number[] = [100, 400, 1600, 6400]

function bandParams(): Record<BandParamName<BandIndex>, ParamSpec> {
  const params: Partial<Record<BandParamName<BandIndex>, ParamSpec>> = {}
  for (let band = 1; band <= PARAMETRIC_EQ_BANDS; band += 1) {
    const n = band as BandIndex
    const base = 1 + (band - 1) * 3
    params[`band${n}Freq`] = {
      id: base,
      name: `Band ${n} freq`,
      min: 20,
      max: 20000,
      default: BAND_DEFAULT_FREQUENCIES[band - 1],
      taper: 'log',
      unit: 'Hz',
    }
    params[`band${n}Gain`] = {
      id: base + 1,
      name: `Band ${n} gain`,
      min: -18,
      max: 18,
      default: 0,
      taper: 'linear',
      unit: 'dB',
    }
    params[`band${n}Q`] = {
      id: base + 2,
      name: `Band ${n} Q`,
      min: 0.1,
      max: 10,
      default: 1,
      taper: 'log',
      unit: '',
    }
  }
  return params as Record<BandParamName<BandIndex>, ParamSpec>
}

export const PARAMETRIC_EQ_PARAMS: Readonly<Record<ParametricEqParamName, ParamSpec>> = {
  /** High-pass corner; the minimum is effectively off. */
  lowCut: { id: 0, name: 'Low cut', min: 20, max: 1000, default: 20, taper: 'log', unit: 'Hz' },
  ...bandParams(),
  /** Low-pass corner; the maximum is effectively off. */
  highCut: {
    id: 1 + PARAMETRIC_EQ_BANDS * 3,
    name: 'High cut',
    min: 2000,
    max: 20000,
    default: 20000,
    taper: 'log',
    unit: 'Hz',
  },
}

export const PARAMETRIC_EQ_DEVICE = defineNodeDevice({
  id: 'parametric-eq',
  params: PARAMETRIC_EQ_PARAMS,
  build(context): NodeDeviceGraph<typeof PARAMETRIC_EQ_PARAMS> {
    // Created in chain order so a consumer's `ctx.filters` reads left to right.
    const lowCut = context.createBiquadFilter()
    lowCut.type = 'highpass'
    lowCut.Q.value = Math.SQRT1_2

    const bands: BiquadFilterNode[] = []
    let previous: AudioNode = lowCut
    for (let band = 0; band < PARAMETRIC_EQ_BANDS; band += 1) {
      const peaking = context.createBiquadFilter()
      peaking.type = 'peaking'
      previous.connect(peaking)
      bands.push(peaking)
      previous = peaking
    }

    const highCut = context.createBiquadFilter()
    highCut.type = 'lowpass'
    highCut.Q.value = Math.SQRT1_2
    previous.connect(highCut)

    const apply: Partial<Record<ParametricEqParamName, ParamApplier>> = {
      lowCut: (value, ramp) => ramp(lowCut.frequency, value),
      highCut: (value, ramp) => ramp(highCut.frequency, value),
    }
    bands.forEach((peaking, index) => {
      const n = (index + 1) as BandIndex
      apply[`band${n}Freq`] = (value, ramp) => ramp(peaking.frequency, value)
      apply[`band${n}Gain`] = (value, ramp) => ramp(peaking.gain, value)
      apply[`band${n}Q`] = (value, ramp) => ramp(peaking.Q, value)
    })

    return {
      input: lowCut,
      output: highCut,
      nodes: [lowCut, ...bands, highCut],
      apply: apply as NodeDeviceGraph<typeof PARAMETRIC_EQ_PARAMS>['apply'],
    }
  },
})

export type ParametricEq = NodeDevice<typeof PARAMETRIC_EQ_PARAMS>

/** Low cut → four peaking bands → high cut, each band with freq/gain/Q. */
export function createParametricEq(
  context: BaseAudioContext,
  options: NodeDeviceOptions<typeof PARAMETRIC_EQ_PARAMS> = {},
): ParametricEq {
  return new NodeDevice(context, PARAMETRIC_EQ_DEVICE, options)
}

export const PARAMETRIC_EQ_DESCRIPTOR: DeviceDescriptor<typeof PARAMETRIC_EQ_PARAMS> = {
  id: PARAMETRIC_EQ_DEVICE.id,
  name: 'Parametric EQ',
  kind: 'node',
  category: 'eq',
  version: 1,
  params: PARAMETRIC_EQ_PARAMS,
  presets: {
    'Voice bed': { lowCut: 60, band3Freq: 2500, band3Gain: -3, band3Q: 0.9, highCut: 12000 },
    'Mud cut': { band1Freq: 250, band1Gain: -4, band1Q: 1.2 },
    Sparkle: { band4Freq: 9000, band4Gain: 3, band4Q: 0.7 },
  },
  create: createParametricEq,
}
