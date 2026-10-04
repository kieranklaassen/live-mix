// A variant of a sound held to what must not change: its lengths, its key,
// the attack it starts on, and that a phrase played round still comes again
// the same in every pass; and each kind of difference held to its own
// business. What a variant sounds like is the bench's to say
// (FACTORY_REPORT=variants); a few are rendered here.

import { describe, expect, it } from 'vitest'

import { analyzeSound } from '../../../core/analysis/sound-kind'
import { compileFromDisk, measureAudio, toDb } from '../../__tests__/render-support'
import { DEFAULT_PHRASE_GAIN, peakOf, type PhraseNote } from '../../patch-render'
import {
  FACTORY_PEAK_DB,
  FACTORY_SOUNDS,
  describeVariant,
  renderFactorySound,
  transposeFactorySound,
  variationAmounts,
  varySound,
} from '..'
import { loadFactoryPackSounds } from '../sound-packs'
import { cycled, looped, played } from '../sounds/recipe'
import { type FactorySound } from '../types'
import { VARIATION_KINDS, VARIATION_LIMITS, type SoundVariation } from '../vary'
import { measureEnds } from './sound-measure'

const node = { compile: compileFromDisk, sliceMs: 0 } as const
const SEEDS = [1, 2, 3, 77, 9999]
const full = (seed: number): SoundVariation => ({ seed, amount: 1 })
/** One kind as far as it goes, the others not at all. */
const only = (
  kind: (typeof VARIATION_KINDS)[number],
  seed: number,
  amount = 1,
): SoundVariation => ({
  seed,
  [kind]: amount,
})

const WHITE = [0, 2, 4, 5, 7, 9, 11]
const pitchClass = (note: number): number => ((Math.round(note) % 12) + 12) % 12
const white = (notes: readonly PhraseNote[]): boolean =>
  notes.every((note) => WHITE.includes(pitchClass(note.note)))
const classes = (notes: readonly PhraseNote[]): number[] =>
  notes.map((note) => pitchClass(note.note)).sort((a, b) => a - b)
const lowest = (notes: readonly PhraseNote[]): number =>
  Math.round(Math.min(...notes.map((note) => note.note)))
const first = (notes: readonly PhraseNote[]): number => Math.min(...notes.map((note) => note.atSec))
const last = (notes: readonly PhraseNote[]): number => Math.max(...notes.map((note) => note.atSec))
const hardest = (notes: readonly PhraseNote[]): number =>
  Math.max(...notes.map((note) => note.gain ?? DEFAULT_PHRASE_GAIN))

