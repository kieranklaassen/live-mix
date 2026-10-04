// The sounds of the pack "Static Cathedral": its presets played, a hundred sounds to
// paint with. Numbers 7001 to 7100.

import { PRESETS } from '../packs/static-cathedral'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('static-cathedral', 7000, PRESETS, [])
