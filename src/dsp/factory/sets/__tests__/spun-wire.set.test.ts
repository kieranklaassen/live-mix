import { SPUN_WIRE_PARAMS } from '../../../devices/spun-wire.gen'
import { SET } from '../spun-wire'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(SPUN_WIRE_PARAMS).filter((knob) => knob !== 'volume'),
)
