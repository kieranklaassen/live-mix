// The sounds of the pack "Polar Night Signal": its presets played, a hundred sounds to
// paint with. Numbers 13001 to 13100.

import { PRESETS } from '../packs/polar-signal'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('polar-signal', 13000, PRESETS, [])
