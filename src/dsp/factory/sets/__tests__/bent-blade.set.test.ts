import { BENT_BLADE_PARAMS } from '../../../devices/bent-blade.gen'
import { SET } from '../bent-blade'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(BENT_BLADE_PARAMS).filter((knob) => knob !== 'volume'),
)
