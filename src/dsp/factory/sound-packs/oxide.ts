// The sounds of the pack "Shedding Oxide": its presets played, a hundred sounds to
// paint with. Numbers 4001 to 4100.

import { PRESETS } from '../packs/oxide'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('oxide', 4000, PRESETS, [])
