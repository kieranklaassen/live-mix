import { UNSUNG_VOICE_PARAMS } from '../../../devices/unsung-voice.gen'
import { SET } from '../unsung-voice'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(UNSUNG_VOICE_PARAMS).filter((knob) => knob !== 'volume'),
)
