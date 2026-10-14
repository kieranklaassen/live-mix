// What every take of every way is held to, whatever the way: the sound's
// lengths and loop, its key, the note it stands on, the level of its hardest
// note and the attack it starts on. Each way's own business is its family's
// test; this is the list they all share.

import { DEFAULT_PHRASE_GAIN, type PhraseNote } from '../../patch-render'
import { FACTORY_SOUNDS } from '../sounds'
import { type FactoryKey, factoryTranspose } from '../key'
import { type VariedPlaying } from '../vary'
import { playSound, wayTakes, type WayPlaying } from '../ways'
import { cents, tick } from '../ways/reading'

const WHITE = [0, 2, 4, 5, 7, 9, 11]
const first = (notes: readonly PhraseNote[]): number => Math.min(...notes.map((note) => note.atSec))
const last = (notes: readonly PhraseNote[]): number => Math.max(...notes.map((note) => note.atSec))
const release = (notes: readonly PhraseNote[]): number =>
  Math.max(...notes.map((note) => note.atSec + note.durSec))
const hardest = (notes: readonly PhraseNote[]): number =>
  Math.max(...notes.map((note) => note.gain ?? DEFAULT_PHRASE_GAIN))

/** The notes of a phrase as takes are told apart by them. */
export const notesKey = (notes: readonly PhraseNote[]): string =>
  notes
    .map(
      (note) =>
        `${tick(note.atSec)}:${cents(note.note)}:${tick(note.durSec)}:${Math.round((note.gain ?? DEFAULT_PHRASE_GAIN) * 1e3)}`,
    )
    .sort()
    .join(' ')

