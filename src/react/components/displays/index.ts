// Every stock device's display and the knobs that stand with it, by device
// id. One file per family holds the displays; this is where they meet.

import { type PlateFace } from '../plate-display'
import { CANON_FACES } from './canon'
import { DELAY_FACES } from './delay'
import { DISTANCE_FACES } from './distance'
import { DRIVE_FACES } from './drive'
import { DYNAMICS_FACES } from './dynamics'
import { EQ_FACES } from './eq'
import { FALLING_FACES } from './falling'
import { GLINTS_FACES } from './glints'
import { STRING_INSTRUMENT_FACES } from './instrument-strings'
import { AIR_INSTRUMENT_FACES } from './instrument-air'
import { BARS_INSTRUMENT_FACES } from './instrument-bars'
import { BODY_INSTRUMENT_FACES } from './instrument-bodies'
import { BOWED_INSTRUMENT_FACES } from './instrument-bowed'
import { GUITAR_INSTRUMENT_FACES } from './instrument-guitars'
import { KEYS_INSTRUMENT_FACES } from './instrument-keys'
import { KIT_INSTRUMENT_FACES } from './instrument-kits'
import { SUB_BASS_INSTRUMENT_FACES } from './instrument-sub-bass'
import { FM_BASS_INSTRUMENT_FACES } from './instrument-fm-bass'
import { ACID_BASS_INSTRUMENT_FACES } from './instrument-acid-bass'
import { STRING_BASS_INSTRUMENT_FACES } from './instrument-string-bass'
import { SAMPLE_INSTRUMENT_FACES } from './instrument-samples'
import { SUBTRACTIVE_INSTRUMENT_FACES } from './instrument-subtractive'
import { WAVE_INSTRUMENT_FACES } from './instrument-waves'
import { WIND_INSTRUMENT_FACES } from './instrument-winds'
import { FOG_FACES } from './fog'
import { GENERATIONS_FACES } from './generations'
import { TURN_INSTRUMENT_FACES } from './instrument-turns'
import { VOICE_INSTRUMENT_FACES } from './instrument-voices'
import { WEATHER_INSTRUMENT_FACES } from './instrument-weather'
import { WIRE_INSTRUMENT_FACES } from './instrument-wires'
import { LOOPS_FACES } from './loops'
import { MELT_FACES } from './melt'
import { MODULATION_FACES } from './modulation'
import { ORBITS_FACES } from './orbits'
import { OVERTONE_SINGER_FACES } from './overtone-singer'
import { PITCH_FACES } from './pitch'
import { PULSES_FACES } from './pulses'
import { REVERB_FACES } from './reverb'
import { SKIPPING_STONE_FACES } from './skipping-stone'
import { RING_FACES } from './ring'
import { SPATIAL_FACES } from './spatial'
import { TAILS_FACES } from './tails'
import { TEXTURE_FACES } from './texture'
import { UNDERWATER_FACES } from './underwater'
import { WEATHER_FACES } from './weather'
import { WEAR_FACES } from './wear'
import { CONSTELLATION_FACES } from './constellation'
import { BREATH_FACES } from './breath'
import { CURRENTS_FACES } from './currents'
import { MURMURATION_FACES } from './murmuration'
import { LATE_VIBRATO_FACES } from './late-vibrato'

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
  ...SKIPPING_STONE_FACES,
  ...ORBITS_FACES,
  ...SUB_BASS_INSTRUMENT_FACES,
  ...FM_BASS_INSTRUMENT_FACES,
  ...ACID_BASS_INSTRUMENT_FACES,
  ...STRING_BASS_INSTRUMENT_FACES,
  ...GENERATIONS_FACES,
  ...DISTANCE_FACES,
  ...WIRE_INSTRUMENT_FACES,
  ...VOICE_INSTRUMENT_FACES,
  ...WEATHER_INSTRUMENT_FACES,
  ...TURN_INSTRUMENT_FACES,
  ...BODY_INSTRUMENT_FACES,
  ...CANON_FACES,
  ...OVERTONE_SINGER_FACES,
  ...BREATH_FACES,
  ...CURRENTS_FACES,
  ...RING_FACES,
  ...UNDERWATER_FACES,
  ...PULSES_FACES,
  ...MURMURATION_FACES,
  ...WEATHER_FACES,
  ...LATE_VIBRATO_FACES,
}
