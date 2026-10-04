// The sounds of the pack "Six Squared": its presets played, a hundred sounds to
// paint with. Numbers 23001 to 23100.

import { PRESETS } from '../packs/six-squared'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('six-squared', 23000, PRESETS, [])
