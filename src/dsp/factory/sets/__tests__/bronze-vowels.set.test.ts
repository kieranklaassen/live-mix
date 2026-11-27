import { BRONZE_VOWELS_PARAMS } from '../../../devices/bronze-vowels.gen'
import { SET } from '../bronze-vowels'
import { describeSet } from './support'

describeSet(
  SET,
  Object.keys(BRONZE_VOWELS_PARAMS).filter((knob) => knob !== 'volume'),
)
