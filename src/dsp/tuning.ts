// The tunings a piece can play in, and the one sum that turns a key into its
// pitch in each. A tuning is a pitch for each of the twelve keys, set above
// the piece's root; the root itself keeps its equal-tempered pitch, so a
// drone on it sounds the same in every tuning and a piece can't drift.
//
// The answer is a key number with a fraction, not hertz, so everything that
// takes a fractional key (noteFrequency, the whole-cycles nudge, what a take
// records) goes on working.
//
// A leaf like ./note-frequency: it imports nothing, so the packs' script and
// the render workers can take it alone.

/** The menu, in the order a piece offers it. Equal is today's sound. */
export const KEY_TUNINGS = [
  'equal',
  'by-ear',
  'just',
  'pythagorean',
  'meantone',
  'slendro',
  'pelog',
  'rast',
  'bayati',
] as const

export type KeyTuningId = (typeof KEY_TUNINGS)[number]

export const KEY_TUNING_LABELS: Readonly<Record<KeyTuningId, string>> = {
  equal: 'Equal',
  'by-ear': 'By ear',
  just: 'Just',
  pythagorean: 'Pythagorean',
  meantone: 'Meantone',
  slendro: 'Slendro',
  pelog: 'Pelog',
  rast: 'Rast',
  bayati: 'Bayati',
}

/**
 * The scale a gamelan or maqam tuning puts the piece in, so its keys are the
 * ones the tuning is laid on. The names are the app's scale lock's.
 */
export const KEY_TUNING_SCALES: Readonly<
  Partial<Record<KeyTuningId, 'major-pentatonic' | 'minor' | 'major'>>
> = {
  slendro: 'major-pentatonic',
  pelog: 'minor',
  rast: 'major',
  bayati: 'minor',
}

/**
 * What a key is tuned against: the tuning, the piece's root as a pitch class
 * (0 is C), and for By ear the root of the chord sounding, also a pitch class.
 * A plain value, so it can cross into a worker.
 */
export interface KeyTuning {
  tuning: KeyTuningId
  root: number
  chordRoot?: number
}

export function isKeyTuningId(value: unknown): value is KeyTuningId {
  return typeof value === 'string' && (KEY_TUNINGS as readonly string[]).includes(value)
}

const cents = (ratio: number): number => 1200 * Math.log2(ratio)

const JUST = [
  1,
  16 / 15,
  9 / 8,
  6 / 5,
  5 / 4,
  4 / 3,
  45 / 32,
  3 / 2,
  8 / 5,
  5 / 3,
  9 / 5,
  15 / 8,
].map(cents)

/** Each degree's cents above the root, for the tunings that fix all twelve. */
const FIXED: Readonly<
  Record<'just' | 'pythagorean' | 'meantone' | 'rast' | 'bayati', readonly number[]>
> = {
  just: JUST,
  pythagorean: [
    1,
    256 / 243,
    9 / 8,
    32 / 27,
    81 / 64,
    4 / 3,
    729 / 512,
    3 / 2,
    128 / 81,
    27 / 16,
    16 / 9,
    243 / 128,
  ].map(cents),
  // Quarter-comma: fifths narrowed until four of them make a pure third.
  meantone: [0, 76.0, 193.2, 310.3, 386.3, 503.4, 579.5, 696.6, 772.6, 889.7, 1006.8, 1082.9],
  rast: [0, 100, 200, 300, 350, 500, 600, 700, 800, 900, 1000, 1050],
  bayati: [0, 100, 150, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
}

/**
 * The gamelan tunings: one representative set each, on the keys they are laid
 * on. Slendro sits on the major pentatonic's five, pelog on the minor's seven
 * in order (the scale lock has no phrygian to put it on by name).
 */
const SETS: Readonly<Record<'slendro' | 'pelog', ReadonlyMap<number, number>>> = {
  slendro: new Map([
    [0, 0],
    [2, 231],
    [4, 474],
    [7, 717],
    [9, 955],
  ]),
  pelog: new Map([
    [0, 0],
    [2, 120],
    [3, 258],
    [5, 539],
    [7, 675],
    [8, 785],
    [10, 943],
  ]),
}

/**
 * A key of the set plays its tone. Any other takes the tone nearest its equal
 * pitch, the next root's included; a tie goes down.
 */
function setTone(degree: number, set: ReadonlyMap<number, number>): number {
  const own = set.get(degree)
  if (own !== undefined) return own
  const want = degree * 100
  let best = 0
  for (const tone of [...set.values(), 1200]) {
    if (Math.abs(tone - want) < Math.abs(best - want)) best = tone
  }
  return best
}

/** Cents above the root of the key's own octave, for a degree 0 to 11. */
function degreeCents(degree: number, context: KeyTuning): number {
  switch (context.tuning) {
    case 'equal':
      return degree * 100
    case 'slendro':
    case 'pelog':
      return setTone(degree, SETS[context.tuning])
    case 'by-ear': {
      // The piece root never moves, or a C over ii would sit a comma sharp
      // of the drone. Every other note is pure above the chord's root, which
      // sits by Just on the piece's root.
      if (degree === 0) return 0
      const chord = mod12((context.chordRoot ?? context.root) - context.root)
      const interval = mod12(degree - chord)
      return JUST[chord] + JUST[interval] - (chord + interval >= 12 ? 1200 : 0)
    }
    default:
      return FIXED[context.tuning][degree]
  }
}

/**
 * Under this, a key's fraction is one of Equal's own corrections (the
 * whole-cycles nudge, the drones' pure fifth) and the tuning sets that note
 * itself. Over it, the fraction is the note's own (a touch, a detune) and
 * rides on top of the tuned pitch.
 */
const OWN_OFFSET = 0.025

/** The key `key` sounds at in `context`, as a fractional key number. */
export function tuneKey(key: number, context: KeyTuning): number {
  if (context.tuning === 'equal') return key
  const whole = Math.round(key)
  const offset = key - whole
  const degree = mod12(whole - context.root)
  return (
    whole -
    degree +
    degreeCents(degree, context) / 100 +
    (Math.abs(offset) > OWN_OFFSET ? offset : 0)
  )
}

function mod12(value: number): number {
  return ((value % 12) + 12) % 12
}
