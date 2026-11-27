// What a preset is: a whole saved look of one style. Which variation, where the knobs stand, and the world it is drawn
// in (`world.ts`). A visual keeps its preset by the id, and its knobs stay the person's to turn.
//
// An id is saved in pieces: it is never renamed and never given another picture. `__tests__/presets.test.ts` holds
// that.
//
// Pure: no React, no DOM, no audio.

import type { VisualKnob, VisualSource } from './model'
import type { VisualWorld } from './world'

/** Where a preset puts a knob: where it stands, and what moves it, if anything does. */
export type PresetKnob = number | readonly [value: number, follows: VisualSource]

export interface VisualPreset {
  /** The name in lowercase with dashes. Saved in pieces. */
  id: string
  name: string
  /** What is seen, in a sentence. */
  what: string
  variation: 0 | 1
  /** Where it puts the knobs; one that is left out is put where a new visual has it. */
  size?: PresetKnob
  glow?: PresetKnob
  colour?: PresetKnob
  world: VisualWorld
}

/** A preset as a list shows it. */
export interface VisualPresetWords {
  /** The style it is of. */
  style: string
  id: string
  name: string
  what: string
  variation: 0 | 1
}

/** The form of a preset's id. */
export const PRESET_ID = /^[a-z][a-z0-9-]{0,39}$/

/** A preset's name, from its id alone: what a label says before the presets are loaded. */
export function presetName(id: string): string {
  const words = id.replaceAll('-', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** A knob of a preset as a visual keeps it. */
export function presetKnob(knob: PresetKnob): VisualKnob {
  return typeof knob === 'number'
    ? { value: knob, follows: null }
    : { value: knob[0], follows: knob[1] }
}
