import { RETURNING_WAVE_PARAMS } from '../../../devices/returning-wave.gen'
import { SET } from '../returning-wave'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(RETURNING_WAVE_PARAMS).filter((knob) => knob !== 'volume'),
)
