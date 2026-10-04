// The sounds of the pack "Park Bench Zither": its presets played, a hundred sounds to
// paint with. Numbers 11001 to 11100.

import { PRESETS } from '../packs/park-zither'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('park-zither', 11000, PRESETS, [])
