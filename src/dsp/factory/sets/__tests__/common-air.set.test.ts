import { COMMON_AIR_PARAMS } from '../../../devices/common-air.gen'
import { SET } from '../common-air'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(COMMON_AIR_PARAMS).filter((knob) => knob !== 'volume'),
)
