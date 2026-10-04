// The sounds of the pack "Berlin Sequencer, 1974": its presets played, a hundred sounds to
// paint with. Numbers 21001 to 21100.

import { PRESETS } from '../packs/sequencer-1974'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('sequencer-1974', 21000, PRESETS, [])
