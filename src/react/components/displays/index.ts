// Every stock device's display and the knobs that stand with it, by device
// id. One file per family holds the displays; this is where they meet.

import { type PlateFace } from '../plate-display'
import { DELAY_FACES } from './delay'
import { DRIVE_FACES } from './drive'
import { DYNAMICS_FACES } from './dynamics'
import { EQ_FACES } from './eq'
import { FALLING_FACES } from './falling'
import { GLINTS_FACES } from './glints'
import { STRING_INSTRUMENT_FACES } from './instrument-strings'
import { AIR_INSTRUMENT_FACES } from './instrument-air'
import { BARS_INSTRUMENT_FACES } from './instrument-bars'
import { BOWED_INSTRUMENT_FACES } from './instrument-bowed'
import { GUITAR_INSTRUMENT_FACES } from './instrument-guitars'
import { KEYS_INSTRUMENT_FACES } from './instrument-keys'
import { KIT_INSTRUMENT_FACES } from './instrument-kits'
import { SAMPLE_INSTRUMENT_FACES } from './instrument-samples'
import { SUBTRACTIVE_INSTRUMENT_FACES } from './instrument-subtractive'
import { WAVE_INSTRUMENT_FACES } from './instrument-waves'
import { WIND_INSTRUMENT_FACES } from './instrument-winds'
import { FOG_FACES } from './fog'
import { LOOPS_FACES } from './loops'
import { MELT_FACES } from './melt'
import { MODULATION_FACES } from './modulation'
import { PITCH_FACES } from './pitch'
import { REVERB_FACES } from './reverb'
import { SPATIAL_FACES } from './spatial'
import { TAILS_FACES } from './tails'
import { TEXTURE_FACES } from './texture'
import { WEAR_FACES } from './wear'
import { CONSTELLATION_FACES } from './constellation'

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
  ...FALLING_FACES,
  ...GLINTS_FACES,
  ...MELT_FACES,
  // The instruments.
  ...STRING_INSTRUMENT_FACES,
  ...GUITAR_INSTRUMENT_FACES,
  ...BOWED_INSTRUMENT_FACES,
  ...KEYS_INSTRUMENT_FACES,
  ...BARS_INSTRUMENT_FACES,
  ...WIND_INSTRUMENT_FACES,
  ...SUBTRACTIVE_INSTRUMENT_FACES,
  ...WAVE_INSTRUMENT_FACES,
  ...AIR_INSTRUMENT_FACES,
  ...SAMPLE_INSTRUMENT_FACES,
  ...KIT_INSTRUMENT_FACES,
  ...FOG_FACES,
  ...CONSTELLATION_FACES,
}
