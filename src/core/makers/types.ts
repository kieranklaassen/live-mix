// A note maker stands between whatever plays notes (keys, a phrase of a
// sound, the chords of a piece) and the instrument, and writes notes of its
// own from them. It makes no sound: it is a rule over notes, the same rule
// where a patch is rendered (./phrase.ts) and where a person plays
// (./player.ts). A patch names one in front of its instrument
// (`Patch.maker`), so a preset with a note maker is a patch like any other.
//
// Everything in this folder is arithmetic on notes and seconds: no audio, no
// clock of its own, no Math.random.

import { type ParamSpec } from '../params'
import { type PresetSource } from '../devices/presets'

/**
 * The key a maker counts its steps in: the root as a pitch class (0 is C) and
 * the scale as semitones above it, rising from 0 and all below 12.
 */
export interface MakerKey {
  root: number
  steps: readonly number[]
}

/** The key of the white keys, read from C: what a patch that names no key is written in. */
export const WHITE_KEYS: MakerKey = { root: 0, steps: [0, 2, 4, 5, 7, 9, 11] }

/** One voice of a maker that can be given an instrument of its own. */
export interface MakerPart {
  /** Stable id: `PatchMaker.parts` names it. */
  id: string
  name: string
  /** What the voice plays, in a sentence. */
  description: string
}

/** One thing a maker does: a note begins or ends. */
export interface MadeEvent {
  atSec: number
  on: boolean
  /** Names the note from its start to its end: never used for another while it sounds. */
  id: number
  /** MIDI note number; fractions are allowed. */
  note: number
  /** Velocity, 0..1. */
  gain: number
  /** Which part's own instrument plays it; absent, the patch's instrument. */
  part?: string
}

export type EmitMade = (event: MadeEvent) => void

/** What a maker is made with. */
export interface MakerOptions {
  params?: Readonly<Record<string, number>>
  key?: MakerKey
  /** The parts that have an instrument of their own; what the others play names no part. */
  parts?: Iterable<string>
}

/**
 * A maker at work. Times only go forward: a call with an earlier time than
 * the one before is taken as at the time of the one before. What it emits
 * depends on what it was played and when, and never on how often `advance`
 * was called in between.
 */
export interface NoteMaker {
  readonly descriptor: NoteMakerDescriptor
  noteOn(atSec: number, id: number, note: number, gain: number): void
  noteOff(atSec: number, id: number): void
  /** A control moved: what it writes from here on. A name it lacks is passed over. */
  setParam(atSec: number, name: string, value: number): void
  setKey(atSec: number, key: MakerKey): void
  /** Work up to and including `toSec`, handing over every event in order. */
  advance(toSec: number, emit: EmitMade): void
  /** When it next has something to do by itself, or Infinity. */
  next(): number
  /** Forget every held note and end every sounding one. */
  silence(atSec: number, emit: EmitMade): void
}

/** The row a host lists a maker by. */
export interface NoteMakerDescriptor<
  P extends Record<string, ParamSpec> = Record<string, ParamSpec>,
> extends PresetSource<P> {
  /** Stable id: a patch or a piece that keeps it has kept the maker. */
  id: string
  name: string
  /** One sentence for a browser: what it writes and what it is for. */
  description: string
  /**
   * `'answers'` writes only while and after a note is played; `'walks'` goes on
   * writing by itself for as long as a note is held.
   */
  kind: 'answers' | 'walks'
  version: number
  params: P
  /** Voices that can have an instrument of their own; empty for a maker with none. */
  parts: readonly MakerPart[]
  /** Parameters that are a length of time or a rate, and follow the tempo of a sound that keeps one. */
  timed?: Readonly<Partial<Record<keyof P & string, 'time' | 'rate'>>>
  create(options?: MakerOptions): NoteMaker
}
