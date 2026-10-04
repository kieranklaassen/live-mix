// The sounds of the pack "Coast Fog Four-Track": its presets played, a hundred sounds to
// paint with. Numbers 8001 to 8100.

import { PRESETS } from '../packs/four-track'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('four-track', 8000, PRESETS, [])
