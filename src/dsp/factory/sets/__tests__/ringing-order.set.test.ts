import { RINGING_ORDER_PARAMS } from '../../../devices/ringing-order.gen'
import { SET } from '../ringing-order'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(RINGING_ORDER_PARAMS).filter((knob) => knob !== 'volume'),
)
