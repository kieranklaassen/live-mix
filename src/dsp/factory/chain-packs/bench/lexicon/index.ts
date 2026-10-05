// Every effect's lexicon by device id: one file per device beside this one.
// ../lexicon.test.ts holds each to its device's presets.

import { LEXICON as AMBIENT_COMP } from './ambient-comp'
import { LEXICON as AMBIENT_EQ } from './ambient-eq'
import { LEXICON as AMBIENT_LIMITER } from './ambient-limiter'
import { LEXICON as ANALOG_DELAY } from './analog-delay'
import { LEXICON as ANALOG_DRIVE } from './analog-drive'
import { LEXICON as AUTO_FILTER } from './auto-filter'
import { LEXICON as BLOOM_REVERB } from './bloom-reverb'
import { LEXICON as CASCADE } from './cascade'
import { LEXICON as CHORUS } from './chorus'
import { LEXICON as ECHO_MEMORY } from './echo-memory'
import { LEXICON as ETHER_REVERB } from './ether-reverb'
import { LEXICON as EXPANSE } from './expanse'
import { LEXICON as FDN_REVERB } from './fdn-reverb'
import { LEXICON as FET_LIMITER } from './fet-limiter'
import { LEXICON as FLANGER } from './flanger'
import { LEXICON as FREQ_SHIFTER } from './freq-shifter'
import { LEXICON as GLITCH } from './glitch'
import { LEXICON as GRAIN_CLOUD } from './grain-cloud'
import { LEXICON as GRAIN_DELAY } from './grain-delay'
import { LEXICON as HALF_SPEED } from './half-speed'
import { LEXICON as HALL_REVERB } from './hall-reverb'
import { LEXICON as LATTICE } from './lattice'
import { LEXICON as LOW_BITRATE } from './low-bitrate'
import { LEXICON as MICRO_LOOPER } from './micro-looper'
import { LEXICON as NOISE_FLOOR } from './noise-floor'
import { LEXICON as OCTAVES } from './octaves'
import { LEXICON as PAD_FOLLOWER } from './pad-follower'
import { LEXICON as PATINA } from './patina'
import { LEXICON as PHASER } from './phaser'
import { LEXICON as PITCH_SHIFTER } from './pitch-shifter'
import { LEXICON as PLATE_REVERB } from './plate-reverb'
import { LEXICON as RADIO } from './radio'
import { LEXICON as RE_AMP } from './re-amp'
import { LEXICON as REVERSE_DELAY } from './reverse-delay'
import { LEXICON as ROTARY } from './rotary'
import { LEXICON as SATURATOR } from './saturator'
import { LEXICON as SHAPED_REVERB } from './shaped-reverb'
import { LEXICON as SHIMMER } from './shimmer'
import { LEXICON as SPECTRAL_BLUR } from './spectral-blur'
import { LEXICON as SPECTRAL_DRIFTER } from './spectral-drifter'
import { LEXICON as SPRING_REVERB } from './spring-reverb'
import { LEXICON as STEREO_DETUNE } from './stereo-detune'
import { LEXICON as STEREO_WIDENER } from './stereo-widener'
import { LEXICON as SUSTAINER } from './sustainer'
import { LEXICON as SWARM_REVERB } from './swarm-reverb'
import { LEXICON as SWELL } from './swell'
import { LEXICON as SYMPATHETIC } from './sympathetic'
import { LEXICON as TAPE } from './tape'
import { LEXICON as TAPE_ECHO } from './tape-echo'
import { LEXICON as TAPE_LOOP } from './tape-loop'
import { LEXICON as TREMOLO } from './tremolo'
import { LEXICON as VINTAGE_DIGITAL } from './vintage-digital'
import { LEXICON as VINYL } from './vinyl'
import { LEXICON as VOWEL_REVERB } from './vowel-reverb'
import { type DeviceLexicon, type Voice } from './types'

export * from './types'

const ALL: readonly DeviceLexicon[] = [
  AMBIENT_COMP,
  AMBIENT_EQ,
  AMBIENT_LIMITER,
  ANALOG_DELAY,
  ANALOG_DRIVE,
  AUTO_FILTER,
  BLOOM_REVERB,
  CASCADE,
  CHORUS,
  ECHO_MEMORY,
  ETHER_REVERB,
  EXPANSE,
  FDN_REVERB,
  FET_LIMITER,
  FLANGER,
  FREQ_SHIFTER,
  GLITCH,
  GRAIN_CLOUD,
  GRAIN_DELAY,
  HALF_SPEED,
  HALL_REVERB,
  LATTICE,
  LOW_BITRATE,
  MICRO_LOOPER,
  NOISE_FLOOR,
  OCTAVES,
  PAD_FOLLOWER,
  PATINA,
  PHASER,
  PITCH_SHIFTER,
  PLATE_REVERB,
  RADIO,
  RE_AMP,
  REVERSE_DELAY,
  ROTARY,
  SATURATOR,
  SHAPED_REVERB,
  SHIMMER,
  SPECTRAL_BLUR,
  SPECTRAL_DRIFTER,
  SPRING_REVERB,
  STEREO_DETUNE,
  STEREO_WIDENER,
  SUSTAINER,
  SWARM_REVERB,
  SWELL,
  SYMPATHETIC,
  TAPE,
  TAPE_ECHO,
  TAPE_LOOP,
  TREMOLO,
  VINTAGE_DIGITAL,
  VINYL,
  VOWEL_REVERB,
]

export const LEXICON: ReadonlyMap<string, DeviceLexicon> = new Map(
  ALL.map((lexicon) => [lexicon.device, lexicon]),
)

/** One preset of one device as the lexicon has it. */
export function voice(device: string, preset: string): Voice | undefined {
  return LEXICON.get(device)?.voices[preset]
}
