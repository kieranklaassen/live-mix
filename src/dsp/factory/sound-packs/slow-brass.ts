// The sounds of the pack "Austin Slow Brass": its presets played, a hundred sounds to
// paint with. Numbers 3001 to 3100.

import { PRESETS } from '../packs/slow-brass'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('slow-brass', 3000, PRESETS, [])
