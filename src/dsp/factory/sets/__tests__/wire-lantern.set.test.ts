import { WIRE_LANTERN_PARAMS } from '../../../devices/wire-lantern.gen'
import { SET } from '../wire-lantern'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(WIRE_LANTERN_PARAMS).filter((knob) => knob !== 'volume'),
)
