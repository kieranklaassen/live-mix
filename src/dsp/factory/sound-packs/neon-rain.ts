// The sounds of the pack "Neon Rain, 2019": its presets played, a hundred sounds to
// paint with. Numbers 22001 to 22100.

import { PRESETS } from '../packs/neon-rain'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('neon-rain', 22000, PRESETS, [])
