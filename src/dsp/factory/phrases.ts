// The phrases presets are auditioned with. All of them stay on the white keys
// (C major, A minor, D dorian), so previews and factory sounds sit together
// and inside the scale lock's default.

import { type Patch } from '../../core/devices/patch'
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
  // A bass line two octaves under the keys: a note and its echo, a step up to
  // the fifth, a note that reaches into the next one (a bass that slides,
  // slides there) and a long low note to end on.
  bass: {
    notes: [
      { atSec: 0, durSec: 0.9, note: 38 },
      { atSec: 1, durSec: 0.4, note: 38, gain: 0.6 },
      { atSec: 1.5, durSec: 0.9, note: 45, gain: 0.7 },
      { atSec: 2.5, durSec: 0.6, note: 43, gain: 0.7 },
      { atSec: 3, durSec: 1.3, note: 36 },
      { atSec: 4.5, durSec: 1.5, note: 33 },
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
  // Three bars of a kit at 120, every one of its twelve keys struck at least
  // once: a bar of the plain beat, a bar that opens up, a bar of what is left.
  drum: {
    notes: [
      { atSec: 0, durSec: 0.1, note: 60, gain: 1 },
      { atSec: 0.25, durSec: 0.1, note: 66, gain: 0.5 },
      { atSec: 0.5, durSec: 0.1, note: 65, gain: 0.7 },
      { atSec: 0.75, durSec: 0.1, note: 66, gain: 0.5 },
      { atSec: 1, durSec: 0.1, note: 62 },
      { atSec: 1.25, durSec: 0.1, note: 66, gain: 0.5 },
      { atSec: 1.5, durSec: 0.1, note: 65, gain: 0.7 },
      { atSec: 1.75, durSec: 0.1, note: 70, gain: 0.6 },
      { atSec: 2, durSec: 0.1, note: 60, gain: 1 },
      { atSec: 2.25, durSec: 0.1, note: 64, gain: 0.6 },
      { atSec: 2.5, durSec: 0.1, note: 65, gain: 0.7 },
      { atSec: 2.75, durSec: 0.1, note: 60, gain: 0.6 },
      { atSec: 3, durSec: 0.1, note: 68 },
      { atSec: 3.25, durSec: 0.1, note: 66, gain: 0.5 },
      { atSec: 3.5, durSec: 0.1, note: 67, gain: 0.7 },
      { atSec: 3.75, durSec: 0.1, note: 65, gain: 0.6 },
      { atSec: 4, durSec: 0.1, note: 61, gain: 1 },
      { atSec: 4.5, durSec: 0.1, note: 63, gain: 0.7 },
      { atSec: 5, durSec: 0.1, note: 71, gain: 0.7 },
      { atSec: 5.25, durSec: 0.1, note: 69 },
      { atSec: 5.5, durSec: 0.1, note: 62, gain: 0.6 },
      { atSec: 5.75, durSec: 0.1, note: 62, gain: 0.4 },
      { atSec: 6, durSec: 0.1, note: 60, gain: 1 },
      { atSec: 6, durSec: 0.1, note: 67, gain: 0.6 },
    ],
  },
}

const CATEGORY_PHRASE: Readonly<Record<FactoryPresetCategory, FactoryPhraseName>> = {
  pad: 'chord',
  keys: 'keys',
  bass: 'bass',
  bell: 'bells',
  string: 'chord',
  plucked: 'keys',
  wind: 'line',
  voice: 'chord',
  organ: 'chord',
  drone: 'low',
  texture: 'hold',
  drum: 'drum',
}

/** The phrase a preset is auditioned with: its own, else its category's. */
export function previewPhrase(preset: {
  category: FactoryPresetCategory
  preview?: FactoryPhraseName
}): Phrase {
  return FACTORY_PHRASES[preset.preview ?? CATEGORY_PHRASE[preset.category]]
}

/**
 * What an effect chain is auditioned on when the host has no sound of its
 * own to run through it: a dry electric piano.
 */
export const CHAIN_PREVIEW_PATCH: Patch = {
  id: 'chain-preview-input',
  name: 'Chain preview input',
  category: 'preview',
  description: 'A dry electric piano.',
  instrument: { deviceId: 'tine-piano' },
  effects: [],
}

/** A sparse phrase with attacks and gaps, so a chain's tail and colour are heard between the notes. */
export const CHAIN_PREVIEW_PHRASE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 57 },
    { atSec: 0.6, durSec: 1.2, note: 64 },
    { atSec: 1.2, durSec: 1.2, note: 72 },
    { atSec: 2.4, durSec: 1.5, note: 69 },
    { atSec: 2.4, durSec: 1.5, note: 53 },
    { atSec: 4, durSec: 1, note: 76, gain: 0.6 },
  ],
}
