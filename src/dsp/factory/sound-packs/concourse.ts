// The sounds of the pack "Empty Concourse": its presets played, a hundred sounds to
// paint with. Numbers 1001 to 1100.

import { PRESETS } from '../packs/concourse'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('concourse', 1000, PRESETS, [])
