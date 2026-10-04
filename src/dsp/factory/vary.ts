// A variant of a sound: the same recipe played once more, a little
// differently. The hand is a little harder or softer on each note, a little
// early or late, a few cents off; two notes of a phrase may change places; a
// held chord may ring with one of its upper notes an octave away, and is
// taken up at another moment of its instrument's movement. The instrument,
// its settings, the effects and the lengths stay, so a variant is as long as
// the sound, loops where the sound loops, is in the key the sound is in and
// starts on its attack where the sound does.
//
// A variant is decided by a seed and an amount and by nothing else: the same
// two always give the same recipe, so a host that keeps them has kept the
// variant. Everything is drawn per note from the note's own place in the
// phrase, never from a running count, so the notes of a phrase that is played
// round (`cycled`) change the same way in every pass and the loop still meets
// itself.

import { DEFAULT_PHRASE_GAIN, type LoopFold, type Phrase, type PhraseNote } from '../patch-render'

/** Which variant of a sound, and how far it is from the sound as written. */
export interface SoundVariation {
  /** Any whole number: one seed is one variant, always the same one. */
  seed: number
  /** 0 to 1. At 0 the variant is the sound itself; at 1 it is as far from it as a variant goes. */
  amount: number
}

/** What a variant may change, each at an amount of 1. Less in proportion below that. */
export const VARIATION_LIMITS = {
  /** How early or late a note may be, seconds; never more than a third of the way to the next one. */
  timingSec: 0.12,
  /** How much harder or softer a note may be played against the others, dB. */
  gainDb: 3,
  /** How far off pitch a note may be, cents. Not for a sound tuned to whole cycles. */
  cents: 7,
  /** The chance that two neighbouring single notes of a phrase change places. */
  swap: 0.35,
  /** The chance that one upper note of a held chord moves an octave. */
  voicing: 0.4,
  /** How much later a held chord may be taken up, seconds. */
  startSec: 4,
} as const

/** A note this near the start of a sound is its attack, and stays where it is. */
const LEAD_SEC = 0.03
/** Notes this near each other in time are struck together. */
const TOGETHER_SEC = 1e-4
const LOWEST_NOTE = 24
const HIGHEST_NOTE = 96

/** The part of a sound a variant reads: what a factory sound and a generated one share. */
export interface VariedPlaying {
  phrase: Phrase
  durationSec: number
  skipSec?: number
  loopCrossfadeSec?: number
  loopFold?: LoopFold
  tuning?: 'whole-cycles'
}

/** 0 up to 1, from a seed and whatever tells this draw from every other. */
function draw(seed: number, ...of: number[]): number {
  let hash = (seed | 0) ^ 0x9e3779b9
  for (const part of of) {
    hash = Math.imul(hash ^ (part | 0), 0x85ebca6b)
    hash ^= hash >>> 13
    hash = Math.imul(hash, 0xc2b2ae35)
    hash ^= hash >>> 16
  }
  return (hash >>> 0) / 0x1_0000_0000
}

/** -1 up to 1. */
const swing = (seed: number, ...of: number[]): number => draw(seed, ...of) * 2 - 1

const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value))

/** What is drawn from: 1 the timing, 2 the touch, 3 the tuning, 4 a change of places, 5 to 7 the voicing, 8 the start. */
const TIMING = 1
const TOUCH = 2
const TUNING = 3
const PLACES = 4
const VOICE = 5
const VOICED = 6
const UPWARD = 7
const START = 8

/**
 * The variant of `sound` that `variation` names. Without one, or at an amount
 * of 0, the sound itself comes back, the same object: nothing about it is
 * rendered differently.
 */
