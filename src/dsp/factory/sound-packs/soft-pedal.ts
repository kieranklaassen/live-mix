// The sounds of the pack "Soft Pedal": its presets played, a hundred sounds to
// paint with. Numbers 2001 to 2100.

import { PRESETS } from '../packs/soft-pedal'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('soft-pedal', 2000, PRESETS, [])
