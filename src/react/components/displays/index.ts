// Every stock device's display and the knobs that stand with it, by device
// id. One file per family holds the displays; this is where they meet.

import { type PlateFace } from '../plate-display'
import { DELAY_FACES } from './delay'
import { DRIVE_FACES } from './drive'
import { DYNAMICS_FACES } from './dynamics'
import { EQ_FACES } from './eq'
import { LOOPS_FACES } from './loops'
import { MODULATION_FACES } from './modulation'
import { PITCH_FACES } from './pitch'
import { REVERB_FACES } from './reverb'
import { SPATIAL_FACES } from './spatial'
import { TAILS_FACES } from './tails'
import { TEXTURE_FACES } from './texture'
import { WEATHER_FACES } from './weather'
import { WEAR_FACES } from './wear'

export const PLATE_FACES: Readonly<Record<string, PlateFace>> = {
  ...DYNAMICS_FACES,
  ...EQ_FACES,
  ...MODULATION_FACES,
  ...DELAY_FACES,
  ...LOOPS_FACES,
  ...REVERB_FACES,
  ...TAILS_FACES,
  ...WEAR_FACES,
  ...TEXTURE_FACES,
  ...PITCH_FACES,
  ...DRIVE_FACES,
  ...SPATIAL_FACES,
  ...WEATHER_FACES,
}
