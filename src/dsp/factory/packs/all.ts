// Every pack's presets in one list, for the tests: a page fetches them a shelf
// at a time (./index).

import { type FactoryPreset } from '../types'
import { HANDS } from './shelves/hands'
import { HARMONY } from './shelves/harmony'
import { INSTRUMENTS } from './shelves/instruments'
import { MELODY } from './shelves/melody'
import { SCENES } from './shelves/scenes'
import { TIME } from './shelves/time'

/** In the order of `FACTORY_PACKS`. */
export const PACK_PRESETS: readonly FactoryPreset[] = [
  ...SCENES,
  ...HARMONY,
  ...MELODY,
  ...TIME,
  ...HANDS,
  ...INSTRUMENTS,
]
