// Every factory sound, in the order a list shows them: the first
// thirty-four, then each family that was added to them, the bass last. A
// sound's catalogue number, not its place here, is what saved work knows it by.

import { type FactorySound } from '../types'
import { BASS_LINES_PLAYED } from './bass-lines-played'
import { BASS_NOTES } from './bass-notes'
import { DRONES_HELD } from './drones-held'
import { DRONES_SYNTH } from './drones-synth'
import { FIRST_SOUNDS } from './first'
import { MADE } from './made'
import { ONESHOTS } from './oneshots'
import { PADS_ACOUSTIC } from './pads-acoustic'
import { PADS_SYNTH } from './pads-synth'
import { PHRASES } from './phrases'
import { TEXTURES } from './textures'

export const FACTORY_SOUNDS: readonly FactorySound[] = [
  ...FIRST_SOUNDS,
  ...DRONES_HELD,
  ...DRONES_SYNTH,
  ...PADS_SYNTH,
  ...PADS_ACOUSTIC,
  ...TEXTURES,
  ...ONESHOTS,
  ...PHRASES,
  ...MADE,
  ...BASS_NOTES,
  ...BASS_LINES_PLAYED,
]
