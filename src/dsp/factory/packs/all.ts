// Every pack's presets in one list, each stamped with its pack. Nothing but
// ./index's `loadFactoryPacks` (and the tests) imports this module, so it
// stays a chunk of its own.

import { type FactoryPreset } from '../types'
import { PRESETS as CONCOURSE } from './concourse'
import { PRESETS as SOFT_PEDAL } from './soft-pedal'
import { PRESETS as SLOW_BRASS } from './slow-brass'
import { PRESETS as OXIDE } from './oxide'
import { PRESETS as NATURE_FILM } from './nature-film'
import { PRESETS as LUCID } from './lucid'
import { PRESETS as STATIC_CATHEDRAL } from './static-cathedral'
import { PRESETS as FOUR_TRACK } from './four-track'
import { PRESETS as WINDOW_GARDEN } from './window-garden'
import { PRESETS as ROSEWOOD } from './rosewood'
import { PRESETS as PARK_ZITHER } from './park-zither'
import { PRESETS as SONORAN } from './sonoran'
import { PRESETS as POLAR_SIGNAL } from './polar-signal'
import { PRESETS as FOREST_PULSE } from './forest-pulse'
import { PRESETS as FAR_NORTH } from './far-north'
import { PRESETS as ORBIT_STEEL } from './orbit-steel'
import { PRESETS as BROADCAST_HALL } from './broadcast-hall'
import { PRESETS as LAPTOP_GUITAR } from './laptop-guitar'
import { PRESETS as PATCH_CABLES } from './patch-cables'
import { PRESETS as ASHRAM } from './ashram'
import { PRESETS as SEQUENCER_1974 } from './sequencer-1974'
import { PRESETS as NEON_RAIN } from './neon-rain'
import { PRESETS as SIX_SQUARED } from './six-squared'
import { PRESETS as REEL_ROOM } from './reel-room'
import { PRESETS as STAIRWELL_CHOIR } from './stairwell-choir'

const stamped = (pack: string, presets: readonly FactoryPreset[]): FactoryPreset[] =>
  presets.map((preset) => ({ ...preset, pack }))

export const PACK_PRESETS: readonly FactoryPreset[] = [
  ...stamped('concourse', CONCOURSE),
  ...stamped('soft-pedal', SOFT_PEDAL),
  ...stamped('slow-brass', SLOW_BRASS),
  ...stamped('oxide', OXIDE),
  ...stamped('nature-film', NATURE_FILM),
  ...stamped('lucid', LUCID),
  ...stamped('static-cathedral', STATIC_CATHEDRAL),
  ...stamped('four-track', FOUR_TRACK),
  ...stamped('window-garden', WINDOW_GARDEN),
  ...stamped('rosewood', ROSEWOOD),
  ...stamped('park-zither', PARK_ZITHER),
  ...stamped('sonoran', SONORAN),
  ...stamped('polar-signal', POLAR_SIGNAL),
  ...stamped('forest-pulse', FOREST_PULSE),
  ...stamped('far-north', FAR_NORTH),
  ...stamped('orbit-steel', ORBIT_STEEL),
  ...stamped('broadcast-hall', BROADCAST_HALL),
  ...stamped('laptop-guitar', LAPTOP_GUITAR),
  ...stamped('patch-cables', PATCH_CABLES),
  ...stamped('ashram', ASHRAM),
  ...stamped('sequencer-1974', SEQUENCER_1974),
  ...stamped('neon-rain', NEON_RAIN),
  ...stamped('six-squared', SIX_SQUARED),
  ...stamped('reel-room', REEL_ROOM),
  ...stamped('stairwell-choir', STAIRWELL_CHOIR),
]
