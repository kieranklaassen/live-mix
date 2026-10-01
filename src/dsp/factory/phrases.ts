// The phrases presets are auditioned with. All of them stay on the white keys
// (C major, A minor, D dorian), so previews and factory sounds sit together
// and inside the scale lock's default.

import { type Phrase } from '../patch-render'
import { type FactoryPhraseName, type FactoryPresetCategory } from './types'

/** Length of a preset preview in seconds, tail included. */
export const PREVIEW_SECONDS = 8

export const FACTORY_PHRASES: Readonly<Record<FactoryPhraseName, Phrase>> = {
  // An open D minor ninth, held and let go: what a pad is for.
  chord: {
    notes: [
      { atSec: 0, durSec: 4.5, note: 50 },
      { atSec: 0, durSec: 4.5, note: 57 },
      { atSec: 0, durSec: 4.5, note: 65 },
      { atSec: 0, durSec: 4.5, note: 72 },
      { atSec: 0, durSec: 4.5, note: 76, gain: 0.6 },
    ],
  },
  // A slow broken chord up and a held last note.
  keys: {
    notes: [
      { atSec: 0, durSec: 1.6, note: 50 },
      { atSec: 0.5, durSec: 1.6, note: 57 },
      { atSec: 1, durSec: 1.6, note: 65, gain: 0.7 },
      { atSec: 1.5, durSec: 1.6, note: 69, gain: 0.7 },
      { atSec: 2, durSec: 1.6, note: 72 },
      { atSec: 3, durSec: 2.5, note: 76, gain: 0.6 },
      { atSec: 3, durSec: 2.5, note: 60, gain: 0.6 },
    ],
  },
  // Four struck notes left to ring.
  bells: {
    notes: [
      { atSec: 0, durSec: 0.4, note: 69 },
      { atSec: 1, durSec: 0.4, note: 76, gain: 0.7 },
      { atSec: 2, durSec: 0.4, note: 72, gain: 0.7 },
      { atSec: 3.2, durSec: 0.4, note: 81, gain: 0.6 },
    ],
  },
  // One voice moving: a bowed or sung line.
  line: {
    notes: [
      { atSec: 0, durSec: 2, note: 62 },
      { atSec: 2, durSec: 1.5, note: 65 },
      { atSec: 3.5, durSec: 2.5, note: 69 },
    ],
  },
  // A low fifth: what a drone sits on.
  low: {
    notes: [
      { atSec: 0, durSec: 5.5, note: 38 },
      { atSec: 0, durSec: 5.5, note: 45, gain: 0.7 },
    ],
  },
  // One held note, for sounds without much pitch.
  hold: {
    notes: [{ atSec: 0, durSec: 5.5, note: 60 }],
  },
}

const CATEGORY_PHRASE: Readonly<Record<FactoryPresetCategory, FactoryPhraseName>> = {
  pad: 'chord',
  keys: 'keys',
  bell: 'bells',
  string: 'chord',
  voice: 'chord',
  organ: 'chord',
  drone: 'low',
  texture: 'hold',
}

/** The phrase a preset is auditioned with: its own, else its category's. */
export function previewPhrase(preset: {
  category: FactoryPresetCategory
  preview?: FactoryPhraseName
}): Phrase {
  return FACTORY_PHRASES[preset.preview ?? CATEGORY_PHRASE[preset.category]]
}
