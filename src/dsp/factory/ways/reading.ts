// A sound read into what a way works on, and a way's pass written back as a
// phrase. The reading is what `vary()` works out for itself (../vary.ts): a
// chord held through a loop, one pass of a phrase played round, or a phrase
// that ends. A rule gives back one pass, and laying it out repeats it for
// every pass the sound renders, so a take loops where its sound loops and is
// as long as it.

import { DEFAULT_PHRASE_GAIN, type PhraseNote } from '../../patch-render'
import { factoryTranspose, type FactoryKey } from '../key'
import { alongWhiteKeys, clamp, type VariedPlaying } from '../vary'
import { type Moment, type PassNote, type Reading } from './types'

/** A time as notes are told apart by it: ten-thousandths of a second. */
export const tick = (sec: number): number => Math.round(sec * 1e4)
/** A pitch as notes are told apart by it: cents. */
export const cents = (note: number): number => Math.round(note * 100)

/** The notes of a pass by the moment they are struck at, earliest first. */
function momentsOf(notes: readonly PassNote[], standing: number | null): Moment[] {
  const by = new Map<number, PassNote[]>()
  for (const note of notes) {
    const struck = by.get(tick(note.at))
    if (struck) struck.push(note)
    else by.set(tick(note.at), [note])
  }
  return [...by.values()]
    .sort((a, b) => a[0].at - b[0].at)
    .map((struck) => ({
      at: struck[0].at,
      notes: struck,
      standing: standing !== null && struck.some((note) => cents(note.note) === cents(standing)),
    }))
}

/** How many passes after the first a sound played round is written for. */
function passesOf(sound: VariedPlaying): number {
  const period = sound.durationSec
  return Math.max(...sound.phrase.notes.map((note) => Math.floor(note.atSec / period + 1e-9)))
}

export function readSound(sound: VariedPlaying): Reading {
  const written = sound.phrase.notes
  const skipSec = sound.skipSec ?? 0
  const crossfadeSec = sound.loopCrossfadeSec ?? 0
  const loops = Boolean(sound.loopCrossfadeSec)
  const endSec = skipSec + sound.durationSec + crossfadeSec
  const passSec = sound.durationSec
  const held =
    loops &&
    written.length > 0 &&
    written.every((note) => note.atSec <= skipSec && note.atSec + note.durSec >= endSec)
  const round = loops && !held

  const passOf = (note: PhraseNote): number => (round ? Math.floor(note.atSec / passSec + 1e-9) : 0)
  const inPass = (note: PhraseNote): PassNote => ({
    at: note.atSec - passSec * passOf(note),
    dur: note.durSec,
    note: note.note,
    gain: note.gain ?? DEFAULT_PHRASE_GAIN,
  })
  const passed = (pass: number): string =>
    written
      .filter((note) => passOf(note) === pass)
      .map(inPass)
      .map((note) => `${tick(note.at)}:${cents(note.note)}:${note.dur}:${note.gain}`)
      .join(' ')
  const first = round ? passed(0) : ''
  const regular =
    !round ||
    Array.from({ length: passesOf(sound) }, (_, pass) => passed(pass + 1)).every(
      (each) => each === first,
    )

  const notes = written.filter((note) => passOf(note) === 0).map(inPass)
  const fromAudio = sound.source !== undefined
  const pitched = !fromAudio && !sound.kit
  const chord = notes
    .map((note) => note.note)
    .sort((a, b) => a - b)
    .filter((note, index, all) => index === 0 || cents(note) !== cents(all[index - 1]))
  const standing = pitched && chord.length > 0 ? chord[0] : null
  const starts = notes.map((note) => note.at)
  return {
    shape: held ? 'held' : !round ? 'ended' : regular ? 'round' : 'irregular',
    notes,
    moments: momentsOf(notes, standing),
    chord,
    standing,
    upper: standing === null ? chord : chord.slice(1),
    pitched,
    fromAudio,
    timed: sound.bpm !== undefined,
    passSec,
    fromSec: held ? skipSec + crossfadeSec : starts.length > 0 ? Math.min(...starts) : 0,
    toSec: held ? skipSec + passSec : starts.length > 0 ? Math.max(...starts) : 0,
    endSec,
  }
}

/**
 * The sound with `pass` for its notes: once for a held chord or a phrase that
 * ends, and once for every pass that is rendered for a phrase played round.
 * The hardest note is as hard as the sound's hardest, as a variant's is: a
 * render is brought to one peak, so the touch of a take is one note against
 * another and never the whole played harder or softer.
 */
export function layOut<T extends VariedPlaying>(
  sound: T,
  reading: Reading,
  pass: readonly PassNote[],
): T {
  const hardest = Math.max(...sound.phrase.notes.map((note) => note.gain ?? DEFAULT_PHRASE_GAIN))
  // A pass with no note that sounds has no hardest note to bring to the sound's.
  const top = Math.max(...pass.map((note) => note.gain))
  const level = top > 0 ? hardest / top : 1
  const passes = reading.shape === 'round' ? passesOf(sound) : 0
  const notes: PhraseNote[] = []
  for (let index = 0; index <= passes; index += 1) {
    for (const note of pass) {
      notes.push({
        atSec: note.at + index * sound.durationSec,
        durSec: note.dur,
        note: note.note,
        gain: clamp(note.gain * level, 0.02, 1),
      })
    }
  }
  return { ...sound, phrase: { ...sound.phrase, notes } }
}

/**
 * A note `steps` along the key a sound is in. The bank is written on the
 * white keys, where a step is the next white key; a sound in another key is
 * brought to them, moved, and brought back.
 */
export function alongKey(note: number, steps: number, key?: FactoryKey): number {
  const moved = key ? factoryTranspose(key) : 0
  return alongWhiteKeys(note - moved, steps) + moved
}

/** What tells one pass of notes from another: when, which, how long and how hard. */
export function passKey(pass: readonly PassNote[]): string {
  return pass
    .map(
      (note) =>
        `${tick(note.at)}:${cents(note.note)}:${tick(note.dur)}:${Math.round(note.gain * 1e3)}`,
    )
    .sort()
    .join(' ')
}
