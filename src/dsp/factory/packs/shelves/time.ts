// The packs of this shelf, each preset stamped with its pack: a chunk of its own (../index).

import { type FactoryPreset } from '../../types'
import { PRESETS as HANDSTROKE_GAP } from '../handstroke-gap'
import { PRESETS as SCALES_PLAYED_AS_TIME } from '../scales-played-as-time'
import { PRESETS as EVERY_METER } from '../every-meter'
import { PRESETS as FORTY_EIGHT_PULSES } from '../forty-eight-pulses'
import { PRESETS as PRIME_LENGTHS } from '../prime-lengths'
import { PRESETS as SEVEN_ORBITS } from '../seven-orbits'
import { PRESETS as COMMA_HOME } from '../comma-home'
import { PRESETS as RHYTHM_WITHOUT_ATTACKS } from '../rhythm-without-attacks'
import { PRESETS as RHYTHM_OF_A_CHORD } from '../rhythm-of-a-chord'
import { PRESETS as SLOWER_AND_FULLER } from '../slower-and-fuller'
import { PRESETS as ISORHYTHM_WHEELS } from '../isorhythm-wheels'
import { PRESETS as SLOW_PHASE_SLIP } from '../slow-phase-slip'
import { PRESETS as FOUR_AGAINST_FIVE } from '../four-against-five'
import { PRESETS as PASSACAGLIA_LAYERS } from '../passacaglia-layers'
import { PRESETS as CROOKED_THREE } from '../crooked-three'
import { PRESETS as SAPPHIC_HOURS } from '../sapphic-hours'
import { PRESETS as THUMB_KEEPS_FOUR } from '../thumb-keeps-four'
import { PRESETS as CRADLE_ROCKINGS } from '../cradle-rockings'
import { PRESETS as NEVER_BREATHE_TOGETHER } from '../never-breathe-together'

const stamped = (pack: string, presets: readonly FactoryPreset[]): FactoryPreset[] =>
  presets.map((preset) => ({ ...preset, pack }))

/** In the order of `FACTORY_PACKS`. */
export const TIME: readonly FactoryPreset[] = [
  ...stamped('handstroke-gap', HANDSTROKE_GAP),
  ...stamped('scales-played-as-time', SCALES_PLAYED_AS_TIME),
  ...stamped('every-meter', EVERY_METER),
  ...stamped('forty-eight-pulses', FORTY_EIGHT_PULSES),
  ...stamped('prime-lengths', PRIME_LENGTHS),
  ...stamped('seven-orbits', SEVEN_ORBITS),
  ...stamped('comma-home', COMMA_HOME),
  ...stamped('rhythm-without-attacks', RHYTHM_WITHOUT_ATTACKS),
  ...stamped('rhythm-of-a-chord', RHYTHM_OF_A_CHORD),
  ...stamped('slower-and-fuller', SLOWER_AND_FULLER),
  ...stamped('isorhythm-wheels', ISORHYTHM_WHEELS),
  ...stamped('slow-phase-slip', SLOW_PHASE_SLIP),
  ...stamped('four-against-five', FOUR_AGAINST_FIVE),
  ...stamped('passacaglia-layers', PASSACAGLIA_LAYERS),
  ...stamped('crooked-three', CROOKED_THREE),
  ...stamped('sapphic-hours', SAPPHIC_HOURS),
  ...stamped('thumb-keeps-four', THUMB_KEEPS_FOUR),
  ...stamped('cradle-rockings', CRADLE_ROCKINGS),
  ...stamped('never-breathe-together', NEVER_BREATHE_TOGETHER),
]
