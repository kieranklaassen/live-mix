// Counting: which moments of a phrase sound on which turn, by count. These
// ways change when the notes of a phrase sound and never which notes: on each
// turn some moments of the pass rest and the others are as written. So they
// play a beat on a kit and a sound made of another sound's audio as they play
// a phrase of pitches, and none of them plays a held chord. The first moment
// of a pass always sounds, and so does every moment that holds the note the
// sound stands on: a way of this family counts the others.

import { VARIATION_LIMITS, mod } from '../vary'
import { PHRASE_NEEDS, REFUSALS, fitsPhrase, gcd, isPhrase, mayRest, resting } from './pass'
import { MOST_TAKES } from './takes'
import { type Turn, type Way } from './types'

/** The counts the moments of a phrase take in Counted rests, by their place. */
const COUNTS = [1, 2, 3, 2]
/** How many turns Sliding window takes to come round. */
const WINDOWS = 4

export const COUNTING: readonly Way[] = [
  {
    id: 'counted-rests',
    name: 'Counted rests',
    family: 'counting',
    words:
      'Each moment of the phrase has a count of 1, 2, 3 or 2, by its place. It sounds on every turn its count divides and rests on the others, so the first turn is the phrase as written and it all comes round after six. The first moment and the note the sound stands on always sound.',
    needs: PHRASE_NEEDS,
    far: {
      words: 'How many of the moments count. The others sound on every turn.',
      default: 0.5,
    },
    fits: fitsPhrase,
    play: (reading, { turn, far }: Turn) => {
      const counted = mayRest(reading).filter((place) => COUNTS[place % COUNTS.length] > 1)
      // A share of them, spread evenly and ending on the last. Started on the first, half
      // the moments of a short phrase would all have a count of 2, and its round would be
      // two takes where both counts give it four.
      const share = Math.max(1, Math.round(far * counted.length))
      const counts = new Map(
        counted
          .filter((_, index) => mod((index + 1) * share, counted.length) < share)
          .map((place) => [place, COUNTS[place % COUNTS.length]]),
      )
      return resting(reading, (place) => turn % (counts.get(place) ?? 1) !== 0)
    },
  },
  {
    id: 'leave-one-out',
    name: 'Leave one out',
    family: 'counting',
    words:
      'One moment of the phrase rests each turn, the next one along each time. In a long phrase eight moments take their turn, spread through it. The first moment and the note the sound stands on always sound.',
    needs: PHRASE_NEEDS,
    far: { words: 'Past half, two moments rest each turn.', default: 0.25 },
    fits: fitsPhrase,
    play: (reading, { turn, far }: Turn) => {
      const may = mayRest(reading)
      // No more moments take a turn than a round has takes, so the round is whole.
      const visits =
        may.length <= MOST_TAKES
          ? may
          : Array.from(
              { length: MOST_TAKES },
              (_, index) => may[Math.floor((index * may.length) / MOST_TAKES)],
            )
      // The second to rest is just under half a round on, so no two turns rest the same pair.
      const on = far > 0.5 ? Math.floor((visits.length - 1) / 2) : 0
      const gone = [visits[turn % visits.length], visits[(turn + on) % visits.length]]
      return resting(reading, (place) => gone.includes(place))
    },
  },
  {
    id: 'turning-rests',
    name: 'Turning rests',
    family: 'counting',
    words:
      'Rests spread as evenly through the phrase as they go, and the whole spread moves on a place each turn, or a few places in a long phrase. The first moment and the note the sound stands on always sound.',
    needs: PHRASE_NEEDS,
    far: { words: 'The share of the moments that rests, up to two in five.', default: 0.5 },
    fits: fitsPhrase,
    play: (reading, { turn, far }: Turn) => {
      const count = reading.moments.length
      const share = VARIATION_LIMITS.rests * count
      const rests = Math.min(Math.floor(share), Math.max(1, Math.round(far * share)))
      const sounding = count - rests
      // The spread is itself again after `period` places. Where that is more turns than a
      // round has takes, it moves on by the fewest places that bring it round in time; a
      // spread that no such step brings round moves on one place, and its round is cut.
      const period = count / gcd(rests, count)
      let step = 1
      while (step < period && period / gcd(step, period) > MOST_TAKES) step += 1
      const turned = turn * (step < period ? step : 1)
      // A moment rests where `vary()`'s pattern rests it (../vary.ts), `turned` places on.
      return resting(reading, (place) => mod((place - turned) * sounding, count) >= sounding)
    },
  },
  {
    id: 'sliding-window',
    name: 'Sliding window',
    family: 'counting',
    words:
      'A window of the phrase sounds and what is outside it rests. The window moves on by a quarter of the phrase each turn and comes round after four. The first moment and the note the sound stands on always sound.',
    needs: 'A phrase or a beat of eight moments',
    far: {
      words: 'The size of the window: a quarter of the phrase, up to three quarters.',
      default: 0.5,
    },
    fits: (reading) => {
      if (!isPhrase(reading)) return REFUSALS.notPhrase
      return reading.moments.length >= 8 ? null : 'Needs a phrase of eight moments.'
    },
    play: (reading, { turn, far }: Turn) => {
      const count = reading.moments.length
      const size = Math.round((0.25 + 0.5 * far) * count)
      const from = Math.floor(((turn % WINDOWS) * count) / WINDOWS)
      return resting(reading, (place) => mod(place - from, count) >= size)
    },
  },
]