/** What must hold for any variant of any sound, whatever the kinds and amounts. */
function problems(sound: FactorySound, variation: SoundVariation): string[] {
  const variant = varySound(sound, variation)
  const changes = describeVariant(sound, variation)
  const out: string[] = []
  const was = sound.phrase.notes
  const now = variant.phrase.notes
  if (variant.durationSec !== sound.durationSec) out.push('another length')
  if (variant.loopCrossfadeSec !== sound.loopCrossfadeSec) out.push('another crossfade')
  if (variant.loopFold !== sound.loopFold) out.push('another fold')
  if (variant.patch !== sound.patch) out.push('another patch')
  if (now.length === 0) out.push('no notes')
  if ((variant.skipSec ?? 0) < (sound.skipSec ?? 0)) out.push('taken up earlier')
  now.forEach((note, index) => {
    if (!(note.atSec >= 0)) out.push(`note ${index} before the start`)
    if (!(note.durSec > 0)) out.push(`note ${index} has no length`)
    const gain = note.gain ?? DEFAULT_PHRASE_GAIN
    if (!(gain > 0 && gain <= 1)) out.push(`note ${index} gain`)
    if (!Number.isFinite(note.note)) out.push(`note ${index} is no note`)
  })
  // The key: a sound on the white keys stays on them, and inside the range it was written in or the keyboard's.
  if (white(was) && !white(now)) out.push('a black key')
  if (changes.chordSteps !== 0 && pitchClass(lowest(now)) === 11) out.push('stands on B')
  if (lowest(now) < Math.min(24, lowest(was))) out.push('under the keyboard')
  // The level: the hardest note is as hard as the sound's hardest.
  if (Math.abs(hardest(now) - hardest(was)) > 1e-9) out.push('played harder or softer as a whole')
  // The attack: a sound that starts on a note still starts on it, and none comes ahead of it.
  if (first(was) < 0.03 && first(now) !== first(was)) out.push('left the start')
  if (first(was) >= 0.03 && first(now) < 0.03) out.push('ahead of the attack')

  const endOf = (each: FactorySound): number =>
    (each.skipSec ?? 0) + each.durationSec + (each.loopCrossfadeSec ?? 0)
  const heldThrough = (each: FactorySound): boolean =>
    each.phrase.notes.every((note) => note.atSec + note.durSec >= endOf(each))
  if (sound.loopCrossfadeSec && sound.loopFold !== 'linear' && heldThrough(sound)) {
    if (!heldThrough(variant)) out.push('let go early')
  }
  if (sound.loopCrossfadeSec && !heldThrough(sound)) {
    // Played round, whatever the fold: every pass is the first pass again.
    const period = sound.durationSec
    const pass = (notes: readonly PhraseNote[], index: number): string =>
      notes
        .filter((note) => Math.floor(note.atSec / period + 1e-9) === index)
        .map(
          (note) =>
            `${(note.atSec - index * period).toFixed(6)}:${note.note.toFixed(4)}:${note.durSec}:${note.gain}`,
        )
        .sort()
        .join(' ')
    const passes = Math.max(...was.map((note) => Math.floor(note.atSec / period + 1e-9)))
    if (Math.max(...now.map((note) => Math.floor(note.atSec / period + 1e-9))) !== passes) {
      out.push('another number of passes')
    }
    for (let index = 1; index <= passes; index += 1) {
      if (pass(now, index) !== pass(now, 0)) out.push(`pass ${index} is not the first again`)
    }
  }
  if (!sound.loopCrossfadeSec) {
    // A sound that ends: what it ends on is no later, and no key is down longer than one was.
    const reach = last(was) >= sound.durationSec * 0.75 ? 0 : VARIATION_LIMITS.timingSec
    if (last(now) > last(was) + reach + 1e-9) out.push('ends later')
    const release = (notes: readonly PhraseNote[]): number =>
      Math.max(...notes.map((note) => note.atSec + note.durSec))
    if (release(now) > release(was) + VARIATION_LIMITS.timingSec + 1e-9) out.push('held longer')
  }
  return out
}

const phrase = played(8, [
  [0, 1, 48],
  [1, 1, 60],
  [2, 1, 64],
  [3, 1, 67],
  [4, 1, 72],
  [5, 1, 76],
  [6, 1, 79],
  [7, 0.5, 84],
])
const round = cycled(8, [
  [0, 1, 48],
  [1, 1, 60],
  [2, 1, 64],
  [3, 1, 67],
  [4, 1, 72],
  [5, 1, 76],
  [6, 1, 79],
])
const held = looped(8, 3, 2, [48, 55, 64, 71])
const many = Array.from({ length: 200 }, (_, seed) => seed + 1)

