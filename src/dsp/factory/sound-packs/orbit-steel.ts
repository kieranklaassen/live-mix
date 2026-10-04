// The sounds of the pack "Steel in Slow Orbit": its presets played, a hundred sounds to
// paint with. Numbers 16001 to 16100.

import { PRESETS } from '../packs/orbit-steel'
import { type FactorySound } from '../types'
import { packSounds } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('orbit-steel', 16000, PRESETS, [])
