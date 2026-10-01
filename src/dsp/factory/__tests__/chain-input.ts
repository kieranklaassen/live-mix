// What effect chains are measured on: a dry, sparse phrase with attacks and
// gaps, so a chain's own level, tail and colour can be read off the result.

import { type Patch } from '../../../core/devices/patch'
import { type Phrase } from '../../patch-render'

export const CHAIN_TEST_PATCH: Patch = {
  id: 'chain-test-input',
  name: 'Chain test input',
  category: 'test',
  description: 'A dry electric piano.',
  instrument: { deviceId: 'tine-piano' },
  effects: [],
}

export const CHAIN_TEST_PHRASE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 57 },
    { atSec: 0.6, durSec: 1.2, note: 64 },
    { atSec: 1.2, durSec: 1.2, note: 72 },
    { atSec: 2.4, durSec: 1.5, note: 69 },
    { atSec: 2.4, durSec: 1.5, note: 53 },
    { atSec: 4, durSec: 1, note: 76, gain: 0.6 },
  ],
}
