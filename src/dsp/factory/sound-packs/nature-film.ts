// The sounds of the pack "Faded Nature Film": its presets played, a hundred sounds to
// paint with. Numbers 5001 to 5100.

import { PRESETS } from '../packs/nature-film'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('nature-film', 5000, PRESETS, [])
