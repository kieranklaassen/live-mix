// A variant of a sound held to what must not change: its lengths, its key,
// the note it stands on, the attack it starts on, and that a phrase played
// round still comes again the same in every pass. What a variant sounds like
// is the bench's to say (FACTORY_REPORT=variants); a few are rendered here.

import { describe, expect, it } from 'vitest'

import { analyzeSound } from '../../../core/analysis/sound-kind'
import { compileFromDisk, measureAudio, toDb } from '../../__tests__/render-support'
import { peakOf, type PhraseNote } from '../../patch-render'
import { FACTORY_PEAK_DB, FACTORY_SOUNDS, renderFactorySound, varySound } from '..'
import { loadFactoryPackSounds } from '../sound-packs'
import { cycled, looped, played } from '../sounds/recipe'
import { type FactorySound } from '../types'
import { VARIATION_LIMITS } from '../vary'
import { measureEnds } from './sound-measure'

const node = { compile: compileFromDisk, sliceMs: 0 } as const
const SEEDS = [1, 2, 3, 77, 9999]
const full = (seed: number) => ({ seed, amount: 1 })

const pitchClass = (note: number): number => ((Math.round(note) % 12) + 12) % 12
const classes = (notes: readonly PhraseNote[]): number[] =>
  notes.map((note) => pitchClass(note.note)).sort((a, b) => a - b)
const lowest = (notes: readonly PhraseNote[]): number =>
  Math.round(Math.min(...notes.map((note) => note.note)))

/** What must hold for any variant of any sound. */
function problems(sound: FactorySound, variant: FactorySound): string[] {
  const out: string[] = []
  const was = sound.phrase.notes
  const now = variant.phrase.notes
  if (variant.durationSec !== sound.durationSec) out.push('another length')
  if (variant.loopCrossfadeSec !== sound.loopCrossfadeSec) out.push('another crossfade')
  if (variant.loopFold !== sound.loopFold) out.push('another fold')
  if (variant.patch !== sound.patch) out.push('another patch')
  if (now.length !== was.length) out.push('another number of notes')
  if (classes(now).join() !== classes(was).join()) out.push('notes the sound does not have')
  if (lowest(now) !== lowest(was)) out.push('another lowest note')
  if ((variant.skipSec ?? 0) < (sound.skipSec ?? 0)) out.push('taken up earlier')
  const endSec = (variant.skipSec ?? 0) + variant.durationSec + (variant.loopCrossfadeSec ?? 0)
  now.forEach((note, index) => {
    const from = was[index]
    if (!(note.atSec >= 0)) out.push(`note ${index} before the start`)
    if (!(note.gain !== undefined && note.gain > 0 && note.gain <= 1))
      out.push(`note ${index} gain`)
    if (Math.abs(note.atSec - from.atSec) > VARIATION_LIMITS.timingSec + 1e-9) {
      out.push(`note ${index} moved too far`)
    }
    // The attack stays: a note at the very start is still there.
    if (from.atSec < 0.03 && note.atSec !== from.atSec) out.push(`note ${index} left the start`)
    if (from.atSec >= 0.03 && note.atSec < 0.03) out.push(`note ${index} ahead of the attack`)
    // A note held to the end of the render is still held to its end.
    const wasEnd = (sound.skipSec ?? 0) + sound.durationSec + (sound.loopCrossfadeSec ?? 0)
    if (from.atSec + from.durSec >= wasEnd && note.atSec + note.durSec < endSec) {
      out.push(`note ${index} let go early`)
    }
  })
  if (sound.loopCrossfadeSec && sound.loopFold === 'linear') {
    // Played round: every pass is the first pass again.
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
    for (let index = 1; index <= passes; index += 1) {
      if (pass(now, index) !== pass(now, 0)) out.push(`pass ${index} is not the first again`)
    }
    for (const note of now) {
      const at = note.atSec - period * Math.floor(note.atSec / period + 1e-9)
      if (at >= period) out.push('a note outside its pass')
    }
  }
  if (!sound.loopCrossfadeSec) {
    // A sound that ends: what it ends on is no later.
    was.forEach((from, index) => {
      if (from.atSec >= sound.durationSec * 0.75 && now[index].atSec > from.atSec) {
        out.push(`note ${index} ends the sound later`)
      }
    })
  }
  return out
}

