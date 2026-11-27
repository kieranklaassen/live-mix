import { CHORD_CLOCK_PARAMS } from '../../../devices/chord-clock.gen'
import { SET } from '../chord-clock'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(CHORD_CLOCK_PARAMS).filter((knob) => knob !== 'volume'),
)
