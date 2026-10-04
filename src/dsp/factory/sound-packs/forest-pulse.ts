// The sounds of the pack "Pulse under the Forest": its presets played, a hundred sounds to
// paint with. Numbers 14001 to 14100.

import { PRESETS } from '../packs/forest-pulse'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('forest-pulse', 14000, PRESETS, [])
