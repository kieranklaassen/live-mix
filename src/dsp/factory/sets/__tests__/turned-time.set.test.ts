import { TURNED_TIME_PARAMS } from '../../../devices/turned-time.gen'
import { SET } from '../turned-time'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(TURNED_TIME_PARAMS).filter((knob) => knob !== 'volume'),
)
