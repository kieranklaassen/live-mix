import { UNDERVOICE_PARAMS } from '../../../devices/undervoice.gen'
import { SET } from '../undervoice'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(UNDERVOICE_PARAMS).filter((knob) => knob !== 'volume'),
)
