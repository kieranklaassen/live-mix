import { WALKING_VOICES_PARAMS } from '../../../devices/walking-voices.gen'
import { SET } from '../walking-voices'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(WALKING_VOICES_PARAMS).filter((knob) => knob !== 'volume'),
)
