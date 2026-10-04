// The sounds of the pack "Far North Bowed Guitar": its presets played, a hundred sounds to
// paint with. Numbers 15001 to 15100.

import { PRESETS } from '../packs/far-north'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('far-north', 15000, PRESETS, [])
