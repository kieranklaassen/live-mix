// The sounds of the pack "Sonoran Night Air": its presets played, a hundred sounds to
// paint with. Numbers 12001 to 12100.

import { PRESETS } from '../packs/sonoran'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('sonoran', 12000, PRESETS, [])
