// A variant of a sound: the same recipe played once more, differently. There
// are four kinds of difference, each with an amount of its own from 0 (none)
// to 1:
//
//   chords   which chord of the key the sound plays: all of it moved to a
//            chord a third, a fourth or a step away, by a weighted choice;
//            one note of a chord, or of a phrase, an octave away
//   speed    how fast a phrase is played: anywhere from half to twice as
//            fast, and a phrase that is played round at half or double time
//   pattern  which notes of a phrase sound and in what order: rests spread
//            evenly through it (a Euclidean rhythm), neighbours changing
//            places; a held chord with one of its upper notes left out
//   touch    the hand: each note a little harder or softer, early or late,
//            a few cents off; a held chord taken up at another moment
//
// The instrument, its settings, the effects and the lengths stay, so a
// variant is as long as the sound, loops where the sound loops and starts on
// its attack where the sound does. It is in the key the sound is in: every
// factory sound is written on the white keys (./key.ts), a chord is moved
// along them, and so a variant is made of the sound as written and
// transposed afterwards.
//
// A sound that keeps time (one with a `bpm`) stays on its beat: its hand is
// a few hundredths of a second loose at most, and its speed is half or double
// time. A sound played on a kit (./kits.ts) has drums for keys, so no chord
// of the key and no tuning by the hand: its pattern and its touch vary.
//
// A variant is decided by a seed and the amounts and by nothing else: the
// same ones always give the same recipe, so a host that keeps them has kept
// the variant. Everything is drawn from a note's own place in the phrase,
// never from a running count, and a phrase that is played round (`cycled`)
// is varied as one pass and laid out again for every pass, so the loop still
// meets itself.

import { DEFAULT_PHRASE_GAIN, type LoopFold, type Phrase, type PhraseNote } from '../patch-render'

/** The kinds of difference between a variant and its sound. A new kind is a new name here. */
export const VARIATION_KINDS = ['chords', 'speed', 'pattern', 'touch'] as const
export type VariationKind = (typeof VARIATION_KINDS)[number]

/** Which variant of a sound, and how far it is from the sound as written, kind by kind. */
export interface SoundVariation extends Partial<Record<VariationKind, number>> {
  /** Any whole number: one seed is one variant, always the same one. */
  seed: number
  /**
   * 0 to 1, for every kind that is not given an amount of its own. At 0 in
   * every kind the variant is the sound itself; at 1 it is as far from it as
   * a variant goes.
   */
  amount?: number
  /**
   * The chord of the key the sound is played on, said and not drawn: steps
   * along the white keys from where it is written, −3 to 3 (−2 is a third
   * down, 3 a fourth up, 0 the chord it is written on). Given, the seed and
   * the amount of `chords` no longer choose the chord, at any amount; they
   * still choose what else the kind does (a note an octave away). A chord
   * the sound cannot stand on (`chordMoves` lists the ones it can) leaves it
   * where it is written. Absent, the chord is drawn as it always was.
   */
  chord?: number
}

/** What a variant may change, each at an amount of 1 in its kind. Less in proportion below that. */
export const VARIATION_LIMITS = {
  /** Chords: the chance that the sound is played on another chord of the key. */
  chord: 0.75,
  /** Chords: the chance that one upper note of a chord moves an octave. */
  voicing: 0.4,
  /** Chords: the chance, for each single note of a phrase, that it is played an octave away. */
  octave: 0.2,
  /** Speed: how far from its own speed a phrase that ends is played, in octaves (1 is half to twice as fast). */
  speedOctaves: 1,
  /** Speed: the chance that a phrase played round is played at half or at double time. */
  doubling: 0.5,
  /** Pattern: the share of a phrase's moments that rest. */
  rests: 0.4,
  /** Pattern: the chance that two neighbouring single notes of a phrase change places. */
  swap: 0.35,
  /** Pattern: the chance that a held chord sounds without one of its upper notes. */
  thin: 0.4,
  /** Touch: how early or late a note may be, seconds; never more than a third of the way to the next one. */
  timingSec: 0.12,
  /** Touch: the same for a sound that keeps time, where more than this is a note off the beat. */
  beatTimingSec: 0.01,
  /** Touch: how much harder or softer a note may be played against the others, dB. */
  gainDb: 3,
  /** Touch: how far off pitch a note may be, cents. Not for a sound tuned to whole cycles. */
  cents: 7,
  /** Touch: how much later a held chord may be taken up, seconds. */
  startSec: 4,
} as const

