import { STANDING_WATER_PARAMS } from '../../../devices/standing-water.gen'
import { SET } from '../standing-water'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(STANDING_WATER_PARAMS).filter((knob) => knob !== 'volume'),
)
