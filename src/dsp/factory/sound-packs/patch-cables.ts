// The sounds of the pack "Island Patch Cables": its presets played, a hundred sounds to
// paint with. Numbers 19001 to 19100.

import { PRESETS } from '../packs/patch-cables'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('patch-cables', 19000, PRESETS, [])