/**
 * The chords a sound may be moved to, as steps along the white keys from
 * where it is written, and how likely each is against the others. A third
 * away shares two notes of a triad and a fourth one, so those come first; a
 * step away shares none and comes in only at the larger amounts.
 */
const CHORD_STEPS: readonly { steps: number; weight: number }[] = [
  { steps: -2, weight: 4 },
  { steps: 2, weight: 3 },
  { steps: 3, weight: 3 },
  { steps: -3, weight: 3 },
  { steps: 1, weight: 1 },
  { steps: -1, weight: 1 },
]

/** A note this near the start of a sound is its attack, and stays where it is. */
const LEAD_SEC = 0.03
/** Notes this near each other in time are struck together. */
const TOGETHER_SEC = 1e-4
const LOWEST_NOTE = 24
const HIGHEST_NOTE = 96
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]

/** The chords a sound can be asked onto by name (`SoundVariation.chord`), as steps from its own. */
const NAMED_CHORD_STEPS = [-3, -2, -1, 1, 2, 3] as const

/** The part of a sound a variant reads: what a factory sound and a generated one share. */
export interface VariedPlaying {
  phrase: Phrase
  durationSec: number
  skipSec?: number
  loopCrossfadeSec?: number
  loopFold?: LoopFold
  tuning?: 'whole-cycles'
  /** A sound made of another one plays that one's audio: its notes are how far the audio is moved, so no chord of the key. */
  source?: string
  /** The tempo a sound that keeps time is written at: its notes stay near where they are written. */
  bpm?: number
  /** A sound played on a kit: its keys are drums, so no chord of the key and no note an octave away. */
  kit?: boolean
}

/** What a variant does to its sound, for whoever wants to say so. Every count is of one pass. */
export interface VariantChanges {
  /** How many steps along the white keys the sound is moved: -2 is a third down, 3 a fourth up, 0 its own chord. */
  chordSteps: number
  /** How many notes are played an octave from where they are written. */
  octaves: number
  /** How fast it is played against the sound: 2 is twice as fast, 1 its own speed. */
  rate: number
  /** How many of the sound's notes do not sound. */
  rests: number
  /** How many pairs of notes changed places. */
  swaps: number
  /** How much later a held chord is taken up, seconds. */
  laterSec: number
}

