// Every pack's chains in one list, each stamped with its pack. Nothing but
// ./index's `loadFactoryPackChains` (and the tests) imports this module, so it
// stays a chunk of its own: it holds data alone and imports nothing but the
// packs' own files.

import { type FactoryChain } from '../types'
import { CHAINS as CONCOURSE } from './concourse'
import { CHAINS as SOFT_PEDAL } from './soft-pedal'
import { CHAINS as SLOW_BRASS } from './slow-brass'
import { CHAINS as OXIDE } from './oxide'
import { CHAINS as NATURE_FILM } from './nature-film'
import { CHAINS as LUCID } from './lucid'
import { CHAINS as STATIC_CATHEDRAL } from './static-cathedral'
import { CHAINS as FOUR_TRACK } from './four-track'
import { CHAINS as WINDOW_GARDEN } from './window-garden'
import { CHAINS as ROSEWOOD } from './rosewood'
import { CHAINS as PARK_ZITHER } from './park-zither'
import { CHAINS as SONORAN } from './sonoran'
import { CHAINS as POLAR_SIGNAL } from './polar-signal'
import { CHAINS as FOREST_PULSE } from './forest-pulse'
import { CHAINS as FAR_NORTH } from './far-north'
import { CHAINS as ORBIT_STEEL } from './orbit-steel'
import { CHAINS as BROADCAST_HALL } from './broadcast-hall'
import { CHAINS as LAPTOP_GUITAR } from './laptop-guitar'
import { CHAINS as PATCH_CABLES } from './patch-cables'
import { CHAINS as ASHRAM } from './ashram'
import { CHAINS as SEQUENCER_1974 } from './sequencer-1974'
import { CHAINS as NEON_RAIN } from './neon-rain'
import { CHAINS as SIX_SQUARED } from './six-squared'
import { CHAINS as REEL_ROOM } from './reel-room'
import { CHAINS as STAIRWELL_CHOIR } from './stairwell-choir'

const stamped = (pack: string, chains: readonly FactoryChain[]): FactoryChain[] =>
  chains.map((chain) => ({ ...chain, pack }))

/** In the order of `FACTORY_PACKS`. */
export const PACK_CHAINS: readonly FactoryChain[] = [
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
