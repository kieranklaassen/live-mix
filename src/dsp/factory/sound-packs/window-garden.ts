// The sounds of the pack "Museum Window Garden": its presets played, a hundred sounds to
// paint with. Numbers 9001 to 9100.

import { PRESETS } from '../packs/window-garden'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('window-garden', 9000, PRESETS, [])
