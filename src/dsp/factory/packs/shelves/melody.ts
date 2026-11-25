// The packs of this shelf, each preset stamped with its pack: a chunk of its own (../index).

import { type FactoryPreset } from '../../types'
import { PRESETS as UNMEASURED_PRELUDES } from '../unmeasured-preludes'
import { PRESETS as RAGAS_ON_WHITE_KEYS } from '../ragas-on-white-keys'
import { PRESETS as ONE_LINE_SIX_PLAYERS } from '../one-line-six-players'
import { PRESETS as INTERLOCKING_PAIRS } from '../interlocking-pairs'
import { PRESETS as PATHS_OF_A_MAQAM } from '../paths-of-a-maqam'
import { PRESETS as CALLS_ACROSS_VALLEY } from '../calls-across-valley'
import { PRESETS as SONGS_IN_BOWL_TUNING } from '../songs-in-bowl-tuning'
import { PRESETS as BASS_NOBODY_PLAYS } from '../bass-nobody-plays'
import { PRESETS as MISSING_TONIC } from '../missing-tonic'
import { PRESETS as THRUSH_LADDER } from '../thrush-ladder'
import { PRESETS as ONLY_THE_HARMONICS } from '../only-the-harmonics'
import { PRESETS as ANY_TWO_FIT } from '../any-two-fit'
import { PRESETS as MENSURATION_CANONS } from '../mensuration-canons'
import { PRESETS as MELODY_OF_HOLES } from '../melody-of-holes'
import { PRESETS as TWELVE_NOTES_TWO_MODES } from '../twelve-notes-two-modes'
import { PRESETS as ONE_TUNE_THREE_DRONES } from '../one-tune-three-drones'
import { PRESETS as QUESTIONS_AND_ANSWERS } from '../questions-and-answers'
import { PRESETS as ONE_BREATH_EACH } from '../one-breath-each'
import { PRESETS as SAME_FINGERS_TWELFTH_UP } from '../same-fingers-twelfth-up'
import { PRESETS as ROUNDS_THAT_AGREE } from '../rounds-that-agree'
import { PRESETS as LONG_ARCH_MELODIES } from '../long-arch-melodies'
import { PRESETS as BLUE_THIRDS } from '../blue-thirds'
import { PRESETS as LINES_AND_REFLECTIONS } from '../lines-and-reflections'
import { PRESETS as COMPANIONS_BY_RULE } from '../companions-by-rule'
import { PRESETS as UP_ONE_WAY_DOWN_ANOTHER } from '../up-one-way-down-another'

const stamped = (pack: string, presets: readonly FactoryPreset[]): FactoryPreset[] =>
  presets.map((preset) => ({ ...preset, pack }))

/** In the order of `FACTORY_PACKS`. */
export const MELODY: readonly FactoryPreset[] = [
  ...stamped('unmeasured-preludes', UNMEASURED_PRELUDES),
  ...stamped('ragas-on-white-keys', RAGAS_ON_WHITE_KEYS),
  ...stamped('one-line-six-players', ONE_LINE_SIX_PLAYERS),
  ...stamped('interlocking-pairs', INTERLOCKING_PAIRS),
  ...stamped('paths-of-a-maqam', PATHS_OF_A_MAQAM),
  ...stamped('calls-across-valley', CALLS_ACROSS_VALLEY),
  ...stamped('songs-in-bowl-tuning', SONGS_IN_BOWL_TUNING),
  ...stamped('bass-nobody-plays', BASS_NOBODY_PLAYS),
  ...stamped('missing-tonic', MISSING_TONIC),
  ...stamped('thrush-ladder', THRUSH_LADDER),
  ...stamped('only-the-harmonics', ONLY_THE_HARMONICS),
  ...stamped('any-two-fit', ANY_TWO_FIT),
  ...stamped('mensuration-canons', MENSURATION_CANONS),
  ...stamped('melody-of-holes', MELODY_OF_HOLES),
  ...stamped('twelve-notes-two-modes', TWELVE_NOTES_TWO_MODES),
  ...stamped('one-tune-three-drones', ONE_TUNE_THREE_DRONES),
  ...stamped('questions-and-answers', QUESTIONS_AND_ANSWERS),
  ...stamped('one-breath-each', ONE_BREATH_EACH),
  ...stamped('same-fingers-twelfth-up', SAME_FINGERS_TWELFTH_UP),
  ...stamped('rounds-that-agree', ROUNDS_THAT_AGREE),
  ...stamped('long-arch-melodies', LONG_ARCH_MELODIES),
  ...stamped('blue-thirds', BLUE_THIRDS),
  ...stamped('lines-and-reflections', LINES_AND_REFLECTIONS),
  ...stamped('companions-by-rule', COMPANIONS_BY_RULE),
  ...stamped('up-one-way-down-another', UP_ONE_WAY_DOWN_ANOTHER),
]
