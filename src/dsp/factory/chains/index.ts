// Effect chains, one file per group. A browser lists the groups in this order;
// within a group the chains keep the order they have in their file.

import { type FactoryChain } from '../types'
import { SPACE_CHAINS } from './space'
import { ECHO_CHAINS } from './echo'
import { TAPE_CHAINS } from './tape'
import { MOTION_CHAINS } from './motion'
import { TEXTURE_CHAINS } from './texture'
import { PITCH_CHAINS } from './pitch'
import { MASTER_CHAINS } from './master'

export const FACTORY_CHAINS: readonly FactoryChain[] = [
  ...SPACE_CHAINS,
  ...ECHO_CHAINS,
  ...TAPE_CHAINS,
  ...MOTION_CHAINS,
  ...TEXTURE_CHAINS,
  ...PITCH_CHAINS,
  ...MASTER_CHAINS,
]
