import { SINGING_SAND_PARAMS } from '../../../devices/singing-sand.gen'
import { SET } from '../singing-sand'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(SINGING_SAND_PARAMS).filter((knob) => knob !== 'volume'),
)
