import { ROSE_WINDOW_PARAMS } from '../../../devices/rose-window.gen'
import { SET } from '../rose-window'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(ROSE_WINDOW_PARAMS).filter((knob) => knob !== 'volume'),
)
