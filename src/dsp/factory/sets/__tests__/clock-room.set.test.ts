import { CLOCK_ROOM_PARAMS } from '../../../devices/clock-room.gen'
import { SET } from '../clock-room'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(CLOCK_ROOM_PARAMS).filter((knob) => knob !== 'volume'),
)
