import { SETTING_GLASS_PARAMS } from '../../../devices/setting-glass.gen'
import { SET } from '../setting-glass'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(SETTING_GLASS_PARAMS).filter((knob) => knob !== 'volume'),
)