describe('a variant of a sound', () => {
  const sound = FACTORY_SOUNDS[0]

  it('is the sound itself without a variation, and at an amount of 0', () => {
    expect(varySound(sound)).toBe(sound)
    expect(varySound(sound, { seed: 5, amount: 0 })).toBe(sound)
    expect(varySound(sound, { seed: 5, amount: -1 })).toBe(sound)
    expect(varySound(sound, { seed: 5, amount: Number.NaN })).toBe(sound)
  })

  it('is the same for the same seed and amount, and another for another seed', () => {
    for (const each of FACTORY_SOUNDS) {
      expect(varySound(each, full(4))).toEqual(varySound(each, full(4)))
      expect(varySound(each, full(4)).phrase).not.toEqual(varySound(each, full(5)).phrase)
      expect(varySound(each, full(4)).phrase).not.toEqual(each.phrase)
    }
  })

  it('is nearer the sound at a smaller amount', () => {
    const phrase = played(8, [
      [0, 1, 60],
      [2, 1, 64],
      [4, 1, 67],
      [6, 1, 72],
    ])
    const moved = (amount: number): number => {
      const variant = varySound(phrase, { seed: 3, amount })
      return variant.phrase.notes.reduce(
        (sum, note, index) => sum + Math.abs(note.atSec - phrase.phrase.notes[index].atSec),
        0,
      )
    }
    expect(moved(0.25)).toBeGreaterThan(0)
    expect(moved(0.25)).toBeLessThan(moved(1))
  })

  it('keeps a struck chord together and never crosses two notes in time', () => {
    const phrase = played(8, [
      [0, 2, 48],
      [1, 1, 60],
      [1, 1, 64],
      [1.1, 1, 67],
      [3, 1, 72],
    ])
    for (const seed of SEEDS) {
      const notes = varySound(phrase, full(seed)).phrase.notes
      expect(notes[1].atSec).toBe(notes[2].atSec)
      expect(notes[0].atSec).toBe(0)
      expect(notes[2].atSec).toBeLessThan(notes[3].atSec)
      expect(notes[3].atSec).toBeLessThan(notes[4].atSec)
    }
  })

  it('leaves a sound tuned to whole cycles on its notes', () => {
    const held = { ...looped(8, 3, 2, [48, 55, 64]), tuning: 'whole-cycles' as const }
    for (const seed of SEEDS) {
      for (const note of varySound(held, full(seed)).phrase.notes) {
        expect(Number.isInteger(note.note)).toBe(true)
      }
    }
  })

  it('takes a held chord up later and holds it as much longer', () => {
    const held = looped(8, 3, 2, [48, 55, 64])
    const later = SEEDS.map((seed) => varySound(held, full(seed)))
    expect(later.some((variant) => (variant.skipSec ?? 0) > 3.5)).toBe(true)
    for (const variant of later) {
      const extra = (variant.skipSec ?? 0) - 3
      expect(extra).toBeGreaterThanOrEqual(0)
      expect(extra).toBeLessThanOrEqual(VARIATION_LIMITS.startSec)
      for (const note of variant.phrase.notes)
        expect(note.durSec).toBeCloseTo(8 + 3 + 2 + 1 + extra)
    }
  })

  it('changes the places of two notes of a phrase in every pass alike', () => {
    const round = cycled(8, [
      [0, 1, 48],
      [1, 1, 60],
      [2, 1, 64],
      [3, 1, 67],
      [4, 1, 72],
      [5, 1, 76],
      [6, 1, 79],
    ])
    const order = (notes: readonly PhraseNote[]): string =>
      notes
        .filter((note) => note.atSec < 8)
        .sort((a, b) => a.atSec - b.atSec)
        .map((note) => Math.round(note.note))
        .join(' ')
    const orders = new Set(
      Array.from({ length: 40 }, (_, seed) => order(varySound(round, full(seed)).phrase.notes)),
    )
    expect(orders.size).toBeGreaterThan(1)
    // The first note and the lowest stay where they are.
    for (const each of orders) expect(each.startsWith('48 ')).toBe(true)
  })

  it.each(FACTORY_SOUNDS.map((each) => [each.id, each] as const))(
    'of %s keeps what the sound is held to',
    (_id, each) => {
      for (const seed of SEEDS) {
        expect(problems(each, varySound(each, full(seed))), `seed ${seed}`).toEqual([])
        expect(problems(each, varySound(each, { seed, amount: 0.25 })), `seed ${seed}`).toEqual([])
      }
    },
  )

  it("of every pack's sounds keeps what the sound is held to", async () => {
    const sounds = await loadFactoryPackSounds()
    for (const each of sounds) {
      for (const seed of SEEDS.slice(0, 2)) {
        expect(problems(each, varySound(each, full(seed))), `${each.id} seed ${seed}`).toEqual([])
      }
    }
  })

  // One of each kind, a loop of each fold and a sound that ends: rendered as far from the sound as a variant goes.
  const rendered = ['drone', 'pad', 'texture', 'oneshot', 'melodic'].flatMap((kind) => {
    const ofKind = FACTORY_SOUNDS.filter((each) => each.kind === kind)
    return [ofKind[0], ofKind[Math.floor(ofKind.length / 2)]].filter(Boolean)
  })

  it.each(rendered.map((each) => [each.id, each] as const))(
    'of %s renders at the bank level, as long, and comes round or ends as the sound does',
    async (_id, each) => {
      const audio = await renderFactorySound(each, node)
      const variant = await renderFactorySound(each, { ...node, vary: full(2) })
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
})
