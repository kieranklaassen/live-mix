// The lexicon: what every preset of every effect is, in words and in tags,
// so that a chain can be drawn from recipes and still say truly what it is.
// One file per device (./<device id>.ts), written by hand from the device's
// own description, its preset values and the bench's table of every preset
// measured alone (../probe.test.ts).

/** The place in a chain a preset can take: what a recipe's slot asks for. */
export const ROLES = [
  /** A short space: a room, a booth, a chamber, a slap. Gone within a second or two. */
  'room',
  /** A long space: a hall, a plate, a cathedral, a wash. Rings for several seconds or more. */
  'hall',
  /** A space or a cloud whose tail has a pitch of its own: shimmer, bloom, a sung vowel, ringing strings. */
  'halo',
  /** Repeats that can be told apart. */
  'echo',
  /** Holds or replays what was played: a tape loop, a looper, a memory. */
  'loop',
  /** The mark of a medium: tape, a record, a radio, a starved stream, old converters. */
  'wear',
  /** Noise put under the sound. */
  'hiss',
  /** Saturation, an amplifier, a loudspeaker. */
  'drive',
  /** Slow movement, a cycle of half a second or longer: chorus, phaser, flanger, rotary, a pan, a sweeping filter. */
  'motion',
  /** Movement fast enough to be a rhythm: a tremolo, a chop, steps. */
  'pulse',
  /** Copies at another pitch: octaves, a harmoniser, half speed, a frequency shift. */
  'pitch',
  /** Grains, glitches, cascades, a smeared spectrum. */
  'grain',
  /** Sustains what is played as a bed under it: a sustainer, a pad that follows, a freeze. */
  'hold',
  /** Takes attacks away, or rides the level over seconds. */
  'swell',
  /** An equaliser or a filter that stands still. */
  'tone',
  /** Stereo width, a detuned double. */
  'width',
  /** Gentle compression. */
  'glue',
  /** A limiter, last on a chain. */
  'ceiling',
] as const
export type Role = (typeof ROLES)[number]

/** How a preset sounds, as far as its values and its measurements bear out: what a pack leans to or away from. */
export const TRAITS = [
  /** What it adds or leaves is dull on top / has treble to spare. */
  'dark',
  'bright',
  /** Weight in the low mids, soft saturation / thin, glassy, metallic. */
  'warm',
  'cold',
  /** Rings or repeats for more than about six seconds / is over within a second. */
  'long',
  'short',
  /** Moves or arrives over seconds / several times a second. */
  'slow',
  'fast',
  /** Spreads the sound out / pulls it to the middle. */
  'wide',
  'narrow',
  /** Leaves no dirt of its own / degrades: dull, unsteady, dropping out. */
  'clean',
  'worn',
  /** Adds hiss, crackle, hum or static that can be heard. */
  'noisy',
  /** A hint: the dry sound is nearly all of it / the dry sound is hard to find in it. */
  'faint',
  'heavy',
  /** Adds or leans to the octave below / the octave above. */
  'low',
  'high',
  /** Atonal, broken or odd: not for a gentle pack. */
  'strange',
  /** Pitch that wobbles or drifts. */
  'unsteady',
  /** Pushes the source back: distant. */
  'far',
  /** Plays backwards. */
  'backwards',
  /** Holds without end. */
  'frozen',
  /**
   * Fit to stand on a whole mix, last of all: it takes no low end away and no
   * top, moves no band by more than a couple of decibels, does not pump or
   * breathe, folds nothing to mono and adds nothing that is heard as an effect.
   */
  'whole',
] as const
export type Trait = (typeof TRAITS)[number]

/** One preset of a device as a chain can use it. */
export interface Voice {
  /**
   * What it is, as a noun phrase a sentence can be built from: lower case,
   * with its article, no full stop, at most 60 characters. "a tape loop that
   * wears thin on every pass", "three long springs that drip".
   */
  says: string
  /** The same in at most 28 characters, for a chain of several effects: "a wearing tape loop". */
  brief: string
  /**
   * One to three plain nouns a chain led by this preset can be named for:
   * lower case, one word each, at most 9 letters. "loop", "reel".
   */
  nouns: readonly string[]
  /** The slots it can fill, the one it fills best first. Empty when it is not for a chain; then `skip` says why. */
  roles: readonly Role[]
  traits: readonly Trait[]
  /** Why it is left out: it needs a key signal, it does nothing, it is silent or grows by itself. */
  skip?: string
}

/** How a chain's level is brought inside the limits with one of this device's own controls. */
export interface Trim {
  param: string
  /** `'db'`: decibels of output. `'mix'`: a wet share from 0 to 1 (or 0 to 100), turned down only. */
  kind: 'db' | 'mix'
}

export interface DeviceLexicon {
  /** `DeviceDescriptor.id`. */
  device: string
  /**
   * Parameters a seed may move by up to an eighth either way without making
   * a voice's words untrue: times, lengths and rates, never a switch, a mix
   * or a pitch.
   */
  jitter: readonly string[]
  /** The controls that set its level, the one to reach for first. */
  trim: readonly Trim[]
  /** Every preset the device lists, by name. */
  voices: Readonly<Record<string, Voice>>
}

export const VOICE_LIMITS = { says: 60, brief: 28, noun: 9, nouns: 3 } as const
