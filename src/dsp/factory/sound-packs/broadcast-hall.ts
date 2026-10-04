// The sounds of the pack "Old Broadcast Hall": its presets played, a hundred sounds to
// paint with. Numbers 17001 to 17100.

import { PRESETS } from '../packs/broadcast-hall'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('broadcast-hall', 17000, PRESETS, [])
