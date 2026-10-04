// The sounds of the pack "Cornish Lucid Dreams": its presets played, a hundred sounds to
// paint with. Numbers 6001 to 6100.

import { PRESETS } from '../packs/lucid'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('lucid', 6000, PRESETS, [])
