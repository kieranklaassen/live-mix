import { DEEP_ROOTS_PARAMS } from '../../../devices/deep-roots.gen'
import { SET } from '../deep-roots'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(DEEP_ROOTS_PARAMS).filter((knob) => knob !== 'volume'),
)
