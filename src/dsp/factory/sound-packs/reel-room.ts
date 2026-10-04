// The sounds of the pack "Indiana Reel Room": its presets played, a hundred sounds to
// paint with. Numbers 24001 to 24100.

import { PRESETS } from '../packs/reel-room'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('reel-room', 24000, PRESETS, [])
