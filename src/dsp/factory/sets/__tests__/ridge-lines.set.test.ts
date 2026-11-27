import { RIDGE_LINES_PARAMS } from '../../../devices/ridge-lines.gen'
import { SET } from '../ridge-lines'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(RIDGE_LINES_PARAMS).filter((knob) => knob !== 'volume'),
)