const NO_CHANGES: VariantChanges = {
  chordSteps: 0,
  octaves: 0,
  rate: 1,
  rests: 0,
  swaps: 0,
  laterSec: 0,
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

const mod = (value: number, by: number): number => ((value % by) + by) % by

/** What is drawn from, so no two draws of a variant are the same one. */
const TIMING = 1
const TOUCH = 2
const TUNING = 3
const PLACES = 4
const VOICE = 5
const VOICED = 6
const UPWARD = 7
const START = 8
const CHORD = 9
const CHORD_TO = 10
const OCTAVE = 11
const OCTAVE_UP = 12
const SPEED = 13
const SPEED_WAY = 14
const RESTS = 15
const THIN = 16
const THINNED = 17

/** The amount of each kind a variation asks for, 0 to 1. */
export function variationAmounts(variation?: SoundVariation): Record<VariationKind, number> {
  const amount = (value: number | undefined): number => {
    const given = value ?? variation?.amount ?? 0
    return given > 0 ? Math.min(1, given) : 0
  }
  return {
    chords: amount(variation?.chords),
    speed: amount(variation?.speed),
    pattern: amount(variation?.pattern),
    touch: amount(variation?.touch),
  }
}

/** A note `steps` along the white keys from where it is; a black key goes with the white key under it. */
function alongWhiteKeys(note: number, steps: number): number {
  const whole = Math.round(note)
  const pitchClass = mod(whole, 12)
  const sharp = WHITE_KEYS.includes(pitchClass) ? 0 : 1
  const to = WHITE_KEYS.indexOf(pitchClass - sharp) + steps
  const octaves = Math.floor(to / 7)
  return whole - pitchClass + octaves * 12 + WHITE_KEYS[to - octaves * 7] + sharp + (note - whole)
}

/** Steps along the white keys brought to the nearest way there: −3 to 3. */
function nearestSteps(steps: number): number {
  return mod(Math.round(steps) + 3, 7) - 3
}

/**
 * How far a sound's written notes move to stand on the chord `steps` away:
 * that many steps along the white keys, or the same chord an octave the
 * other way where the near one leaves the range. Null where neither fits,
 * and for the chord on B, the one white key with no fifth above it. Asked of
 * the notes as written, so the answer is the same for every seed.
 */
function namedChordSteps(written: readonly PhraseNote[], steps: number): number | null {
  const near = nearestSteps(steps)
  if (near === 0) return 0
  for (const by of [near, near > 0 ? near - 7 : near + 7]) {
    const moved = written.map((note) => alongWhiteKeys(note.note, by))
    const low = Math.min(...moved)
    if (
      mod(Math.round(low), 12) !== 11 &&
      low >= LOWEST_NOTE &&
      Math.max(...moved) <= HIGHEST_NOTE
    ) {
      return by
    }
  }
  return null
}

/**
 * The white key a sound stands on, 0 for C to 6 for B: its lowest written
 * note, a black key counted with the white key under it. A host names the
 * chord a sound is on by it, in whatever key the sound is played. Null for
 * a sound with no notes, for one made of another sound's audio (`source`),
 * whose notes say how far that audio is moved, and for one played on a kit,
 * whose notes say which drum.
 */
export function soundDegree(sound: VariedPlaying): number | null {
  if (sound.source !== undefined || sound.kit || sound.phrase.notes.length === 0) return null
  const low = Math.round(Math.min(...sound.phrase.notes.map((note) => note.note)))
  const pitchClass = mod(low, 12)
  return WHITE_KEYS.indexOf(pitchClass - (WHITE_KEYS.includes(pitchClass) ? 0 : 1))
}

/**
 * The chords a sound can be put on by name (`SoundVariation.chord`), as
 * steps from the one it is written on, nearest first: every chord of the
 * key but its own, the one on B, and any that would take it out of range.
 * None for a sound that has no chord of its own to move.
 */
export function chordMoves(sound: VariedPlaying): number[] {
  if (soundDegree(sound) === null) return []
  return NAMED_CHORD_STEPS.filter(
    (steps) => namedChordSteps(sound.phrase.notes, steps) !== null,
  ).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b)
}

/** A note of one pass as it is being varied, with what it was written as: its draws are from that. */
interface Hit {
  at: number
  dur: number
  note: number
  gain: number
  /** Where it was written, in ten-thousandths of a second from the start of its pass. */
  from: number
  /** What it was written as, in cents. */
  pitch: number
  /** Which time through the pass this is, where a pass is played twice in its length. */
  turn: number
}

/** The notes that are struck together, earliest first. */
function momentsOf(hits: readonly Hit[]): Hit[][] {
  const by = new Map<number, Hit[]>()
  for (const hit of hits) {
    const key = hit.from * 2 + hit.turn
    const struck = by.get(key)
    if (struck) struck.push(hit)
    else by.set(key, [hit])
  }
  return [...by.values()].sort((a, b) => a[0].at - b[0].at)
}