describe('a variant of a sound', () => {
  const sound = FACTORY_SOUNDS[0]

  it('is the sound itself without a variation, and at 0 in every kind', () => {
    expect(varySound(sound)).toBe(sound)
    expect(varySound(sound, { seed: 5 })).toBe(sound)
    expect(varySound(sound, { seed: 5, amount: 0 })).toBe(sound)
    expect(varySound(sound, { seed: 5, amount: -1 })).toBe(sound)
    expect(varySound(sound, { seed: 5, amount: Number.NaN })).toBe(sound)
    expect(
      varySound(sound, { seed: 5, amount: 1, chords: 0, speed: 0, pattern: 0, touch: 0 }),
    ).toBe(sound)
    expect(describeVariant(sound, { seed: 5 })).toEqual({
      chordSteps: 0,
      octaves: 0,
      rate: 1,
      rests: 0,
      swaps: 0,
      laterSec: 0,
    })
  })

  it('gives every kind the one amount unless a kind has its own', () => {
    expect(variationAmounts({ seed: 1, amount: 0.5 })).toEqual({
      chords: 0.5,
      speed: 0.5,
      pattern: 0.5,
      touch: 0.5,
    })
    expect(variationAmounts({ seed: 1, amount: 0.5, chords: 0, touch: 3 })).toEqual({
      chords: 0,
      speed: 0.5,
      pattern: 0.5,
      touch: 1,
    })
    expect(variationAmounts({ seed: 1, speed: 0.2 })).toEqual({
      chords: 0,
      speed: 0.2,
      pattern: 0,
      touch: 0,
    })
  })

  it('is the same for the same seed and amounts, and another for another seed', () => {
    for (const each of FACTORY_SOUNDS) {
      expect(varySound(each, full(4))).toEqual(varySound(each, full(4)))
      expect(varySound(each, full(4)).phrase).not.toEqual(varySound(each, full(5)).phrase)
      expect(varySound(each, full(4)).phrase).not.toEqual(each.phrase)
    }
  })

  it('is played round one pass after another, every bank sound that comes round', () => {
    // A pass that is the first pass again is what lets the speed and the rests of one be laid out for all.
    for (const each of FACTORY_SOUNDS) {
      if (!each.loopCrossfadeSec || each.loopFold !== 'linear') continue
      const period = each.durationSec
      const pass = (index: number): string =>
        each.phrase.notes
          .filter((note) => Math.floor(note.atSec / period + 1e-9) === index)
          .map((note) => `${(note.atSec - index * period).toFixed(4)}:${note.note}:${note.durSec}`)
          .join(' ')
      expect(pass(1), each.id).toBe(pass(0))
    }
  })

  describe('by its touch', () => {
    it('keeps every note, on its pitch class, and moves it less at a smaller amount', () => {
      const moved = (amount: number): number => {
        const variant = varySound(phrase, only('touch', 3, amount))
        return variant.phrase.notes.reduce(
          (sum, note, index) => sum + Math.abs(note.atSec - phrase.phrase.notes[index].atSec),
          0,
        )
      }
      expect(moved(0.25)).toBeGreaterThan(0)
      expect(moved(0.25)).toBeLessThan(moved(1))
      for (const seed of SEEDS) {
        const variant = varySound(phrase, only('touch', seed))
        expect(variant.phrase.notes).toHaveLength(phrase.phrase.notes.length)
        expect(classes(variant.phrase.notes)).toEqual(classes(phrase.phrase.notes))
        variant.phrase.notes.forEach((note, index) => {
          const from = phrase.phrase.notes[index]
          expect(Math.abs(note.atSec - from.atSec)).toBeLessThanOrEqual(VARIATION_LIMITS.timingSec)
          expect(Math.abs(note.note - from.note) * 100).toBeLessThanOrEqual(VARIATION_LIMITS.cents)
        })
        expect(describeVariant(phrase, only('touch', seed))).toMatchObject({
          chordSteps: 0,
          rate: 1,
          rests: 0,
          swaps: 0,
        })
      }
    })

    it('keeps a struck chord together and never crosses two notes in time', () => {
      const struck = played(8, [
        [0, 2, 48],
        [1, 1, 60],
        [1, 1, 64],
        [1.1, 1, 67],
        [3, 1, 72],
      ])
      for (const seed of SEEDS) {
        const notes = varySound(struck, only('touch', seed)).phrase.notes
        expect(notes[1].atSec).toBe(notes[2].atSec)
        expect(notes[0].atSec).toBe(0)
        expect(notes[2].atSec).toBeLessThan(notes[3].atSec)
        expect(notes[3].atSec).toBeLessThan(notes[4].atSec)
      }
    })

    it('leaves a sound tuned to whole cycles on its notes', () => {
      const tuned = { ...held, tuning: 'whole-cycles' as const }
      for (const seed of SEEDS) {
        for (const note of varySound(tuned, only('touch', seed)).phrase.notes) {
          expect(Number.isInteger(note.note)).toBe(true)
        }
      }
    })

    it('takes a held chord up later and holds it as much longer', () => {
      const later = SEEDS.map((seed) => varySound(held, only('touch', seed)))
      expect(later.some((variant) => (variant.skipSec ?? 0) > 3.5)).toBe(true)
      later.forEach((variant, index) => {
        const extra = (variant.skipSec ?? 0) - 3
        expect(extra).toBeGreaterThanOrEqual(0)
        expect(extra).toBeLessThanOrEqual(VARIATION_LIMITS.startSec)
        expect(describeVariant(held, only('touch', SEEDS[index])).laterSec).toBeCloseTo(extra)
        for (const note of variant.phrase.notes)
          expect(note.durSec).toBeCloseTo(8 + 3 + 2 + 1 + extra)
      })
    })
  })

  describe('by its pattern', () => {
    it('rests two notes in five of a phrase, spread through it, never the first or the lowest', () => {
      for (const seed of many.slice(0, 40)) {
        const notes = varySound(phrase, only('pattern', seed)).phrase.notes
        const sounding = phrase.phrase.notes.map((note) =>
          notes.some((each) => each.atSec === note.atSec),
        )
        // Eight moments, three of them rests.
        expect(sounding.filter(Boolean)).toHaveLength(5)
        expect(sounding[0]).toBe(true)
        expect(describeVariant(phrase, only('pattern', seed)).rests).toBe(3)
        // As evenly as three rests go into eight: no two side by side, round the end as well.
        sounding.forEach((on, index) => {
          if (!on) expect(sounding[(index + 1) % sounding.length]).toBe(true)
        })
        // Where a note sounds is where one was written, and what sounds is a note the phrase has.
        for (const note of notes) {
          expect(phrase.phrase.notes.some((each) => each.atSec === note.atSec)).toBe(true)
          expect(phrase.phrase.notes.some((each) => each.note === note.note)).toBe(true)
        }
        expect(lowest(notes)).toBe(48)
      }
    })

    it('rests fewer at a smaller amount, and none in a phrase of three moments', () => {
      expect(describeVariant(phrase, only('pattern', 2, 0.3)).rests).toBe(1)
      expect(describeVariant(phrase, only('pattern', 2, 0.1)).rests).toBe(0)
      const short = played(4, [
        [0, 1, 60],
        [1, 1, 64],
        [2, 1, 67],
      ])
      for (const seed of SEEDS) expect(describeVariant(short, only('pattern', seed)).rests).toBe(0)
    })

    it('changes the places of two notes of a phrase in every pass alike', () => {
      const order = (notes: readonly PhraseNote[]): string =>
        notes
          .filter((note) => note.atSec < 8)
          .sort((a, b) => a.atSec - b.atSec)
          .map((note) => Math.round(note.note))
          .join(' ')
      const orders = new Set(
        many
          .slice(0, 40)
          .map((seed) => order(varySound(round, only('pattern', seed)).phrase.notes)),
      )
      expect(orders.size).toBeGreaterThan(1)
      // The first note and the lowest stay where they are.
      for (const each of orders) expect(each.startsWith('48 ')).toBe(true)
    })

    it('leaves one upper note out of a held chord, two times in five', () => {
      const thinned = many.filter(
        (seed) => varySound(held, only('pattern', seed)).phrase.notes.length === 3,
      )
      expect(thinned.length).toBeGreaterThan(many.length * 0.25)
      expect(thinned.length).toBeLessThan(many.length * 0.55)
      for (const seed of many) {
        const notes = varySound(held, only('pattern', seed)).phrase.notes
        expect(notes.length).toBeGreaterThanOrEqual(3)
        expect(lowest(notes)).toBe(48)
        expect(describeVariant(held, only('pattern', seed)).rests).toBe(4 - notes.length)
      }
    })
  })

  describe('by its chords', () => {
    const stepsOf = (each: typeof held, amount: number): Map<number, number> => {
      const counts = new Map<number, number>()
      for (const seed of many) {
        const { chordSteps } = describeVariant(each, only('chords', seed, amount))
        counts.set(chordSteps, (counts.get(chordSteps) ?? 0) + 1)
      }
      return counts
    }

    it('moves the whole sound along the white keys, three times in four at the most', () => {
      const counts = stepsOf(held, 1)
      const stayed = counts.get(0) ?? 0
      expect(stayed).toBeGreaterThan(many.length * 0.15)
      expect(stayed).toBeLessThan(many.length * 0.35)
      // A third away is the likeliest, a step away the least.
      expect(counts.get(-2) ?? 0).toBeGreaterThan(counts.get(1) ?? 0)
      for (const steps of counts.keys()) expect([-3, -2, -1, 0, 1, 2, 3]).toContain(steps)
      for (const seed of many) {
        const variation = only('chords', seed)
        const { chordSteps, octaves } = describeVariant(held, variation)
        const notes = varySound(held, variation).phrase.notes
        expect(white(notes)).toBe(true)
        expect(notes).toHaveLength(4)
        if (chordSteps !== 0) expect(pitchClass(lowest(notes))).not.toBe(11)
        // C to the A below is a third down, to the F above a fourth up.
        if (octaves === 0) {
          const to: Record<number, number> = {
            [-3]: 43,
            [-2]: 45,
            [-1]: 47,
            0: 48,
            1: 50,
            2: 52,
            3: 53,
          }
          expect(lowest(notes)).toBe(to[chordSteps])
        }
      }
    })

    it('goes no further than a third at a small amount, and less often', () => {
      const counts = stepsOf(held, 0.3)
      for (const steps of counts.keys()) expect([-2, 0, 2]).toContain(steps)
      expect(counts.get(0) ?? 0).toBeGreaterThan(many.length * 0.65)
      const middling = stepsOf(held, 0.5)
      for (const steps of middling.keys()) expect([-3, -2, 0, 2, 3]).toContain(steps)
    })

    it('never stands a sound on B', () => {
      // From D, a third down is B: it goes somewhere else.
      const onD = looped(8, 3, 2, [50, 57, 65])
      for (const seed of many) {
        const notes = varySound(onD, only('chords', seed)).phrase.notes
        expect(pitchClass(lowest(notes))).not.toBe(11)
      }
    })

    it('plays single notes of a phrase an octave away, never the first or the lowest', () => {
      let moved = 0
      for (const seed of many) {
        const variation = only('chords', seed)
        const { chordSteps, octaves } = describeVariant(phrase, variation)
        const notes = varySound(phrase, variation).phrase.notes
        moved += octaves
        expect(notes).toHaveLength(8)
        expect(white(notes)).toBe(true)
        // The times and the touch are the phrase's own.
        notes.forEach((note, index) => {
          expect(note.atSec).toBe(phrase.phrase.notes[index].atSec)
          expect(note.gain ?? DEFAULT_PHRASE_GAIN).toBe(
            phrase.phrase.notes[index].gain ?? DEFAULT_PHRASE_GAIN,
          )
        })
        if (chordSteps === 0) {
          expect(notes[0].note).toBe(48)
          for (const note of notes.slice(1)) expect(note.note).toBeGreaterThan(48)
          notes.forEach((note, index) => {
            expect(Math.abs(note.note - phrase.phrase.notes[index].note) % 12).toBe(0)
          })
        }
      }
      // One note in five of seven, over two hundred variants.
      expect(moved).toBeGreaterThan(many.length * 7 * 0.1)
      expect(moved).toBeLessThan(many.length * 7 * 0.3)
    })

    it('leaves a sound made of another one on its notes', () => {
      const grains = { ...held, source: 'some-other-sound' }
      for (const seed of many.slice(0, 40)) {
        expect(varySound(grains, only('chords', seed))).toBe(grains)
      }
    })

    it('is moved into the key after it is varied, so it is in the key', () => {
      const moved = FACTORY_SOUNDS.find((each) => each.kind === 'pad' && !each.source)
      if (!moved) throw new Error('no pad in the bank')
      for (const seed of SEEDS) {
        const variation = only('chords', seed)
        const there = transposeFactorySound(varySound(moved, variation), 3)
        // Three semitones up, the white keys are these.
        const key = WHITE.map((each) => (each + 3) % 12)
        for (const note of there.phrase.notes) expect(key).toContain(pitchClass(note.note))
      }
    })
  })

  describe('by its speed', () => {
    it('plays a phrase that ends from half to twice as fast, from its first note on', () => {
      const rates = many.map((seed) => describeVariant(phrase, only('speed', seed)).rate)
      expect(Math.min(...rates)).toBeGreaterThanOrEqual(0.5)
      expect(Math.max(...rates)).toBeLessThanOrEqual(2)
      expect(Math.min(...rates)).toBeLessThan(0.6)
      expect(Math.max(...rates)).toBeGreaterThan(1.7)
      for (const seed of many) {
        const variation = only('speed', seed)
        const { rate, rests } = describeVariant(phrase, variation)
        const notes = varySound(phrase, variation).phrase.notes
        expect(notes[0].atSec).toBe(0)
        // Slower, it stops where the last note was; faster, every note is there.
        expect(last(notes)).toBeLessThanOrEqual(7 + 1e-9)
        expect(notes).toHaveLength(8 - rests)
        if (rate >= 1) expect(rests).toBe(0)
        notes.forEach((note, index) => {
          expect(note.atSec).toBeCloseTo(phrase.phrase.notes[index].atSec / rate, 1)
          expect(note.note).toBe(phrase.phrase.notes[index].note)
        })
      }
    })

    it('is nearer the sound at a smaller amount', () => {
      for (const seed of SEEDS) {
        const { rate } = describeVariant(phrase, only('speed', seed, 0.25))
        expect(rate).toBeGreaterThanOrEqual(2 ** -0.25 - 1e-3)
        expect(rate).toBeLessThanOrEqual(2 ** 0.25 + 1e-3)
      }
    })

    it('plays a phrase that comes round at half or double time, one time in two at the most', () => {
      const rates = many.map((seed) => describeVariant(round, only('speed', seed)).rate)
      for (const rate of rates) expect([0.5, 1, 2]).toContain(rate)
      const changed = rates.filter((rate) => rate !== 1).length
      expect(changed).toBeGreaterThan(many.length * 0.35)
      expect(changed).toBeLessThan(many.length * 0.65)
      expect(rates).toContain(0.5)
      expect(rates).toContain(2)
      for (const seed of many) {
        const variation = only('speed', seed)
        const { rate } = describeVariant(round, variation)
        const pass = varySound(round, variation).phrase.notes.filter((note) => note.atSec < 8)
        if (rate === 2) {
          // The phrase twice in the time of once.
          expect(pass).toHaveLength(14)
          expect(pass.map((note) => note.note).slice(0, 7)).toEqual(
            pass.map((note) => note.note).slice(7),
          )
          expect(pass[7].atSec).toBe(4)
        }
        if (rate === 0.5) {
          // Its first half over the whole of it.
          expect(pass.map((note) => note.atSec)).toEqual([0, 2, 4, 6])
          expect(pass.map((note) => note.note)).toEqual([48, 60, 64, 67])
        }
      }
    })

    it('keeps the attack of a round that starts a moment in, at double and at half time', () => {
      // A pluck written 0.02 s in, as the packs write a round whose seam must be clear of it.
      const late = cycled(8, [
        [0.02, 1, 48],
        [1.02, 1, 60],
        [2.02, 1, 64],
        [3.02, 1, 67],
        [4.02, 1, 72],
        [5.02, 1, 76],
        [6.02, 1, 79],
      ])
      const rates = new Set<number>()
      for (const seed of many) {
        const variation = only('speed', seed)
        const { rate } = describeVariant(late, variation)
        rates.add(rate)
        const pass = varySound(late, variation).phrase.notes.filter((note) => note.atSec < 8)
        expect(pass[0].atSec).toBe(0.02)
        if (rate === 2) expect(pass[7].atSec).toBeCloseTo(4.02, 9)
        if (rate === 0.5) {
          expect(pass.map((note) => note.atSec)).toEqual([0.02, 2.02, 4.02, 6.02])
        }
      }
      expect([...rates].sort()).toEqual([0.5, 1, 2])
    })

    it('never brings the first note of a round ahead of where an attack may be, at double time', () => {
      // Written just clear of that moment (0.03 s): halved from nought it would come inside it.
      for (const start of [0.03, 0.045, 0.059]) {
        const clear = cycled(8, [
          [start, 1, 48],
          [1 + start, 1, 60],
          [2 + start, 1, 64],
          [3 + start, 1, 67],
          [4 + start, 1, 72],
          [5 + start, 1, 76],
          [6 + start, 1, 79],
        ])
        let doubled = 0
        for (const seed of many) {
          const variation = only('speed', seed)
          if (describeVariant(clear, variation).rate !== 2) continue
          doubled++
          const pass = varySound(clear, variation).phrase.notes.filter((note) => note.atSec < 8)
          expect(pass).toHaveLength(14)
          expect(pass[0].atSec).toBe(start)
          expect(pass[7].atSec).toBeCloseTo(4 + start, 9)
        }
        expect(doubled).toBeGreaterThan(0)
      }
    })

    it('does nothing to a held chord', () => {
      for (const seed of SEEDS) expect(varySound(held, only('speed', seed))).toBe(held)
    })
  })

  it.each(FACTORY_SOUNDS.map((each) => [each.id, each] as const))(
    'of %s keeps what the sound is held to',
    (_id, each) => {
      for (const seed of SEEDS) {
        expect(problems(each, full(seed)), `seed ${seed}`).toEqual([])
        expect(problems(each, { seed, amount: 0.25 }), `seed ${seed} at a quarter`).toEqual([])
        for (const kind of VARIATION_KINDS) {
          expect(problems(each, only(kind, seed)), `seed ${seed}, ${kind} alone`).toEqual([])
        }
      }
    },
  )

  it("of every pack's sounds keeps what the sound is held to", async () => {
    const sounds = await loadFactoryPackSounds()
    for (const each of sounds) {
      for (const seed of SEEDS.slice(0, 2)) {
        expect(problems(each, full(seed)), `${each.id} seed ${seed}`).toEqual([])
      }
    }
  })

  // One of each kind of sound, a loop of each fold and a sound that ends.
  const rendered = ['drone', 'pad', 'texture', 'oneshot', 'melodic'].flatMap((kind) => {
    const ofKind = FACTORY_SOUNDS.filter((each) => each.kind === kind)
    return [ofKind[0], ofKind[Math.floor(ofKind.length / 2)]].filter(Boolean)
  })

  it.each(rendered.map((each) => [each.id, each] as const))(
    'of %s by its touch renders at the bank level, as long, as loud, and of its kind',
    async (_id, each) => {
      const audio = await renderFactorySound(each, node)
      const variant = await renderFactorySound(each, { ...node, vary: only('touch', 2) })
      expect(variant.channels[0]).toHaveLength(audio.channels[0].length)
      expect(toDb(peakOf(variant.channels))).toBeCloseTo(FACTORY_PEAK_DB, 1)
      expect(Math.abs(measureAudio(variant).lufs - measureAudio(audio).lufs)).toBeLessThan(3)
      expect(analyzeSound(variant.channels, variant.sampleRate).kind).toBe(each.kind)
      const differs = variant.channels[0].some(
        (sample, index) => Math.abs(sample - audio.channels[0][index]) > 1e-4,
      )
      expect(differs, 'another render').toBe(true)
      const ends = measureEnds(variant)
      if (each.loopCrossfadeSec) {
        expect(ends.round, 'comes round on itself').toBe(true)
      } else {
        expect(ends.stepIn, 'starts on a step').toBe(false)
        expect(ends.stepOut, 'ends on a step').toBe(false)
      }
    },
    120_000,
  )

  it.each(rendered.map((each) => [each.id, each] as const))(
    'of %s by every kind at once renders as long, at the bank level, and comes round or ends',
    async (_id, each) => {
      for (const seed of [2, 3]) {
        const variant = await renderFactorySound(each, { ...node, vary: full(seed) })
        const samples = Math.round(each.durationSec * variant.sampleRate)
        expect(variant.channels[0]).toHaveLength(samples)
        expect(toDb(peakOf(variant.channels))).toBeCloseTo(FACTORY_PEAK_DB, 1)
        const ends = measureEnds(variant)
        if (each.loopCrossfadeSec) {
          expect(ends.round, `seed ${seed} comes round on itself`).toBe(true)
        } else {
          expect(ends.stepIn, `seed ${seed} starts on a step`).toBe(false)
          expect(ends.stepOut, `seed ${seed} ends on a step`).toBe(false)
        }
      }
    },
    240_000,
  )
})
