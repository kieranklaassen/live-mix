// Devices built from stock Web Audio nodes, all through NodeDevice.

import { CONVOLVER_REVERB_DESCRIPTOR } from './ConvolverReverb'
import { type DeviceDescriptor } from '../registry'
import { COMPRESSOR_DESCRIPTOR } from './Compressor'
import { DELAY_DESCRIPTOR } from './Delay'
import { EQ3_DESCRIPTOR } from './Eq3'
import { FILTER_DESCRIPTOR } from './Filter'
import { PARAMETRIC_EQ_DESCRIPTOR } from './ParametricEq'
import { UTILITY_DESCRIPTOR } from './Utility'

export {
  NODE_DEVICE_RAMP_SECONDS,
  NodeDevice,
  defineNodeDevice,
  type NodeDeviceDefinition,
  type NodeDeviceGraph,
  type NodeDeviceOptions,
  type ParamApplier,
  type ParamRamp,
} from './NodeDevice'
export { dbToGain, gainToDb } from './units'
export {
  FILTER_DESCRIPTOR,
  FILTER_DEVICE,
  FILTER_PARAMS,
  FILTER_TYPES,
  createFilter,
  filterTypeAt,
  filterTypeIndex,
  type Filter,
  type FilterParamName,
  type FilterType,
} from './Filter'
export {
  EQ3_DESCRIPTOR,
  EQ3_DEVICE,
  EQ3_PARAMS,
  createEq3,
  type Eq3,
  type Eq3ParamName,
} from './Eq3'
export {
  PARAMETRIC_EQ_BANDS,
  PARAMETRIC_EQ_DESCRIPTOR,
  PARAMETRIC_EQ_DEVICE,
  PARAMETRIC_EQ_PARAMS,
  createParametricEq,
  type ParametricEq,
  type ParametricEqParamName,
} from './ParametricEq'
export {
  DELAY_DESCRIPTOR,
  DELAY_DEVICE,
  DELAY_MAX_SECONDS,
  DELAY_PARAMS,
  createDelay,
  type Delay,
  type DelayParamName,
} from './Delay'
export {
  COMPRESSOR_DESCRIPTOR,
  COMPRESSOR_DEVICE,
  COMPRESSOR_LOOKAHEAD_SECONDS,
  COMPRESSOR_PARAMS,
  Compressor,
  createCompressor,
  type CompressorParamName,
} from './Compressor'
export {
  UTILITY_DESCRIPTOR,
  UTILITY_DEVICE,
  UTILITY_PARAMS,
  createUtility,
  utilityGain,
  type Utility,
  type UtilityParamName,
} from './Utility'

export {
  CONVOLVER_REVERB_DESCRIPTOR,
  CONVOLVER_REVERB_PARAMS,
  ConvolverReverb,
  REVERB_DECAY_SECONDS,
  REVERB_WET_LEVEL,
  createConvolverReverb,
  generateHallImpulse,
  type ConvolverReverbOptions,
} from './ConvolverReverb'

/** Every stock node device, in menu order; the default registry starts with these. */
export const NODE_DEVICES: readonly DeviceDescriptor[] = [
  FILTER_DESCRIPTOR,
  EQ3_DESCRIPTOR,
  PARAMETRIC_EQ_DESCRIPTOR,
  COMPRESSOR_DESCRIPTOR,
  DELAY_DESCRIPTOR,
  CONVOLVER_REVERB_DESCRIPTOR,
  UTILITY_DESCRIPTOR,
]
