// Note names, and words that have note names in them. Arithmetic and strings
// alone, and it imports nothing: the packs' sounds are a script of their own
// (./sound-packs) and name their notes with this, so whatever this file
// reaches is shared between that script and the library's own. See the note
// on the layout of the build in docs/factory.md.

export const mod12 = (value: number): number => ((Math.round(value) % 12) + 12) % 12

/** Note names by pitch class, each black key by the name it is usually given. */
export const PITCH_CLASS_NAMES = [
  'C',
  'C♯',
  'D',
  'E♭',
  'E',
  'F',
  'F♯',
  'G',
  'A♭',
  'A',
  'B♭',
  'B',
] as const

export function pitchClassName(note: number): string {
  return PITCH_CLASS_NAMES[mod12(note)]
}

const NOTE_IN_BRACES = /\{([A-G])([♯♭]?)\}/g
const LETTER_CLASS: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

const shiftOf = (accidental: string): number =>
  accidental === '♯' ? 1 : accidental === '♭' ? -1 : 0

/**
 * A name or sentence with its note names in braces ("Low drone {D}"), moved
 * by `semitones` and written out: "Low drone D", or "Low drone F" three up.
 */
export function transposeWords(template: string, semitones: number): string {
  return template.replace(NOTE_IN_BRACES, (_all, letter: string, accidental: string) =>
    pitchClassName(LETTER_CLASS[letter] + shiftOf(accidental) + semitones),
  )
}

/**
 * The first note a name or sentence has in braces, as a pitch class: 2 for
 * "Warm pad {D}m9". Null where it names none.
 */
export function firstNoteInWords(template: string): number | null {
  const [first] = template.matchAll(NOTE_IN_BRACES)
  return first ? mod12(LETTER_CLASS[first[1]] + shiftOf(first[2])) : null
}
