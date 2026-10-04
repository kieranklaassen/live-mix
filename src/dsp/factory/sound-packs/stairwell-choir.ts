// The sounds of the pack "Stairwell Choir of One": its presets played, a hundred sounds to
// paint with. Numbers 25001 to 25100.

import { PRESETS } from '../packs/stairwell-choir'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('stairwell-choir', 25000, PRESETS, [])
