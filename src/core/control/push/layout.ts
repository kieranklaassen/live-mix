// Which pitch each of the 64 pads plays. Push's own note layouts: "in key"
// puts only the notes of a scale on the pads, a scale step apart along a row
// and three steps (a fourth, in a seven-note scale) up from row to row;
// "chromatic" puts every semitone on a row and a fourth between rows. Pure.

import { PUSH_PAD_COLUMNS, PUSH_PAD_ROWS } from './protocol'

export type PushNoteLayout = 'in-key' | 'chromatic'

export interface PushPadScale {
  /** Pitch class of the root, 0 (C) to 11 (B). */
  root: number
  /** The scale as semitones above the root, ascending, starting at 0. */
  steps: readonly number[]
}

export interface PushPadLayoutOptions extends PushPadScale {
  layout: PushNoteLayout
  /** MIDI octave of the bottom-left pad's root; 3 puts C3 (note 48) there in C. */
  octave: number
  /** Scale steps from one row up to the next in the in-key layout; default 3. */
  rowSteps?: number
  /** Semitones from one row up to the next in the chromatic layout; default 5. */
  rowSemitones?: number
  /** How many rows of pads the layout fills, from the bottom; default all eight. */
  rows?: number
}

/** What a pad is in the layout: the scale's root, another note of it, or a note outside it. */
export type PushPadRole = 'root' | 'scale' | 'outside'

export interface PushPadPitch {
  /** MIDI note the pad plays. */
  note: number
  role: PushPadRole
}

function pitchClass(note: number): number {
  return ((note % 12) + 12) % 12
}

/** The lowest note of the layout: the root in the given octave (C3 = 48). */
export function pushLayoutBase(root: number, octave: number): number {
  return pitchClass(root) + 12 * (octave + 1)
}

/**
 * The pitch of one pad, or null when it falls outside MIDI's 0 to 127 or the
 * rows the layout fills. Row 0 is the bottom row, column 0 the left one.
 */
export function pushPadPitch(
  options: PushPadLayoutOptions,
  row: number,
  column: number,
): PushPadPitch | null {
  const rows = options.rows ?? PUSH_PAD_ROWS
  if (row < 0 || row >= rows || column < 0 || column >= PUSH_PAD_COLUMNS) return null
  const base = pushLayoutBase(options.root, options.octave)
  const steps = options.steps.length > 0 ? options.steps : [0]
  let note: number
  if (options.layout === 'in-key') {
    const index = column + row * (options.rowSteps ?? 3)
    note = base + 12 * Math.floor(index / steps.length) + steps[index % steps.length]
  } else {
    note = base + column + row * (options.rowSemitones ?? 5)
  }
  if (note < 0 || note > 127) return null
  const degree = pitchClass(note - options.root)
  return { note, role: degree === 0 ? 'root' : steps.includes(degree) ? 'scale' : 'outside' }
}

/**
 * Every pad of the layout, row by row from the bottom left: index
 * `row * 8 + column`, null where a pad has no note.
 */
export function pushPadPitches(options: PushPadLayoutOptions): (PushPadPitch | null)[] {
  const pads: (PushPadPitch | null)[] = []
  for (let row = 0; row < PUSH_PAD_ROWS; row += 1) {
    for (let column = 0; column < PUSH_PAD_COLUMNS; column += 1) {
      pads.push(pushPadPitch(options, row, column))
    }
  }
  return pads
}

/** The octaves `octave` can take with at least the bottom-left pad still inside MIDI's range. */
export function clampPushOctave(octave: number, root: number): number {
  const top = Math.floor((127 - pitchClass(root)) / 12) - 1
  return Math.max(-1, Math.min(top, Math.round(octave)))
}
