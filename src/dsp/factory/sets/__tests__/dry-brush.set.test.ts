import { DRY_BRUSH_PARAMS } from '../../../devices/dry-brush.gen'
import { SET } from '../dry-brush'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(DRY_BRUSH_PARAMS).filter((knob) => knob !== 'volume'),
)
