import { CLOSED_EYES_PARAMS } from '../../../devices/closed-eyes.gen'
import { SET } from '../closed-eyes'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(CLOSED_EYES_PARAMS).filter((knob) => knob !== 'volume'),
)
