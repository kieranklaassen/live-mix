import { CLIMBING_GONG_PARAMS } from '../../../devices/climbing-gong.gen'
import { SET } from '../climbing-gong'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(CLIMBING_GONG_PARAMS).filter((knob) => knob !== 'volume'),
)