function vary<T extends VariedPlaying>(
  sound: T,
  variation?: SoundVariation,
): { sound: T; changes: VariantChanges } {
  const amount = variationAmounts(variation)
  // A chord asked for by name, on a sound that has one to move: how far its notes go, or null where it cannot stand there.
  const named =
    variation?.chord !== undefined &&
    Number.isFinite(variation.chord) &&
    sound.source === undefined &&
    !sound.kit
      ? namedChordSteps(sound.phrase.notes, variation.chord)
      : undefined
  if (
    !variation ||
    sound.phrase.notes.length === 0 ||
    (!VARIATION_KINDS.some((kind) => amount[kind] > 0) && !named)
  ) {
    return { sound, changes: NO_CHANGES }
  }
  const { seed } = variation
  const changes = { ...NO_CHANGES }
  const written = sound.phrase.notes

  const skipSec = sound.skipSec ?? 0
  const loops = Boolean(sound.loopCrossfadeSec)
  const endSec = skipSec + sound.durationSec + (sound.loopCrossfadeSec ?? 0)
  const tick = (sec: number): number => Math.round(sec * 1e4)
  const cents = (note: number): number => Math.round(note * 100)

  // A chord held through everything that is rendered: the loop is a stretch of it.
  const held =
    loops && written.every((note) => note.atSec <= skipSec && note.atSec + note.durSec >= endSec)
  // A phrase played round: its notes come again every `durationSec`, the same
  // in every pass. The fold is only how the seam is mixed, so a round phrase
  // folded at equal power is still a pass repeated.
  const round = loops && !held ? sound.durationSec : null
  const passOf = (note: PhraseNote): number =>
    round === null ? 0 : Math.floor(note.atSec / round + 1e-9)
  const placeOf = (note: PhraseNote): number =>
    round === null ? note.atSec : note.atSec - round * passOf(note)
  const passes = round === null ? 0 : Math.max(...written.map(passOf))
  const passed = (pass: number): string =>
    written
      .filter((note) => passOf(note) === pass)
      .map((note) => `${tick(placeOf(note))}:${cents(note.note)}:${note.durSec}:${note.gain}`)
      .join(' ')
  // Written some other way than a pass repeated: its notes are varied where they stand.
  const regular =
    round === null ||
    Array.from({ length: passes }, (_, pass) => passed(pass + 1)).every((p) => p === passed(0))
  const period = regular ? round : null

  // Where the notes fall may change: not in a held chord, and not in a pass that is not repeated.
  const laid = !held && regular

  let hits: Hit[] = written
    .filter((note) => period === null || passOf(note) === 0)
    .map((note) => ({
      at: placeOf(note),
      dur: note.durSec,
      note: note.note,
      gain: note.gain ?? DEFAULT_PHRASE_GAIN,
      from: tick(placeOf(note)) + (regular ? 0 : passOf(note) * 7919),
      pitch: cents(note.note),
      turn: 0,
    }))
  const lowest = Math.min(...hits.map((hit) => hit.pitch))
  const pitches = (): number[] => [...new Set(hits.map((hit) => hit.pitch))].sort((a, b) => a - b)
  /** One chord and nothing else: held through a loop, or struck once. */
  const chord = held || momentsOf(hits).length === 1

  // --- Speed ---------------------------------------------------------------------------
  if (amount.speed > 0 && laid) {
    if (period !== null) {
      // Played round: half or double time, which still comes round. A pass
      // that starts on its attack (a pluck written a moment in, so the loop's
      // seam is clear of it) keeps that start: the time is counted from it.
      if (draw(seed, SPEED) < amount.speed * VARIATION_LIMITS.doubling) {
        const first = Math.min(...hits.map((hit) => hit.at))
        if (draw(seed, SPEED_WAY) < 0.5) {
          // So does one that double time would bring into that moment: a
          // first note written just clear of it never comes ahead of it.
          const lead = first / 2 < LEAD_SEC ? first : 0
          hits = [0, 1].flatMap((turn) =>
            hits.map((hit) => ({
              ...hit,
              at: lead + (hit.at - lead) / 2 + (turn * period) / 2,
              dur: hit.dur / 2,
              turn,
            })),
          )
          changes.rate = 2
        } else {
          const lead = first < LEAD_SEC ? first : 0
          const firstHalf = hits.filter((hit) => hit.at - lead < period / 2 - TOGETHER_SEC)
          if (firstHalf.length > 0 && firstHalf.length < hits.length) {
            hits = firstHalf.map((hit) => ({
              ...hit,
              at: lead + (hit.at - lead) * 2,
              dur: hit.dur * 2,
            }))
            changes.rate = 0.5
          }
        }
      }
    } else if (!loops) {
      // A phrase that ends: faster or slower from its first note on. Slower,
      // it stops where the sound's last note was, so it dies away as the sound does.
      const first = Math.min(...hits.map((hit) => hit.at))
      const last = Math.max(...hits.map((hit) => hit.at))
      const release = Math.max(...hits.map((hit) => hit.at + hit.dur))
      if (last - first > TOGETHER_SEC) {
        const rate = 2 ** (swing(seed, SPEED) * amount.speed * VARIATION_LIMITS.speedOctaves)
        hits = hits
          .map((hit) => {
            const at = first + (hit.at - first) / rate
            return { ...hit, at, dur: Math.max(0.01, Math.min(hit.dur / rate, release - at)) }
          })
          .filter((hit) => hit.at <= last + TOGETHER_SEC)
        changes.rate = Math.round(rate * 1e3) / 1e3
      }
    }
  }

  // --- Pattern -------------------------------------------------------------------------
  if (amount.pattern > 0) {
    if (chord) {
      // A chord of three notes or more may sound without one of its upper notes.
      const upper = pitches().slice(1)
      if (upper.length >= 2 && draw(seed, THINNED) < amount.pattern * VARIATION_LIMITS.thin) {
        const gone = upper[Math.floor(draw(seed, THIN) * upper.length)]
        hits = hits.filter((hit) => hit.pitch !== gone)
      }
    } else if (laid) {
      // Rests, spread as evenly through the phrase as they go (a Euclidean
      // rhythm), turned so that the first moment sounds. The lowest note,
      // which the sound stands on, sounds wherever it comes.
      const moments = momentsOf(hits)
      const count = moments.length
      const resting = Math.min(
        count - 2,
        Math.round(amount.pattern * VARIATION_LIMITS.rests * count),
      )
      if (count >= 4 && resting > 0) {
        const sounding = count - resting
        const sounds = (index: number): boolean => mod(index * sounding, count) < sounding
        const starts = moments.map((_, index) => index).filter(sounds)
        const turned = starts[Math.floor(draw(seed, RESTS) * starts.length)]
        hits = moments.flatMap((struck, index) =>
          sounds(index + turned) || struck.some((hit) => hit.pitch === lowest) ? struck : [],
        )
      }
      // Two neighbouring moments with one note each may change places: never the first, never the lowest note.
      const single = momentsOf(hits).filter((struck) => struck.length === 1)
      if (single.length >= 4) {
        for (let index = 1; index < single.length - 1; index += 1) {
          const [a] = single[index]
          const [b] = single[index + 1]
          if (a.pitch === b.pitch || a.pitch === lowest || b.pitch === lowest) continue
          if (draw(seed, PLACES, a.from, a.turn) >= amount.pattern * VARIATION_LIMITS.swap) continue
          ;[a.note, b.note] = [b.note, a.note]
          changes.swaps += 1
          index += 1
        }
      }
    }
  }

  // --- Chords --------------------------------------------------------------------------
  if (named !== undefined) {
    // The chord was said: the sound is on it, whatever the seed would have drawn.
    if (named) {
      for (const hit of hits) hit.note = alongWhiteKeys(hit.note, named)
      changes.chordSteps = named
    }
  }
  if (amount.chords > 0 && sound.source === undefined && !sound.kit) {
    // The sound on another chord of the key: every note the same number of
    // steps along the white keys. Never one that stands on B, the one white
    // key with no fifth above it.
    if (named === undefined && draw(seed, CHORD) < amount.chords * VARIATION_LIMITS.chord) {
      const near = CHORD_STEPS.slice(0, amount.chords < 1 / 3 ? 2 : amount.chords < 2 / 3 ? 4 : 6)
      const fits = near.filter(({ steps }) => {
        const moved = hits.map((hit) => alongWhiteKeys(hit.note, steps))
        const low = Math.min(...moved)
        return (
          mod(Math.round(low), 12) !== 11 &&
          low >= LOWEST_NOTE &&
          Math.max(...moved) <= HIGHEST_NOTE
        )
      })
      const weight = fits.reduce((sum, each) => sum + each.weight, 0)
      let at = draw(seed, CHORD_TO) * weight
      const to = fits.find((each) => (at -= each.weight) < 0)
      if (to) {
        for (const hit of hits) hit.note = alongWhiteKeys(hit.note, to.steps)
        changes.chordSteps = to.steps
      }
    }
    const floor = Math.min(...hits.map((hit) => hit.note))
    const free = (to: number, but: Hit): boolean =>
      to > floor + 0.5 &&
      to >= LOWEST_NOTE &&
      to <= HIGHEST_NOTE &&
      hits.every((other) => other === but || Math.abs(other.note - to) > 0.5)
    if (chord) {
      // A chord of three notes or more may ring with one upper note an octave away.
      const upper = pitches().slice(1)
      if (upper.length >= 2 && draw(seed, VOICED) < amount.chords * VARIATION_LIMITS.voicing) {
        const moving = upper[Math.floor(draw(seed, VOICE) * upper.length)]
        const up = draw(seed, UPWARD) < 0.5 ? 12 : -12
        for (const hit of hits.filter((each) => each.pitch === moving)) {
          const to = [hit.note + up, hit.note - up].find((each) => free(each, hit))
          if (to === undefined) continue
          hit.note = to
          changes.octaves += 1
        }
      }
    } else if (laid) {
      // A single note of a phrase may be played an octave away: never the first, never the lowest.
      for (const struck of momentsOf(hits).slice(1)) {
        if (struck.length !== 1 || struck[0].pitch === lowest) continue
        const [hit] = struck
        if (draw(seed, OCTAVE, hit.from, hit.turn) >= amount.chords * VARIATION_LIMITS.octave) {
          continue
        }
        const up = draw(seed, OCTAVE_UP, hit.from, hit.turn) < 0.5 ? 12 : -12
        const to = [hit.note + up, hit.note - up].find((each) => free(each, hit))
        if (to === undefined) continue
        hit.note = to
        changes.octaves += 1
      }
    }
  }

  // --- Touch ---------------------------------------------------------------------------
  let later = 0
  if (amount.touch > 0) {
    if (laid) {
      // Timing: every note struck at one moment moves with it, never as far as a third of the way to the next.
      const moments = momentsOf(hits)
      const first = moments[0][0].at
      const final = moments[moments.length - 1][0].at
      const moved = moments.map((struck, index): number => {
        const sec = struck[0].at
        if (sec < LEAD_SEC) return 0
        // The moments on either side: in a phrase played round, the last of the pass before and the first of the next.
        const around = period === null ? Infinity : period - final + first
        const before = index > 0 ? sec - moments[index - 1][0].at : around
        const after = index < moments.length - 1 ? moments[index + 1][0].at - sec : around
        const room = Math.min(before, after)
        if (!(room > TOGETHER_SEC)) return 0
        const loose =
          sound.bpm === undefined ? VARIATION_LIMITS.timingSec : VARIATION_LIMITS.beatTimingSec
        const reach = Math.min(amount.touch * loose, room / 3)
        const to = sec + swing(seed, TIMING, struck[0].from, struck[0].turn) * reach
        // Never ahead of the attack; inside its pass where there are passes; and
        // in a sound that ends, the notes it ends on are never later, so it
        // still dies away inside its length.
        const latest =
          period !== null
            ? Math.max(sec, period - 0.02)
            : !loops && sec >= sound.durationSec * 0.75
              ? sec
              : Infinity
        return clamp(to, Math.min(sec, LEAD_SEC), latest) - sec
      })
      moments.forEach((struck, index) => {
        for (const hit of struck) hit.at += moved[index]
      })
    }
    for (const hit of hits) {
      if (sound.tuning !== 'whole-cycles' && !sound.kit) {
        const off = swing(seed, TUNING, hit.from, hit.pitch, hit.turn)
        hit.note += (amount.touch * VARIATION_LIMITS.cents * off) / 100
      }
      const touch = swing(seed, TOUCH, hit.from, hit.pitch, Math.round(hit.dur * 1e3), hit.turn)
      hit.gain *= 2 ** ((amount.touch * VARIATION_LIMITS.gainDb * touch) / 6.0206)
    }
    // A held chord is taken up later: another moment of whatever moves in its instrument.
    if (held) {
      later = Math.round(amount.touch * VARIATION_LIMITS.startSec * draw(seed, START) * 1e3) / 1e3
    }
  }

  // The hardest note is as hard as the sound's hardest was, so the touch is
  // one note against another and never the whole played harder or softer. An
  // instrument that answers to touch changes how much of it is attack, and a
  // render is brought to one peak level: a single piano note played 3 dB
  // softer came out 4.6 LU quieter. So a sound that is one note struck once
  // varies by its tuning alone.
  const hardest = Math.max(...written.map((note) => note.gain ?? DEFAULT_PHRASE_GAIN))
  const level = hardest / Math.max(...hits.map((hit) => hit.gain))
  const notes: PhraseNote[] = []
  for (let pass = 0; pass <= (period === null ? 0 : passes); pass += 1) {
    for (const hit of hits) {
      notes.push({
        atSec: hit.at + (period === null ? 0 : pass * period),
        durSec: hit.dur + later,
        note: hit.note,
        gain: clamp(hit.gain * level, 0.02, 1),
      })
    }
  }
  if (!regular && round !== null) {
    // Varied where they stand: each note back in the pass it was written in.
    notes.forEach((note, index) => {
      note.atSec += passOf(written[index]) * round
    })
  }
  const inOnePass = period === null ? written.length : written.filter((n) => passOf(n) === 0).length
  changes.rests = Math.max(0, inOnePass * (changes.rate === 2 ? 2 : 1) - hits.length)
  changes.laterSec = later

  // A kind that has nothing to work on (the speed of a held chord) leaves the sound as it is: the same object.
  const same =
    later === 0 &&
    notes.length === written.length &&
    notes.every((note, index) => {
      const from = written[index]
      return (
        note.atSec === from.atSec &&
        note.durSec === from.durSec &&
        note.note === from.note &&
        note.gain === (from.gain ?? DEFAULT_PHRASE_GAIN)
      )
    })
  if (same) return { sound, changes: NO_CHANGES }

  return {
    sound: {
      ...sound,
      phrase: { ...sound.phrase, notes },
      ...(later > 0 ? { skipSec: skipSec + later } : {}),
    },
    changes,
  }
}

/**
 * The variant of `sound` that `variation` names. Without one, or at an amount
 * of 0 in every kind, the sound itself comes back, the same object: nothing
 * about it is rendered differently. A factory sound is varied as it is
 * written and transposed afterwards (`renderFactorySound` does both).
 */
export function varySound<T extends VariedPlaying>(sound: T, variation?: SoundVariation): T {
  return vary(sound, variation).sound
}

/** What `varySound` does to this sound with this variation, in numbers: which chord, how fast, how many rests. */
export function describeVariant(sound: VariedPlaying, variation?: SoundVariation): VariantChanges {
  return vary(sound, variation).changes
}
