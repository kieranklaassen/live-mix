// The sounds of the pack "Rosewood Circles": its presets played, a hundred sounds to
// paint with. Numbers 10001 to 10100.

import { PRESETS } from '../packs/rosewood'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('rosewood', 10000, PRESETS, [])