/** What is wrong with the takes `way` gives on `sound`: nothing, for a way that keeps what a take keeps. */
export function takeProblems<T extends VariedPlaying>(
  sound: T,
  way: string,
  seed: number,
  far?: number,
  key?: FactoryKey,
): string[] {
  const playing: WayPlaying = { way, seed, far, key }
  const counted = wayTakes(sound, playing)
  if (counted.takes === 0) return [`nothing to play: ${counted.refusal}`]
  const out: string[] = []
  const { takes, round, cut } = counted
  if (takes < 2 || takes > 8) out.push(`${takes} takes`)
  if (round.length < 2 || round.length > 16) out.push(`a round of ${round.length}`)
  if (round[0] !== 0) out.push('the round does not start on the first take')
  for (let take = 0; take < takes; take += 1) {
    if (!round.includes(take)) out.push(`take ${take} is not in the round`)
  }
  if (cut && takes !== 8) out.push('cut short of eight takes')
  if (JSON.stringify(wayTakes(sound, playing)) !== JSON.stringify(counted)) {
    out.push('counted differently the second time')
  }

  const was = sound.phrase.notes
  const skipSec = sound.skipSec ?? 0
  const crossfadeSec = sound.loopCrossfadeSec ?? 0
  const endSec = skipSec + sound.durationSec + crossfadeSec
  const loops = Boolean(sound.loopCrossfadeSec)
  const held =
    loops && was.every((note) => note.atSec <= skipSec && note.atSec + note.durSec >= endSec)
  const pitched = sound.source === undefined && !sound.kit
  const moved = key ? factoryTranspose(key) : 0
  const white = (notes: readonly PhraseNote[]): boolean =>
    notes.every((note) => WHITE.includes(((Math.round(note.note - moved) % 12) + 12) % 12))
  const standing = pitched ? Math.min(...was.map((note) => cents(note.note))) : null

  const seen = new Map<string, number>()
  for (let take = 0; take < takes; take += 1) {
    const say = (what: string): number => out.push(`take ${take}: ${what}`)
    const played = playSound(sound, { ...playing, take })
    const now = played.phrase.notes
    if (notesKey(playSound(sound, { ...playing, take }).phrase.notes) !== notesKey(now)) {
      say('played differently the second time')
    }
    const again = seen.get(notesKey(now))
    if (again !== undefined) say(`the notes of take ${again}`)
    seen.set(notesKey(now), take)

    // The sound's own lengths, loop and instrument: everything but its notes.
    for (const name of new Set([...Object.keys(sound), ...Object.keys(played)])) {
      if (name === 'phrase') continue
      if (played[name as keyof T] !== sound[name as keyof T]) say(`another ${name}`)
    }
    if (now.length === 0) say('no notes')
    now.forEach((note, index) => {
      if (!(note.atSec >= 0)) say(`note ${index} before the start`)
      if (!(note.durSec > 0)) say(`note ${index} has no length`)
      const gain = note.gain ?? DEFAULT_PHRASE_GAIN
      if (!(gain > 0 && gain <= 1)) say(`note ${index} gain`)
      if (!Number.isFinite(note.note)) say(`note ${index} is no note`)
    })

    if (pitched) {
      // The key: a sound in its key stays in it, inside the range it was written in or the keyboard's.
      if (white(was) && !white(now)) say('a note out of the key')
      const low = Math.min(...now.map((note) => note.note))
      const high = Math.max(...now.map((note) => note.note))
      if (low < Math.min(24, ...was.map((note) => note.note))) say('under the keyboard')
      if (high > Math.max(96, ...was.map((note) => note.note))) say('over the keyboard')
      // The note the sound stands on: wherever it is written, it still is.
      for (const note of was) {
        if (cents(note.note) !== standing) continue
        const still = now.some(
          (each) =>
            tick(each.atSec) === tick(note.atSec) &&
            cents(each.note) === standing &&
            tick(each.durSec) === tick(note.durSec),
        )
        if (!still) say(`the standing note at ${note.atSec} s is not as written`)
      }
    } else {
      // Keys that are not pitches: every note on a key the sound is written on.
      const keys = new Set(was.map((note) => cents(note.note)))
      if (now.some((note) => !keys.has(cents(note.note)))) say('a key the sound does not have')
    }

    // The level: the hardest note is as hard as the sound's hardest.
    if (Math.abs(hardest(now) - hardest(was)) > 1e-9) say('played harder or softer as a whole')
    // The attack: a sound that starts on a note still starts on it, and none comes ahead of it.
    if (first(was) < 0.03 && first(now) !== first(was)) say('left the start')
    if (first(now) < first(was) - 1e-9) say('ahead of the attack')

    if (held) {
      // A note the sound does not hold is struck clear of the fold: from a crossfade's length
      // into the loop, and before the loop's end.
      const written = new Set(was.map((note) => `${tick(note.atSec)}:${cents(note.note)}`))
      for (const note of now) {
        if (written.has(`${tick(note.atSec)}:${cents(note.note)}`)) continue
        if (note.atSec < skipSec + crossfadeSec - 1e-9) say(`a note struck under the fold`)
        if (note.atSec >= skipSec + sound.durationSec) say(`a note struck after the loop`)
      }
    } else if (loops) {
      // Played round: every pass is the first pass again, and there are as many.
      const period = sound.durationSec
      const passOf = (note: PhraseNote): number => Math.floor(note.atSec / period + 1e-9)
      const pass = (notes: readonly PhraseNote[], index: number): string =>
        notesKey(
          notes
            .filter((note) => passOf(note) === index)
            .map((note) => ({ ...note, atSec: note.atSec - index * period })),
        )
      const passes = Math.max(...was.map(passOf))
      if (Math.max(...now.map(passOf)) !== passes) say('another number of passes')
      for (let index = 1; index <= passes; index += 1) {
        if (pass(now, index) !== pass(now, 0)) say(`pass ${index} is not the first again`)
      }
    } else if (way !== 'echoes') {
      // A sound that ends: what it ends on is no later, and no key is down longer than one was.
      // Echoes come after the hit, and have a bound of their own.
      if (last(now) > last(was) + 1e-9) say('ends later')
      if (release(now) > release(was) + 1e-9) say('held longer')
    }
  }
  return out
}

/**
 * What is wrong with the takes of `ways` on the sounds of the bank, at a
 * quarter, a half and all of `far`: every sound a way has something to play
 * on, for each seed.
 */
export function bankProblems(ways: readonly string[], seeds: readonly number[]): string[] {
  const out: string[] = []
  for (const each of FACTORY_SOUNDS) {
    for (const way of ways) {
      for (const far of [0.25, 0.5, 1]) {
        for (const seed of seeds) {
          if (wayTakes(each, { way, seed, far }).takes === 0) continue
          for (const problem of takeProblems(each, way, seed, far)) {
            out.push(`${each.id} ${way} far ${far} seed ${seed}: ${problem}`)
          }
        }
      }
    }
  }
  return out
}
