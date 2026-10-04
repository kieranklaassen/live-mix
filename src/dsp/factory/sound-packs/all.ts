// Every pack's sounds in one list, in the order of the packs. Nothing but
// ./index's `loadFactoryPackSounds` (and the tests) imports this module, so
// it stays a chunk of its own, beside the packs' presets it is made of.

import { type FactorySound } from '../types'
import { SOUNDS as CONCOURSE } from './concourse'
import { SOUNDS as SOFT_PEDAL } from './soft-pedal'
import { SOUNDS as SLOW_BRASS } from './slow-brass'
import { SOUNDS as OXIDE } from './oxide'
import { SOUNDS as NATURE_FILM } from './nature-film'
import { SOUNDS as LUCID } from './lucid'
import { SOUNDS as STATIC_CATHEDRAL } from './static-cathedral'
import { SOUNDS as FOUR_TRACK } from './four-track'
import { SOUNDS as WINDOW_GARDEN } from './window-garden'
import { SOUNDS as ROSEWOOD } from './rosewood'
import { SOUNDS as PARK_ZITHER } from './park-zither'
import { SOUNDS as SONORAN } from './sonoran'
import { SOUNDS as POLAR_SIGNAL } from './polar-signal'
import { SOUNDS as FOREST_PULSE } from './forest-pulse'
import { SOUNDS as FAR_NORTH } from './far-north'
import { SOUNDS as ORBIT_STEEL } from './orbit-steel'
import { SOUNDS as BROADCAST_HALL } from './broadcast-hall'
import { SOUNDS as LAPTOP_GUITAR } from './laptop-guitar'
import { SOUNDS as PATCH_CABLES } from './patch-cables'
import { SOUNDS as ASHRAM } from './ashram'
import { SOUNDS as SEQUENCER_1974 } from './sequencer-1974'
import { SOUNDS as NEON_RAIN } from './neon-rain'
import { SOUNDS as SIX_SQUARED } from './six-squared'
import { SOUNDS as REEL_ROOM } from './reel-room'
import { SOUNDS as STAIRWELL_CHOIR } from './stairwell-choir'

export const PACK_SOUNDS: readonly FactorySound[] = [
  ...CONCOURSE,
  ...SOFT_PEDAL,
  ...SLOW_BRASS,
  ...OXIDE,
  ...NATURE_FILM,
  ...LUCID,
  ...STATIC_CATHEDRAL,
  ...FOUR_TRACK,
  ...WINDOW_GARDEN,
  ...ROSEWOOD,
  ...PARK_ZITHER,
  ...SONORAN,
  ...POLAR_SIGNAL,
  ...FOREST_PULSE,
  ...FAR_NORTH,
  ...ORBIT_STEEL,
  ...BROADCAST_HALL,
  ...LAPTOP_GUITAR,
  ...PATCH_CABLES,
  ...ASHRAM,
  ...SEQUENCER_1974,
  ...NEON_RAIN,
  ...SIX_SQUARED,
  ...REEL_ROOM,
  ...STAIRWELL_CHOIR,
]
