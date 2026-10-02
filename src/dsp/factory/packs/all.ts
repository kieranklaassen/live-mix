// Every pack's presets in one list, each stamped with its pack. Nothing but
// ./index's `loadFactoryPacks` (and the tests) imports this module, so it
// stays a chunk of its own.

import { type FactoryPreset } from '../types'
import { PRESETS as CONCOURSE } from './concourse'
import { PRESETS as SOFT_PEDAL } from './soft-pedal'
import { PRESETS as OXIDE } from './oxide'
import { PRESETS as NATURE_FILM } from './nature-film'
import { PRESETS as LUCID } from './lucid'
import { PRESETS as FOUR_TRACK } from './four-track'
import { PRESETS as WINDOW_GARDEN } from './window-garden'
import { PRESETS as ROSEWOOD } from './rosewood'
import { PRESETS as PARK_ZITHER } from './park-zither'
import { PRESETS as SONORAN } from './sonoran'
import { PRESETS as POLAR_SIGNAL } from './polar-signal'
import { PRESETS as FAR_NORTH } from './far-north'
import { PRESETS as ORBIT_STEEL } from './orbit-steel'
import { PRESETS as BROADCAST_HALL } from './broadcast-hall'
import { PRESETS as LAPTOP_GUITAR } from './laptop-guitar'
import { PRESETS as PATCH_CABLES } from './patch-cables'
import { PRESETS as ASHRAM } from './ashram'

const stamped = (pack: string, presets: readonly FactoryPreset[]): FactoryPreset[] =>
  presets.map((preset) => ({ ...preset, pack }))

export const PACK_PRESETS: readonly FactoryPreset[] = [
  ...stamped('concourse', CONCOURSE),
  ...stamped('soft-pedal', SOFT_PEDAL),
  ...stamped('oxide', OXIDE),
  ...stamped('nature-film', NATURE_FILM),
  ...stamped('lucid', LUCID),
  ...stamped('four-track', FOUR_TRACK),
  ...stamped('window-garden', WINDOW_GARDEN),
  ...stamped('rosewood', ROSEWOOD),
  ...stamped('park-zither', PARK_ZITHER),
  ...stamped('sonoran', SONORAN),
  ...stamped('polar-signal', POLAR_SIGNAL),
  ...stamped('far-north', FAR_NORTH),
  ...stamped('orbit-steel', ORBIT_STEEL),
  ...stamped('broadcast-hall', BROADCAST_HALL),
  ...stamped('laptop-guitar', LAPTOP_GUITAR),
  ...stamped('patch-cables', PATCH_CABLES),
  ...stamped('ashram', ASHRAM),
]
