import { NIGHT_DRUM_PARAMS } from '../../../devices/night-drum.gen'
import { SET } from '../night-drum'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(NIGHT_DRUM_PARAMS).filter((knob) => knob !== 'volume'),
)
