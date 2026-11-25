// The packs of this shelf, each preset stamped with its pack: a chunk of its own (../index).

import { type FactoryPreset } from '../../types'
import { PRESETS as FIRST_WORDS } from '../first-words'
import { PRESETS as ONLY_THE_TAIL } from '../only-the-tail'
import { PRESETS as SIXTEEN_HARP_PEDALS } from '../sixteen-harp-pedals'
import { PRESETS as NINTHS_FOR_OCTAVES } from '../ninths-for-octaves'
import { PRESETS as BETWEEN_THE_KEYS } from '../between-the-keys'
import { PRESETS as BURIED_JAR } from '../buried-jar'
import { PRESETS as THIRTEEN_NODES } from '../thirteen-nodes'
import { PRESETS as ORNAMENT_BOOK } from '../ornament-book'
import { PRESETS as PAIRED_BRONZE } from '../paired-bronze'
import { PRESETS as ONLY_THE_ATTACK } from '../only-the-attack'
import { PRESETS as WHISPERED_PAIRS } from '../whispered-pairs'
import { PRESETS as BANDS_OF_ONE } from '../bands-of-one'
import { PRESETS as FROM_NOTHING } from '../from-nothing'
import { PRESETS as OPEN_STRING_QUARTET } from '../open-string-quartet'
import { PRESETS as LEFT_HANDS } from '../left-hands'
import { PRESETS as UNA_CORDA_FAMILY } from '../una-corda-family'
import { PRESETS as TEN_WAYS_TO_BOW } from '../ten-ways-to-bow'

const stamped = (pack: string, presets: readonly FactoryPreset[]): FactoryPreset[] =>
  presets.map((preset) => ({ ...preset, pack }))

/** In the order of `FACTORY_PACKS`. */
export const HANDS: readonly FactoryPreset[] = [
  ...stamped('first-words', FIRST_WORDS),
  ...stamped('only-the-tail', ONLY_THE_TAIL),
  ...stamped('sixteen-harp-pedals', SIXTEEN_HARP_PEDALS),
  ...stamped('ninths-for-octaves', NINTHS_FOR_OCTAVES),
  ...stamped('between-the-keys', BETWEEN_THE_KEYS),
  ...stamped('buried-jar', BURIED_JAR),
  ...stamped('thirteen-nodes', THIRTEEN_NODES),
  ...stamped('ornament-book', ORNAMENT_BOOK),
  ...stamped('paired-bronze', PAIRED_BRONZE),
  ...stamped('only-the-attack', ONLY_THE_ATTACK),
  ...stamped('whispered-pairs', WHISPERED_PAIRS),
  ...stamped('bands-of-one', BANDS_OF_ONE),
  ...stamped('from-nothing', FROM_NOTHING),
  ...stamped('open-string-quartet', OPEN_STRING_QUARTET),
  ...stamped('left-hands', LEFT_HANDS),
  ...stamped('una-corda-family', UNA_CORDA_FAMILY),
  ...stamped('ten-ways-to-bow', TEN_WAYS_TO_BOW),
]
