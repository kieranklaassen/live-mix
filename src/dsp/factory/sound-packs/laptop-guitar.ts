// The sounds of the pack "Sunburnt Laptop Guitar": its presets played, a hundred sounds to
// paint with. Numbers 18001 to 18100.

import { PRESETS } from '../packs/laptop-guitar'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('laptop-guitar', 18000, PRESETS, [])
