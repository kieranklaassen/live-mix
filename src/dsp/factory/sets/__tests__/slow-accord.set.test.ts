import { SLOW_ACCORD_PARAMS } from '../../../devices/slow-accord.gen'
import { SET } from '../slow-accord'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(SLOW_ACCORD_PARAMS).filter((knob) => knob !== 'volume'),
)
