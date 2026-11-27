import { FLAME_ORGAN_PARAMS } from '../../../devices/flame-organ.gen'
import { SET } from '../flame-organ'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(FLAME_ORGAN_PARAMS).filter((knob) => knob !== 'volume'),
)