export function varySound<T extends VariedPlaying>(sound: T, variation?: SoundVariation): T {
  const amount = clamp(variation?.amount ?? 0, 0, 1)
  if (!variation || !(amount > 0) || sound.phrase.notes.length === 0) return sound
  const { seed } = variation

  const skipSec = sound.skipSec ?? 0
  const loops = Boolean(sound.loopCrossfadeSec)
  // A phrase played round: its notes come again every `durationSec`.
  const period = loops && sound.loopFold === 'linear' ? sound.durationSec : null
  const endSec = skipSec + sound.durationSec + (sound.loopCrossfadeSec ?? 0)
  // A chord held through everything that is rendered: the loop is a stretch of it.
  const held =
    loops &&
    period === null &&
    sound.phrase.notes.every((note) => note.atSec <= skipSec && note.atSec + note.durSec >= endSec)

  /** Where in its pass a note starts: the same for every time a played-round note comes again. */
  const placeOf = (note: PhraseNote): number =>
    period === null ? note.atSec : note.atSec - period * Math.floor(note.atSec / period + 1e-9)
  const tick = (sec: number): number => Math.round(sec * 1e4)
  const pitch = (note: number): number => Math.round(note * 100)

  // The moments notes are struck at, in one pass, and the notes struck at each.
  const moments = new Map<number, Set<number>>()
  for (const note of sound.phrase.notes) {
    const at = tick(placeOf(note))
    const struck = moments.get(at) ?? new Set<number>()
    struck.add(pitch(note.note))
    moments.set(at, struck)
  }
  const times = [...moments.keys()].sort((a, b) => a - b)
  const lowest = Math.min(...sound.phrase.notes.map((note) => note.note))

  // Timing: every note struck at one moment moves with it, never as far as a third of the way to the next.
  const moved = new Map<number, number>()
  if (!held) {
    const first = times[0] / 1e4
    const final = times[times.length - 1] / 1e4
    times.forEach((at, index) => {
      const sec = at / 1e4
      if (sec < LEAD_SEC) return
      // The moments on either side: in a phrase played round, the last of the pass before and the first of the next.
      const round = period === null ? Infinity : period - final + first
      const before = index > 0 ? sec - times[index - 1] / 1e4 : round
      const after = index < times.length - 1 ? times[index + 1] / 1e4 - sec : round
      const room = Math.min(before, after)
      if (!(room > TOGETHER_SEC)) return
      const reach = Math.min(amount * VARIATION_LIMITS.timingSec, room / 3)
      const to = sec + swing(seed, TIMING, at) * reach
      // Never ahead of the attack; inside its pass where there are passes; and
      // in a sound that ends, the notes it ends on are never later, so it
      // still dies away inside its length.
      const latest =
        period !== null
          ? Math.max(sec, period - 0.02)
          : !loops && sec >= sound.durationSec * 0.75
            ? sec
            : Infinity
      moved.set(at, clamp(to, Math.min(sec, LEAD_SEC), latest) - sec)
    })
  }

  // Two neighbouring moments with one note each may change places: never the first, never the lowest note.
  const placed = new Map<string, number>()
  const single = times.filter((at) => moments.get(at)?.size === 1)
  if (!held && single.length >= 4) {
    for (let index = 1; index < single.length - 1; index += 1) {
      const [a, b] = [single[index], single[index + 1]]
      const [noteA] = moments.get(a) ?? []
      const [noteB] = moments.get(b) ?? []
      if (noteA === noteB || noteA === pitch(lowest) || noteB === pitch(lowest)) continue
      if (draw(seed, PLACES, a) >= amount * VARIATION_LIMITS.swap) continue
      placed.set(`${a}:${noteA}`, noteB / 100)
      placed.set(`${b}:${noteB}`, noteA / 100)
      index += 1
    }
  }

  // A held chord of three notes or more may ring with one upper note an octave away.
  let voiced: { from: number; to: number } | null = null
  if (held) {
    const chord = [...new Set(sound.phrase.notes.map((note) => pitch(note.note)))].sort(
      (a, b) => a - b,
    )
    if (chord.length >= 3 && draw(seed, VOICED) < amount * VARIATION_LIMITS.voicing) {
      const from = chord[1 + Math.floor(draw(seed, VOICE) * (chord.length - 1))]
      const up = draw(seed, UPWARD) < 0.5
      const free = (to: number): boolean =>
        to > chord[0] + 50 &&
        to >= LOWEST_NOTE * 100 &&
        to <= HIGHEST_NOTE * 100 &&
        chord.every((other) => Math.abs(other - to) > 50)
      const to = [from + (up ? 1200 : -1200), from + (up ? -1200 : 1200)].find(free)
      if (to !== undefined) voiced = { from, to }
    }
  }

  // A held chord is taken up later: another moment of whatever moves in its instrument.
  const later = held
    ? Math.round(amount * VARIATION_LIMITS.startSec * draw(seed, START) * 1e3) / 1e3
    : 0

  const played = sound.phrase.notes.map((note): PhraseNote => {
    const at = tick(placeOf(note))
    const from = pitch(note.note)
    const dur = Math.round(note.durSec * 1e3)
    let to = placed.get(`${at}:${from}`) ?? note.note
    if (from === voiced?.from) to = note.note + (voiced.to - voiced.from) / 100
    if (sound.tuning !== 'whole-cycles') {
      to += (amount * VARIATION_LIMITS.cents * swing(seed, TUNING, at, pitch(to))) / 100
    }
    const touch =
      2 ** ((amount * VARIATION_LIMITS.gainDb * swing(seed, TOUCH, at, from, dur)) / 6.0206)
    return {
      atSec: note.atSec + (moved.get(at) ?? 0),
      durSec: note.durSec + later,
      note: to,
      gain: (note.gain ?? DEFAULT_PHRASE_GAIN) * touch,
    }
  })
  // The hardest note is as hard as the sound's hardest was, so the touch is
  // one note against another and never the whole played harder or softer. An
  // instrument that answers to touch changes how much of it is attack, and a
  // render is brought to one peak level: a single piano note played 3 dB
  // softer came out 4.6 LU quieter. So a sound that is one note struck once
  // varies by its tuning alone.
  const hardest = (notes: readonly PhraseNote[]): number =>
    Math.max(...notes.map((note) => note.gain ?? DEFAULT_PHRASE_GAIN))
  const level = hardest(sound.phrase.notes) / hardest(played)
  const notes = played.map((note) => ({
    ...note,
    gain: clamp((note.gain ?? DEFAULT_PHRASE_GAIN) * level, 0.02, 1),
  }))

  return {
    ...sound,
    phrase: { ...sound.phrase, notes },
    ...(later > 0 ? { skipSec: skipSec + later } : {}),
  }
}
