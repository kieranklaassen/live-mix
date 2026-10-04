// The sounds of the pack "Ashram Harp and Organ": its presets played, a hundred sounds to
// paint with. Numbers 20001 to 20100.

import { PRESETS } from '../packs/ashram'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('ashram', 20000, PRESETS, [])
